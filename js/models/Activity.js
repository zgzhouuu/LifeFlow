/**
 * Activity Model
 * 表示单个运动或学习活动项
 */
class Activity {
    /**
     * 创建Activity实例
     * @param {Object} data - 活动数据
     * @param {number} [data.id] - 活动ID（自动生成）
     * @param {string} [data.date] - 活动日期（YYYY-MM-DD格式）
     * @param {string} data.type - 活动类型（'exercise' | 'learning'）
     * @param {string} data.name - 活动名称
     * @param {number} data.duration - 计划时长（分钟）
     * @param {string} [data.notes] - 备注
     * @param {boolean} [data.completed] - 是否完成
     * @param {string} [data.completedAt] - 完成时间（ISO格式）
     * @param {string} [data.createdAt] - 创建时间（ISO格式）
     */
    constructor(data) {
        this.id = data.id || Date.now();
        this.date = data.date || new Date().toISOString().split('T')[0];
        this.type = data.type; // 'exercise' | 'learning'
        this.name = data.name;
        this.duration = data.duration;
        this.notes = data.notes || '';
        this.completed = data.completed || false;
        this.completedAt = data.completedAt || null;
        this.createdAt = data.createdAt || new Date().toISOString();
    }

    /**
     * 切换完成状态
     */
    toggle() {
        this.completed = !this.completed;
        this.completedAt = this.completed ? new Date().toISOString() : null;
    }

    /**
     * 更新活动信息
     * @param {Object} updates - 要更新的字段
     */
    update(updates) {
        Object.assign(this, updates);
    }

    /**
     * 序列化为JSON对象
     * @returns {Object} JSON对象
     */
    toJSON() {
        return {
            id: this.id,
            date: this.date,
            type: this.type,
            name: this.name,
            duration: this.duration,
            notes: this.notes,
            completed: this.completed,
            completedAt: this.completedAt,
            createdAt: this.createdAt
        };
    }

    /**
     * 从JSON对象创建Activity实例
     * @param {Object} json - JSON对象
     * @returns {Activity} Activity实例
     */
    static fromJSON(json) {
        return new Activity(json);
    }
}
