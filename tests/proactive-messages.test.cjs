const test = require('node:test');
const assert = require('node:assert/strict');

global.CONFIG = {
    DEFAULT: {
        PROACTIVE_MESSAGES: {
            enabled: false,
            characterIds: [],
            executionMode: 'frontend',
            privateWorkerCredentialConsent: false,
            followFrontendApiKey: true,
            workerProbeCache: null,
            apiPresetName: '__character__',
            activeStart: '09:00',
            activeEnd: '23:00',
            minCooldownMinutes: 180,
            recentChatQuietMinutes: 45,
            dailyLimit: 3,
            unansweredLimit: 2,
            heartbeatHours: 12,
            catchupEnabled: true,
            catchupMaxHours: 24,
            lastLocalCheckAtByChar: {},
            nextLocalWakeAtByChar: {},
            localRuntimeByChar: {},
            workerStatusByChar: {}
        }
    }
};
global.STATE = { settings: {}, contacts: [] };

const ProactiveMessages = require('../js/proactive-messages.js');

test('主动消息四字段协议会校验补发时间窗口', () => {
    const start = new Date('2026-09-23T09:00:00+08:00').getTime();
    const end = new Date('2026-09-23T12:00:00+08:00').getTime();
    const result = ProactiveMessages.parseDecision(JSON.stringify({
        decision: 'send',
        content: '早上好',
        sent_at: '2026-09-23T10:15:00+08:00',
        next_wake_at: '2026-09-23T18:00:00+08:00'
    }), start, end);

    assert.equal(result.decision, 'send');
    assert.equal(result.content, '早上好');
    assert.equal(result.sentAt, new Date('2026-09-23T10:15:00+08:00').getTime());
});

test('发送正文为空时安全降级为沉默', () => {
    const start = Date.now() - 3600000;
    const result = ProactiveMessages.parseDecision('{"decision":"send","content":"","sent_at":null,"next_wake_at":null}', start, Date.now());
    assert.equal(result.decision, 'silent');
    assert.equal(result.content, '');
});

test('每个角色只保留最近 20 条主动消息事件', () => {
    for (let index = 0; index < 25; index += 1) {
        ProactiveMessages.addLocalEvent('char-1', `event_${index}`);
    }
    const events = ProactiveMessages.localRuntime('char-1').events;
    assert.equal(events.length, 20);
    assert.equal(events[0].code, 'event_5');
    assert.equal(events[19].code, 'event_24');
});

test('主动判断胶囊只携带最近 15 条文字聊天', () => {
    STATE.settings.API_URL = 'https://example.com/v1/chat/completions';
    STATE.settings.API_KEY = 'test-key';
    STATE.settings.MODEL = 'test-model';
    const contact = {
        id: 'char-limit',
        name: '测试角色',
        prompt: '测试设定',
        history: Array.from({ length: 20 }, (_, index) => ({
            messageId: `message_${index}`,
            role: index % 2 ? 'assistant' : 'user',
            content: `内容 ${index}`,
            eventAt: 1000 + index
        }))
    };

    const capsule = ProactiveMessages.buildCapsule(contact);
    assert.equal(capsule.messages.length, 15);
    assert.equal(capsule.messages[0].messageId, 'message_5');
    assert.equal(capsule.messages[14].messageId, 'message_19');
});

test('主动消息把 sent_at 写入正文，但聊天气泡隐藏该前缀', async () => {
    const eventAt = new Date(2026, 8, 4, 7, 0).getTime();
    const contact = { id: 'char-time', history: [] };
    const previousStorage = global.Storage;
    global.Storage = { saveContacts: async () => {} };
    try {
        const inserted = await ProactiveMessages.insertMessage(contact, {
            messageId: 'proactive_time_test',
            content: '早上好',
            sentAt: new Date(eventAt).toISOString(),
            source: 'proactive_worker'
        });
        assert.equal(inserted, true);
        assert.equal(contact.history[0].content, '[2026-09-04 07:00] 早上好');
        assert.equal(ProactiveMessages.displayContent(contact.history[0]), '早上好');
    } finally {
        global.Storage = previousStorage;
    }
});

test('主动消息可按稳定预设名称选择独立模型', () => {
    STATE.settings.PROACTIVE_MESSAGES.apiPresetName = '主动专用';
    STATE.settings.API_PRESETS = [{
        name: '主动专用',
        url: 'https://preset.example/v1/chat/completions',
        key: 'preset-key',
        model: 'preset-model',
        temperature: 0.6,
        max_tokens: 777,
        extra_body_json: '{"top_p":0.8}'
    }];
    const settings = ProactiveMessages.getRequestSettings({ linkedPresetName: '' });
    assert.equal(settings.API_URL, 'https://preset.example/v1/chat/completions');
    assert.equal(settings.API_KEY, 'preset-key');
    assert.equal(settings.MODEL, 'preset-model');
    assert.equal(settings.MAX_TOKENS, 777);
    const capsule = ProactiveMessages.buildCapsule({ id: 'char-preset', name: '测试角色', history: [] });
    assert.equal(capsule.maxTokens, 777);
    assert.deepEqual(capsule.requestBodyExtra, { top_p: 0.8 });
});

