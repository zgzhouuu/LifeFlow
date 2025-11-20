/**
 * CommentList - 评论列表组件
 * 显示动态的评论列表，支持添加评论、删除评论
 */

class CommentList {
  constructor(postId, options = {}) {
    this.postId = postId;
    this.options = {
      currentUserId: null,           // 当前用户ID
      maxDisplay: 3,                 // 默认显示的评论数量
      showAll: false,                // 是否显示所有评论
      onCommentAdded: null,          // 评论添加回调
      onCommentDeleted: null,        // 评论删除回调
      getUserProfile: null,          // 获取用户资料回调
      ...options
    };

    this.comments = [];
    this.isSubmitting = false;
  }

  /**
   * 渲染评论列表HTML
   * @returns {string} HTML字符串
   */
  render() {
    const displayComments = this.options.showAll 
      ? this.comments 
      : this.comments.slice(0, this.options.maxDisplay);
    
    const hasMore = this.comments.length > this.options.maxDisplay && !this.options.showAll;

    return `
      <div class="comment-list" data-post-id="${this.postId}">
        ${this.renderCommentInput()}
        <div class="comment-items">
          ${displayComments.map(comment => this.renderComment(comment)).join('')}
        </div>
        ${hasMore ? this.renderViewAllButton() : ''}
      </div>
    `;
  }

  /**
   * 渲染评论输入框
   * @returns {string} HTML字符串
   */
  renderCommentInput() {
    return `
      <div class="comment-input-wrapper">
        <textarea 
          class="comment-input" 
          placeholder="写评论..." 
          maxlength="200"
          rows="1"
          data-action="comment-input"
        ></textarea>
        <div class="comment-input-footer">
          <span class="comment-char-count">
            <span class="current-count">0</span>/200
          </span>
          <button 
            class="comment-submit-btn" 
            data-action="submit-comment"
            disabled
          >
            发送
          </button>
        </div>
      </div>
    `;
  }

