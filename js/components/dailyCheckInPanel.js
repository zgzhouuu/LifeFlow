/**
 * DailyCheckInPanel Component
 * 今日打卡面板组件 - 管理每日目标、进度显示和活动列表
 */
class DailyCheckInPanel {
    /**
     * 创建DailyCheckInPanel实例
     * @param {string} containerId - 容器元素ID
     * @param {string} type - 活动类型（'exercise' | 'learning'）
     */
    constructor(containerId, type) {
        this.containerId = containerId;
        this.type = type; // 'exercise' | 'learning'
        this.storageManager = new StorageManager();
        this.activities = [];
        this.dailyGoal = 60; // 默认60分钟
        this.activityEditor = null;
        this.currentDate = new Date().toISOString().split('T')[0];
        this.achievementShownToday = false; // 今日是否已显示达成通知
        
        // 主题颜色
        this.themeColor = type === 'exercise' ? '#4CAF50' : '#2196F3';
    }

    /**
     * 初始化面板
     */
    init() {
        // 显示加载状态
        const container = document.getElementById(this.containerId);
        if (container && typeof loadingManager !== 'undefined') {
            loadingManager.show(container, '加载中...');
        }

        // 模拟异步加载
        setTimeout(() => {
            // 加载每日目标
            this.loadDailyGoal();
            
            // 加载今日活动
            this.loadTodayActivities();
            
            // 渲染UI
            this.render();
            
            // 附加事件监听器
            this.attachEventListeners();
            
            // 注册键盘快捷键
            this.registerKeyboardShortcuts();
            
            // 隐藏加载状态
            if (container && typeof loadingManager !== 'undefined') {
                loadingManager.hide(container);
            }
        }, 300);
    }

    /**
     * 渲染整个面板
     */
    render() {
        const container = document.getElementById(this.containerId);
        if (!container) {
            console.error('未找到容器元素:', this.containerId);
            return;
        }

        // 构建面板HTML
        const panelHTML = `
            <div class="daily-checkin-panel">
                ${this.renderDailyGoalSection()}
                ${this.renderProgressSection()}
                ${this.renderActivityList()}
            </div>
        `;

        container.innerHTML = panelHTML;
    }

    /**
     * 渲染每日目标设置区域
     * @returns {string} HTML字符串
     */
    renderDailyGoalSection() {
        return `
            <div class="daily-goal-section">
                <h3>🎯 每日目标</h3>
                <div class="goal-input-group">
                    <input 
                        type="number" 
                        id="dailyGoalInput" 
                        class="goal-input"
                        value="${this.dailyGoal}" 
                        min="1" 
                        max="300"
                        aria-label="每日目标时长"
                    />
                    <span class="goal-unit">分钟</span>
                </div>
            </div>
        `;
    }

    /**
     * 渲染今日进度显示区域
     * @returns {string} HTML字符串
     */
    renderProgressSection() {
        // 计算进度
        const progress = this.calculateDailyProgress();
        
        // 确定状态图标和文本
        let statusIcon = '⏳';
        let statusText = `还差 ${progress.goal - progress.completed} 分钟达成目标`;
        let statusClass = 'in-progress';
        
        if (progress.achieved) {
            statusIcon = '🎉';
            statusText = '恭喜！今日目标已达成';
            statusClass = 'achieved';
        } else if (progress.completed === 0) {
            statusIcon = '💪';
            statusText = '开始今天的计划吧！';
            statusClass = 'not-started';
        }

        return `
            <div class="daily-progress-section">
                <div class="progress-header">
                    <span class="progress-label">今日进度</span>
                    <span class="progress-value" style="color: ${this.themeColor}">
                        ${progress.completed} / ${progress.goal} 分钟
                    </span>
                </div>
                <div class="progress-bar-container">
                    <div 
                        class="progress-bar ${progress.achieved ? 'achieved' : ''}" 
                        style="width: ${progress.percentage}%; background: ${progress.achieved ? 'linear-gradient(90deg, #FFD700, #FFA500)' : `linear-gradient(90deg, ${this.themeColor}, ${this.getLighterColor(this.themeColor)})`}"
                    ></div>
                </div>
                <div class="progress-status ${statusClass}">
                    <span class="status-icon">${statusIcon}</span>
                    <span class="status-text">${statusText}</span>
                </div>
            </div>
        `;
    }

