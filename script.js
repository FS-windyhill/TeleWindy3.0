// =========================================
// 树状代码目录（完整版）
// =========================================
// 本目录基于代码结构组织，包含所有章节、对象、属性和函数。
// 每个函数后附简要描述：这是用于干什么的。
// 注意：属性（如常量）仅列出，不附描述；函数则说明作用。

// 1. CONFIG & STATE (配置与状态)
//   - CONFIG: 应用程序的静态配置常量和默认值对象
//     - STORAGE_KEY: localStorage中存储角色/联系人数据的键名
//     - SETTINGS_KEY: localStorage中存储用户设置的键名
//     - WORLD_INFO_KEY: localStorage中存储世界信息（World Info）的键名
//     - MOMENTS_KEY: localStorage中存储心迹（朋友圈）数据的键名
//     - MOMENTS_SETTINGS_KEY: localStorage中存储心迹设置的键名
//     - CHAT_PAGE_SIZE: 聊天历史分页加载时每页显示的消息条数 (15)
//     - MOMENTS_PAGE_SIZE: 心迹列表分页加载时每页显示的条数 (15)
//     - GIST_ID_KEY: localStorage中存储 GitHub Gist ID 的键名（用于云同步）
//     - MOMENTS_INJECT_COUNT: AI在聊天中感知新心迹的默认次数 (5)
//     - DEFAULT: 所有可配置项的默认值集合
//       - API_URL: 默认文本生成 API 地址
//       - MODEL: 默认使用的模型名称
//       - API_KEY: 默认 API 密钥
//       - WALLPAPER: 默认壁纸文件名
//       - USER_AVATAR: 默认用户头像文件名
//       - GIST_TOKEN: 默认 GitHub Token
//       - THEME: 默认主题 ('light')
//       - FONT_SIZE: 默认字体大小 (16)
//       - API_PRESETS: API预设数组默认值
//       - VISION_PRESETS: 视觉模型预设数组默认值
//       - MOMENTS_SETTINGS: 心迹设置的默认值对象
//       - MAX_TOKENS: 默认最大token数 (32700)
//       - TEMPERATURE: 默认温度参数 (1.1)
//       - CONTEXT_LIMIT: 默认上下文消息条数限制 (30)
//       - CUSTOM_CSS: 默认自定义CSS内容
//       - CSS_PRESETS: CSS预设数组默认值
//       - VISION_URL: 默认视觉API地址
//       - VISION_KEY: 默认视觉API密钥
//       - VISION_MODEL: 默认视觉模型名称
//       - VISION_PROMPT: 默认视觉分析提示词
//     - SYSTEM_PROMPT: 系统级提示词，用于引导AI行为
//   - STATE: 应用程序的运行时全局状态
//     - contacts: 存储所有联系人/角色的数组
//     - worldInfoBooks: 存储所有世界书（知识库）的数组
//     - currentContactId: 当前正在聊天的联系人ID
//     - currentBookId: 当前正在编辑的世界书ID
//     - settings: 存储当前生效的用户设置
//     - typingContactId: 追踪哪个联系人正在“输入中”
//     - visibleMsgCount: 当前聊天窗口显示的消息条数
//     - isSelectMode: 标识是否处于消息多选模式
//     - selectedBubbles: 存储多选模式下选中的气泡DOM元素
//     - pendingImage: 暂存用户准备发送的图片 (Base64格式)
//     - moments: 存储所有心迹数据的数组
//     - momentsSettings: 存储心迹页面的设置（背景、头像、用户名等）
//     - visibleMomentsCount: 当前心迹页面显示的条数

// 1.5. DB UTILS (IndexedDB 简易封装)
//   - DB: 基于 IndexedDB 的异步存储工具
//     - open(): 打开或创建数据库连接，返回Promise
//     - get(key): 根据键名从数据库中异步读取数据
//     - set(key, value): 将键值对异步写入数据库
//     - remove(key): 根据键名异步删除数据库中的记录
//     - clear(): 异步清空当前对象存储中的所有数据
//     - exportAll(): 遍历并导出数据库中所有键值对，用于备份

// 2. STORAGE SERVICE (本地持久化 - IndexedDB 版)
//   - Storage: 核心数据持久化服务，负责所有数据的读写和迁移
//     - load(): 从IndexedDB加载所有数据（设置、联系人、世界书、心迹等），并处理从localStorage的旧数据迁移
//     - saveContacts(): 将STATE.contacts保存到IndexedDB
//     - saveSettings(): 将STATE.settings保存到IndexedDB
//     - saveWorldInfo(): 将STATE.worldInfoBooks保存到IndexedDB
//     - exportAllForBackup(): 导出所有数据用于备份，并对敏感Token进行简单加密
//     - importFromBackup(data): 从备份数据中恢复，清空当前数据库并写入新数据
//     - saveMoments(): 将STATE.moments保存到IndexedDB
//     - saveMomentsSettings(): 将STATE.momentsSettings保存到IndexedDB

// 3. WORLD INFO ENGINE (世界书/知识库引擎)
//   - WorldInfoEngine: 处理世界书（World Info）的导入、导出和在对话中的触发扫描
//     - importFromST(jsonString, fileName): 解析从SillyTavern导出的JSON文件，将其转换为内部世界书格式
//     - exportToST(book): 将内部世界书对象导出为兼容SillyTavern格式的JSON字符串
//     - scan(userText, history, currentContactId, currentContactName): 根据用户输入和聊天历史扫描所有世界书，返回匹配条目的合并内容

// 4. API SERVICE (LLM通信)
//   - API: 管理与各种AI模型API的通信
//     - getProvider(url): 根据API URL判断服务提供商类型（openai, claude, gemini）
//     - fetchModels(url, key): 向API发送请求，获取可用的模型列表
//     - estimateTokens(text): 估算一段文本大致消耗的Token数量
//     - testConnection(url, key, model): 发送极简消息测试API连接是否正常
//     - chat(messages, settings): 核心聊天函数，根据provider构造不同的请求体并发送，返回AI回复文本
//     - analyzeImage(base64Image, visionSettings): 调用视觉模型API分析图片内容，返回描述文本

// 5. CLOUD SYNC (终极混合版 - 含安全防御)
//   - CloudSync: 负责将数据备份到GitHub Gist或自定义服务器
//     - init(): 初始化云同步模块，恢复上次选择的同步模式和配置
//     - toggleMode(): 在自定义服务器和GitHub Gist模式间切换UI
//     - showStatus(msg, isError): 在界面上显示同步状态信息
//     - getAuth(): 获取并处理用户填写的认证凭据（Token/密码）
//     - _maskToken(token): 简单混淆Token，防止明文存储到GitHub
//     - _unmaskToken(maskedToken): 解混淆Token
//     - _preparePayload(): 准备要上传的数据包，包含备份时间和应用标识
//     - updateBackup(): 根据当前模式调用相应的上传方法
//     - findBackup(): 在用户的GitHub Gist列表中查找名为"TeleWindy Backup"的备份
//     - restoreBackup(): 从云端恢复数据的主入口
//     - _safeRestore(data): 安全地执行数据恢复，包括解密和防溢出处理
//     - _uploadToCustom(): 将数据上传到自定义服务器
//     - _fetchFromCustom(password): 从自定义服务器拉取数据
//     - _uploadToGist(): 将数据上传或更新到GitHub Gist
//     - _fetchFromGist(token): 从指定的GitHub Gist拉取数据

// 6. UI RENDERER (DOM 操作)
//   - UI: 负责所有用户界面元素的渲染、更新和事件驱动逻辑
//     - els: 存储页面关键DOM元素的引用
//     - autoScrollEnabled: 标记是否允许聊天窗口自动滚动到底部
//     - init(): 初始化UI，设置滚动监听、应用外观、渲染联系人列表等
//     - applyAppearance(): 根据STATE.settings应用主题、字体大小、壁纸和自定义CSS
//     - renderCssPresetMenu(): 渲染CSS预设的下拉选择菜单
//     - toggleTheme(newTheme): 切换主题并保存
//     - switchView(viewName): 切换主视图（聊天列表、聊天窗、探索页、心迹页）
//     - renderVisionPresetMenu(): 渲染视觉模型预设的下拉选择菜单
//     - renderContacts(): 使用模板渲染联系人列表，处理头像、消息预览和红点逻辑
//     - renderBookSelect(): 渲染世界书的大分类下拉选择框
//     - updateCurrentBookSettingsUI(): 更新当前世界书的绑定角色设置UI
//     - renderWorldInfoList(): 渲染当前世界书中的所有条目列表
//     - initWorldInfoTab(): 初始化世界书标签页的数据和下拉框
//     - createSingleBubble(...): 创建单条消息气泡的DOM元素，支持文本、图片和时间戳
//     - openImageLightbox(src): 打开一个简单的灯箱效果，用于放大查看聊天中的图片
//     - showEditModal(oldText, onConfirmCallback): 显示编辑消息的模态框
//     - removeLatestAiBubbles(): 删除聊天区域中最后一条AI消息的气泡
//     - renderChatHistory(contact, isLoadMore, keepScrollPosition): 渲染聊天历史记录，支持分页加载和滚动位置保持
//     - appendMessageBubble(...): 在消息组后追加单条消息气泡（用于流式生成后追加）
//     - appendSeparator(shouldAnimate): 在聊天区域插入一个分隔符
//     - scrollToBottom(): 将聊天滚动容器滚动到底部
//     - setLoading(isLoading, contactId): 设置聊天界面的“正在输入”状态
//     - updateRerollState(contact): 更新“重新生成”按钮的可用状态
//     - playWaterfall(fullText, avatar, timestamp, historyIndex): 模拟流式打字机效果，逐段渲染AI回复
//     - initStatusBar(): 初始化顶部状态栏，显示实时时间和设备电量
//     - renderPresetMenu(): 渲染API预设的下拉菜单并绑定事件

// 7. APP CONTROLLER (业务逻辑)
//   - App: 应用程序的核心控制器，处理所有业务逻辑和复杂交互
//     - init(): 异步初始化应用，加载数据并绑定事件
//     - enterChat(id): 进入聊天界面，加载聊天历史并更新UI状态
//     - handleSend(isReroll): 处理发送消息和重新生成消息的核心逻辑，包括图片识别、上下文构建、API调用和心迹注入
//     - openSettings(): 打开设置模态框，并回填所有当前设置值
//     - switchWorldInfoBook(bookId): 切换当前编辑的世界书
//     - bindCurrentBookToChar(charId): 将当前世界书绑定到指定角色
//     - loadWorldInfoEntry(uid): 加载世界书条目到编辑器中进行编辑
//     - saveWorldInfoEntry(): 保存当前编辑的世界书条目
//     - deleteWorldInfoEntry(): 删除当前编辑的世界书条目
//     - clearWorldInfoEditor(): 清空世界书编辑器表单
//     - createNewBook(): 创建新的世界书
//     - renameCurrentBook(): 重命名当前世界书
//     - deleteCurrentBook(): 删除当前世界书
//     - exportCurrentBook(): 导出当前世界书为JSON文件
//     - handleImportWorldInfo(file): 处理导入世界书文件
//     - handleSavePreset(): 保存当前的API配置为一个预设
//     - handleLoadPreset(index): 加载指定的API预设
//     - handleDeletePreset(): 删除指定的API预设
//     - saveSettingsFromUI(): 将设置面板的当前值保存到STATE并持久化
//     - handleMessageAction(action): 处理对单条消息的操作（编辑、删除、隐藏、复制、多选）
//     - enterSelectMode(): 进入多选模式，高亮消息并显示底部操作栏
//     - exitSelectMode(): 退出多选模式
//     - toggleBubbleSelection(bubbleEl): 切换单个消息气泡的选中状态
//     - updateSelectCount(): 更新多选模式下选中数量的显示
//     - bindSelectBarEvents(): 绑定多选模式底部操作栏的按钮事件
//     - handleBatchCopy(): 批量复制选中的消息内容
//     - handleBatchToggleHidden(): 批量隐藏或显示选中的消息段落
//     - handleBatchDelete(): 批量删除选中的消息段落或整条消息
//     - hideMessageContextMenu(): 隐藏消息长按菜单
//     - showMessageContextMenu(msgIndex, rect): 在指定位置显示消息长按操作菜单
//     - renderMomentsUI(): 渲染心迹（朋友圈）列表，包括头像、背景、用户名、签名和动态卡片
//     - loadMoreMoments(): 加载更多心迹
//     - openMomentsSettings(): 打开心迹设置弹窗，并填充当前设置
//     - saveMomentsSettings(): 保存心迹设置
//     - publishMoment(): 发布新心迹，并初始化各角色的通知计数器
//     - triggerAIComments(targetMoment): 触发所有相关角色对新心迹进行AI评论
//     - openReplyModal(): 打开回复评论的输入框
//     - executeCommentReply(): 执行回复AI评论的逻辑，发送用户回复并触发AI追问
//     - getMomentsContextForChat(contactId): 为聊天生成心迹上下文，提取该角色未读的心迹作为背景知识
//     - handleMomentAction(action): 处理对整条心迹的操作（复制、编辑、删除）
//     - handleCommentAction(action): 处理对单条评论的操作（复制、编辑、重新生成、删除）
//     - saveAndRenderMoments(): 保存心迹数据并刷新UI
//     - bindEvents(): 绑定页面所有交互事件，包括按钮点击、输入框事件、长按菜单等
//     - readFile(file): 将用户上传的文件读取为Base64字符串，返回Promise
//     - handleTestConnection(): 测试API连接
//     - fetchModelsForUI(): 获取模型列表并填充到UI
//     - handleVisionTestConnection(): 测试视觉API连接
//     - fetchVisionModelsForUI(): 获取视觉模型列表并填充到UI
//     - bindImageUpload(...): 辅助函数，绑定图片上传和预览逻辑
//     - handleSaveVisionPreset(): 保存当前视觉API配置为一个预设
//     - handleLoadVisionPreset(): 加载指定的视觉API预设
//     - handleDeleteVisionPreset(): 删除指定的视觉API预设
//     - openEditModal(id): 打开角色编辑/新建模态框
//     - saveContactFromModal(): 从模态框保存角色信息
//     - handleSaveCssPreset(): 保存自定义CSS为一个预设
//     - handleLoadCssPreset(index): 加载指定的CSS预设
//     - handleDeleteCssPreset(): 删除指定的CSS预设
//     - prefixUserCss(rawCss): 为用户自定义CSS添加作用域前缀

// 8. UTILS & EXPORTS (工具与启动)
//   - formatTimestamp(): 生成聊天消息的时间戳 (例如 "Jan.14 16:39")
//   - formatTimeForMoments(ts): 生成心迹的时间戳 (例如 "1月14日 16:39")
//   - parseCustomMarkdown(text): 使用marked.js和DOMPurify将Markdown文本安全地转换为HTML
//   - cleanMarkdownForCopy(text): 清洗文本中的Markdown符号，用于复制操作
//   - window.exportData: 全局导出函数，触发数据备份下载
//   - window.importData: 全局导入函数，从备份文件恢复数据
//   - window.onload: 应用启动入口，调用App.init()


// =========================================
// 1. CONFIG & STATE (配置与状态)
// =========================================

const CONFIG = {
    STORAGE_KEY: 'teleWindy_char_data_v1',
    SETTINGS_KEY: 'teleWindy_settings_v1',
    WORLD_INFO_KEY: 'teleWindy_world_info_v2',
    
    // ★★★ 这里的 KEY 必须定义在第一层！ ★★★
    MOMENTS_KEY: 'teleWindy_moments_v1', 
    MOMENTS_SETTINGS_KEY: 'teleWindy_moments_settings_v1',

    CHAT_PAGE_SIZE: 15,
    MOMENTS_PAGE_SIZE: 15, // 心迹分页数
    GIST_ID_KEY: 'telewindy-gist-id',

    MOMENTS_INJECT_COUNT: 5, // AI在聊天中感知新心迹的次数

    DEFAULT: {
        API_URL: 'https://api.siliconflow.cn/v1/chat/completions',
        MODEL: 'deepseek-ai/DeepSeek-V3.2',
        API_KEY: '', 
        WALLPAPER: 'wallpaper.jpg',
        USER_AVATAR: 'user.jpg',
        GIST_TOKEN: '',
        THEME: 'light',
        FONT_SIZE: 16,
        API_PRESETS: [],
        VISION_PRESETS: [],
        
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
        CONTEXT_LIMIT: 30,
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




// 运行时状态
const STATE = {
    contacts: [],
    worldInfoBooks: [], // ★★★ 改名：这里存放“书”的数组
    currentContactId: null,
    currentBookId: null, // ★★★ 新增：当前正在编辑哪本书
    settings: {}, 
    typingContactId: null, // ★★★ 新增：用于追踪哪个联系人正在输入，null表示无人输入
    visibleMsgCount: 15, // ★★★ 新增：当前聊天窗口显示的条数，默认为15
    isSelectMode: false,      // 当前是否处于多选模式
    selectedBubbles: new Set(),  // 存储选中的气泡DOM元素
    pendingImage: null, // ★★★ 新增：暂存用户选择的图片 (Base64)

    // 心迹
    // ★★★ 这里必须初始化为空数组和默认对象 ★★★
    moments: [], 
    // 直接引用 CONFIG 里的默认值，防止 undefined
    momentsSettings: JSON.parse(JSON.stringify(CONFIG.DEFAULT.MOMENTS_SETTINGS)), 
    
    visibleMomentsCount: 15,

    // 聊天记录搜索：
    chatMode: 'normal',    // 'normal' 为正常从底往上，'jump' 为跳转模式
    jumpStartIndex: 0,     // 跳转模式下的起始索引
    jumpEndIndex: 0,       // 跳转模式下的结束索引
    targetHighlightIndex: -1, // 需要高亮闪烁的消息索引


};

// =========================================
// 1.5. DB UTILS (IndexedDB 简易封装)
// =========================================
const DB = {
    dbName: 'TeleWindyDB',
    storeName: 'store',
    version: 1,
    
    open() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);
            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    db.createObjectStore(this.storeName);
                }
            };
            request.onsuccess = (e) => resolve(e.target.result);
            request.onerror = (e) => reject(e.target.error);
        });
    },

    async get(key) {
        const db = await this.open();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(this.storeName, 'readonly');
            const store = tx.objectStore(this.storeName);
            const req = store.get(key);
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    },

    async set(key, value) {
        const db = await this.open();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(this.storeName, 'readwrite');
            const store = tx.objectStore(this.storeName);
            const req = store.put(value, key);
            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error);
        });
    },

    async remove(key) {
        const db = await this.open();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(this.storeName, 'readwrite');
            const store = tx.objectStore(this.storeName);
            const req = store.delete(key);
            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error);
        });
    },
    
    async clear() {
        const db = await this.open();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(this.storeName, 'readwrite');
            const store = tx.objectStore(this.storeName);
            const req = store.clear();
            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error);
        });
    },

    // 导出所有数据用于备份 (修复版：使用游标一次性读取)
    async exportAll() {
        const db = await this.open();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(this.storeName, 'readonly');
            const store = tx.objectStore(this.storeName);
            // 打开游标遍历所有数据
            const request = store.openCursor();
            
            const data = {};

            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    // cursor.key 是键名 (如 'contacts')
                    // cursor.value 是存的数据 (如 [...数组])
                    data[cursor.key] = cursor.value; 
                    cursor.continue(); // 继续读下一条
                } else {
                    // 游标为空说明读完了，此时 data 已经装满了
                    resolve(data); 
                }
            };
            
            request.onerror = (e) => reject(e.target.error);
        });
    }
    
};

// =========================================
// 2. STORAGE SERVICE (本地持久化 - IndexedDB 版)
// =========================================
const Storage = {
    // 初始化/加载数据
    async load() {
        // ------------------------------------------------
        // 1. 加载设置 (Settings)
        // ------------------------------------------------
        // 优先从 IDB 读取
        let loadedSettings = await DB.get(CONFIG.SETTINGS_KEY);

        // [数据迁移]: 如果 IDB 为空，尝试从 LocalStorage 读取旧数据
        if (!loadedSettings) {
            const lsSettings = localStorage.getItem(CONFIG.SETTINGS_KEY);
            if (lsSettings) {
                try { loadedSettings = JSON.parse(lsSettings); } catch (e) {}
            }
        }
        loadedSettings = loadedSettings || {};

        // 兼容旧版 Theme (检查 LocalStorage，因为这是历史遗留位置)
        const legacyTheme = localStorage.getItem('appTheme');
        if (legacyTheme) {
            loadedSettings.THEME = legacyTheme;
            localStorage.removeItem('appTheme');
        }

        STATE.settings = { ...CONFIG.DEFAULT, ...loadedSettings };
        if (!Array.isArray(STATE.settings.API_PRESETS)) {
            STATE.settings.API_PRESETS = [];
        }

        // 兼容旧头像壁纸 (同样检查 LocalStorage)
        // 注意：一旦保存过一次新版，这些旧数据其实就不需要了，但为了安全保留检查
        if (Object.keys(loadedSettings).length === 0) {
            const oldUserAvatar = localStorage.getItem('fs_user_avatar');
            const oldWallpaper = localStorage.getItem('fs_wallpaper');
            if (oldUserAvatar) STATE.settings.USER_AVATAR = oldUserAvatar;
            if (oldWallpaper) STATE.settings.WALLPAPER = oldWallpaper;
        }

        // ------------------------------------------------
        // 2. 加载联系人 (Contacts)
        // ------------------------------------------------
        let contactsData = await DB.get(CONFIG.STORAGE_KEY);
        
        // [数据迁移]: IDB 无数据，尝试读取 LS
        if (!contactsData) {
            const lsContacts = localStorage.getItem(CONFIG.STORAGE_KEY);
            if (lsContacts) {
                try { contactsData = JSON.parse(lsContacts); } catch (e) {}
            }
        }

        if (Array.isArray(contactsData)) {
            STATE.contacts = contactsData;
        } else {
            STATE.contacts = [];
        }

        // 兜底默认联系人
        if (STATE.contacts.length === 0) {
            STATE.contacts.push({
                id: Date.now().toString(),
                name: '小真蛸',
                avatar: '😊',
                prompt: '你是一个温柔可爱的助手小真蛸，说话请带上颜文字。',
                history: []
            });
        }

        // ------------------------------------------------
        // 3. ★★★ 加载世界书 (World Info)
        // ------------------------------------------------
        let wiData = await DB.get(CONFIG.WORLD_INFO_KEY);

        // [数据迁移]: IDB 无数据，尝试读取 LS 的 V2 数据
        if (!wiData) {
            const lsWiV2 = localStorage.getItem(CONFIG.WORLD_INFO_KEY);
            if (lsWiV2) {
                try { wiData = JSON.parse(lsWiV2); } catch (e) {}
            }
        }

        if (wiData) {
            STATE.worldInfoBooks = wiData;
        } else {
            // [旧版迁移]: 检查 LS 中的 V1 数据 (散乱条目)
            const wiRawV1 = localStorage.getItem('teleWindy_world_info_v1');
            STATE.worldInfoBooks = [];
            
            if (wiRawV1) {
                try {
                    const oldEntries = JSON.parse(wiRawV1);
                    if (Array.isArray(oldEntries) && oldEntries.length > 0) {
                        console.log("Detecting old WI format in LS, migrating to DB...");
                        const defaultBook = {
                            id: 'book_default_' + Date.now(),
                            name: '默认世界书 (旧数据迁移)',
                            characterId: '', 
                            entries: oldEntries
                        };
                        STATE.worldInfoBooks.push(defaultBook);
                        // 立即保存到 IDB 以完成迁移
                        await this.saveWorldInfo();
                    }
                } catch (e) {
                    console.error("Migration failed", e);
                }
            }
        }

        // 确保至少有一本书
        if (STATE.worldInfoBooks.length === 0) {
            STATE.worldInfoBooks.push({
                id: 'book_' + Date.now(),
                name: '新建世界书',
                characterId: '',
                entries: []
            });
        }
        
        // 默认选中第一本
        STATE.currentBookId = STATE.worldInfoBooks[0].id;


        // ★★★ 新增：加载心迹数据 ★★★
        try {
            const moments = await DB.get(CONFIG.MOMENTS_KEY);
            if (moments) STATE.moments = moments;

            const mSettings = await DB.get(CONFIG.MOMENTS_SETTINGS_KEY);
            if (mSettings) {
                STATE.momentsSettings = mSettings;
            } else {
                // 【修复点 1】：必须从 CONFIG.DEFAULT.MOMENTS_SETTINGS 获取
                // 并且建议深拷贝，防止引用污染
                STATE.momentsSettings = JSON.parse(JSON.stringify(CONFIG.DEFAULT.MOMENTS_SETTINGS));
            }
        } catch (e) {
            console.warn("读取心迹数据失败 (可能是第一次运行):", e);
            // 【修复点 2】：Catch 块里也要修复
            STATE.momentsSettings = JSON.parse(JSON.stringify(CONFIG.DEFAULT.MOMENTS_SETTINGS));
        }



        
        console.log('Storage loaded via IndexedDB.');
    },

    // 保存联系人
    async saveContacts() {
        // IndexedDB 可以直接存对象，不需要 JSON.stringify
        await DB.set(CONFIG.STORAGE_KEY, STATE.contacts);
    },

    // 保存设置
    async saveSettings() {
        await DB.set(CONFIG.SETTINGS_KEY, STATE.settings);
    },

    // 保存世界书
    async saveWorldInfo() {
        await DB.set(CONFIG.WORLD_INFO_KEY, STATE.worldInfoBooks);
    },
    
    // 导出备份逻辑 (改为从 DB 获取)
    async exportAllForBackup() {
        // 1. 获取 DB 中所有数据
        const data = await DB.exportAll(); // 使用 1.5 中定义的 exportAll

        // 2. 特殊处理：Token 加密 (为了安全)
        if (data[CONFIG.SETTINGS_KEY]) {
            // 注意：从 DB 拿出来的是对象，不是字符串
            let settings = data[CONFIG.SETTINGS_KEY]; 
            
            // 为了不修改原始对象引用，我们浅拷贝一份
            const safeSettings = { ...settings };

            if (safeSettings.GIST_TOKEN && !safeSettings.GIST_TOKEN.startsWith('ENC_')) {
                safeSettings.GIST_TOKEN = 'ENC_' + btoa(safeSettings.GIST_TOKEN);
                // 替换掉原数据中的设置对象
                data[CONFIG.SETTINGS_KEY] = safeSettings;
            }
        }
        
        // 3. (可选) 导出时将对象转为 JSON 字符串，方便保存为文件
        // 如果你的 import 逻辑 期望的是 value 为字符串，这里需要 stringify
        // 通常为了保持原来的行为一致性，我们在这里把对象转回字符串给下载文件用
        const exportData = {};
        for (const [key, val] of Object.entries(data)) {
            exportData[key] = (typeof val === 'object') ? JSON.stringify(val) : val;
        }

        return exportData;
    },

    // 导入备份逻辑
    async importFromBackup(data) {
        // 1. 清空当前数据库
        await DB.clear();
        
        // 2. 遍历导入
        const promises = Object.keys(data).map(async (key) => {
            let value = data[key];
            
            // 尝试解析 JSON 字符串回对象 (因为 export 时我们转成了字符串)
            try {
                if (typeof value === 'string') {
                    value = JSON.parse(value);
                }
            } catch (e) {
                // 如果不是 JSON，保持原样
            }

            // 解密 Token
            if (key === CONFIG.SETTINGS_KEY && value && typeof value === 'object') {
                if (value.GIST_TOKEN && value.GIST_TOKEN.startsWith('ENC_')) {
                    try {
                        value.GIST_TOKEN = atob(value.GIST_TOKEN.replace('ENC_', ''));
                    } catch (e) { console.error('Token decrypt failed', e); }
                }
            }
            
            // 写入 DB
            await DB.set(key, value);
        });

        await Promise.all(promises);
        console.log('Import finished.');
    },

    /* ===================== 心迹 ===================== */

    // 1. 保存心迹列表
    async saveMoments() {
        // ★★★ 关键：显式传入 CONFIG.MOMENTS_KEY ★★★
        // 如果 CONFIG.MOMENTS_KEY 是 undefined，就会报刚才那个 DataError 错
        if (!CONFIG.MOMENTS_KEY) {
            console.error("CONFIG.MOMENTS_KEY 未定义！请检查配置。");
            return;
        }
        await DB.set(CONFIG.MOMENTS_KEY, STATE.moments);
    },

    // 2. 保存心迹设置
    async saveMomentsSettings() {
        // ★★★ 关键：显式传入 CONFIG.MOMENTS_SETTINGS_KEY ★★★
        if (!CONFIG.MOMENTS_SETTINGS_KEY) {
            console.error("CONFIG.MOMENTS_SETTINGS_KEY 未定义！请检查配置。");
            return;
        }
        await DB.set(CONFIG.MOMENTS_SETTINGS_KEY, STATE.momentsSettings);
    },




};

// =========================================
// 3. WORLD INFO ENGINE (已修正)
// =========================================
const WorldInfoEngine = {
    // 1. 导入逻辑：增加对 ST 各种怪异格式的兼容
    importFromST(jsonString, fileName) {
        try {
            const data = JSON.parse(jsonString);
            const entriesObj = data.entries || {}; 
            const newEntries = [];

            // 既支持数组格式，也支持对象格式 {"0":{}, "1":{}}
            const entriesList = Array.isArray(entriesObj) ? entriesObj : Object.values(entriesObj);

            entriesList.forEach(entry => {
                // 修正：ST 的 key 可能是 "a,b,c" 字符串，也可能是 ["a","b"] 数组
                let safeKeys = [];
                if (Array.isArray(entry.key)) {
                    safeKeys = entry.key;
                } else if (typeof entry.key === 'string') {
                    safeKeys = entry.key.split(',').map(k => k.trim()).filter(k => k);
                }

                // 修正：如果导入时没有 comment，尝试用第一个关键词代替，还没有就叫“未命名”
                let safeComment = entry.comment || '';
                if (!safeComment && safeKeys.length > 0) safeComment = safeKeys[0];
                if (!safeComment) safeComment = '未命名条目';

                newEntries.push({
                    uid: Date.now() + Math.random().toString(36).substr(2, 9),
                    keys: safeKeys, 
                    content: entry.content || '',
                    constant: !!entry.constant, 
                    // ★★★ 核心：确保这里读到了名字
                    comment: safeComment 
                });
            });
            
            const bookName = fileName ? fileName.replace(/\.[^/.]+$/, "") : ('导入书 ' + new Date().toLocaleTimeString());
            
            return {
                id: 'book_' + Date.now() + Math.random().toString(36).substr(2, 5),
                name: bookName,
                characterId: '', 
                entries: newEntries
            };

        } catch (e) {
            console.error("Import Failed:", e);
            alert("导入失败：请确认是有效的 JSON 文件");
            throw e;
        }
    },

    // 2. 导出逻辑：确保 comment 被写回 JSON
    exportToST(book) {
        if (!book) return "{}";
        
        const exportObj = { entries: {} };
        book.entries.forEach((entry, index) => {
            // 使用 index 作为 key，符合 ST 标准
            exportObj.entries[index] = {
                uid: index, 
                key: entry.keys,
                // ★★★ 核心：导出时要把名字写回去
                comment: entry.comment || entry.keys[0] || "未命名",
                content: entry.content,
                constant: entry.constant,
                selective: true,
                order: 100,
                position: 0,
                disable: false,
                excludeRecursion: false,
                probability: 100,
                useProbability: true
            };
        });
        
        return JSON.stringify(exportObj, null, 2);
    },

    // 3. 扫描逻辑 (保持你修改后的版本，这部分没问题)
    scan(userText, history, currentContactId, currentContactName) {
        if (!STATE.worldInfoBooks || STATE.worldInfoBooks.length === 0) return null;
        const relevantHistory = history.slice(-1); 
        const contextText = (userText + '\n' + relevantHistory.map(m => m.content).join('\n')).toLowerCase();
        const triggeredContent = [];

        STATE.worldInfoBooks.forEach(book => {
            const isGlobalBook = !book.characterId || book.characterId === "";
            const isBoundBook = book.characterId === currentContactId;
            if (!isGlobalBook && !isBoundBook) return;

            book.entries.forEach(entry => {
                let triggered = false;
                if (entry.constant) {
                    triggered = true;
                } else if (entry.keys && Array.isArray(entry.keys)) {
                    triggered = entry.keys.some(k => {
                        const keyLower = k.toLowerCase().trim();
                        return keyLower && contextText.includes(keyLower);
                    });
                }
                if (triggered && entry.content) {
                    let finalContent = entry.content
                        .replace(/\{\{user\}\}/gi, '用户') 
                        .replace(/\{\{char\}\}/gi, currentContactName || '角色');
                    triggeredContent.push(finalContent);
                }
            });
        });

        if (triggeredContent.length === 0) return null;
        return triggeredContent.join('\n\n');
    }
};


