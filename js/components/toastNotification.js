/**
 * ToastNotification - 轻量级通知提示组件
 * 用于显示操作成功/失败/警告/信息提示
 */
class ToastNotification {
  constructor() {
    this.container = null;
    this.queue = [];
    this.isShowing = false;
    this.init();
  }
  
  /**
   * 初始化通知容器
   */
  init() {
    // 创建容器
    this.container = document.createElement('div');
    this.container.className = 'toast-container';
    this.container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      pointer-events: none;
    `;
    document.body.appendChild(this.container);
  }
  
  /**
   * 显示通知
   * @param {string} message - 通知消息
   * @param {string} type - 通知类型 (success, error, warning, info)
   * @param {number} duration - 显示时长（毫秒）
   */
  show(message, type = 'info', duration = 3000) {
    this.queue.push({ message, type, duration });
    if (!this.isShowing) {
      this.showNext();
    }
  }
  
  /**
   * 显示队列中的下一个通知
   */
  showNext() {
    if (this.queue.length === 0) {
      this.isShowing = false;
      return;
    }
    
    this.isShowing = true;
    const { message, type, duration } = this.queue.shift();
    
    // 创建通知元素
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.style.cssText = `
      background: ${this.getBackgroundColor(type)};
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      margin-bottom: 10px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 250px;
      max-width: 400px;
      pointer-events: auto;
      animation: slideInRight 0.3s ease-out;
      font-size: 14px;
      line-height: 1.5;
    `;
    
    // 添加图标
    const icon = document.createElement('span');
    icon.innerHTML = this.getIcon(type);
    icon.style.cssText = `
      font-size: 18px;
      flex-shrink: 0;
    `;
    
    // 添加消息
    const messageEl = document.createElement('span');
    messageEl.textContent = message;
    messageEl.style.cssText = `
      flex: 1;
      word-break: break-word;
    `;
    
    toast.appendChild(icon);
    toast.appendChild(messageEl);
    this.container.appendChild(toast);
    
    // 自动移除
    setTimeout(() => {
      toast.style.animation = 'slideOutRight 0.3s ease-in';
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
        this.showNext();
      }, 300);
    }, duration);
  }
  
  /**
   * 获取背景颜色
   * @param {string} type - 通知类型
   * @returns {string} 背景颜色
   */
  getBackgroundColor(type) {
    const colors = {
      success: '#27ae60',
      error: '#e74c3c',
      warning: '#f39c12',
      info: '#3498db'
    };
    return colors[type] || colors.info;
  }
  
  /**
   * 获取图标
   * @param {string} type - 通知类型
   * @returns {string} 图标HTML
   */
  getIcon(type) {
    const icons = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ'
    };
    return icons[type] || icons.info;
  }
}

// 添加CSS动画
const style = document.createElement('style');
style.textContent = `
  @keyframes slideInRight {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOutRight {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }
  
  @media (max-width: 768px) {
    .toast-container {
      top: 10px !important;
      right: 10px !important;
      left: 10px !important;
    }
    
    .toast {
      min-width: auto !important;
      max-width: 100% !important;
    }
  }
`;
document.head.appendChild(style);

// 创建全局实例
window.toastNotification = new ToastNotification();

// Export for ES6 modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ToastNotification;
}
