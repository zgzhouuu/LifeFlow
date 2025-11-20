/**
 * ChatWindow - 聊天窗口组件
 * 实现一对一聊天功能，包括消息发送、历史记录、快捷鼓励和提醒
 */

class ChatWindow {
  constructor(containerId, options = {}) {
    this.containerId = containerId;
    this.container = document.getElementById(containerId);
    
    if (!this.container) {
      throw new Error(`Container element with id "${containerId}" not found`);
    }

    this.options = {
      currentUserId: null,           // 当前用户ID
      friendId: null,                // 聊天对象ID
      chatService: null,             // ChatService实例
      profileService: null,          // ProfileService实例
      onClose: null,                 // 关闭回调
      maxMessages: 100,              // 最多显示消息数
      autoScroll: true,              // 自动滚动到底部
      showQuickActions: true,        // 显示快捷操作
      ...options
    };

    // 状态
    this.state = {
      messages: [],                  // 消息列表
      inputText: '',                 // 输入框文本
      isLoading: false,              // 加载状态
      showEncouragements: false,     // 显示快捷鼓励
      friendProfile: null,           // 好友资料
      unreadCount: 0                 // 未读消息数
    };

    // DOM元素引用
    this.elements = {
      header: null,
      messagesContainer: null,
      inputArea: null,
      inputField: null,
      sendButton: null,
      quickActionsPanel: null,
      encouragementsPanel: null
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

    if (!this.options.friendId) {
      throw new Error('friendId is required');
    }

    if (!this.options.chatService) {
      throw new Error('chatService is required');
    }

    // 加载好友资料
    this.loadFriendProfile();

    // 加载消息历史
    this.loadMessages();

    // 标记消息为已读
    this.markMessagesAsRead();

    // 渲染组件
    this.render();

    // 绑定事件
    this.attachEvents();

    // 监听消息事件
    this.listenToEvents();

    // 自动滚动到底部
    if (this.options.autoScroll) {
      this.scrollToBottom();
    }
  }

  /**
   * 加载好友资料
   */
  loadFriendProfile() {
    try {
      if (this.options.profileService) {
        this.state.friendProfile = this.options.profileService.getProfile(this.options.friendId);
      } else {
        // 如果没有profileService，使用默认值
        this.state.friendProfile = {
          username: this.options.friendId,
          nickname: this.options.friendId,
          avatar: ''
        };
      }
    } catch (error) {
      console.error('加载好友资料失败:', error);
      this.state.friendProfile = {
        username: this.options.friendId,
        nickname: this.options.friendId,
        avatar: ''
      };
    }
  }

  /**
   * 加载消息历史
   */
  loadMessages() {
    try {
      this.state.messages = this.options.chatService.getMessages(
        this.options.currentUserId,
        this.options.friendId,
        this.options.maxMessages
      );
    } catch (error) {
      console.error('加载消息失败:', error);
      this.state.messages = [];
    }
  }

  /**
   * 标记消息为已读
   */
  markMessagesAsRead() {
    try {
      this.options.chatService.markAsRead(
        this.options.currentUserId,
        this.options.friendId,
        this.options.currentUserId
      );
      this.state.unreadCount = 0;
    } catch (error) {
      console.error('标记消息已读失败:', error);
    }
  }

  /**
   * 渲染组件
   */
  render() {
    this.container.innerHTML = `
      <div class="chat-window">
        ${this.renderHeader()}
        ${this.renderMessagesContainer()}
        ${this.renderInputArea()}
        ${this.renderQuickActionsPanel()}
        ${this.renderEncouragements()}
      </div>
    `;

    // 保存DOM元素引用
    this.elements.header = this.container.querySelector('.chat-header');
    this.elements.messagesContainer = this.container.querySelector('.chat-messages');
    this.elements.inputArea = this.container.querySelector('.chat-input-area');
    this.elements.inputField = this.container.querySelector('.chat-input-field');
    this.elements.sendButton = this.container.querySelector('.chat-send-button');
    this.elements.quickActionsPanel = this.container.querySelector('.chat-quick-actions');
    this.elements.encouragementsPanel = this.container.querySelector('.chat-encouragements-panel');
  }

  /**
   * 渲染头部
   */
  renderHeader() {
    const profile = this.state.friendProfile || {};
    const nickname = profile.nickname || profile.username || this.options.friendId;
    const avatar = profile.avatar || '';

    return `
      <div class="chat-header">
        <button class="chat-back-button" title="返回">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M12 4L6 10L12 16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <div class="chat-friend-info">
          ${avatar ? `<img src="${avatar}" alt="${nickname}" class="chat-friend-avatar">` : 
            `<div class="chat-friend-avatar-placeholder">${nickname.charAt(0).toUpperCase()}</div>`}
          <div class="chat-friend-name">${this.escapeHtml(nickname)}</div>
        </div>
        <button class="chat-close-button" title="关闭">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M4 4L16 16M16 4L4 16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
    `;
  }

  /**
   * 渲染消息容器
   */
  renderMessagesContainer() {
    return `
      <div class="chat-messages">
        ${this.state.messages.length === 0 ? this.renderEmptyState() : this.renderMessages()}
      </div>
    `;
  }

  /**
   * 渲染空状态
   */
  renderEmptyState() {
    return `
      <div class="chat-empty-state">
        <div class="chat-empty-icon">💬</div>
        <div class="chat-empty-text">还没有消息，开始聊天吧</div>
      </div>
    `;
  }

  /**
   * 渲染消息列表
   */
  renderMessages() {
    return this.state.messages.map(msg => this.renderMessage(msg)).join('');
  }

  /**
   * 渲染单条消息
   */
  renderMessage(message) {
    const isSent = message.senderId === this.options.currentUserId;
    const isReminder = message.type === 'reminder';
    const time = this.formatTime(message.createdAt);
    
    const messageClass = `chat-message ${isSent ? 'chat-message-sent' : 'chat-message-received'} ${isReminder ? 'chat-message-reminder' : ''}`;

    return `
      <div class="${messageClass}" data-message-id="${message.id}">
        <div class="chat-message-content">
          ${this.escapeHtml(message.content)}
        </div>
        <div class="chat-message-time">${time}</div>
        ${isSent && !message.read ? '<div class="chat-message-unread-indicator"></div>' : ''}
      </div>
    `;
  }

  /**
   * 渲染输入区域
   */
  renderInputArea() {
    return `
      <div class="chat-input-area">
        ${this.options.showQuickActions ? `
          <button class="chat-quick-action-button" title="快捷操作">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="2"/>
              <path d="M7 9L10 12L13 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        ` : ''}
        <textarea 
          class="chat-input-field" 
          placeholder="输入消息..." 
          rows="1"
          maxlength="500"
        ></textarea>
        <div class="chat-char-count">
          <span class="chat-char-current">0</span>/500
        </div>
        <button class="chat-send-button" disabled>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M2 10L18 2L10 18L8 11L2 10Z" fill="currentColor"/>
          </svg>
        </button>
      </div>
    `;
  }

  /**
   * 渲染快捷操作面板
   */
  renderQuickActionsPanel() {
    if (!this.options.showQuickActions) {
      return '';
    }

    return `
      <div class="chat-quick-actions" style="display: none;">
        <button class="chat-action-button chat-encouragement-button">
          <span class="chat-action-icon">💪</span>
          <span class="chat-action-text">快捷鼓励</span>
        </button>
        <button class="chat-action-button chat-remind-exercise-button">
          <span class="chat-action-icon">🏃</span>
          <span class="chat-action-text">提醒运动</span>
        </button>
        <button class="chat-action-button chat-remind-learning-button">
          <span class="chat-action-icon">📚</span>
          <span class="chat-action-text">提醒学习</span>
        </button>
      </div>
    `;
  }

  /**
   * 渲染快捷鼓励面板
   */
  renderEncouragements() {
    const encouragements = this.options.chatService.getQuickEncouragements();

    return `
      <div class="chat-encouragements-panel" style="display: none;">
        <div class="chat-encouragements-header">
          <span>选择鼓励语</span>
          <button class="chat-encouragements-close">×</button>
        </div>
        <div class="chat-encouragements-list">
          ${encouragements.map(text => `
            <button class="chat-encouragement-item" data-text="${this.escapeHtml(text)}">
              ${this.escapeHtml(text)}
            </button>
          `).join('')}
        </div>
      </div>
    `;
  }

  /**
   * 绑定事件
   */
  attachEvents() {
    // 关闭按钮
    const closeButton = this.container.querySelector('.chat-close-button');
    const backButton = this.container.querySelector('.chat-back-button');
    
    if (closeButton) {
      closeButton.addEventListener('click', () => this.close());
    }
    
    if (backButton) {
      backButton.addEventListener('click', () => this.close());
    }

    // 输入框事件
    if (this.elements.inputField) {
      this.elements.inputField.addEventListener('input', (e) => this.handleInput(e));
      this.elements.inputField.addEventListener('keydown', (e) => this.handleKeyDown(e));
    }

    // 发送按钮
    if (this.elements.sendButton) {
      this.elements.sendButton.addEventListener('click', () => this.sendMessage());
    }

    // 快捷操作按钮
    const quickActionButton = this.container.querySelector('.chat-quick-action-button');
    if (quickActionButton) {
      quickActionButton.addEventListener('click', () => this.toggleQuickActions());
    }

    // 快捷鼓励按钮
    const encouragementButton = this.container.querySelector('.chat-encouragement-button');
    if (encouragementButton) {
      encouragementButton.addEventListener('click', () => this.showEncouragements());
    }

    // 提醒运动按钮
    const remindExerciseButton = this.container.querySelector('.chat-remind-exercise-button');
    if (remindExerciseButton) {
      remindExerciseButton.addEventListener('click', () => this.sendReminder('exercise'));
    }

    // 提醒学习按钮
    const remindLearningButton = this.container.querySelector('.chat-remind-learning-button');
    if (remindLearningButton) {
      remindLearningButton.addEventListener('click', () => this.sendReminder('learning'));
    }

    // 鼓励语选择
    const encouragementItems = this.container.querySelectorAll('.chat-encouragement-item');
    encouragementItems.forEach(item => {
      item.addEventListener('click', (e) => {
        const text = e.target.dataset.text;
        this.sendQuickEncouragement(text);
      });
    });

    // 关闭鼓励面板
    const encouragementsClose = this.container.querySelector('.chat-encouragements-close');
    if (encouragementsClose) {
      encouragementsClose.addEventListener('click', () => this.hideEncouragements());
    }
  }

  /**
   * 监听事件
   */
  listenToEvents() {
    // 监听新消息
    window.addEventListener('message:sent', (e) => {
      const { message } = e.detail;
      
      // 如果是当前聊天的消息，更新显示
      if ((message.senderId === this.options.currentUserId && message.receiverId === this.options.friendId) ||
          (message.senderId === this.options.friendId && message.receiverId === this.options.currentUserId)) {
        this.loadMessages();
        this.updateMessagesDisplay();
        
        // 如果是接收到的消息，标记为已读
        if (message.receiverId === this.options.currentUserId) {
          this.markMessagesAsRead();
        }
        
        if (this.options.autoScroll) {
          this.scrollToBottom();
        }
      }
    });

    // 监听消息已读
    window.addEventListener('messages:read', (e) => {
      const { userId1, userId2, readerId } = e.detail;
      
      // 如果是当前聊天，更新显示
      if ((userId1 === this.options.currentUserId || userId2 === this.options.currentUserId) &&
          (userId1 === this.options.friendId || userId2 === this.options.friendId)) {
        this.updateMessagesDisplay();
      }
    });
  }

  /**
   * 处理输入
   */
  handleInput(e) {
    const text = e.target.value;
    this.state.inputText = text;

    // 更新字符计数
    const charCount = this.container.querySelector('.chat-char-current');
    if (charCount) {
      charCount.textContent = text.length;
    }

    // 更新发送按钮状态
    if (this.elements.sendButton) {
      this.elements.sendButton.disabled = text.trim().length === 0;
    }

    // 自动调整输入框高度
    this.autoResizeTextarea(e.target);
  }

  /**
   * 处理键盘事件
   */
  handleKeyDown(e) {
    // Ctrl/Cmd + Enter 发送消息
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      this.sendMessage();
    }
  }

  /**
   * 自动调整文本框高度
   */
  autoResizeTextarea(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  }

  /**
   * 发送消息
   */
  sendMessage() {
    const text = this.state.inputText.trim();

    if (!text || text.length === 0) {
      return;
    }

    if (text.length > 500) {
      this.showError('消息内容不能超过500字符');
      return;
    }

    try {
      // 发送消息
      this.options.chatService.sendMessage(
        this.options.currentUserId,
        this.options.friendId,
        text,
        'text'
      );

      // 清空输入框
      this.state.inputText = '';
      if (this.elements.inputField) {
        this.elements.inputField.value = '';
        this.elements.inputField.style.height = 'auto';
      }

      // 更新字符计数
      const charCount = this.container.querySelector('.chat-char-current');
      if (charCount) {
        charCount.textContent = '0';
      }

      // 禁用发送按钮
      if (this.elements.sendButton) {
        this.elements.sendButton.disabled = true;
      }

      // 重新加载消息
      this.loadMessages();
      this.updateMessagesDisplay();

      // 滚动到底部
      if (this.options.autoScroll) {
        this.scrollToBottom();
      }

      // 隐藏快捷操作面板
      this.hideQuickActions();
    } catch (error) {
      console.error('发送消息失败:', error);
      this.showError(error.message || '发送失败，请重试');
    }
  }

  /**
   * 发送快捷鼓励
   */
  sendQuickEncouragement(text) {
    try {
      this.options.chatService.sendQuickEncouragement(
        this.options.currentUserId,
        this.options.friendId,
        text
      );

      // 重新加载消息
      this.loadMessages();
      this.updateMessagesDisplay();

      // 滚动到底部
      if (this.options.autoScroll) {
        this.scrollToBottom();
      }

      // 隐藏鼓励面板
      this.hideEncouragements();
      this.hideQuickActions();
    } catch (error) {
      console.error('发送鼓励失败:', error);
      this.showError('发送失败，请重试');
    }
  }

  /**
   * 发送提醒
   */
  sendReminder(type) {
    try {
      this.options.chatService.sendReminder(
        this.options.currentUserId,
        this.options.friendId,
        type
      );

      // 重新加载消息
      this.loadMessages();
      this.updateMessagesDisplay();

      // 滚动到底部
      if (this.options.autoScroll) {
        this.scrollToBottom();
      }

      // 隐藏快捷操作面板
      this.hideQuickActions();

      // 显示成功提示
      this.showSuccess(`已发送${type === 'exercise' ? '运动' : '学习'}提醒`);
    } catch (error) {
      console.error('发送提醒失败:', error);
      this.showError('发送失败，请重试');
    }
  }

  /**
   * 切换快捷操作面板
   */
  toggleQuickActions() {
    if (this.elements.quickActionsPanel) {
      const isVisible = this.elements.quickActionsPanel.style.display !== 'none';
      this.elements.quickActionsPanel.style.display = isVisible ? 'none' : 'flex';
    }
  }

  /**
   * 隐藏快捷操作面板
   */
  hideQuickActions() {
    if (this.elements.quickActionsPanel) {
      this.elements.quickActionsPanel.style.display = 'none';
    }
  }

  /**
   * 显示快捷鼓励面板
   */
  showEncouragements() {
    if (this.elements.encouragementsPanel) {
      this.elements.encouragementsPanel.style.display = 'block';
    }
  }

  /**
   * 隐藏快捷鼓励面板
   */
  hideEncouragements() {
    if (this.elements.encouragementsPanel) {
      this.elements.encouragementsPanel.style.display = 'none';
    }
  }

  /**
   * 更新消息显示
   */
  updateMessagesDisplay() {
    if (this.elements.messagesContainer) {
      this.elements.messagesContainer.innerHTML = 
        this.state.messages.length === 0 ? this.renderEmptyState() : this.renderMessages();
    }
  }

  /**
   * 滚动到底部
   */
  scrollToBottom() {
    setTimeout(() => {
      if (this.elements.messagesContainer) {
        this.elements.messagesContainer.scrollTop = this.elements.messagesContainer.scrollHeight;
      }
    }, 100);
  }

  /**
   * 关闭聊天窗口
   */
  close() {
    if (this.options.onClose) {
      this.options.onClose();
    } else {
      // 默认行为：隐藏容器
      this.container.style.display = 'none';
    }
  }

  /**
   * 刷新聊天窗口
   */
  refresh() {
    this.loadMessages();
    this.markMessagesAsRead();
    this.updateMessagesDisplay();
    
    if (this.options.autoScroll) {
      this.scrollToBottom();
    }
  }

  /**
   * 切换聊天对象
   */
  switchFriend(friendId) {
    this.options.friendId = friendId;
    this.loadFriendProfile();
    this.loadMessages();
    this.markMessagesAsRead();
    this.render();
    this.attachEvents();
    
    if (this.options.autoScroll) {
      this.scrollToBottom();
    }
  }

  /**
   * 获取未读消息数
   */
  getUnreadCount() {
    return this.options.chatService.getUnreadCount(
      this.options.currentUserId,
      this.options.friendId
    );
  }

  /**
   * 格式化时间
   */
  formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    // 今天
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    }

    // 昨天
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return '昨天 ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    }

    // 一周内
    if (diff < 7 * 24 * 60 * 60 * 1000) {
      const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
      return days[date.getDay()] + ' ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    }

    // 更早
    return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }) + ' ' +
           date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
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
   * 显示错误提示
   */
  showError(message) {
    if (window.toastNotification) {
      window.toastNotification.show(message, 'error');
    } else {
      alert(message);
    }
  }

  /**
   * 显示成功提示
   */
  showSuccess(message) {
    if (window.toastNotification) {
      window.toastNotification.show(message, 'success');
    }
  }

  /**
   * 销毁组件
   */
  destroy() {
    // 移除事件监听
    // 清空容器
    if (this.container) {
      this.container.innerHTML = '';
    }
  }
}

// Export for CommonJS and global scope
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ChatWindow;
}
