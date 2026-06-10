// =========================================
// AGENT TODO MANAGER (探索 Agent / TODO 管理)
// 只负责 TODO 管理的提示词、JSON 解析和 TODO 匹配校验。
// 真正的页面渲染、API 调用和写入 IndexedDB 仍然留在 App 里。
//
// 函数目录：
//   - getTodayKey(now): 获取今天日期 key
//   - buildTodoSnapshot(now): 给 worker model 的精简 TODO 列表
//   - buildExecutorMessages(contact, userText, now): 生成 TODO 管理执行请求 messages
//   - buildPostSuggestionMessages(contact, assistantText, now): 生成回复后 TODO 建议请求 messages
//   - extractJson(rawText): 从 worker model 返回里抽出 JSON
//   - parseRouterResult(rawText): 解析并规范化 intent
//   - parsePostSuggestionResult(rawText): 解析回复后 TODO 建议
//   - findTodoCandidates(routerResult): 按 worker 给出的线索匹配 TODO
//   - formatTodoLabel(item): 生成弹窗/摘要里可读的 TODO 名称
// =========================================

// ★★★★★ Agent TODO Manager START：独立工具层 ★★★★★
const AgentTodoManager = {
    allowedIntents: ['NONE', 'CREATE_TODO', 'UPDATE_TODO', 'ASK_CONFIRMATION'],
    allowedPostIntents: ['NONE', 'SUGGEST_TODO_CREATE'],

    pad(num) {
        return String(num).padStart(2, '0');
    },

    getTodayKey(now = new Date()) {
        if (typeof TodoContext !== 'undefined' && TodoContext.getTodayKey) {
            return TodoContext.getTodayKey(now);
        }
        return `${now.getFullYear()}-${this.pad(now.getMonth() + 1)}-${this.pad(now.getDate())}`;
    },

    addDays(dateKey, days) {
        if (typeof TodoContext !== 'undefined' && TodoContext.fromDateKey && TodoContext.toDateKey) {
            const date = TodoContext.fromDateKey(dateKey);
            date.setDate(date.getDate() + days);
            return TodoContext.toDateKey(date);
        }
        const [year, month, day] = String(dateKey || '').split('-').map(Number);
        const date = new Date(year || 1970, (month || 1) - 1, day || 1);
        date.setDate(date.getDate() + days);
        return `${date.getFullYear()}-${this.pad(date.getMonth() + 1)}-${this.pad(date.getDate())}`;
    },

    isDateKey(value) {
        return /^\d{4}-\d{2}-\d{2}$/.test(String(value || ''));
    },

    isTimeValue(value) {
        return /^([01]\d|2[0-3]):[0-5]\d$/.test(String(value || ''));
    },

    cleanText(value, maxLength = 120) {
        return String(value || '').replace(/\s+/g, ' ').trim().slice(0, maxLength);
    },

    buildTodoSnapshot(now = new Date()) {
        const todayKey = this.getTodayKey(now);
        return (STATE.todoPlans || [])
            .filter(item => item && item.text)
            .sort((a, b) => {
                if (a.done !== b.done) return a.done ? 1 : -1;
                if (a.dateKey !== b.dateKey) return String(a.dateKey).localeCompare(String(b.dateKey));
                return (a.createdAt || 0) - (b.createdAt || 0);
            })
            .slice(0, 80)
            .map(item => ({
                id: item.id,
                text: this.cleanText(item.text, 80),
                dateKey: item.dateKey || todayKey,
                done: item.done === true,
                startTime: item.startTime || '',
                endTime: item.endTime || ''
            }));
    },

    buildExecutorMessages(contact, userText, now = new Date()) {
        const todayKey = this.getTodayKey(now);
        const tomorrowKey = this.addDays(todayKey, 1);
        const systemPrompt = [
            '你是一个 TODO 管理 Agent，负责把用户这句话解析成 TODO 操作包。',
            '你只能从 intent 枚举中选择：NONE、CREATE_TODO、UPDATE_TODO、ASK_CONFIRMATION。',
            '不要输出 Markdown，不要解释，只输出 JSON。',
            '',
            '规则：',
            '- 普通聊天，选 NONE。',
            '- 用户要求安排任务，或者做记录、提醒时，选 CREATE_TODO。',
            '- 用户表示某个事项/计划完成、延期、修改、取消、不需要、删除时，选 UPDATE_TODO。',
            '- 用户说删除、取消、不需要某个事项/计划时，输出 UPDATE_TODO 且 status=cancelled。',
            '- 找不到唯一目标、信息不足或高风险覆盖操作，选 ASK_CONFIRMATION。',
            '- 不确定日期时，就放在今天。',
            '- 不要编造用户没有说的日期、任务或目标。',
            '',
            'JSON 格式：',
            '{"intent":"CREATE_TODO","todos":[{"text":"继续写论文","dateKey":"2026-06-10","startTime":"","endTime":""}],"todo":{"text":"","dateKey":"","startTime":"","endTime":""},"update":{"matchText":"","dateKey":"","newText":"","newDateKey":"","status":"","startTime":"","endTime":""},"confirmation":{"message":""}}',
            '',
            '字段说明：',
            '- CREATE_TODO 时优先填写 todos 数组；只有一条时也可以填写 todo.text 和 todo.dateKey。',
            '- 用户一次说了多件要记录的事，就拆成多个 todos，不要合并成一条。',
            '- UPDATE_TODO 时填写 update.matchText；完成用 status=done，取消/删除/不需要用 status=cancelled，延期/改日期用 newDateKey，改内容用 newText。',
            '- ASK_CONFIRMATION 时 confirmation.message 写给前端确认/提示用的一句话。',
            '- 不需要的对象字段留空字符串。'
        ].join('\n');

        // ★ 缓存友好：固定规则放 system，日期/TODO 快照/用户原话放 user，尽量提高前缀缓存命中。
        const userPrompt = [
            `今天日期：${todayKey}`,
            `明天日期：${tomorrowKey}`,
            '',
            '【当前角色】',
            contact?.name || '未命名角色',
            '',
            '【现有 TODO】',
            JSON.stringify(this.buildTodoSnapshot(now), null, 2),
            '',
            '【用户当前消息】',
            userText || ''
        ].join('\n');

        return [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
        ];
    },

    buildRouterMessages(contact, userText, now = new Date()) {
        // ★ 兼容旧调用名：现在真正的“总路由”在 AgentSkillRouter。
        // TODO Manager 这里只保留专用执行 prompt，避免以后 Agent 多了之后继续膨胀。
        return this.buildExecutorMessages(contact, userText, now);
    },

    buildPostSuggestionMessages(contact, assistantText, now = new Date()) {
        const todayKey = this.getTodayKey(now);
        const tomorrowKey = this.addDays(todayKey, 1);
        const systemPrompt = [
            '你是一个 TODO 管理 Agent，只从刚刚的回复里提取“可让用户确认添加”的 TODO 建议。',
            '你不能执行 TODO，不能修改/完成/取消/删除 TODO，只能建议新增 TODO。',
            '不要输出 Markdown，不要解释，只输出 JSON。',
            '',
            'intent 只能选择：NONE、SUGGEST_TODO_CREATE。',
            '',
            '规则：',
            '- 回复里建议了一个可执行事项，输出 SUGGEST_TODO_CREATE。',
            '- 闲聊、泛泛建议、角色语气承诺，选 NONE。',
            '- 不确定日期时，就放在今天。',
            '- 不要编造回复里没有的任务、日期或时间。',
            '- 多个事项拆成多个 todos，不要合并。',
            '- 最多返回 5 项 TODO。',
            '',
            'JSON 格式：',
            '{"intent":"SUGGEST_TODO_CREATE","todos":[{"text":"导出发票","dateKey":"2026-06-10","startTime":"21:00","endTime":""}],"confirmation":{"message":""}}',
            '',
            '字段说明：',
            '- NONE 时 todos 为空数组。',
            '- text 写简短任务名，不要写“建议你”。',
            '- dateKey 必须是 YYYY-MM-DD。',
            '- 没有明确时间就留空 startTime/endTime。'
        ].join('\n');

        // ★★★★★ Post Agent：TODO 建议 prompt START ★★★★★
        // 为了省 token，post-agent 只看角色回复；用户原话和 TODO 快照都不放进来。
        const userPrompt = [
            `今天日期：${todayKey}`,
            `明天日期：${tomorrowKey}`,
            '',
            '【当前角色】',
            contact?.name || '未命名角色',
            '',
            '【角色刚刚回复】',
            assistantText || ''
        ].join('\n');
        // ★★★★★ Post Agent：TODO 建议 prompt END ★★★★★

        return [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
        ];
    },

    extractJson(rawText) {
        const text = String(rawText || '').trim();
        if (!text) throw new Error('TODO 管理返回为空');

        try {
            return JSON.parse(text);
        } catch (error) {
            // ★ worker model 偶尔会包一层 ```json，这里只做容错抽取，不接受自然语言正文。
            const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
            if (fenced) return JSON.parse(fenced[1].trim());

            const start = text.indexOf('{');
            const end = text.lastIndexOf('}');
            if (start >= 0 && end > start) return JSON.parse(text.slice(start, end + 1));
            throw error;
        }
    },

    parseRouterResult(rawText) {
        const data = this.extractJson(rawText);
        const intent = String(data.intent || '').trim().toUpperCase();
        if (!this.allowedIntents.includes(intent)) {
            throw new Error(`未知 intent：${intent || '空'}`);
        }

        return {
            intent,
            todo: data.todo && typeof data.todo === 'object' ? data.todo : {},
            todos: Array.isArray(data.todos) ? data.todos.filter(item => item && typeof item === 'object') : [],
            update: data.update && typeof data.update === 'object' ? data.update : {},
            confirmation: data.confirmation && typeof data.confirmation === 'object' ? data.confirmation : {}
        };
    },

    parsePostSuggestionResult(rawText) {
        const data = this.extractJson(rawText);
        const intent = String(data.intent || '').trim().toUpperCase();
        if (!this.allowedPostIntents.includes(intent)) {
            throw new Error(`未知 post-agent intent：${intent || '空'}`);
        }

        return {
            intent,
            todos: Array.isArray(data.todos) ? data.todos.filter(item => item && typeof item === 'object') : [],
            confirmation: data.confirmation && typeof data.confirmation === 'object' ? data.confirmation : {}
        };
    },

    findTodoCandidates(routerResult) {
        const update = routerResult?.update || {};
        const matchId = this.cleanText(update.id || update.todoId || '', 80);
        const matchText = this.cleanText(update.matchText || update.text || update.oldText || '', 80).toLowerCase();
        const dateKey = this.isDateKey(update.dateKey) ? update.dateKey : '';

        let items = (STATE.todoPlans || []).filter(item => item && item.text && item.cancelled !== true);
        if (matchId) items = items.filter(item => item.id === matchId);
        if (dateKey) items = items.filter(item => item.dateKey === dateKey);
        if (matchText) {
            items = items.filter(item => String(item.text || '').toLowerCase().includes(matchText));
        }

        // ★ 没给任何线索时不猜，交回确认流程。
        if (!matchId && !matchText && !dateKey) return [];
        return items;
    },

    formatTodoLabel(item) {
        if (!item) return '未知 TODO';
        const dateText = item.dateKey || this.getTodayKey();
        const timeText = item.startTime && item.endTime ? ` ${item.startTime}-${item.endTime}` : '';
        return `${dateText}${timeText}：${item.text}`;
    }
};
// ★★★★★ Agent TODO Manager END：独立工具层 ★★★★★