    /**
     * 渲染活动列表区域
     * @returns {string} HTML字符串
     */
    renderActivityList() {
        const activityItemsHTML = this.activities.length > 0
            ? this.activities.map(activity => this.renderActivityItem(activity)).join('')
            : this.renderEmptyState();

        return `
            <div class="activity-list-section">
                <h3>📋 今日计划</h3>
                <div class="activity-list" id="activityList">
                    ${activityItemsHTML}
                </div>
                <button class="btn-add-activity" id="btnAddActivity" style="background: ${this.themeColor}">
                    + 添加活动
                </button>
            </div>
        `;
    }

    /**
     * 渲染空状态
     * @returns {string} HTML字符串
     */
    renderEmptyState() {
        const activityType = this.type === 'exercise' ? '运动' : '学习';
        return `
            <div class="empty-state-enhanced">
                <div class="empty-state-icon">${this.type === 'exercise' ? '🏃' : '📚'}</div>
                <div class="empty-state-title">还没有${activityType}计划</div>
                <div class="empty-state-message">点击下方按钮添加今天的${activityType}计划，开始打卡吧！</div>
            </div>
        `;
    }

    /**
     * 渲染单个活动项
     * @param {Activity} activity - 活动对象
     * @returns {string} HTML字符串
     */
    renderActivityItem(activity) {
        const completedClass = activity.completed ? 'completed' : '';
        const hoverColor = this.type === 'exercise' ? '#E8F5E9' : '#E3F2FD';
        
        return `
            <div class="activity-item ${completedClass}" data-activity-id="${activity.id}" style="--hover-color: ${hoverColor}">
                <input 
                    type="checkbox" 
                    class="activity-checkbox" 
                    ${activity.completed ? 'checked' : ''}
                    data-activity-id="${activity.id}"
                    aria-label="完成 ${activity.name}"
                />
                <div class="activity-info">
                    <div class="activity-name">${this.escapeHtml(activity.name)}</div>
                    <div class="activity-meta">
                        <span class="activity-duration">⏱️ ${activity.duration}分钟</span>
                        ${activity.notes ? `<span class="activity-notes">📝 ${this.escapeHtml(activity.notes)}</span>` : ''}
                    </div>
                </div>
                <div class="activity-actions">
                    <button 
                        class="btn-edit" 
                        data-activity-id="${activity.id}"
                        aria-label="编辑 ${activity.name}"
                        title="编辑"
                    >✏️</button>
                    <button 
                        class="btn-delete" 
                        data-activity-id="${activity.id}"
                        aria-label="删除 ${activity.name}"
                        title="删除"
                    >🗑️</button>
                </div>
            </div>
        `;
    }

    /**
     * 附加事件监听器
     */
    attachEventListeners() {
        const container = document.getElementById(this.containerId);
        if (!container) return;

        // 每日目标输入变化（使用防抖优化）
        const goalInput = container.querySelector('#dailyGoalInput');
        if (goalInput) {
            // 使用防抖工具函数
            const debouncedSave = typeof debounce !== 'undefined' 
                ? debounce((value) => {
                    if (!isNaN(value) && value >= 1 && value <= 300) {
                        this.saveDailyGoal(value);
                    }
                }, 500)
                : null;
            
            goalInput.addEventListener('input', (e) => {
                const value = parseInt(e.target.value, 10);
                if (debouncedSave) {
                    debouncedSave(value);
                } else {
                    // 回退到原始实现
                    if (!this._goalInputTimeout) this._goalInputTimeout = null;
                    clearTimeout(this._goalInputTimeout);
                    this._goalInputTimeout = setTimeout(() => {
                        if (!isNaN(value) && value >= 1 && value <= 300) {
                            this.saveDailyGoal(value);
                        }
                    }, 500);
                }
            });

            // 失焦时验证
            goalInput.addEventListener('blur', (e) => {
                const value = parseInt(e.target.value, 10);
                if (isNaN(value) || value < 1 || value > 300) {
                    e.target.value = this.dailyGoal;
                    this.showNotification('每日目标必须在1-300分钟之间', 'error');
                }
            });
        }

        // 添加活动按钮
        const btnAddActivity = container.querySelector('#btnAddActivity');
        if (btnAddActivity) {
            btnAddActivity.addEventListener('click', () => {
                this.showAddActivityForm();
            });
        }

        // 活动列表事件委托
        const activityList = container.querySelector('#activityList');
        if (activityList) {
            activityList.addEventListener('click', (e) => {
                const target = e.target;
                
                // 复选框点击
                if (target.classList.contains('activity-checkbox')) {
                    const activityId = parseInt(target.dataset.activityId, 10);
                    this.toggleActivityCompletion(activityId);
                }
                
                // 编辑按钮点击
                if (target.classList.contains('btn-edit')) {
                    const activityId = parseInt(target.dataset.activityId, 10);
                    this.showEditActivityForm(activityId);
                }
                
                // 删除按钮点击
                if (target.classList.contains('btn-delete')) {
                    const activityId = parseInt(target.dataset.activityId, 10);
                    this.deleteActivity(activityId);
                }
            });
        }
    }

