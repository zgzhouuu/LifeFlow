/**
 * CustomGoal - 自定义目标数据模型
 * 支持灵活的目标类型和单位
 */
class CustomGoal {
  constructor(data = {}) {
    this.id = data.id || this.generateUUID()
    this.type = data.type || 'exercise' // 'exercise' | 'learning'
    this.name = data.name || '' // 用户自定义名称
    this.goalType = data.goalType || 'duration' // 'duration' | 'count' | 'distance' | 'custom'
    this.target = data.target || 0 // 目标值
    this.unit = data.unit || '分钟' // 单位：分钟、个、页、公里等
    this.current = data.current || 0 // 当前进度
    this.completed = data.completed || false
    this.date = data.date || new Date().toISOString().split('T')[0] // 目标日期
    this.createdAt = data.createdAt || new Date().toISOString()
    this.updatedAt = data.updatedAt || new Date().toISOString()
  }

  /**
   * 更新进度
   * @param {number} value - 增加的进度值
   */
  updateProgress(value) {
    this.current += value
    this.updatedAt = new Date().toISOString()
    
    // 检查是否完成
    if (this.current >= this.target && !this.completed) {
      this.completed = true
      return true // 返回true表示刚刚完成
    }
    
    return false
  }

  /**
   * 设置进度
   * @param {number} value - 设置的进度值
   */
  setProgress(value) {
    this.current = value
    this.updatedAt = new Date().toISOString()
    
    // 检查是否完成
    if (this.current >= this.target && !this.completed) {
      this.completed = true
      return true
    } else if (this.current < this.target && this.completed) {
      this.completed = false
    }
    
    return false
  }

  /**
   * 获取进度百分比
   * @returns {number} 0-100的百分比
   */
  getProgress() {
    if (this.target === 0) return 0
    return Math.min(100, Math.round((this.current / this.target) * 100))
  }

  /**
   * 获取剩余量
   * @returns {number} 剩余需要完成的量
   */
  getRemaining() {
    return Math.max(0, this.target - this.current)
  }

  /**
   * 重置进度（用于新的一天）
   */
  reset() {
    this.current = 0
    this.completed = false
    this.updatedAt = new Date().toISOString()
  }

  /**
   * 验证目标数据
   * @returns {Object} { valid: boolean, errors: string[] }
   */
  validate() {
    const errors = []

    if (!this.name || this.name.trim() === '') {
      errors.push('目标名称不能为空')
    }

    if (this.name.length > 50) {
      errors.push('目标名称不能超过50个字符')
    }

    if (!this.type || !['exercise', 'learning'].includes(this.type)) {
      errors.push('目标类型必须是exercise或learning')
    }

    if (!this.goalType || !['duration', 'count', 'distance', 'custom'].includes(this.goalType)) {
      errors.push('目标类型必须是duration、count、distance或custom')
    }

    if (typeof this.target !== 'number' || this.target <= 0) {
      errors.push('目标值必须是大于0的数字')
    }

    if (this.target > 10000) {
      errors.push('目标值不能超过10000')
    }

    if (!this.unit || this.unit.trim() === '') {
      errors.push('单位不能为空')
    }

    if (this.unit.length > 10) {
      errors.push('单位不能超过10个字符')
    }

    if (typeof this.current !== 'number' || this.current < 0) {
      errors.push('当前进度必须是非负数')
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * 转换为JSON对象
   * @returns {Object}
   */
  toJSON() {
    return {
      id: this.id,
      type: this.type,
      name: this.name,
      goalType: this.goalType,
      target: this.target,
      unit: this.unit,
      current: this.current,
      completed: this.completed,
      date: this.date,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    }
  }

  /**
   * 从JSON对象创建实例
   * @param {Object} json
   * @returns {CustomGoal}
   */
  static fromJSON(json) {
    return new CustomGoal(json)
  }

  /**
   * 生成UUID
   * @returns {string}
   */
  generateUUID() {
    return 'goal_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
  }

  /**
   * 获取目标类型的显示名称
   * @returns {string}
   */
  getGoalTypeDisplay() {
    const typeMap = {
      duration: '时长',
      count: '数量',
      distance: '距离',
      custom: '自定义'
    }
    return typeMap[this.goalType] || this.goalType
  }

  /**
   * 获取推荐的单位（基于目标类型）
   * @param {string} goalType
   * @returns {string[]}
   */
  static getRecommendedUnits(goalType) {
    const unitsMap = {
      duration: ['分钟', '小时'],
      count: ['个', '次', '页', '题', '章', '节', '本'],
      distance: ['公里', '米', '步', '圈'],
      custom: ['单位']
    }
    return unitsMap[goalType] || ['单位']
  }

  /**
   * 获取目标类型的描述
   * @param {string} goalType
   * @returns {string}
   */
  static getGoalTypeDescription(goalType) {
    const descriptions = {
      duration: '适用于时间相关的目标，如运动时长、学习时长',
      count: '适用于可计数的目标，如单词数、题目数、页数',
      distance: '适用于距离相关的目标，如跑步距离、步数',
      custom: '自定义类型，可以设置任意单位'
    }
    return descriptions[goalType] || ''
  }

  /**
   * 获取目标类型的示例
   * @param {string} goalType
   * @returns {string[]}
   */
  static getGoalTypeExamples(goalType) {
    const examples = {
      duration: ['跑步30分钟', '学习2小时', '瑜伽45分钟'],
      count: ['背单词20个', '刷题10道', '阅读30页'],
      distance: ['跑步5公里', '步行10000步', '游泳500米'],
      custom: ['做俯卧撑50次', '冥想3次', '喝水8杯']
    }
    return examples[goalType] || []
  }

  /**
   * 克隆目标（用于创建新一天的目标）
   * @returns {CustomGoal}
   */
  clone() {
    const cloned = new CustomGoal(this.toJSON())
    cloned.id = this.generateUUID()
    cloned.current = 0
    cloned.completed = false
    cloned.date = new Date().toISOString().split('T')[0]
    cloned.createdAt = new Date().toISOString()
    cloned.updatedAt = new Date().toISOString()
    return cloned
  }
}

// 导出（如果使用模块系统）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CustomGoal
}
