/**
 * StorageManager
 * 管理活动数据和每日目标的本地存储
 * 使用缓存优化读写性能
 * 支持多用户数据隔离和存储空间管理
 */
class StorageManager {
    constructor() {
        // 获取当前用户
        this.currentUser = localStorage.getItem('lifeflow_current_user') || 'default';
        
        // LocalStorage键名（基础键，会加上用户前缀）
        this.BASE_KEYS = {
            EXERCISE_ACTIVITIES: 'exercise_activities',
            LEARNING_ACTIVITIES: 'learning_activities',
            EXERCISE_DAILY_GOAL: 'exercise_daily_goal',
            LEARNING_DAILY_GOAL: 'learning_daily_goal',
            LIFE_TASKS: 'life_tasks',
            ACHIEVEMENTS: 'achievements',
            BADGES: 'badges',
            STREAK_DATA: 'streak_data',
            // 社交系统键
            PROFILE: 'profile',
            HEALTH: 'health',
            NOTIFICATIONS: 'notifications',
            BLOCKLIST: 'blocklist'
        };
        
        // 全局数据键（不需要用户前缀）
        this.GLOBAL_KEYS = {
            SOCIAL_POSTS: 'lifeflow_social_posts',
            SOCIAL_REPORTS: 'lifeflow_social_reports',
            FRIENDSHIPS: 'lifeflow_friendships',
            FRIEND_REQUESTS: 'lifeflow_friend_requests',
            CHALLENGES: 'lifeflow_challenges',
            USERS: 'lifeflow_users'
        };
        
        // 使用缓存优化性能
        this.cache = typeof storageCache !== 'undefined' ? storageCache : null;
        
        // 存储空间警告阈值（字节）
        this.STORAGE_WARNING_THRESHOLD = 4 * 1024 * 1024; // 4MB
        this.STORAGE_CRITICAL_THRESHOLD = 4.5 * 1024 * 1024; // 4.5MB
    }
    
    /**
     * 获取带用户前缀的存储键
     * @param {string} baseKey - 基础键名
     * @returns {string} 完整的存储键
     */
    _getUserKey(baseKey) {
        return `lifeflow_${this.currentUser}_${baseKey}`;
    }

    /**
     * 获取活动数据的存储键
     * @param {string} type - 活动类型（'exercise' | 'learning'）
     * @returns {string} 存储键
     */
    _getActivitiesKey(type) {
        const baseKey = type === 'exercise' 
            ? this.BASE_KEYS.EXERCISE_ACTIVITIES 
            : this.BASE_KEYS.LEARNING_ACTIVITIES;
        return this._getUserKey(baseKey);
    }

    /**
     * 获取每日目标的存储键
     * @param {string} type - 活动类型（'exercise' | 'learning'）
     * @returns {string} 存储键
     */
    _getDailyGoalKey(type) {
        const baseKey = type === 'exercise' 
            ? this.BASE_KEYS.EXERCISE_DAILY_GOAL 
            : this.BASE_KEYS.LEARNING_DAILY_GOAL;
        return this._getUserKey(baseKey);
    }

    /**
     * 保存单个活动
     * @param {Activity} activity - 活动对象
     * @returns {boolean} 是否保存成功
     */
    saveActivity(activity) {
        try {
            const activities = this.loadActivities(activity.type);
            
            // 检查是否已存在该活动
            const existingIndex = activities.findIndex(a => a.id === activity.id);
            
            if (existingIndex >= 0) {
                // 更新现有活动
                activities[existingIndex] = activity.toJSON();
            } else {
                // 添加新活动
                activities.push(activity.toJSON());
            }
            
            // 保存到LocalStorage（使用缓存优化）
            const key = this._getActivitiesKey(activity.type);
            const activitiesData = activities.map(a => a instanceof Activity ? a.toJSON() : a);
            
            if (this.cache) {
                this.cache.set(key, activitiesData);
            } else {
                localStorage.setItem(key, JSON.stringify(activitiesData));
            }
            
            // 触发活动更新事件
            this._dispatchActivityUpdateEvent(activity.type);
            
            return true;
        } catch (error) {
            console.error('保存活动失败:', error);
            return false;
        }
    }

