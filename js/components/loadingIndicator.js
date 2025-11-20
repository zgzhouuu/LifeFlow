/**
 * LoadingIndicator - 加载状态指示器
 * 提供全局和局部加载状态显示
 */
class LoadingIndicator {
  constructor() {
    this.globalOverlay = null;
    this.activeLoaders = new Set();
    this.init();
  }
  
  /**
   * 初始化全局加载遮罩
   */
  init() {
    // 创建全局加载遮罩
    this.globalOverlay = document.createElement('div');
    this.globalOverlay.className = 'loading-overlay';
    this.globalOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: none;
      align-items: center;
      justify-content: center;
      z-index: 9999;
    `;
    
    // 创建加载动画
    const spinner = document.createElement('div');
    spinner.className = 'loading-spinner';
    spinner.innerHTML = `
      <div class="spinner-ring"></div>
      <div class="spinner-text">加载中...</div>
    `;
    spinner.style.cssText = `
      text-align: center;
      color: white;
    `;
    
    this.globalOverlay.appendChild(spinner);
    document.body.appendChild(this.globalOverlay);
  }
  
  /**
   * 显示全局加载状态
   * @param {string} message - 加载消息
   */
  showGlobal(message = '加载中...') {
    const textEl = this.globalOverlay.querySelector('.spinner-text');
    if (textEl) {
      textEl.textContent = message;
    }
    this.globalOverlay.style.display = 'flex';
  }
  
  /**
   * 隐藏全局加载状态
   */
  hideGlobal() {
    this.globalOverlay.style.display = 'none';
  }
  
  /**
   * 为元素添加加载状态
   * @param {HTMLElement} element - 目标元素
   * @param {string} message - 加载消息
   * @returns {string} 加载器ID
   */
  showLocal(element, message = '加载中...') {
    const loaderId = `loader_${Date.now()}_${Math.random()}`;
    
    // 保存元素原始状态
    const originalContent = element.innerHTML;
    const originalDisabled = element.disabled;
    
    // 创建加载指示器
    const loader = document.createElement('div');
    loader.className = 'local-loading';
    loader.dataset.loaderId = loaderId;
    loader.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      padding: 10px;
    `;
    
    loader.innerHTML = `
      <div class="mini-spinner"></div>
      <span>${message}</span>
    `;
    
    // 禁用元素
    if (element.tagName === 'BUTTON' || element.tagName === 'INPUT') {
      element.disabled = true;
    }
    
    // 替换内容
    element.innerHTML = '';
    element.appendChild(loader);
    
    // 保存状态
    this.activeLoaders.set(loaderId, {
      element,
      originalContent,
      originalDisabled
    });
    
    return loaderId;
  }
  
  /**
   * 移除元素的加载状态
   * @param {string} loaderId - 加载器ID
   */
  hideLocal(loaderId) {
    const loaderData = this.activeLoaders.get(loaderId);
    if (!loaderData) return;
    
    const { element, originalContent, originalDisabled } = loaderData;
    
    // 恢复原始内容
    element.innerHTML = originalContent;
    
    // 恢复禁用状态
    if (element.tagName === 'BUTTON' || element.tagName === 'INPUT') {
      element.disabled = originalDisabled;
    }
    
    this.activeLoaders.delete(loaderId);
  }
  
  /**
   * 为按钮添加加载状态
   * @param {HTMLButtonElement} button - 按钮元素
   * @param {string} message - 加载消息
   * @returns {string} 加载器ID
   */
  showButton(button, message = '处理中...') {
    const loaderId = `btn_loader_${Date.now()}`;
    
    // 保存按钮原始状态
    const originalText = button.textContent;
    const originalDisabled = button.disabled;
    
    // 设置加载状态
    button.disabled = true;
    button.innerHTML = `
      <span class="button-spinner"></span>
      <span>${message}</span>
    `;
    button.classList.add('loading');
    
    // 保存状态
    this.activeLoaders.set(loaderId, {
      element: button,
      originalContent: originalText,
      originalDisabled
    });
    
    return loaderId;
  }
  
  /**
   * 移除按钮的加载状态
   * @param {string} loaderId - 加载器ID
   */
  hideButton(loaderId) {
    const loaderData = this.activeLoaders.get(loaderId);
    if (!loaderData) return;
    
    const { element, originalContent, originalDisabled } = loaderData;
    
    // 恢复按钮状态
    element.textContent = originalContent;
    element.disabled = originalDisabled;
    element.classList.remove('loading');
    
    this.activeLoaders.delete(loaderId);
  }
  
  /**
   * 创建骨架屏
   * @param {HTMLElement} container - 容器元素
   * @param {number} count - 骨架项数量
   * @returns {string} 加载器ID
   */
  showSkeleton(container, count = 3) {
    const loaderId = `skeleton_${Date.now()}`;
    
    // 保存原始内容
    const originalContent = container.innerHTML;
    
    // 创建骨架屏
    const skeleton = document.createElement('div');
    skeleton.className = 'skeleton-container';
    skeleton.dataset.loaderId = loaderId;
    
    for (let i = 0; i < count; i++) {
      const item = document.createElement('div');
      item.className = 'skeleton-item';
      item.innerHTML = `
        <div class="skeleton-avatar"></div>
        <div class="skeleton-content">
          <div class="skeleton-line"></div>
          <div class="skeleton-line short"></div>
        </div>
      `;
      skeleton.appendChild(item);
    }
    
    container.innerHTML = '';
    container.appendChild(skeleton);
    
    // 保存状态
    this.activeLoaders.set(loaderId, {
      element: container,
      originalContent,
      originalDisabled: false
    });
    
    return loaderId;
  }
  
  /**
   * 移除骨架屏
   * @param {string} loaderId - 加载器ID
   */
  hideSkeleton(loaderId) {
    this.hideLocal(loaderId);
  }
  
  /**
   * 清除所有加载状态
   */
  clearAll() {
    this.hideGlobal();
    this.activeLoaders.forEach((_, loaderId) => {
      this.hideLocal(loaderId);
    });
  }
}

// 添加CSS样式
const style = document.createElement('style');
style.textContent = `
  /* 旋转动画 */
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  /* 脉冲动画 */
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
  
  /* 大型加载环 */
  .spinner-ring {
    width: 60px;
    height: 60px;
    border: 4px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 15px;
  }
  
  /* 小型加载环 */
  .mini-spinner {
    width: 20px;
    height: 20px;
    border: 2px solid rgba(0, 0, 0, 0.1);
    border-top-color: #3498db;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  
  /* 按钮加载环 */
  .button-spinner {
    display: inline-block;
    width: 14px;
    height: 14px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    margin-right: 8px;
    vertical-align: middle;
  }
  
  /* 骨架屏样式 */
  .skeleton-container {
    padding: 10px;
  }
  
  .skeleton-item {
    display: flex;
    gap: 15px;
    padding: 15px;
    margin-bottom: 10px;
    background: white;
    border-radius: 8px;
  }
  
  .skeleton-avatar {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: pulse 1.5s ease-in-out infinite;
  }
  
  .skeleton-content {
    flex: 1;
  }
  
  .skeleton-line {
    height: 12px;
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: pulse 1.5s ease-in-out infinite;
    border-radius: 4px;
    margin-bottom: 10px;
  }
  
  .skeleton-line.short {
    width: 60%;
  }
  
  /* 按钮加载状态 */
  button.loading {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;
document.head.appendChild(style);

// 创建全局实例
window.loadingIndicator = new LoadingIndicator();

// Export for ES6 modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LoadingIndicator;
}
