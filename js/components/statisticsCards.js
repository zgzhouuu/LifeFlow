/**
 * Statistics Cards Component
 * Displays statistics cards showing total hours, completion rates, and average daily values
 * Requirements: 15.5
 */

class StatisticsCards {
    /**
     * Create a StatisticsCards instance
     * @param {string} containerId - Container element ID
     * @param {string} type - Statistics type ('exercise' | 'learning')
     * @param {Object} storageManager - Storage manager instance
     */
    constructor(containerId, type, storageManager) {
        this.containerId = containerId;
        this.type = type; // 'exercise' or 'learning'
        this.storageManager = storageManager;
        this.container = document.getElementById(containerId);
        
        if (!this.container) {
            console.error(`Container element with id "${containerId}" not found`);
        }
    }

    /**
     * Initialize the statistics cards
     */
    init() {
        this.render();
        this.setupEventListeners();
    }

    /**
     * Render the statistics cards UI
     * Requirements: 15.5
     */
    render() {
        if (!this.container) return;

        const stats = this.calculateStatistics();
        const color = this.type === 'exercise' ? '#4CAF50' : '#2196F3';
        const icon = this.type === 'exercise' ? '💪' : '📚';
        const title = this.type === 'exercise' ? '运动统计' : '学习统计';

        this.container.innerHTML = `
            <div class="statistics-cards-container">
                <h3 class="statistics-title" style="color: ${color};">
                    ${icon} ${title}
                </h3>
                <div class="statistics-grid">
                    <div class="stat-card" style="border-left-color: ${color};">
                        <div class="stat-icon">⏱️</div>
                        <div class="stat-content">
                            <div class="stat-value">${stats.totalHours}</div>
                            <div class="stat-label">总时长（小时）</div>
                        </div>
                    </div>
                    
                    <div class="stat-card" style="border-left-color: ${color};">
                        <div class="stat-icon">📅</div>
                        <div class="stat-content">
                            <div class="stat-value">${stats.totalDays}</div>
                            <div class="stat-label">活动天数</div>
                        </div>
                    </div>
                    
                    <div class="stat-card" style="border-left-color: ${color};">
                        <div class="stat-icon">📊</div>
                        <div class="stat-content">
                            <div class="stat-value">${stats.avgDaily}</div>
                            <div class="stat-label">日均时长（分钟）</div>
                        </div>
                    </div>
                    
                    <div class="stat-card" style="border-left-color: ${color};">
                        <div class="stat-icon">✅</div>
                        <div class="stat-content">
                            <div class="stat-value">${stats.completionRate}%</div>
                            <div class="stat-label">目标完成率</div>
                        </div>
                    </div>
                    
                    <div class="stat-card" style="border-left-color: ${color};">
                        <div class="stat-icon">🔥</div>
                        <div class="stat-content">
                            <div class="stat-value">${stats.currentStreak}</div>
                            <div class="stat-label">连续天数</div>
                        </div>
                    </div>
                    
                    <div class="stat-card" style="border-left-color: ${color};">
                        <div class="stat-icon">🏆</div>
                        <div class="stat-content">
                            <div class="stat-value">${stats.maxDuration}</div>
                            <div class="stat-label">最高记录（分钟）</div>
                        </div>
                    </div>
                </div>
                
                <div class="statistics-period-info">
                    <span class="period-label">统计周期：</span>
                    <span class="period-value">全部时间</span>
                </div>
            </div>
        `;
    }

    /**
     * Calculate statistics from activities
     * Requirements: 15.5
     * @returns {Object} Statistics object
     */
    calculateStatistics() {
        const activities = this.getActivities();
        const goals = this.getGoals();
        
        // Calculate total hours
        const totalMinutes = activities.reduce((sum, activity) => {
            return sum + (activity.duration || 0);
        }, 0);
        const totalHours = (totalMinutes / 60).toFixed(1);
        
        // Calculate total days with activities
        const uniqueDates = new Set(activities.map(activity => activity.date));
        const totalDays = uniqueDates.size;
        
        // Calculate average daily duration
        const avgDaily = totalDays > 0 
            ? Math.round(totalMinutes / totalDays) 
            : 0;
        
        // Calculate completion rate
        const completionRate = this.calculateCompletionRate(goals);
        
        // Calculate current streak
        const currentStreak = this.calculateCurrentStreak(activities);
        
        // Calculate max duration in a single day
        const maxDuration = this.calculateMaxDailyDuration(activities);
        
        return {
            totalHours: totalHours,
            totalDays: totalDays,
            avgDaily: avgDaily,
            completionRate: completionRate,
            currentStreak: currentStreak,
            maxDuration: maxDuration
        };
    }