    /**
     * 加载每日目标
     */
    loadDailyGoal() {
        this.dailyGoal = this.storageManager.loadDailyGoal(this.type);
    }

    /**
     * 保存每日目标
     * @param {number} minutes - 目标时长（分钟）
     */
    saveDailyGoal(minutes) {
        const success = this.storageManager.saveDailyGoal(this.type, minutes);
        if (success) {
            this.dailyGoal = minutes;
            this.updateProgressDisplay();
            this.showNotification('每日目标已更新', 'success');
        } else {
            this.showNotification('保存失败，请重试', 'error');
        }
    }

    /**
     * 加载今日活动
     */
    loadTodayActivities() {
        this.activities = this.storageManager.loadActivitiesByDate(this.type, this.currentDate);
    }

    /**
     * 添加新活动
     * @param {Object} activityData - 活动数据
     */
    addActivity(activityData) {
        // 创建新活动
        const activity = new Activity({
            ...activityData,
            type: this.type,
            date: this.currentDate
        });

        // 保存到存储
        const success = this.storageManager.saveActivity(activity);
        
        if (success) {
            this.activities.push(activity);
            this.refreshActivityList();
            // 实时更新进度显示
            this.updateProgressDisplay();
            this.showNotification(`✅ 已添加"${activity.name}"`, 'success');
            
            // 检查成就解锁
            this.checkAchievements();
        } else {
            this.showNotification('添加失败，请重试', 'error');
        }
    }

    /**
     * 更新活动
     * @param {number} id - 活动ID
     * @param {Object} updates - 要更新的字段
     */
    updateActivity(id, updates) {
        const success = this.storageManager.updateActivity(this.type, id, updates);
        
        if (success) {
            // 更新本地数据
            const activity = this.activities.find(a => a.id === id);
            if (activity) {
                const oldDuration = activity.duration;
                activity.update(updates);
                
                // 如果时长改变且活动已完成，需要重新计算进度
                if (updates.duration && updates.duration !== oldDuration && activity.completed) {
                    // 实时更新进度显示
                    this.updateProgressDisplay();
                }
            }
            
            this.refreshActivityList();
            this.showNotification('✅ 活动已更新', 'success');
        } else {
            this.showNotification('更新失败，请重试', 'error');
        }
    }

    /**
     * 删除活动
     * @param {number} id - 活动ID
     */
    deleteActivity(id) {
        // 显示确认对话框
        const activity = this.activities.find(a => a.id === id);
        if (!activity) return;

        const confirmed = confirm(`确定要删除"${activity.name}"吗？`);
        if (!confirmed) return;

        // 保存是否已完成（用于进度更新）
        const wasCompleted = activity.completed;

        // 删除活动
        const success = this.storageManager.deleteActivity(this.type, id);
        
        if (success) {
            // 从本地数组中移除
            this.activities = this.activities.filter(a => a.id !== id);
            
            this.refreshActivityList();
            
            // 如果删除的是已完成的活动，需要更新进度
            if (wasCompleted) {
                this.updateProgressDisplay();
            }
            
            this.showNotification('🗑️ 活动已删除', 'success');
        } else {
            this.showNotification('删除失败，请重试', 'error');
        }
    }

    /**
     * 切换活动完成状态
     * @param {number} id - 活动ID
     */
    toggleActivityCompletion(id) {
        const activity = this.activities.find(a => a.id === id);
        if (!activity) return;

        // 保存旧状态用于回滚
        const wasCompleted = activity.completed;

        // 切换完成状态
        activity.toggle();

        // 保存到存储
        const success = this.storageManager.saveActivity(activity);
        
        if (success) {
            // 先更新活动项的视觉状态（即时反馈）
            this.updateActivityItemVisual(id, activity.completed);
            
            // 然后更新进度显示（带动画）
            this.updateProgressDisplay();
            
            // 显示反馈消息
            if (activity.completed) {
                this.showNotification(`✅ 完成了"${activity.name}"`, 'success');
                
                // 检查成就解锁
                this.checkAchievements();
            }
        } else {
            // 回滚状态
            activity.toggle();
            this.showNotification('操作失败，请重试', 'error');
        }
    }

