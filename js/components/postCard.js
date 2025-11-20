/**
 * PostCard - 动态卡片组件
 * 显示单个动态的完整信息，包括作者、内容、图片、标签、点赞和评论
 */

class PostCard {
  constructor(post, options = {}) {
    this.post = post;
    this.options = {
      currentUserId: null,           // 当前用户ID
      showActions: true,             // 是否显示操作按钮
      showComments: true,            // 是否显示评论
      maxComments: 3,                // 最多显示评论数
      onLike: null,                  // 点赞回调
      onUnlike: null,                // 取消点赞回调
      onComment: null,               // 评论回调
      onDelete: null,                // 删除回调
      onReport: null,                // 举报回调
      onReportComment: null,         // 举报评论回调
      onImageClick: null,            // 图片点击回调
      onTagClick: null,              // 标签点击回调
      onDeleteComment: null,         // 删除评论回调
      onViewAllComments: null,       // 查看所有评论回调
      getUserProfile: null,          // 获取用户资料回调
      ...options
    };
  }

  /**
   * 渲染动态卡片HTML
   * @returns {string} HTML字符串
   */
  render() {
    const isLiked = this.post.likes.includes(this.options.currentUserId);
    const isOwner = this.post.authorId === this.options.currentUserId;
    const timeStr = DateFormatter.formatRelativeTime(this.post.createdAt);
    const userProfile = this.getUserProfile(this.post.authorId);

    return `
      <div class="post-card ${this.post.type === 'achievement' ? 'post-card-achievement' : ''}" data-post-id="${this.post.id}">
        ${this.renderHeader(isOwner, userProfile, timeStr)}
        ${this.renderContent()}
        ${this.options.showActions ? this.renderActions(isLiked) : ''}
        ${this.options.showComments && this.post.comments.length > 0 ? this.renderComments() : ''}
      </div>
    `;
  }

  /**
   * 渲染卡片头部（作者信息）
   * @param {boolean} isOwner - 是否是作者
   * @param {Object} userProfile - 用户资料
   * @param {string} timeStr - 时间字符串
   * @returns {string} HTML字符串
   */
  renderHeader(isOwner, userProfile, timeStr) {
    return `
      <div class="post-header">
        <div class="post-author">
          <div class="author-avatar">
            ${this.renderAvatar(userProfile)}
          </div>
          <div class="author-info">
            <div class="author-name">${this.escapeHtml(userProfile.nickname || this.post.authorId)}</div>
            <div class="post-time">${timeStr}</div>
          </div>
        </div>
        ${this.renderMenu(isOwner)}
      </div>
    `;
  }

  /**
   * 渲染头像
   * @param {Object} userProfile - 用户资料
   * @returns {string} HTML字符串
   */
  renderAvatar(userProfile) {
    if (userProfile.avatar) {
      return `<img src="${userProfile.avatar}" alt="头像" class="avatar-image">`;
    }
    return '👤';
  }

  /**
   * 渲染菜单按钮
   * @param {boolean} isOwner - 是否是作者
   * @returns {string} HTML字符串
   */
  renderMenu(isOwner) {
    if (isOwner) {
      return `
        <div class="post-menu">
          <button class="post-menu-btn" data-action="menu" aria-label="菜单">⋮</button>
          <div class="post-menu-dropdown" style="display: none;">
            <button class="menu-item" data-action="delete">删除</button>
          </div>
        </div>
      `;
    } else {
      return ''; // 移除举报按钮
    }
  }

  /**
   * 渲染动态内容
   * @returns {string} HTML字符串
   */
  renderContent() {
    return `
      <div class="post-content">
        ${this.renderText()}
        ${this.renderAchievement()}
        ${this.renderImages()}
        ${this.renderTags()}
      </div>
    `;
  }

  /**
   * 渲染文字内容
   * @returns {string} HTML字符串
   */
  renderText() {
    if (!this.post.content) return '';
    return `<p class="post-text">${this.escapeHtml(this.post.content)}</p>`;
  }

  /**
   * 渲染成就分享（特殊样式）
   * @returns {string} HTML字符串
   */
  renderAchievement() {
    if (this.post.type !== 'achievement' || !this.post.achievementId) {
      return '';
    }

    return `
      <div class="post-achievement">
        <span class="achievement-icon">🏆</span>
        <span class="achievement-text">分享了成就</span>
      </div>
    `;
  }

