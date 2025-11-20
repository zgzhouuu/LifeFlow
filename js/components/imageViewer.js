/**
 * ImageViewer - 全屏图片查看器组件
 * 支持左右滑动查看多张图片、双指缩放（移动端）、关闭按钮
 */

class ImageViewer {
  constructor(options = {}) {
    this.options = {
      images: [],                    // 图片数组
      initialIndex: 0,               // 初始显示的图片索引
      onClose: null,                 // 关闭回调
      enableZoom: true,              // 是否启用缩放
      enableSwipe: true,             // 是否启用滑动
      maxZoom: 3,                    // 最大缩放倍数
      minZoom: 1,                    // 最小缩放倍数
      ...options
    };

    this.currentIndex = this.options.initialIndex;
    this.container = null;
    this.imageElement = null;
    
    // 缩放和拖动状态
    this.scale = 1;
    this.translateX = 0;
    this.translateY = 0;
    this.isDragging = false;
    this.startX = 0;
    this.startY = 0;
    this.lastX = 0;
    this.lastY = 0;
    
    // 触摸状态
    this.touchStartDistance = 0;
    this.touchStartScale = 1;
    this.isSwiping = false;
    this.swipeStartX = 0;
    this.swipeThreshold = 50;
  }

  /**
   * 打开图片查看器
   */
  open() {
    this.createViewer();
    this.loadImage(this.currentIndex);
    this.attachEventListeners();
    
    // 添加到DOM并显示
    document.body.appendChild(this.container);
    requestAnimationFrame(() => {
      this.container.classList.add('active');
    });
    
    // 禁止页面滚动
    document.body.style.overflow = 'hidden';
  }

  /**
   * 关闭图片查看器
   */
  close() {
    this.container.classList.remove('active');
    
    setTimeout(() => {
      if (this.container && this.container.parentNode) {
        this.container.parentNode.removeChild(this.container);
      }
      
      // 恢复页面滚动
      document.body.style.overflow = '';
      
      if (this.options.onClose) {
        this.options.onClose();
      }
    }, 300);
  }

  /**
   * 创建查看器DOM结构
   */
  createViewer() {
    this.container = document.createElement('div');
    this.container.className = 'image-viewer';
    this.container.innerHTML = `
      <div class="image-viewer-overlay"></div>
      <div class="image-viewer-content">
        <div class="image-viewer-container">
          <img class="image-viewer-image" alt="查看图片">
        </div>
        <button class="image-viewer-close" aria-label="关闭">✕</button>
        ${this.options.images.length > 1 ? `
          <button class="image-viewer-prev" aria-label="上一张">‹</button>
          <button class="image-viewer-next" aria-label="下一张">›</button>
          <div class="image-viewer-counter">
            <span class="current-index">${this.currentIndex + 1}</span> / ${this.options.images.length}
          </div>
        ` : ''}
      </div>
    `;

    this.imageElement = this.container.querySelector('.image-viewer-image');
  }

  /**
   * 加载指定索引的图片
   * @param {number} index - 图片索引
   */
  loadImage(index) {
    if (index < 0 || index >= this.options.images.length) {
      return;
    }

    this.currentIndex = index;
    this.resetTransform();
    
    // 显示加载状态
    this.imageElement.style.opacity = '0';
    
    // 加载图片
    const img = new Image();
    img.onload = () => {
      this.imageElement.src = this.options.images[index];
      this.imageElement.style.opacity = '1';
    };
    img.onerror = () => {
      console.error('图片加载失败:', this.options.images[index]);
      this.imageElement.alt = '图片加载失败';
    };
    img.src = this.options.images[index];

    // 更新计数器
    this.updateCounter();
  }

  /**
   * 更新图片计数器
   */
  updateCounter() {
    const counterElement = this.container.querySelector('.current-index');
    if (counterElement) {
      counterElement.textContent = this.currentIndex + 1;
    }
  }

  /**
   * 显示上一张图片
   */
  showPrevious() {
    if (this.currentIndex > 0) {
      this.loadImage(this.currentIndex - 1);
    }
  }

  /**
   * 显示下一张图片
   */
  showNext() {
    if (this.currentIndex < this.options.images.length - 1) {
      this.loadImage(this.currentIndex + 1);
    }
  }

  /**
   * 重置变换状态
   */
  resetTransform() {
    this.scale = 1;
    this.translateX = 0;
    this.translateY = 0;
    this.updateTransform();
  }

  /**
   * 更新图片变换
   */
  updateTransform() {
    if (this.imageElement) {
      this.imageElement.style.transform = 
        `translate(${this.translateX}px, ${this.translateY}px) scale(${this.scale})`;
    }
  }

  /**
   * 附加事件监听器
   */
  attachEventListeners() {
    // 关闭按钮
    const closeBtn = this.container.querySelector('.image-viewer-close');
    closeBtn.addEventListener('click', () => this.close());

    // 点击遮罩关闭
    const overlay = this.container.querySelector('.image-viewer-overlay');
    overlay.addEventListener('click', () => this.close());

    // 上一张/下一张按钮
    const prevBtn = this.container.querySelector('.image-viewer-prev');
    const nextBtn = this.container.querySelector('.image-viewer-next');
    
    if (prevBtn) {
      prevBtn.addEventListener('click', () => this.showPrevious());
    }
    
    if (nextBtn) {
      nextBtn.addEventListener('click', () => this.showNext());
    }

    // 键盘事件
    this.keyboardHandler = (e) => this.handleKeyboard(e);
    document.addEventListener('keydown', this.keyboardHandler);

    // 鼠标事件（桌面端缩放和拖动）
    if (this.options.enableZoom) {
      this.imageElement.addEventListener('mousedown', (e) => this.handleMouseDown(e));
      this.imageElement.addEventListener('wheel', (e) => this.handleWheel(e));
    }

    // 触摸事件（移动端缩放和滑动）
    if (this.options.enableZoom || this.options.enableSwipe) {
      this.imageElement.addEventListener('touchstart', (e) => this.handleTouchStart(e));
      this.imageElement.addEventListener('touchmove', (e) => this.handleTouchMove(e));
      this.imageElement.addEventListener('touchend', (e) => this.handleTouchEnd(e));
    }

    // 双击缩放
    this.imageElement.addEventListener('dblclick', (e) => this.handleDoubleClick(e));
  }