test('时间策略保留用户填写的小数且次数取整', () => {
    Object.assign(STATE.settings.PROACTIVE_MESSAGES, {
        minCooldownMinutes: 0.25,
        recentChatQuietMinutes: 0.5,
        heartbeatHours: 0.01,
        dailyLimit: 2.4,
        unansweredLimit: 1.6
    });
    const policy = ProactiveMessages.getPolicy();
    assert.equal(policy.minCooldownMinutes, 0.25);
    assert.equal(policy.recentChatQuietMinutes, 0.5);
    assert.equal(policy.heartbeatHours, 0.01);
    assert.equal(policy.dailyLimit, 2);
    assert.equal(policy.unansweredLimit, 2);
});

test('私人 Worker 胶囊跟随角色 API 并携带待加密 Key', () => {
    STATE.settings.PROACTIVE_MESSAGES.executionMode = 'private_worker';
    STATE.settings.PROACTIVE_MESSAGES.apiPresetName = '__character__';
    STATE.settings.API_PRESETS = [{
        name: '角色专用',
        url: 'https://role.example/v1/chat/completions',
        key: 'role-private-key',
        model: 'role-model'
    }];
    const capsule = ProactiveMessages.buildCapsule({
        id: 'char-worker',
        name: '测试角色',
        linkedPresetName: '角色专用',
        history: []
    });
    assert.equal(capsule.credentialMode, 'stored_client_key');
    assert.equal(capsule.apiUrl, 'https://role.example/v1/chat/completions');
    assert.equal(capsule.apiKey, 'role-private-key');
    assert.equal(capsule.model, 'role-model');
});

test('高级 Worker Secret 模式不会上传前端 API Key', () => {
    STATE.settings.PROACTIVE_MESSAGES.executionMode = 'server_secret';
    STATE.settings.API_URL = 'https://secret.example/v1/chat/completions';
    STATE.settings.API_KEY = 'should-not-upload';
    STATE.settings.MODEL = 'secret-model';
    STATE.settings.PROACTIVE_MESSAGES.apiPresetName = '__global__';
    const capsule = ProactiveMessages.buildCapsule({ id: 'char-secret', name: '测试角色', history: [] });
    assert.equal(capsule.credentialMode, 'server_secret');
    assert.equal(capsule.apiKey, '');
});

test('私人 Worker 未确认凭据时保持启用但不会误进后台模式', () => {
    STATE.settings.ASYNC_BACKEND_URL = 'https://worker.example';
    STATE.settings.ASYNC_BACKEND_TOKEN = 'worker-token';
    STATE.settings.PROACTIVE_MESSAGES.executionMode = 'private_worker';
    STATE.settings.PROACTIVE_MESSAGES.privateWorkerCredentialConsent = false;
    assert.equal(ProactiveMessages.workerConfigured(), false);
    STATE.settings.PROACTIVE_MESSAGES.privateWorkerCredentialConsent = true;
    assert.equal(ProactiveMessages.workerConfigured(), true);
});

test('Worker URL、访问密钥或模式变化后检测缓存签名会失效', () => {
    STATE.settings.ASYNC_BACKEND_URL = 'https://worker.example';
    STATE.settings.ASYNC_BACKEND_TOKEN = 'token-a';
    STATE.settings.PROACTIVE_MESSAGES.executionMode = 'server_secret';
    const first = ProactiveMessages.probeSignature([]);
    STATE.settings.ASYNC_BACKEND_TOKEN = 'token-b';
    const second = ProactiveMessages.probeSignature([]);
    STATE.settings.PROACTIVE_MESSAGES.executionMode = 'private_worker';
    const third = ProactiveMessages.probeSignature([]);
    assert.notEqual(first, second);
    assert.notEqual(second, third);
    assert.equal(first.includes('token-a'), false);
});

test('Worker 检测失败会明确保存为浏览器运行模式', async () => {
    const settings = STATE.settings.PROACTIVE_MESSAGES;
    settings.executionMode = 'private_worker';
    settings.followFrontendApiKey = false;
    const originalRememberWorkerProbe = ProactiveMessages.rememberWorkerProbe;
    let rememberedProbe = null;
    // ★ 这里只隔离持久化与 DOM 渲染，专门验证失败回退时保存的模式和提示信息。
    ProactiveMessages.rememberWorkerProbe = async probe => { rememberedProbe = probe; };
    try {
        await ProactiveMessages.fallbackToFrontendAfterFailedApply('后台访问密钥错误', 'unauthorized');
        assert.equal(ProactiveMessages.settings().executionMode, 'frontend');
        assert.equal(ProactiveMessages.settings().followFrontendApiKey, true);
        assert.equal(rememberedProbe.code, 'unauthorized');
        assert.match(rememberedProbe.message, /已自动改用浏览器运行/);
        assert.equal(rememberedProbe.signature, ProactiveMessages.probeSignature());
    } finally {
        ProactiveMessages.rememberWorkerProbe = originalRememberWorkerProbe;
    }
});