    /**
     * Get activities based on type
     * @returns {Array} Array of completed activities
     */
    getActivities() {
        const allActivities = this.storageManager.loadActivities(this.type);
        
        // Convert to old format for compatibility
        // Only include completed activities
        return allActivities
            .filter(a => a.completed)
            .map(a => ({
                date: a.date,
                duration: a.duration,
                type: a.name,
                name: a.name,
                notes: a.notes
            }));
    }

    /**
     * Get goals based on type (not used in current implementation)
     * @returns {Array} Empty array
     */
    getGoals() {
        return [];
    }

    /**
     * Calculate completion rate based on daily goal achievement
     * Requirements: 15.5
     * @param {Array} goals - Array of goals (unused, kept for compatibility)
     * @returns {number} Completion rate percentage
     */
    calculateCompletionRate(goals) {
        const allActivities = this.storageManager.loadActivities(this.type);
        const dailyGoal = this.storageManager.loadDailyGoal(this.type);
        
        if (allActivities.length === 0) {
            return 0;
        }
        
        // Group activities by date
        const dateMap = new Map();
        allActivities.forEach(activity => {
            if (!dateMap.has(activity.date)) {
                dateMap.set(activity.date, []);
            }
            dateMap.get(activity.date).push(activity);
        });
        
        // Calculate how many days achieved the daily goal
        let daysAchieved = 0;
        dateMap.forEach((activities, date) => {
            const dailyProgress = new DailyProgress(date, activities, dailyGoal);
            const progress = dailyProgress.getProgress();
            if (progress.achieved) {
                daysAchieved++;
            }
        });
        
        const rate = (daysAchieved / dateMap.size) * 100;
        return Math.round(rate);
    }

    /**
     * Calculate current streak (consecutive days with activities)
     * Requirements: 15.5
     * @param {Array} activities - Array of activities
     * @returns {number} Current streak count
     */
    calculateCurrentStreak(activities) {
        if (!activities || activities.length === 0) {
            return 0;
        }

        const today = new Date();
        let streak = 0;
        
        // Check each day going backwards from today
        for (let i = 0; i < 365; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = this.formatDate(date);
            
            const hasActivity = activities.some(activity => activity.date === dateStr);
            
            if (hasActivity) {
                streak++;
            } else if (i > 0) {
                // If not today and no activity, break the streak
                break;
            }
        }
        
        return streak;
    }

    /**
     * Calculate maximum duration in a single day
     * Requirements: 15.5
     * @param {Array} activities - Array of activities
     * @returns {number} Maximum daily duration in minutes
     */
    calculateMaxDailyDuration(activities) {
        if (!activities || activities.length === 0) {
            return 0;
        }

        // Group activities by date
        const dailyTotals = {};
        
        activities.forEach(activity => {
            const date = activity.date;
            if (!dailyTotals[date]) {
                dailyTotals[date] = 0;
            }
            dailyTotals[date] += activity.duration || 0;
        });

        // Find maximum
        const maxDuration = Math.max(...Object.values(dailyTotals));
        
        return maxDuration;
    }

    /**
     * Format date to YYYY-MM-DD string
     * @param {Date} date - Date object to format
     * @returns {string} Formatted date string
     */
    formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    /**
     * Setup event listeners for real-time updates
     * Requirements: 15.5
     */
    setupEventListeners() {
        // Listen for activity updates
        const eventName = this.type === 'exercise' 
            ? 'lifeflow:exercise:updated' 
            : 'lifeflow:learning:updated';
        
        window.addEventListener(eventName, () => {
            this.update();
        });

        // Listen for goal updates
        window.addEventListener('lifeflow:goal:updated', () => {
            this.update();
        });
    }

    /**
     * Update statistics in real-time
     * Requirements: 15.5
     */
    update() {
        this.render();
    }

    /**
     * Refresh the statistics cards
     */
    refresh() {
        this.render();
    }

    /**
     * Destroy the component
     */
    destroy() {
        if (this.container) {
            this.container.innerHTML = '';
        }
    }

    /**
     * Create statistics cards HTML structure
     * Static method for creating the container
     * @param {string} containerId - Container element ID
     * @returns {string} HTML string
     */
    static createContainer(containerId) {
        return `<div id="${containerId}" class="statistics-cards-wrapper"></div>`;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StatisticsCards;
}