  /**
   * 渲染图片网格
   * @returns {string} HTML字符串
   */
  renderImages() {
    if (!this.post.images || this.post.images.length === 0) {
      return '';
    }

    const imageCount = this.post.images.length;
    const gridClass = this.getImageGridClass(imageCount);

    return `
      <div class="post-images ${gridClass}">
        ${this.post.images.map((img, index) => this.renderImage(img, index)).join('')}
      </div>
    `;
  }

  /**
   * 获取图片网格布局类名
   * @param {number} count - 图片数量
   * @returns {string} 类名
   */
  getImageGridClass(count) {
    if (count === 1) return 'single';
    if (count <= 4) return 'grid-2';
    return 'grid-3';
  }

  /**
   * 渲染单张图片
   * @param {string} img - 图片URL或Base64
   * @param {number} index - 图片索引
   * @returns {string} HTML字符串
   */
  renderImage(img, index) {
    return `
      <div class="post-image-wrapper" data-action="view-image" data-index="${index}">
        <img src="${img}" alt="动态图片 ${index + 1}" loading="lazy">
      </div>
    `;
  }

  /**
   * 渲染标签（蓝色高亮）
   * @returns {string} HTML字符串
   */
  renderTags() {
    if (!this.post.tags || this.post.tags.length === 0) {
      return '';
    }

    return `
      <div class="post-tags">
        ${this.post.tags.map(tag => this.renderTag(tag)).join('')}
      </div>
    `;
  }

  /**
   * 渲染单个标签
   * @param {string} tag - 标签文本
   * @returns {string} HTML字符串
   */
  renderTag(tag) {
    return `
      <span class="post-tag" data-action="filter-tag" data-tag="${this.escapeHtml(tag)}">
        ${this.escapeHtml(tag)}
      </span>
    `;
  }

  /**
   * 渲染操作按钮（点赞和评论）
   * @param {boolean} isLiked - 是否已点赞
   * @returns {string} HTML字符串
   */
  renderActions(isLiked) {
    const likeCount = this.post.likes.length;
    const commentCount = this.post.comments.length;

    return `
      <div class="post-actions">
        <button class="post-action-btn ${isLiked ? 'liked' : ''}" data-action="like" aria-label="${isLiked ? '取消点赞' : '点赞'}">
          <span class="action-icon">${isLiked ? '❤️' : '🤍'}</span>
          <span class="action-text">${likeCount > 0 ? likeCount : '点赞'}</span>
        </button>
        <button class="post-action-btn" data-action="comment" aria-label="评论">
          <span class="action-icon">💬</span>
          <span class="action-text">${commentCount > 0 ? commentCount : '评论'}</span>
        </button>
      </div>
    `;
  }

  /**
   * 渲染评论列表
   * @returns {string} HTML字符串
   */
  renderComments() {
    const displayComments = this.post.comments.slice(0, this.options.maxComments);
    const hasMore = this.post.comments.length > this.options.maxComments;

    return `
      <div class="post-comments">
        ${displayComments.map(comment => this.renderComment(comment)).join('')}
        ${hasMore ? this.renderViewAllCommentsButton() : ''}
      </div>
    `;
  }

  /**
   * 渲染单条评论
   * @param {Object} comment - 评论对象
   * @returns {string} HTML字符串
   */
  renderComment(comment) {
    const isOwner = comment.authorId === this.options.currentUserId || 
                    this.post.authorId === this.options.currentUserId;
    const userProfile = this.getUserProfile(comment.authorId);

    return `
      <div class="post-comment" data-comment-id="${comment.id}">
        <span class="comment-author">${this.escapeHtml(userProfile.nickname || comment.authorId)}:</span>
        <span class="comment-content">${this.escapeHtml(comment.content)}</span>
        ${isOwner ? `
          <button class="comment-delete-btn" data-action="delete-comment" data-comment-id="${comment.id}" aria-label="删除评论">
            删除
          </button>
        ` : ''}
      </div>
    `;
  }

  /**
   * 渲染"查看全部评论"按钮
   * @returns {string} HTML字符串
   */
  renderViewAllCommentsButton() {
    return `
      <button class="view-all-comments" data-action="view-comments">
        查看全部 ${this.post.comments.length} 条评论
      </button>
    `;
  }