    /**
     * 迁移旧数据到新的用户隔离格式
     * @param {string} type - 活动类型（'exercise' | 'learning'）
     */
    migrateOldData(type) {
        const newKey = this._getActivitiesKey(type);
        
        // 检查新键是否已有数据
        if (localStorage.getItem(newKey)) {
            return; // 已迁移，跳过
        }
        
        // 旧的存储键
        const oldKey = type === 'exercise' 
            ? 'lifeflow_exercise_activities' 
            : 'lifeflow_learning_activities';
        
        const oldData = localStorage.getItem(oldKey);
        if (oldData) {
            localStorage.setItem(newKey, oldData);
            console.log(`已迁移${type}数据: ${oldKey} -> ${newKey}`);
        }
    }

    /**
     * 加载所有活动
     * @param {string} type - 活动类型（'exercise' | 'learning'）
     * @returns {Activity[]} 活动列表
     */
    loadActivities(type) {
        try {
            // 自动迁移旧数据
            this.migrateOldData(type);
            
            const key = this._getActivitiesKey(type);
            
            // 使用缓存优化读取
            let activitiesData;
            if (this.cache) {
                activitiesData = this.cache.get(key);
            } else {
                const data = localStorage.getItem(key);
                activitiesData = data ? JSON.parse(data) : null;
            }
            
            if (!activitiesData) {
                return [];
            }
            
            return activitiesData.map(data => Activity.fromJSON(data));
        } catch (error) {
            console.error('加载活动失败:', error);
            return [];
        }
    }

    /**
     * 按日期加载活动
     * @param {string} type - 活动类型（'exercise' | 'learning'）
     * @param {string} date - 日期（YYYY-MM-DD格式）
     * @returns {Activity[]} 该日期的活动列表
     */
    loadActivitiesByDate(type, date) {
        try {
            const allActivities = this.loadActivities(type);
            return allActivities.filter(activity => activity.date === date);
        } catch (error) {
            console.error('按日期加载活动失败:', error);
            return [];
        }
    }

    /**
     * 更新活动
     * @param {string} type - 活动类型（'exercise' | 'learning'）
     * @param {number} id - 活动ID
     * @param {Object} updates - 要更新的字段
     * @returns {boolean} 是否更新成功
     */
    updateActivity(type, id, updates) {
        try {
            const activities = this.loadActivities(type);
            const activityIndex = activities.findIndex(a => a.id === id);
            
            if (activityIndex < 0) {
                console.error('未找到要更新的活动:', id);
                return false;
            }
            
            // 更新活动
            const activity = activities[activityIndex];
            activity.update(updates);
            
            // 保存更新后的活动列表（使用缓存优化）
            const key = this._getActivitiesKey(type);
            const activitiesData = activities.map(a => a.toJSON());
            
            if (this.cache) {
                this.cache.set(key, activitiesData);
            } else {
                localStorage.setItem(key, JSON.stringify(activitiesData));
            }
            
            // 触发活动更新事件
            this._dispatchActivityUpdateEvent(type);
            
            return true;
        } catch (error) {
            console.error('更新活动失败:', error);
            return false;
        }
    }

    /**
     * 删除活动
     * @param {string} type - 活动类型（'exercise' | 'learning'）
     * @param {number} id - 活动ID
     * @returns {boolean} 是否删除成功
     */
    deleteActivity(type, id) {
        try {
            const activities = this.loadActivities(type);
            const filteredActivities = activities.filter(a => a.id !== id);
            
            if (filteredActivities.length === activities.length) {
                console.error('未找到要删除的活动:', id);
                return false;
            }
            
            // 保存过滤后的活动列表（使用缓存优化）
            const key = this._getActivitiesKey(type);
            const activitiesData = filteredActivities.map(a => a.toJSON());
            
            if (this.cache) {
                this.cache.set(key, activitiesData);
            } else {
                localStorage.setItem(key, JSON.stringify(activitiesData));
            }
            
            // 触发活动更新事件
            this._dispatchActivityUpdateEvent(type);
            
            return true;
        } catch (error) {
            console.error('删除活动失败:', error);
            return false;
        }
    }

    /**
     * 保存每日目标
     * @param {string} type - 活动类型（'exercise' | 'learning'）
     * @param {number} minutes - 目标时长（分钟）
     * @returns {boolean} 是否保存成功
     */
    saveDailyGoal(type, minutes) {
        try {
            // 验证输入
            if (typeof minutes !== 'number' || minutes < 1 || minutes > 300) {
                console.error('无效的每日目标:', minutes);
                return false;
            }
            
            const key = this._getDailyGoalKey(type);
            
            if (this.cache) {
                this.cache.set(key, minutes);
            } else {
                localStorage.setItem(key, minutes.toString());
            }
            
            return true;
        } catch (error) {
            console.error('保存每日目标失败:', error);
            return false;
        }
    }