  /**
   * 处理键盘事件
   * @param {KeyboardEvent} e - 键盘事件
   */
  handleKeyboard(e) {
    switch (e.key) {
      case 'Escape':
        this.close();
        break;
      case 'ArrowLeft':
        this.showPrevious();
        break;
      case 'ArrowRight':
        this.showNext();
        break;
    }
  }

  /**
   * 处理鼠标按下（开始拖动）
   * @param {MouseEvent} e - 鼠标事件
   */
  handleMouseDown(e) {
    if (this.scale <= 1) return;
    
    e.preventDefault();
    this.isDragging = true;
    this.startX = e.clientX - this.translateX;
    this.startY = e.clientY - this.translateY;
    
    this.imageElement.style.cursor = 'grabbing';
    
    const handleMouseMove = (e) => this.handleMouseMove(e);
    const handleMouseUp = () => {
      this.isDragging = false;
      this.imageElement.style.cursor = 'grab';
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }

  /**
   * 处理鼠标移动（拖动）
   * @param {MouseEvent} e - 鼠标事件
   */
  handleMouseMove(e) {
    if (!this.isDragging) return;
    
    e.preventDefault();
    this.translateX = e.clientX - this.startX;
    this.translateY = e.clientY - this.startY;
    this.updateTransform();
  }

  /**
   * 处理鼠标滚轮（缩放）
   * @param {WheelEvent} e - 滚轮事件
   */
  handleWheel(e) {
    e.preventDefault();
    
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const newScale = Math.max(
      this.options.minZoom,
      Math.min(this.options.maxZoom, this.scale + delta)
    );
    
    this.scale = newScale;
    
    if (this.scale <= 1) {
      this.translateX = 0;
      this.translateY = 0;
      this.imageElement.style.cursor = 'default';
    } else {
      this.imageElement.style.cursor = 'grab';
    }
    
    this.updateTransform();
  }

  /**
   * 处理触摸开始
   * @param {TouchEvent} e - 触摸事件
   */
  handleTouchStart(e) {
    if (e.touches.length === 2) {
      // 双指缩放
      e.preventDefault();
      this.touchStartDistance = this.getTouchDistance(e.touches);
      this.touchStartScale = this.scale;
    } else if (e.touches.length === 1) {
      // 单指滑动
      this.isSwiping = true;
      this.swipeStartX = e.touches[0].clientX;
      
      if (this.scale > 1) {
        // 缩放状态下的拖动
        this.isDragging = true;
        this.startX = e.touches[0].clientX - this.translateX;
        this.startY = e.touches[0].clientY - this.translateY;
      }
    }
  }

  /**
   * 处理触摸移动
   * @param {TouchEvent} e - 触摸事件
   */
  handleTouchMove(e) {
    if (e.touches.length === 2) {
      // 双指缩放
      e.preventDefault();
      const currentDistance = this.getTouchDistance(e.touches);
      const scaleChange = currentDistance / this.touchStartDistance;
      
      this.scale = Math.max(
        this.options.minZoom,
        Math.min(this.options.maxZoom, this.touchStartScale * scaleChange)
      );
      
      if (this.scale <= 1) {
        this.translateX = 0;
        this.translateY = 0;
      }
      
      this.updateTransform();
    } else if (e.touches.length === 1) {
      if (this.scale > 1 && this.isDragging) {
        // 缩放状态下的拖动
        e.preventDefault();
        this.translateX = e.touches[0].clientX - this.startX;
        this.translateY = e.touches[0].clientY - this.startY;
        this.updateTransform();
      }
    }
  }

  /**
   * 处理触摸结束
   * @param {TouchEvent} e - 触摸事件
   */
  handleTouchEnd(e) {
    if (this.isSwiping && this.scale <= 1 && this.options.enableSwipe) {
      const swipeEndX = e.changedTouches[0].clientX;
      const swipeDistance = swipeEndX - this.swipeStartX;
      
      if (Math.abs(swipeDistance) > this.swipeThreshold) {
        if (swipeDistance > 0) {
          // 向右滑动 - 上一张
          this.showPrevious();
        } else {
          // 向左滑动 - 下一张
          this.showNext();
        }
      }
    }
    
    this.isSwiping = false;
    this.isDragging = false;
    this.touchStartDistance = 0;
  }

  /**
   * 处理双击（缩放）
   * @param {MouseEvent} e - 鼠标事件
   */
  handleDoubleClick(e) {
    e.preventDefault();
    
    if (this.scale > 1) {
      // 缩小到原始大小
      this.resetTransform();
    } else {
      // 放大到2倍
      this.scale = 2;
      this.updateTransform();
    }
  }

  /**
   * 获取两个触摸点之间的距离
   * @param {TouchList} touches - 触摸点列表
   * @returns {number} 距离
   */
  getTouchDistance(touches) {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * 销毁查看器
   */
  destroy() {
    if (this.keyboardHandler) {
      document.removeEventListener('keydown', this.keyboardHandler);
    }
    
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    
    document.body.style.overflow = '';
  }
}

// Export for CommonJS and global scope
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ImageViewer;
}