    /**
     * 更新单个活动项的视觉状态（不重新渲染整个列表）
     * @param {number} id - 活动ID
     * @param {boolean} completed - 是否完成
     */
    updateActivityItemVisual(id, completed) {
        const container = document.getElementById(this.containerId);
        if (!container) return;

        const activityItem = container.querySelector(`.activity-item[data-activity-id="${id}"]`);
        if (!activityItem) return;

        // 添加/移除完成状态类（带过渡动画）
        if (completed) {
            activityItem.classList.add('completed');
        } else {
            activityItem.classList.remove('completed');
        }

        // 更新复选框状态
        const checkbox = activityItem.querySelector('.activity-checkbox');
        if (checkbox) {
            checkbox.checked = completed;
        }
    }

    /**
     * 计算今日进度
     * @returns {Object} 进度对象 { completed, goal, percentage, achieved }
     */
    calculateDailyProgress() {
        const dailyProgress = new DailyProgress(
            this.currentDate,
            this.activities,
            this.dailyGoal
        );
        
        return dailyProgress.getProgress();
    }

    /**
     * 更新进度显示（优化版本 - 使用批量DOM更新和节流）
     * 使用动画效果更新进度条和状态
     */
    updateProgressDisplay() {
        // 使用节流避免频繁更新
        if (!this._updateProgressThrottled) {
            const updateFn = () => {
                const container = document.getElementById(this.containerId);
                if (!container) return;

                const progressSection = container.querySelector('.daily-progress-section');
                if (!progressSection) return;

                // 计算新的进度
                const progress = this.calculateDailyProgress();
                
                // 更新进度值文本
                const progressValue = progressSection.querySelector('.progress-value');
                if (progressValue) {
                    progressValue.textContent = `${progress.completed} / ${progress.goal} 分钟`;
                    progressValue.style.color = this.themeColor;
                }

                // 更新进度条（带动画）
                const progressBar = progressSection.querySelector('.progress-bar');
                if (progressBar) {
                    // 添加过渡动画
                    progressBar.style.transition = 'width 0.5s ease, background 0.3s ease';
                    
                    // 更新宽度
                    progressBar.style.width = `${progress.percentage}%`;
                    
                    // 更新背景颜色（达成目标时变为金色）
                    if (progress.achieved) {
                        progressBar.classList.add('achieved');
                        progressBar.style.background = 'linear-gradient(90deg, #FFD700, #FFA500)';
                    } else {
                        progressBar.classList.remove('achieved');
                        progressBar.style.background = `linear-gradient(90deg, ${this.themeColor}, ${this.getLighterColor(this.themeColor)})`;
                    }
                }

                // 更新状态显示（图标和文字）
                this.updateProgressStatus(progressSection, progress);
            };

            // 使用节流函数
            this._updateProgressThrottled = typeof throttle !== 'undefined' 
                ? throttle(updateFn, 300)
                : updateFn;
        }

        this._updateProgressThrottled();
    }

    /**
     * 更新进度状态显示（图标和文字）
     * @param {HTMLElement} progressSection - 进度区域元素
     * @param {Object} progress - 进度对象
     */
    updateProgressStatus(progressSection, progress) {
        const statusIcon = progressSection.querySelector('.status-icon');
        const statusText = progressSection.querySelector('.status-text');
        const progressStatus = progressSection.querySelector('.progress-status');
        
        if (!statusIcon || !statusText || !progressStatus) return;

        // 确定状态图标和文本
        let icon = '⏳';
        let text = `还差 ${progress.goal - progress.completed} 分钟达成目标`;
        let statusClass = 'in-progress';
        
        if (progress.achieved) {
            icon = '🎉';
            text = '恭喜！今日目标已达成';
            statusClass = 'achieved';
            
            // 添加庆祝动画
            this.triggerAchievementAnimation(progressStatus);
        } else if (progress.completed === 0) {
            icon = '💪';
            text = '开始今天的计划吧！';
            statusClass = 'not-started';
        } else if (progress.percentage >= 80) {
            icon = '🔥';
            text = `加油！还差 ${progress.goal - progress.completed} 分钟`;
            statusClass = 'almost-there';
        }

        // 更新图标和文字（带淡入动画）
        statusIcon.style.transition = 'all 0.3s ease';
        statusText.style.transition = 'all 0.3s ease';
        
        // 先淡出
        statusIcon.style.opacity = '0';
        statusText.style.opacity = '0';
        
        setTimeout(() => {
            // 更新内容
            statusIcon.textContent = icon;
            statusText.textContent = text;
            
            // 更新状态类
            progressStatus.className = `progress-status ${statusClass}`;
            
            // 淡入
            statusIcon.style.opacity = '1';
            statusText.style.opacity = '1';
        }, 150);
    }