  /**
   * 渲染单条评论
   * @param {Object} comment - 评论对象
   * @returns {string} HTML字符串
   */
  renderComment(comment) {
    const userProfile = this.getUserProfile(comment.authorId);
    const isOwner = comment.authorId === this.options.currentUserId;
    const timeStr = DateFormatter.formatRelativeTime(comment.createdAt);

    return `
      <div class="comment-item" data-comment-id="${comment.id}">
        <div class="comment-avatar">
          ${this.renderAvatar(userProfile)}
        </div>
        <div class="comment-body">
          <div class="comment-header">
            <span class="comment-author">${this.escapeHtml(userProfile.nickname || comment.authorId)}</span>
            <span class="comment-time">${timeStr}</span>
          </div>
          <div class="comment-content">${this.escapeHtml(comment.content)}</div>
        </div>
        ${isOwner ? this.renderDeleteButton(comment.id) : ''}
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
      return `<img src="${userProfile.avatar}" alt="头像" class="comment-avatar-img">`;
    }
    return '👤';
  }

  /**
   * 渲染删除按钮
   * @param {string} commentId - 评论ID
   * @returns {string} HTML字符串
   */
  renderDeleteButton(commentId) {
    return `
      <button 
        class="comment-delete-btn" 
        data-action="delete-comment" 
        data-comment-id="${commentId}"
        aria-label="删除评论"
      >
        删除
      </button>
    `;
  }

  /**
   * 渲染"查看全部评论"按钮
   * @returns {string} HTML字符串
   */
  renderViewAllButton() {
    return `
      <button class="view-all-comments-btn" data-action="view-all-comments">
        查看全部 ${this.comments.length} 条评论
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
    // 评论输入框事件
    const commentInput = element.querySelector('.comment-input');
    const charCount = element.querySelector('.current-count');
    const submitBtn = element.querySelector('.comment-submit-btn');

    if (commentInput) {
      // 自动调整高度
      commentInput.addEventListener('input', (e) => {
        this.handleInputChange(e.target, charCount, submitBtn);
      });

      // 回车发送（Shift+Enter换行）
      commentInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          if (!submitBtn.disabled) {
            this.handleSubmitComment(commentInput, element);
          }
        }
      });
    }

    // 事件委托处理按钮点击
    element.addEventListener('click', (e) => {
      const target = e.target.closest('[data-action]');
      if (!target) return;

      const action = target.dataset.action;
      this.handleAction(action, target, element);
    });
  }

  /**
   * 处理输入变化
   * @param {HTMLTextAreaElement} input - 输入框
   * @param {HTMLElement} charCount - 字符计数元素
   * @param {HTMLButtonElement} submitBtn - 提交按钮
   */
  handleInputChange(input, charCount, submitBtn) {
    const length = input.value.length;
    
    // 更新字符计数
    if (charCount) {
      charCount.textContent = length;
    }

    // 更新提交按钮状态
    if (submitBtn) {
      submitBtn.disabled = length === 0 || length > 200;
    }

    // 自动调整高度
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 120) + 'px';
  }

  /**
   * 处理用户操作
   * @param {string} action - 操作类型
   * @param {HTMLElement} target - 目标元素
   * @param {HTMLElement} element - 容器元素
   */
  handleAction(action, target, element) {
    switch (action) {
      case 'submit-comment':
        const commentInput = element.querySelector('.comment-input');
        this.handleSubmitComment(commentInput, element);
        break;
      case 'delete-comment':
        this.handleDeleteComment(target.dataset.commentId, element);
        break;
      case 'view-all-comments':
        this.handleViewAllComments(element);
        break;
    }
  }

  /**
   * 处理提交评论
   * @param {HTMLTextAreaElement} input - 输入框
   * @param {HTMLElement} element - 容器元素
   */
  async handleSubmitComment(input, element) {
    if (this.isSubmitting) return;

    const content = input.value.trim();
    
    if (!content || content.length === 0) {
      this.showError('评论内容不能为空');
      return;
    }

    if (content.length > 200) {
      this.showError('评论内容不能超过200字符');
      return;
    }

    if (!this.options.currentUserId) {
      this.showError('请先登录');
      return;
    }

    this.isSubmitting = true;
    const submitBtn = element.querySelector('.comment-submit-btn');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = '发送中...';
    }

    try {
      // 调用社交服务添加评论
      const socialService = window.socialService || new SocialService(window.storageManager || new StorageManager());
      
      const comment = socialService.addComment(this.postId, {
        authorId: this.options.currentUserId,
        content: content
      });

      if (comment) {
        // 添加到本地评论列表
        this.comments.push(comment);

        // 清空输入框
        input.value = '';
        input.style.height = 'auto';
        
        // 更新字符计数
        const charCount = element.querySelector('.current-count');
        if (charCount) {
          charCount.textContent = '0';
        }

        // 重新渲染评论列表
        this.updateCommentList(element);

        // 触发回调
        if (this.options.onCommentAdded) {
          this.options.onCommentAdded(this.postId, comment);
        }

        // 显示成功提示
        this.showSuccess('评论成功');
      }

    } catch (error) {
      console.error('评论失败:', error);
      this.showError(error.message || '评论失败，请重试');
    } finally {
      this.isSubmitting = false;
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = '发送';
      }
    }
  }

  /**
   * 处理删除评论
   * @param {string} commentId - 评论ID
   * @param {HTMLElement} element - 容器元素
   */
  async handleDeleteComment(commentId, element) {
    if (!confirm('确定要删除这条评论吗？')) {
      return;
    }

    try {
      // 调用社交服务删除评论
      const socialService = window.socialService || new SocialService(window.storageManager || new StorageManager());
      
      const success = socialService.deleteComment(
        this.postId,
        commentId,
        this.options.currentUserId
      );

      if (success) {
        // 从本地评论列表中移除
        this.comments = this.comments.filter(c => c.id !== commentId);

        // 重新渲染评论列表
        this.updateCommentList(element);

        // 触发回调
        if (this.options.onCommentDeleted) {
          this.options.onCommentDeleted(this.postId, commentId);
        }

        // 显示成功提示
        this.showSuccess('评论已删除');
      } else {
        this.showError('删除失败，请重试');
      }

    } catch (error) {
      console.error('删除评论失败:', error);
      this.showError('删除失败，请重试');
    }
  }

  /**
   * 处理查看所有评论
   * @param {HTMLElement} element - 容器元素
   */
  handleViewAllComments(element) {
    this.options.showAll = true;
    this.updateCommentList(element);
  }

  /**
   * 更新评论列表显示
   * @param {HTMLElement} element - 容器元素
   */
  updateCommentList(element) {
    const commentItems = element.querySelector('.comment-items');
    const viewAllBtn = element.querySelector('.view-all-comments-btn');

    if (commentItems) {
      const displayComments = this.options.showAll 
        ? this.comments 
        : this.comments.slice(0, this.options.maxDisplay);
      
      commentItems.innerHTML = displayComments.map(comment => this.renderComment(comment)).join('');
    }

    // 更新"查看全部"按钮
    const hasMore = this.comments.length > this.options.maxDisplay && !this.options.showAll;
    
    if (viewAllBtn) {
      if (hasMore) {
        viewAllBtn.style.display = 'block';
        viewAllBtn.textContent = `查看全部 ${this.comments.length} 条评论`;
      } else {
        viewAllBtn.style.display = 'none';
      }
    } else if (hasMore) {
      // 如果按钮不存在但需要显示，添加按钮
      const viewAllHtml = this.renderViewAllButton();
      element.insertAdjacentHTML('beforeend', viewAllHtml);
    }
  }

  /**
   * 加载评论
   * @param {Array} comments - 评论列表
   */
  loadComments(comments) {
    this.comments = comments || [];
  }

  /**
   * 获取评论数量
   * @returns {number} 评论数量
   */
  getCommentCount() {
    return this.comments.length;
  }

  /**
   * 显示成功提示
   * @param {string} message - 提示信息
   */
  showSuccess(message) {
    if (window.toastNotification) {
      window.toastNotification.show(message, 'success');
    } else {
      console.log(message);
    }
  }

  /**
   * 显示错误提示
   * @param {string} message - 错误信息
   */
  showError(message) {
    if (window.toastNotification) {
      window.toastNotification.show(message, 'error');
    } else {
      alert(message);
    }
  }

  /**
   * 更新配置
   * @param {Object} newOptions - 新配置
   */
  updateOptions(newOptions) {
    this.options = { ...this.options, ...newOptions };
  }

  /**
   * 销毁组件
   */
  destroy() {
    this.comments = [];
    this.isSubmitting = false;
  }
}

// Export for CommonJS and global scope
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CommentList;
}