    /**
     * 加载每日目标
     * @param {string} type - 活动类型（'exercise' | 'learning'）
     * @returns {number} 每日目标时长（分钟），默认60
     */
    loadDailyGoal(type) {
        try {
            const key = this._getDailyGoalKey(type);
            
            // 迁移旧的每日目标数据
            const oldKey = type === 'exercise' 
                ? 'lifeflow_exercise_daily_goal' 
                : 'lifeflow_learning_daily_goal';
            
            if (!localStorage.getItem(key) && localStorage.getItem(oldKey)) {
                localStorage.setItem(key, localStorage.getItem(oldKey));
                console.log(`已迁移${type}每日目标: ${oldKey} -> ${key}`);
            }
            
            let minutes;
            if (this.cache) {
                const cached = this.cache.get(key);
                minutes = cached !== null ? cached : null;
            } else {
                const data = localStorage.getItem(key);
                minutes = data ? parseInt(data, 10) : null;
            }
            
            if (minutes === null) {
                return 60; // 默认60分钟
            }
            
            // 验证数据有效性
            if (isNaN(minutes) || minutes < 1 || minutes > 300) {
                return 60;
            }
            
            return minutes;
        } catch (error) {
            console.error('加载每日目标失败:', error);
            return 60;
        }
    }

    /**
     * 清除所有数据（用于测试或重置）
     * @param {string} type - 活动类型（'exercise' | 'learning'）
     */
    clearAll(type) {
        try {
            const activitiesKey = this._getActivitiesKey(type);
            const goalKey = this._getDailyGoalKey(type);
            
            localStorage.removeItem(activitiesKey);
            localStorage.removeItem(goalKey);
            
            return true;
        } catch (error) {
            console.error('清除数据失败:', error);
            return false;
        }
    }

    /**
     * 触发活动更新事件
     * @param {string} type - 活动类型（'exercise' | 'learning'）
     * @private
     */
    _dispatchActivityUpdateEvent(type) {
        // 触发自定义事件，通知其他组件数据已更新
        const event = new CustomEvent('lifeflow:activity:updated', {
            detail: { type }
        });
        window.dispatchEvent(event);
    }

    /**
     * 加载通用数据（用于生活任务、成就等）
     * @param {string} dataKey - 数据键名
     * @param {*} defaultValue - 默认值
     * @returns {*} 数据
     */
    loadData(dataKey, defaultValue = null) {
        try {
            const key = this._getUserKey(dataKey);
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : defaultValue;
        } catch (error) {
            console.error(`加载数据失败 (${dataKey}):`, error);
            return defaultValue;
        }
    }

    /**
     * 保存通用数据
     * @param {string} dataKey - 数据键名
     * @param {*} value - 要保存的数据
     * @returns {boolean} 是否保存成功
     */
    saveData(dataKey, value) {
        try {
            const key = this._getUserKey(dataKey);
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error(`保存数据失败 (${dataKey}):`, error);
            
            // 检查是否是存储空间不足错误
            if (error.name === 'QuotaExceededError') {
                this._handleStorageQuotaExceeded();
            }
            return false;
        }
    }

    // ========== 多用户数据隔离功能 ==========

    /**
     * 切换当前用户
     * @param {string} username - 用户名
     */
    switchUser(username) {
        if (!username) {
            console.error('用户名不能为空');
            return false;
        }
        
        this.currentUser = username;
        localStorage.setItem('lifeflow_current_user', username);
        
        // 清除缓存，强制重新加载新用户数据
        if (this.cache) {
            this.cache.clear();
        }
        
        // 触发用户切换事件
        window.dispatchEvent(new CustomEvent('lifeflow:user:switched', {
            detail: { username }
        }));
        
        console.log(`已切换到用户: ${username}`);
        return true;
    }

    /**
     * 获取当前用户名
     * @returns {string} 当前用户名
     */
    getCurrentUser() {
        return this.currentUser;
    }

    /**
     * 获取所有已注册用户列表
     * @returns {Array} 用户列表
     */
    getAllUsers() {
        try {
            const users = localStorage.getItem(this.GLOBAL_KEYS.USERS);
            return users ? JSON.parse(users) : [];
        } catch (error) {
            console.error('获取用户列表失败:', error);
            return [];
        }
    }

