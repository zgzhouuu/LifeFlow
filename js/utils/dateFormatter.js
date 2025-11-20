/**
 * DateFormatter - 日期格式化工具
 */
class DateFormatter {
  /**
   * 格式化相对时间（如"3分钟前"）
   * @param {number} timestamp - 时间戳
   * @returns {string} 格式化后的时间
   */
  static formatRelativeTime(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const weeks = Math.floor(days / 7);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);
    
    if (seconds < 60) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    if (weeks < 4) return `${weeks}周前`;
    if (months < 12) return `${months}个月前`;
    return `${years}年前`;
  }
  
  /**
   * 格式化日期（YYYY-MM-DD）
   * @param {number|Date} timestamp - 时间戳或日期对象
   * @returns {string} 格式化后的日期
   */
  static formatDate(timestamp) {
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  /**
   * 格式化日期时间（YYYY-MM-DD HH:mm）
   * @param {number|Date} timestamp - 时间戳或日期对象
   * @returns {string} 格式化后的日期时间
   */
  static formatDateTime(timestamp) {
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    const dateStr = this.formatDate(timestamp);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${dateStr} ${hours}:${minutes}`;
  }
  
  /**
   * 格式化时间（HH:mm）
   * @param {number|Date} timestamp - 时间戳或日期对象
   * @returns {string} 格式化后的时间
   */
  static formatTime(timestamp) {
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }
  
  /**
   * 格式化友好的日期时间（今天、昨天、具体日期）
   * @param {number|Date} timestamp - 时间戳或日期对象
   * @returns {string} 格式化后的日期时间
   */
  static formatFriendlyDateTime(timestamp) {
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const dateStr = this.formatDate(date);
    const todayStr = this.formatDate(today);
    const yesterdayStr = this.formatDate(yesterday);
    const timeStr = this.formatTime(date);
    
    if (dateStr === todayStr) {
      return `今天 ${timeStr}`;
    } else if (dateStr === yesterdayStr) {
      return `昨天 ${timeStr}`;
    } else {
      return `${dateStr} ${timeStr}`;
    }
  }
  
  /**
   * 获取今天的日期字符串
   * @returns {string} YYYY-MM-DD格式
   */
  static getToday() {
    return this.formatDate(new Date());
  }
  
  /**
   * 获取昨天的日期字符串
   * @returns {string} YYYY-MM-DD格式
   */
  static getYesterday() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return this.formatDate(yesterday);
  }
  
  /**
   * 计算两个日期之间的天数差
   * @param {string|Date} date1 - 日期1
   * @param {string|Date} date2 - 日期2
   * @returns {number} 天数差
   */
  static daysBetween(date1, date2) {
    const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
    const d2 = typeof date2 === 'string' ? new Date(date2) : date2;
    const diffTime = Math.abs(d2 - d1);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = DateFormatter;
}