    /**
     * 触发目标达成动画
     * @param {HTMLElement} element - 要添加动画的元素
     */
    triggerAchievementAnimation(element) {
        // 添加弹跳动画类
        element.classList.add('animate-bounce');
        
        // 动画结束后移除类
        setTimeout(() => {
            element.classList.remove('animate-bounce');
        }, 300);
        
        // 可选：显示庆祝通知
        if (!this.achievementShownToday) {
            this.showNotification('🎉 太棒了！今日目标已达成！', 'success');
            this.achievementShownToday = true;
        }
    }

    /**
     * 刷新活动列表（优化版本 - 使用批量DOM更新）
     */
    refreshActivityList() {
        const container = document.getElementById(this.containerId);
        if (!container) return;

        const activityList = container.querySelector('#activityList');
        if (!activityList) return;

        // 使用批量DOM更新优化性能
        const updateFn = () => {
            const activityItemsHTML = this.activities.length > 0
                ? this.activities.map(activity => this.renderActivityItem(activity)).join('')
                : '<div class="empty-state">暂无活动计划，点击下方按钮添加</div>';
            
            activityList.innerHTML = activityItemsHTML;
        };

        // 如果有批量更新器，使用它；否则直接更新
        if (typeof batchDOMUpdater !== 'undefined') {
            batchDOMUpdater.schedule(updateFn);
        } else {
            updateFn();
        }
    }

    /**
     * 显示添加活动表单
     */
    showAddActivityForm() {
        if (!this.activityEditor) {
            this.activityEditor = new ActivityEditor(
                this.type,
                (formData, activity) => this.handleActivitySave(formData, activity),
                () => this.handleActivityCancel()
            );
        }
        
        this.activityEditor.show();
    }

    /**
     * 显示编辑活动表单
     * @param {number} id - 活动ID
     */
    showEditActivityForm(id) {
        const activity = this.activities.find(a => a.id === id);
        if (!activity) return;

        if (!this.activityEditor) {
            this.activityEditor = new ActivityEditor(
                this.type,
                (formData, activity) => this.handleActivitySave(formData, activity),
                () => this.handleActivityCancel()
            );
        }
        
        this.activityEditor.show(activity);
    }

    /**
     * 处理活动保存
     * @param {Object} formData - 表单数据
     * @param {Activity|null} activity - 要编辑的活动（null表示添加）
     */
    handleActivitySave(formData, activity) {
        if (activity) {
            // 编辑模式
            this.updateActivity(activity.id, formData);
        } else {
            // 添加模式
            this.addActivity(formData);
        }
    }

    /**
     * 处理活动取消
     */
    handleActivityCancel() {
        // 可以在这里添加取消逻辑
    }

    /**
     * 显示通知消息
     * @param {string} message - 消息内容
     * @param {string} type - 消息类型（'success' | 'error' | 'info' | 'warning'）
     */
    showNotification(message, type = 'info') {
        // 使用全局通知管理器
        if (typeof notificationManager !== 'undefined') {
            notificationManager.show(message, type);
        } else {
            // 回退到控制台
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }

    /**
     * 注册键盘快捷键
     */
    registerKeyboardShortcuts() {
        // 快捷键功能已移除
        // Escape: 关闭模态框（由ActivityEditor处理）
    }

    /**
     * 检查并解锁成就
     */
    checkAchievements() {
        if (typeof AchievementManager === 'undefined') return;
        
        try {
            const achievementManager = new AchievementManager();
            const newAchievements = achievementManager.checkAndUnlockAchievements(this.type);
            
            // 新成就会自动显示通知，这里不需要额外处理
        } catch (error) {
            console.error('检查成就失败:', error);
        }
    }

    /**
     * 获取较浅的颜色（用于渐变）
     * @param {string} color - 原始颜色（十六进制）
     * @returns {string} 较浅的颜色
     */
    getLighterColor(color) {
        // 简单的颜色变浅算法
        const colorMap = {
            '#4CAF50': '#8BC34A',
            '#2196F3': '#64B5F6'
        };
        return colorMap[color] || color;
    }

    /**
     * 转义HTML特殊字符
     * @param {string} text - 原始文本
     * @returns {string} 转义后的文本
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}
