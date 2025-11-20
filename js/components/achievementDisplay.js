/**
 * AchievementDisplay Component
 * 成就展示组件 - 在首页显示用户成就
 */
class AchievementDisplay {
    constructor(containerId) {
        this.containerId = containerId;
        this.achievementManager = new AchievementManager();
    }

    /**
     * 初始化并渲染
     */
    init() {
        this.render();
    }

    /**
     * 渲染成就展示
     */
    render() {
        const container = document.getElementById(this.containerId);
        if (!container) return;

        const unlockedAchievements = this.achievementManager.getUnlockedAchievements();
        const totalPoints = this.achievementManager.getTotalPoints();
        
        // 获取运动和学习进度
        const exerciseProgress = this.achievementManager.getAchievementProgress('exercise');
        const learningProgress = this.achievementManager.getAchievementProgress('learning');

        container.innerHTML = `
            <div class="achievement-display">
                <div class="achievement-header">
                    <h3>🏆 我的成就</h3>
                    <div class="total-points">
                        <span class="points-label">总成就点:</span>
                        <span class="points-value">${totalPoints}</span>
                    </div>
                </div>
                
                <div class="achievement-stats">
                    <div class="stat-card">
                        <div class="stat-icon">💪</div>
                        <div class="stat-info">
                            <div class="stat-label">运动连续</div>
                            <div class="stat-value">${exerciseProgress.streak} 天</div>
                            ${this._renderNextGoal(exerciseProgress.nextStreakAchievement)}
                        </div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-icon">📚</div>
                        <div class="stat-info">
                            <div class="stat-label">学习连续</div>
                            <div class="stat-value">${learningProgress.streak} 天</div>
                            ${this._renderNextGoal(learningProgress.nextStreakAchievement)}
                        </div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-icon">⏱️</div>
                        <div class="stat-info">
                            <div class="stat-label">运动总时长</div>
                            <div class="stat-value">${exerciseProgress.totalHours} 小时</div>
                            ${this._renderNextGoal(exerciseProgress.nextDurationAchievement, true)}
                        </div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-icon">📖</div>
                        <div class="stat-info">
                            <div class="stat-label">学习总时长</div>
                            <div class="stat-value">${learningProgress.totalHours} 小时</div>
                            ${this._renderNextGoal(learningProgress.nextDurationAchievement, true)}
                        </div>
                    </div>
                </div>

                <div class="achievement-badges">
                    <h4>已解锁徽章 (${unlockedAchievements.length})</h4>
                    <div class="badges-grid">
                        ${this._renderBadges(unlockedAchievements)}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 渲染下一个目标
     */
    _renderNextGoal(nextAchievement, isDuration = false) {
        if (!nextAchievement) {
            return '<div class="next-goal">🎉 已完成所有成就！</div>';
        }
        
        const target = isDuration 
            ? `${Math.floor(nextAchievement.requirement.minutes / 60)}小时`
            : `${nextAchievement.requirement.streak}天`;
        
        return `<div class="next-goal">下一个: ${nextAchievement.name} (${target})</div>`;
    }

    /**
     * 渲染徽章列表
     */
    _renderBadges(badges) {
        if (badges.length === 0) {
            return '<div class="no-badges">还没有解锁任何徽章，加油打卡吧！</div>';
        }

        return badges
            .sort((a, b) => new Date(b.unlockedAt) - new Date(a.unlockedAt))
            .slice(0, 8) // 只显示最近8个
            .map(badge => `
                <div class="badge-item" title="${badge.description}\n解锁时间: ${new Date(badge.unlockedAt).toLocaleDateString()}">
                    <div class="badge-icon">${badge.icon}</div>
                    <div class="badge-name">${badge.name}</div>
                    <div class="badge-points">+${badge.points}</div>
                </div>
            `).join('');
    }

    /**
     * 刷新显示
     */
    refresh() {
        this.achievementManager = new AchievementManager();
        this.render();
    }
}
