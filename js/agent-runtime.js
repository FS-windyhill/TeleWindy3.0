// =========================================
// AGENT RUNTIME (Agent 通用调度层)
// 这里只做很薄的一层编排：统一跑已启用的 Agent，并收集要回注给主模型的摘要。
// 具体能力仍然留在各自模块里，比如 TODO 管理在 agent-todo-manager.js。
//
// 函数目录：
//   - runBeforeMainModel(context): 主模型请求前依次执行已启用 Agent
//   - runTodoManager(context): 当前第一批 Agent：TODO 管理
// =========================================

// ★★★★★ Agent Runtime START：通用调度层 ★★★★★
const AgentRuntime = {
    async runBeforeMainModel(context = {}) {
        const results = [];

        const todoResult = await this.runTodoManager(context);
        if (todoResult && todoResult.prompt) results.push(todoResult);

        return {
            results,
            prompts: results.map(item => item.prompt).filter(Boolean)
        };
    },

    async runTodoManager(context = {}) {
        const app = context.app;
        const contact = context.contact;
        const userText = context.userText;
        const userMessage = context.userMessage || null;

        // ★ TODO 管理暂时仍由 App 串 API 和前端写入；Runtime 只负责统一入口。
        if (!app || typeof app.runAgentTodoManager !== 'function') return null;
        if (typeof AgentTodoManager === 'undefined') return null;
        return app.runAgentTodoManager(contact, userText, userMessage);
    }
};
// ★★★★★ Agent Runtime END：通用调度层 ★★★★★