// =========================================
// 4. API SERVICE (LLM通信)
// =========================================
const API = {
    getProvider(url) {
        if (url.includes('anthropic')) return 'claude';
        // ★ 核心修复：如果是 Google 的域名，且 URL 里【不包含】 openai，才当做原生 gemini
        if (url.includes('googleapis') && !url.includes('openai')) return 'gemini';
        // 只要包含 openai (包括 Google 的兼容接口)，统统走 openai 标准逻辑！
        return 'openai'; 
    },

    async fetchModels(url, key) {
        let modelsUrl = url.replace(/\/chat\/completions$/, '/models');
        let options = {
            method: 'GET',
            headers: {}
        };

        // 如果是原生 Gemini
        if (url.includes('googleapis') && !url.includes('openai')) {
            // 原生 Gemini 不支持 Bearer，必须把 Key 放在 URL 后面
            // 把原 URL (例如 ../v1beta/models) 加上 key 参数
            modelsUrl = url.includes('?') ? `${url}&key=${key}` : `${url}?key=${key}`;
        } else {
            // OpenAI, Claude 等标准格式，使用 Bearer
            options.headers['Authorization'] = `Bearer ${key}`;
        }

        const res = await fetch(modelsUrl, options);
        if (!res.ok) throw new Error(`Status: ${res.status}`);
        return await res.json();
    },

    // 在 API 类内部添加一个估算 Token 的辅助函数
    // 1. 新增：放在 API 类里面的辅助函数，用来估算 Token
    estimateTokens(text) {
        if (!text) return 0;
        // 简单粗暴的估算公式：
        // 中文/日文/韩文 (CJK) 算 1.8 个 Token
        // 英文/数字/符号 算 0.35 个 Token (约3个字母=1Token)
        const cjkCount = (text.match(/[\u4e00-\u9fa5\u3040-\u30ff\uac00-\ud7af]/g) || []).length;
        const otherCount = text.length - cjkCount;
        return Math.ceil(cjkCount * 1.8 + otherCount * 0.35);
    },

    // ============================================
    // ★ 新增：测试 API 连接专用函数
    // ============================================
    // ★ 新增：测试连接专用函数
    // 新增：测试连接函数
    async testConnection(url, key, model) {
        const provider = this.getProvider(url);
        let fetchUrl = url;
        let options = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        };

        // 构造一个极简的消息体，只为了测试通断
        const testMessage = "Ping"; 

        if (provider === 'claude') {
            options.headers['x-api-key'] = key;
            options.headers['anthropic-version'] = '2023-06-01';
            options.body = JSON.stringify({
                model: model,
                messages: [{ role: "user", content: testMessage }],
                max_tokens: 1 // 省流
            });
        } else if (provider === 'gemini') {
            fetchUrl = url.endsWith(':generateContent') ? url : `${url}/${model}:generateContent?key=${key}`;
            options.body = JSON.stringify({
                contents: [{ role: 'user', parts: [{ text: testMessage }] }],
                generationConfig: { maxOutputTokens: 1 }
            });
        } else {
            // OpenAI / DeepSeek / SiliconFlow 等
            options.headers['Authorization'] = `Bearer ${key}`;
            options.body = JSON.stringify({
                model: model,
                messages: [{ role: "user", content: testMessage }],
                max_tokens: 1 // 省流
            });
        }

        try {
            const response = await fetch(fetchUrl, options);
            
            if (!response.ok) {
                // 尝试读取错误信息
                const errText = await response.text();
                // 抛出带状态码的错误
                throw new Error(`${response.status} ${errText.slice(0, 50)}...`); 
            }
            
            // 如果成功，不需要返回内容，只要不报错就是成功
            return true;
        } catch (error) {
            throw error;
        }
    },
    // ============================================

    async chat(messages, settings) {
        // ★★★ 1. 解构出 MAX_TOKENS 和 TEMPERATURE，并给予保底值 ★★★
        // 注意：settings 对象是从外部传进来的（可能是全局设置，也可能是角色特定的预设）
        // 如果 settings 里没有这两个值，默认回退到 32700 和 1.1
        const { API_URL, API_KEY, MODEL } = settings;
        
        const MAX_TOKENS = settings.MAX_TOKENS || 32700;
        const TEMPERATURE = settings.TEMPERATURE !== undefined ? settings.TEMPERATURE : 1.1;

        const provider = this.getProvider(API_URL);
        
        let fetchUrl = API_URL;
        let options = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        };

        const lastUserMsg = messages.filter(m => m.role === 'user').pop()?.content || '';
        const sysPrompts = messages.filter(m => m.role === 'system').map(m => m.content).join('\n\n');

        // 构建请求体 (★★★ 将硬编码数值替换为变量 ★★★)
        if (provider === 'claude') {
            options.headers['x-api-key'] = API_KEY;
            options.headers['anthropic-version'] = '2023-06-01';
            options.body = JSON.stringify({
                model: MODEL,
                system: sysPrompts,
                messages: [{ role: "user", content: lastUserMsg }],
                max_tokens: MAX_TOKENS, // 替换
                temperature: TEMPERATURE // 替换
            });
        } else if (provider === 'gemini') {
            fetchUrl = API_URL.endsWith(':generateContent') ? API_URL : `${API_URL}/${MODEL}:generateContent?key=${API_KEY}`;
            options.body = JSON.stringify({
                contents: [{ role: 'user', parts:[{ text: lastUserMsg }] }],
                // ★ 修复：Gemini 原生要求驼峰命名 systemInstruction
                systemInstruction: { parts: [{ text: sysPrompts }] }, 
                generationConfig: { 
                    temperature: TEMPERATURE,
                    maxOutputTokens: MAX_TOKENS
                }
            });
        } else {
            // OpenAI Standard (SiliconFlow, DeepSeek, etc.)
            options.headers['Authorization'] = `Bearer ${API_KEY}`;
            options.body = JSON.stringify({
                model: MODEL,
                messages: messages,
                temperature: TEMPERATURE, // 替换
                max_tokens: MAX_TOKENS // 替换
            });
        }


            
        // ==========================================
        // 1. 发送前日志记录 (修复版)
        // ==========================================
        try {
            let requestBodyObject = options.body;
            if (typeof options.body === 'string') {
                requestBodyObject = JSON.parse(options.body);
            }
            
            console.log(`[${provider}] Sending...`, requestBodyObject);

            // 直接存入全局变量
            window.LAST_API_LOG = {
                content: JSON.stringify(requestBodyObject, null, 2),
                tokens: 0, 
                isEstimated: true 
            };

        } catch (error) {
            console.error("【API日志记录失败】", error);
        }

        const response = await fetch(fetchUrl, options);
        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`API Error ${response.status}: ${errText}`);
        }
        
        const data = await response.json();

        // ==========================================
        // 2. 发送后：拿到真实 Token (修复版)
        // ==========================================
        console.log(`[${provider}] Raw Response:`, data);

        if (data.usage && data.usage.prompt_tokens) {
            if (window.LAST_API_LOG) {
                window.LAST_API_LOG.tokens = data.usage.prompt_tokens;
                window.LAST_API_LOG.isEstimated = false;
            }
            console.log(`API返回真实Token消耗: ${data.usage.prompt_tokens}`);
        } else {
            if (window.LAST_API_LOG && window.LAST_API_LOG.content) {
                window.LAST_API_LOG.tokens = this.estimateTokens(window.LAST_API_LOG.content);
            }
        }
                
        if (provider === 'claude') return data.content[0].text.trim();
        
        if (provider === 'gemini') {
            const candidate = data?.candidates?.[0];
            if (candidate?.finishReason === 'SAFETY' || candidate?.finishReason === 'BLOCKLIST') {
                throw new Error("❌ 回复失败：内容触发了 Google Gemini 的安全审查过滤。");
            }
            return candidate?.content?.parts?.[0]?.text?.trim() || "【API未返回有效文本】";
        }
        
        // ==========================================
        // ★★★ 核心修改：统一推理模型的输出格式 ★★★
        // ==========================================
        const messageObj = data.choices[0].message;
        let finalContent = messageObj.content || "";
        
        // 检查是否存在特殊的推理字段 (DeepSeek-R1 / OpenAI o1 官方API格式)
        if (messageObj.reasoning_content) {
            // 强制将推理内容用 <think> 标签包裹，并在前面拼接到正文中
            // 这样前端渲染历史记录和瀑布流时，正则全都能完美抓取！
            finalContent = `<think>\n${messageObj.reasoning_content.trim()}\n</think>\n\n${finalContent}`;
        }
        
        return finalContent.trim();
    },



    // 在 chat(messages, settings) 函数后面添加：

    // ★★★ 新增：视觉分析专用函数 ★★★
    // 这是一个独立的请求，不使用 chat 函数的配置，而是使用视觉专属配置
    async analyzeImage(base64Image, visionSettings) {
        const { url, key, model, prompt } = visionSettings;
        
        console.log("正在请求视觉模型...", model);

        // 构建 OpenAI 兼容格式的 Vision Payload
        const payload = {
            model: model,
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: prompt },
                        { type: "image_url", image_url: { url: base64Image } }
                    ]
                }
            ],
            max_tokens: 8190
        };

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${key}`
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`Vision API Error: ${response.status} ${await response.text()}`);
            }

            const data = await response.json();
            const description = data.choices[0].message.content;
            console.log("视觉描述结果:", description);
            return description;

        } catch (error) {
            console.error("识图失败:", error);
            throw error; // 抛出错误让 handleSend 捕获
        }
    },



};

// =========================================
// 5. CLOUD SYNC (终极混合版 - 含安全防御)
// =========================================
const CloudSync = {
    els: {
        provider: document.getElementById('sync-provider'),
        urlInput: document.getElementById('custom-url'),
        gistIdInput: document.getElementById('gist-id-input'),
        token: document.getElementById('gist-token'), // 这里填密码/Token
        status: document.getElementById('gist-status'),
        groupUrl: document.getElementById('group-custom-url'),
        groupGistId: document.getElementById('group-gist-id'),
        authLabel: document.getElementById('auth-label')
    },

    init() {
        // 恢复上次的选择
        const savedMode = localStorage.getItem('SYNC_MODE') || 'custom';
        if(this.els.provider) this.els.provider.value = savedMode;

        const savedUrl = localStorage.getItem('SYNC_CUSTOM_URL');
        if(savedUrl && this.els.urlInput) this.els.urlInput.value = savedUrl;

        const savedGistId = localStorage.getItem(CONFIG.GIST_ID_KEY);
        if(savedGistId && this.els.gistIdInput) this.els.gistIdInput.value = savedGistId;

        this.toggleMode();
    },

    toggleMode() {
        const mode = this.els.provider.value;
        localStorage.setItem('SYNC_MODE', mode);

        if (mode === 'custom') {
            this.els.groupUrl.style.display = 'flex';
            this.els.groupGistId.style.display = 'none';
            this.els.authLabel.textContent = '服务器访问密码 (Secret Key)';
        } else {
            this.els.groupUrl.style.display = 'none';
            this.els.groupGistId.style.display = 'flex';
            this.els.authLabel.textContent = 'GitHub Token';
        }
    },

    showStatus(msg, isError = false) {
        if(!this.els.status) return;
        this.els.status.textContent = msg;
        this.els.status.style.color = isError ? '#f92f2fff' : '#3ec444ff';
    },

    getAuth() {
        // 1. 优先读取输入框里当前填写的密码
        let val = this.els.token ? this.els.token.value.trim() : '';

        // 2. 如果输入框是空的，再去读取之前保存的设置
        if (!val) {
            val = STATE.settings.GIST_TOKEN || '';
        }

        // 3. 还是空的？那就报错
        if (!val) {
            this.showStatus('请填写访问密码 (Secret Key)', true);
            return null;
        }
        
        // --- 兼容旧版加密 Token (保持不变) ---
        if (val.startsWith('ENC_')) {
            try { val = atob(val.slice(4)); } catch (e) { return null; }
        }
        return val;
    },

    // --- 逻辑补充：混淆工具 (防GitHub扫描) ---
    _maskToken(token) {
        if (!token) return token;
        try { return btoa(token.split('').reverse().join('')); } catch (e) { return token; }
    },

    _unmaskToken(maskedToken) {
        if (!maskedToken) return maskedToken;
        if (maskedToken.startsWith('ghp_') || maskedToken.startsWith('github_pat_')) return maskedToken;
        try { return atob(maskedToken).split('').reverse().join(''); } catch (e) { return maskedToken; }
    },
    // ---------------------------------------

    // 辅助：准备上传的数据
    async _preparePayload() {
        const originalData = await Storage.exportAllForBackup();
        const dataToUpload = JSON.parse(JSON.stringify(originalData));

        // 如果设置里存了 Token/密码，先混淆它，防止明文泄露
        if (dataToUpload.settings && dataToUpload.settings.GIST_TOKEN) {
            dataToUpload.settings.GIST_TOKEN = this._maskToken(dataToUpload.settings.GIST_TOKEN);
        }

        return {
            backup_at: new Date().toISOString(),
            app: "TeleWindy",
            data: dataToUpload
        };
    },

    // --- 主入口 ---
    async updateBackup() {
        const mode = this.els.provider.value;
        if (mode === 'custom') await this._uploadToCustom();
        else await this._uploadToGist();
    },

    // ==========================================
    // 🔍 伟大的自动查找功能 (Gist 专用)
    // ==========================================
    async findBackup() {
        // 1. 获取 Token (复用现有的安全获取逻辑)
        const token = this.getAuth();
        if (!token) return; // 如果没填 Token，getAuth 会自动提示

        this.showStatus('🔍 正在去 GitHub 翻箱倒柜...');
        
        try {
            // 2. 请求 Gist 列表
            const res = await fetch('https://api.github.com/gists', {
                headers: { Authorization: `token ${token}` }
            });
            
            if (!res.ok) throw new Error(`连接 GitHub 失败 (${res.status})`);

            const gists = await res.json();
            
            // 3. 匹配描述 (这是识别是不是 TeleWindy 备份的关键)
            const backup = gists.find(g => g.description === "TeleWindy Backup");

            if (backup) {
                // 4. 找到了！填入 ID 并保存
                this.els.gistIdInput.value = backup.id;
                localStorage.setItem(CONFIG.GIST_ID_KEY, backup.id);
                this.showStatus(`✅ 找到啦！ID: ${backup.id.slice(0, 8)}...`);
            } else {
                // 5. 没找到
                this.showStatus('⚠️ 没找到名为 "TeleWindy..." 的备份', true);
            }
        } catch (e) {
            this.showStatus('❌ 查找出错: ' + e.message, true);
        }
    },

    async restoreBackup() {

        // --- 1. 在这里插入防手抖代码 ---
        if (!confirm('即将从云端拉取旧数据覆盖当前数据，确认覆盖吗？')) {
            this.showStatus('操作已取消');
            return;
        }
        // -----------------------------

        // 恢复前先尝试获取密码，避免空密码去请求
        const auth = this.getAuth();
        if(!auth) return;

        const mode = this.els.provider.value;
        let backupDataJSON = null;

        try {
            if (mode === 'custom') {
                backupDataJSON = await this._fetchFromCustom(auth);
            } else {
                backupDataJSON = await this._fetchFromGist(auth);
            }

            if (backupDataJSON && backupDataJSON.data) {
                this._safeRestore(backupDataJSON.data);
            } else {
                throw new Error('数据格式不正确');
            }
        } catch (e) {
            this.showStatus('恢复出错: ' + e.message, true);
        }
    },

    // --- 逻辑补充：安全恢复 (防内存溢出) ---
    async _safeRestore(data) {
        // 1. 解密配置里的 Token
        if (data.settings && data.settings.GIST_TOKEN) {
            data.settings.GIST_TOKEN = this._unmaskToken(data.settings.GIST_TOKEN);
        }

        // 2. 临时备份关键设置 (因为下面要清空 LocalStorage)
        const savedMode = localStorage.getItem('SYNC_MODE');
        const savedUrl = localStorage.getItem('SYNC_CUSTOM_URL');
        const savedGistId = localStorage.getItem(CONFIG.GIST_ID_KEY);

        try {
            console.log('执行清空策略...');
            // localStorage.clear(); // 不再需要清空 LocalStorage (除非你想删配置)

            // 3. 恢复关键设置 (否则刷新页面后就忘了连哪里了)
            if(savedMode) localStorage.setItem('SYNC_MODE', savedMode);
            if(savedUrl) localStorage.setItem('SYNC_CUSTOM_URL', savedUrl);
            if(savedGistId) localStorage.setItem(CONFIG.GIST_ID_KEY, savedGistId);

            // 4. 写入数据
            await Storage.importFromBackup(data);
            
            this.showStatus('恢复成功！3秒后刷新');
            setTimeout(() => location.reload(), 3000);

        } catch (e) {
            console.error(e);
            if (e.name === 'QuotaExceededError' || e.message.includes('quota')) {
                alert('❌ 空间不足：即使清空了本地数据，备份文件依然太大，无法写入手机浏览器。');
            } else {
                alert('恢复时发生未知错误: ' + e.message);
            }
        }
    },

    // ==========================================
    // 具体的网络请求逻辑
    // ==========================================
    
    // 1. 自定义服务器上传
    async _uploadToCustom() {
        const password = this.getAuth();
        const url = this.els.urlInput.value.trim();
        if (!url) return this.showStatus('请输入服务器地址', true);

        localStorage.setItem('SYNC_CUSTOM_URL', url);
        this.showStatus('正在上传到私有云...');

        const payload = await this._preparePayload(); // 使用混淆过的数据

        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${password}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (res.ok) this.showStatus('私有云同步成功！' + new Date().toLocaleTimeString());
            else throw new Error((await res.json()).error || '上传失败');
        } catch (e) {
            this.showStatus(e.message, true);
        }
    },

    // 2. 自定义服务器下载
    async _fetchFromCustom(password) {
        const url = this.els.urlInput.value.trim();
        this.showStatus('正在从私有云拉取...');
        const res = await fetch(url, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${password}` }
        });
        if (!res.ok) throw new Error('拉取失败');
        return await res.json();
    },

    // 3. Gist 上传
    async _uploadToGist() {
        const token = this.getAuth();
        const gistId = this.els.gistIdInput.value.trim();
        this.showStatus('正在连接 GitHub...');

        const contentData = await this._preparePayload(); // 使用混淆过的数据
        const payload = {
            description: "TeleWindy Backup", 
            files: { "telewindy-backup.json": { content: JSON.stringify(contentData) } }
        };

        let url = 'https://api.github.com/gists';
        let method = 'POST';
        if (gistId) { url += `/${gistId}`; method = 'PATCH'; }

        try {
            const res = await fetch(url, {
                method: method,
                headers: { Authorization: `token ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                const json = await res.json();
                if (json.id) {
                    this.els.gistIdInput.value = json.id;
                    localStorage.setItem(CONFIG.GIST_ID_KEY, json.id);
                }
                this.showStatus('GitHub 同步成功！'+ new Date().toLocaleTimeString());
            } else throw new Error('Gist 请求失败');
        } catch (e) {
            this.showStatus(e.message, true);
        }
    },

    // 4. Gist 下载
    async _fetchFromGist(token) {
        const gistId = this.els.gistIdInput.value.trim();
        if (!gistId) throw new Error('需填写 Gist ID');
        
        this.showStatus('正在从 GitHub 拉取...');
        const res = await fetch(`https://api.github.com/gists/${gistId}`, { 
            headers: { Authorization: `token ${token}` }
        });
        if (!res.ok) throw new Error('Gist 未找到');

        const json = await res.json();
        const file = json.files['telewindy-backup.json'];
        
        let content = file.content;
        if (file.truncated) content = await (await fetch(file.raw_url)).text();
        
        return JSON.parse(content);
    }
};

// 启动初始化
setTimeout(() => CloudSync.init(), 500);


// =========================================
// 6. UI RENDERER (DOM 操作)
// =========================================
const UI = {
    els: {
        viewList: document.getElementById('view-contact-list'),
        viewChat: document.getElementById('view-chat'),
        contactContainer: document.getElementById('contact-list-container'),
        chatMsgs: document.getElementById('chat-messages'),
        chatTitle: document.getElementById('chat-title'),
        status: document.getElementById('typing-status'),
        input: document.getElementById('task-input'),
        sendBtn: document.getElementById('send-button'),
        rerollBtn: document.getElementById('reroll-footer-btn'),
        modalOverlay: document.getElementById('modal-overlay'),
        mainModal: document.getElementById('main-modal'), 
        
        // World Info Elements
        wiModal: document.getElementById('world-info-modal'),
        wiList: document.getElementById('wi-list-container'),
        wiBookSelect: document.getElementById('wi-book-select'), // ★★★ 新增：大分类选择
        wiBookCharSelect: document.getElementById('wi-book-char-select'), // ★★★ 新增：大分类绑定角色
        
        settingUrl: document.getElementById('custom-api-url'),
        settingKey: document.getElementById('custom-api-key'),
        settingModel: document.getElementById('custom-model-select'),
        fetchBtn: document.getElementById('fetch-models-btn'),
        themeLight: document.getElementById('theme-light'),
        themeDark: document.getElementById('theme-dark'),


        // ★★★ 新增：视觉设置 DOM ★★★
        settingVisionUrl: document.getElementById('vision-api-url'),
        settingVisionKey: document.getElementById('vision-api-key'),
        settingVisionModel: document.getElementById('vision-model-name'),
        settingVisionPrompt: document.getElementById('vision-prompt'),


        //  ★★★ 新增按钮和状态栏 ★★★
        fetchVisionBtn: document.getElementById('fetch-vision-models-btn'), // 拉取按钮
        testVisionBtn: document.getElementById('test-vision-api-btn'),     // 测试按钮
        visionStatus: document.getElementById('test-vision-api-status'),   // 测试结果文字
        visionModelList: document.getElementById('vision-model-options'),  // datalist

        // ★★★ 新增：发图 DOM ★★★
        uploadBtn: document.getElementById('upload-image-btn'),
        uploadInput: document.getElementById('image-upload-input'),
        previewContainer: document.getElementById('image-preview-container'),
        previewImg: document.getElementById('image-preview-img'),
        clearImgBtn: document.getElementById('clear-image-btn'),

        // ★★★ 新增发图、视觉预设相关 DOM ★★★
        visionPresetSelect: document.getElementById('vision-preset-select'),
        saveVisionPresetBtn: document.getElementById('save-vision-preset-btn'),
        delVisionPresetBtn: document.getElementById('del-vision-preset-btn'),


    },

    // ★★★ 新增：用于标记是否允许自动滚动的状态 ★★★
    autoScrollEnabled: true, 

    init() {
        this.renderContacts(); // 先渲染联系人
        CloudSync.init();      // 云同步初始化
        
        // ★★★ 新增：字体滑块的实时监听（拖动时直接预览，不需要点保存）
        const slider = document.getElementById('font-size-slider');
        const label = document.getElementById('font-size-value');
        if (slider) {
            slider.addEventListener('input', (e) => {
                const newSize = e.target.value;
                // 更新旁边的数字显示
                if(label) label.textContent = newSize + 'px';
                // 核心：直接修改 CSS 变量，让页面立刻变大变小
                document.documentElement.style.setProperty('--app-font-size', newSize + 'px');
            });
        }


        // 找到真正的滚动容器（根据你的 scrollToBottom 函数，它就是 parentElement）
        const scrollContainer = this.els.chatMsgs.parentElement;
        if (scrollContainer) {
            // ★★★ 核心修复：监听这个容器的 scroll 事件 ★★★
            scrollContainer.addEventListener('scroll', () => {
                // 计算在这个容器内的距离
                const distance = scrollContainer.scrollHeight - scrollContainer.scrollTop - scrollContainer.clientHeight;
                
                // 调试用：现在你应该能看到数字变化了
                // console.log('容器距离底部:', distance); 

                // 逻辑：
                // 1. 如果距离 > 50px，说明用户往上拉了，或者内容太长超出了底部 -> 暂停自动滚
                // 2. 如果距离 <= 50px，说明用户即使手动滚，也滚到了最下面 -> 恢复自动滚
                if (distance > 50) {
                    this.autoScrollEnabled = false;
                } else {
                    this.autoScrollEnabled = true;
                }
            });
        }

        // 初始化默认开启
        this.autoScrollEnabled = true;

        // 最后应用所有外观（包括刚才读出来的字体、主题、壁纸）
        this.applyAppearance();
    },

    // 1. 替换原有的 applyAppearance
    applyAppearance() {
        const settings = STATE.settings;
        
        // --- 读取设置 (注意保持大写 Key) ---
        const WALLPAPER = settings.WALLPAPER || CONFIG.DEFAULT.WALLPAPER;
        const THEME = settings.THEME || CONFIG.DEFAULT.THEME; 
        const FONT_SIZE = settings.FONT_SIZE || CONFIG.DEFAULT.FONT_SIZE;
        const CUSTOM_CSS = settings.CUSTOM_CSS || CONFIG.DEFAULT.CUSTOM_CSS; // 新增

        // --- 1. 处理壁纸 ---
        document.body.style.backgroundImage = `url('${WALLPAPER}')`;
        // 如果是默认壁纸且不是夜间/自定义模式，给个浅灰背景
        if (WALLPAPER === 'wallpaper.jpg' && THEME === 'light') {
            document.body.style.backgroundColor = '#f2f2f2';
        } else {
            document.body.style.backgroundColor = ''; 
        }

        // --- 2. 处理字体 ---
        document.documentElement.style.setProperty('--app-font-size', FONT_SIZE + 'px');
        const slider = document.getElementById('font-size-slider');
        const label = document.getElementById('font-size-value');
        if (slider) slider.value = FONT_SIZE;
        if (label) label.textContent = FONT_SIZE + 'px';

        // --- 3. 处理主题 (核心修改) ---
        const body = document.body;
        
        // 清理旧类名
        body.classList.remove('light-mode', 'dark-mode', 'custom-mode');

        // 获取或创建用于注入 CSS 的 style 标签
        let customStyleTag = document.getElementById('user-custom-css');
        if (!customStyleTag) {
            customStyleTag = document.createElement('style');
            customStyleTag.id = 'user-custom-css';
            document.head.appendChild(customStyleTag);
        }

        // 获取 CSS 面板 DOM (用于显示/隐藏)
        const cssPanel = document.getElementById('custom-css-panel');

        // 判断主题逻辑
        if (THEME === 'custom') {
            body.classList.add('custom-mode');
            customStyleTag.textContent = App.prefixUserCss(CUSTOM_CSS);// 注入用户 CSS
            if (cssPanel) cssPanel.classList.remove('hidden'); // 显示面板
            
            // 同步输入框的值 (防止刷新后输入框是空的)
            const cssInput = document.getElementById('custom-css-input');
            if (cssInput && cssInput.value !== CUSTOM_CSS) {
                cssInput.value = CUSTOM_CSS;
            }

        } else {
            // 非自定义模式
            customStyleTag.textContent = ''; // 清空自定义样式
            if (cssPanel) cssPanel.classList.add('hidden'); // 隐藏面板
            
            if (THEME === 'dark') {
                body.classList.add('dark-mode');
            } else {
                body.classList.add('light-mode');
            }
        }

        // --- 4. 同步 Radio 按钮状态 ---
        if(this.els.themeLight) this.els.themeLight.checked = (THEME === 'light');
        if(this.els.themeDark) this.els.themeDark.checked = (THEME === 'dark');
        const themeCustomBtn = document.getElementById('theme-custom');
        if(themeCustomBtn) themeCustomBtn.checked = (THEME === 'custom');
    },

    // 2. 新增：渲染预设下拉框
    renderCssPresetMenu() {
        const select = document.getElementById('css-preset-select');
        if (!select) return;
        
        // 清空现有选项，保留第一项提示
        select.innerHTML = '<option value="">-- 选择样式预设 --</option>';
        
        const presets = STATE.settings.CSS_PRESETS || [];
        presets.forEach((preset, index) => {
            const option = document.createElement('option');
            option.value = index; 
            option.textContent = preset.name;
            select.appendChild(option);
        });
    },

    // 保持 toggleTheme 不变，或者用你刚才发的那个
    async toggleTheme(newTheme) {
        STATE.settings.THEME = newTheme;
        await Storage.saveSettings();
        this.applyAppearance();
    },


    // 切换窗口+心迹版
    switchView(viewName) {
        const appContainer = document.getElementById('app-container');
        
        // 安全获取其他三个主要视图和底栏（找不到也不会报错）
        const viewContact = document.getElementById('view-contact-list');
        const viewExplore = document.getElementById('view-explore');
        const viewMoments = document.getElementById('view-moments');
        const bottomTabBar = document.getElementById('bottom-tab-bar');

        // 先清除底栏的全部高亮状态
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));

        if (viewName === 'chat') {
            // ===========================
            // 1. 进入聊天页面 (保留你原有的精美动画逻辑)
            // ===========================
            
            // 触发动画
            requestAnimationFrame(() => {
                appContainer.classList.add('in-chat-mode');
            });
            
            // 进入聊天时，隐藏底栏
            if (bottomTabBar) bottomTabBar.style.display = 'none'; 
            
            // 注意：因为你的聊天界面是靠 CSS 控制盖在上面的，所以这里不需要去改其他界面的 display
            
        } else if (viewName === 'contact-list') {
            // ===========================
            // 2. 返回/进入联系人列表
            // ===========================
            
            appContainer.classList.remove('in-chat-mode'); // 撤销聊天动画，淡出回去
            STATE.currentContactId = null; // 清除当前聊天对象
            
            // 控制其他页面隐藏，显示联系人列表
            if (viewContact) viewContact.style.display = 'flex';
            if (viewExplore) viewExplore.style.display = 'none';
            if (viewMoments) viewMoments.style.display = 'none';
            
            // 显示底栏，并高亮“聊天”按钮
            if (bottomTabBar) bottomTabBar.style.display = 'flex';
            const tabChat = document.getElementById('tab-chat');
            if (tabChat) tabChat.classList.add('active');

            // 保留你的延迟刷新逻辑，避免返回时的动画卡顿
            setTimeout(() => {
                this.renderContacts(); 
            }, 200);

        } else if (viewName === 'explore') {
            // ===========================
            // 3. 进入探索页面
            // ===========================
            
            appContainer.classList.remove('in-chat-mode'); // 确保不在聊天界面
            
            // 控制其他页面隐藏，显示探索页
            if (viewContact) viewContact.style.display = 'none';
            if (viewExplore) viewExplore.style.display = 'flex';
            if (viewMoments) viewMoments.style.display = 'none';
            
            // 显示底栏，并高亮“探索”按钮
            if (bottomTabBar) bottomTabBar.style.display = 'flex';
            const tabExplore = document.getElementById('tab-explore');
            if (tabExplore) tabExplore.classList.add('active');

        } else if (viewName === 'moments') {
            // ===========================
            // 4. 进入心迹页面 (朋友圈)
            // ===========================
            
            appContainer.classList.remove('in-chat-mode'); // 确保不在聊天界面
            
            // 控制其他页面隐藏，显示心迹页
            if (viewContact) viewContact.style.display = 'none';
            if (viewExplore) viewExplore.style.display = 'none';
            if (viewMoments) viewMoments.style.display = 'flex';
            
            // 隐藏底栏 (因为心迹页顶部有自己的返回按钮)
            if (bottomTabBar) bottomTabBar.style.display = 'none';
            
            // 触发心迹数据的渲染
            if (typeof this.renderMomentsUI === 'function') {
                this.renderMomentsUI();
            } else if (typeof App.renderMomentsUI === 'function') {
                App.renderMomentsUI();
            }
        }
    },

    // ... 前一个函数的结束大括号 }, 

    // ============================================
    // ★ 新增函数：渲染视觉预设菜单
    // ============================================
    renderVisionPresetMenu() {
        const presets = STATE.settings.VISION_PRESETS || [];
        const select = this.els.visionPresetSelect;
        
        if (!select) return; // 防止报错

        // 重置下拉框
        select.innerHTML = '<option value="">-- 选择视觉预设 --</option>';
        
        presets.forEach((p, index) => {
            const option = document.createElement('option');
            option.value = index; 
            option.textContent = p.name;
            select.appendChild(option);
        });
    },

    // ... 下一个函数的开始

    // 【6. UI RENDERER】
    renderContacts() {
        if(!this.els.contactContainer) return;
        this.els.contactContainer.innerHTML = ''; // 清空列表

        // 1. 获取 HTML 里的模板
        const template = document.getElementById('tpl-contact-item');
        if (!template) {
            console.error("未找到模板: tpl-contact-item");
            return;
        }

        STATE.contacts.forEach(c => {
            // 2. 克隆模板 (cloneNode(true) 表示深拷贝)
            const clone = template.content.cloneNode(true);

            // 3. 填充数据
            
            // --- A. 填充名字 ---
            clone.querySelector('.contact-name').textContent = c.name;

            // --- B. 处理头像 ---
            const avatarWrapper = clone.querySelector('.avatar-wrapper');
            // 简单判断：如果是 base64 或 http 开头，就是图片，否则是 emoji/文字
            if (c.avatar && (c.avatar.startsWith('data:') || c.avatar.startsWith('http'))) {
                const img = document.createElement('img');
                img.src = c.avatar;
                img.className = 'contact-avatar';
                img.onerror = function() { this.style.display = 'none'; }; // 图片坏了就隐藏
                avatarWrapper.appendChild(img);
            } else {
                const div = document.createElement('div');
                div.className = 'contact-avatar';
                div.textContent = c.avatar || '🌼'; // 默认头像
                avatarWrapper.appendChild(div);
            }

            // --- C. 处理消息预览和红点逻辑 (原逻辑保持不变) ---
            let previewText = "暂无消息";
            let msgCount = 0;
            let showRedDot = false;
            
            const validMsgs = c.history.filter(m => m.role !== 'system');
            if (validMsgs.length > 0) {
                const lastMsgObj = validMsgs[validMsgs.length - 1];
                let content = lastMsgObj.content || '';
                
                // 正则去时间戳
                content = content.replace(/^\[[A-Z][a-z]{2}\.\d{1,2}\s\d{2}:\d{2}\]\s/, '');

                // ==========================================================
                // ★ 新增代码：在这里添加一行，用正则去除Markdown符号 ★
                // 这个表达式会移除星号、井号、下划线、反引号等常见Markdown标记
                content = content.replace(/(\*\*|__|\*|_|#|`|>{1,}\s|- |\d+\.\s|\[(.*?)\]\((.*?)\)|!\[(.*?)\]\((.*?)\))/g, '');
                // ==========================================================

                // 拆分段落
                const chunks = content.split(/\n\s*\n/).filter(p => p.trim());

                if (chunks.length > 0) {
                    let lastChunk = chunks[chunks.length - 1];
                    previewText = lastChunk.length > 30 ? lastChunk.slice(0, 30) + '…' : lastChunk;
                    msgCount = chunks.length;
                    
                    // ★ 修改逻辑：
                    // 必须同时满足两个条件：
                    // 1. 最后一条是 AI 发的
                    // 2. 角色身上有 "hasNewMsg" 标记
                    if (lastMsgObj.role === 'assistant' && c.hasNewMsg === true) {
                        showRedDot = true;
                    }
                }
            }

            // 填入预览文字
            clone.querySelector('.contact-preview').textContent = previewText;

            // --- D. 处理红点显示 ---
            const badge = clone.querySelector('.badge-count');
            if (showRedDot && msgCount > 0) {
                badge.textContent = msgCount;
                badge.style.display = 'block'; // 显示
            } else {
                badge.style.display = 'none'; // 隐藏
            }

            // --- E. 绑定点击事件 ---
            // 注意：clone 是一个 DocumentFragment，不能直接加 onclick
            // 我们需要给里面的 .contact-item 元素加事件
            const itemDiv = clone.querySelector('.contact-item');
            itemDiv.onclick = () => App.enterChat(c.id);

            // 4. 将填好数据的克隆体加入页面
            this.els.contactContainer.appendChild(clone);
        });
    },

    // ★★★ 渲染世界书：大分类下拉框 ★★★
    renderBookSelect() {
        if (!this.els.wiBookSelect) return;
        this.els.wiBookSelect.innerHTML = '';
        STATE.worldInfoBooks.forEach(book => {
            const opt = document.createElement('option');
            opt.value = book.id;
            opt.innerText = book.name;
            this.els.wiBookSelect.appendChild(opt);
        });
        this.els.wiBookSelect.value = STATE.currentBookId;
        
        // 更新当前书的全局绑定状态
        this.updateCurrentBookSettingsUI();
    },

    updateCurrentBookSettingsUI() {
        const book = STATE.worldInfoBooks.find(b => b.id === STATE.currentBookId);
        if (book && this.els.wiBookCharSelect) {
            this.els.wiBookCharSelect.value = book.characterId || "";
        }
    },

    // ★★★ 渲染世界书：条目列表（纯逻辑版）★★★
    renderWorldInfoList() {
        const container = this.els.wiList;
        if (!container) return;
        container.innerHTML = '';

        const currentBook = STATE.worldInfoBooks.find(b => b.id === STATE.currentBookId);
        if (!currentBook) return;

        const currentEditingUid = document.getElementById('wi-edit-uid') 
            ? document.getElementById('wi-edit-uid').value 
            : null;

        currentBook.entries.forEach((entry) => {
            const item = document.createElement('div');
            item.classList.add('wi-list-item');

            // 高亮当前编辑中的条目
            if (entry.uid === currentEditingUid) {
                item.classList.add('wi-list-item-active');
            }

            // ★★★ 核心显示逻辑 ★★★
            let displayName = entry.comment || 
                (Array.isArray(entry.keys) && entry.keys.length > 0 ? entry.keys[0] : '未命名条目');

            const typeEmoji = entry.constant ? '📌' : '🔎';
            item.textContent = `${typeEmoji} ${displayName}`;

            item.onclick = () => App.loadWorldInfoEntry(entry.uid);
            container.appendChild(item);
        });
    },



    // ★★★ 初始化世界书 Tab 的数据 ★★★
    initWorldInfoTab() {
        // 1. 填充书的全局绑定角色下拉框
        const charSelect = this.els.wiBookCharSelect;
        if (charSelect) {
            charSelect.innerHTML = '<option value="">全局 (对所有角色生效)</option>';
            STATE.contacts.forEach(c => {
                const opt = document.createElement('option');
                opt.value = c.id;
                opt.innerText = c.name;
                charSelect.appendChild(opt);
            });
        }
        
        // 2. 渲染大分类，并触发一次列表渲染
        this.renderBookSelect();
        this.renderWorldInfoList();
        App.clearWorldInfoEditor(); 
    },

    

    // renderChatHistory(contact) {
    //     this.els.chatMsgs.innerHTML = '';
    //     this.els.chatTitle.innerText = contact.name;
        
    //     contact.history.forEach((msg, historyIndex) => {  // ← 新增 historyIndex
    //         if (msg.role === 'system') return;
    //         const sender = msg.role === 'assistant' ? 'ai' : 'user';

    //         let cleanText = typeof msg === 'string' ? msg : msg.content || '';
            
    //         if (sender === 'user') {
    //             cleanText = cleanText.replace(/^\[[A-Z][a-z]{2}\.\d{1,2}\s\d{2}:\d{2}\]\s/, '');
    //         }

    //         const msgTime = typeof msg === 'string' ? null : msg.timestamp;
            
    //         const paragraphs = cleanText.split(/\n\s*\n/).filter(p => p.trim());
            
    //         if (paragraphs.length === 0 && !cleanText.trim()) return;

    //         // ★★★ 新增：创建消息组容器 ★★★
    //         const group = document.createElement('div');
    //         group.className = 'message-group';
    //         group.dataset.msgIndex = historyIndex;  // 关键：标记属于 history 的第几条
    //         group.dataset.sender = sender;

    //         if (paragraphs.length > 0) {
    //             paragraphs.forEach(p => {
    //                 const bubbleClone = this.createSingleBubble(p.trim(), sender, contact.avatar, msgTime, historyIndex);
    //                 group.appendChild(bubbleClone);
    //             });
    //         } else {
    //             const bubbleClone = this.createSingleBubble(cleanText.trim(), sender, contact.avatar, msgTime, historyIndex);
    //             group.appendChild(bubbleClone);
    //         }

    //         this.els.chatMsgs.appendChild(group);
    //     });

    //     this.scrollToBottom();
    //     this.updateRerollState(contact);
    // },

    createSingleBubble(text, sender, aiAvatarUrl, timestampRaw, historyIndex, shouldAnimate = true, partIndex = 0, imageUrl = null, isThought = false) {
        const template = document.getElementById('msg-template');
        const clone = template.content.cloneNode(true);
        
        const wrapper = clone.querySelector('.message-wrapper');
        const bubble = clone.querySelector('.message-bubble');
        const timeSpan = clone.querySelector('.msg-time');
        const avatarImg = clone.querySelector('.avatar-img');
        const avatarText = clone.querySelector('.avatar-text');

        wrapper.classList.add(sender);

        // 1. 设置文本
        // 1. 设置文本 (★★★ 新增：判断是否为思考过程 ★★★)
        if (isThought) {
            bubble.innerHTML = `
                <details class="thought-process">
                    <summary></summary>
                    <div class="thought-content">${text}</div>
                </details>
            `;
            // 给它一个特殊类名，方便以后做额外处理（比如过滤复制等）
            bubble.classList.add('is-thought-bubble');

            // ★★★ 新增：点击内容区关闭气泡（同时兼容防误触复制） ★★★
            const detailsEl = bubble.querySelector('details');
            const contentEl = bubble.querySelector('.thought-content');
            
            contentEl.addEventListener('click', (e) => {
                // 如果用户当前划选了文字准备复制，不要关闭气泡
                if (window.getSelection().toString().length > 0) {
                    return;
                }
                // 否则，移除 open 属性，实现关闭
                detailsEl.removeAttribute('open');
            });
            // ★★★ 结束：点击内容区关闭气泡（同时兼容防误触复制）结束 ★★★



        } else {
            bubble.innerHTML = text; 
        }



        
        // 2. ★★★ 插入图片 ★★★
        // 2. ★★★ 插入图片 (含过期处理) ★★★
        if (imageUrl) {
            // ★ 分支 A：图片已过期
            if (imageUrl === 'expired') {
                const placeholder = document.createElement('div');
                placeholder.className = 'expired-image-placeholder';
                // 这里你可以自定义显示的文字和 Emoji
                placeholder.innerHTML = '🍂 图片已清理'; 
                
                // 只有文本不为空时，才加 margin-top
                if (text) placeholder.style.marginTop = '8px';
                
                bubble.appendChild(placeholder);
            } 
            // ★ 分支 B：正常图片
            else {
                const imgEl = document.createElement('img');
                imgEl.src = imageUrl;
                imgEl.className = 'chat-message-image'; // 使用之前 CSS 定义的类
                
                // 判断：如果有文本，图片上面要留点空隙
                const marginTop = text ? '8px' : '0';
                imgEl.style.marginTop = marginTop;

                // ★★★ 核心修改：点击事件加判断 ★★★
                imgEl.onclick = (e) => {
                    // 如果处于多选模式，什么都不做，让事件冒泡给 chatMsgs 的处理器去处理选中
                    if (STATE.isSelectMode) return; 

                    // 否则，阻止冒泡并打开灯箱
                    e.stopPropagation();
                    this.openImageLightbox(imageUrl);
                };


                bubble.appendChild(imgEl);
            }
        }
        
        // 3. 动效
        if (shouldAnimate) wrapper.classList.add('bubble-enter'); 

        // 4. 绑定索引
        bubble.dataset.msgIndex = historyIndex;
        bubble.dataset.partIndex = partIndex; 
        bubble.className += ' selectable-message';

        // 5. 时间
        let timeStr = "";
        if (timestampRaw && timestampRaw.includes(' ')) {
            timeStr = timestampRaw.split(' ')[1]; 
        } else {
            const n = new Date();
            timeStr = `${String(n.getHours()).padStart(2,'0')}:${String(n.getMinutes()).padStart(2,'0')}`;
        }
        timeSpan.innerText = timeStr;

        // 6. 头像
        let currentAvatar = sender === 'user' ? (STATE.settings.USER_AVATAR || 'user.jpg') : (aiAvatarUrl || '🌸');
        const isImage = currentAvatar.startsWith('http') || currentAvatar.startsWith('data:');
        if (isImage) {
            avatarImg.src = currentAvatar;
            avatarImg.onerror = () => { avatarImg.style.display='none'; avatarText.style.display='flex'; avatarText.innerText='?'; };
            avatarText.style.display = 'none';
        } else {
            avatarImg.style.display = 'none';
            avatarText.style.display = 'flex'; 
            avatarText.innerText = currentAvatar;
        }

        return clone;
    },

    // ★★★ 新增：简单的图片灯箱 (Lightbox) ★★★
    openImageLightbox(src) {
        // 创建遮罩
        const overlay = document.createElement('div');
        overlay.style.cssText = "position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.9); z-index: 9999; display: flex; align-items: center; justify-content: center; cursor: zoom-out; opacity: 0; transition: opacity 0.2s;";
        
        // 创建图片
        const img = document.createElement('img');
        img.src = src;
        img.style.cssText = "max-width: 95%; max-height: 95%; object-fit: contain; transition: transform 0.2s;";
        
        overlay.appendChild(img);
        document.body.appendChild(overlay);

        // 动画显示
        requestAnimationFrame(() => { overlay.style.opacity = '1'; });

        // 点击关闭
        overlay.onclick = () => {
            overlay.style.opacity = '0';
            setTimeout(() => overlay.remove(), 200);
        };
    },




    // 【6. UI RENDERER】
    showEditModal(oldText, onConfirmCallback) {
        const modal = document.getElementById('msg-edit-modal');
        const textarea = document.getElementById('edit-msg-textarea');
        const btnCancel = document.getElementById('btn-edit-cancel');
        const btnConfirm = document.getElementById('btn-edit-confirm');

        // 1. 填入旧内容
        textarea.value = oldText;

        // 2. 显示弹窗
        modal.style.display = 'flex';
        textarea.focus(); // 自动聚焦

        // 3. 定义关闭函数
        const closeModal = () => {
            modal.style.display = 'none';
            // 清理事件，防止多次绑定导致重复触发
            btnConfirm.onclick = null;
            btnCancel.onclick = null;
        };

        // 4. 绑定按钮事件
        btnCancel.onclick = () => {
            closeModal();
        };

        btnConfirm.onclick = () => {
            const newText = textarea.value;
            // 调用回调函数，把新文本传回去
            if (onConfirmCallback) onConfirmCallback(newText);
            closeModal();
        };
    },

    // 【6. UI RENDERER】
    removeLatestAiBubbles() {
        const container = this.els.chatMsgs;
        
        // 获取最后一个元素
        const lastEl = container.lastElementChild;
        if (!lastEl) return;

        // 判断身份
        const isAiGroup = lastEl.dataset.sender === 'ai'; 
        const isAiBubble = lastEl.classList.contains('ai'); // 兼容旧代码

        // 只要最后一个是 AI 发的，就删掉这一个（因为这一个里面包含了整组切分后的句子）
        if (isAiGroup || isAiBubble) {
            lastEl.remove();
            // 关键：不要用 while 循环，删一次就够了！
        }
    },


    // 渲染历史记录
// 渲染历史记录
    renderChatHistory(contact, isLoadMore = false, keepScrollPosition = false) {
        const chatMsgs = this.els.chatMsgs;
        const scrollContainer = chatMsgs.parentElement; 

        // ★★★ 1. 只有在“首次完全加载”且“不是跳转模式”时，才隐藏界面，防止闪烁 ★★★
        if (!isLoadMore && !keepScrollPosition && STATE.chatMode !== 'jump') {
            chatMsgs.style.opacity = '0'; 
        }

        let previousScrollHeight = 0;
        let previousScrollTop = 0;
        if (isLoadMore) {
            previousScrollHeight = scrollContainer.scrollHeight;
            previousScrollTop = scrollContainer.scrollTop;
        }

        chatMsgs.innerHTML = '';
        this.els.chatTitle.innerText = contact.name;

        const totalMsgs = contact.history.length;
        
        // ============================================
        // ★★★ 新增：根据当前模式计算渲染范围 ★★★
        // ============================================
        let startIndex, endIndex;
        if (STATE.chatMode === 'jump') {
            startIndex = STATE.jumpStartIndex;
            endIndex = STATE.jumpEndIndex;
        } else {
            endIndex = totalMsgs;
            startIndex = totalMsgs - STATE.visibleMsgCount;
            if (startIndex < 0) startIndex = 0;
        }

        // ============================================
        // ★★★ 修改：渲染顶部的“加载更早/更多消息”按钮 ★★★
        // ============================================
        if (startIndex > 0) {
            const loadPrevBtn = document.createElement('div');
            loadPrevBtn.className = 'load-more-btn';
            loadPrevBtn.innerText = STATE.chatMode === 'jump' ? '点击加载更早消息' : '点击加载更多消息';
            loadPrevBtn.onclick = () => {
                if (STATE.chatMode === 'jump') {
                    STATE.jumpStartIndex = Math.max(0, STATE.jumpStartIndex - CONFIG.CHAT_PAGE_SIZE);
                } else {
                    STATE.visibleMsgCount += CONFIG.CHAT_PAGE_SIZE;
                }
                this.renderChatHistory(contact, true);
            };
            chatMsgs.appendChild(loadPrevBtn);
        }

        // 遍历并渲染消息 (基于计算好的范围)
        for (let i = startIndex; i < endIndex; i++) {
            const msg = contact.history[i];
            const historyIndex = i; 

            if (msg.role === 'system') continue;
            
            const sender = msg.role === 'assistant' ? 'ai' : 'user';
            let cleanText = typeof msg === 'string' ? msg : msg.content || '';
            
            // 处理 User 时间戳
            if (sender === 'user') {
                cleanText = cleanText.replace(/^\[[A-Z][a-z]{2}\.\d{1,2}\s\d{2}:\d{2}\]\s/, '');
            }

            // 处理 AI 引用格式
            if (sender === 'ai') {
                 cleanText = cleanText.replace(/(^|\n)>\s*/g, '\n\n');
            }

            const msgTime = typeof msg === 'string' ? null : msg.timestamp;

            // 提取历史消息中的思考过程
            let thoughtContent = null;
            if (sender === 'ai') {
                cleanText = cleanText.replace(/<(?:think|thinking|thought)>([\s\S]*?)<\/(?:think|thinking|thought)>/gi, (match, inner) => {
                    thoughtContent = inner.trim();
                    return '';
                });
            }

            let displayImage = null; 
            if (msg.images && msg.images.length > 0) {
                displayImage = msg.images[0];
            } else if (msg.isImageExpired) {
                displayImage = 'expired'; 
            }

            const paragraphs = cleanText.split(/\n\s*\n/).filter(p => p.trim());
            const group = document.createElement('div');
            group.className = 'message-group';

            if (msg.isHidden) group.classList.add('is-hidden'); 
            group.dataset.msgIndex = historyIndex;
            group.dataset.sender = sender;
            const hiddenIndices = msg.hiddenIndices || [];

            // ===============================================
            // ★★★ 新增：如果是跳转查找到的目标，给最外层容器加 ID ★★★
            // ===============================================
            if (STATE.chatMode === 'jump' && historyIndex === STATE.targetHighlightIndex) {
                group.id = `msg-bubble-${historyIndex}`;
            }

            // 优先渲染思考气泡
            if (thoughtContent) {
                 const formattedThought = parseCustomMarkdown(thoughtContent);
                 const thoughtBubble = this.createSingleBubble(
                     formattedThought, sender, contact.avatar, msgTime, historyIndex, false, 'thought', null, true
                 );
                 if (msg.isHidden || hiddenIndices.includes('thought')) {
                     thoughtBubble.querySelector('.message-bubble').classList.add('is-hidden-bubble');
                 }
                 group.appendChild(thoughtBubble);
            }
            
            // 第一步：先渲染所有的【文字气泡】
            if (paragraphs.length > 0) {
                paragraphs.forEach((p, j) => {
                    const trimmedP = p.trim();
                    if (trimmedP === '---') {
                        const separator = document.createElement('div');
                        separator.className = 'chat-separator'; 
                        group.appendChild(separator);
                    } else {
                        const formattedContent = parseCustomMarkdown(trimmedP);
                        const bubbleClone = this.createSingleBubble(
                            formattedContent, sender, contact.avatar, msgTime, historyIndex, false, j, null 
                        );

                        if (hiddenIndices.includes(j)) {
                            bubbleClone.querySelector('.message-bubble').classList.add('is-hidden-bubble');
                        }
                        group.appendChild(bubbleClone);
                    }
                });
            } else if (!displayImage) {
                const formattedContent = parseCustomMarkdown(cleanText.trim());
                const bubbleClone = this.createSingleBubble(formattedContent, sender, contact.avatar, msgTime, historyIndex, false, 0, null);
                group.appendChild(bubbleClone);
            }

            // 第二步：如果有图，在最后单独追加一个【图片气泡】
            if (displayImage) {
                const imgPartIndex = paragraphs.length;
                const imgBubble = this.createSingleBubble(
                    "", sender, contact.avatar, msgTime, historyIndex, false, imgPartIndex, displayImage
                );
                if (hiddenIndices.includes(imgPartIndex) || msg.isHidden) {
                    imgBubble.querySelector('.message-bubble').classList.add('is-hidden-bubble');
                }
                group.appendChild(imgBubble);
            }

            chatMsgs.appendChild(group);
        }

        // ============================================
        // ★★★ 新增：渲染底部的“加载更新消息”按钮 (仅跳转模式) ★★★
        // ============================================
        if (STATE.chatMode === 'jump') {
            if (endIndex < totalMsgs) {
                const loadNextBtn = document.createElement('div');
                loadNextBtn.className = 'load-next-btn';
                loadNextBtn.innerText = '点击加载更新消息';
                loadNextBtn.onclick = () => {
                    STATE.jumpEndIndex = Math.min(totalMsgs, STATE.jumpEndIndex + CONFIG.CHAT_PAGE_SIZE);
                    // 向下加载不保持视口，直接加在末尾让用户可以往下滚
                    this.renderChatHistory(contact, false, true); 
                };
                chatMsgs.appendChild(loadNextBtn);
            } else {
                const backToNormalBtn = document.createElement('div');
                backToNormalBtn.className = 'back-to-normal-btn';
                backToNormalBtn.innerText = '✅ 已到达最新消息 (点击恢复自动滚动)';
                backToNormalBtn.onclick = () => {
                    STATE.chatMode = 'normal';
                    STATE.visibleMsgCount = totalMsgs - startIndex;
                    this.renderChatHistory(contact);
                    this.scrollToBottom();
                };
                chatMsgs.appendChild(backToNormalBtn);
            }
        }


        // ★★★ 2. 滚动与显形处理 ★★★
        if (isLoadMore) {
            // 加载上方更早历史：保持视口当前看到的元素位置不变
            const newScrollHeight = scrollContainer.scrollHeight;
            scrollContainer.scrollTop = newScrollHeight - previousScrollHeight + previousScrollTop;
        } else if (keepScrollPosition) {
            // 保持不动，给加载下方消息用
        } else {
            // 首次加载
            if (STATE.chatMode === 'jump') {
                // 【跳转模式核心】：跳过滚动到底部，交给外部 scrollIntoView 处理
                chatMsgs.style.opacity = '1';
            } else {
                // 【正常模式】：执行滚到底部
                this.scrollToBottom();
                requestAnimationFrame(() => {
                    this.scrollToBottom(); 
                    chatMsgs.style.opacity = '1'; 
                });
            }
        }

        this.updateRerollState(contact);
    },


/* 1212 - Fixed */
    appendMessageBubble(text, sender, aiAvatarUrl, timestampRaw, historyIndex = null) {
        if (historyIndex === null || historyIndex === undefined) {
            const contact = STATE.contacts.find(c => c.id === STATE.currentContactId);
            if (contact && contact.history.length > 0) {
                historyIndex = contact.history.length - 1; 
            } else {
                historyIndex = 0;
            }
        }

        // ★★★ 修改：最后一个参数传 true，表示新消息需要动画 ★★★
        const clone = this.createSingleBubble(text, sender, aiAvatarUrl, timestampRaw, historyIndex, true, 0);

        const existingGroup = Array.from(this.els.chatMsgs.children)
            .reverse()
            .find(group => group.classList.contains('message-group') && 
                        parseInt(group.dataset.msgIndex) === historyIndex);

        if (existingGroup) {
            existingGroup.appendChild(clone);
        } else {
            const group = document.createElement('div');
            group.className = 'message-group';
            group.dataset.msgIndex = historyIndex; 
            group.dataset.sender = sender;
            group.appendChild(clone);
            this.els.chatMsgs.appendChild(group);
        }

        this.scrollToBottom();
    },

    // 【修改后】插入分割线，支持动效参数
    appendSeparator(shouldAnimate = false) {
        const separator = document.createElement('div');
        separator.className = 'chat-separator';
        
        // 如果需要动画，就加上这个类
        if (shouldAnimate) {
            separator.classList.add('animate');
        }
        
        this.els.chatMsgs.appendChild(separator);
        this.scrollToBottom();
    },

    scrollToBottom() {
        this.els.chatMsgs.parentElement.scrollTop = this.els.chatMsgs.parentElement.scrollHeight;
    },

    // UI渲染：对方正在输入
    setLoading(isLoading, contactId) { // ★★★ 参数 contactId 依然是必需的
        // 1. 更新全局状态，让程序知道“谁”在输入
        STATE.typingContactId = isLoading ? contactId : null;
        
        // 2. 关键检查：只有当这个状态更新是针对“当前打开的”聊天窗口时，才刷新UI
        if (contactId === STATE.currentContactId) {
            this.els.sendBtn.disabled = isLoading;

            if (isLoading) {
                // ★★★ 恢复您原来的文本
                this.els.status.innerText = '对方正在输入'; 
                this.els.status.classList.add('typing');
            } else {
                // ★★★ 恢复您原来的文本
                this.els.status.innerText = '在线';
                this.els.status.classList.remove('typing');
            }
        }
    },

    updateRerollState(contact) {
        const hasHistory = contact.history.some(m => m.role === 'assistant');
        this.els.rerollBtn.style.opacity = hasHistory ? '1' : '0.5';
        this.els.rerollBtn.disabled = !hasHistory;
    },


    // 在 UI 对象中
    async playWaterfall(fullText, avatar, timestamp, historyIndex) {
        // ★★★ 1. 强制重置滚动状态（新消息开始时默认跟随，除非你不想） ★★★
        this.autoScrollEnabled = true;
        this.scrollToBottom(); // 初始先滚到底一次

        // ============================================
        // ★★★ 新增：前置提取思考过程 (防止被换行符切碎) ★★★
        // ============================================
        let thoughtContent = null;
        let processedText = fullText.replace(/<(?:think|thinking|thought)>([\s\S]*?)<\/(?:think|thinking|thought)>/gi, (match, innerText) => {
            thoughtContent = innerText.trim();
            return ''; // 将思考内容从正文中抹除
        });

        // 1. Pre-process text
        processedText = processedText.replace(/(^|\n)>\s*/g, '\n\n');
        const paragraphs = processedText.split(/\n\s*\n/).filter(p => p.trim());
        
        // 2. Create the container group
        const group = document.createElement('div');
        group.className = 'message-group';
        group.dataset.sender = 'ai';
        group.dataset.msgIndex = historyIndex;

        this.els.chatMsgs.appendChild(group);
        


        // ============================================
        // ★★★ 新增：优先渲染“思考折叠面板”气泡 ★★★
        // ============================================
        if (thoughtContent) {
            // 解析里面可能的 Markdown，传入 isThought = true 参数
            const htmlContent = parseCustomMarkdown(thoughtContent);
            const thoughtBubble = this.createSingleBubble(
                htmlContent, 'ai', avatar, timestamp, historyIndex, true, 'thought', null, true
            );
            group.appendChild(thoughtBubble);
            
            if (this.autoScrollEnabled) this.scrollToBottom();
            // 给个小延迟，让动画自然点
            await new Promise(r => setTimeout(r, 400)); 
        }



        // 3. Loop through paragraphs
        for (let i = 0; i < paragraphs.length; i++) {
            if (i > 0) await new Promise(r => setTimeout(r, 400));
            
            const p = paragraphs[i].trim();

            if (p === '---') {
                const separator = document.createElement('div');
                separator.className = 'chat-separator animate';
                group.appendChild(separator);
            } else {
                const htmlContent = parseCustomMarkdown(p);
                // 这里 isThought 默认为 false，正常渲染文本
                const bubbleClone = this.createSingleBubble(htmlContent, 'ai', avatar, timestamp, historyIndex, true, i);
                group.appendChild(bubbleClone);
            }
            
            // ★★★ 核心修改：只有在允许滚动时才滚到底部 ★★★
            if (this.autoScrollEnabled) {
                this.scrollToBottom();
            }
        }
    },

    // ================顶栏状态栏-------------------
    initStatusBar() { 
        // 1. 时间显示逻辑
        const timeEl = document.getElementById('sb-time');
        const updateTime = () => {
            const now = new Date();
            // 获取 HH:mm 格式
            const timeStr = now.toLocaleTimeString('zh-CN', { 
                hour: '2-digit', 
                minute: '2-digit', 
                hour12: false 
            });
            if (timeEl) timeEl.textContent = timeStr;
        };
        updateTime(); 
        setInterval(updateTime, 1000); 

        // 2. 电量显示逻辑
        const batTextEl = document.getElementById('sb-battery-text');
        const batLevelEl = document.getElementById('sb-battery-level');
        
        const updateBatteryUI = (level, isCharging) => {
            const percentage = Math.round(level * 100);
            if(batTextEl) batTextEl.textContent = `${percentage}%`;
            if(batLevelEl) {
                batLevelEl.style.width = `${percentage}%`;
                if (isCharging) {
                    batLevelEl.style.backgroundColor = '#a8d94c85';
                } else if (level < 0.2) {
                    batLevelEl.style.backgroundColor = '#ff3b3085';
                } else {
                    batLevelEl.style.backgroundColor = '#4cd96485'; 
                }
            }
        };

        if ('getBattery' in navigator) {
            navigator.getBattery().then(battery => {
                updateBatteryUI(battery.level, battery.charging);
                battery.addEventListener('levelchange', () => {
                    updateBatteryUI(battery.level, battery.charging);
                });
                battery.addEventListener('chargingchange', () => {
                    updateBatteryUI(battery.level, battery.charging);
                });
            }).catch(err => {
                console.log('Battery API failed:', err);
            });
        } else {
            console.log('Battery API not supported.');
        }
    }, // <--- 别忘了这里的逗号，因为下面还有 renderPresetMenu

    // ================顶栏状态栏结束-------------------

    // ★★★ API 预设菜单 UI (逻辑修正版) ★★★
    renderPresetMenu() {
        const containerId = 'api-preset-container';
        let container = document.getElementById(containerId);

        if (container) {
            const saveBtn = document.getElementById('save-preset-btn');
            const delBtn = document.getElementById('del-preset-btn');
            const select = document.getElementById('preset-select');

            if(saveBtn) saveBtn.onclick = () => App.handleSavePreset();
            if(delBtn) delBtn.onclick = () => App.handleDeletePreset();
            if(select) select.onchange = (e) => App.handleLoadPreset(e.target.value);

            select.innerHTML = '<option value="">-- 选择 API 预设 --</option>';
            if (STATE.settings.API_PRESETS && Array.isArray(STATE.settings.API_PRESETS)) {
                STATE.settings.API_PRESETS.forEach((p, index) => {
                    const opt = document.createElement('option');
                    opt.value = index;
                    opt.innerText = p.name;
                    select.appendChild(opt);
                });
            }
        }
    }

    
};

// =========================================
// 7. APP CONTROLLER (业务逻辑)
// =========================================
const App = {
    els: UI.els,
    // 1. 初始化入口
    async init() {
        // [关键点 1] 加上 await，程序会在这里暂停，直到数据库加载完毕
        await Storage.load();
        
        // [关键点 2] 初始化界面元素（绑定 DOM 节点）
        UI.init();

        // ★ 建议加这一句，确保 App.els 拿到的是初始化后的最新 DOM 元素
        this.els = UI.els; 
        
        // [关键点 3] 绑定点击事件
        this.bindEvents();
        
        // [关键点 4] ★★★ 新增：数据加载好了，必须手动让 UI 渲染出联系人列表
        // 假设你的 UI 对象里有一个叫 renderContacts 或 renderSidebar 的方法用来画列表
        // 如果你的 UI.init() 里已经包含渲染逻辑，这行也可以省略，但显式调用更保险
        if (typeof UI.renderContacts === 'function') {
            UI.renderContacts();
        }
        
        UI.initStatusBar();
        
        console.log("App initialized, contacts loaded:", STATE.contacts.length);
    },

    // APP CONTROLLER.enterChat
    enterChat(id) {
        const contact = STATE.contacts.find(c => c.id === id);
        if (!contact) return;
        
        STATE.currentContactId = id;
        STATE.visibleMsgCount = CONFIG.CHAT_PAGE_SIZE;

        UI.switchView('chat');

        // ★★★ 新增：进入聊天时，根据全局状态，正确设置顶部的“正在输入”或“在线”状态
        // 检查当前是不是应该显示“正在输入”
        const isLoading = STATE.typingContactId === id;
        // 更新UI（即使isLoading是false，也需要调用一次来把状态文字设置为当前联系人名）
        UI.setLoading(isLoading, id);


        if (contact.hasNewMsg) {
            contact.hasNewMsg = false; 
            Storage.saveContacts(); 
        }

        UI.renderChatHistory(contact);
        UI.renderContacts(); 
    },
    

    // APP CONTROLLER.handleSend
    async handleSend(isReroll = false) {
        const contact = STATE.contacts.find(c => c.id === STATE.currentContactId);
        if (!contact) return;

        // ============================================================
        // 1. 准备 API 配置 (★★★ 核心修改区域 ★★★)
        // ============================================================
        
        // 1.1 先载入全局默认设置 (带上 MAX_TOKENS 和 TEMPERATURE)
        let requestSettings = {
            API_URL: STATE.settings.API_URL,
            API_KEY: STATE.settings.API_KEY,
            MODEL:   STATE.settings.MODEL,
            MAX_TOKENS: STATE.settings.MAX_TOKENS,   // ★ 新增
            TEMPERATURE: STATE.settings.TEMPERATUR,  // ★ 新增
            CONTEXT_LIMIT: STATE.settings.CONTEXT_LIMIT || 30 // ★★★ 新增：载入全局上下文条数
        };

        // 1.2 检查预设覆盖
        if (contact.linkedPresetName) {
            const presets = STATE.settings.API_PRESETS || [];
            const targetPreset = presets.find(p => p.name === contact.linkedPresetName);
            
            if (targetPreset) {
                console.log(`[System] 使用角色专属预设: ${targetPreset.name}`);
                
                // ★★★ 关键修改：直接修改属性，而不是替换整个对象，防止丢失其他字段
                requestSettings.API_URL = targetPreset.url;
                requestSettings.API_KEY = targetPreset.key;
                requestSettings.MODEL = targetPreset.model;

                // ★★★ 关键修改：把预设里的参数读进去
                if (targetPreset.max_tokens) {
                    requestSettings.MAX_TOKENS = parseInt(targetPreset.max_tokens);
                }
                if (targetPreset.temperature !== undefined) {
                    requestSettings.TEMPERATURE = parseFloat(targetPreset.temperature);
                }
                // ★★★ 新增：如果预设里存了上下文条数，则覆盖全局设置
                if (targetPreset.context_limit) {
                    requestSettings.CONTEXT_LIMIT = parseInt(targetPreset.context_limit);
                }

            } else {
                console.warn(`[System] 绑定的预设 "${contact.linkedPresetName}" 未找到，已回退到全局设置。`);
            }
        }

        // 1.3 简单的配置检查
        if (!requestSettings.API_URL || !requestSettings.API_KEY || !requestSettings.MODEL) {
            alert('API配置缺失！请检查设置。');
            return;
        }

        // 调试日志：看看最终发出去的参数对不对
        console.log("最终发送参数:", { 
            model: requestSettings.MODEL, 
            tokens: requestSettings.MAX_TOKENS, 
            temp: requestSettings.TEMPERATURE,
            historyLimit: requestSettings.CONTEXT_LIMIT, // ★ 打印看看对不对
        });



        // ============================================================
        // 2. 准备发送内容 (Reroll vs New Message)
        // ============================================================
        let userText = UI.els.input.value.trim();
        const timestamp = formatTimestamp();
        
        // ★ 判断是否有待发送的图片 (只有非 Reroll 时才处理新图)
        const hasPendingImage = (STATE.pendingImage && !isReroll);
        let imageDescription = ""; 
        let currentImageBase64 = null;

        // 如果既没文本也没图，且不是reroll，就退出
        if (!isReroll && !userText && !hasPendingImage) return;

        // =================================================================
        // ★★★ 第一步：如果是 Reroll，先弹窗问用户确不确定 ★★★
        // =================================================================
        if (isReroll) {
            const isConfirmed = confirm("重新生成消息？"); 
            if (!isConfirmed) return; // 如果点取消，直接退出，页面一动不动，还在看历史
        }
        
        // =================================================================
        // ★★★ 第二步：现在确认要发消息（或确认Reroll）了，强制切回最新底部 ★★★
        // =================================================================
        if (STATE.chatMode === 'jump') {
            STATE.chatMode = 'normal';
            STATE.visibleMsgCount = Math.max(CONFIG.CHAT_PAGE_SIZE, STATE.visibleMsgCount || 15);
            UI.renderChatHistory(contact);
        }
        // =================================================================

        // =================================================================
        // ★★★ 第三步：执行真正的 Reroll 或 发新消息逻辑 ★★★
        // =================================================================
        if (isReroll) {
            const lastUserMsg = [...contact.history].reverse().find(m => m.role === 'user');
            if (!lastUserMsg) return;
            // Reroll 复用历史记录里的文本
            userText = lastUserMsg.content;
            
            // 【建议】Reroll 时应清空当前可能存在的待发送图片，防止逻辑混淆
            // (虽然 API 可能主要看 history，但保持状态纯净更安全)
            currentImageBase64 = null; 
            
            // 移除最近的 AI 回复
            while(contact.history.length > 0 && contact.history[contact.history.length-1].role === 'assistant') {
                contact.history.pop();
            }
            UI.removeLatestAiBubbles();
        } 

        // New Message 逻辑：上屏 & 识图
        else {
            // 1. 决定图片数据
            if (hasPendingImage) {
                currentImageBase64 = STATE.pendingImage;
            }

            // 2. 立即在 UI 显示用户消息
            const currentMsgIndex = contact.history.length; // 即将存入的索引
            const paragraphs = userText.split(/\n\s*\n/).filter(p => p.trim());
            
            const group = document.createElement('div');
            group.className = 'message-group';
            group.dataset.msgIndex = currentMsgIndex;
            group.dataset.sender = 'user';

            // --- 修复点开始 ---
            
            // 2.1 渲染文本部分
            // 只要有文本就渲染文本气泡，不处理图片
            if (paragraphs.length > 0) {
                paragraphs.forEach((p, index) => {
                    if (p.trim() === '---') {
                        // ✅ 正确做法：创建一个节点，然后塞进 group
                        const separator = document.createElement('div');
                        separator.className = 'chat-separator animate';
                        group.appendChild(separator); 
                    } else {
                        // ★ 纯文本气泡，传 null (不带图)
                        const bubble = UI.createSingleBubble(
                            parseCustomMarkdown(p.trim()), 'user', null, timestamp, currentMsgIndex, true, index, null
                        );
                        group.appendChild(bubble);
                    }
                });
            } 
            // 删除了原本这里的 else if (hasPendingImage) {...} 
            // 因为它和下面的逻辑重复，会导致纯图发送时出现两个气泡

            // 2.2 ★★★ 统一渲染图片气泡 ★★★
            // 无论是“纯图”还是“文+图”，图片都由此处统一生成
            if (currentImageBase64) {
                // 这是一个只有图的气泡
                // 注意：index 使用 paragraphs.length，这样如果上面有文本，图片的 index 就是接在文本后面的
                const imgBubble = UI.createSingleBubble(
                    "", 'user', null, timestamp, currentMsgIndex, true, paragraphs.length, currentImageBase64
                );
                group.appendChild(imgBubble);
            }

            // --- 修复点结束 ---

            UI.els.chatMsgs.appendChild(group);
            UI.scrollToBottom();

            // 3. UI 清理 (清空输入框和预览)
            UI.els.input.value = '';
            UI.els.input.style.height = '38px'; // ★★★ 就是这里！发送后，把输入框高度重置回 38px ★★★
            if (UI.els.previewContainer) UI.els.previewContainer.style.display = 'none'; // 隐藏预览
            STATE.pendingImage = null; // ★ 清空暂存，防止下次误发
            if (window.innerWidth < 800) UI.els.input.blur();

            // 4. ★★★ 核心分支：如果有图，先跑识图 API ★★★
            // 4. ★★★ 核心分支：如果有图，先跑识图 API ★★★
            if (hasPendingImage) {
                UI.setLoading(true, contact.id);
                try {
                    const visionSettings = {
                        // 稍微优化下默认值，如果这里是空字符串， fetch 会直接报错被 catch 捕获
                        url: STATE.settings.VISION_URL, 
                        key: STATE.settings.VISION_KEY || STATE.settings.API_KEY,
                        model: STATE.settings.VISION_MODEL || 'Qwen/Qwen3-VL-30B-A3B-Instruct',
                        prompt: STATE.settings.VISION_PROMPT || '描述这张图片'
                    };
                    
                    // 如果连 URL 都没填，直接抛出错误，不发请求了
                    if (!visionSettings.url) throw new Error("未配置视觉API地址");

                    imageDescription = await API.analyzeImage(currentImageBase64, visionSettings);

                } catch (err) {
                    console.error("识图流程跳过/失败:", err);
                    // ★ 给 AI 一个明确的提示，告诉它为什么看不见
                    imageDescription = "（系统提示：用户发送了一张图片，但由于未配置视觉模型或网络错误，无法提供图片内容的文本描述。请根据用户的文字上下文进行回复，如果需要，可以礼貌地询问图片内容。）";
                }
            }

            // 5. 存入历史记录 (Step 3 - Storage)
            // 构造新消息对象
            const newUserMsg = { 
                role: 'user', 
                content: `[${timestamp}] ${userText}`, // 注意：content 里不含描述，描述是后台用的
                timestamp: timestamp,
                // ★ 存图和描述
                images: currentImageBase64 ? [currentImageBase64] : null,
                image_description: imageDescription || null
            };

            // ★ 存储优化：只保留最后 3 张图的 base64，旧的删掉 base64 省空间
            let imgCount = 0;
            if (newUserMsg.images) imgCount++; 
            for (let i = contact.history.length - 1; i >= 0; i--) {
                if (contact.history[i].images && contact.history[i].images.length > 0) {
                    imgCount++;
                    if (imgCount > 3) {
                        contact.history[i].images = null; 
                        contact.history[i].isImageExpired = true; 
                    }
                }
            }
            
            contact.history.push(newUserMsg);
        }

        // 保存一次（包含刚刚优化的图片数据）
        await Storage.saveContacts();
        UI.setLoading(true, contact.id);

        // ============================================================
        // 3. 构建发送给 AI 的上下文 (缝合怪逻辑)
        // ============================================================
        
        // ★★★ 核心修改：使用 requestSettings.CONTEXT_LIMIT 替换写死的 30
        const limit = requestSettings.CONTEXT_LIMIT || 30; // 保底 30

        // 预处理 History (你的分段隐藏逻辑 + 我的图片描述注入)
        const recentHistory = contact.history
            .filter(m => m.role !== 'system' && !m.isHidden)
            .slice(-limit) // <--- ★★★ 这里修改了！使用动态变量) 
            .map(msg => {
                let content = msg.content || '';

                // ============================================
                // ★★★ 核心修改：发给 AI 前，抹除它以前的思考记录，节约 Token 防带偏
                // ============================================
                if (msg.role === 'assistant') {
                    content = content.replace(/<(?:think|thinking|thought)>[\s\S]*?<\/(?:think|thinking|thought)>/gi, '').trim();
                }




                
                // --- A. 分段隐藏处理 (保持你原有的逻辑) ---
                if (msg.hiddenIndices && msg.hiddenIndices.length > 0) {
                    const timestampRegex = /^\[[A-Z][a-z]{2}\.\d{1,2}\s\d{2}:\d{2}\]\s/;
                    let timestampPart = '';
                    if (msg.role === 'user') {
                        const match = content.match(timestampRegex);
                        if (match) {
                            timestampPart = match[0];
                            content = content.replace(timestampRegex, '');
                        }
                    }
                    let paragraphs = content.split(/\n\s*\n/);
                    let keptParagraphs = paragraphs.filter((_, index) => !msg.hiddenIndices.includes(index));
                    if (keptParagraphs.length === 0) return null; // 全部被隐藏
                    content = keptParagraphs.join('\n\n');
                    if (msg.role === 'user') content = timestampPart + content;
                }

                // --- B. ★★★ 核心缝合：注入图片描述 ★★★ ---
                // --- B. ★★★ 核心缝合：注入图片描述 (修复隐藏逻辑) ★★★ ---
                if (msg.image_description) {
                    // 1. 计算图片的索引 (必须和 render/delete 逻辑一致)
                    // 图片的索引总是等于“文本段落的数量”
                    // 注意：这里的 content 必须是尚未被 slice/filter 过的原始文本切分出的数量
                    // 为了保险，我们重新根据原始 full content 切分一次来算总数
                    let rawContent = msg.content || '';
                    if (msg.role === 'user') rawContent = rawContent.replace(/^\[[A-Z][a-z]{2}\.\d{1,2}\s\d{2}:\d{2}\]\s/, '');
                    if (msg.role === 'assistant') rawContent = rawContent.replace(/(^|\n)>\s*/g, '\n\n');
                    
                    const rawParagraphs = rawContent.split(/\n\s*\n/).filter(p => p.trim());
                    const imagePartIndex = rawParagraphs.length;

                    // 2. 检查这个索引是否在隐藏名单里
                    const isImageHidden = msg.hiddenIndices && msg.hiddenIndices.includes(imagePartIndex);

                    // 3. 只有当图片【没有】被隐藏时，才注入描述
                    if (!isImageHidden) {
                        content += `\n\n[System Info: 对方发送了一张图片，图片内容描述: ${msg.image_description}]`;
                    } else {
                        console.log("图片已隐藏，跳过注入描述");
                    }
                }

                return { role: msg.role, content: content };
            })
            .filter(m => m !== null);


        // 构造最终 Payload
        const messagesToSend = [
            { role: 'system', content: CONFIG.SYSTEM_PROMPT }, 
            { role: 'system', content: `=== User Prompt ===\n${contact.prompt}` }
        ];
        
        // World Info 扫描
        const worldInfoPrompt = WorldInfoEngine.scan(userText, recentHistory, contact.id, contact.name);
        if (worldInfoPrompt) {
            messagesToSend.push({ role: 'system', content: `=== 世界知识/环境信息 ===\n${worldInfoPrompt}` });
        }


        // ★★★ 【核心修改】检查心迹并注入 ★★★
        let momentsUpdateInfo = null;
        try {
            // 调用我们刚才写的辅助函数
            // 注意：如果你把函数放在 App 对象下，记得用 this.getMomentsContextForChat
            // 如果是定义在外部，直接用
            if (typeof this.getMomentsContextForChat === 'function') {
                momentsUpdateInfo = this.getMomentsContextForChat(contact.id);
            } else if (typeof App !== 'undefined' && typeof App.getMomentsContextForChat === 'function') {
                momentsUpdateInfo = App.getMomentsContextForChat(contact.id);
            }

            if (momentsUpdateInfo && momentsUpdateInfo.prompt) {
                console.log(`[Chat] 注入心迹动态 context (${momentsUpdateInfo.momentIds.length}条)`);
                // 把心迹信息加在 System Prompt 之后，历史记录之前
                messagesToSend.push({ 
                    role: 'system', 
                    content: momentsUpdateInfo.prompt 
                });
            }
        } catch (e) {
            console.warn("心迹注入失败:", e);
        }

        
        // 追加历史
        recentHistory.forEach(h => messagesToSend.push(h));

        // ============================================================
        // 4. 发送请求给 AI (Step 4)
        // ============================================================
        try {
            const aiText = await API.chat(messagesToSend, requestSettings);
            
            const aiTimestamp = formatTimestamp();
            contact.history.push({ role: 'assistant', content: aiText, timestamp: aiTimestamp });




            // ★★★ 【核心修改】AI回复成功后，扣除心迹通知次数 ★★★
            if (momentsUpdateInfo && momentsUpdateInfo.momentIds) {
                let anyChanged = false;
                momentsUpdateInfo.momentIds.forEach(mid => {
                    const m = STATE.moments.find(x => x.id === mid);
                    if (m && m.chatInjectionStatus && m.chatInjectionStatus[contact.id] > 0) {
                        m.chatInjectionStatus[contact.id]--; // 扣除一次
                        anyChanged = true;
                        console.log(`[Chat] 心迹 ${mid} 对角色 ${contact.name} 的剩余通知次数: ${m.chatInjectionStatus[contact.id]}`);
                    }
                });
                // 如果数据变了，记得保存心迹数据库
                if (anyChanged) {
                    if (typeof Storage.saveMoments === 'function') await Storage.saveMoments();
                    else if (typeof this.saveMoments === 'function') await this.saveMoments();
                }
            }






            // 只有当前还在这个窗口才渲染
            if (STATE.currentContactId === contact.id) {
                await Storage.saveContacts();
                
                // 渲染 AI 瀑布流
                const newAiMessageIndex = contact.history.length - 1;
                await UI.playWaterfall(aiText, contact.avatar, aiTimestamp, newAiMessageIndex); 
            } else {
                contact.hasNewMsg = true;
                await Storage.saveContacts();
                UI.renderContacts(); 
            }
            
            UI.setLoading(false, contact.id);
            
        } catch (error) {
            console.error(error);
            if (STATE.currentContactId === contact.id) {
                UI.setLoading(false, contact.id);
                const errorIndex = contact.history.length > 0 ? contact.history.length - 1 : 0;
                UI.appendMessageBubble(`(发送失败: ${error.message})`, 'ai', contact.avatar, null, errorIndex);
            }
        } finally {
            if (STATE.currentContactId === contact.id) {
                UI.updateRerollState(contact);
            }
            // 手机端不自动聚焦，防止键盘弹起遮挡
            if (window.innerWidth >= 800 && UI.els.input) UI.els.input.focus();
        }
    },

    openSettings() {
        UI.els.mainModal.classList.remove('hidden');
        const s = STATE.settings;
        UI.els.settingUrl.value = s.API_URL || '';
        UI.els.settingKey.value = s.API_KEY || '';
        
        // 注意：如果你有其他地方在 fetchModels，这里可能需要保留原有逻辑，或者直接显示当前 Model
        UI.els.settingModel.value = s.MODEL || 'deepseek-ai/DeepSeek-V3.2';
        if (s.MODEL) UI.els.settingModel.innerHTML = `<option value="${s.MODEL}">${s.MODEL}</option>`;

        
        // --- ★★★ 新增：回显 MaxTokens 和 Temperature ★★★ ---
        const maxTokensInput = document.getElementById('custom-max-tokens');
        const tempInput = document.getElementById('custom-temperature');
        // ★★★ 新增
        const contextLimitInput = document.getElementById('custom-context-limit');
        
        if (maxTokensInput) {
            // 如果 state 里没有值，就显示默认值 32700
            maxTokensInput.value = s.MAX_TOKENS || 32700;
        }
        if (tempInput) {
            // 如果 state 里没有值，就显示默认值 1.1
            tempInput.value = s.TEMPERATURE !== undefined ? s.TEMPERATURE : 1.1;
        }
        // ★★★ 新增：回显上下文条数
        if (contextLimitInput) {
            // 如果全局设置里没有（比如旧数据），就显示默认 30
            contextLimitInput.value = s.CONTEXT_LIMIT || 30;
        }

        // ----------------------------------------------------



        if (document.getElementById('gist-token')) document.getElementById('gist-token').value = s.GIST_TOKEN || ''; 
        
        // 壁纸回显
        const previewImg = document.getElementById('wallpaper-preview-img');
        const previewDiv = document.getElementById('wallpaper-preview');

        
        // =======================================================
        // ★★★ 2. 新增：回填视觉 API 设置 (解决刷新丢失问题) ★★★
        // =======================================================
        if (UI.els.settingVisionUrl) {
            UI.els.settingVisionUrl.value = s.VISION_URL || '';
        }
        if (UI.els.settingVisionKey) {
            UI.els.settingVisionKey.value = s.VISION_KEY || '';
        }
        if (UI.els.settingVisionModel) {
            UI.els.settingVisionModel.value = s.VISION_MODEL || 'Qwen/Qwen3-VL-30B-A3B-Instruct'; // 给个默认值
        }
        if (UI.els.settingVisionPrompt) {
            UI.els.settingVisionPrompt.value = s.VISION_PROMPT || '请详细地描述这张图片的内容。不要发表评论，只需客观描述。';
        }

        // ★★★ 加上这一行，打开弹窗时刷新下拉菜单 ★★★
        UI.renderVisionPresetMenu(); 



        if (previewImg && previewDiv && s.WALLPAPER && s.WALLPAPER.startsWith('data:')) {
            previewImg.src = s.WALLPAPER;
            previewDiv.classList.remove('hidden');
        }

        // ★★★ 确保 Radio 勾选状态正确 ★★★
        // applyAppearance 内部已经写了根据 s.THEME 去勾选对应 radio 的逻辑
        // 所以调用它，就能让弹窗里的 radio 状态和当前实际状态同步
        UI.applyAppearance();

        // ★★★ CSS 输入框回显 ★★★
        const cssInput = document.getElementById('custom-css-input');
        if (cssInput) {
            cssInput.value = s.CUSTOM_CSS || '';
        }

        UI.renderPresetMenu();
        // ★★★ 世界书初始化 ★★★
        UI.initWorldInfoTab();
        // ★★★ 自定义主题预设下拉框初始化 ★★★
        UI.renderCssPresetMenu();



    },

    // --- 世界书相关操作 ---

    // 切换当前书
    switchWorldInfoBook(bookId) {
        STATE.currentBookId = bookId;
        UI.updateCurrentBookSettingsUI();
        UI.renderWorldInfoList();
        this.clearWorldInfoEditor();
    },

    // 绑定当前书的角色
    async bindCurrentBookToChar(charId) {
        const book = STATE.worldInfoBooks.find(b => b.id === STATE.currentBookId);
        if (book) {
            book.characterId = charId;
            await Storage.saveWorldInfo();
            // 不需刷新列表，因为内容没变
        }
    },
    
    loadWorldInfoEntry(uid) {
        const book = STATE.worldInfoBooks.find(b => b.id === STATE.currentBookId);
        if (!book) return;

        const entry = book.entries.find(e => e.uid === uid);
        if (!entry) return;

        document.getElementById('wi-edit-uid').value = entry.uid;
        document.getElementById('wi-edit-keys').value = entry.keys.join(', ');
        document.getElementById('wi-edit-content').value = entry.content;
        document.getElementById('wi-edit-constant').checked = entry.constant;

        // ★★★ 核心修改：把内存里的名字填进输入框
        const commentInput = document.getElementById('wi-edit-comment');
        if (commentInput) {
            commentInput.value = entry.comment || ''; 
        }
        
        // 顺便刷新一下列表高亮
        UI.renderWorldInfoList(); 
    },

    async saveWorldInfoEntry() {
        // 1. 获取当前书
        const book = STATE.worldInfoBooks.find(b => b.id === STATE.currentBookId);
        if (!book) return alert("请先新建或选择一本世界书");

        // 2. 获取所有输入框的值
        const uid = document.getElementById('wi-edit-uid').value;
        const keysStr = document.getElementById('wi-edit-keys').value || ""; // 防止 null
        const content = document.getElementById('wi-edit-content').value || "";
        const constant = document.getElementById('wi-edit-constant').checked;
        
        // ★★★ 关键：获取名称输入框 ★★★
        const commentInput = document.getElementById('wi-edit-comment');
        // 如果输入框存在，就取值；不存在（比如界面没渲染对）就给 null
        let userComment = commentInput ? commentInput.value.trim() : null;

        // 3. 处理 Key (把字符串转成数组)
        const keys = keysStr.split(/[,，]/).map(k => k.trim()).filter(k => k);

        if (!content && !keys.length) {
            alert('请至少填写内容或关键词');
            return;
        }

        // 4. 查找或新建条目
        let entry = book.entries.find(e => e.uid === uid);
        
        if (entry) {
            // === 更新逻辑 ===
            entry.keys = keys;
            entry.content = content;
            entry.constant = constant;

            // ★★★ 核心修复：优先使用用户输入的名字 ★★★
            if (userComment !== null && userComment !== "") {
                // 如果用户填了字，就用用户的
                entry.comment = userComment;
            } else if (!entry.comment && keys.length > 0) {
                // 只有当“用户没填”且“原先也没名字”时，才用 Key 兜底
                entry.comment = keys[0];
            }
            // 如果用户清空了输入框，且没有Key，那就让它空着或者叫未命名
            if (!entry.comment) entry.comment = '未命名条目';
            
        } else {
            // === 新建逻辑 ===
            entry = {
                uid: Date.now().toString(),
                keys: keys,
                content: content,
                constant: constant,
                // ★★★ 新建时也是一样：优先用输入框的值
                comment: userComment || keys[0] || '新建条目'
            };
            book.entries.push(entry);
        }

        // 5. 保存到数据库
        await Storage.saveWorldInfo();

        // ★★★ 新增的提示代码就在这里！ ★★★
        alert(`条目 [${entry.comment}] 已保存成功！`); 
        
        // 6. 强制刷新列表 (解决左侧不更新的问题)
        UI.renderWorldInfoList(); 
        
        // 7. 重新加载当前条目 (让输入框里的值保持同步)
        this.loadWorldInfoEntry(entry.uid);
        
        console.log("已保存条目:", entry.comment); // 调试用，看控制台有没有打印名字
    },

    async deleteWorldInfoEntry() {
        const book = STATE.worldInfoBooks.find(b => b.id === STATE.currentBookId);
        if (!book) return;

        const uid = document.getElementById('wi-edit-uid').value;
        if (!uid) return;
        if (confirm('确定删除此条目吗？')) {
            book.entries = book.entries.filter(e => e.uid !== uid);
            await Storage.saveWorldInfo();
            this.clearWorldInfoEditor();
            UI.renderWorldInfoList();
        }
    },

    clearWorldInfoEditor() {
        document.getElementById('wi-edit-uid').value = '';
        document.getElementById('wi-edit-keys').value = '';
        
        // ★★★ 新增：清空名称输入框
        const commentInput = document.getElementById('wi-edit-comment');
        if (commentInput) commentInput.value = '';

        document.getElementById('wi-edit-content').value = '';
        document.getElementById('wi-edit-constant').checked = false;
        UI.renderWorldInfoList();
    },

    // ★★★ 大分类（书）的操作 ★★★
    async createNewBook() {
        const name = prompt("请输入新世界书的名称：", "新世界书");
        if (name) {
            const newBook = {
                id: 'book_' + Date.now(),
                name: name,
                characterId: '', // 默认全局
                entries: []
            };
            STATE.worldInfoBooks.push(newBook);
            STATE.currentBookId = newBook.id;
            await Storage.saveWorldInfo();
            UI.renderBookSelect();
            UI.renderWorldInfoList();
        }
    },

    async renameCurrentBook() {
        const book = STATE.worldInfoBooks.find(b => b.id === STATE.currentBookId);
        if (!book) return;
        const newName = prompt("重命名世界书：", book.name);
        if (newName) {
            book.name = newName;
            await Storage.saveWorldInfo();
            UI.renderBookSelect();
        }
    },

    async deleteCurrentBook() {
        if (STATE.worldInfoBooks.length <= 1) {
            return alert("至少保留一本世界书");
        }
        const book = STATE.worldInfoBooks.find(b => b.id === STATE.currentBookId);
        if (!book) return;
        
        if (confirm(`确定要彻底删除整本《${book.name}》吗？\n里面的所有条目都会消失，不可恢复。`)) {
            STATE.worldInfoBooks = STATE.worldInfoBooks.filter(b => b.id !== STATE.currentBookId);
            STATE.currentBookId = STATE.worldInfoBooks[0].id; // 切换到第一本
            await Storage.saveWorldInfo();
            UI.renderBookSelect();
            UI.renderWorldInfoList();
        }
    },

    exportCurrentBook() {
        const book = STATE.worldInfoBooks.find(b => b.id === STATE.currentBookId);
        if (!book) return;

        const jsonStr = WorldInfoEngine.exportToST(book);
        const blob = new Blob([jsonStr], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${book.name}.json`;
        a.click();
        URL.revokeObjectURL(url);
    },

    async handleImportWorldInfo(file) {
        if (!file) return;

        try {
            // 1. 直接等待文件读取为文本，不用写 reader.onload 了
            const content = await file.text(); 
            
            // 2. 剩下的逻辑像流水账一样写下来
            const newBook = WorldInfoEngine.importFromST(content, file.name);
            STATE.worldInfoBooks.push(newBook);
            STATE.currentBookId = newBook.id; 
            
            // 3. 等待数据库保存
            await Storage.saveWorldInfo();
            
            // 4. 刷新界面
            UI.renderBookSelect();
            UI.renderWorldInfoList();
            
            alert(`成功导入《${newBook.name}》，包含 ${newBook.entries.length} 个条目！`);
            
        } catch (err) {
            alert(err.message);
        }
    },

    // ----------------------

    async handleSavePreset() {
        const name = prompt("请为当前配置输入一个预设名称 (如: Gemini Pro)");
        if (!name) return;

        // 获取当前输入框的值
        const maxTokensInput = document.getElementById('custom-max-tokens');
        const tempInput = document.getElementById('custom-temperature');
       
        // ★★★ 新增：获取上下文条数输入框
        const contextLimitInput = document.getElementById('custom-context-limit');

        // 1. 构造新预设对象 (★★★ 新增参数 ★★★)
        const preset = {
            name: name,
            url: UI.els.settingUrl.value.trim(),
            key: UI.els.settingKey.value.trim(),
            model: UI.els.settingModel.value,
            // 如果输入框没值，就存默认值
            max_tokens: maxTokensInput && maxTokensInput.value ? parseInt(maxTokensInput.value) : 32700,
            temperature: tempInput && tempInput.value ? parseFloat(tempInput.value) : 1.1,
          
            // ★★★ 新增：保存上下文条数
            context_limit: contextLimitInput && contextLimitInput.value ? parseInt(contextLimitInput.value) : 30,
        };

        // 2. 校验必填项
        if(!preset.url || !preset.key) return alert("请先填好 API 地址和密钥！");

        // 3. 确保数组存在
        if (!STATE.settings.API_PRESETS) STATE.settings.API_PRESETS = [];

        // 4. 查重与覆盖逻辑
        const existingIndex = STATE.settings.API_PRESETS.findIndex(p => p.name === name);

        if (existingIndex >= 0) {
            if (confirm(`API 预设 "${name}" 已存在，确定要覆盖吗？`)) {
                STATE.settings.API_PRESETS[existingIndex] = preset;
            } else {
                return;
            }
        } else {
            STATE.settings.API_PRESETS.push(preset);
        }

        // 5. 保存并刷新菜单
        await Storage.saveSettings();
        UI.renderPresetMenu(); 
        alert(`API 预设 "${name}" 已保存`);
    },



    handleLoadPreset(index) {
        if (index === "") return;
        const preset = STATE.settings.API_PRESETS[index];
        if (preset) {
            UI.els.settingUrl.value = preset.url;
            UI.els.settingKey.value = preset.key;
            UI.els.settingModel.innerHTML = `<option value="${preset.model}">${preset.model}</option>`;
            UI.els.settingModel.value = preset.model;

            // --- ★★★ 新增：加载 MaxTokens 和 Temperature ★★★ ---
            const maxTokensInput = document.getElementById('custom-max-tokens');
            const tempInput = document.getElementById('custom-temperature');
            
            // ★★★ 新增
            const contextLimitInput = document.getElementById('custom-context-limit');

            if (maxTokensInput) {
                // 兼容旧预设：如果旧数据里没有 max_tokens，就填默认值
                maxTokensInput.value = preset.max_tokens || 32700;
            }
            if (tempInput) {
                // 兼容旧预设：注意 0 也是有效值，所以用 undefined 判断
                tempInput.value = preset.temperature !== undefined ? preset.temperature : 1.1;
            }

            // ★★★ 新增：回填上下文条数
            if (contextLimitInput) {
                // 兼容旧预设，如果没有 context_limit 则默认为 30
                contextLimitInput.value = preset.context_limit || 30;
            }


        }
    },


    async handleDeletePreset() {
        const select = document.getElementById('preset-select');
        const index = select.value;
        if (index === "") return alert("请先选择一个预设");
        
        if (confirm(`确定删除 "${STATE.settings.API_PRESETS[index].name}" 吗？`)) {
            STATE.settings.API_PRESETS.splice(index, 1);
            await Storage.saveSettings();
            UI.renderPresetMenu();
        }
    },

    async saveSettingsFromUI() {
        let rawUrl = UI.els.settingUrl.value.trim().replace(/\/+$/, '');
        if (!rawUrl.includes('anthropic') && !rawUrl.includes('googleapis')) {
            if (rawUrl.endsWith('/chat/completion')) rawUrl += 's'; 
            else if (!rawUrl.includes('/chat/completions')) {
                rawUrl += rawUrl.endsWith('/v1') ? '/chat/completions' : '/v1/chat/completions';
            }
        }
        
        const s = STATE.settings;
        s.API_URL = rawUrl;
        s.API_KEY = UI.els.settingKey.value.trim();
        s.MODEL = UI.els.settingModel.value;


        // 获取 DOM 元素 (因为这两个没有在 UI.els 里预定义，所以直接用 getElementById)
        // --- ★★★ 新增：保存 Context Limit, MaxTokens 和 Temperature ★★★ ---
        const maxTokensInput = document.getElementById('custom-max-tokens');
        const tempInput = document.getElementById('custom-temperature');
        // ★★★ 新增
        const contextLimitInput = document.getElementById('custom-context-limit');

        // 解析数值，如果为空或非法，则回退到默认值
        if (maxTokensInput) {
            const val = parseInt(maxTokensInput.value, 10);
            s.MAX_TOKENS = !isNaN(val) ? val : 32700;
        }
        if (tempInput) {
            const val = parseFloat(tempInput.value);
            s.TEMPERATURE = !isNaN(val) ? val : 1.1;
        }
        // ★★★ 新增
        if (contextLimitInput) {
            const val = parseInt(contextLimitInput.value, 10);
            // 确保至少有 1 条
            s.CONTEXT_LIMIT = (!isNaN(val) && val > 0) ? val : 30;
        }

        // ----------------------------------------------------


        const tEl = document.getElementById('gist-token');
        if(tEl) s.GIST_TOKEN = tEl.value.trim() || ''; 

        // 处理壁纸
        const wallpaperPreview = document.getElementById('wallpaper-preview-img');
        // 加个判空保护，防止 wallpaperPreview 为 null 报错
        if(wallpaperPreview && wallpaperPreview.src && wallpaperPreview.src.startsWith('data:')) {
            s.WALLPAPER = wallpaperPreview.src;
        } else if (!s.WALLPAPER) {
            s.WALLPAPER = 'wallpaper.jpg';
        }

        // --- ★★★ 修正主题保存逻辑 (核心修改) ★★★ ---
        // 不再只判断 dark/light，而是获取选中的那个 radio 的 value
        const checkedTheme = document.querySelector('input[name="theme-select"]:checked');
        if (checkedTheme) {
            s.THEME = checkedTheme.value; // 这里会拿到 'light', 'dark' 或 'custom'
        } else {
            s.THEME = 'light'; // 兜底默认值
        }

        // --- ★★★ 新增：保存自定义CSS内容 ★★★ ---
        const cssInput = document.getElementById('custom-css-input');
        if (cssInput) {
            s.CUSTOM_CSS = cssInput.value;
        }

        // 处理字体大小
        const slider = document.getElementById('font-size-slider');
        if (slider) {
            s.FONT_SIZE = parseInt(slider.value, 10);
        }

        // ★★★ 保存视觉设置 ★★★
        if (UI.els.settingVisionUrl) s.VISION_URL = UI.els.settingVisionUrl.value.trim();
        if (UI.els.settingVisionKey) s.VISION_KEY = UI.els.settingVisionKey.value.trim();
        if (UI.els.settingVisionModel) s.VISION_MODEL = UI.els.settingVisionModel.value.trim();
        if (UI.els.settingVisionPrompt) s.VISION_PROMPT = UI.els.settingVisionPrompt.value.trim();


        // 保存并应用
        await Storage.saveSettings(); // 保存到 IndexedDB
        UI.applyAppearance(); 
        UI.els.mainModal.classList.add('hidden');
    },

    /*1212*/
    // 【7. APP CONTROLLER】
    handleMessageAction(action) {
        // 1. 获取选中索引
        const msgIndex = STATE.selectedMessageIndex;

        // 2. 获取当前角色
        const currentId = STATE.currentContactId;
        const currentContact = STATE.contacts.find(c => c.id === currentId);

        if (!currentContact) {
            console.error("错误：找不到当前角色");
            return;
        }

        // --- 核心数据获取 ---
        const msgData = currentContact.history[msgIndex]; 

        if (!msgData) {
            console.error("找不到该条消息，索引:", msgIndex);
            return;
        }

        // 定义时间戳正则（Edit和Copy公用）
        const timestampRegex = /^\[[A-Z][a-z]{2}\.\d{1,2}\s\d{2}:\d{2}\]\s/;

        // 3. 执行动作
        if (action === 'edit') {
            let originalContent = msgData.content;
            let timestampPart = ''; // 用于暂存时间戳头
            let cleanContent = originalContent;

            const match = originalContent.match(timestampRegex);
            if (match) {
                timestampPart = match[0]; // 比如 "[Dec.14 16:39] "
                cleanContent = originalContent.replace(timestampRegex, ''); // 去掉时间戳
            }

            // 传入干净的文本给弹窗
            UI.showEditModal(cleanContent, (newText) => {
                // 如果文本有变化
                if (newText && newText !== cleanContent) {
                    // ★ 核心：保存时把原时间戳拼回去
                    msgData.content = timestampPart + newText;
                    
                    Storage.saveContacts(); 

                    // ★★★ 核心修复：加上 (..., false, true) ★★★
                    // 告诉渲染函数：“不要加载更多，但要保持滚动位置”
                    UI.renderChatHistory(currentContact, false, true);
                }
            });
        } 
        else if (action === 'delete') {
            if (confirm("确定要删除这条消息吗？")) {

                // 1. 获取当前滚动条位置（保险起见，虽然通常不需要手动恢复）
                const scrollContainer = UI.els.chatMsgs.parentElement;
                const currentScrollTop = scrollContainer.scrollTop;

                // 2. 执行删除数据
                currentContact.history.splice(msgIndex, 1);

                // 3. 保存
                Storage.saveContacts();

                // 4. ★★★ 重新渲染，并传入 true (keepScrollPosition) ★★★
                // 这样 UI 就不会自动滚到底部了
                UI.renderChatHistory(currentContact, false, true); 
            }
        }
        // ★★★ 新增：处理隐藏/显示 ★★★
        else if (action === 'toggle-hidden') {
            // 1. 切换状态 (如果原来是 true 变成 false，反之亦然)
            msgData.isHidden = !msgData.isHidden;

            // 2. 保存数据
            Storage.saveContacts();

            // 3. 重新渲染 (传入 keepScrollPosition=true，保证不乱跳)
            UI.renderChatHistory(currentContact, false, true);
        }

        if (action === 'multi-select') {
            this.enterSelectMode();
            // 自动选中触发菜单的那个气泡
            const msgIndex = STATE.selectedMessageIndex;
            // 假设我们能获取到刚才点的那个元素 (这里稍微简化，先进入模式)
            // 你可以通过之前 savedRect 对应的元素来选中，或者留空让用户自己选
        }

        else if (action === 'copy') {
            // ★★★ 修改：复制逻辑（支持文本+图片描述） ★★★
            let contentToCopy = msgData.content || "";
            
            // 1. 先去除时间戳 (保留纯内容)
            if (timestampRegex.test(contentToCopy)) {
                contentToCopy = contentToCopy.replace(timestampRegex, '');
            }

            // 2. 清洗 Markdown 符号 
            contentToCopy = cleanMarkdownForCopy(contentToCopy);

            // 3. ★★★ 核心新增：处理图片附加信息 ★★★
            let imageSuffix = "";
            
            // 优先：如果有图片描述，直接使用描述（无论图片是否已清理）
            if (msgData.image_description) {
                imageSuffix = `[图片描述: ${msgData.image_description}]`;
            } 
            // 其次：如果没描述，但有未清理的图片
            else if (msgData.images && msgData.images.length > 0) {
                imageSuffix = `[图片]`;
            } 
            // 最后：如果没描述，且图片已被清理（显示过期占位符）
            else if (msgData.isImageExpired) {
                imageSuffix = `[图片已清理或识图失败]`;
            }

            // 4. 将文本和图片描述组合
            let finalCopyText = "";
            if (contentToCopy && imageSuffix) {
                // 既有字又有图，用换行隔开
                finalCopyText = `${contentToCopy}\n\n${imageSuffix}`;
            } else if (contentToCopy) {
                // 只有字
                finalCopyText = contentToCopy;
            } else if (imageSuffix) {
                // 只有图 (纯图消息)
                finalCopyText = imageSuffix;
            }

            // 5. 执行复制
            navigator.clipboard.writeText(finalCopyText)
                .then(() => {
                    // console.log("复制成功:", finalCopyText);
                    // 可以加一个轻提示 UI.showToast("复制成功");
                })
                .catch(err => {
                    console.error("复制失败:", err);
                    alert("复制失败，请检查浏览器权限");
                });
        }

    },

    // ===================2. 进入多选模式=============================
    enterSelectMode() {
        STATE.isSelectMode = true;
        STATE.selectedBubbles = new Set(); // 重置选择
        
        // 给容器加类名，触发 CSS 样式
        UI.els.chatMsgs.classList.add('select-mode');
        
        // 显示底部操作栏
        document.getElementById('multi-select-bar').classList.remove('hidden');
        this.updateSelectCount();
        
        // 绑定点击事件 (通过委托)
        if (!this._boundSelectClick) {
            this._selectClickHandler = (e) => {
                if (!STATE.isSelectMode) return;
                
                const bubble = e.target.closest('.message-bubble');
                if (bubble) {
                    // 阻止图片查看等默认行为
                    e.preventDefault(); 
                    e.stopPropagation();
                    
                    this.toggleBubbleSelection(bubble);
                }
            };
            UI.els.chatMsgs.addEventListener('click', this._selectClickHandler, true); // true: 捕获阶段，优先处理
            this._boundSelectClick = true;
        }
        
        // 绑定底部按钮事件
        this.bindSelectBarEvents();
    },

    // 3. 退出多选模式
    exitSelectMode() {
        STATE.isSelectMode = false;
        STATE.selectedBubbles.clear();
        
        UI.els.chatMsgs.classList.remove('select-mode');
        document.getElementById('multi-select-bar').classList.add('hidden');
        
        // 移除所有选中的视觉样式
        document.querySelectorAll('.message-bubble.selected').forEach(el => el.classList.remove('selected'));
        
        // 解绑点击事件 (可选，或者一直留着判断 isSelectMode)
        if (this._boundSelectClick) {
            UI.els.chatMsgs.removeEventListener('click', this._selectClickHandler, true);
            this._boundSelectClick = false;
        }
    },

    // 4. 切换单个气泡选中状态
    toggleBubbleSelection(bubbleEl) {
        if (bubbleEl.classList.contains('selected')) {
            bubbleEl.classList.remove('selected');
            STATE.selectedBubbles.delete(bubbleEl);
        } else {
            bubbleEl.classList.add('selected');
            STATE.selectedBubbles.add(bubbleEl);
        }
        this.updateSelectCount();
    },

    // 5. 更新计数
    updateSelectCount() {
        const count = STATE.selectedBubbles.size;
        document.getElementById('select-count-num').innerText = count;
    },

    // 6. 绑定底部按钮事件 (只绑定一次)
    bindSelectBarEvents() {
        if (this._selectBarEventsBound) return;
        
        document.getElementById('btn-exit-select').addEventListener('click', () => this.exitSelectMode());
        document.getElementById('btn-batch-copy').addEventListener('click', () => this.handleBatchCopy());
        document.getElementById('btn-batch-delete').addEventListener('click', () => this.handleBatchDelete());
       
        // ★★★ 新增：绑定隐藏按钮 ★★★
        document.getElementById('btn-batch-hide').addEventListener('click', () => this.handleBatchToggleHidden());
        
        this._selectBarEventsBound = true;
    },



    // ==========================================
    // ★★★ 核心：批量复制逻辑 ★★★
    // ==========================================
    handleBatchCopy() {
        if (STATE.selectedBubbles.size === 0) return;

        const contact = STATE.contacts.find(c => c.id === STATE.currentContactId);
        
        // 1. 排序 (兼容 'thought' 排序)
        const sortedBubbles = Array.from(STATE.selectedBubbles).sort((a, b) => {
            const msgIndexA = parseInt(a.dataset.msgIndex);
            const msgIndexB = parseInt(b.dataset.msgIndex);
            if (msgIndexA !== msgIndexB) return msgIndexA - msgIndexB;
            
            const getPartVal = (bubble) => {
                const pIdx = bubble.dataset.partIndex;
                return pIdx === 'thought' ? -1 : parseInt(pIdx);
            };
            return getPartVal(a) - getPartVal(b);
        });

        // 2. 提取内容 (★★★ 核心修改：直接从数据源读取，无视 DOM 折叠状态 ★★★)
        const textParts = sortedBubbles.map(bubble => {
            try {
                const img = bubble.querySelector('img'); 
                const expiredPlaceholder = bubble.querySelector('.expired-image-placeholder');
                
                const mIdx = parseInt(bubble.dataset.msgIndex);
                const msg = contact ? contact.history[mIdx] : null;
                
                // A & B: 处理图片
                if (img || expiredPlaceholder) {
                    if (!contact) return img ? "[图片]" : "[图片已清理]";
                    if (msg && msg.image_description) {
                        return `[图片描述: ${msg.image_description}]`;
                    } else {
                        return img ? "[图片]" : "[图片已清理或识图失败]";
                    }
                } 

                // C. 处理文本 / 思考块
                // 如果找不到数据兜底用 DOM 提取
                if (!msg) return cleanMarkdownForCopy(bubble.innerText); 

                const rawPIdx = bubble.dataset.partIndex;
                const pIdx = rawPIdx === 'thought' ? 'thought' : parseInt(rawPIdx);

                let contentToParse = msg.content || '';
                
                // 1) 去除时间戳
                if (msg.role === 'user') {
                    contentToParse = contentToParse.replace(/^\[[A-Z][a-z]{2}\.\d{1,2}\s\d{2}:\d{2}\]\s/, '');
                }
                
                // 2) AI 引用切分兼容
                if (msg.role === 'assistant') {
                    contentToParse = contentToParse.replace(/(^|\n)>\s*/g, '\n\n');
                }

                // 3) 把思考过程抽离出来
                let thoughtText = '';
                contentToParse = contentToParse.replace(/<(?:think|thinking|thought)>([\s\S]*?)<\/(?:think|thinking|thought)>/gi, (match, inner) => {
                    thoughtText = inner.trim();
                    return '';
                });

                // 4) 根据选中的索引，精准返回数据
                if (pIdx === 'thought') {
                    // 如果勾选的是思考过程，直接返回这段文字，不受界面折叠影响
                    // 这里加了个 [思考过程] 标识，复制出来排版更清晰
                    return `[思考过程]\n${cleanMarkdownForCopy(thoughtText)}`;
                } else {
                    // 如果勾选的是正文气泡
                    const paragraphs = contentToParse.split(/\n\s*\n/).filter(p => p.trim());
                    if (paragraphs[pIdx]) {
                        return cleanMarkdownForCopy(paragraphs[pIdx]);
                    } else {
                        // 兜底防错
                        return cleanMarkdownForCopy(bubble.innerText);
                    }
                }
                
            } catch (e) {
                console.error("提取单条消息失败:", e);
                return ""; 
            }
        });

        // 拼接所有选中的内容
        const fullText = textParts.filter(t => t).join('\n\n');
        
        // 3. 执行复制
        navigator.clipboard.writeText(fullText)
            .then(() => {
                // console.log('复制成功');
            })
            .catch(err => {
                console.error('无法复制文本: ', err);
                alert('复制失败，请检查浏览器权限');
            })
            .finally(() => {
                this.exitSelectMode();
            });
    },


    // ==========================================
    // ★★★ 新增：批量隐藏/显示逻辑 ★★★
    // ==========================================
    handleBatchToggleHidden() {
        if (STATE.selectedBubbles.size === 0) return;

        const currentContact = STATE.contacts.find(c => c.id === STATE.currentContactId);
        if (!currentContact) return;

        // 1. 整理选中的目标
        const selectionMap = {};
        let anyVisibleFound = false;

        STATE.selectedBubbles.forEach(bubble => {
            const mIdx = parseInt(bubble.dataset.msgIndex);
            
            // ★★★ 核心修改 1：兼容 'thought' 索引的解析 ★★★
            const rawPIdx = bubble.dataset.partIndex;
            const pIdx = rawPIdx === 'thought' ? 'thought' : parseInt(rawPIdx);
            
            if (!selectionMap[mIdx]) selectionMap[mIdx] = [];
            selectionMap[mIdx].push(pIdx);

            // 检查当前状态
            const msg = currentContact.history[mIdx];
            const currentHiddenList = msg.hiddenIndices || [];
            
            if (!currentHiddenList.includes(pIdx)) {
                anyVisibleFound = true;
            }
        });

        // 2. 目标动作
        const shouldHide = anyVisibleFound;

        // 3. 执行更新
        Object.keys(selectionMap).forEach(key => {
            const mIdx = parseInt(key);
            const pIndices = selectionMap[mIdx]; 
            const msg = currentContact.history[mIdx];

            if (!msg.hiddenIndices) msg.hiddenIndices = [];

            pIndices.forEach(pIdx => {
                if (shouldHide) {
                    if (!msg.hiddenIndices.includes(pIdx)) {
                        msg.hiddenIndices.push(pIdx);
                    }
                } else {
                    msg.hiddenIndices = msg.hiddenIndices.filter(id => id !== pIdx);
                }
            });
            
            // ★★★ 核心修改 2：兼容 'thought' 的排序逻辑 ★★★
            // 让 'thought' 排在最前面，其他数字按大小排
            msg.hiddenIndices.sort((a, b) => {
                const valA = a === 'thought' ? -1 : a;
                const valB = b === 'thought' ? -1 : b;
                return valA - valB;
            });
        });

        // 4. 保存并刷新
        Storage.saveContacts();
        this.exitSelectMode();
        UI.renderChatHistory(currentContact, false, true);
    },

    // ==========================================
    // ★★★ 核心：批量删除逻辑 ★★★
    // ==========================================
    handleBatchDelete() {
        if (STATE.selectedBubbles.size === 0) return;
        if (!confirm(`确定要删除选中的 ${STATE.selectedBubbles.size} 条内容吗？`)) return;

        const currentContact = STATE.contacts.find(c => c.id === STATE.currentContactId);
        if (!currentContact) return;

        // 1. 将待删除项按 msgIndex 分组
        const deletionMap = {};

        STATE.selectedBubbles.forEach(bubble => {
            const mIdx = parseInt(bubble.dataset.msgIndex);
            // ★★★ 核心修改 1：兼容思考气泡的字符串索引 'thought' ★★★
            const rawPIdx = bubble.dataset.partIndex;
            const pIdx = rawPIdx === 'thought' ? 'thought' : parseInt(rawPIdx);
            
            if (!deletionMap[mIdx]) deletionMap[mIdx] = [];
            deletionMap[mIdx].push(pIdx);
        });

        // 2. 遍历分组，执行删除 (从后往前删)
        const affectedIndices = Object.keys(deletionMap).map(Number).sort((a, b) => b - a);

        affectedIndices.forEach(msgIndex => {
            const msg = currentContact.history[msgIndex];
            const partsToDelete = deletionMap[msgIndex]; // 例如: [0, 2, 'thought']

            let content = msg.content || '';
            const timestampRegex = /^\[[A-Z][a-z]{2}\.\d{1,2}\s\d{2}:\d{2}\]\s/;
            let timestampPart = '';
            
            if (match = content.match(timestampRegex)) {
                timestampPart = match[0];
                content = content.replace(timestampRegex, '');
            }

            // ==============================================================
            // ★★★ 核心修改 2：切分段落前，必须先将思考过程抽离，保证段落索引准确 ★★★
            // ==============================================================
            let thoughtMatchText = ""; 
            if (msg.role === 'assistant') {
                // 找出并保存原生的 <think> 块，同时把它从 content 里挖掉
                content = content.replace(/<(?:think|thinking|thought)>([\s\S]*?)<\/(?:think|thinking|thought)>/gi, (match) => {
                    thoughtMatchText = match; 
                    return ''; 
                });
                
                content = content.replace(/(^|\n)>\s*/g, '\n\n');
            }
            
            // 现在 content 里只有纯文本了，切分出来的索引绝对准确
            let paragraphs = content.split(/\n\s*\n/).filter(p => p.trim());
            const imagePartIndex = paragraphs.length;
            
            // --- B. 处理文本删除 ---
            let newParagraphs = paragraphs.filter((_, index) => !partsToDelete.includes(index));

            // --- C. 处理图片删除 ---
            if (partsToDelete.includes(imagePartIndex)) {
                msg.images = null;
                msg.image_description = null; 
                msg.isImageExpired = false;   
            }

            // --- D. 重组 ---
            const hasImagesLeft = (msg.images && msg.images.length > 0) || msg.isImageExpired;
            // ★★★ 判断思考气泡是否幸存（存在，且没被勾选删除） ★★★
            const hasThoughtLeft = (msg.role === 'assistant' && thoughtMatchText && !partsToDelete.includes('thought'));
            
            // 如果 文字没了 AND 图片没了 AND 思考过程也没了，这消息就废了
            if (newParagraphs.length === 0 && !hasImagesLeft && !hasThoughtLeft) {
                // 彻底删除整条消息
                currentContact.history.splice(msgIndex, 1);
            } else {
                // 更新文本
                let newContent = newParagraphs.join('\n\n');
                
                if (msg.role === 'user') {
                    newContent = timestampPart + newContent;
                } else if (msg.role === 'assistant') {
                    // ★★★ 如果思考气泡幸存，把它拼回最前面 ★★★
                    if (hasThoughtLeft) {
                        newContent = thoughtMatchText + '\n\n' + newContent;
                    }
                }
                
                msg.content = newContent.trim();
            }
        });

        // 3. 保存并刷新
        Storage.saveContacts();
        this.exitSelectMode();
        UI.renderChatHistory(currentContact, false, true);
    },

    // ===================结束多选模式=============================


    hideMessageContextMenu() {
        if (this.els.msgContextMenu) {
            this.els.msgContextMenu.style.display = 'none';
        }
        STATE.selectedMessageIndex = null;
    },


    // 【7. APP CONTROLLER】
    showMessageContextMenu(msgIndex, rect) {
        STATE.selectedMessageIndex = msgIndex;

        const menu = document.getElementById('msg-context-menu');

        // --- 事件绑定区域 (保持你原有的逻辑不变，只绑定一次) ---
        if (!menu.dataset.initialized) {
            menu.dataset.initialized = 'true';
            menu.addEventListener('click', e => {
                const btn = e.target.closest('button');
                if (!btn) return;
                const action = btn.dataset.action;
                // 如果处于防误触锁定状态，直接无视点击
                if (menu.classList.contains('locked')) return; 

                if (action === 'cancel') {
                    this.hideMessageContextMenu();
                    return;
                }
                // 这里的 this 需要确保指向 Controller 实例
                // 如果是在回调里，可能需要用 App.handleMessageAction 或箭头函数上下文
                this.handleMessageAction(action); 
                this.hideMessageContextMenu();
            });
            menu.querySelector('.menu-backdrop').addEventListener('click', () => {
                this.hideMessageContextMenu();
            });
        }

        // ★★★ 新增：动态修改按钮文字 ★★★
        const currentContact = STATE.contacts.find(c => c.id === STATE.currentContactId);
        if (currentContact) {
            const msg = currentContact.history[msgIndex];
            // 找到我们在 HTML 里加的那个按钮 (假设你加了 data-action="toggle-hidden")
            const toggleBtn = menu.querySelector('button[data-action="toggle-hidden"]');
            
            if (toggleBtn) {
                if (msg.isHidden) {
                    toggleBtn.textContent = "取消隐藏";
                } else {
                    toggleBtn.textContent = "向Ta隐藏";
                }
            }
        }
        // ★★★ 结束新增 ★★★



        // --- ★★★★★ 核心修改：防误触锁 ★★★★★ ---
        
        // 1. 先加上锁定 class (或者直接用 style)
        menu.classList.add('locked');
        menu.style.pointerEvents = 'none'; // 物理禁用点击
        menu.style.display = 'flex';       // 显示出来
        
        // 2. 300毫秒后解锁
        setTimeout(() => {
            menu.classList.remove('locked');
            menu.style.pointerEvents = 'auto'; // 恢复点击
        }, 300);
    },

    // 隐藏方法
    hideMessageContextMenu() {
        const menu = document.getElementById('msg-context-menu');
        if (menu) menu.style.display = 'none';
    },


    /* =================== 心迹 ===========================*/

    // 在 App 对象中添加
    switchMainTab(tab) {
        // 隐藏所有主视图
        document.getElementById('view-list').style.display = 'none';
        document.getElementById('view-chat').style.display = 'none';
        document.getElementById('view-explore').style.display = 'none';
        document.getElementById('view-moments').style.display = 'none';
        
        // 取消底部所有高亮
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));

        if (tab === 'chat') {
            document.getElementById('view-list').style.display = 'block';
            document.getElementById('tab-chat').classList.add('active');
        } else if (tab === 'explore') {
            document.getElementById('view-explore').style.display = 'block';
            document.getElementById('tab-explore').classList.add('active');
        } else if (tab === 'moments') {
            document.getElementById('view-moments').style.display = 'block';
            this.renderMomentsUI(); // 渲染心迹
        }
    },

    




// 渲染心迹列表与分页
    renderMomentsUI() {
        // 1. 获取 DOM 元素
        const bgImg = document.getElementById('moments-bg');
        const avatarImg = document.getElementById('moments-avatar');
        const username = document.getElementById('moments-username'); // <-- 获取元素
        const signature = document.getElementById('moments-signature');
        const feed = document.getElementById('moments-feed');
        const loadMoreBtn = document.getElementById('btn-load-more-moments');

        // 2. 安全获取设置 (防止 undefined)
        // 假设 CONFIG 存在，加了一点容错处理
        const defaultSettings = (typeof CONFIG !== 'undefined' && CONFIG.DEFAULT) ? CONFIG.DEFAULT.MOMENTS_SETTINGS : {};
        const currentSettings = STATE.momentsSettings || defaultSettings;

        // 3. 回显头部信息 (仅当 DOM 存在时才操作)
        if (bgImg) bgImg.src = currentSettings.bgImage || 'default-bg.jpg';
        if (avatarImg) avatarImg.src = currentSettings.avatar || 'default-avatar.jpg';

        // <-- 新增用户名回显
        if (username) username.innerText = currentSettings.username || '你的名字';

        if (signature) signature.innerText = currentSettings.signature || '写下你的个性签名...';

        // 4. 渲染列表
        if (!feed) return; // 如果列表容器都找不到，直接退出
        
        // ★ 优化：声明一个空字符串，不要在循环里使用 innerHTML += 
        let feedHtml = '';

        // 确保 moments 是数组
        const momentsList = Array.isArray(STATE.moments) ? STATE.moments :[];
        
        // 按时间倒序
        const sortedMoments = [...momentsList].sort((a, b) => b.timestamp - a.timestamp);
        const visibleData = sortedMoments.slice(0, STATE.visibleMomentsCount);
        
        visibleData.forEach((moment) => {
            const floorNum = momentsList.length - sortedMoments.indexOf(moment);
            
            // 安全处理图片显示
            const imgHtml = moment.image ? `<br><img class="moment-img" src="${moment.image}">` : '';
            // ★★★ 修改这里：改用我们专门为心迹定制的 formatTimeForMoments 函数 ★★★         
            feedHtml += `
                <div class="moment-card" id="m-${moment.id}">
                    <div class="moment-top">

                        <span>${typeof formatTimeForMoments === 'function' ? formatTimeForMoments(moment.timestamp) : moment.timestamp}</span>
                        <span>#${floorNum}</span>
                    </div>
                    <div class="moment-content">
                        ${moment.text}
                        ${imgHtml}
                    </div>
                    <div class="moment-comments">
            `;
            
            if (moment.comments && moment.comments.length > 0) {
                moment.comments.forEach(c => {
                    // 安全获取发送者名字
                    let senderName = '未知';
                    if (c.senderId === 'user') {
                        senderName = '我';
                    } else {
                        const contact = STATE.contacts.find(x => x.id === c.senderId);
                        senderName = contact ? contact.name : '未知';
                    }
                    
                    // ★★★ 核心修改：去掉onclick，加上 data-* 属性和 comment-sender-name 类名 ★★★
                    // 同时加了个 title 属性，鼠标悬浮时会提示“点击回复 XXX”
                    // ★★★ 核心修改：增加 data-comment-id 属性 ★★★
                    // 在 c.comments.forEach 循环内部，修改生成评论 HTML 的部分：

                    // ---------------- 替换开始 ----------------
                    // 判断是否是结构化的回复，如果是，生成一个前缀标签（你可以自己加CSS美化，比如设为灰色）
                    let replyPrefixHtml = '';
                    if (c.replyToId && c.replyToName) {
                        // 使用刚才在 CSS 中定义的类名 comment-reply-prefix
                        replyPrefixHtml = `<span class="comment-reply-prefix">回复 ${c.replyToName}:</span>`;
                    }

                    feedHtml += `
                        <div class="comment-item">
                            <span class="comment-name comment-sender-name" 
                                data-moment-id="${moment.id}" 
                                data-comment-id="${c.id}" 
                                data-char-id="${c.senderId}" 
                                data-char-name="${senderName}"
                                title="点击操作 ${senderName}">${senderName}:</span> 
                            
                            ${replyPrefixHtml} <!-- 动态插入回复前缀 -->
                            <span>${c.text}</span>
                        </div>
                    `;
                    // ---------------- 替换结束 ----------------
                    });
            }
            
            // ★★★ 核心修改：原本这行的 <button class="reply-btn"> 已经删掉，实现你的需求 ★★★
            
            feedHtml += `</div></div>`;
        });

        // ★ 优化：循环结束后，一次性将拼好的 HTML 注入页面，性能更好且不会出奇怪BUG
        feed.innerHTML = feedHtml;

        // 5. 处理“加载更多”按钮
        if (loadMoreBtn) {
            if (STATE.visibleMomentsCount < momentsList.length) {
                loadMoreBtn.style.display = 'block';
            } else {
                loadMoreBtn.style.display = 'none';
            }
        }
    },


    loadMoreMoments() {
        STATE.visibleMomentsCount += CONFIG.MOMENTS_PAGE_SIZE;
        this.renderMomentsUI();
    },

    // ===========================================
    // 1. 打开心迹设置弹窗 (填充数据)
    // ===========================================
    openMomentsSettings() {
        // 1. 获取 DOM
        const modal = document.getElementById('modal-moments-settings');
        const apiSelect = document.getElementById('m-setting-api-preset');
        const charContainer = document.getElementById('m-setting-allowed-chars');
        
        // 2. 确保配置对象存在
        if (!STATE.momentsSettings) {
            STATE.momentsSettings = JSON.parse(JSON.stringify(CONFIG.DEFAULT.MOMENTS_SETTINGS));
        }

        // 3. 填充 API 预设下拉框 (修复点：显示模型名)
        apiSelect.innerHTML = '<option value="-1">-- 跟随全局默认 --</option>';
        if (STATE.settings.API_PRESETS && STATE.settings.API_PRESETS.length > 0) {
            STATE.settings.API_PRESETS.forEach((preset, index) => {
                const opt = document.createElement('option');
                opt.value = index;
                // ★★★ 修改点：显示 "预设名 (模型名)" ★★★
                const modelName = preset.model || '未知模型';
                opt.textContent = `${preset.name} (${modelName})`;
                
                // 回显选中状态
                if (String(index) === String(STATE.momentsSettings.apiPresetIndex)) {
                    opt.selected = true;
                }
                apiSelect.appendChild(opt);
            });
        }

        // 4. 填充“谁可以评论”复选框列表
        // 4. 填充“谁可以评论”复选框列表
        charContainer.innerHTML = '';

        if (STATE.contacts.length === 0) {
            charContainer.innerHTML = '<p class="no-data-hint">暂无联系人</p>';
        } else {
            STATE.contacts.forEach(contact => {
                // 创建容器
                const label = document.createElement('label');
                label.className = 'checkbox-item'; // 给一个专门的类名

                // 判定是否勾选
                const isChecked = STATE.momentsSettings.allowedChars && 
                                STATE.momentsSettings.allowedChars.includes(contact.id);

                // 使用模板字符串填充 HTML 结构
                label.innerHTML = `
                    <input type="checkbox" value="${contact.id}" ${isChecked ? 'checked' : ''}>
                    <span class="char-name">${contact.name}</span>
                `;
                
                charContainer.appendChild(label);
            });
        }

        // 5. 显示弹窗
        modal.classList.remove('hidden');
    },


    // ===========================================
    // 2. 保存心迹设置
    // ===========================================
    saveMomentsSettings() {
        const apiSelect = document.getElementById('m-setting-api-preset');
        const charContainer = document.getElementById('m-setting-allowed-chars');
        
        // 获取选中的 API 索引
        const presetIndex = parseInt(apiSelect.value);

        // 获取选中的联系人 ID
        const allowed = [];
        const checkboxes = charContainer.querySelectorAll('input[type="checkbox"]:checked');
        checkboxes.forEach(cb => allowed.push(cb.value));

        // 更新 STATE
        STATE.momentsSettings.apiPresetIndex = presetIndex;
        STATE.momentsSettings.allowedChars = allowed;

        // 持久化保存
        if (Storage.saveMomentsSettings) {
            Storage.saveMomentsSettings();
        } else {
            // 如果你还没封装专门的保存函数，可以用通用的 set
            // DB.set(CONFIG.MOMENTS_SETTINGS_KEY, STATE.momentsSettings);
            console.warn("请确保实现了 Storage.saveMomentsSettings()");
        }

        // 关闭弹窗
        document.getElementById('modal-moments-settings').classList.add('hidden');
        alert("设置已保存");
    },


    // 发布心迹并触发 AI 评论 (核心引擎逻辑)
    async publishMoment() {
        const textInput = document.getElementById('m-write-text');
        const imgPreview = document.getElementById('m-write-img-preview');
        const modal = document.getElementById('modal-write-moment');
        const fileInput = document.getElementById('m-write-img-input');
        const btnUpload = document.getElementById('btn-m-upload-img');

        // 1. 获取内容
        const text = textInput.value.trim();
        
        // 判断是否有图片：必须 display 不为 none 且 src 有效
        let imageBase64 = null;
        if (imgPreview && imgPreview.style.display !== 'none' && imgPreview.src && imgPreview.src.startsWith('data:image')) {
            imageBase64 = imgPreview.src;
        }

        // 2. 校验空内容
        if (!text && !imageBase64) {
            alert("写点什么吧");
            return;
        }



        // ★★★ 新增逻辑：计算哪些人有权限看到这条心迹，并初始化计数器 ★★★
        const injectionStatus = {};
        // 1. 获取允许名单
        let allowedIds = [];
        if (STATE.momentsSettings.allowedChars && STATE.momentsSettings.allowedChars.length > 0) {
            allowedIds = STATE.momentsSettings.allowedChars;
        } else {
            // 如果没设置白名单，默认所有人都能看
            allowedIds = STATE.contacts.map(c => c.id);
        }
        
        // 2. 给每个能看到的人，设置初始计数为 2，可以看到两条2条
        allowedIds.forEach(cid => {
            injectionStatus[cid] = CONFIG.MOMENTS_INJECT_COUNT; 
        });



        // 3. 构造数据
        const newMoment = {
            id: 'm_' + Date.now(),
            text: text,
            image: imageBase64,
            timestamp: Date.now(),
            comments: [],
            // ★★★ 新增字段：用于记录聊天时的注入状态 ★★★
            chatInjectionStatus: injectionStatus 
        };

        // 4. 保存数据
        // 注意：unshift 把新动态加到最前面，符合直觉
        STATE.moments.unshift(newMoment); 
        
        if (typeof Storage !== 'undefined' && Storage.saveMoments) {
            Storage.saveMoments();
        } else {
            console.warn("Storage.saveMoments 未定义，数据未持久化");
        }
        
        // 5. 重置 UI
        textInput.value = '';
        if (imgPreview) {
            imgPreview.src = '';
            imgPreview.style.display = 'none';
        }
        if (fileInput) fileInput.value = '';
        if (btnUpload) btnUpload.innerText = "添加图片";
        
        // 关闭弹窗
        if (modal) modal.classList.add('hidden');

        // 6. 刷新列表并触发 AI
        this.renderMomentsUI();
        
        // 确保 triggerAIComments 函数存在
        if (typeof this.triggerAIComments === 'function') {
            this.triggerAIComments(newMoment);
        } else {
            console.warn("triggerAIComments 函数未定义，AI 未评论");
        }
    },


    // ===========================================
    // 触发 AI 评论 (修复版 + 引入世界书)
    // ===========================================
    async triggerAIComments(targetMoment) {
        // 1. 筛选允许评论的联系人
        let validCommentators = STATE.contacts;
        if (STATE.momentsSettings.allowedChars && STATE.momentsSettings.allowedChars.length > 0) {
            validCommentators = STATE.contacts.filter(c => STATE.momentsSettings.allowedChars.includes(c.id));
        }

        console.log(`[心迹] 触发评论，共 ${validCommentators.length} 个角色参与`);

        // 2. 逐个角色生成评论
        for (const char of validCommentators) {

            // 2.1 构造 Prompt
            let historyContext = "无";
            if (char.history && char.history.length > 0) {
                // 1. 先不管三七二十一，把历史记录原样拼起来
                historyContext = char.history.slice(-5).map(h => {
                    const roleName = (h.role === 'user' || h.sender === 'user') ? '用户' : '你';
                    return `${roleName}: ${h.content}`;
                }).join('\n');

                // 2. ★★★ 终极绝杀：对拼接好的整段历史记录进行全局正则清洗 ★★★
                historyContext = historyContext.replace(/<(?:think|thinking|thought)[^>]*>[\s\S]*?(?:<\/(?:think|thinking|thought)>|$)/gi, '');
            
            }

            // ★★★ 新增：扫描世界书（将动态内容作为触发文本传入） ★★★
            const worldInfoPrompt = WorldInfoEngine.scan(targetMoment.text, [], char.id, char.name);
            let wiSection = worldInfoPrompt ? `\n【世界知识/环境信息】\n${worldInfoPrompt}\n` : "";

            const promptText = `
    【系统设定】
    ${char.prompt}
    ${wiSection}
    【历史参考】
    以下是我们最近的聊天记录摘要：
    ${historyContext}

    【当前情境】
    用户发布了一条动态：
    “${targetMoment.text}”

    【任务要求】
    请根据系统设定，以社交平台上的互动方式，对用户的这条动态进行评论。不需要括号描述任何环境、动作，直接输出你要说的内容即可。
    `;

            try {
                // 默认使用全局配置
                let targetApiConfig = {
                    API_URL: STATE.settings.API_URL,
                    API_KEY: STATE.settings.API_KEY,
                    MODEL: STATE.settings.MODEL,
                    MAX_TOKENS: STATE.settings.MAX_TOKENS || 200, 
                    TEMPERATURE: 1.1 
                };

                // 检查是否使用了心迹专属预设
                const presetIndex = STATE.momentsSettings.apiPresetIndex;
                if (typeof presetIndex === 'number' && presetIndex >= 0) {
                    const preset = STATE.settings.API_PRESETS[presetIndex];
                    if (preset) {
                        console.log(`[心迹] 角色 ${char.name} 使用预设: ${preset.name}`);
                        targetApiConfig.API_URL = preset.url;
                        targetApiConfig.API_KEY = preset.key;
                        targetApiConfig.MODEL = preset.model;
                        if(preset.max_tokens) targetApiConfig.MAX_TOKENS = parseInt(preset.max_tokens);
                        if(preset.temperature) targetApiConfig.TEMPERATURE = parseFloat(preset.temperature);
                    }
                }

                // 2.2 发送请求
                const messages = [{ role: 'user', content: promptText }];
                let aiReplyText = await API.chat(messages, targetApiConfig);

                // ★★★ 新增：在存入心迹数组前，从源头剔除 AI 的思考过程 ★★★
                aiReplyText = aiReplyText.replace(/<(?:think|thinking|thought)>[\s\S]*?<\/(?:think|thinking|thought)>/gi, '').trim();

                // 2.3 写入评论
                targetMoment.comments.push({
                    id: 'c_' + Date.now() + Math.random().toString(36).substr(2, 5),
                    senderId: char.id,
                    text: aiReplyText,
                    timestamp: Date.now()
                });

                // 2.4 保存并刷新
                if (typeof Storage !== 'undefined' && Storage.saveMoments) {
                    Storage.saveMoments();
                } else {
                    this.saveMoments(); 
                }
                this.renderMomentsUI();

            } catch (err) {
                console.error(`[心迹] 角色 ${char.name} 评论失败:`, err);
            }
            
            // 简单的防并发延迟
            await new Promise(r => setTimeout(r, 2000)); 
        }
    },




    // ===========================================
    // 执行心迹操作 (复制、编辑、删除)
    // ===========================================
    handleMomentAction(action) {
        const momentId = STATE.selectedMomentId;
        if (!momentId) return;

        // 1. 查找心迹数据
        const momentIndex = STATE.moments.findIndex(m => m.id === momentId);
        if (momentIndex === -1) return;
        
        const momentData = STATE.moments[momentIndex];

        // 2. 隐藏弹出的操作菜单
        const actionModal = document.getElementById('modal-moment-actions');
        if (actionModal) actionModal.classList.add('hidden');

        // 3. 执行对应的动作
        if (action === 'copy') {
            let contentToCopy = momentData.text || "";
            
            // 如果这条心迹带图，给复制内容加个提示
            if (momentData.image) {
                contentToCopy += "\n[图片]";
            }

            navigator.clipboard.writeText(contentToCopy)
                .then(() => {
                    // 你可以用你的 Toast 提示，这里先简单 log
                    console.log("心迹复制成功:", contentToCopy);
                })
                .catch(err => {
                    console.error("复制失败:", err);
                    alert("复制失败，请检查浏览器权限");
                });
        } 
        else if (action === 'edit') {
            const cleanContent = momentData.text;
            
            // ★ 这里兼容了你之前的 UI.showEditModal 逻辑
            // 如果你没有定义 UI.showEditModal，就会自动降级使用浏览器自带的 prompt
            if (typeof UI !== 'undefined' && typeof UI.showEditModal === 'function') {
                UI.showEditModal(cleanContent, (newText) => {
                    if (newText && newText !== cleanContent) {
                        momentData.text = newText;
                        this.saveAndRenderMoments();
                    }
                });
            } else {
                const newText = prompt("编辑心迹内容：", cleanContent);
                if (newText !== null && newText.trim() !== "" && newText !== cleanContent) {
                    momentData.text = newText;
                    this.saveAndRenderMoments();
                }
            }
        } 
        else if (action === 'delete') {
            if (confirm("确定要彻底删除这条心迹吗？")) {
                // 删掉数据
                STATE.moments.splice(momentIndex, 1);
                this.saveAndRenderMoments();
            }
        }
    },

    // 辅助保存和渲染的方法（统一处理容错）
    saveAndRenderMoments() {
        // 保存到本地存储
        if (typeof Storage !== 'undefined' && Storage.saveMoments) {
            Storage.saveMoments();
        } else if (typeof this.saveMoments === 'function') {
            this.saveMoments();
        }

        // 刷新列表视图
        if (typeof this.renderMomentsUI === 'function') {
            this.renderMomentsUI();
        } else if (typeof App !== 'undefined' && typeof App.renderMomentsUI === 'function') {
            App.renderMomentsUI();
        }
    },



    // ===========================================
    // 处理评论的点击菜单操作 (复制、编辑、重新生成)
    // ===========================================
    async handleCommentAction(action) {
        const ctx = STATE.selectedCommentContext;
        if (!ctx) return;

        // 1. 查找对应的数据
        const momentIndex = STATE.moments.findIndex(m => m.id === ctx.momentId);
        if (momentIndex === -1) return;
        const momentData = STATE.moments[momentIndex];
        
        const commentIndex = momentData.comments.findIndex(c => c.id === ctx.commentId);
        if (commentIndex === -1) return;
        const commentData = momentData.comments[commentIndex];

        // 2. 隐藏弹出的操作菜单
        const actionModal = document.getElementById('modal-comment-actions');
        if (actionModal) actionModal.classList.add('hidden');

        // 3. 分支执行
        if (action === 'copy') {
            navigator.clipboard.writeText(commentData.text)
                .then(() => console.log("评论复制成功:", commentData.text))
                .catch(err => alert("复制失败，请检查浏览器权限"));
        } 
        else if (action === 'edit') {
            const cleanContent = commentData.text;
            // 兼容你原来的编辑逻辑
            if (typeof UI !== 'undefined' && typeof UI.showEditModal === 'function') {
                UI.showEditModal(cleanContent, (newText) => {
                    if (newText && newText !== cleanContent) {
                        commentData.text = newText;
                        this.saveAndRenderMoments();
                    }
                });
            } else {
                const newText = prompt("编辑评论内容：", cleanContent);
                if (newText !== null && newText.trim() !== "" && newText !== cleanContent) {
                    commentData.text = newText;
                    this.saveAndRenderMoments();
                }
            }
        } 
        else if (action === 'regen') {
            if (ctx.charId === 'user') {
                alert("自己的评论不能重新生成哦！");
                return;
            }

            const targetChar = STATE.contacts.find(c => c.id === ctx.charId);
            if (!targetChar) return;

            console.log(`[心迹] 重新生成 ${ctx.charName} 的评论`);

            // 提取对话流：只截取这条评论【之前】的评论作为上下文，不包括要重生成的这条本身
                    let threadContext = momentData.comments.slice(0, commentIndex)
                        .filter(c => {
                    if (c.senderId === ctx.charId) return true;
                    if (c.senderId === 'user') {
                        // ★★★ 核心优雅逻辑：如果有 replyToId，直接精确比对ID，绝对不会错！
                        if (c.replyToId) {
                            return c.replyToId === ctx.charId;
                        }
                        // ★ 兼容老数据：如果老数据没有 replyToId，降级使用旧的字符串匹配
                        if (c.text.startsWith('回复 ') && !c.text.startsWith(`回复 ${ctx.charName}:`)) return false; 
                        return true; 
                    }
                    return false;
                })
                .map(c => {
                    let name = c.senderId === 'user' ? '用户' : ctx.charName;
                    let cleanText = c.text;
                    
                    // ★ 兼容老数据：如果老数据自带前缀，还是给它切掉，避免喂给AI时啰嗦
                    if (c.senderId === 'user' && !c.replyToId && cleanText.startsWith(`回复 ${ctx.charName}: `)) {
                        cleanText = cleanText.replace(`回复 ${ctx.charName}: `, '');
                    }

                    // 过滤 AI 的思考过程
                    if (c.senderId !== 'user') {
                        cleanText = cleanText.replace(/<(?:think|thinking|thought)[^>]*>[\s\S]*?(?:<\/(?:think|thinking|thought)>|$)/gi, '').trim();
                    }
                    return `${name}: ${cleanText}`;
                }).join('\n');  

            let promptText = "";
            
            // ★★★ 新增：扫描世界书（综合动态内容和评论区上下文来进行扫描） ★★★
            const scanText = momentData.text + "\n" + threadContext;
            const worldInfoPrompt = WorldInfoEngine.scan(scanText, [], targetChar.id, targetChar.name);
            let wiSection = worldInfoPrompt ? `\n【世界知识/环境信息】\n${worldInfoPrompt}\n` : "";

            if (threadContext.trim() === "") {

                let historyContext = "无";
                if (targetChar.history && targetChar.history.length > 0) {
                    historyContext = targetChar.history.slice(-5).map(h => {
                        const roleName = (h.role === 'user' || h.sender === 'user') ? '用户' : '你';
                        return `${roleName}: ${h.content}`;
                    }).join('\n');
                    
                    // ★★★ 直接清洗整段文本 ★★★
                    historyContext = historyContext.replace(/<(?:think|thinking|thought)[^>]*>[\s\S]*?(?:<\/(?:think|thinking|thought)>|$)/gi, '');
                }

                promptText = `【系统设定】\n${targetChar.prompt}\n${wiSection}\n【历史参考】\n${historyContext}\n【当前情境】\n用户发布了一条动态：“${momentData.text}”\n【任务要求】\n请根据系统设定，以社交平台上的互动方式，对用户的这条动态进行评论。不需要括号描述任何环境、动作，直接输出你要说的内容即可。`;
            } else {
                // 这是追问回复
                promptText = `【系统设定】\n${targetChar.prompt}\n${wiSection}\n【动态内容】\n用户发布的动态：${momentData.text}\n【评论区对话流】\n${threadContext}\n【任务】\n用户刚刚在评论区专门回复了你。请根据你的人设，继续在评论区回复用户。保持简短，像朋友圈评论一样自然。不要输出动作描写。`;
            }

            // 先把界面改成加载中
            const originalText = commentData.text; // 缓存原文本
            commentData.text = "...重新生成中...";
            this.saveAndRenderMoments();

            try {
                let targetApiConfig = {
                    API_URL: STATE.settings.API_URL,
                    API_KEY: STATE.settings.API_KEY,
                    MODEL: STATE.settings.MODEL,
                    MAX_TOKENS: 5000, 
                    TEMPERATURE: 1.1
                };
                const presetIndex = STATE.momentsSettings?.apiPresetIndex;
                if (typeof presetIndex === 'number' && presetIndex >= 0) {
                    const preset = STATE.settings.API_PRESETS[presetIndex];
                    if (preset) {
                        targetApiConfig.API_URL = preset.url;
                        targetApiConfig.API_KEY = preset.key;
                        targetApiConfig.MODEL = preset.model;
                        if(preset.max_tokens) targetApiConfig.MAX_TOKENS = parseInt(preset.max_tokens);
                        if(preset.temperature) targetApiConfig.TEMPERATURE = parseFloat(preset.temperature);
                    }
                }
                
                // 【补上这行请求代码】
                let aiReplyText = await API.chat([{role:'user', content: promptText}], targetApiConfig);

                // ★★★ 新增：重新生成存入前，也必须剔除思考过程 ★★★
                aiReplyText = aiReplyText.replace(/<(?:think|thinking|thought)>[\s\S]*?<\/(?:think|thinking|thought)>/gi, '').trim();
                
                commentData.text = aiReplyText;
                this.saveAndRenderMoments();

            } catch (e) {
                console.error("重新生成失败:", e);
                alert("重新生成失败，已恢复原评论");
                commentData.text = originalText; // 回退原文本
                this.saveAndRenderMoments();
            }
        }
        // ★★★ 新增：删除评论逻辑 ★★★
        else if (action === 'delete') {
            if (confirm("确定要删除这条评论吗？")) {
                // 根据上面找到的索引，从 comments 数组中删掉这条评论
                momentData.comments.splice(commentIndex, 1);
                // 保存并重新渲染 UI
                this.saveAndRenderMoments();
            }
        }
    },

    // ===========================================
    // 打开自定义回复输入框 (替代 alert/prompt)
    // ===========================================
    openReplyModal() {
        const ctx = STATE.selectedCommentContext;
        if (!ctx) return;
        
        if (ctx.charId === 'user') {
            alert("不能回复自己哦！如果需要可以点击编辑~");
            return;
        }

        // 关闭菜单，打开输入框
        document.getElementById('modal-comment-actions').classList.add('hidden');
        const modal = document.getElementById('modal-reply-comment');
        const title = document.getElementById('modal-reply-title');
        const textarea = document.getElementById('m-reply-text');
        
        title.innerText = `回复 ${ctx.charName}`;
        textarea.value = '';
        modal.classList.remove('hidden');
        textarea.focus();
    },

    // ===========================================
    // 执行回复并触发AI (完美继承你的上下文引擎 + 世界书)
    // ===========================================
    async executeCommentReply() {
        const ctx = STATE.selectedCommentContext;
        if (!ctx) return;

        const textarea = document.getElementById('m-reply-text');
        const userReplyText = textarea.value.trim();
        
        if (!userReplyText) {
            alert("写点什么吧");
            return;
        }

        // 关闭输入弹窗
        document.getElementById('modal-reply-comment').classList.add('hidden');

        const targetMoment = STATE.moments.find(m => m.id === ctx.momentId);
        const targetChar = STATE.contacts.find(c => c.id === ctx.charId);
        if (!targetMoment || !targetChar) return;

        // 1. 存入用户回复
        targetMoment.comments.push({
            id: 'c_' + Date.now(),
            senderId: 'user',
            // ★ 改动1：只存用户真正输入的文本，不再硬拼接 "回复 xxx: "
            text: userReplyText, 
            // ★ 改动2：增加专属字段，明确记录这条评论是回复谁的
            replyToId: ctx.charId,     
            replyToName: ctx.charName, 
            timestamp: Date.now()
        });
        this.saveAndRenderMoments();

        // 2. 触发 AI 追问
        console.log(`[心迹] 触发追问回复: ${targetChar.name}`);

        // 提取对话流 (这里以 executeCommentReply 中的那段为例，regen 里的同理替换)
        let threadContext = targetMoment.comments
            .filter(c => {
                if (c.senderId === ctx.charId) return true;
                if (c.senderId === 'user') {
                    // ★★★ 核心优雅逻辑：如果有 replyToId，直接精确比对ID，绝对不会错！
                    if (c.replyToId) {
                        return c.replyToId === ctx.charId;
                    }
                    // ★ 兼容老数据：如果老数据没有 replyToId，降级使用旧的字符串匹配
                    if (c.text.startsWith('回复 ') && !c.text.startsWith(`回复 ${ctx.charName}:`)) return false; 
                    return true; 
                }
                return false;
            })
            .map(c => {
                let name = c.senderId === 'user' ? '用户' : ctx.charName;
                let cleanText = c.text;
                
                // ★ 兼容老数据：如果老数据自带前缀，还是给它切掉，避免喂给AI时啰嗦
                if (c.senderId === 'user' && !c.replyToId && cleanText.startsWith(`回复 ${ctx.charName}: `)) {
                    cleanText = cleanText.replace(`回复 ${ctx.charName}: `, '');
                }

                // 过滤 AI 的思考过程
                if (c.senderId !== 'user') {
                    cleanText = cleanText.replace(/<(?:think|thinking|thought)[^>]*>[\s\S]*?(?:<\/(?:think|thinking|thought)>|$)/gi, '').trim();
                }
                return `${name}: ${cleanText}`;
            }).join('\n');

        // ★★★ 新增：扫描世界书（用动态内容+用户回复的文本进行扫描） ★★★
        const scanText = targetMoment.text + "\n" + userReplyText;
        const worldInfoPrompt = WorldInfoEngine.scan(scanText, [], targetChar.id, targetChar.name);
        let wiSection = worldInfoPrompt ? `\n【世界知识/环境信息】\n${worldInfoPrompt}\n` : "";

        const promptText = `
    【系统设定】
    ${targetChar.prompt}
    ${wiSection}
    【动态内容】
    用户发布的动态：${targetMoment.text}

    【评论区对话流】
    ${threadContext}

    【任务】
    用户刚刚在评论区专门回复了你。请根据你的人设，继续在评论区回复用户。
    注意：保持简短，像朋友圈评论一样自然。不要输出动作描写(如笑)，直接输出想说的话。
    `;

        try {
            let targetApiConfig = {
                API_URL: STATE.settings.API_URL,
                API_KEY: STATE.settings.API_KEY,
                MODEL: STATE.settings.MODEL,
                MAX_TOKENS: 2000, 
                TEMPERATURE: 1.1
            };

            const presetIndex = STATE.momentsSettings?.apiPresetIndex;
            if (typeof presetIndex === 'number' && presetIndex >= 0) {
                const preset = STATE.settings.API_PRESETS[presetIndex];
                if (preset) {
                    targetApiConfig.API_URL = preset.url;
                    targetApiConfig.API_KEY = preset.key;
                    targetApiConfig.MODEL = preset.model;
                    if(preset.max_tokens) targetApiConfig.MAX_TOKENS = parseInt(preset.max_tokens);
                    if(preset.temperature) targetApiConfig.TEMPERATURE = parseFloat(preset.temperature);
                }
            }

            let aiReplyText = await API.chat([{role:'user', content: promptText}], targetApiConfig);
            

            // ★★★ 新增：追问回复存入前，剔除思考过程 ★★★
            aiReplyText = aiReplyText.replace(/<(?:think|thinking|thought)>[\s\S]*?<\/(?:think|thinking|thought)>/gi, '').trim();


            targetMoment.comments.push({
                id: 'c_' + Date.now(),
                senderId: targetChar.id,
                text: aiReplyText,
                timestamp: Date.now()
            });
            this.saveAndRenderMoments();
        } catch (e) {
            console.error("回复失败:", e);
            alert(`${targetChar.name} 的回复失败，请检查API配置或网络。`);
        }
    },


    // ===========================================
    // ★★★ 新增：【聊天中】生成心迹上下文 Prompt ★★★
    // ===========================================
    getMomentsContextForChat(contactId) {
        // 1. 找到该角色“未读完”的心迹 (计数器 > 0)
        // 我们按时间倒序找，为了不占用太多token，建议限制数量（比如只取最近的3条）
        const relevantMoments = STATE.moments
            .filter(m => m.chatInjectionStatus && m.chatInjectionStatus[contactId] > 0)
            .sort((a, b) => b.timestamp - a.timestamp) // 倒序，最新的在前
            .slice(0, 3); // 限制只处理最近3条，避免token爆炸

        if (relevantMoments.length === 0) return null;

        let contextText = "【近期朋友圈同步(System Info)】\n用户发布了以下新动态（包含你们在评论区的互动）。请将其作为当前对话的背景知识，**无需刻意复述**，但在回复时请保持对此事的记忆。\n";
        let idsToUpdate = [];

        relevantMoments.forEach((m, index) => {
            idsToUpdate.push(m.id); // 记录下ID，等会发送成功了要扣次数

            // 提取该角色相关的评论
            // 规则：只包含“该角色发的”和“用户回复该角色的”
            // 或者是“用户发的且没有明确回复对象的”（可选，这里暂时只取对话流）
            // 提取该角色相关的评论
            const chatThread = m.comments.filter(c => {
                if (c.senderId === contactId) return true;
                if (c.senderId === 'user') {
                    // ★★★ 新优雅逻辑：直接看 ID
                    if (c.replyToId) {
                        return c.replyToId === contactId;
                    }
                    
                    // ★ 兼容老数据
                    if (!c.text.startsWith('回复 ')) return true; // 普通评论算相关
                    const contactName = STATE.contacts.find(ct => ct.id === contactId)?.name || "未知";
                    if (c.text.startsWith(`回复 ${contactName}:`)) return true;
                    return false;
                }
                return false;
            }).map(c => {
                const name = c.senderId === 'user' ? '用户' : '你';
                let cleanText = c.text;

                // 兼容老数据的文本清理
                if (c.senderId === 'user' && !c.replyToId && cleanText.startsWith('回复 ')) {
                    const contactName = STATE.contacts.find(ct => ct.id === contactId)?.name || "未知";
                    cleanText = cleanText.replace(`回复 ${contactName}: `, '').replace(`回复 ${contactName}:`, '');
                }
                
                if (c.senderId !== 'user') {
                    cleanText = cleanText.replace(/<(?:think|thinking|thought)[^>]*>[\s\S]*?(?:<\/(?:think|thinking|thought)>|$)/gi, '').trim();
                }
                return `${name}: ${cleanText}`;
            }).join('\n');

            const hasImage = m.image ? "[附带了一张图片]" : "";
            
            contextText += `\n--- 动态 ${index + 1} ---\n用户：“${m.text}” ${hasImage}\n`;
            if (chatThread) {
                contextText += `[评论区互动]:\n${chatThread}\n`;
            } else {
                contextText += `(暂无评论互动)\n`;
            }
        });

        return { 
            prompt: contextText, 
            momentIds: idsToUpdate 
        };
    },








    /* ----------------------- 心迹结束 --------------- */






    

    bindEvents() {
        // --- Tab 切换 (便签切换小工具) ---
        // 移到这里是为了确保 DOM 元素已经存在，并且逻辑统一管理
        document.querySelectorAll('.tab-item').forEach(item => {
            item.addEventListener('click', () => {
                const target = item.dataset.target;
                document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
                item.classList.add('active');
                const pane = document.getElementById(target);
                if(pane) pane.classList.add('active');
            });
        });

        // --- 输入与发送 ---
        if(UI.els.input) {
            UI.els.input.style.overflowY = 'hidden'; 
            UI.els.input.addEventListener('input', function() {
                this.style.height = 'auto'; 
                this.style.height = (this.scrollHeight) + 'px';
                if (this.value === '') this.style.height = '38px';
            });
            UI.els.input.onkeydown = (e) => {
                const isMobile = window.innerWidth < 800;
                if (e.key === "Enter" && !e.shiftKey && !isMobile) {
                    e.preventDefault(); 
                    App.handleSend(false);
                }
            };
        }

        if(UI.els.sendBtn) UI.els.sendBtn.onclick = () => this.handleSend(false);
        if(UI.els.rerollBtn) UI.els.rerollBtn.onclick = () => this.handleSend(true);
        const backBtn = document.getElementById('back-btn');
        if (backBtn) {
            // 1. 先解绑之前的事件 (防止重复绑定，虽不是必须但为了保险)
            backBtn.onclick = null; 
            
            // 2. 重新绑定
            backBtn.addEventListener('click', () => {
                console.log("[调试] 点击了聊天返回按钮");
                // ★★★ 核心修改：这里要用 'contact-list' 而不是 'list' ★★★
                safeSwitchView('contact-list'); 
            });
        };

        // --- 主设置弹窗 ---
        const mainSetBtn = document.getElementById('main-settings-btn');
        if(mainSetBtn) mainSetBtn.onclick = () => this.openSettings();
        const mainCancel = document.getElementById('main-cancel');
        if(mainCancel) mainCancel.onclick = () => UI.els.mainModal.classList.add('hidden');
        const mainConfirm = document.getElementById('main-confirm');
        if(mainConfirm) mainConfirm.onclick = () => this.saveSettingsFromUI();
        if(UI.els.fetchBtn) UI.els.fetchBtn.onclick = () => this.fetchModelsForUI();

        // =========== 【新增】测试API按钮事件 ===========
        const testApiBtn = document.getElementById('test-api-btn');
        if (testApiBtn) {
            testApiBtn.onclick = () => this.handleTestConnection();
        }

        // =============================================

        // --- ★★★ 世界书弹窗事件绑定 ★★★ --
        const wiClose = document.getElementById('wi-close-btn');
        if(wiClose) wiClose.onclick = () => UI.els.wiModal.classList.add('hidden');
        
        const wiSave = document.getElementById('wi-save-btn');
        if(wiSave) wiSave.onclick = () => this.saveWorldInfoEntry();
        
        const wiDel = document.getElementById('wi-delete-btn');
        if(wiDel) wiDel.onclick = () => this.deleteWorldInfoEntry();

        const wiAdd = document.getElementById('wi-add-btn');
        if(wiAdd) wiAdd.onclick = () => this.clearWorldInfoEditor();

        // 书本操作
        const wiBookSel = document.getElementById('wi-book-select');
        if(wiBookSel) wiBookSel.onchange = (e) => this.switchWorldInfoBook(e.target.value);
        
        const wiBookCharSel = document.getElementById('wi-book-char-select');
        if(wiBookCharSel) wiBookCharSel.onchange = (e) => this.bindCurrentBookToChar(e.target.value);

        const wiNewBook = document.getElementById('wi-new-book-btn');
        if(wiNewBook) wiNewBook.onclick = () => this.createNewBook();

        const wiRenameBook = document.getElementById('wi-rename-book-btn');
        if(wiRenameBook) wiRenameBook.onclick = () => this.renameCurrentBook();

        const wiDelBook = document.getElementById('wi-delete-book-btn');
        if(wiDelBook) wiDelBook.onclick = () => this.deleteCurrentBook();
        
        const wiExportBook = document.getElementById('wi-export-book-btn');
        if(wiExportBook) wiExportBook.onclick = () => this.exportCurrentBook();

        const wiImportBtn = document.getElementById('wi-import-btn');
        const wiFileInput = document.getElementById('wi-file-input');
        if (wiImportBtn && wiFileInput) {
            wiImportBtn.onclick = () => wiFileInput.click();
            wiFileInput.onchange = (e) => this.handleImportWorldInfo(e.target.files[0]);
        }

        // 日夜模式
        if (UI.els.themeLight) UI.els.themeLight.addEventListener('change', () => UI.toggleTheme('light'));
        if (UI.els.themeDark) UI.els.themeDark.addEventListener('change', () => UI.toggleTheme('dark'));

        // 壁纸
        const wpInput = document.getElementById('wallpaper-file-input');
        if(wpInput) {
            wpInput.onchange = async (e) => {
                if(e.target.files[0]) {
                    const base64 = await this.readFile(e.target.files[0]);
                    document.getElementById('wallpaper-preview-img').src = base64;
                    document.getElementById('wallpaper-preview').classList.remove('hidden');
                }
            };
        }

        // 角色编辑
        const addBtn = document.getElementById('add-contact-btn');
        if(addBtn) addBtn.onclick = () => this.openEditModal(null);
        const chatSetBtn = document.getElementById('chat-settings-btn');
        if(chatSetBtn) chatSetBtn.onclick = () => this.openEditModal(STATE.currentContactId);
        
        const modalCancel = document.getElementById('modal-cancel');
        if(modalCancel) modalCancel.onclick = () => document.getElementById('modal-overlay').classList.add('hidden');
        const modalSave = document.getElementById('modal-save');
        if(modalSave) modalSave.onclick = () => { this.saveContactFromModal(); document.getElementById('modal-overlay').classList.add('hidden'); };
        
        // 找到原来写 modalDel.onclick 的地方，整个替换成下面这一段：

        const modalDel = document.getElementById('modal-delete');
        if (modalDel) {
            // 先解绑可能存在的旧事件（可选，视具体逻辑而定，但加上更保险）
            modalDel.onclick = null; 

            modalDel.onclick = async () => {
                if (confirm('删除角色？')) {
                    // 1. 从数据中过滤掉该角色
                    STATE.contacts = STATE.contacts.filter(c => c.id !== this.editingId);
                    await Storage.saveContacts();

                    // 2. 隐藏弹窗
                    document.getElementById('modal-overlay').classList.add('hidden');
                    
                    // 3. 判断逻辑
                    // 如果删除的是当前正在聊的人，就模拟点击“返回”按钮回到列表
                    if (STATE.currentContactId === this.editingId) {
                        const backBtn = document.getElementById('back-btn');
                        if (backBtn) {
                            backBtn.click(); // 这会自动触发你之前绑定的 safeSwitchView('contact-list')
                        } else {
                            // 如果万一没找到按钮，就直接强制切换视图
                            if (typeof safeSwitchView === 'function') safeSwitchView('contact-list');
                            else if (typeof UI.switchView === 'function') UI.switchView('contact-list');
                        }
                    } else {
                        // 如果删除的不是当前聊的人，只需要刷新一下列表即可
                        // 兼容两种写法：
                        if (typeof this.renderContacts === 'function') {
                            this.renderContacts();
                        } else if (typeof UI !== 'undefined' && typeof UI.renderContacts === 'function') {
                            UI.renderContacts();
                        }
                    }
                }
            };
        }

        
        const modalClear = document.getElementById('modal-clear-history');
        if(modalClear) modalClear.onclick = async () => {
            if(confirm('清空聊天记录？')) {
                const c = STATE.contacts.find(x => x.id === this.editingId);
                if(c) { c.history = []; await Storage.saveContacts(); }
                document.getElementById('modal-overlay').classList.add('hidden');
                if(STATE.currentContactId === this.editingId) UI.renderChatHistory(c);
            }
        };

        // 头像上传
        this.bindImageUpload('edit-avatar-file', 'edit-avatar-preview', 'edit-avatar'); 
        this.bindImageUpload('user-avatar-file', 'user-avatar-preview', null, async (base64) => {
            STATE.settings.USER_AVATAR = base64;
            await Storage.saveSettings();
            if(STATE.currentContactId) {
                const c = STATE.contacts.find(x => x.id === STATE.currentContactId);
                if(c) UI.renderChatHistory(c);
            }
        });
        const editUpBtn = document.getElementById('edit-avatar-upload-btn');
        if(editUpBtn) editUpBtn.onclick = () => document.getElementById('edit-avatar-file').click();
        const userUpBtn = document.getElementById('user-avatar-upload-btn');
        if(userUpBtn) userUpBtn.onclick = () => document.getElementById('user-avatar-file').click();


        // --- 长按相关变量 (优化版) ---
        let longPressTimer = null;
        let startX = 0;
        let startY = 0;
        const LONG_PRESS_DURATION = 380;

        // 1. 触摸开始
        UI.els.chatMsgs.addEventListener('touchstart', e => {
            // ★★★ 核心修改：同时获取 group 和 bubble ★★★
            const bubble = e.target.closest('.message-bubble'); // 用于定位
            const group = e.target.closest('.message-group');   // 用于获取索引

            // 如果点的不是一个消息组，或者用户正在选词，则不触发
            if (!group || window.getSelection().toString().length > 0) return;
            
            // 从 group 获取索引
            const msgIndex = parseInt(group.dataset.msgIndex);
            if (isNaN(msgIndex)) return;

            // 记录起始坐标
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            
            longPressTimer = setTimeout(() => {
                e.preventDefault();
                if (window.getSelection().toString().length > 0) return;
                
                // ★★★ 使用 bubble 的位置来弹出菜单，如果 bubble 存在的话 ★★★
                // 这样即使用户按在分割线上，也能在 group 的位置弹出菜单
                const rect = bubble ? bubble.getBoundingClientRect() : group.getBoundingClientRect();
                App.showMessageContextMenu(msgIndex, rect);

            }, LONG_PRESS_DURATION);

        }, { passive: false });

        // 2. 触摸移动 (这段逻辑不用改)
        UI.els.chatMsgs.addEventListener('touchmove', e => {
            if (!longPressTimer) return;
            const moveX = e.touches[0].clientX;
            const moveY = e.touches[0].clientY;
            if (Math.abs(moveX - startX) > 10 || Math.abs(moveY - startY) > 10) {
                clearTimeout(longPressTimer);
                longPressTimer = null;
            }
        }, { passive: true });

        // 3. 触摸结束 (这段逻辑不用改)
        UI.els.chatMsgs.addEventListener('touchend', () => {
            if (longPressTimer) {
                clearTimeout(longPressTimer);
                longPressTimer = null;
            }
        }, { passive: true });

        // 4. 桌面端鼠标长按 (应用相同的修改逻辑)
        UI.els.chatMsgs.addEventListener('mousedown', e => {
            if (e.button !== 0) return; 
            // ★★★ 核心修改：同时获取 group 和 bubble ★★★
            const bubble = e.target.closest('.message-bubble'); // 用于定位
            const group = e.target.closest('.message-group');   // 用于获取索引

            if (!group) return;
            
            const msgIndex = parseInt(group.dataset.msgIndex);
            if (isNaN(msgIndex)) return;

            longPressTimer = setTimeout(() => {
                if (window.getSelection().toString().length > 0) return;
                
                // ★★★ 使用 bubble 或 group 的位置来弹出菜单 ★★★
                const rect = bubble ? bubble.getBoundingClientRect() : group.getBoundingClientRect();
                App.showMessageContextMenu(msgIndex, rect);
            }, LONG_PRESS_DURATION);
        });

        // 这两行不用改
        UI.els.chatMsgs.addEventListener('mouseup', () => clearTimeout(longPressTimer));
        UI.els.chatMsgs.addEventListener('mouseleave', () => clearTimeout(longPressTimer));


        // 日志
        // 1. 打开日志弹窗的按钮
        document.getElementById('btn-show-log').addEventListener('click', () => {
            const logModal = document.getElementById('log-display-modal');
            const logContent = document.getElementById('log-content');
            const logToken = document.getElementById('log-token-count');
            
            // 从全局变量读取刚才 API 存进去的数据
            if (window.LAST_API_LOG) {
                logContent.innerText = window.LAST_API_LOG.content;
                logToken.innerText = `(Tokens: ${window.LAST_API_LOG.tokens})`;
            } else {
                logContent.innerText = "本次会话尚未发送过消息，暂无日志。";
                logToken.innerText = "(Token: 0)";
            }
            
            logModal.classList.remove('hidden');
        });

        // 2. 关闭日志弹窗的按钮 (右上角 X)
        document.getElementById('btn-close-log').addEventListener('click', () => {
            document.getElementById('log-display-modal').classList.add('hidden');
        });

        // 3. (可选) 点击遮罩层也可以关闭
        document.getElementById('log-display-modal').addEventListener('click', (e) => {
            if (e.target.id === 'log-display-modal') {
                e.target.classList.add('hidden');
            }
        });

        // Gist Events
        const gistFind = document.getElementById('gist-find');
        if(gistFind) gistFind.onclick = () => CloudSync.findBackup();
        const gistCreate = document.getElementById('gist-create-and-backup');
        if(gistCreate) gistCreate.onclick = () => CloudSync.createBackup();
        const gistBackup = document.getElementById('gist-backup');
        if(gistBackup) gistBackup.onclick = () => CloudSync.updateBackup();
        const gistRestore = document.getElementById('gist-restore');
        if(gistRestore) gistRestore.onclick = () => CloudSync.restoreBackup();
        const gistIdInput = document.getElementById('gist-id-input');
        if(gistIdInput) gistIdInput.onchange = (e) => CloudSync.updateGistId(e.target.value);

        // =========================================
        // ★★★ 新增：导出聊天记录 (调试版) ★★★
        // =========================================
        const btnExportHistory = document.getElementById('btn-export-history');

        if (btnExportHistory) {
            btnExportHistory.addEventListener('click', () => {
                // --- 调试步骤 1: 检查当前是否有正在编辑的角色 ID ---
                // 使用 App.editingId 或 this.editingId，取决于你的代码结构
                const currentEditingId = App.editingId; 
                
                if (!currentEditingId) {
                    alert("导出失败：没有找到当前角色的 ID。请确保弹窗已正确打开。");
                    console.error("Export Error: this.editingId is", currentEditingId);
                    return;
                }
                console.log("准备导出，角色 ID:", currentEditingId);

                // --- 调试步骤 2: 尝试根据 ID 查找角色 ---
                const contact = STATE.contacts.find(c => c.id === currentEditingId);
                if (!contact) {
                    alert(`导出失败：在数据中找不到 ID 为 ${currentEditingId} 的角色。`);
                    console.error("Export Error: Contact not found for ID", currentEditingId);
                    return;
                }
                console.log("找到角色:", contact.name);

                try {
                    // 1. 准备数据 (确保 history 存在，如果不存在则使用空数组)
                    const historyData = contact.history || [];
                    const jsonStr = JSON.stringify(historyData, null, 2); // 格式化 JSON
                    
                    // 2. 创建下载链接
                    const blob = new Blob([jsonStr], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${contact.name}_history_${new Date().toISOString().slice(0,10)}.json`;
                    
                    // 3. 触发下载
                    document.body.appendChild(a);
                    a.click();
                    
                    // 4. 清理
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    
                    console.log("导出成功！");

                } catch (error) {
                    alert("导出时发生错误：" + error.message);
                    console.error("Export processing error:", error);
                }
            });
        }

        // =========================================
        // ★★★ 最终版：导入聊天记录 (触发文件选择) ★★★
        // =========================================
        const btnImportHistory = document.getElementById('btn-import-history');
        const fileInputHistory = document.getElementById('file-import-history');

        if (btnImportHistory && fileInputHistory) {
            // 点击“导入”按钮，就去触发隐藏的文件选择框
            btnImportHistory.addEventListener('click', () => {
                fileInputHistory.value = ''; // 清空，确保每次都能触发 change 事件
                fileInputHistory.click();
            });

            // 当用户选择了文件后
            fileInputHistory.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (!file) return;

                // 弹出确认框
                if (!confirm("⚠️ 警告：导入操作将【完全覆盖】当前角色的所有聊天记录，且无法撤销。\n\n确定要继续吗？")) {
                    return;
                }

                const reader = new FileReader();
                reader.onload = async (event) => { // ★★★ 改为 async 异步函数 ★★★
                    try {
                        const jsonContent = JSON.parse(event.target.result);
                        
                        if (!Array.isArray(jsonContent)) {
                            throw new Error("文件格式错误：内容必须是JSON数组格式");
                        }

                        // 找到当前正在编辑的角色
                        // 使用 this.editingId 或 App.editingId
                        const contact = STATE.contacts.find(c => c.id === this.editingId);
                        
                        if (contact) {
                            // 1. 覆盖历史记录
                            contact.history = jsonContent;
                            
                            // 2. 保存到数据库
                            await Storage.saveContacts();
                            
                            // 3. 弹出成功提示
                            alert(`成功为角色 [${contact.name}] 导入 ${jsonContent.length} 条消息！`);
                            
                            // ===============================================
                            // ★★★【关键新增】刷新界面并关闭弹窗 ★★★
                            // ===============================================

                            // 4. 关闭弹窗
                            const modal = document.getElementById('modal-overlay');
                            if (modal) {
                                modal.classList.add('hidden');
                            }

                            // 5. 如果当前正在聊天的就是这个角色，则刷新聊天界面
                            if (STATE.currentContactId === this.editingId) {
                                // 调用你自己的渲染函数，把更新后的 contact 数据传进去
                                UI.renderChatHistory(contact); 
                                // 滚动到底部，显示最新的消息
                                UI.scrollToBottom();
                            }
                        } else {
                            throw new Error("找不到当前正在编辑的角色，导入失败。");
                        }
                    } catch (err) {
                        alert("导入失败：" + err.message);
                        console.error("Import Error:", err);
                    }
                };
                reader.readAsText(file);
            });
        }




        // --- 新增：外观相关事件监听 ---
        
        // (1) 监听主题 Radio 切换 (日间/夜间/自定义)
        const themeRadios = document.querySelectorAll('input[name="theme-select"]');
        themeRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                UI.toggleTheme(e.target.value);
            });
        });

        // (2) 监听 CSS 输入框 (实时预览)
        const cssInput = document.getElementById('custom-css-input');
        if (cssInput) {
            cssInput.addEventListener('input', (e) => {
                const val = e.target.value;
                STATE.settings.CUSTOM_CSS = val; // 更新状态
                
                // 如果当前是自定义模式，实时注入样式
                if (STATE.settings.THEME === 'custom') {
                    const styleTag = document.getElementById('user-custom-css');
                    if (styleTag) {styleTag.textContent = this.prefixUserCss(val)};
                }
            });
            // 输入框失去焦点时保存，避免频繁写入数据库
            cssInput.addEventListener('blur', () => {
                Storage.saveSettings();
            });
        }

        // (3) 按钮事件：保存、删除、加载预设
        const saveCssBtn = document.getElementById('save-css-btn');
        if (saveCssBtn) saveCssBtn.addEventListener('click', () => this.handleSaveCssPreset());

        const delCssBtn = document.getElementById('del-css-btn');
        if (delCssBtn) delCssBtn.addEventListener('click', () => this.handleDeleteCssPreset());

        const cssSelect = document.getElementById('css-preset-select');
        if (cssSelect) {
            cssSelect.addEventListener('change', (e) => {
                if (e.target.value !== "") this.handleLoadCssPreset(e.target.value);
            });
        }
        
        // 别忘了在 init 或者打开设置弹窗时调用一次 UI.renderCssPresetMenu()
        // 建议加在 openSettings 函数里，或者 App.init 的最后



        /* ============================================================
        发图
        ============================================================ */
            
        // 1. 点击图标触发文件选择
        UI.els.uploadBtn.addEventListener('click', () => {
            UI.els.uploadInput.click();
        });

        // 2. 监听文件选择
        UI.els.uploadInput.addEventListener('change', async (e) => {
            if (e.target.files && e.target.files[0]) {
                const file = e.target.files[0];
                // 压缩图片逻辑 (为了节省 Token 和 存储) - 这里先直接读 base64
                // 实际建议这里加一个压缩步骤，把图片压到 1024px 以下
                const base64 = await this.readFile(file);
                
                STATE.pendingImage = base64; // 存入状态
                
                // 显示预览
                UI.els.previewImg.src = base64;
                UI.els.previewContainer.style.display = 'block';
                UI.els.input.focus();
            }
        });

        // 3. 清除图片
        UI.els.clearImgBtn.addEventListener('click', () => {
            STATE.pendingImage = null;
            UI.els.uploadInput.value = ''; // 清空 input 防止选同一张不触发 change
            UI.els.previewContainer.style.display = 'none';
        });

        // --- 新增：绑定视觉设置区域的按钮 ---
        // 1. 测试视觉连接按钮
        if (UI.els.testVisionBtn) {
            UI.els.testVisionBtn.addEventListener('click', () => {
                this.handleVisionTestConnection();
            });
        }

        // 2. 拉取视觉模型按钮
        if (UI.els.fetchVisionBtn) {
            UI.els.fetchVisionBtn.addEventListener('click', () => {
                this.fetchVisionModelsForUI();
            });
        }

        // ================== 新增：输入框自动增高，配合图片自动升高 ==================
        // 注意：UI.els.input 是你在第6部分定义的输入框引用
        if (UI.els.input) {
            UI.els.input.addEventListener('input', function() {
                // 1. 先重置高度，防止删除文字后无法回缩
                this.style.height = 'auto'; 
                
                // 2. 根据内容高度调整
                // 38 是你 CSS 里的默认高度，防止空的时候缩得太小
                // Math.min(this.scrollHeight, 150) 如果你想限制最大高度不超过150px
                this.style.height = this.scrollHeight + 'px';
            });
        }
        // ========================================================

        // ★★★ 在这里加上视觉预设的按钮监听 ★★★
        if(UI.els.saveVisionPresetBtn) {
            UI.els.saveVisionPresetBtn.addEventListener('click', () => this.handleSaveVisionPreset());
        }
        if(UI.els.delVisionPresetBtn) {
            UI.els.delVisionPresetBtn.addEventListener('click', () => this.handleDeleteVisionPreset());
        }
        if(UI.els.visionPresetSelect) {
            UI.els.visionPresetSelect.addEventListener('change', () => this.handleLoadVisionPreset());
        }

        /* ==================结束发图============= */


        // ==========================================
        // 探索与心迹 (Moments) 相关事件绑定
        // ==========================================

        // 请把这段代码放在你的 bindEvents 函数里

        // 定义一个安全的辅助函数来调用你的 switchView
        // 假设你的 switchView 是写在全局，或者写在 App 对象里的
        const safeSwitchView = (viewName) => {
            console.log(`[调试] 准备切换到视图: ${viewName}`);
            // 如果你的 switchView 在 App 对象中，就用 UI.switchView
            // 如果在当前对象中，就用 UI.switchView
            // 如果是全局函数，直接用 switchView
            if (typeof UI.switchView === 'function') {
                UI.switchView(viewName);
            } else if (typeof App !== 'undefined' && typeof UI.switchView === 'function') {
                UI.switchView(viewName);
            } else if (typeof switchView === 'function') {
                switchView(viewName);
            } else {
                console.error("找不到 switchView 函数！请检查它的名字或位置。");
            }
        };

        // ================= 1. 底部导航栏切换 =================
        document.getElementById('tab-chat')?.addEventListener('click', () => {
            safeSwitchView('contact-list');
        });

        document.getElementById('tab-explore')?.addEventListener('click', () => {
            safeSwitchView('explore');
        });

        // ================= 2. 探索页面 -> 点击进入心迹 =================
        const exploreMomentsBtn = document.getElementById('explore-moments-btn');
        if (exploreMomentsBtn) {
            exploreMomentsBtn.addEventListener('click', () => {
                console.log("[调试] 点击了心迹入口！");
                safeSwitchView('moments');
            });
        } else {
            console.warn("未找到 #explore-moments-btn 元素");
        }

        // ================= 3. 探索页面 -> 返回联系人 =================
        document.getElementById('explore-back-btn')?.addEventListener('click', () => {
            safeSwitchView('contact-list');
        });

        // ================= 3. 心迹页面 -> 返回探索 =================
        document.getElementById('moments-back-btn')?.addEventListener('click', () => {
            safeSwitchView('explore');
        });

        // ================= 4. 心迹弹窗和交互 =================

        // 图片 先不要
        document.getElementById('btn-write-moment')?.addEventListener('click', () => {
            const modal = document.getElementById('modal-write-moment');
            if(modal) modal.classList.remove('hidden');
        });

        document.getElementById('btn-close-m-write')?.addEventListener('click', () => {
            const modal = document.getElementById('modal-write-moment');
            if(modal) modal.classList.add('hidden');
        });

        // ★★★ 修改后 (一定要改这里！) ★★★
        document.getElementById('moments-settings-btn')?.addEventListener('click', () => {
            // 调用 App.openMomentsSettings() 来填充数据并显示弹窗
            if (typeof this.openMomentsSettings === 'function') {
                this.openMomentsSettings(); 
            } else if (typeof App.openMomentsSettings === 'function') {
                App.openMomentsSettings();
            }
        });

        
        // ★★★ 确保保存按钮也绑定对了 ★★★
        document.getElementById('btn-save-m-settings')?.addEventListener('click', () => {
            if (typeof this.saveMomentsSettings === 'function') {
                this.saveMomentsSettings();
            } else if (typeof App.saveMomentsSettings === 'function') {
                App.saveMomentsSettings();
            }
        });


        // ★★★ 确保发布按钮绑定对了 ★★★
        document.getElementById('btn-publish-m-write')?.addEventListener('click', () => {
            if (typeof this.publishMoment === 'function') {
                this.publishMoment();
            } else if (typeof App.publishMoment === 'function') {
                App.publishMoment();
            }
        });

        document.getElementById('btn-close-m-settings')?.addEventListener('click', () => {
            const modal = document.getElementById('modal-moments-settings');
            if(modal) modal.classList.add('hidden');
        });

        // ==========================================
        // 心迹头部交互 (修改背景、头像、签名)
        // ==========================================

        // 1. 点击背景图 -> 触发隐藏的文件选择框
        document.getElementById('moments-bg')?.addEventListener('click', () => {
            console.log("[调试] 点击了背景图");
            document.getElementById('m-bg-upload-input').click();
        });

        // 2. 监听背景图文件选择完成 -> 读取并替换图片
        document.getElementById('m-bg-upload-input')?.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            try {
                // 复用你原系统里的 readFile 函数 (将文件转为 Base64)
                const base64 = await this.readFile(file); 
                document.getElementById('moments-bg').src = base64;
                
                // 保存到 STATE 和 Storage
                STATE.momentsSettings.bgImage = base64;
                if(typeof Storage !== 'undefined' && Storage.saveMomentsSettings) {
                    Storage.saveMomentsSettings();
                }
            } catch (err) {
                console.error("读取背景图失败:", err);
            }
            // 清空 input，方便下次选同一张图
            e.target.value = ''; 
        });

        // 3. 点击头像 -> 触发隐藏的文件选择框
        document.getElementById('moments-avatar')?.addEventListener('click', () => {
            console.log("[调试] 点击了头像");
            document.getElementById('m-avatar-upload-input').click();
        });

        // 4. 监听头像文件选择完成 -> 读取并替换图片
        document.getElementById('m-avatar-upload-input')?.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            try {
                const base64 = await this.readFile(file); 
                document.getElementById('moments-avatar').src = base64;
                
                // 保存到 STATE 和 Storage
                STATE.momentsSettings.avatar = base64;
                if(typeof Storage !== 'undefined' && Storage.saveMomentsSettings) {
                    Storage.saveMomentsSettings();
                }
            } catch (err) {
                console.error("读取头像图失败:", err);
            }
            e.target.value = ''; 
        });

        // 5. 点击个性签名 -> 弹出浏览器原生输入框修改
        document.getElementById('moments-signature')?.addEventListener('click', () => {
            console.log("[调试] 点击了签名");
            const currentSig = STATE.momentsSettings.signature || "写下你的个性签名...";
            const newSig = prompt("请输入新的个性签名：", currentSig);
            
            // 如果用户点了取消，或者输入为空，则不修改
            if (newSig !== null && newSig.trim() !== "") {
                document.getElementById('moments-signature').innerText = newSig.trim();
                STATE.momentsSettings.signature = newSig.trim();
                
                if(typeof Storage !== 'undefined' && Storage.saveMomentsSettings) {
                    Storage.saveMomentsSettings();
                }
            }
        });

        // 5-2. 点击用户名 -> 弹出修改框
        document.getElementById('moments-username')?.addEventListener('click', () => {
            console.log("[调试] 点击了用户名");
            // 获取当前名字，如果没有则用默认值
            const currentName = STATE.momentsSettings.username || "你的名字";
            const newName = prompt("请输入新的名字：", currentName);
            
            // 校验：不为空且用户没点取消
            if (newName !== null && newName.trim() !== "") {
                const trimmedName = newName.trim();
                // 1. 同步到 UI
                document.getElementById('moments-username').innerText = trimmedName;
                // 2. 同步到内存状态
                STATE.momentsSettings.username = trimmedName;
                
                // 3. 保存到本地存储
                if(typeof Storage !== 'undefined' && Storage.saveMomentsSettings) {
                    Storage.saveMomentsSettings();
                }
            }
        });

        // ==========================================
        // 发布心迹弹窗：上传图片与预览
        // ==========================================

        // 点击"添加图片"按钮 -> 触发隐藏的文件框
        document.getElementById('btn-m-upload-img')?.addEventListener('click', () => {
            document.getElementById('m-write-img-input').click();
        });

        // 监听文件选择完成 -> 显示预览图
        document.getElementById('m-write-img-input')?.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            try {
                const base64 = await this.readFile(file); 
                const previewImg = document.getElementById('m-write-img-preview');
                previewImg.src = base64;
                previewImg.style.display = 'block'; // 显示图片
                
                // 可选：把按钮文字改成“重新选择图片”
                document.getElementById('btn-m-upload-img').innerText = "重新选择图片";
            } catch (err) {
                console.error("读取撰写图片失败:", err);
            }
        });

        // 点击取消时，清空输入框和预览图
        document.getElementById('btn-close-m-write')?.addEventListener('click', () => {
            const modal = document.getElementById('modal-write-moment');
            if(modal) modal.classList.add('hidden');
            
            // 清空数据，干干净净
            document.getElementById('m-write-text').value = '';
            document.getElementById('m-write-img-input').value = '';
            const previewImg = document.getElementById('m-write-img-preview');
            previewImg.src = '';
            previewImg.style.display = 'none';
            document.getElementById('btn-m-upload-img').innerText = "添加图片";
        });

        // ================= 5. 加载更多心迹 =================
        const loadMoreBtn = document.getElementById('btn-load-more-moments');
        if (loadMoreBtn) {
            loadMoreBtn.addEventListener('click', () => {
                console.log("[调试] 点击了加载更多！");
                
                // 改变一下按钮文字，给用户一个“正在加载”的反馈
                const originalText = loadMoreBtn.innerText;
                loadMoreBtn.innerText = "加载中...";
                loadMoreBtn.disabled = true; // 防止连续狂点

                // 调用你代码里的“加载更多”函数
                // ⚠️ 注意：请把 loadMoreMoments 换成你实际写好的函数名
                try {
                    if (typeof this.loadMoreMoments === 'function') {
                        this.loadMoreMoments();
                    } else if (typeof App !== 'undefined' && typeof App.loadMoreMoments === 'function') {
                        App.loadMoreMoments();
                    } else {
                        console.warn("找不到加载更多的函数！请检查函数名。");
                    }
                } finally {
                    // 假设你的加载是异步的，最好在你的 loadMoreMoments 函数执行完后再恢复按钮
                    // 这里做一个简单的延时恢复兜底
                    setTimeout(() => {
                        loadMoreBtn.innerText = originalText;
                        loadMoreBtn.disabled = false;
                    }, 1000); 
                }
            });
        }


        // ================= 6. 点击评论区角色名字打开菜单 =================
        const momentsFeed = document.getElementById('moments-feed');
        if (momentsFeed) {
            // ★ 核心替换：改为存入上下文并弹出菜单
            momentsFeed.addEventListener('click', (e) => {
                if (e.target.classList.contains('comment-sender-name')) {
                    const momentId = e.target.getAttribute('data-moment-id');
                    const commentId = e.target.getAttribute('data-comment-id');
                    const charId = e.target.getAttribute('data-char-id');
                    const charName = e.target.getAttribute('data-char-name');

                    console.log(`[调试] 点击了评论者: ${charName} (ID: ${charId})`);

                    // 记录当前点击的上下文信息
                    STATE.selectedCommentContext = { momentId, commentId, charId, charName };

                    // 弹出评论操作菜单
                    const actionModal = document.getElementById('modal-comment-actions');
                    if (actionModal) actionModal.classList.remove('hidden');
                }
            });
        }

        // ================= 新增：评论操作菜单的事件绑定 =================
        const commentActionModal = document.getElementById('modal-comment-actions');
        
        document.getElementById('btn-c-action-reply')?.addEventListener('click', () => {
            if (typeof this.openReplyModal === 'function') this.openReplyModal();
            else if (typeof App !== 'undefined' && typeof App.openReplyModal === 'function') App.openReplyModal();
        });
        document.getElementById('btn-c-action-copy')?.addEventListener('click', () => {
            if (typeof this.handleCommentAction === 'function') this.handleCommentAction('copy');
            else if (typeof App !== 'undefined' && typeof App.handleCommentAction === 'function') App.handleCommentAction('copy');
        });
        document.getElementById('btn-c-action-edit')?.addEventListener('click', () => {
            if (typeof this.handleCommentAction === 'function') this.handleCommentAction('edit');
            else if (typeof App !== 'undefined' && typeof App.handleCommentAction === 'function') App.handleCommentAction('edit');
        });
        document.getElementById('btn-c-action-regen')?.addEventListener('click', () => {
            if (typeof this.handleCommentAction === 'function') this.handleCommentAction('regen');
            else if (typeof App !== 'undefined' && typeof App.handleCommentAction === 'function') App.handleCommentAction('regen');
        });

        // ★★★ 新增：删除按钮的事件绑定 ★★★
        document.getElementById('btn-c-action-delete')?.addEventListener('click', () => {
            if (typeof this.handleCommentAction === 'function') this.handleCommentAction('delete');
            else if (typeof App !== 'undefined' && typeof App.handleCommentAction === 'function') App.handleCommentAction('delete');
        });
        
        // 取消按钮
        document.getElementById('btn-c-action-cancel')?.addEventListener('click', () => {
            if (commentActionModal) commentActionModal.classList.add('hidden');
        });

        // 点击菜单外部空白处关闭菜单
        if (commentActionModal) {
            commentActionModal.addEventListener('click', (e) => {
                if (e.target === commentActionModal) commentActionModal.classList.add('hidden');
            });
        }

        // ================= 新增：回复输入框的事件绑定 =================
        document.getElementById('btn-close-m-reply')?.addEventListener('click', () => {
            document.getElementById('modal-reply-comment').classList.add('hidden');
        });

        document.getElementById('btn-publish-m-reply')?.addEventListener('click', () => {
            // 调用发送逻辑
            if (typeof this.executeCommentReply === 'function') this.executeCommentReply();
            else if (typeof App !== 'undefined' && typeof App.executeCommentReply === 'function') App.executeCommentReply();
        });


        // ================= 7. 心迹内容长按操作 (编辑/复制/删除) =================
        let momentPressTimer = null;

        const clearMomentPressTimer = () => {
            if (momentPressTimer) {
                clearTimeout(momentPressTimer);
                momentPressTimer = null;
            }
        };

        if (momentsFeed) { // momentsFeed 是之前 document.getElementById('moments-feed')
            
            // 处理长按开始
            const handleTouchStart = (e) => {
                // 确保点击的是“心迹内容区域”，而不是评论区
                const contentEl = e.target.closest('.moment-content');
                if (!contentEl) return;

                // 向上找到这条心迹的父级卡片，提取 ID (假设渲染时带有 id="m-xxxxx")
                const cardEl = contentEl.closest('.moment-card');
                if (!cardEl) return;
                
                const momentId = cardEl.id.replace('m-', '');

                // 开启长按计时
                momentPressTimer = setTimeout(() => {
                    momentPressTimer = null; // 清空定时器
                    
                    // 1. 触发震动反馈（如果浏览器/手机支持）
                    // if (navigator.vibrate) navigator.vibrate(50);
                    
                    // 2. 记录当前被选中的心迹ID到全局状态
                    STATE.selectedMomentId = momentId;
                    
                    // 3. 弹出操作菜单
                    const actionModal = document.getElementById('modal-moment-actions');
                    if (actionModal) actionModal.classList.remove('hidden');

                }, 600); // 600毫秒算作长按
            };

            // 监听按下事件 (同时兼容移动端触摸和 PC 端鼠标)
            momentsFeed.addEventListener('touchstart', handleTouchStart, { passive: true });
            momentsFeed.addEventListener('mousedown', handleTouchStart);

            // 监听松开/移动事件，打断长按计时
            momentsFeed.addEventListener('touchend', clearMomentPressTimer);
            momentsFeed.addEventListener('touchmove', clearMomentPressTimer, { passive: true });
            momentsFeed.addEventListener('mouseup', clearMomentPressTimer);
            momentsFeed.addEventListener('mouseleave', clearMomentPressTimer);
        }

        // ================= 操作菜单的按钮点击事件 =================
        const actionModal = document.getElementById('modal-moment-actions');
        
        document.getElementById('btn-m-action-copy')?.addEventListener('click', () => {
            if (typeof this.handleMomentAction === 'function') this.handleMomentAction('copy');
        });
        document.getElementById('btn-m-action-edit')?.addEventListener('click', () => {
            if (typeof this.handleMomentAction === 'function') this.handleMomentAction('edit');
        });
        document.getElementById('btn-m-action-delete')?.addEventListener('click', () => {
            if (typeof this.handleMomentAction === 'function') this.handleMomentAction('delete');
        });
        
        // 取消按钮
        document.getElementById('btn-m-action-cancel')?.addEventListener('click', () => {
            if (actionModal) actionModal.classList.add('hidden');
        });



        // ================= 8. 点击空白处关闭长按操作菜单 =================
        const actionModalOverlay = document.getElementById('modal-moment-actions');
        if (actionModalOverlay) {
            actionModalOverlay.addEventListener('click', (e) => {
                // 判断点击的目标是不是遮罩层本身 (而不是里面的面板或按钮)
                if (e.target === actionModalOverlay) {
                    actionModalOverlay.classList.add('hidden');
                }
            });
        };



        /* ==================结束心迹============= */



        /* ==========搜索聊天记录 ===============*/
        // 1. 打开搜索弹窗
        document.getElementById('btn-open-search').onclick = () => {
            document.getElementById('search-modal-overlay').classList.remove('hidden');
            document.getElementById('search-results-list').innerHTML = '<div style="text-align:center; color:gray; padding:20px;">请输入关键字或选择日期进行查找</div>';
            // 顺便关掉底层的设置弹窗，让视野更清晰
            document.getElementById('modal-overlay').classList.add('hidden'); 
        };

        // 2. 关闭搜索弹窗
        document.getElementById('btn-close-search').onclick = () => {
            document.getElementById('search-modal-overlay').classList.add('hidden');
        };

        // 3. 关键字搜索
        document.getElementById('btn-search-keyword').onclick = () => {
            const keyword = document.getElementById('search-keyword-input').value.trim().toLowerCase();
            const contact = STATE.contacts.find(c => c.id === STATE.currentContactId);
            const resultsContainer = document.getElementById('search-results-list');
            
            if (!contact || !keyword) return;
            
            resultsContainer.innerHTML = '';
            let found = false;

            contact.history.forEach((msg, index) => {
                // 过滤系统提示词，匹配用户或助手的消息
                if (msg.role !== 'system' && msg.content.toLowerCase().includes(keyword)) {
                    found = true;
                    const div = document.createElement('div');
                    div.className = 'search-result-item';
                    div.innerHTML = `
                        <div class="search-result-date">${msg.timestamp || '未知时间'} - ${msg.role === 'user' ? '我' : 'TA'}</div>
                        <div class="search-result-text">${msg.content}</div>
                    `;
                    // 点击结果，触发跳转
                    div.onclick = () => executeJump(index, contact);
                    resultsContainer.appendChild(div);
                }
            });

            if (!found) resultsContainer.innerHTML = '<div style="text-align:center; color:gray; padding:20px;">未找到匹配的消息</div>';
        };

        // 4. 按日期跳转
        document.getElementById('btn-search-date').onclick = () => {
            const dateVal = document.getElementById('search-date-input').value; // 格式 YYYY-MM-DD
            if (!dateVal) return;
            
            // 把 YYYY-MM-DD 转换为你的 Dec.14 格式
            const dateObj = new Date(dateVal);
            const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            const monthStr = months[dateObj.getMonth()];
            const dayStr = String(dateObj.getDate()).padStart(2, '0');
            const targetStr = `${monthStr}.${dayStr}`; // 结果例如 "Dec.14"

            const contact = STATE.contacts.find(c => c.id === STATE.currentContactId);
            if (!contact) return;

            // 找到该日期的第一条消息
            const targetIndex = contact.history.findIndex(msg => msg.timestamp && msg.timestamp.includes(targetStr));

            if (targetIndex !== -1) {
                executeJump(targetIndex, contact);
            } else {
                alert(`未找到 ${targetStr} 的聊天记录`);
            }
        };

        // 5. 执行跳转的核心方法 (加在代码某处)
        function executeJump(targetIndex, contact) {
            // 隐藏搜索弹窗
            document.getElementById('search-modal-overlay').classList.add('hidden');
            
            // 进入跳转模式
            STATE.chatMode = 'jump';
            STATE.targetHighlightIndex = targetIndex;
            
            // 关键逻辑：往前后各加载 15 条，防止 DOM 卡顿
            STATE.jumpStartIndex = Math.max(0, targetIndex - CONFIG.CHAT_PAGE_SIZE);
            STATE.jumpEndIndex = Math.min(contact.history.length, targetIndex + CONFIG.CHAT_PAGE_SIZE);
            
            // 重新渲染聊天记录
            UI.renderChatHistory(contact);
            
            // 滚动到特定消息并高亮
            setTimeout(() => {
                const targetBubble = document.getElementById(`msg-bubble-${targetIndex}`);
                if (targetBubble) {
                    targetBubble.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    targetBubble.classList.add('highlight-message');
                    // 高亮结束后移除类名
                    setTimeout(() => targetBubble.classList.remove('highlight-message'), 2500);
                }
            }, 100); // 稍微延迟等待DOM渲染完成
        }


        /* ============ 搜索聊天记录结束 ============*/








    },




    readFile(file) {
        return new Promise((r, j) => {
            const reader = new FileReader();
            reader.onload = e => r(e.target.result);
            reader.onerror = j;
            reader.readAsDataURL(file);
        });
    },

    // 这里我们直接从 input 输入框取值
    async handleTestConnection() {
        // 1. 获取 DOM 元素
        const urlInput = UI.els.settingUrl; // 假设你在 UI.els 里存了这个 input
        const keyInput = UI.els.settingKey;
        const modelInput = UI.els.settingModel;
        const statusEl = document.getElementById('test-api-status');
        const btn = document.getElementById('test-api-btn');

        if (!statusEl) return;

        // 2. 简单的校验
        const url = urlInput.value.trim();
        const key = keyInput.value.trim();
        const model = modelInput.value.trim();

        if (!url || !key) {
            statusEl.textContent = '请先填写地址和密钥';
            statusEl.className = 'status-failure';
            return;
        }

        // 3. 设置 UI 为“连接中”
        statusEl.textContent = '连接中...';
        statusEl.className = 'status-pending';
        btn.disabled = true;

        try {
            // 4. 调用 API 测试
            await API.testConnection(url, key, model);

            // 5. 成功
            statusEl.textContent = '已连接！';
            statusEl.className = 'status-success';
        } catch (err) {
            // 6. 失败
            console.error("API测试失败:", err);
            // 显示具体的错误代码，比如 "连接失败: 401 Unauthorized"
            statusEl.textContent = `连接失败: ${err.message}`;
            statusEl.className = 'status-failure';
        } finally {
            btn.disabled = false;
        }
    },

    async fetchModelsForUI() {
        const url = UI.els.settingUrl.value.trim();
        const key = UI.els.settingKey.value.trim();
        if(!url || !key) return alert('请先填写地址和密钥');
        const btn = UI.els.fetchBtn;
        btn.textContent = '获取中...';
        btn.disabled = true;
        try {
            const data = await API.fetchModels(url, key);
            const datalist = document.getElementById('model-options');
            if(datalist) datalist.innerHTML = '';
            if (data.data && Array.isArray(data.data)) {
                data.data.forEach(m => {
                    if(datalist) {
                        const opt = document.createElement('option');
                        opt.value = m.id;
                        datalist.appendChild(opt);
                    }
                });
                if (data.data.length > 0) {
                    UI.els.settingModel.value = data.data[0].id;
                }
                alert(`成功拉取 ${data.data.length} 个模型！`);
            } else {
                alert('连接成功，但对方没有返回有效的模型列表，请手动输入。');
            }
        } catch (e) {
            console.error(e);
            alert('拉取失败，请手动输入模型名。');
        } finally {
            btn.textContent = '拉取模型';
            btn.disabled = false;
        }
    },

    // ============================================
    // ★ 新增函数 1：处理视觉 API 测试
    // ============================================
    async handleVisionTestConnection() {
        // 1. 获取输入值
        const urlInput = UI.els.settingVisionUrl;
        const keyInput = UI.els.settingVisionKey;
        const modelInput = UI.els.settingVisionModel;
        const statusEl = UI.els.visionStatus;
        const btn = UI.els.testVisionBtn;

        // 2. 智能获取参数
        // 如果视觉URL没填，通常不能测试，报错
        const url = urlInput.value.trim(); 
        // ★ 关键逻辑：如果视觉Key没填，自动使用主API的Key
        const key = keyInput.value.trim() || UI.els.settingKey.value.trim(); 
        const model = modelInput.value.trim();

        if (!url || !key) {
            statusEl.textContent = '请检查地址或密钥 (Key留空则尝试共用主Key)';
            statusEl.className = 'api-status-text status-error'; // 样式类名请根据你的CSS调整
            return;
        }

        // 3. UI 变更为“连接中”
        statusEl.textContent = '连接中...';
        statusEl.className = 'api-status-text status-pending';
        btn.disabled = true;

        try {
            // 4. ★直接复用你现有的 API.testConnection★
            await API.testConnection(url, key, model);

            statusEl.textContent = '视觉 API 连接成功！';
            statusEl.className = 'api-status-text status-success';
        } catch (err) {
            console.error("视觉API测试失败:", err);
            statusEl.textContent = `连接失败: ${err.message}`;
            statusEl.className = 'api-status-text status-error';
        } finally {
            btn.disabled = false;
        }
    },

    // ============================================
    // ★ 新增函数 2：处理视觉模型列表拉取
    // ============================================
    async fetchVisionModelsForUI() {
        // 1. 获取视觉部分的输入
        const url = UI.els.settingVisionUrl.value.trim();
        // 这里的 Key 做了一个小优化：如果视觉Key没填，就借用主Key
        const key = UI.els.settingVisionKey.value.trim() || UI.els.settingKey.value.trim();

        if(!url) return alert('请先填写视觉 API 地址');
        
        const btn = UI.els.fetchVisionBtn;
        // 记录一下按钮原来的字（虽然你下面直接写死 '拉取模型' 也行）
        btn.textContent = '获取中...';
        btn.disabled = true;

        try {
            // 2. 调用同一个 API 函数
            const data = await API.fetchModels(url, key);
            
            // 3. 获取视觉专用的 datalist
            const datalist = UI.els.visionModelList; // 对应 id="vision-model-options"
            if(datalist) datalist.innerHTML = '';

            // 4. 解析逻辑 (和你原来的一模一样)
            if (data.data && Array.isArray(data.data)) {
                data.data.forEach(m => {
                    if(datalist) {
                        const opt = document.createElement('option');
                        opt.value = m.id; // 这里的 m.id 是模型名
                        datalist.appendChild(opt);
                    }
                });

                // 自动填入第一个
                if (data.data.length > 0) {
                    UI.els.settingVisionModel.value = data.data[0].id;
                }
                
                // ★★★ 这里就是你要的弹窗 ★★★
                alert(`成功拉取 ${data.data.length} 个模型！`);
                
            } else {
                // 如果格式不对或者列表为空
                alert('连接成功，但对方没有返回有效的模型列表，请手动输入。');
            }

        } catch (e) {
            console.error(e);
            alert('拉取失败，请手动输入模型名。');
        } finally {
            // 5. 恢复按钮
            btn.textContent = '拉取模型';
            btn.disabled = false;
        }
    },


    bindImageUpload(inputId, imgId, inputUrlId, callback) {
        const el = document.getElementById(inputId);
        if(!el) return;
        el.onchange = async (e) => {
            if(e.target.files[0]) {
                const base64 = await this.readFile(e.target.files[0]);
                document.getElementById(imgId).src = base64;
                if(inputUrlId) document.getElementById(inputUrlId).value = base64;
                if(callback) callback(base64);
            }
        };
    },



    // ... fetchVisionModelsForUI() { ... } 结束的大括号后面, 

    // ============================================
    // ★ 新增函数 A：保存视觉预设
    // ============================================
    handleSaveVisionPreset() {
        // 1. 获取输入框的值
        const currentConfig = {
            url: UI.els.settingVisionUrl.value.trim(),
            key: UI.els.settingVisionKey.value.trim(),
            model: UI.els.settingVisionModel.value.trim(),
            prompt: UI.els.settingVisionPrompt.value.trim() // 把提示词也存进去
        };

        // 2. 校验
        if (!currentConfig.url) {
            return alert('请至少填写 API 地址');
        }

        // 3. 输入名称
        const name = prompt("请输入视觉预设名称：", "我的视觉配置 " + ((STATE.settings.VISION_PRESETS || []).length + 1));
        if (!name) return;

        // 4. 初始化数组（防止报错）
        if (!STATE.settings.VISION_PRESETS) STATE.settings.VISION_PRESETS = [];

        // 5. 检查重名覆盖
        const existingIndex = STATE.settings.VISION_PRESETS.findIndex(p => p.name === name);
        const newPreset = { name, ...currentConfig };

        if (existingIndex !== -1) {
            if(!confirm(`预设 "${name}" 已存在，是否覆盖？`)) return;
            STATE.settings.VISION_PRESETS[existingIndex] = newPreset;
        } else {
            STATE.settings.VISION_PRESETS.push(newPreset);
        }

        // 6. 保存设置并刷新UI
        Storage.saveSettings();
        UI.renderVisionPresetMenu(); // 调用刚才在UI里加的函数
        
        // 自动选中刚才保存的
        const newIndex = STATE.settings.VISION_PRESETS.findIndex(p => p.name === name);
        UI.els.visionPresetSelect.value = newIndex;
        
        alert('视觉预设已保存！');
    },

    // ============================================
    // ★ 新增函数 B：加载视觉预设
    // ============================================
    handleLoadVisionPreset() {
        const index = UI.els.visionPresetSelect.value;
        if (index === "") return; 

        const preset = STATE.settings.VISION_PRESETS[index];
        if (preset) {
            UI.els.settingVisionUrl.value = preset.url || '';
            UI.els.settingVisionKey.value = preset.key || '';
            UI.els.settingVisionModel.value = preset.model || '';
            UI.els.settingVisionPrompt.value = preset.prompt || ''; // 加载提示词
            
            // 简单的视觉反馈
            UI.els.settingVisionModel.style.transition = "background 0.3s";
            UI.els.settingVisionModel.style.background = "#e8f5e9";
            setTimeout(() => UI.els.settingVisionModel.style.background = "", 300);
        }
    },

    // ============================================
    // ★ 新增函数 C：删除发图视觉预设
    // ============================================
    handleDeleteVisionPreset() {
        const index = UI.els.visionPresetSelect.value;
        if (index === "") {
            return alert("请先选择一个要删除的预设");
        }

        const presetName = STATE.settings.VISION_PRESETS[index].name;
        if (confirm(`确定要删除视觉预设 "${presetName}" 吗？`)) {
            STATE.settings.VISION_PRESETS.splice(index, 1);
            Storage.saveSettings();
            UI.renderVisionPresetMenu();
            UI.els.visionPresetSelect.value = ""; // 重置为空
        }
    },

    // =============== 结束=====================



    
    
    openEditModal(id) {
        this.editingId = id;
        const modal = document.getElementById('modal-overlay');
        modal.classList.remove('hidden');

        // === 获取元素 ===
        const title = document.getElementById('modal-title');
        const iName = document.getElementById('edit-name');
        const iPrompt = document.getElementById('edit-prompt');
        const preview = document.getElementById('edit-avatar-preview');
        const userPreview = document.getElementById('user-avatar-preview');
        const presetSelect = document.getElementById('edit-char-preset');
        
        // 【保留】：你的日志区域
        const logSection = document.getElementById('log-section');
        
        // 【新增】：聊天记录管理区域 (记得在 HTML 里加上 id="history-manager-section")
        const historySection = document.getElementById('history-manager-section');

        // 用户头像预览
        if(userPreview) userPreview.src = STATE.settings.USER_AVATAR || 'user.jpg';

        // === 预设下拉框填充 (保留原逻辑) ===
        presetSelect.innerHTML = '<option value="">-- 跟随全局默认设置 --</option>';
        const presets = STATE.settings.API_PRESETS || []; 
        presets.forEach(p => {
            const option = document.createElement('option');
            option.value = p.name; 
            option.textContent = `${p.name} (${p.model})`; 
            presetSelect.appendChild(option);
        });

        if (id) {
            // ===========================
            //  编辑模式 (修改现有角色)
            // ===========================
            const c = STATE.contacts.find(x => x.id === id);
            
            title.innerText = '聊天菜单'; 
            iName.value = c.name;
            iPrompt.value = c.prompt || "";
            
            preview.src = c.avatar || './char.jpg';
            presetSelect.value = c.linkedPresetName || "";
            
            // 显示危险按钮
            const btnDelete = document.getElementById('modal-delete');
            const btnClear = document.getElementById('modal-clear-history');
            if(btnDelete) btnDelete.style.display = 'block';
            if(btnClear) btnClear.style.display = 'block';

            // 显示日志按钮
            if (logSection) logSection.style.display = 'block';

            // 显示导入/导出按钮
            if (historySection) historySection.style.display = 'block';

            // 【新增】：只有在聊天界面点进来的编辑，才显示搜索按钮
            const searchSection = document.getElementById('search-history-section');
            if (searchSection) {
                searchSection.style.display = STATE.currentContactId ? 'block' : 'none';
            }

        } else {
            // ===========================
            //  新建模式 (创建新角色)
            // ===========================
            title.innerText = '新建角色';
            iName.value = '';
            iPrompt.value = '你是一个...';
            
            preview.src = './char.jpg'; 
            presetSelect.value = "";
            
            // 隐藏危险按钮
            const btnDelete = document.getElementById('modal-delete');
            const btnClear = document.getElementById('modal-clear-history');
            if(btnDelete) btnDelete.style.display = 'none';
            if(btnClear) btnClear.style.display = 'none';

            // 隐藏日志按钮 
            if (logSection) logSection.style.display = 'none';

            // 隐藏导入/导出按钮
            if (historySection) historySection.style.display = 'none';

            // 【新增】：新建模式不显示搜索
            const searchSection = document.getElementById('search-history-section');
            if (searchSection) searchSection.style.display = 'none';
        }
    },

    async saveContactFromModal() {
        const name = document.getElementById('edit-name').value.trim() || '未命名';
        const prompt = document.getElementById('edit-prompt').value.trim();
        
        // 【关键修改】：不再找 edit-avatar 输入框，而是直接拿图片的 src
        // 这样无论是你上传的本地图片(Base64)，还是网络图片，都在这里面
        const avatar = document.getElementById('edit-avatar-preview').src;

        // 【保留】：获取下拉框选中的预设
        const linkedPresetName = document.getElementById('edit-char-preset').value;

        if (this.editingId) {
            // === 更新现有角色 ===
            const c = STATE.contacts.find(x => x.id === this.editingId);
            if (c) { 
                c.name = name; 
                c.avatar = avatar; 
                c.prompt = prompt; 
                
                // 保存预设绑定
                c.linkedPresetName = linkedPresetName; 
            }
        } else {
            // === 创建新角色 ===
            STATE.contacts.push({ 
                id: Date.now().toString(), 
                name, 
                avatar, 
                prompt, 
                history: [],
                linkedPresetName: linkedPresetName 
            });
        }

        // 保存到数据库
        await Storage.saveContacts();
        UI.renderContacts();
        
        // 如果当前正好在聊这个角色，刷新一下界面
        if (STATE.currentContactId === this.editingId) {
            document.getElementById('chat-title').innerText = name;
            // 如果你想刷新聊天界面的头像，可以加这一句：
            // document.querySelector('.chat-header-avatar').src = avatar; 
            
            const c = STATE.contacts.find(x => x.id === this.editingId);
            UI.renderChatHistory(c);
        }

        // 关闭弹窗
        document.getElementById('modal-overlay').classList.add('hidden');
    },



    // ======================自定义css=============================

    // 1. 保存预设 (改为弹窗输入)
    handleSaveCssPreset() {
        const cssInput = document.getElementById('custom-css-input');
        const css = cssInput.value;

        if (!css) return alert('CSS 内容为空，无需保存');

        // ★★★ 这里改为弹窗输入 ★★★
        const name = prompt("请为当前样式起个名字 (如: 可爱小猫)");
        if (!name) return; // 用户点击取消或没输入

        // 确保数组存在
        if (!STATE.settings.CSS_PRESETS) STATE.settings.CSS_PRESETS = [];

        // 查重逻辑
        const existingIndex = STATE.settings.CSS_PRESETS.findIndex(p => p.name === name);
        if (existingIndex >= 0) {
            if(!confirm(`预设 "${name}" 已存在，要覆盖吗？`)) return;
            STATE.settings.CSS_PRESETS[existingIndex].css = css;
        } else {
            STATE.settings.CSS_PRESETS.push({ name: name, css: css });
        }

        Storage.saveSettings();
        UI.renderCssPresetMenu(); // 刷新下拉框
        alert(`样式预设 "${name}" 已保存！`);
    },

    // 2. 加载预设 (删除了对旧输入框的操作)
    handleLoadCssPreset(index) {
        const presets = STATE.settings.CSS_PRESETS;
        const preset = presets[index];
        
        if (preset) {
            // 填入 CSS 编辑框
            const cssInput = document.getElementById('custom-css-input');
            if(cssInput) cssInput.value = preset.css;

            // ★★★ 注意：我删除了原来填入 nameInput 的那行代码，因为 input 已经被删了 ★★★

            // 更新状态
            STATE.settings.CUSTOM_CSS = preset.css;
            
            // 立即生效
            if (STATE.settings.THEME === 'custom') {
                const styleTag = document.getElementById('user-custom-css');
                if (styleTag) styleTag.textContent = this.prefixUserCss(preset.css);
            }
            Storage.saveSettings();
        }
    },

    // 3. 删除预设 (删除了对旧输入框的操作)
    handleDeleteCssPreset() {
        const select = document.getElementById('css-preset-select');
        const index = select.value;

        if (index === "") return alert("请先选择一个要删除的预设");

        if (confirm("确定要删除这个样式预设吗？")) {
            STATE.settings.CSS_PRESETS.splice(index, 1);
            Storage.saveSettings();
            UI.renderCssPresetMenu();
            
            // 清空选择框
            select.value = "";
            
            // ★★★ 注意：我删除了原来清空 nameInput 的那行代码 ★★★
        }
    },

    /**
     * 为用户输入的CSS规则自动添加 'body.custom-mode' 前缀以提高权重
     * @param {string} rawCss 用户输入的原始CSS字符串
     * @returns {string} 处理后带前缀的CSS字符串
     */
    prefixUserCss(rawCss) {
        if (!rawCss || typeof rawCss !== 'string') return '';

        const prefix = 'body.custom-mode ';
        
        // 简单的CSS解析：按 '}' 分割成块，然后处理每个块的头部
        return rawCss.split('}').map(ruleBlock => {
            if (!ruleBlock.trim()) return ''; // 忽略空块

            const parts = ruleBlock.split('{');
            if (parts.length < 2) return ruleBlock + '}'; // 如果不是标准的 "选择器 { 属性" 结构，直接返回

            const selectors = parts[0];
            const declarations = '{' + parts.slice(1).join('{'); // 重新拼接属性部分

            // 处理组合选择器，如 h1, h2, .main-title
            const prefixedSelectors = selectors.split(',')
                .map(selector => {
                    const trimmedSelector = selector.trim();
                    if (trimmedSelector) {
                        // 忽略 @keyframes, @font-face 等 @ 规则
                        if (trimmedSelector.startsWith('@')) {
                            return trimmedSelector;
                        }
                        return prefix + trimmedSelector;
                    }
                    return '';
                })
                .join(', '); // 用逗号和空格重新连接

            return prefixedSelectors + declarations + '}';
        }).join('\n'); // 最终用换行符合并所有规则
    },
    
};