  /**
   * 获取用户资料
   * @param {string} userId - 用户ID
   * @returns {Object} 用户资料对象
   */
  getUserProfile(userId) {
    if (this.options.getUserProfile) {
      return this.options.getUserProfile(userId);
    }
    
    // 默认返回基本信息
    return {
      nickname: userId,
      avatar: null
    };
  }

  /**
   * HTML转义
   * @param {string} text - 文本
   * @returns {string} 转义后的文本
   */
  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * 创建DOM元素
   * @returns {HTMLElement} DOM元素
   */
  createElement() {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = this.render();
    const element = wrapper.firstElementChild;
    
    // 附加事件监听器
    this.attachEventListeners(element);
    
    return element;
  }

  /**
   * 附加事件监听器
   * @param {HTMLElement} element - DOM元素
   */
  attachEventListeners(element) {
    element.addEventListener('click', (e) => {
      const target = e.target.closest('[data-action]');
      if (!target) return;

      const action = target.dataset.action;
      this.handleAction(action, target, e);
    });

    // 添加长按支持（用于举报）
    this.attachLongPressListeners(element);
  }

  /**
   * 附加长按事件监听器
   * @param {HTMLElement} element - DOM元素
   */
  attachLongPressListeners(element) {
    let pressTimer = null;
    let isLongPress = false;

    const startPress = (e) => {
      // 检查是否点击在动态内容或评论上
      const postContent = e.target.closest('.post-content, .post-comment');
      if (!postContent) return;

      isLongPress = false;
      pressTimer = setTimeout(() => {
        isLongPress = true;
        this.showContextMenu(e, postContent);
      }, 500); // 500ms长按
    };

    const cancelPress = () => {
      if (pressTimer) {
        clearTimeout(pressTimer);
        pressTimer = null;
      }
    };

    const endPress = (e) => {
      cancelPress();
      if (isLongPress) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    // 触摸事件
    element.addEventListener('touchstart', startPress, { passive: true });
    element.addEventListener('touchend', endPress);
    element.addEventListener('touchmove', cancelPress);

    // 鼠标事件（桌面端）
    element.addEventListener('mousedown', startPress);
    element.addEventListener('mouseup', endPress);
    element.addEventListener('mouseleave', cancelPress);

    // 右键菜单（桌面端）
    element.addEventListener('contextmenu', (e) => {
      const postContent = e.target.closest('.post-content, .post-comment');
      if (postContent) {
        e.preventDefault();
        this.showContextMenu(e, postContent);
      }
    });
  }

  /**
   * 显示上下文菜单
   * @param {Event} e - 事件对象
   * @param {HTMLElement} target - 目标元素
   */
  showContextMenu(e, target) {
    const isComment = target.classList.contains('post-comment');
    const commentId = isComment ? target.dataset.commentId : null;

    // 创建菜单
    const menu = document.createElement('div');
    menu.className = 'context-menu';
    
    const isOwner = isComment 
      ? target.querySelector('[data-action="delete-comment"]') !== null
      : this.post.authorId === this.options.currentUserId;

    menu.innerHTML = `
      ${isOwner ? `
        <button class="context-menu-item" data-action="delete-context" data-comment-id="${commentId || ''}">
          <span class="context-menu-icon">🗑️</span>
          <span>删除</span>
        </button>
      ` : `
        <button class="context-menu-item danger" data-action="report-context" data-comment-id="${commentId || ''}">
          <span class="context-menu-icon">⚠️</span>
          <span>举报</span>
        </button>
      `}
    `;

    // 定位菜单
    const x = e.clientX || (e.touches && e.touches[0].clientX) || 0;
    const y = e.clientY || (e.touches && e.touches[0].clientY) || 0;
    
    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;

    document.body.appendChild(menu);

    // 显示动画
    setTimeout(() => menu.classList.add('show'), 10);

    // 处理菜单点击
    const handleMenuClick = (e) => {
      const menuItem = e.target.closest('.context-menu-item');
      if (!menuItem) return;

      const action = menuItem.dataset.action;
      const commentId = menuItem.dataset.commentId;

      if (action === 'delete-context') {
        if (commentId) {
          this.handleDeleteComment(commentId);
        } else {
          this.handleDelete();
        }
      } else if (action === 'report-context') {
        if (commentId) {
          this.handleReportComment(commentId);
        } else {
          this.handleReport();
        }
      }

      closeMenu();
    };

    // 关闭菜单
    const closeMenu = () => {
      menu.classList.remove('show');
      setTimeout(() => menu.remove(), 200);
      document.removeEventListener('click', handleOutsideClick);
      menu.removeEventListener('click', handleMenuClick);
    };

    // 点击外部关闭
    const handleOutsideClick = (e) => {
      if (!menu.contains(e.target)) {
        closeMenu();
      }
    };

    menu.addEventListener('click', handleMenuClick);
    setTimeout(() => {
      document.addEventListener('click', handleOutsideClick);
    }, 100);
  }

  /**
   * 处理用户操作
   * @param {string} action - 操作类型
   * @param {HTMLElement} target - 目标元素
   * @param {Event} event - 事件对象
   */
  handleAction(action, target, event) {
    event.preventDefault();
    event.stopPropagation();

    switch (action) {
      case 'like':
        this.handleLike();
        break;
      case 'comment':
        this.handleComment();
        break;
      case 'delete':
        this.handleDelete();
        break;
      case 'filter-tag':
        this.handleTagClick(target.dataset.tag);
        break;
      case 'view-image':
        this.handleImageClick(parseInt(target.dataset.index));
        break;
      case 'delete-comment':
        this.handleDeleteComment(target.dataset.commentId);
        break;
      case 'view-comments':
        this.handleViewAllComments();
        break;
      case 'menu':
        this.toggleMenu(target);
        break;
    }
  }

  /**
   * 处理点赞
   */
  handleLike() {
    const isLiked = this.post.likes.includes(this.options.currentUserId);
    
    if (isLiked) {
      if (this.options.onUnlike) {
        this.options.onUnlike(this.post.id);
      }
    } else {
      if (this.options.onLike) {
        this.options.onLike(this.post.id);
      }
    }
  }

  /**
   * 处理评论
   */
  handleComment() {
    if (this.options.onComment) {
      this.options.onComment(this.post.id);
    }
  }

  /**
   * 处理删除
   */
  handleDelete() {
    if (this.options.onDelete) {
      this.options.onDelete(this.post.id);
    }
  }

  // 举报功能已移除

  /**
   * 处理标签点击
   * @param {string} tag - 标签文本
   */
  handleTagClick(tag) {
    if (this.options.onTagClick) {
      this.options.onTagClick(tag);
    }
  }

  /**
   * 处理图片点击
   * @param {number} index - 图片索引
   */
  handleImageClick(index) {
    if (this.options.onImageClick) {
      this.options.onImageClick(this.post.id, index);
    } else {
      // 默认行为：打开图片查看器
      this.openImageViewer(index);
    }
  }

  /**
   * 打开图片查看器
   * @param {number} index - 图片索引
   */
  openImageViewer(index) {
    if (typeof ImageViewer === 'undefined') {
      console.warn('ImageViewer组件未加载');
      return;
    }

    const viewer = new ImageViewer({
      images: this.post.images,
      initialIndex: index,
      onClose: () => {
        console.log('图片查看器已关闭');
      }
    });
    viewer.open();
  }

  /**
   * 处理删除评论
   * @param {string} commentId - 评论ID
   */
  handleDeleteComment(commentId) {
    if (this.options.onDeleteComment) {
      this.options.onDeleteComment(this.post.id, commentId);
    }
  }

  /**
   * 处理查看所有评论
   */
  handleViewAllComments() {
    if (this.options.onViewAllComments) {
      this.options.onViewAllComments(this.post.id);
    }
  }

  /**
   * 切换菜单显示
   * @param {HTMLElement} menuBtn - 菜单按钮
   */
  toggleMenu(menuBtn) {
    const dropdown = menuBtn.nextElementSibling;
    if (dropdown && dropdown.classList.contains('post-menu-dropdown')) {
      const isVisible = dropdown.style.display !== 'none';
      dropdown.style.display = isVisible ? 'none' : 'block';
    }
  }

  /**
   * 更新动态数据
   * @param {Object} newPost - 新的动态数据
   */
  updatePost(newPost) {
    this.post = newPost;
  }

  /**
   * 获取动态ID
   * @returns {string} 动态ID
   */
  getPostId() {
    return this.post.id;
  }

  /**
   * 获取动态数据
   * @returns {Object} 动态对象
   */
  getPost() {
    return this.post;
  }
}

// Export for CommonJS and global scope
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PostCard;
}
