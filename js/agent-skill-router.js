// =========================================
// AGENT SKILL ROUTER（探索 Agent / 通用路由）
// 这里只判断“本轮要不要调用某个 Agent”，不解析具体 TODO 字段。
// 具体能力的详细规则继续放在各自 Agent 里，避免每句话都背完整技能说明。
//
// 函数目录：
//   - buildRouterMessages(contact, userText): 生成通用 Agent 路由 messages
//   - extractJson(rawText): 从 worker model 返回里抽出 JSON
//   - parseRouterResult(rawText): 解析并规范化路由结果
// =========================================

// ★★★★★ Agent Skill Router START：通用 Agent 选择层 ★★★★★
const AgentSkillRouter = {
    allowedIntents: ['NONE', 'USE_AGENT', 'ASK_CONFIRMATION'],
    allowedAgents: ['todo_manager'],
    allowedPostAgents: ['todo_manager_post'],

    buildRouterMessages(contact, userText) {
        const systemPrompt = [
            '你是一个 Agent 总路由，只判断用户这句话是否需要调用某个 Agent。',
            '不要输出 Markdown，不要解释，只输出 JSON。',
            '',
            'intent 只能选择：NONE、USE_AGENT、ASK_CONFIRMATION。',
            '',
            '可用 Agent：',
            '- todo_manager：用户要求记录、提醒、安排 TODO/计划；或明确表示某个 TODO/计划 完成、延期、修改、取消、删除。',
            '',
            '规则：',
            '- 普通聊天，选 NONE。',
            '- 判断用户意图，当上述Agent可以匹配用户意图时，选 USE_AGENT。',
            '- 如果看起来需要 Agent，但无法判断应该调用哪个 Agent，选 ASK_CONFIRMATION。',
            '',
            'JSON 格式：',
            '{"intent":"USE_AGENT","agent":"todo_manager","confirmation":{"message":""}}',
            '',
            '字段说明：',
            '- NONE 时 agent 留空字符串。',
            '- USE_AGENT 时 agent 必须是可用 Agent 之一。',
            '- ASK_CONFIRMATION 时 confirmation.message 写给前端提示用的一句话。'
        ].join('\n');

        // ★ 缓存友好：固定路由表放 system，本轮角色和用户原话放 user。
        // 这里不放 TODO 详细规则和 TODO 快照，命中后再交给专用 Agent。
        const userPrompt = [
            '【当前角色】',
            contact?.name || '未命名角色',
            '',
            '【用户当前消息】',
            userText || ''
        ].join('\n');

        return [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
        ];
    },

    buildPostRouterMessages(contact, assistantText) {
        const systemPrompt = [
            '你是一个 Agent 总路由，判断刚刚的回复是否需要调用某个 Agent。',
            '不要输出 Markdown，不要解释，只输出 JSON。',
            '',
            'intent 只能选择：NONE、USE_AGENT。',
            '',
            '可用 Agent：',
            '- todo_manager_post：角色回复里建议用户添加待办、提醒、安排任务。',
            '',
            '规则：',
            '- 普通聊天，选 NONE。',
            '- 判断回复意图，当上述Agent可以匹配回复意图时，选 USE_AGENT。',
            '',
            'JSON 格式：',
            '{"intent":"USE_AGENT","agent":"todo_manager_post","confirmation":{"message":""}}',
            '',
            '字段说明：',
            '- NONE 时 agent 留空字符串。',
            '- USE_AGENT 时 agent 必须是可用 Post Agent 之一。'
        ].join('\n');

        // ★★★★★ Post Agent Router START：回复后 Agent 选择层 ★★★★★
        // 为了省 token，这里只放角色名和刚刚生成的回复，不携带用户原话、历史或 TODO 快照。
        const userPrompt = [
            '【当前角色】',
            contact?.name || '未命名角色',
            '',
            '【角色刚刚回复】',
            assistantText || ''
        ].join('\n');
        // ★★★★★ Post Agent Router END：回复后 Agent 选择层 ★★★★★

        return [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
        ];
    },

    extractJson(rawText) {
        const text = String(rawText || '').trim();
        if (!text) throw new Error('Agent 路由返回为空');

        try {
            return JSON.parse(text);
        } catch (error) {
            // ★ worker model 偶尔会包一层 ```json，这里只抽 JSON，不接受自然语言正文。
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
            throw new Error(`未知 Agent 路由 intent：${intent || '空'}`);
        }

        const agent = String(data.agent || '').trim();
        if (intent === 'USE_AGENT' && !this.allowedAgents.includes(agent)) {
            throw new Error(`未知 Agent：${agent || '空'}`);
        }

        return {
            intent,
            agent: intent === 'USE_AGENT' ? agent : '',
            confirmation: data.confirmation && typeof data.confirmation === 'object' ? data.confirmation : {}
        };
    },

    parsePostRouterResult(rawText) {
        const data = this.extractJson(rawText);
        const intent = String(data.intent || '').trim().toUpperCase();
        if (!['NONE', 'USE_AGENT'].includes(intent)) {
            throw new Error(`未知 Post Agent 路由 intent：${intent || '空'}`);
        }

        const agent = String(data.agent || '').trim();
        if (intent === 'USE_AGENT' && !this.allowedPostAgents.includes(agent)) {
            throw new Error(`未知 Post Agent：${agent || '空'}`);
        }

        return {
            intent,
            agent: intent === 'USE_AGENT' ? agent : '',
            confirmation: data.confirmation && typeof data.confirmation === 'object' ? data.confirmation : {}
        };
    }
};
// ★★★★★ Agent Skill Router END：通用 Agent 选择层 ★★★★★