    /**
     * 注册新用户
     * @param {Object} userData - 用户数据 {username, nickname, avatar}
     * @returns {boolean} 是否注册成功
     */
    registerUser(userData) {
        try {
            const users = this.getAllUsers();
            
            // 检查用户名是否已存在
            if (users.find(u => u.username === userData.username)) {
                console.error('用户名已存在:', userData.username);
                return false;
            }
            
            users.push({
                username: userData.username,
                nickname: userData.nickname || userData.username,
                avatar: userData.avatar || '',
                createdAt: Date.now()
            });
            
            localStorage.setItem(this.GLOBAL_KEYS.USERS, JSON.stringify(users));
            return true;
        } catch (error) {
            console.error('注册用户失败:', error);
            return false;
        }
    }

    // ========== 聊天记录唯一键生成 ==========

    /**
     * 生成聊天记录的唯一键
     * @param {string} userId1 - 用户1的ID
     * @param {string} userId2 - 用户2的ID
     * @returns {string} 聊天记录键
     */
    getChatKey(userId1, userId2) {
        // 确保键的一致性：按字母顺序排序
        const sortedIds = [userId1, userId2].sort();
        return `lifeflow_chat_${sortedIds[0]}_${sortedIds[1]}`;
    }

    /**
     * 加载聊天记录
     * @param {string} userId1 - 用户1的ID
     * @param {string} userId2 - 用户2的ID
     * @returns {Array} 聊天消息列表
     */
    loadChatMessages(userId1, userId2) {
        try {
            const key = this.getChatKey(userId1, userId2);
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('加载聊天记录失败:', error);
            return [];
        }
    }

    /**
     * 保存聊天记录
     * @param {string} userId1 - 用户1的ID
     * @param {string} userId2 - 用户2的ID
     * @param {Array} messages - 消息列表
     * @returns {boolean} 是否保存成功
     */
    saveChatMessages(userId1, userId2, messages) {
        try {
            const key = this.getChatKey(userId1, userId2);
            localStorage.setItem(key, JSON.stringify(messages));
            return true;
        } catch (error) {
            console.error('保存聊天记录失败:', error);
            
            if (error.name === 'QuotaExceededError') {
                this._handleStorageQuotaExceeded();
            }
            return false;
        }
    }

    // ========== LocalStorage 空间检测 ==========

