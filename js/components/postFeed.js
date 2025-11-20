/**
 * PostFeed - 动态流组件
 * 显示动态列表，支持刷新、分页加载、虚拟滚动
 */

class PostFeed {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      throw new Error(`Container element with id "${containerId}" not found`);
    }

    // 配置选项
    this.options = {
      pageSize: 20,                    // 每页显示数量
      enableVirtualScroll: true,       // 启用虚拟滚动
      enablePullRefresh: true,         // 启用下拉刷新
      currentUserId: null,             // 当前用户ID
      friendIds: [],                   // 好友ID列表
      blockedUserIds: [],              // 黑名单用户ID列表
      filterTag: null,                 // 标签过滤
      onLike: null,                    // 点赞回调
      onComment: null,                 // 评论回调
      onDelete: null,                  // 删除回调
      onReport: null,                  // 举报回调
      onImageClick: null,              // 图片点击回调
      onTagClick: null,                // 标签点击回调
      ...options
    };

    // 状态
    this.posts = [];                   // 所有动态
    this.displayedPosts = [];          // 当前显示的动态
    this.currentPage = 1;              // 当前页码
    this.isLoading = false;            // 是否正在加载
    this.hasMore = true;               // 是否还有更多
    this.pullStartY = 0;               // 下拉起始位置
    this.isPulling = false;            // 是否正在下拉

    // 初始化
    this.init();
  }

  /**
   * 初始化组件
   */
  init() {
    this.render();
    this.attachEventListeners();
    this.loadPosts();
  }

  /**
   * 渲染容器结构
   */
  render() {
    this.container.innerHTML = `
      <div class="post-feed-wrapper">
        ${this.options.enablePullRefresh ? `
          <div class="pull-refresh-indicator">
            <div class="refresh-icon">↓</div>
            <div class="refresh-text">下拉刷新</div>
          </div>
        ` : ''}
        <div class="post-feed-list" id="${this.container.id}_list"></div>
        <div class="post-feed-loading" id="${this.container.id}_loading" style="display: none;">
          <div class="loading-spinner"></div>
          <div class="loading-text">加载中...</div>
        </div>
        <div class="post-feed-empty" id="${this.container.id}_empty" style="display: none;">
          <div class="empty-icon">📝</div>
          <p>还没有动态</p>
          <p class="empty-hint">快去发布第一条动态吧</p>
        </div>
        <div class="post-feed-end" id="${this.container.id}_end" style="display: none;">
          <div class="end-text">没有更多了</div>
        </div>
      </div>
    `;

    this.listContainer = document.getElementById(`${this.container.id}_list`);
    this.loadingIndicator = document.getElementById(`${this.container.id}_loading`);
    this.emptyIndicator = document.getElementById(`${this.container.id}_empty`);
    this.endIndicator = document.getElementById(`${this.container.id}_end`);
    
    if (this.options.enablePullRefresh) {
      this.refreshIndicator = this.container.querySelector('.pull-refresh-indicator');
      this.refreshIcon = this.container.querySelector('.refresh-icon');
      this.refreshText = this.container.querySelector('.refresh-text');
    }
  }

  /**
   * 附加事件监听器
   */
  attachEventListeners() {
    // 滚动加载更多
    this.listContainer.addEventListener('scroll', this.handleScroll.bind(this));

    // 下拉刷新
    if (this.options.enablePullRefresh) {
      this.container.addEventListener('touchstart', this.handleTouchStart.bind(this));
      this.container.addEventListener('touchmove', this.handleTouchMove.bind(this));
      this.container.addEventListener('touchend', this.handleTouchEnd.bind(this));
    }

    // 事件委托处理动态交互
    this.listContainer.addEventListener('click', this.handlePostAction.bind(this));

    // 监听动态创建和删除事件
    window.addEventListener('post:created', () => this.refresh());
    window.addEventListener('post:deleted', (e) => this.handlePostDeleted(e.detail.postId));
    
    // 监听评论创建事件
    window.addEventListener('comment:created', (e) => {
      if (e.detail && e.detail.postId) {
        this.updatePostInList(e.detail.postId);
      }
    });
  }

  /**
   * 加载动态列表
   */
  async loadPosts(append = false) {
    if (this.isLoading) return;

    this.isLoading = true;
    this.showLoading();

    try {
      // 获取社交服务实例
      const socialService = window.socialService || new SocialService(window.storageManager || new StorageManager());

      // 获取可见的动态
      let allPosts;
      if (this.options.filterTag) {
        allPosts = socialService.getPostsByTag(this.options.filterTag);
      } else {
        allPosts = socialService.getVisiblePosts(
          this.options.currentUserId,
          this.options.friendIds,
          this.options.blockedUserIds
        );
      }

      // 按时间倒序排列
      this.posts = allPosts.sort((a, b) => b.createdAt - a.createdAt);

      // 分页处理
      if (!append) {
        this.currentPage = 1;
        this.displayedPosts = [];
      }

      const startIndex = (this.currentPage - 1) * this.options.pageSize;
      const endIndex = startIndex + this.options.pageSize;
      const newPosts = this.posts.slice(startIndex, endIndex);

      this.displayedPosts = append ? [...this.displayedPosts, ...newPosts] : newPosts;
      this.hasMore = endIndex < this.posts.length;

      // 渲染动态
      this.renderPosts(append);

    } catch (error) {
      console.error('加载动态失败:', error);
      this.showError('加载动态失败，请重试');
    } finally {
      this.isLoading = false;
      this.hideLoading();
    }
  }

  /**
   * 渲染动态列表
   */
  renderPosts(append = false) {
    if (this.displayedPosts.length === 0) {
      this.showEmpty();
      return;
    }

    this.hideEmpty();

    const postsHTML = this.displayedPosts.map(post => this.renderPostCard(post)).join('');

    if (append) {
      this.listContainer.insertAdjacentHTML('beforeend', postsHTML);
    } else {
      this.listContainer.innerHTML = postsHTML;
    }

    // 显示/隐藏"没有更多"提示
    if (this.hasMore) {
      this.endIndicator.style.display = 'none';
    } else if (this.displayedPosts.length > 0) {
      this.endIndicator.style.display = 'block';
    }
  }

  /**
   * 渲染单个动态卡片
   */
  renderPostCard(post) {
    const isLiked = post.likes.includes(this.options.currentUserId);
    const isOwner = post.authorId === this.options.currentUserId;
    const timeStr = DateFormatter.formatRelativeTime(post.createdAt);
    const authorProfile = this.getUserProfile(post.authorId);
    const authorName = authorProfile.nickname || post.authorId;

    return `
      <div class="post-card" data-post-id="${post.id}">
        <div class="post-header">
          <div class="post-author">
            <div class="author-avatar">${this.getAvatarIcon(post.authorId)}</div>
            <div class="author-info">
              <div class="author-name">${this.escapeHtml(authorName)}</div>
              <div class="post-time">${timeStr}</div>
            </div>
          </div>
          ${isOwner ? `
            <div class="post-menu">
              <button class="post-menu-btn" data-action="menu">⋮</button>
              <div class="post-menu-dropdown" style="display: none;">
                <button class="menu-item" data-action="delete">删除</button>
              </div>
            </div>
          ` : ''}
        </div>

        <div class="post-content">
          ${post.content ? `<p class="post-text">${this.escapeHtml(post.content)}</p>` : ''}
          
          ${post.type === 'achievement' && post.achievementId ? `
            <div class="post-achievement">
              <span class="achievement-icon">🏆</span>
              <span class="achievement-text">分享了成就</span>
            </div>
          ` : ''}
          
          ${post.images && post.images.length > 0 ? this.renderImages(post.images, post.id) : ''}
          
          ${post.tags && post.tags.length > 0 ? `
            <div class="post-tags">
              ${post.tags.map(tag => `
                <span class="post-tag" data-action="filter-tag" data-tag="${this.escapeHtml(tag)}">
                  ${this.escapeHtml(tag)}
                </span>
              `).join('')}
            </div>
          ` : ''}
        </div>

        <div class="post-actions">
          <button class="post-action-btn ${isLiked ? 'liked' : ''}" data-action="like">
            <span class="action-icon">${isLiked ? '❤️' : '🤍'}</span>
            <span class="action-text">${post.likes.length || '点赞'}</span>
          </button>
          <button class="post-action-btn" data-action="toggle-comment">
            <span class="action-icon">💬</span>
            <span class="action-text">${post.comments.length || '评论'}</span>
          </button>
        </div>

        <div class="post-comment-section" style="display: none;">
          <div class="comment-input-wrapper">
            <input type="text" class="comment-input" placeholder="写评论..." maxlength="200" data-post-id="${post.id}">
            <button class="comment-submit-btn" data-action="submit-comment" data-post-id="${post.id}">发送</button>
          </div>
        </div>

        ${post.comments && post.comments.length > 0 ? `
          <div class="post-comments">
            ${post.comments.slice(0, 3).map(comment => this.renderComment(comment, post.authorId)).join('')}
            ${post.comments.length > 3 ? `
              <button class="view-all-comments" data-action="view-comments">
                查看全部 ${post.comments.length} 条评论
              </button>
            ` : ''}
          </div>
        ` : ''}
      </div>
    `;
  }

  /**
   * 渲染图片网格
   */
  renderImages(images, postId) {
    const imageCount = images.length;
    const gridClass = imageCount === 1 ? 'single' : imageCount <= 4 ? 'grid-2' : 'grid-3';

    return `
      <div class="post-images ${gridClass}">
        ${images.map((img, index) => `
          <div class="post-image-wrapper" data-action="view-image" data-post-id="${postId}" data-index="${index}">
            <img src="${img}" alt="动态图片" loading="lazy">
          </div>
        `).join('')}
      </div>
    `;
  }

  /**
   * 渲染评论
   */
  renderComment(comment, postAuthorId) {
    const isOwner = comment.authorId === this.options.currentUserId || postAuthorId === this.options.currentUserId;
    const commentAuthorProfile = this.getUserProfile(comment.authorId);
    const commentAuthorName = commentAuthorProfile.nickname || comment.authorId;
    
    return `
      <div class="post-comment" data-comment-id="${comment.id}">
        <div class="comment-author">${this.escapeHtml(commentAuthorName)}:</div>
        <div class="comment-content">${this.escapeHtml(comment.content)}</div>
        ${isOwner ? `
          <button class="comment-delete-btn" data-action="delete-comment" data-comment-id="${comment.id}">删除</button>
        ` : ''}
      </div>
    `;
  }

  /**
   * 处理动态交互事件
   */
  handlePostAction(e) {
    const target = e.target.closest('[data-action]');
    if (!target) return;

    const action = target.dataset.action;
    const postCard = target.closest('.post-card');
    const postId = postCard?.dataset.postId;

    switch (action) {
      case 'like':
        this.handleLike(postId);
        break;
      case 'toggle-comment':
        this.toggleCommentInput(postCard);
        break;
      case 'submit-comment':
        this.handleSubmitComment(target.dataset.postId);
        break;
      case 'delete':
        this.handleDelete(postId);
        break;
      case 'filter-tag':
        this.handleFilterTag(target.dataset.tag);
        break;
      case 'view-image':
        this.handleViewImage(target.dataset.postId, parseInt(target.dataset.index));
        break;
      case 'delete-comment':
        this.handleDeleteComment(postId, target.dataset.commentId);
        break;
      case 'view-comments':
        this.handleViewComments(postId);
        break;
      case 'menu':
        this.toggleMenu(postCard);
        break;
    }
  }

  /**
   * 切换评论输入框
   */
  toggleCommentInput(postCard) {
    const commentSection = postCard.querySelector('.post-comment-section');
    if (commentSection) {
      const isVisible = commentSection.style.display !== 'none';
      commentSection.style.display = isVisible ? 'none' : 'block';
      
      if (!isVisible) {
        // 聚焦输入框
        const input = commentSection.querySelector('.comment-input');
        if (input) {
          setTimeout(() => input.focus(), 100);
        }
      }
    }
  }

  /**
   * 提交评论
   */
  async handleSubmitComment(postId) {
    if (!postId) return;

    const postCard = this.listContainer.querySelector(`[data-post-id="${postId}"]`);
    if (!postCard) return;

    const input = postCard.querySelector('.comment-input');
    if (!input) return;

    const content = input.value.trim();
    if (!content) return;

    try {
      if (this.options.onComment) {
        this.options.onComment(postId, content);
      }

      // 清空输入框
      input.value = '';
      
      // 隐藏评论输入框
      const commentSection = postCard.querySelector('.post-comment-section');
      if (commentSection) {
        commentSection.style.display = 'none';
      }

      // 刷新动态显示
      setTimeout(() => {
        this.updatePostInList(postId);
      }, 100);

    } catch (error) {
      console.error('提交评论失败:', error);
    }
  }

  /**
   * 处理点赞
   */
  async handleLike(postId) {
    if (!postId) return;

    try {
      const socialService = window.socialService || new SocialService(window.storageManager || new StorageManager());
      const post = socialService.getPostById(postId);
      
      if (!post) return;

      const isLiked = post.likes.includes(this.options.currentUserId);

      if (isLiked) {
        socialService.unlikePost(postId, this.options.currentUserId);
      } else {
        socialService.likePost(postId, this.options.currentUserId);
      }

      // 更新UI
      this.updatePostInList(postId);

      // 回调
      if (this.options.onLike) {
        this.options.onLike(postId, !isLiked);
      }

    } catch (error) {
      console.error('点赞失败:', error);
    }
  }

  /**
   * 处理删除
   */
  async handleDelete(postId) {
    if (!confirm('确定要删除这条动态吗？')) return;

    try {
      const socialService = window.socialService || new SocialService(window.storageManager || new StorageManager());
      const success = socialService.deletePost(postId, this.options.currentUserId);

      if (success) {
        this.removePostFromList(postId);
        
        if (this.options.onDelete) {
          this.options.onDelete(postId);
        }
      }

    } catch (error) {
      console.error('删除失败:', error);
    }
  }

  /**
   * 处理标签过滤
   */
  handleFilterTag(tag) {
    if (this.options.onTagClick) {
      this.options.onTagClick(tag);
    } else {
      // 默认行为：直接过滤
      this.options.filterTag = tag;
      this.refresh();
    }
  }

  /**
   * 处理图片查看
   */
  handleViewImage(postId, index) {
    if (this.options.onImageClick) {
      this.options.onImageClick(postId, index);
    }
  }

  /**
   * 处理删除评论
   */
  async handleDeleteComment(postId, commentId) {
    if (!confirm('确定要删除这条评论吗？')) return;

    try {
      const socialService = window.socialService || new SocialService(window.storageManager || new StorageManager());
      const success = socialService.deleteComment(postId, commentId, this.options.currentUserId);

      if (success) {
        this.updatePostInList(postId);
      }

    } catch (error) {
      console.error('删除评论失败:', error);
    }
  }

  /**
   * 处理查看所有评论
   */
  handleViewComments(postId) {
    if (this.options.onComment) {
      this.options.onComment(postId);
    }
  }

  /**
   * 切换菜单
   */
  toggleMenu(postCard) {
    const dropdown = postCard.querySelector('.post-menu-dropdown');
    if (dropdown) {
      dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
    }
  }

  /**
   * 处理滚动事件（加载更多）
   */
  handleScroll(e) {
    if (this.isLoading || !this.hasMore) return;

    const { scrollTop, scrollHeight, clientHeight } = e.target;
    const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;

    // 滚动到底部80%时加载更多
    if (scrollPercentage > 0.8) {
      this.loadMore();
    }
  }

  /**
   * 处理触摸开始（下拉刷新）
   */
  handleTouchStart(e) {
    if (this.listContainer.scrollTop === 0) {
      this.pullStartY = e.touches[0].clientY;
      this.isPulling = true;
    }
  }

  /**
   * 处理触摸移动（下拉刷新）
   */
  handleTouchMove(e) {
    if (!this.isPulling) return;

    const currentY = e.touches[0].clientY;
    const pullDistance = currentY - this.pullStartY;

    if (pullDistance > 0 && pullDistance < 100) {
      e.preventDefault();
      this.refreshIndicator.style.transform = `translateY(${pullDistance}px)`;
      this.refreshIndicator.style.opacity = pullDistance / 100;

      if (pullDistance > 60) {
        this.refreshIcon.style.transform = 'rotate(180deg)';
        this.refreshText.textContent = '释放刷新';
      } else {
        this.refreshIcon.style.transform = 'rotate(0deg)';
        this.refreshText.textContent = '下拉刷新';
      }
    }
  }

  /**
   * 处理触摸结束（下拉刷新）
   */
  handleTouchEnd(e) {
    if (!this.isPulling) return;

    const currentY = e.changedTouches[0].clientY;
    const pullDistance = currentY - this.pullStartY;

    if (pullDistance > 60) {
      this.refresh();
    }

    // 重置状态
    this.refreshIndicator.style.transform = 'translateY(0)';
    this.refreshIndicator.style.opacity = '0';
    this.refreshIcon.style.transform = 'rotate(0deg)';
    this.refreshText.textContent = '下拉刷新';
    this.isPulling = false;
  }

  /**
   * 刷新动态列表
   */
  async refresh() {
    this.currentPage = 1;
    await this.loadPosts(false);
  }

  /**
   * 加载更多动态
   */
  async loadMore() {
    if (!this.hasMore || this.isLoading) return;

    this.currentPage++;
    await this.loadPosts(true);
  }

  /**
   * 更新列表中的动态
   */
  updatePostInList(postId) {
    const socialService = window.socialService || new SocialService(window.storageManager || new StorageManager());
    const post = socialService.getPostById(postId);
    
    if (!post) return;

    const postCard = this.listContainer.querySelector(`[data-post-id="${postId}"]`);
    if (postCard) {
      const newCard = this.renderPostCard(post);
      postCard.outerHTML = newCard;
    }
  }

  /**
   * 从列表中移除动态
   */
  removePostFromList(postId) {
    const postCard = this.listContainer.querySelector(`[data-post-id="${postId}"]`);
    if (postCard) {
      postCard.remove();
    }

    // 更新显示的动态列表
    this.displayedPosts = this.displayedPosts.filter(p => p.id !== postId);
    this.posts = this.posts.filter(p => p.id !== postId);

    // 如果没有动态了，显示空状态
    if (this.displayedPosts.length === 0) {
      this.showEmpty();
    }
  }

  /**
   * 处理动态删除事件
   */
  handlePostDeleted(postId) {
    this.removePostFromList(postId);
  }

  /**
   * 显示加载状态
   */
  showLoading() {
    if (this.loadingIndicator) {
      this.loadingIndicator.style.display = 'flex';
    }
  }

  /**
   * 隐藏加载状态
   */
  hideLoading() {
    if (this.loadingIndicator) {
      this.loadingIndicator.style.display = 'none';
    }
  }

  /**
   * 显示空状态
   */
  showEmpty() {
    if (this.emptyIndicator) {
      this.emptyIndicator.style.display = 'flex';
    }
    if (this.listContainer) {
      this.listContainer.style.display = 'none';
    }
  }

  /**
   * 隐藏空状态
   */
  hideEmpty() {
    if (this.emptyIndicator) {
      this.emptyIndicator.style.display = 'none';
    }
    if (this.listContainer) {
      this.listContainer.style.display = 'block';
    }
  }

  /**
   * 显示错误信息
   */
  showError(message) {
    console.error(message);
    // 可以添加错误提示UI
  }

  /**
   * 获取头像图标
   */
  getAvatarIcon(userId) {
    const profile = this.getUserProfile(userId);
    
    if (profile && profile.avatar) {
      return `<img src="${profile.avatar}" alt="${profile.nickname || userId}" style="width: 48px; height: 48px; border-radius: 50%; object-fit: cover;">`;
    }
    
    return '<div style="width: 48px; height: 48px; border-radius: 50%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center; color: white; font-size: 24px;">👤</div>';
  }

  /**
   * 获取用户资料
   */
  getUserProfile(userId) {
    const profileService = window.profileService;
    if (profileService) {
      try {
        return profileService.getProfile(userId) || { username: userId, nickname: userId };
      } catch (error) {
        console.error('获取用户资料失败:', error);
      }
    }
    
    // 从localStorage直接读取
    try {
      const profile = JSON.parse(localStorage.getItem(`lifeflow_${userId}_profile`)) || {};
      return {
        username: userId,
        nickname: profile.nickname || userId,
        avatar: profile.avatar || ''
      };
    } catch (error) {
      return { username: userId, nickname: userId, avatar: '' };
    }
  }

  /**
   * HTML转义
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * 清除标签过滤
   */
  clearFilter() {
    this.options.filterTag = null;
    this.refresh();
  }

  /**
   * 更新配置
   */
  updateOptions(newOptions) {
    this.options = { ...this.options, ...newOptions };
    this.refresh();
  }

  /**
   * 销毁组件
   */
  destroy() {
    // 移除事件监听器
    this.listContainer.removeEventListener('scroll', this.handleScroll);
    this.listContainer.removeEventListener('click', this.handlePostAction);
    
    if (this.options.enablePullRefresh) {
      this.container.removeEventListener('touchstart', this.handleTouchStart);
      this.container.removeEventListener('touchmove', this.handleTouchMove);
      this.container.removeEventListener('touchend', this.handleTouchEnd);
    }

    window.removeEventListener('post:created', this.refresh);
    window.removeEventListener('post:deleted', this.handlePostDeleted);

    // 清空容器
    this.container.innerHTML = '';
  }
}

// Export for CommonJS
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PostFeed;
}

// Make available globally for browser
if (typeof window !== 'undefined') {
  window.PostFeed = PostFeed;
}
