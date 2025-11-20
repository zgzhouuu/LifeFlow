/**
 * FriendList - 好友列表组件
 * 显示好友列表、搜索用户、管理好友请求
 */

class FriendList {
  constructor(containerId, options = {}) {
    this.containerId = containerId;
    this.container = document.getElementById(containerId);
    
    if (!this.container) {
      throw new Error(`Container element with id "${containerId}" not found`);
    }

    this.options = {
      currentUserId: null,           // 当前用户ID
      friendService: null,           // FriendService实例
      profileService: null,          // ProfileService实例
      onFriendClick: null,           // 好友点击回调（打开聊天）
      onFriendAdded: null,           // 好友添加回调
      onFriendRemoved: null,         // 好友删除回调
      showSearch: true,              // 是否显示搜索功能
      showRequests: true,            // 是否显示好友请求
      maxDisplayFriends: 50,         // 最多显示好友数
      ...options
    };

    // 状态
    this.state = {
      view: 'list',                  // list, search, requests
      friends: [],                   // 好友列表
      pendingRequests: [],           // 待处理请求
      searchResults: [],             // 搜索结果
      searchQuery: '',               // 搜索关键词
      selectedFriend: null           // 选中的好友
    };

    this.init();
  }

  /**
   * 初始化组件
   */
  init() {
    if (!this.options.currentUserId) {
      throw new Error('currentUserId is required');
    }

    if (!this.options.friendService) {
      throw new Error('friendService is required');
    }

    // 加载数据
    this.loadFriends();
    this.loadPendingRequests();

    // 渲染组件
    this.render();

    // 绑定事件
    this.attachEvents();

    // 监听好友相关事件
    this.listenToEvents();
  }

  /**
   * 加载好友列表
   */
  loadFriends() {
    try {
      const friendIds = this.options.friendService.getFriends(this.options.currentUserId);
      
      // 获取好友详细信息
      this.state.friends = friendIds.map(friendId => {
        const profile = this.getUserProfile(friendId);
        return {
          userId: friendId,
          nickname: profile.nickname || friendId,
          avatar: profile.avatar || '',
          lastActive: this.getLastActiveTime(friendId)
        };
      });

      // 按最近活跃时间排序
      this.state.friends.sort((a, b) => b.lastActive - a.lastActive);
    } catch (error) {
      console.error('加载好友列表失败:', error);
      this.state.friends = [];
    }
  }

  /**
   * 加载待处理的好友请求
   */
  loadPendingRequests() {
    try {
      const requests = this.options.friendService.getPendingRequests(this.options.currentUserId);
      
      // 获取请求者详细信息
      this.state.pendingRequests = requests.map(request => {
        const profile = this.getUserProfile(request.fromUserId);
        return {
          ...request,
          nickname: profile.nickname || request.fromUserId,
          avatar: profile.avatar || ''
        };
      });
    } catch (error) {
      console.error('加载好友请求失败:', error);
      this.state.pendingRequests = [];
    }
  }