    /**
     * 计算LocalStorage已使用空间（字节）
     * @returns {number} 已使用空间大小
     */
    getUsedSpace() {
        let total = 0;
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                total += localStorage[key].length + key.length;
            }
        }
        return total;
    }

    /**
     * 计算当前用户数据占用空间（字节）
     * @returns {number} 用户数据大小
     */
    getUserDataSize() {
        let total = 0;
        const prefix = `lifeflow_${this.currentUser}_`;
        
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key) && key.startsWith(prefix)) {
                total += localStorage[key].length + key.length;
            }
        }
        return total;
    }

    /**
     * 格式化字节大小为可读格式
     * @param {number} bytes - 字节数
     * @returns {string} 格式化后的大小
     */
    formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
    }

    /**
     * 获取存储空间使用情况
     * @returns {Object} 存储空间信息
     */
    getStorageInfo() {
        const usedSpace = this.getUsedSpace();
        const userSpace = this.getUserDataSize();
        const estimatedLimit = 5 * 1024 * 1024; // 估计5MB限制
        
        return {
            usedSpace,
            userSpace,
            estimatedLimit,
            usedPercentage: (usedSpace / estimatedLimit * 100).toFixed(2),
            userPercentage: (userSpace / estimatedLimit * 100).toFixed(2),
            formattedUsed: this.formatBytes(usedSpace),
            formattedUser: this.formatBytes(userSpace),
            formattedLimit: this.formatBytes(estimatedLimit),
            needsCleanup: usedSpace > this.STORAGE_WARNING_THRESHOLD,
            critical: usedSpace > this.STORAGE_CRITICAL_THRESHOLD
        };
    }

    /**
     * 检查存储空间并显示警告
     * @returns {Object} 存储空间信息
     */
    checkStorageSpace() {
        const info = this.getStorageInfo();
        
        if (info.critical) {
            console.warn('⚠️ 存储空间严重不足！已使用:', info.formattedUsed);
            this._showStorageWarning('critical');
        } else if (info.needsCleanup) {
            console.warn('⚠️ 存储空间不足，建议清理数据。已使用:', info.formattedUsed);
            this._showStorageWarning('warning');
        }
        
        return info;
    }

    /**
     * 处理存储空间不足错误
     * @private
     */
    _handleStorageQuotaExceeded() {
        console.error('❌ LocalStorage空间已满！');
        this._showStorageWarning('critical');
        
        // 触发存储空间不足事件
        window.dispatchEvent(new CustomEvent('lifeflow:storage:quota_exceeded', {
            detail: this.getStorageInfo()
        }));
    }

    /**
     * 显示存储空间警告
     * @param {string} level - 警告级别 ('warning' | 'critical')
     * @private
     */
    _showStorageWarning(level) {
        const info = this.getStorageInfo();
        const message = level === 'critical'
            ? `存储空间已满（${info.formattedUsed}/${info.formattedLimit}）！请立即清理数据。`
            : `存储空间不足（${info.formattedUsed}/${info.formattedLimit}），建议清理旧数据。`;
        
        // 触发警告事件
        window.dispatchEvent(new CustomEvent('lifeflow:storage:warning', {
            detail: { level, message, info }
        }));
        
        // 如果有toast通知系统，显示通知
        if (window.toastNotification) {
            window.toastNotification.show(message, level === 'critical' ? 'error' : 'warning');
        }
    }

    // ========== 数据清理功能 ==========

    /**
     * 获取数据清理建议
     * @returns {Object} 清理建议
     */
    getCleanupSuggestions() {
        const suggestions = [];
        const info = this.getStorageInfo();
        
        // 检查动态数据
        const posts = this.loadGlobalData('social_posts', []);
        if (posts.length > 50) {
            const oldPosts = posts.filter(p => {
                const age = (Date.now() - p.createdAt) / (1000 * 60 * 60 * 24);
                return age > 90; // 超过90天
            });
            if (oldPosts.length > 0) {
                suggestions.push({
                    type: 'posts',
                    count: oldPosts.length,
                    description: `删除${oldPosts.length}条超过90天的旧动态`,
                    estimatedSpace: this.formatBytes(JSON.stringify(oldPosts).length)
                });
            }
        }
        
        // 检查聊天记录
        let chatCount = 0;
        let chatSize = 0;
        for (let key in localStorage) {
            if (key.startsWith('lifeflow_chat_')) {
                chatCount++;
                chatSize += localStorage[key].length;
            }
        }
        if (chatCount > 10) {
            suggestions.push({
                type: 'chats',
                count: chatCount,
                description: `清理${chatCount}个聊天记录（每个只保留最近100条）`,
                estimatedSpace: this.formatBytes(chatSize * 0.5) // 估计可清理50%
            });
        }
        
        // 检查通知
        const notifications = this.loadData('notifications', []);
        if (notifications.length > 100) {
            suggestions.push({
                type: 'notifications',
                count: notifications.length - 100,
                description: `删除${notifications.length - 100}条旧通知`,
                estimatedSpace: this.formatBytes(JSON.stringify(notifications.slice(100)).length)
            });
        }
        
        return {
            needsCleanup: suggestions.length > 0,
            storageInfo: info,
            suggestions
        };
    }

    /**
     * 执行数据清理
     * @param {Array} types - 要清理的数据类型 ['posts', 'chats', 'notifications']
     * @returns {Object} 清理结果
     */
    performCleanup(types = []) {
        const results = {
            success: true,
            cleaned: [],
            errors: []
        };
        
        try {
            // 清理旧动态
            if (types.includes('posts')) {
                const posts = this.loadGlobalData('social_posts', []);
                const cutoffDate = Date.now() - (90 * 24 * 60 * 60 * 1000); // 90天前
                const filteredPosts = posts.filter(p => p.createdAt > cutoffDate);
                const removed = posts.length - filteredPosts.length;
                
                if (removed > 0) {
                    this.saveGlobalData('social_posts', filteredPosts);
                    results.cleaned.push({ type: 'posts', count: removed });
                }
            }
            
            // 清理聊天记录
            if (types.includes('chats')) {
                let cleanedChats = 0;
                for (let key in localStorage) {
                    if (key.startsWith('lifeflow_chat_')) {
                        try {
                            const messages = JSON.parse(localStorage[key]);
                            if (messages.length > 100) {
                                const trimmed = messages.slice(-100); // 只保留最近100条
                                localStorage.setItem(key, JSON.stringify(trimmed));
                                cleanedChats++;
                            }
                        } catch (e) {
                            console.error(`清理聊天记录失败: ${key}`, e);
                        }
                    }
                }
                if (cleanedChats > 0) {
                    results.cleaned.push({ type: 'chats', count: cleanedChats });
                }
            }
            
            // 清理通知
            if (types.includes('notifications')) {
                const notifications = this.loadData('notifications', []);
                if (notifications.length > 100) {
                    const trimmed = notifications.slice(0, 100); // 只保留最近100条
                    this.saveData('notifications', trimmed);
                    results.cleaned.push({ 
                        type: 'notifications', 
                        count: notifications.length - 100 
                    });
                }
            }
            
        } catch (error) {
            console.error('数据清理失败:', error);
            results.success = false;
            results.errors.push(error.message);
        }
        
        return results;
    }

    /**
     * 导出用户数据
     * @returns {Object} 用户所有数据
     */
    exportUserData() {
        const data = {
            username: this.currentUser,
            exportedAt: new Date().toISOString(),
            profile: this.loadData('profile'),
            health: this.loadData('health'),
            exerciseActivities: this.loadActivities('exercise'),
            learningActivities: this.loadActivities('learning'),
            lifeTasks: this.loadData('life_tasks'),
            achievements: this.loadData('achievements'),
            badges: this.loadData('badges'),
            notifications: this.loadData('notifications'),
            blocklist: this.loadData('blocklist')
        };
        
        return data;
    }

    /**
     * 清除当前用户所有数据
     * @returns {boolean} 是否清除成功
     */
    clearUserData() {
        try {
            const prefix = `lifeflow_${this.currentUser}_`;
            const keysToRemove = [];
            
            for (let key in localStorage) {
                if (localStorage.hasOwnProperty(key) && key.startsWith(prefix)) {
                    keysToRemove.push(key);
                }
            }
            
            keysToRemove.forEach(key => localStorage.removeItem(key));
            
            console.log(`已清除用户 ${this.currentUser} 的所有数据，共 ${keysToRemove.length} 项`);
            return true;
        } catch (error) {
            console.error('清除用户数据失败:', error);
            return false;
        }
    }

    // ========== 全局数据操作 ==========

    /**
     * 加载全局数据（不带用户前缀）
     * @param {string} key - 数据键（不含前缀）
     * @param {*} defaultValue - 默认值
     * @returns {*} 数据
     */
    loadGlobalData(key, defaultValue = null) {
        try {
            const fullKey = `lifeflow_${key}`;
            const data = localStorage.getItem(fullKey);
            return data ? JSON.parse(data) : defaultValue;
        } catch (error) {
            console.error(`加载全局数据失败 (${key}):`, error);
            return defaultValue;
        }
    }

    /**
     * 保存全局数据（不带用户前缀）
     * @param {string} key - 数据键（不含前缀）
     * @param {*} value - 要保存的数据
     * @returns {boolean} 是否保存成功
     */
    saveGlobalData(key, value) {
        try {
            const fullKey = `lifeflow_${key}`;
            localStorage.setItem(fullKey, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error(`保存全局数据失败 (${key}):`, error);
            
            if (error.name === 'QuotaExceededError') {
                this._handleStorageQuotaExceeded();
            }
            return false;
        }
    }

    /**
     * 通用的load方法（兼容旧代码）
     * @param {string} key - 存储键
     * @returns {*} 数据
     */
    load(key) {
        // 如果键已经包含完整前缀，直接使用
        if (key.startsWith('lifeflow_')) {
            try {
                const data = localStorage.getItem(key);
                return data ? JSON.parse(data) : null;
            } catch (error) {
                console.error(`加载数据失败 (${key}):`, error);
                return null;
            }
        }
        // 否则添加用户前缀
        return this.loadData(key);
    }

    /**
     * 通用的save方法（兼容旧代码）
     * @param {string} key - 存储键
     * @param {*} value - 数据
     * @returns {boolean} 是否成功
     */
    save(key, value) {
        // 如果键已经包含完整前缀，直接使用
        if (key.startsWith('lifeflow_')) {
            try {
                localStorage.setItem(key, JSON.stringify(value));
                return true;
            } catch (error) {
                console.error(`保存数据失败 (${key}):`, error);
                
                if (error.name === 'QuotaExceededError') {
                    this._handleStorageQuotaExceeded();
                }
                return false;
            }
        }
        // 否则添加用户前缀
        return this.saveData(key, value);
    }
}
