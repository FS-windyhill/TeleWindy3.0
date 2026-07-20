// =========================================
// 本文件只放配置、默认设置和固定常量
// 这些内容会先于主 script.js 加载，供存储、云同步和主业务共同使用
// =========================================

// =========================================
// 1. CONFIG (配置与默认设置)
//   - STORAGE_KEY / SETTINGS_KEY / WORLD_INFO_KEY: 联系人、设置、世界书数据 key
//   - MOMENTS_KEY / MOMENTS_SETTINGS_KEY: 心迹列表和心迹设置 key
//   - TODO_PLANS_KEY: 探索页 TO DO 计划列表 key
//   - COUNTDOWN_DAYS_KEY: 探索页倒数日 / 正数日列表 key
//   - CHARACTER_SCHEDULES_KEY: 探索页角色日程 key
//   - CHARACTER_MEMORIES_KEY: 探索页角色记忆 key
//   - MOMENTS_INJECT_COUNT: 心迹在聊天里提示 AI 的聊天轮次
//   - DEFAULT: 所有设置项的默认值
//     - TODO_PLAN_INJECT_ENABLED: TO DO 计划是否注入 AI system prompt
//     - COUNTDOWN_INJECT_ENABLED: 倒数日 / 正数日是否注入 AI system prompt
//     - CHARACTER_SCHEDULE_API_PRESET_INDEX: 角色日程生成使用的 API 预设索引
//     - CHARACTER_MEMORY_API_PRESET_INDEX: 角色记忆生成使用的 API 预设索引
//     - AGENT_SKILL_ROUTER_ENABLED / AGENT_SKILL_ROUTER_API_PRESET_INDEX: Agent 工具路由器开关和模型预设
//     - MOMENTS_SETTINGS: 心迹页面默认设置
//   - SYSTEM_PROMPT: 默认系统提示词
// =========================================

const CONFIG = {
    STORAGE_KEY: 'teleWindy_char_data_v1',
    SETTINGS_KEY: 'teleWindy_settings_v1',
    WORLD_INFO_KEY: 'teleWindy_world_info_v2',
    
    // ★★★ 这里的 KEY 必须定义在第一层！ ★★★
    MOMENTS_KEY: 'teleWindy_moments_v1', 
    MOMENTS_SETTINGS_KEY: 'teleWindy_moments_settings_v1',
    TODO_PLANS_KEY: 'teleWindy_todo_plans_v1',
    COUNTDOWN_DAYS_KEY: 'teleWindy_countdown_days_v1',
    CHARACTER_SCHEDULES_KEY: 'teleWindy_character_schedules_v1',
    CHARACTER_MEMORIES_KEY: 'teleWindy_character_memories_v1',
    MAIN_CONTEXT_LOG_KEY: 'teleWindy_main_context_log_v1',
    AGENT_CONTEXT_LOG_KEY: 'teleWindy_agent_context_log_v1',

    CHAT_PAGE_SIZE: 15,
    MOMENTS_PAGE_SIZE: 15, // 心迹分页数
    GIST_ID_KEY: 'telewindy-gist-id',

    MOMENTS_INJECT_COUNT: 1, // AI在聊天中感知新心迹的聊天轮次

    DEFAULT: {
        API_URL: 'https://api.deepseek.com/v1/chat/completions',
        MODEL: 'deepseek-v4-flash',
        API_KEY: '', 
        ASYNC_BACKEND_ENABLED: false,
        ASYNC_BACKEND_URL: '',
        ASYNC_BACKEND_TOKEN: '',
        ASYNC_BACKEND_KEY_MODE: 'client_key',
        ASYNC_BACKEND_TTL_HOURS: 6,
        WORLD_SENSE_ENABLED: false,
        WORLD_SENSE_WEATHER_ENABLED: false,
        WORLD_SENSE_WEATHER_CITY: '',
        WORLD_SENSE_WEATHER_CACHE: null,
        WORLD_SENSE_FESTIVAL_ENABLED: false,
        DESKTOP_SIGNATURE: '',
        DESKTOP_ACTIVITY: { days: {}, lastRenderDate: '' },
        TODO_PLAN_INJECT_ENABLED: false,
        COUNTDOWN_INJECT_ENABLED: false,
        CHARACTER_SCHEDULE_API_PRESET_INDEX: -1,
        CHARACTER_MEMORY_API_PRESET_INDEX: -1,
        AGENT_SKILL_ROUTER_ENABLED: false,
        AGENT_SKILL_ROUTER_API_PRESET_INDEX: -1,
        WALLPAPER: 'assets/images/wallpaper.jpg',
        USER_AVATAR: 'assets/images/user.jpg',
        GIST_TOKEN: '',
        THEME: 'light',
        THEME_COLOR_H: 250,
        THEME_COLOR_S: 100,
        THEME_COLOR_L: 72,
        FONT_SIZE: 16,
        HIDE_THOUGHT_PROCESS: false,
        API_PRESETS: [],
        VISION_PRESETS: [],
        SYSTEM_PROMPT_PRESETS: [],
        
        // ★★★ 默认心迹设置也必须定义在 DEFAULT 里 ★★★
        MOMENTS_SETTINGS: {
            bgImage: '', 
            avatar: '', 
            username: '你的名字', // <-- 新增这一行
            signature: '写下你的此刻心情...',
            apiPresetIndex: -1, 
            allowedChars: [] 
        },

        MAX_TOKENS: 32700, 
        TEMPERATURE: 1.1,
        CONTEXT_LIMIT: 5,
        HISTORY_WINDOW_STRATEGY: 'cache_friendly',
        HISTORY_WINDOW_MAX_CONTEXT: 25,
        DYNAMIC_CONTEXT_INSERT_MODE: 'auto',

        CUSTOM_REQUEST_BODY_JSON: '',
        REQUEST_BODY_PRESETS: [],

        CUSTOM_CSS: '', 
        CSS_PRESETS: [],
        VISION_URL: 'https://api.siliconflow.cn/v1/chat/completions',
        VISION_KEY: '',
        VISION_MODEL: 'Qwen/Qwen3-VL-30B-A3B-Instruct',
        VISION_PROMPT: '请详细地描述这张图片的内容。不要发表评论，只需客观描述。',
    },

    SYSTEM_PROMPT: `
- if roleplay: 这里是线上聊天，你就是该角色本身。请完全成为该角色，鼓励自由回答、同理心和真实的情感。输出时一句话一行，段落间空一行。
- else: 直接响应，保持周到、专业。
- 无需输出时间戳。
`
}

// 默认 system prompt 仍然只维护 CONFIG.SYSTEM_PROMPT 这一份；
// 放进 DEFAULT 后，用户保存的全局设置就可以覆盖它。
CONFIG.DEFAULT.SYSTEM_PROMPT = CONFIG.SYSTEM_PROMPT;




// 运行时状态