  /**
   * 获取用户资料
   * @param {string} userId - 用户ID
   * @returns {Object} 用户资料
   */
  getUserProfile(userId) {
    if (this.options.profileService) {
      try {
        return this.options.profileService.getProfile(userId) || { username: userId, nickname: userId };
      } catch (error) {
        console.error('获取用户资料失败:', error);
      }
    }

    // 从localStorage直接读取 - 使用正确的键格式
    try {
      const profileKey = `lifeflow_${userId}_profile`;
      const profile = JSON.parse(localStorage.getItem(profileKey)) || {};
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
   * 获取用户最后活跃时间
   * @param {string} userId - 用户ID
   * @returns {number} 时间戳
   */
  getLastActiveTime(userId) {
    // TODO: 实现真实的活跃时间追踪
    // 目前返回随机时间用于演示
    return Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000;
  }

  /**
   * 渲染组件
   */
  render() {
    this.container.innerHTML = `
      <div class="friend-list-component">
        ${this.renderHeader()}
        ${this.renderContent()}
      </div>
    `;
  }

  /**
   * 渲染头部
   * @returns {string} HTML字符串
   */
  renderHeader() {
    const requestCount = this.state.pendingRequests.length;
    
    return `
      <div class="friend-list-header">
        <div class="friend-list-tabs">
          <button class="friend-tab ${this.state.view === 'list' ? 'active' : ''}" data-view="list">
            <span class="tab-icon">👥</span>
            <span class="tab-text">好友 (${this.state.friends.length})</span>
          </button>
          ${this.options.showRequests ? `
            <button class="friend-tab ${this.state.view === 'requests' ? 'active' : ''}" data-view="requests">
              <span class="tab-icon">📬</span>
              <span class="tab-text">请求</span>
              ${requestCount > 0 ? `<span class="badge">${requestCount}</span>` : ''}
            </button>
          ` : ''}
        </div>
        ${this.options.showSearch ? `
          <button class="add-friend-btn" data-action="search">
            <span class="btn-icon">➕</span>
            <span class="btn-text">添加好友</span>
          </button>
        ` : ''}
      </div>
    `;
  }

  /**
   * 渲染内容区域
   * @returns {string} HTML字符串
   */
  renderContent() {
    switch (this.state.view) {
      case 'list':
        return this.renderFriendsList();
      case 'search':
        return this.renderSearchView();
      case 'requests':
        return this.renderRequestsView();
      default:
        return this.renderFriendsList();
    }
  }

  /**
   * 渲染好友列表
   * @returns {string} HTML字符串
   */
  renderFriendsList() {
    if (this.state.friends.length === 0) {
      return `
        <div class="friend-list-empty">
          <div class="empty-icon">👥</div>
          <p class="empty-text">还没有好友</p>
          <p class="empty-hint">快去添加好友吧</p>
        </div>
      `;
    }

    const friendsToDisplay = this.state.friends.slice(0, this.options.maxDisplayFriends);

    return `
      <div class="friends-list-container">
        ${friendsToDisplay.map(friend => this.renderFriendItem(friend)).join('')}
      </div>
    `;
  }

  /**
   * 渲染单个好友项
   * @param {Object} friend - 好友信息
   * @returns {string} HTML字符串
   */
  renderFriendItem(friend) {
    const timeStr = DateFormatter.formatRelativeTime(friend.lastActive);
    
    return `
      <div class="friend-item" data-user-id="${friend.userId}">
        <div class="friend-avatar">
          ${friend.avatar ? 
            `<img src="${friend.avatar}" alt="${friend.nickname}" class="avatar-img">` : 
            '<div class="avatar-placeholder">👤</div>'
          }
        </div>
        <div class="friend-info">
          <div class="friend-name">${this.escapeHtml(friend.nickname)}</div>
          <div class="friend-status">活跃于 ${timeStr}</div>
        </div>
        <div class="friend-actions">
          <button class="friend-action-btn" data-action="chat" data-user-id="${friend.userId}" title="发消息">
            💬
          </button>
          <button class="friend-action-btn friend-menu-btn" data-action="menu" data-user-id="${friend.userId}" title="更多">
            ⋮
          </button>
        </div>
        <div class="friend-menu-dropdown" style="display: none;">
          <button class="menu-item" data-action="remove" data-user-id="${friend.userId}">删除好友</button>
          <button class="menu-item" data-action="block" data-user-id="${friend.userId}">加入黑名单</button>
        </div>
      </div>
    `;
  }

  /**
   * 渲染搜索视图
   * @returns {string} HTML字符串
   */
  renderSearchView() {
    return `
      <div class="friend-search-container">
        <div class="search-header">
          <button class="back-btn" data-action="back">
            <span>←</span>
            <span>返回</span>
          </button>
          <h3 class="search-title">添加好友</h3>
        </div>
        <div class="search-box">
          <input 
            type="text" 
            class="search-input" 
            placeholder="搜索用户名或昵称..." 
            value="${this.escapeHtml(this.state.searchQuery)}"
            data-action="search-input"
          >
          <button class="search-btn" data-action="do-search">🔍</button>
        </div>
        <div class="search-results">
          ${this.renderSearchResults()}
        </div>
      </div>
    `;
  }

  /**
   * 渲染搜索结果
   * @returns {string} HTML字符串
   */
  renderSearchResults() {
    if (this.state.searchQuery.trim() === '') {
      return `
        <div class="search-empty">
          <div class="empty-icon">🔍</div>
          <p class="empty-text">输入用户名或昵称搜索</p>
        </div>
      `;
    }

    if (this.state.searchResults.length === 0) {
      return `
        <div class="search-empty">
          <div class="empty-icon">😕</div>
          <p class="empty-text">没有找到匹配的用户</p>
        </div>
      `;
    }

    return `
      <div class="search-results-list">
        ${this.state.searchResults.map(user => this.renderSearchResultItem(user)).join('')}
      </div>
    `;
  }

  /**
   * 渲染搜索结果项
   * @param {Object} user - 用户信息
   * @returns {string} HTML字符串
   */
  renderSearchResultItem(user) {
    // 检查是否已发送请求
    const sentRequests = this.options.friendService.getSentRequests(this.options.currentUserId);
    const hasSentRequest = sentRequests.some(r => r.toUserId === user.username);

    return `
      <div class="search-result-item" data-user-id="${user.username}">
        <div class="result-avatar">
          ${user.avatar ? 
            `<img src="${user.avatar}" alt="${user.nickname}" class="avatar-img">` : 
            '<div class="avatar-placeholder">👤</div>'
          }
        </div>
        <div class="result-info">
          <div class="result-name">${this.escapeHtml(user.nickname)}</div>
          <div class="result-username">@${this.escapeHtml(user.username)}</div>
        </div>
        <div class="result-actions">
          ${hasSentRequest ? 
            '<button class="add-friend-btn-disabled" disabled>已发送</button>' :
            `<button class="add-friend-btn-primary" data-action="add-friend" data-user-id="${user.username}">添加</button>`
          }
        </div>
      </div>
    `;
  }

  /**
   * 渲染好友请求视图
   * @returns {string} HTML字符串
   */
  renderRequestsView() {
    if (this.state.pendingRequests.length === 0) {
      return `
        <div class="friend-list-empty">
          <div class="empty-icon">📬</div>
          <p class="empty-text">没有待处理的好友请求</p>
        </div>
      `;
    }

    return `
      <div class="friend-requests-container">
        ${this.state.pendingRequests.map(request => this.renderRequestItem(request)).join('')}
      </div>
    `;
  }

  /**
   * 渲染好友请求项
   * @param {Object} request - 请求信息
   * @returns {string} HTML字符串
   */
  renderRequestItem(request) {
    const timeStr = DateFormatter.formatRelativeTime(request.createdAt);
    
    return `
      <div class="friend-request-item" data-request-id="${request.id}">
        <div class="request-avatar">
          ${request.avatar ? 
            `<img src="${request.avatar}" alt="${request.nickname}" class="avatar-img">` : 
            '<div class="avatar-placeholder">👤</div>'
          }
        </div>
        <div class="request-info">
          <div class="request-name">${this.escapeHtml(request.nickname)}</div>
          <div class="request-time">${timeStr}</div>
        </div>
        <div class="request-actions">
          <button class="accept-btn" data-action="accept" data-request-id="${request.id}">接受</button>
          <button class="reject-btn" data-action="reject" data-request-id="${request.id}">拒绝</button>
        </div>
      </div>
    `;
  }

  /**
   * 绑定事件
   */
  attachEvents() {
    // 使用事件委托
    this.container.addEventListener('click', (e) => {
      const target = e.target.closest('[data-action]');
      if (!target) return;

      const action = target.dataset.action;
      const userId = target.dataset.userId;
      const requestId = target.dataset.requestId;

      switch (action) {
        case 'search':
          this.showSearchView();
          break;
        case 'back':
          this.showListView();
          break;
        case 'do-search':
          this.performSearch();
          break;
        case 'add-friend':
          this.sendFriendRequest(userId);
          break;
        case 'accept':
          this.acceptRequest(requestId);
          break;
        case 'reject':
          this.rejectRequest(requestId);
          break;
        case 'chat':
          this.openChat(userId);
          break;
        case 'menu':
          this.toggleMenu(target);
          break;
        case 'remove':
          this.removeFriend(userId);
          break;
        case 'block':
          this.blockUser(userId);
          break;
      }
    });

    // 标签切换
    this.container.addEventListener('click', (e) => {
      const tab = e.target.closest('.friend-tab');
      if (!tab) return;

      const view = tab.dataset.view;
      this.switchView(view);
    });

    // 搜索输入
    this.container.addEventListener('input', (e) => {
      if (e.target.dataset.action === 'search-input') {
        this.state.searchQuery = e.target.value;
      }
    });

    // 搜索框回车
    this.container.addEventListener('keypress', (e) => {
      if (e.target.dataset.action === 'search-input' && e.key === 'Enter') {
        this.performSearch();
      }
    });

    // 点击外部关闭菜单
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.friend-menu-btn') && !e.target.closest('.friend-menu-dropdown')) {
        this.closeAllMenus();
      }
    });
  }

  /**
   * 监听事件
   */
  listenToEvents() {
    // 监听好友添加事件
    window.addEventListener('friend:added', (e) => {
      this.loadFriends();
      this.loadPendingRequests();
      this.render();
    });

    // 监听好友删除事件
    window.addEventListener('friend:removed', (e) => {
      this.loadFriends();
      this.render();
    });
  }

  /**
   * 切换视图
   * @param {string} view - 视图名称
   */
  switchView(view) {
    this.state.view = view;
    this.render();
  }

  /**
   * 显示搜索视图
   */
  showSearchView() {
    this.state.view = 'search';
    this.state.searchQuery = '';
    this.state.searchResults = [];
    this.render();
    
    // 聚焦搜索框
    setTimeout(() => {
      const searchInput = this.container.querySelector('.search-input');
      if (searchInput) searchInput.focus();
    }, 100);
  }

  /**
   * 显示列表视图
   */
  showListView() {
    this.state.view = 'list';
    this.render();
  }

  /**
   * 执行搜索
   */
  performSearch() {
    const query = this.state.searchQuery.trim();
    
    if (query.length === 0) {
      this.showNotification('请输入搜索关键词', 'warning');
      return;
    }

    try {
      this.state.searchResults = this.options.friendService.searchUsers(
        this.options.currentUserId,
        query
      );
      this.render();
    } catch (error) {
      console.error('搜索失败:', error);
      this.showNotification('搜索失败，请重试', 'error');
    }
  }

  /**
   * 发送好友请求
   * @param {string} userId - 用户ID
   */
  sendFriendRequest(userId) {
    try {
      this.options.friendService.sendFriendRequest(this.options.currentUserId, userId);
      this.showNotification('好友请求已发送', 'success');
      this.render(); // 重新渲染以更新按钮状态
      
      if (this.options.onFriendAdded) {
        this.options.onFriendAdded(userId);
      }
    } catch (error) {
      console.error('发送好友请求失败:', error);
      this.showNotification(error.message || '发送失败，请重试', 'error');
    }
  }

  /**
   * 接受好友请求
   * @param {string} requestId - 请求ID
   */
  acceptRequest(requestId) {
    try {
      const success = this.options.friendService.acceptFriendRequest(
        requestId,
        this.options.currentUserId
      );
      
      if (success) {
        this.showNotification('已添加为好友', 'success');
        this.loadFriends();
        this.loadPendingRequests();
        this.render();
        
        if (this.options.onFriendAdded) {
          const request = this.state.pendingRequests.find(r => r.id === requestId);
          if (request) {
            this.options.onFriendAdded(request.fromUserId);
          }
        }
      } else {
        this.showNotification('操作失败，请重试', 'error');
      }
    } catch (error) {
      console.error('接受好友请求失败:', error);
      this.showNotification('操作失败，请重试', 'error');
    }
  }

  /**
   * 拒绝好友请求
   * @param {string} requestId - 请求ID
   */
  rejectRequest(requestId) {
    try {
      const success = this.options.friendService.rejectFriendRequest(
        requestId,
        this.options.currentUserId
      );
      
      if (success) {
        this.showNotification('已拒绝好友请求', 'success');
        this.loadPendingRequests();
        this.render();
      } else {
        this.showNotification('操作失败，请重试', 'error');
      }
    } catch (error) {
      console.error('拒绝好友请求失败:', error);
      this.showNotification('操作失败，请重试', 'error');
    }
  }

  /**
   * 打开聊天
   * @param {string} userId - 用户ID
   */
  openChat(userId) {
    if (this.options.onFriendClick) {
      this.options.onFriendClick(userId);
    } else {
      this.showNotification('聊天功能即将推出', 'info');
    }
  }

  /**
   * 切换菜单
   * @param {HTMLElement} button - 菜单按钮
   */
  toggleMenu(button) {
    const friendItem = button.closest('.friend-item');
    if (!friendItem) return;

    const menu = friendItem.querySelector('.friend-menu-dropdown');
    if (!menu) return;

    // 关闭其他菜单
    this.closeAllMenus();

    // 切换当前菜单
    const isVisible = menu.style.display === 'block';
    menu.style.display = isVisible ? 'none' : 'block';
  }

  /**
   * 关闭所有菜单
   */
  closeAllMenus() {
    const menus = this.container.querySelectorAll('.friend-menu-dropdown');
    menus.forEach(menu => {
      menu.style.display = 'none';
    });
  }

  /**
   * 删除好友
   * @param {string} userId - 用户ID
   */
  removeFriend(userId) {
    if (!confirm('确定要删除这个好友吗？')) {
      return;
    }

    try {
      const success = this.options.friendService.removeFriend(
        this.options.currentUserId,
        userId
      );
      
      if (success) {
        this.showNotification('已删除好友', 'success');
        this.loadFriends();
        this.render();
        
        if (this.options.onFriendRemoved) {
          this.options.onFriendRemoved(userId);
        }
      } else {
        this.showNotification('删除失败，请重试', 'error');
      }
    } catch (error) {
      console.error('删除好友失败:', error);
      this.showNotification('删除失败，请重试', 'error');
    }
  }

  /**
   * 屏蔽用户
   * @param {string} userId - 用户ID
   */
  blockUser(userId) {
    if (!confirm('确定要将此用户加入黑名单吗？加入后将自动删除好友关系。')) {
      return;
    }

    try {
      const success = this.options.friendService.blockUser(
        this.options.currentUserId,
        userId
      );
      
      if (success) {
        this.showNotification('已加入黑名单', 'success');
        this.loadFriends();
        this.render();
      } else {
        this.showNotification('操作失败，请重试', 'error');
      }
    } catch (error) {
      console.error('屏蔽用户失败:', error);
      this.showNotification(error.message || '操作失败，请重试', 'error');
    }
  }

  /**
   * 显示通知
   * @param {string} message - 消息内容
   * @param {string} type - 消息类型
   */
  showNotification(message, type = 'info') {
    // 如果有全局通知函数，使用它
    if (typeof window.showNotification === 'function') {
      window.showNotification(message, type);
      return;
    }

    // 否则使用简单的alert
    alert(message);
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
   * 刷新组件
   */
  refresh() {
    this.loadFriends();
    this.loadPendingRequests();
    this.render();
  }

  /**
   * 销毁组件
   */
  destroy() {
    this.container.innerHTML = '';
  }
}

// Export for CommonJS
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FriendList;
}

// Make available globally for browser
if (typeof window !== 'undefined') {
  window.FriendList = FriendList;
}