// =========================================
// 8. UTILS & EXPORTS (工具与启动)
// =========================================


// =========================================
// 专门给【聊天】用的时间格式化函数
// ========================================
function formatTimestamp() {
    const now = new Date();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[now.getMonth()]}.${now.getDate()} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
}


// =========================================
// 专门给心迹（朋友圈）用的时间格式化函数
// 它接受一个参数 ts (timestamp)
// =========================================
function formatTimeForMoments(ts) {
    
    // 如果没有传时间戳，或者时间戳无效，才退化到当前时间
    const date = ts ? new Date(ts) : new Date();
    
    const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
    
    const month = months[date.getMonth()];
    const day = date.getDate();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    // 保持和你聊天界面一致的风格：Jan.20 14:30
    return `${month}${day}日 ${hours}:${minutes}`;
}




// 供HTML按钮直接调用的全局函数
// 1. 在这里加上 async
window.exportData = async () => {
    try {
        console.log("正在导出数据...");
        
        // 2. 在这里加上 await，一定要等数据取回来！
        const rawData = await Storage.exportAllForBackup();
        
        // 3. 拿到真实数据后再转字符串
        const data = JSON.stringify(rawData, null, 2);
        
        const blob = new Blob([data], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const now = new Date();
        const ts = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}`;
        a.download = `TeleWindy-Backup-${ts}.json`;
        a.click();
        URL.revokeObjectURL(url); 
        
        console.log("导出成功！");
    } catch (e) {
        console.error("导出失败", e);
        alert("导出失败，请检查控制台报错");
    }
};

window.importData = (input) => {
    if (!input.files || !input.files[0]) return;
    
    // 1. 提示更加明确
    if (!confirm('【警告】\n恢复将清空当前所有数据！\n\n注意：如果备份文件超过 2.5MB，手机可能无法恢复。确定继续吗？')) {
        input.value = ''; // 清空选择，方便下次重选
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const jsonStr = e.target.result;
            const data = JSON.parse(jsonStr);

            // 2. 关键步骤：计算预计大小，提前预警
            // 简单估算：字符串长度 * 2 = 大致的 LocalStorage 占用字节数
            const estimatedSize = jsonStr.length * 2;
            const limit = 5 * 1024 * 1024; // 5MB

            console.log(`文件字符数: ${jsonStr.length}, 预计内存占用: ${(estimatedSize/1024/1024).toFixed(2)} MB`);

            if (estimatedSize > limit) {
                alert(`【风险提示】\n备份数据解压后约 ${(estimatedSize/1024/1024).toFixed(2)} MB。\n超过了手机 5MB 的限制，极大概率会失败！\n\n建议：在电脑端删除部分聊天记录后重新备份。`);
                // 虽然超标，但还是尝试往下走，万一浏览器也是 UTF-8 存储呢（极少见）
            }

            // 3. 核心修复：在写入前，必须先腾出空间！
            // 如果不先 clear，旧数据 + 新数据 肯定瞬间爆炸
            localStorage.clear(); 
            
            // 4. 开始写入
            Storage.importFromBackup(data);
            
            alert('✅ 恢复成功！页面将刷新');
            location.reload();

        } catch(err) { 
            // 5. 捕获真实的错误原因
            console.error(err);
            if (err.name === 'QuotaExceededError' || err.message.toLowerCase().includes('quota')) {
                alert('❌ 恢复失败：存储空间不足！\n\n原因：你的备份数据太大（超过手机 5MB 限制）。\n\n解决方法：\n1. 请在电脑端导入此备份。\n2. 删除一些带图片的对话或长对话。\n3. 重新导出后再发给手机。');
            } else {
                alert('❌ 恢复失败：文件格式错误或数据损坏。\n' + err.message);
            }
            
            // 恢复失败了，但刚才把 localStorage 清空了，由于是 SPA 可能不需要回滚，
            // 但用户现在的状态是空白的，建议刷新让用户重新初始化
            location.reload(); 
        }
    };
    reader.readAsText(input.files[0]);
};




// ============== markdown  全局配置 =================

/**
 * 终极无敌版 Markdown 解析器 (修复表格 object 报错版)
 */
function parseCustomMarkdown(text) {
    if (!text) return '';

    // 预处理：处理引用的换行
    let processedText = text.replace(/^>\s*/gm, '\n\n'); 

    // 暂存数学公式的数组
    const mathBlocks = [];

    // 1. 提取块级公式 $$ ... $$
    processedText = processedText.replace(/\$\$([\s\S]*?)\$\$/g, (match, mathCode) => {
        const placeholder = `%%%MATH_BLOCK_${mathBlocks.length}%%%`;
        try {
            const html = katex.renderToString(mathCode, { displayMode: true, throwOnError: false });
            mathBlocks.push({ placeholder, html });
            return placeholder;
        } catch (e) { return match; }
    });

    // 2. 提取行内公式 $ ... $
    processedText = processedText.replace(/\$([^\$\n]+?)\$/g, (match, mathCode) => {
        const placeholder = `%%%MATH_INLINE_${mathBlocks.length}%%%`;
        try {
            const html = katex.renderToString(mathCode, { displayMode: false, throwOnError: false });
            mathBlocks.push({ placeholder, html });
            return placeholder;
        } catch (e) { return match; }
    });

    // 3. 配置 marked.js（注意：这里删除了原来惹祸的 renderer）
    marked.setOptions({
        gfm: true,
        breaks: true, 
        mangle: false,
        headerIds: false
    });

    let rawHtml = marked.parse(processedText);

    // 【新增黑科技】：完美给表格套上滚动条 div，无视 marked.js 版本
    // 把 <table> 替换为 <div class="table-container"><table>
    rawHtml = rawHtml.replace(/<table/g, '<div class="table-container"><table');
    // 把 </table> 替换为 </table></div>
    rawHtml = rawHtml.replace(/<\/table>/g, '</table></div>');

    // 4. 塞回咱们漂亮的数学公式
    mathBlocks.forEach(block => {
        rawHtml = rawHtml.replace(block.placeholder, block.html);
    });

    // 5. 安检员 DOMPurify 配置
    const purifyConfig = {
        ADD_TAGS: [
            'div', 'span',
            'math', 'semantics', 'annotation', 'annotation-xml', 'mi', 'mn', 'mo', 
            'mrow', 'mspace', 'msqrt', 'mstyle', 'msub', 'msup', 'msubsup', 
            'mfrac', 'munder', 'mover', 'munderover', 'mpadded', 'mphantom', 
            'mtable', 'mtr', 'mtd', 'mlabeledtr', 'mtext'
        ],
        ADD_ATTR: [
            'class', 'style', 'aria-hidden',
            'mathvariant', 'encoding', 'display', 'xmlns'
        ]
    };

    let sanitizedHtml = DOMPurify.sanitize(rawHtml, purifyConfig);

    return sanitizedHtml;
}

/**
 * 纯文本清洗器 (用于复制)
 */
function cleanMarkdownForCopy(text) {
    if (!text) return '';
    let clean = text;
    clean = clean.replace(/^>\s*/gm, '');      
    clean = clean.replace(/^#+\s+/gm, '');     
    clean = clean.replace(/^\*\s+/gm, '');     
    clean = clean.replace(/[*_~`#|]/g, '');    
    
    // 去除数学公式的 $ 符号
    clean = clean.replace(/\$/g, '');
    clean = clean.replace(/\|/g, '  ');

    return clean;
}
// ============== Markdown 结束 =================

// 启动应用
window.onload = () => App.init();























