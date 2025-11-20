/**
 * DailyProgress Model
 * 表示某一天的活动进度统计
 */
class DailyProgress {
    /**
     * 创建DailyProgress实例
     * @param {string} date - 日期（YYYY-MM-DD格式）
     * @param {Activity[]} activities - 该日期的活动列表
     * @param {number} dailyGoal - 每日目标时长（分钟）
     */
    constructor(date, activities, dailyGoal) {
        this.date = date;
        this.activities = activities || [];
        this.dailyGoal = dailyGoal || 60;
    }

    /**
     * 计算已完成的总时长
     * @returns {number} 已完成的总时长（分钟）
     */
    getCompletedDuration() {
        return this.activities
            .filter(activity => activity.completed)
            .reduce((sum, activity) => sum + activity.duration, 0);
    }

    /**
     * 计算计划的总时长
     * @returns {number} 计划的总时长（分钟）
     */
    getPlannedDuration() {
        return this.activities
            .reduce((sum, activity) => sum + activity.duration, 0);
    }

    /**
     * 计算进度信息
     * @returns {Object} 进度对象
     * @returns {number} return.completed - 已完成时长（分钟）
     * @returns {number} return.goal - 目标时长（分钟）
     * @returns {number} return.percentage - 进度百分比（0-100）
     * @returns {boolean} return.achieved - 是否达成目标
     */
    getProgress() {
        const completed = this.getCompletedDuration();
        const percentage = this.dailyGoal > 0 
            ? Math.min((completed / this.dailyGoal) * 100, 100)
            : 0;
        
        return {
            completed,
            goal: this.dailyGoal,
            percentage,
            achieved: completed >= this.dailyGoal
        };
    }
}

