// =========================================
// 主动消息：Worker Alarm + 纯前端离线补发
// =========================================
// 设计约束：
// 1. 定时器只提供思考机会，模型可以选择 silent；
// 2. sentAt 是聊天界面的角色时间，generatedAt 是真实生成时间，冷却永远使用后者；
// 3. Worker 和前端都用 messageId / heartbeatRunId 去重，避免 Alarm 重试或重复拉取产生两条消息；
// 4. 每个角色的调试事件只保留最近 20 条。

const ProactiveMessages = {
    installationKey: 'telewindy_proactive_installation_v1',
    // ★ Worker 与纯前端共用同一份精简窗口，防止两种模式切换后角色判断尺度突然变化。
    contextMessageLimit: 15,
    running: false,
    wakeTimer: null,

    defaults() {
        return JSON.parse(JSON.stringify(CONFIG.DEFAULT.PROACTIVE_MESSAGES));
    },

    settings() {
        const current = STATE.settings.PROACTIVE_MESSAGES;
        if (!current || typeof current !== 'object' || Array.isArray(current)) {
            STATE.settings.PROACTIVE_MESSAGES = this.defaults();
        } else {
            STATE.settings.PROACTIVE_MESSAGES = { ...this.defaults(), ...current };
        }
        const settings = STATE.settings.PROACTIVE_MESSAGES;
        ['characterIds'].forEach(key => { if (!Array.isArray(settings[key])) settings[key] = []; });
        ['lastLocalCheckAtByChar', 'nextLocalWakeAtByChar', 'localRuntimeByChar', 'workerStatusByChar'].forEach(key => {
            if (!settings[key] || typeof settings[key] !== 'object' || Array.isArray(settings[key])) settings[key] = {};
        });
        return settings;
    },

    installationId() {
        let value = localStorage.getItem(this.installationKey);
        if (!value) {
            value = window.crypto?.randomUUID?.() || `install_${Date.now()}_${Math.random().toString(36).slice(2)}`;
            localStorage.setItem(this.installationKey, value);
        }
        return value;
    },

    objectName(contactId) {
        return encodeURIComponent(`${this.installationId()}:${String(contactId)}`);
    },

    workerModeAvailable() {
        return !!(
            STATE.settings.ASYNC_BACKEND_URL
            && STATE.settings.ASYNC_BACKEND_TOKEN
            && STATE.settings.ASYNC_BACKEND_KEY_MODE === 'server_secret'
        );
    },

    workerBaseUrl(contactId) {
        return `${String(STATE.settings.ASYNC_BACKEND_URL || '').replace(/\/+$/, '')}/proactive/${this.objectName(contactId)}`;
    },

    workerHeaders() {
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${STATE.settings.ASYNC_BACKEND_TOKEN || ''}`
        };
    },

    makeId(prefix = 'msg') {
        return `${prefix}_${window.crypto?.randomUUID?.() || `${Date.now()}_${Math.random().toString(36).slice(2)}`}`;
    },

    parseChatTime(value) {
        if (typeof value === 'number' && Number.isFinite(value)) return value;
        const text = String(value || '').trim();
        if (!text) return 0;
        const normalized = /^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}$/.test(text) ? text.replace(' ', 'T') : text;
        const parsed = new Date(normalized).getTime();
        return Number.isFinite(parsed) ? parsed : 0;
    },

    formatChatTime(value) {
        const date = new Date(Number(value) || Date.now());
        const pad = number => String(number).padStart(2, '0');
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
    },

    ensureMessageIds() {
        let changed = false;
        (STATE.contacts || []).forEach(contact => {
            if (!Array.isArray(contact.history)) contact.history = [];
            contact.history.forEach((message, index) => {
                if (!message || typeof message !== 'object') return;
                if (!message.messageId) {
                    message.messageId = this.makeId(`legacy_${index}`);
                    changed = true;
                }
                if (!Number(message.eventAt)) {
                    message.eventAt = this.parseChatTime(message.timestamp || message.createdAt || message.updatedAt) || (Date.now() + index);
                    changed = true;
                }
                if (!Number(message.recordedAt)) {
                    message.recordedAt = Number(message.createdAt || message.eventAt || Date.now());
                    changed = true;
                }
            });
        });
        return changed;
    },

    getRequestSettings(contact) {
        const settings = {
            API_URL: STATE.settings.API_URL,
            API_KEY: STATE.settings.API_KEY,
            MODEL: STATE.settings.MODEL,
            MAX_TOKENS: 1200,
            TEMPERATURE: STATE.settings.TEMPERATURE ?? 1,
            CUSTOM_REQUEST_BODY_JSON: STATE.settings.CUSTOM_REQUEST_BODY_JSON || '',
            ASYNC_BACKEND_ENABLED: false
        };
        if (contact?.linkedPresetName) {
            const preset = (STATE.settings.API_PRESETS || []).find(item => item?.name === contact.linkedPresetName);
            if (preset) {
                settings.API_URL = preset.url || settings.API_URL;
                settings.API_KEY = preset.key || settings.API_KEY;
                settings.MODEL = preset.model || settings.MODEL;
                settings.TEMPERATURE = Number.isFinite(Number(preset.temperature)) ? Number(preset.temperature) : settings.TEMPERATURE;
                settings.CUSTOM_REQUEST_BODY_JSON = preset.extra_body_json || '';
            }
        }
        return settings;
    },

    getPolicy() {
        const settings = this.settings();
        const timeToMinutes = (value, fallback) => {
            const match = String(value || '').match(/^(\d{2}):(\d{2})$/);
            return match ? Number(match[1]) * 60 + Number(match[2]) : fallback;
        };
        return {
            activeStartMinutes: timeToMinutes(settings.activeStart, 9 * 60),
            activeEndMinutes: timeToMinutes(settings.activeEnd, 23 * 60),
            minCooldownMinutes: this.clamp(settings.minCooldownMinutes, 15, 10080, 180),
            recentChatQuietMinutes: this.clamp(settings.recentChatQuietMinutes, 0, 1440, 45),
            dailyLimit: this.clamp(settings.dailyLimit, 1, 20, 3),
            unansweredLimit: this.clamp(settings.unansweredLimit, 1, 10, 2),
            heartbeatHours: this.clamp(settings.heartbeatHours, 1, 168, 12)
        };
    },

    clamp(value, min, max, fallback) {
        const number = Number(value);
        return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback;
    },

    lastActivity(contact, role = null) {
        const messages = (contact?.history || []).filter(message => !role || message?.role === role);
        return messages.reduce((latest, message) => Math.max(latest, Number(message?.eventAt) || this.parseChatTime(message?.timestamp)), 0);
    },

    buildContextPrompt(contact) {
        const blocks = [];
        try {
            const memory = typeof CharacterMemory !== 'undefined' ? CharacterMemory.buildChatPrompt(contact.id, new Date()) : '';
            if (memory) blocks.push(memory);
        } catch (error) { console.warn('[主动消息] 读取角色记忆失败:', error); }
        try {
            const note = typeof AgentHeartNoteManager !== 'undefined' ? AgentHeartNoteManager.buildChatPrompt(contact.id, new Date()) : '';
            if (note) blocks.push(note);
        } catch (error) { console.warn('[主动消息] 读取心笺失败:', error); }
        try {
            const schedule = typeof CharacterSchedule !== 'undefined' ? CharacterSchedule.buildChatPrompt(contact.id, new Date()) : '';
            if (schedule) blocks.push(schedule);
        } catch (error) { console.warn('[主动消息] 读取角色日程失败:', error); }
        try {
            const worldSense = typeof WorldSense !== 'undefined' ? WorldSense.buildPromptFromSettings(STATE.settings, new Date()) : '';
            if (worldSense) blocks.push(worldSense);
        } catch (error) { console.warn('[主动消息] 读取世界感知失败:', error); }
        return blocks.join('\n\n').slice(0, 30000);
    },

    buildCapsule(contact) {
        const requestSettings = this.getRequestSettings(contact);
        const messages = (contact.history || []).slice(-this.contextMessageLimit).map(message => ({
            messageId: message.messageId,
            role: message.role === 'assistant' ? 'assistant' : 'user',
            content: String(message.content || '').replace(/^\[\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}\]\s*/, '').slice(0, 4000),
            eventAt: Number(message.eventAt) || this.parseChatTime(message.timestamp)
        }));
        return {
            enabled: this.settings().enabled === true && this.settings().characterIds.map(String).includes(String(contact.id)),
            characterId: String(contact.id),
            characterName: contact.name || '角色',
            characterPrompt: contact.prompt || '',
            contextPrompt: this.buildContextPrompt(contact),
            messages,
            apiUrl: requestSettings.API_URL || '',
            model: requestSettings.MODEL || '',
            temperature: requestSettings.TEMPERATURE,
            timezoneOffsetMinutes: new Date().getTimezoneOffset(),
            lastUserAt: this.lastActivity(contact, 'user'),
            lastChatAt: this.lastActivity(contact),
            nextWakeAt: Number(this.settings().nextLocalWakeAtByChar[String(contact.id)] || 0) || null,
            policy: this.getPolicy()
        };
    },

    async init() {
        this.settings();
        if (this.ensureMessageIds()) await Storage.saveContacts();
        this.bindUi();
        this.render();
        // ★ 先让原有 pending job 恢复一拍，再同步/补发，避免启动时两套异步恢复抢同一份历史。
        setTimeout(() => this.runStartup().catch(error => console.warn('[主动消息] 启动检查失败:', error)), 1800);
    },

    bindUi() {
        document.getElementById('explore-proactive-messages-btn')?.addEventListener('click', event => {
            if (event.target.closest('.proactive-menu-switch')) return;
            UI.switchView('proactive-messages');
        });
        document.getElementById('proactive-messages-back-btn')?.addEventListener('click', () => UI.switchView('explore'));
        document.getElementById('proactive-messages-enable-toggle')?.addEventListener('change', async event => {
            this.settings().enabled = event.target.checked === true;
            await Storage.saveSettings();
            this.render();
            await this.runStartup();
        });
        document.getElementById('proactive-save-btn')?.addEventListener('click', () => this.saveFromUi());
        document.getElementById('proactive-test-btn')?.addEventListener('click', () => this.testSelectedCharacter());
        document.getElementById('proactive-debug-character')?.addEventListener('change', () => this.renderDebug());
        window.addEventListener('pageshow', () => this.runStartup().catch(error => console.warn('[主动消息] pageshow 检查失败:', error)));
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) this.runStartup().catch(error => console.warn('[主动消息] 前台检查失败:', error));
        });
    },

    render() {
        const settings = this.settings();
        const setValue = (id, value) => { const element = document.getElementById(id); if (element) element.value = value; };
        const master = document.getElementById('proactive-messages-enable-toggle');
        if (master) master.checked = settings.enabled === true;
        setValue('proactive-active-start', settings.activeStart);
        setValue('proactive-active-end', settings.activeEnd);
        setValue('proactive-min-cooldown', settings.minCooldownMinutes);
        setValue('proactive-chat-quiet', settings.recentChatQuietMinutes);
        setValue('proactive-daily-limit', settings.dailyLimit);
        setValue('proactive-unanswered-limit', settings.unansweredLimit);
        setValue('proactive-heartbeat-hours', settings.heartbeatHours);
        setValue('proactive-catchup-hours', settings.catchupMaxHours);
        const catchup = document.getElementById('proactive-catchup-enabled');
        if (catchup) catchup.checked = settings.catchupEnabled !== false;
        const badge = document.getElementById('proactive-mode-badge');
        const help = document.getElementById('proactive-mode-help');
        const worker = this.workerModeAvailable();
        if (badge) badge.textContent = worker ? 'Worker 后台' : '纯前端';
        if (help) help.textContent = worker
            ? '角色会由 Durable Object Alarm 在后台唤醒；PWA 打开后取回待领取消息。'
            : '没有配置 Worker 内置 Key，会在下次打开 PWA 后补上离线期间可能发出的消息。';
        this.renderCharacters();
        this.renderDebugSelector();
        this.renderDebug();
    },

    renderCharacters() {
        const container = document.getElementById('proactive-character-list');
        if (!container) return;
        container.textContent = '';
        const selected = new Set(this.settings().characterIds.map(String));
        (STATE.contacts || []).forEach(contact => {
            const row = document.createElement('label');
            row.className = 'proactive-character-item';
            const avatar = document.createElement(contact.avatar?.startsWith?.('data:') || contact.avatar?.startsWith?.('http') ? 'img' : 'span');
            avatar.className = 'proactive-character-avatar';
            if (avatar.tagName === 'IMG') avatar.src = contact.avatar;
            else avatar.textContent = contact.avatar || '💬';
            const name = document.createElement('span');
            name.className = 'proactive-character-name';
            name.textContent = contact.name || '未命名角色';
            const input = document.createElement('input');
            input.type = 'checkbox';
            input.dataset.proactiveCharacterId = String(contact.id);
            input.checked = selected.has(String(contact.id));
            row.append(avatar, name, input);
            container.appendChild(row);
        });
    },

    renderDebugSelector() {
        const select = document.getElementById('proactive-debug-character');
        if (!select) return;
        const previous = select.value;
        select.textContent = '';
        (STATE.contacts || []).forEach(contact => {
            const option = document.createElement('option');
            option.value = String(contact.id);
            option.textContent = contact.name || '未命名角色';
            select.appendChild(option);
        });
        if ([...select.options].some(option => option.value === previous)) select.value = previous;
    },

    renderDebug() {
        const select = document.getElementById('proactive-debug-character');
        const summary = document.getElementById('proactive-status-summary');
        const list = document.getElementById('proactive-event-list');
        if (!select || !summary || !list) return;
        const id = String(select.value || '');
        const status = this.workerModeAvailable()
            ? this.settings().workerStatusByChar[id]
            : this.settings().localRuntimeByChar[id];
        const runtime = status?.runtime || status || {};
        const next = Number(runtime.nextWakeAt || this.settings().nextLocalWakeAtByChar[id] || 0);
        summary.textContent = `下次唤醒：${next ? new Date(next).toLocaleString() : '尚未安排'}　上次决策：${runtime.lastDecision || '无'}　未回复：${runtime.unansweredCount || 0}　今日发送：${runtime.dailyCount || 0}`;
        list.textContent = '';
        const events = Array.isArray(status?.events) ? status.events.slice(-20).reverse() : [];
        if (!events.length) {
            const empty = document.createElement('div');
            empty.className = 'todo-empty-hint';
            empty.textContent = '暂无运行事件';
            list.appendChild(empty);
            return;
        }
        events.forEach(event => {
            const row = document.createElement('div');
            row.className = 'proactive-event-item';
            const time = document.createElement('time');
            time.textContent = new Date(Number(event.ts || 0)).toLocaleTimeString();
            const text = document.createElement('span');
            text.textContent = `${event.code}${event.reason ? ` · ${event.reason}` : ''}${event.error ? ` · ${event.error}` : ''}`;
            row.append(time, text);
            list.appendChild(row);
        });
    },

    async saveFromUi() {
        const settings = this.settings();
        const value = id => document.getElementById(id)?.value;
        settings.activeStart = value('proactive-active-start') || '09:00';
        settings.activeEnd = value('proactive-active-end') || '23:00';
        settings.minCooldownMinutes = this.clamp(value('proactive-min-cooldown'), 15, 10080, 180);
        settings.recentChatQuietMinutes = this.clamp(value('proactive-chat-quiet'), 0, 1440, 45);
        settings.dailyLimit = this.clamp(value('proactive-daily-limit'), 1, 20, 3);
        settings.unansweredLimit = this.clamp(value('proactive-unanswered-limit'), 1, 10, 2);
        settings.heartbeatHours = this.clamp(value('proactive-heartbeat-hours'), 1, 168, 12);
        settings.catchupMaxHours = this.clamp(value('proactive-catchup-hours'), 1, 168, 24);
        settings.catchupEnabled = document.getElementById('proactive-catchup-enabled')?.checked !== false;
        settings.characterIds = [...document.querySelectorAll('[data-proactive-character-id]:checked')].map(input => String(input.dataset.proactiveCharacterId));
        await Storage.saveSettings();
        await this.runStartup();
        this.render();
        if (typeof App !== 'undefined' && typeof App.showTopNotice === 'function') App.showTopNotice('主动消息设置已保存');
    },

    async runStartup() {
        if (this.running) return;
        const settings = this.settings();
        if (!settings.enabled) return;
        this.running = true;
        try {
            const contacts = (STATE.contacts || []).filter(contact => settings.characterIds.map(String).includes(String(contact.id)));
            for (const contact of contacts) {
                if (this.workerModeAvailable()) {
                    await this.pullWorkerMessages(contact);
                    await this.syncWorker(contact);
                } else if (settings.catchupEnabled !== false) {
                    await this.runLocalCatchup(contact, false);
                }
            }
            await Storage.saveSettings();
            this.render();
            this.scheduleNextLocalCheck();
        } finally {
            this.running = false;
        }
    },

    scheduleNextLocalCheck() {
        if (this.wakeTimer) clearTimeout(this.wakeTimer);
        this.wakeTimer = null;
        if (this.workerModeAvailable() || !this.settings().enabled) return;
        const selected = new Set(this.settings().characterIds.map(String));
        const times = Object.entries(this.settings().nextLocalWakeAtByChar)
            .filter(([id, value]) => selected.has(String(id)) && Number(value) > 0)
            .map(([, value]) => Number(value));
        if (!times.length) return;
        const delay = Math.min(2147483647, Math.max(1000, Math.min(...times) - Date.now()));
        this.wakeTimer = setTimeout(() => this.runStartup().catch(error => console.warn('[主动消息] 定时检查失败:', error)), delay);
    },

    async syncWorker(contact) {
        const response = await fetch(`${this.workerBaseUrl(contact.id)}/sync`, {
            method: 'PUT', headers: this.workerHeaders(), body: JSON.stringify(this.buildCapsule(contact))
        });
        if (!response.ok) throw new Error(`主动消息同步失败：HTTP ${response.status}`);
        this.settings().workerStatusByChar[String(contact.id)] = await response.json();
    },

    async pullWorkerMessages(contact) {
        const response = await fetch(`${this.workerBaseUrl(contact.id)}/messages`, { headers: this.workerHeaders() });
        if (!response.ok) {
            if (response.status === 404) return;
            throw new Error(`主动消息拉取失败：HTTP ${response.status}`);
        }
        const data = await response.json();
        const applied = [];
        for (const message of data.messages || []) {
            if (await this.insertMessage(contact, message)) applied.push(message.messageId);
        }
        if (applied.length) {
            await fetch(`${this.workerBaseUrl(contact.id)}/ack`, {
                method: 'POST', headers: this.workerHeaders(), body: JSON.stringify({ messageIds: applied })
            });
        }
    },

    localRuntime(contactId) {
        const key = String(contactId);
        const settings = this.settings();
        const runtime = settings.localRuntimeByChar[key] || {};
        if (!Array.isArray(runtime.events)) runtime.events = [];
        settings.localRuntimeByChar[key] = runtime;
        return runtime;
    },

    addLocalEvent(contactId, code, detail = {}) {
        const runtime = this.localRuntime(contactId);
        runtime.events.push({ code, ts: Date.now(), ...detail });
        runtime.events = runtime.events.slice(-20);
    },

    localPrefilter(contact, now) {
        const policy = this.getPolicy();
        const runtime = this.localRuntime(contact.id);
        const today = new Date(now).toLocaleDateString('sv-SE');
        if (runtime.dailyDateKey !== today) { runtime.dailyDateKey = today; runtime.dailyCount = 0; }
        const minutes = new Date(now).getHours() * 60 + new Date(now).getMinutes();
        const inWindow = policy.activeStartMinutes === policy.activeEndMinutes
            || (policy.activeStartMinutes < policy.activeEndMinutes
                ? minutes >= policy.activeStartMinutes && minutes < policy.activeEndMinutes
                : minutes >= policy.activeStartMinutes || minutes < policy.activeEndMinutes);
        if (!inWindow) return 'quiet_hours';
        if (Number(runtime.dailyCount || 0) >= policy.dailyLimit) return 'daily_limit';
        if (Number(runtime.unansweredCount || 0) >= policy.unansweredLimit) return 'unanswered_limit';
        if (now - this.lastActivity(contact) < policy.recentChatQuietMinutes * 60000) return 'recent_chat';
        const cooldown = policy.minCooldownMinutes * 60000 * Math.pow(2, Number(runtime.unansweredCount || 0));
        if (now - Number(runtime.lastProactiveGeneratedAt || 0) < cooldown) return 'cooldown';
        return '';
    },

    buildLocalMessages(contact, windowStart, windowEnd) {
        const capsule = this.buildCapsule(contact);
        const history = capsule.messages.map(message => `[${new Date(message.eventAt || windowStart).toISOString()}] ${message.role === 'assistant' ? capsule.characterName : '对方'}：${message.content}`).join('\n');
        return [
            { role: 'system', content: `${capsule.characterPrompt}\n\n${capsule.contextPrompt}`.trim() },
            { role: 'system', content: [
                `你就是 ${capsule.characterName}。PWA 刚刚重新打开，现在补做离线期间本应发生的一次主动判断。`,
                '没有自然理由就选择 silent。不要解释，不要提到补发、系统、PWA、JSON 或 AI。',
                `允许的消息展示时间：${new Date(windowStart).toISOString()} 至 ${new Date(windowEnd).toISOString()}。sent_at 必须在这个范围内。`,
                '只输出严格 JSON：{"decision":"silent或send","content":"send时的正文，silent时为空","sent_at":"send时的ISO时间，silent时为null","next_wake_at":"未来ISO时间或null"}',
                `【最近聊天快照】\n${history || '暂无聊天记录'}`
            ].join('\n\n') },
            { role: 'user', content: '现在自行决定是否主动联系，并安排下一次唤醒。只输出 JSON。' }
        ];
    },

    parseDecision(rawText, windowStart, windowEnd) {
        const clean = String(rawText || '').replace(/<(?:think|thinking|thought)[^>]*>[\s\S]*?(?:<\/(?:think|thinking|thought)>|$)/gi, '').replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
        let data = null;
        try { data = JSON.parse(clean); } catch (error) {
            const start = clean.indexOf('{'); const end = clean.lastIndexOf('}');
            if (start >= 0 && end > start) { try { data = JSON.parse(clean.slice(start, end + 1)); } catch (nested) {} }
        }
        const decision = data?.decision === 'send' && String(data?.content || '').trim() ? 'send' : 'silent';
        const parsedSentAt = new Date(data?.sent_at || '').getTime();
        const sentAt = Number.isFinite(parsedSentAt) && parsedSentAt >= windowStart && parsedSentAt <= windowEnd ? parsedSentAt : windowStart;
        const parsedNext = new Date(data?.next_wake_at || '').getTime();
        return { decision, content: decision === 'send' ? String(data.content).trim().slice(0, 4000) : '', sentAt, nextWakeAt: Number.isFinite(parsedNext) ? parsedNext : null };
    },

    async runLocalCatchup(contact, force = false) {
        const now = Date.now();
        const settings = this.settings();
        const key = String(contact.id);
        const existingNext = Number(settings.nextLocalWakeAtByChar[key] || 0);
        if (!force && !existingNext) {
            settings.nextLocalWakeAtByChar[key] = now + 30 * 60 * 1000;
            settings.lastLocalCheckAtByChar[key] = now;
            this.addLocalEvent(key, 'proactive_initial_wake_set', { nextWakeAt: settings.nextLocalWakeAtByChar[key] });
            return;
        }
        if (!force && existingNext > now) return;
        const blocked = this.localPrefilter(contact, now);
        if (blocked && !force) {
            settings.nextLocalWakeAtByChar[key] = now + this.getPolicy().heartbeatHours * 3600000;
            this.addLocalEvent(key, 'proactive_prefilter_skipped', { reason: blocked });
            return;
        }
        const lastCheck = Number(settings.lastLocalCheckAtByChar[key] || existingNext || now);
        const windowStart = Math.max(lastCheck, now - this.clamp(settings.catchupMaxHours, 1, 168, 24) * 3600000);
        const windowEnd = now;
        const heartbeatRunId = this.makeId('proactive_local');
        settings.lastLocalCheckAtByChar[key] = now;
        this.addLocalEvent(key, 'proactive_model_request_started', { heartbeatRunId });
        try {
            // ★ buildLocalMessages 在 fetch 前完成，用户随后快速发出的新消息不会倒灌进这次离线补发判断。
            const frozenMessages = this.buildLocalMessages(contact, windowStart, windowEnd);
            const raw = await API.chat(frozenMessages, this.getRequestSettings(contact));
            const result = this.parseDecision(raw, windowStart, windowEnd);
            const runtime = this.localRuntime(key);
            runtime.lastDecision = result.decision;
            runtime.lastHeartbeatAt = now;
            if (result.decision === 'send') {
                await this.insertMessage(contact, {
                    messageId: `proactive_${heartbeatRunId}`,
                    heartbeatRunId,
                    content: result.content,
                    sentAt: new Date(result.sentAt).toISOString(),
                    generatedAt: Date.now(),
                    source: 'proactive_catchup'
                });
                runtime.lastProactiveGeneratedAt = Date.now();
                runtime.unansweredCount = Number(runtime.unansweredCount || 0) + 1;
                runtime.dailyCount = Number(runtime.dailyCount || 0) + 1;
                this.addLocalEvent(key, 'proactive_decision_send', { heartbeatRunId, sentAt: result.sentAt });
            } else {
                this.addLocalEvent(key, 'proactive_decision_silent', { heartbeatRunId });
            }
            const minWake = now + 15 * 60000;
            const maxWake = now + this.getPolicy().heartbeatHours * 3600000;
            settings.nextLocalWakeAtByChar[key] = result.nextWakeAt && result.nextWakeAt >= minWake ? Math.min(result.nextWakeAt, maxWake) : maxWake;
            runtime.nextWakeAt = settings.nextLocalWakeAtByChar[key];
            this.addLocalEvent(key, 'proactive_next_alarm_set', { nextWakeAt: runtime.nextWakeAt });
        } catch (error) {
            settings.nextLocalWakeAtByChar[key] = now + this.getPolicy().heartbeatHours * 3600000;
            this.addLocalEvent(key, 'proactive_run_failed', { error: String(error?.message || error).slice(0, 180) });
        }
    },

    async insertMessage(contact, source) {
        if (!contact || !source?.messageId || !String(source.content || '').trim()) return false;
        if ((contact.history || []).some(message => String(message?.messageId) === String(source.messageId))) return false;
        const sentAt = new Date(source.sentAt || '').getTime();
        const eventAt = Number.isFinite(sentAt) ? sentAt : Date.now();
        const message = {
            role: 'assistant',
            content: String(source.content).trim(),
            timestamp: this.formatChatTime(eventAt),
            messageId: String(source.messageId),
            eventAt,
            recordedAt: Date.now(),
            generatedAt: Number(source.generatedAt || Date.now()),
            heartbeatRunId: source.heartbeatRunId || '',
            proactiveSource: source.source || 'proactive'
        };
        const history = contact.history || (contact.history = []);
        let index = history.findIndex(item => (Number(item?.eventAt) || this.parseChatTime(item?.timestamp)) > eventAt);
        if (index < 0) index = history.length;
        history.splice(index, 0, message);
        await Storage.saveContacts();
        if (STATE.currentContactId === contact.id && typeof UI !== 'undefined') UI.renderChatHistory(contact);
        if (typeof App !== 'undefined' && typeof App.markContactIncomingMessage === 'function') {
            App.markContactIncomingMessage(contact);
        }
        return true;
    },

    async testSelectedCharacter() {
        const contactId = document.getElementById('proactive-debug-character')?.value;
        const contact = (STATE.contacts || []).find(item => String(item.id) === String(contactId));
        if (!contact) return;
        const button = document.getElementById('proactive-test-btn');
        if (button) button.disabled = true;
        try {
            if (this.workerModeAvailable()) {
                await this.syncWorker(contact);
                const response = await fetch(`${this.workerBaseUrl(contact.id)}/run`, { method: 'POST', headers: this.workerHeaders() });
                if (!response.ok) throw new Error(`测试失败：HTTP ${response.status}`);
                await this.pullWorkerMessages(contact);
                await this.syncWorker(contact);
            } else {
                await this.runLocalCatchup(contact, true);
                await Storage.saveSettings();
            }
            this.render();
        } catch (error) {
            alert(error?.message || String(error));
        } finally {
            if (button) button.disabled = false;
        }
    },

    async onUserMessage(contact) {
        if (!contact || !this.settings().enabled) return;
        const runtime = this.localRuntime(contact.id);
        runtime.unansweredCount = 0;
        if (this.workerModeAvailable()) {
            this.syncWorker(contact).catch(error => console.warn('[主动消息] 用户消息后同步失败:', error));
        }
        await Storage.saveSettings();
    }
};

if (typeof module !== 'undefined' && module.exports) module.exports = ProactiveMessages;
