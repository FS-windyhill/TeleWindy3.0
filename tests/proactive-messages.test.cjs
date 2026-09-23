const test = require('node:test');
const assert = require('node:assert/strict');

global.CONFIG = {
    DEFAULT: {
        PROACTIVE_MESSAGES: {
            enabled: false,
            characterIds: [],
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
