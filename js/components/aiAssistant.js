/**
 * AI Assistant Component
 * AI智能助手组件
 */
class AIAssistant {
    constructor() {
        this.isOpen = false;
        this.isMinimized = false;
        this.storageManager = new StorageManager();
        this.deepseek = deepseekService;
        this.messages = [];
        this.suggestions = [];
        
        this.init();
    }

    /**
     * 初始化
     */
    init() {
        this.createUI();
        this.attachEventListeners();
        this.loadMessages();
        this.checkForSuggestions();
        
        // 每30秒检查一次建议
        setInterval(() => this.checkForSuggestions(), 30000);
    }

    /**
     * 创建UI
     */
    createUI() {
        // 创建悬浮球
        const fab = document.createElement('div');
        fab.className = 'ai-assistant-fab';
        fab.innerHTML = '🐬';
        fab.id = 'aiAssistantFab';
        document.body.appendChild(fab);

        // 创建聊天窗口
        const window = document.createElement('div');
        window.className = 'ai-assistant-window';
        window.id = 'aiAssistantWindow';
        window.innerHTML = this.getWindowHTML();
        document.body.appendChild(window);

        this.fab = fab;
        this.window = window;
    }

    /**
     * 获取窗口HTML
     */
    getWindowHTML() {
        return `
            <div class="ai-assistant-header" id="aiAssistantHeader">
                <div class="ai-assistant-header-left">
                    <div class="ai-assistant-header-icon">🐬</div>
                    <div>
                        <div class="ai-assistant-header-title">LifeFlow AI助手</div>
                        <div class="ai-assistant-header-status">在线</div>
                    </div>
                </div>
                <div class="ai-assistant-header-actions">
                    <button class="ai-assistant-header-btn" id="aiMinimizeBtn" title="最小化">
                        <span>−</span>
                    </button>
                    <button class="ai-assistant-header-btn" id="aiCloseBtn" title="关闭">
                        <span>×</span>
                    </button>
                </div>
            </div>

            <div class="ai-assistant-suggestions" id="aiSuggestions" style="display: none;">
                <!-- 智能建议将动态插入这里 -->
            </div>

            <div class="ai-assistant-chat" id="aiChat">
                <!-- 对话消息将动态插入这里 -->
            </div>

            <div class="ai-assistant-shortcuts">
                <div class="ai-shortcuts-grid">
                    <button class="ai-shortcut-btn" data-action="data-analysis">
                        <span class="ai-shortcut-icon">📊</span>
                        <span>数据分析</span>
                    </button>
                    <button class="ai-shortcut-btn" data-action="exercise-advice">
                        <span class="ai-shortcut-icon">💪</span>
                        <span>运动建议</span>
                    </button>
                    <button class="ai-shortcut-btn" data-action="learning-plan">
                        <span class="ai-shortcut-icon">📚</span>
                        <span>学习规划</span>
                    </button>
                    <button class="ai-shortcut-btn" data-action="life-tips">
                        <span class="ai-shortcut-icon">📝</span>
                        <span>生活技巧</span>
                    </button>
                </div>
            </div>

            <div class="ai-assistant-input">
                <div class="ai-input-wrapper">
                    <textarea 
                        class="ai-input-field" 
                        id="aiInputField" 
                        placeholder="输入消息..." 
                        rows="1"
                    ></textarea>
                    <div class="ai-input-actions">
                        <button class="ai-input-btn" id="aiVoiceBtn" title="语音输入">
                            <span>🎤</span>
                        </button>
                        <button class="ai-input-btn send" id="aiSendBtn" title="发送">
                            <span>➤</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 绑定事件监听
     */
    attachEventListeners() {
        // 悬浮球点击
        this.fab.addEventListener('click', () => this.toggle());

        // 关闭按钮
        document.getElementById('aiCloseBtn').addEventListener('click', () => this.close());

        // 最小化按钮
        document.getElementById('aiMinimizeBtn').addEventListener('click', () => this.minimize());

        // 发送按钮
        document.getElementById('aiSendBtn').addEventListener('click', () => this.sendMessage());

        // 输入框回车发送
        const inputField = document.getElementById('aiInputField');
        inputField.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // 输入框自动调整高度
        inputField.addEventListener('input', (e) => {
            e.target.style.height = 'auto';
            e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
        });

        // 快捷功能按钮
        document.querySelectorAll('.ai-shortcut-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.dataset.action;
                this.handleShortcut(action);
            });
        });

        // 语音按钮（暂时禁用）
        document.getElementById('aiVoiceBtn').addEventListener('click', () => {
            alert('语音功能即将上线！');
        });

        // 拖拽功能
        this.makeDraggable();
    }

    /**
     * 使窗口可拖拽
     */
    makeDraggable() {
        const header = document.getElementById('aiAssistantHeader');
        let isDragging = false;
        let currentX, currentY, initialX, initialY;

        header.addEventListener('mousedown', (e) => {
            isDragging = true;
            initialX = e.clientX - this.window.offsetLeft;
            initialY = e.clientY - this.window.offsetTop;
        });

        document.addEventListener('mousemove', (e) => {
            if (isDragging) {
                e.preventDefault();
                currentX = e.clientX - initialX;
                currentY = e.clientY - initialY;
                
                this.window.style.left = currentX + 'px';
                this.window.style.top = currentY + 'px';
                this.window.style.right = 'auto';
                this.window.style.bottom = 'auto';
            }
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
        });
    }

    /**
     * 切换显示/隐藏
     */
    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    /**
     * 打开窗口
     */
    open() {
        this.window.classList.add('show');
        this.isOpen = true;
        
        // 如果是首次打开且没有消息，显示欢迎消息
        if (this.messages.length === 0) {
            this.addMessage('assistant', '你好！我是AI助手 🐬\n\n我能帮你：\n• 数据分析\n• 运动建议\n• 学习规划\n• 时间管理\n\n有什么问题吗？');
        }
    }

    /**
     * 关闭窗口
     */
    close() {
        this.window.classList.remove('show');
        this.isOpen = false;
    }

    /**
     * 最小化
     */
    minimize() {
        this.close();
    }

    /**
     * 发送消息
     */
    async sendMessage() {
        const inputField = document.getElementById('aiInputField');
        const message = inputField.value.trim();
        
        console.log('🚀 开始发送消息:', message);
        
        if (!message) {
            console.log('❌ 消息为空，取消发送');
            return;
        }

        // 检查API Key
        if (!this.deepseek.getApiKey()) {
            console.log('❌ API Key未设置');
            this.showApiKeyPrompt();
            return;
        }

        console.log('✅ API Key已设置');

        // 添加用户消息
        this.addMessage('user', message);
        inputField.value = '';
        inputField.style.height = 'auto';

        // 显示加载动画
        this.showLoading();
        console.log('⏳ 显示加载动画');

        // 获取用户数据
        const userData = this.getUserData();
        console.log('📊 用户数据:', userData);

        try {
            console.log('📡 调用 DeepSeek API...');
            
            // 发送到DeepSeek
            const response = await this.deepseek.sendMessage(message, userData);

            console.log('📥 收到响应:', response);

            // 移除加载动画
            this.hideLoading();
            console.log('✅ 移除加载动画');

            if (response.success) {
                console.log('✅ 响应成功，显示消息');
                this.addMessage('assistant', response.message);
            } else {
                console.error('❌ AI Error:', response.error);
                this.addMessage('assistant', `❌ 出错了：${response.error}\n\n可能原因：\n• API Key无效\n• 网络问题\n• 余额不足\n\n请按F12查看控制台详细错误`);
            }
        } catch (error) {
            // 移除加载动画
            this.hideLoading();
            console.error('❌ 发送消息异常:', error);
            console.error('错误堆栈:', error.stack);
            this.addMessage('assistant', `❌ 发送失败：${error.message}\n\n请按F12查看控制台详细错误`);
        }
    }

    /**
     * 添加消息
     */
    addMessage(role, content) {
        const message = {
            role,
            content,
            timestamp: new Date().toISOString()
        };

        this.messages.push(message);
        this.renderMessage(message);
        this.saveMessages();
        this.scrollToBottom();
    }

    /**
     * 渲染消息
     */
    renderMessage(message) {
        const chatContainer = document.getElementById('aiChat');
        const messageDiv = document.createElement('div');
        messageDiv.className = `ai-message ${message.role}`;
        
        const time = new Date(message.timestamp).toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit'
        });

        messageDiv.innerHTML = `
            <div class="ai-message-avatar">${message.role === 'user' ? '😊' : '🐬'}</div>
            <div class="ai-message-content">
                <div class="ai-message-bubble">${this.formatMessage(message.content)}</div>
                <div class="ai-message-time">${time}</div>
            </div>
        `;

        chatContainer.appendChild(messageDiv);
    }

    /**
     * 格式化消息（支持Markdown和换行）
     */
    formatMessage(content) {
        // 转义HTML特殊字符（除了我们要处理的markdown）
        let formatted = content;
        
        // 处理粗体 **文字**
        formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        
        // 处理斜体 *文字*
        formatted = formatted.replace(/\*(.+?)\*/g, '<em>$1</em>');
        
        // 处理代码块 `代码`
        formatted = formatted.replace(/`(.+?)`/g, '<code>$1</code>');
        
        // 处理列表项（数字列表）
        formatted = formatted.replace(/^(\d+)\.\s+(.+)$/gm, '<div class="list-item"><span class="list-number">$1.</span> $2</div>');
        
        // 处理列表项（无序列表）
        formatted = formatted.replace(/^[•\-\*]\s+(.+)$/gm, '<div class="list-item"><span class="list-bullet">•</span> $1</div>');
        
        // 处理换行
        formatted = formatted.replace(/\n/g, '<br>');
        
        return formatted;
    }

    /**
     * 显示加载动画
     */
    showLoading() {
        const chatContainer = document.getElementById('aiChat');
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'ai-message assistant';
        loadingDiv.id = 'aiLoadingMessage';
        loadingDiv.innerHTML = `
            <div class="ai-message-avatar">🐬</div>
            <div class="ai-message-content">
                <div class="ai-message-bubble">
                    <div class="ai-message-loading">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                </div>
            </div>
        `;
        chatContainer.appendChild(loadingDiv);
        this.scrollToBottom();
    }

    /**
     * 隐藏加载动画
     */
    hideLoading() {
        const loadingDiv = document.getElementById('aiLoadingMessage');
        if (loadingDiv) {
            loadingDiv.remove();
        }
    }

    /**
     * 滚动到底部
     */
    scrollToBottom() {
        const chatContainer = document.getElementById('aiChat');
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    /**
     * 处理快捷功能
     */
    async handleShortcut(action) {
        const userData = this.getUserData();
        
        const actions = {
            'data-analysis': () => this.sendPredefinedMessage('帮我分析一下今天的整体数据情况'),
            'exercise-advice': () => this.sendPredefinedMessage('根据我的运动数据，给我一些运动建议和拉伸指导'),
            'learning-plan': () => this.sendPredefinedMessage('帮我制定一个学习计划，提高学习效率'),
            'life-tips': () => this.sendPredefinedMessage('给我一些生活管理和时间规划的建议')
        };

        if (actions[action]) {
            actions[action]();
        }
    }

    /**
     * 发送预定义消息
     */
    sendPredefinedMessage(message) {
        const inputField = document.getElementById('aiInputField');
        inputField.value = message;
        this.sendMessage();
    }

    /**
     * 获取用户数据
     */
    getUserData() {
        try {
            const today = new Date().toISOString().split('T')[0];
            console.log('📊 获取用户数据，日期:', today);
            
            const currentUser = localStorage.getItem('lifeflow_current_user') || 'default';
            console.log('👤 当前用户:', currentUser);
            
            // 检查 storageManager 是否存在
            if (!this.storageManager) {
                console.warn('⚠️ StorageManager 未初始化，尝试创建新实例');
                // 尝试创建新的 StorageManager 实例
                if (typeof StorageManager !== 'undefined') {
                    this.storageManager = new StorageManager();
                    console.log('✅ StorageManager 创建成功');
                } else {
                    console.error('❌ StorageManager 类未定义');
                }
            }
            
            let exerciseToday = 0;
            let learningToday = 0;
            
            // 获取运动数据
            try {
                if (this.storageManager) {
                    const exerciseActivities = this.storageManager.loadActivities('exercise');
                    console.log('🏃 运动活动总数:', exerciseActivities.length);
                    const todayExercise = exerciseActivities.filter(a => a.date === today && a.completed);
                    console.log('🏃 今日完成的运动:', todayExercise);
                    exerciseToday = todayExercise.reduce((sum, a) => sum + (a.duration || 0), 0);
                    console.log('🏃 今日运动总时长:', exerciseToday, '分钟');
                } else {
                    // 降级方案：直接从 localStorage 读取
                    const key = `lifeflow_${currentUser}_exercise_activities`;
                    const data = localStorage.getItem(key);
                    console.log('🏃 使用降级方案读取运动数据，key:', key);
                    if (data) {
                        const activities = JSON.parse(data);
                        const todayExercise = activities.filter(a => a.date === today && a.completed);
                        exerciseToday = todayExercise.reduce((sum, a) => sum + (a.duration || 0), 0);
                        console.log('🏃 降级方案 - 今日运动:', exerciseToday, '分钟');
                    }
                }
            } catch (e) {
                console.error('❌ 获取运动数据失败:', e);
            }
            
            // 获取学习数据
            try {
                if (this.storageManager) {
                    const learningActivities = this.storageManager.loadActivities('learning');
                    console.log('📚 学习活动总数:', learningActivities.length);
                    const todayLearning = learningActivities.filter(a => a.date === today && a.completed);
                    console.log('📚 今日完成的学习:', todayLearning);
                    learningToday = todayLearning.reduce((sum, a) => sum + (a.duration || 0), 0);
                    console.log('📚 今日学习总时长:', learningToday, '分钟');
                } else {
                    // 降级方案：直接从 localStorage 读取
                    const key = `lifeflow_${currentUser}_learning_activities`;
                    const data = localStorage.getItem(key);
                    console.log('📚 使用降级方案读取学习数据，key:', key);
                    if (data) {
                        const activities = JSON.parse(data);
                        const todayLearning = activities.filter(a => a.date === today && a.completed);
                        learningToday = todayLearning.reduce((sum, a) => sum + (a.duration || 0), 0);
                        console.log('📚 降级方案 - 今日学习:', learningToday, '分钟');
                    }
                }
            } catch (e) {
                console.error('❌ 获取学习数据失败:', e);
            }
            
            // 获取生活任务 - 使用 loadData 方法
            let todayTasks = [];
            try {
                // 检查是否有 loadData 方法
                if (typeof this.storageManager.loadData === 'function') {
                    const lifeTasks = this.storageManager.loadData('life_tasks', {});
                    todayTasks = lifeTasks[today] || [];
                } else {
                    // 降级方案：直接从 localStorage 读取
                    const currentUser = localStorage.getItem('lifeflow_current_user') || 'default';
                    const key = `lifeflow_${currentUser}_life_tasks`;
                    const data = localStorage.getItem(key);
                    if (data) {
                        const lifeTasks = JSON.parse(data);
                        todayTasks = lifeTasks[today] || [];
                    }
                }
            } catch (e) {
                console.warn('获取生活任务失败:', e);
            }
            
            // 获取成就数据
            let totalPoints = 0;
            try {
                if (typeof this.storageManager.loadData === 'function') {
                    const achievements = this.storageManager.loadData('achievements', {
                        unlockedAchievements: [],
                        totalPoints: 0
                    });
                    totalPoints = achievements.totalPoints || 0;
                }
            } catch (e) {
                console.warn('获取成就数据失败:', e);
            }

            // 获取今日运动列表
            let exerciseList = [];
            try {
                if (this.storageManager) {
                    const exerciseActivities = this.storageManager.loadActivities('exercise');
                    exerciseList = exerciseActivities
                        .filter(a => a.date === today && a.completed)
                        .map(a => ({
                            name: a.name,
                            duration: a.duration,
                            notes: a.notes || ''
                        }));
                } else {
                    const key = `lifeflow_${currentUser}_exercise_activities`;
                    const data = localStorage.getItem(key);
                    if (data) {
                        const activities = JSON.parse(data);
                        exerciseList = activities
                            .filter(a => a.date === today && a.completed)
                            .map(a => ({
                                name: a.name,
                                duration: a.duration,
                                notes: a.notes || ''
                            }));
                    }
                }
                console.log('🏃 今日运动列表:', exerciseList);
            } catch (e) {
                console.error('❌ 获取运动列表失败:', e);
            }
            
            // 获取今日学习列表
            let learningList = [];
            try {
                if (this.storageManager) {
                    const learningActivities = this.storageManager.loadActivities('learning');
                    learningList = learningActivities
                        .filter(a => a.date === today && a.completed)
                        .map(a => ({
                            name: a.name,
                            duration: a.duration,
                            notes: a.notes || ''
                        }));
                } else {
                    const key = `lifeflow_${currentUser}_learning_activities`;
                    const data = localStorage.getItem(key);
                    if (data) {
                        const activities = JSON.parse(data);
                        learningList = activities
                            .filter(a => a.date === today && a.completed)
                            .map(a => ({
                                name: a.name,
                                duration: a.duration,
                                notes: a.notes || ''
                            }));
                    }
                }
                console.log('📚 今日学习列表:', learningList);
            } catch (e) {
                console.error('❌ 获取学习列表失败:', e);
            }
            
            // 获取生活任务列表（包含完成状态）
            let lifeTasksList = [];
            try {
                lifeTasksList = todayTasks.map(task => ({
                    text: task.text || task.title || '未命名任务',
                    completed: task.completed || false,
                    notes: task.notes || task.note || ''
                }));
                console.log('📝 今日任务列表:', lifeTasksList);
            } catch (e) {
                console.error('❌ 获取任务列表失败:', e);
            }

            const userData = {
                exerciseToday,
                learningToday,
                lifeTasks: todayTasks.length,
                exerciseStreak: this.calculateStreak('exercise'),
                learningStreak: this.calculateStreak('learning'),
                totalPoints,
                // 新增：详细列表
                exerciseList,
                learningList,
                lifeTasksList
            };
            
            console.log('📊 最终用户数据:', userData);
            
            return userData;
        } catch (error) {
            console.error('❌ 获取用户数据失败:', error);
            console.error('错误堆栈:', error.stack);
            // 返回默认数据
            return {
                exerciseToday: 0,
                learningToday: 0,
                lifeTasks: 0,
                exerciseStreak: 0,
                learningStreak: 0,
                totalPoints: 0
            };
        }
    }

    /**
     * 计算连续天数
     */
    calculateStreak(type) {
        try {
            let activities = [];
            
            if (this.storageManager) {
                activities = this.storageManager.loadActivities(type);
            } else {
                // 降级方案：直接从 localStorage 读取
                const currentUser = localStorage.getItem('lifeflow_current_user') || 'default';
                const key = `lifeflow_${currentUser}_${type}_activities`;
                const data = localStorage.getItem(key);
                if (data) {
                    activities = JSON.parse(data);
                }
            }
            
            const today = new Date();
            let streak = 0;

            for (let i = 0; i < 365; i++) {
                const date = new Date(today);
                date.setDate(date.getDate() - i);
                const dateStr = date.toISOString().split('T')[0];
                
                const hasActivity = activities.some(a => a.date === dateStr && a.completed);
                
                if (hasActivity) {
                    streak++;
                } else if (i > 0) {
                    break;
                }
            }

            console.log(`📅 ${type} 连续天数:`, streak);
            return streak;
        } catch (error) {
            console.error(`❌ 计算${type}连续天数失败:`, error);
            return 0;
        }
    }

    /**
     * 检查智能建议
     */
    checkForSuggestions() {
        const userData = this.getUserData();
        const suggestions = [];

        // 检查是否需要运动提醒
        if (userData.exerciseToday === 0 && new Date().getHours() >= 18) {
            suggestions.push({
                icon: '💪',
                text: '今天还没有运动记录哦！',
                action: 'exercise-advice'
            });
        }

        // 检查是否需要学习提醒
        if (userData.learningToday === 0 && new Date().getHours() >= 20) {
            suggestions.push({
                icon: '📚',
                text: '今天的学习目标还没完成呢！',
                action: 'learning-plan'
            });
        }

        // 检查任务堆积
        if (userData.lifeTasks > 5) {
            suggestions.push({
                icon: '📝',
                text: `有${userData.lifeTasks}个任务待完成`,
                action: 'life-tips'
            });
        }

        this.renderSuggestions(suggestions);
    }

    /**
     * 渲染建议
     */
    renderSuggestions(suggestions) {
        const container = document.getElementById('aiSuggestions');
        
        if (suggestions.length === 0) {
            container.style.display = 'none';
            return;
        }

        container.style.display = 'block';
        container.innerHTML = suggestions.map(s => `
            <div class="ai-suggestion-item">
                <span class="ai-suggestion-icon">${s.icon}</span>
                <span class="ai-suggestion-text">${s.text}</span>
                <button class="ai-suggestion-btn" onclick="aiAssistant.handleShortcut('${s.action}')">
                    查看建议
                </button>
            </div>
        `).join('');
    }

    /**
     * 显示API Key设置提示
     */
    showApiKeyPrompt() {
        const apiKey = prompt('请输入你的DeepSeek API Key：\n\n你可以在 https://platform.deepseek.com 获取API Key');
        
        if (apiKey) {
            this.deepseek.setApiKey(apiKey);
            this.addMessage('assistant', '✅ API Key已设置成功！现在你可以开始使用AI助手了。');
        }
    }

    /**
     * 保存消息历史
     */
    saveMessages() {
        const key = this.storageManager._getUserKey('ai_messages');
        localStorage.setItem(key, JSON.stringify(this.messages.slice(-50))); // 只保存最近50条
    }

    /**
     * 加载消息历史
     */
    loadMessages() {
        const key = this.storageManager._getUserKey('ai_messages');
        const stored = localStorage.getItem(key);
        
        if (stored) {
            try {
                this.messages = JSON.parse(stored);
                this.messages.forEach(msg => this.renderMessage(msg));
            } catch (e) {
                console.error('Failed to load messages:', e);
            }
        }
    }

    /**
     * 清空对话历史
     */
    clearHistory() {
        if (confirm('确定要清空所有对话记录吗？')) {
            this.messages = [];
            this.deepseek.clearHistory();
            document.getElementById('aiChat').innerHTML = '';
            this.saveMessages();
            this.addMessage('assistant', '对话历史已清空。有什么我可以帮你的吗？');
        }
    }
}

// 创建全局实例（在页面加载后初始化）
let aiAssistant;
