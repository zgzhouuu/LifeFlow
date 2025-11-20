/**
 * NotificationCenter - 通知中心浮层组件
 * Displays all notifications in a floating panel
 */

import { notificationService } from '../services/notificationService.js';
import { DateFormatter } from '../utils/dateFormatter.js';

class NotificationCenter {
  constructor() {
    this.currentUser = localStorage.getItem('lifeflow_current_user');
    this.isOpen = false;
    this.container = null;
    this.init();
  }

  /**
   * 初始化通知中心
   */
  init() {
    this.createContainer();
    this.attachEventListeners();
    
    // 监听通知更新事件
    window.addEventListener('notifications:updated', (e) => {
      if (e.detail && e.detail.userId === this.currentUser) {
        if (this.isOpen) {
          this.refresh();
        }
      }
    });
  }

  /**
   * 创建通知中心容器
   */
  createContainer() {
    // 检查是否已存在
    if (document.getElementById('notificationCenter')) {
      this.container = document.getElementById('notificationCenter');
      return;
    }

    // 创建容器
    this.container = document.createElement('div');
    this.container.id = 'notificationCenter';
    this.container.className = 'notification-center';
    this.container.style.display = 'none';
    
    document.body.appendChild(this.container);
  }

  /**
   * 附加事件监听器
   */
  attachEventListeners() {
    // 点击外部关闭
    document.addEventListener('click', (e) => {
      if (this.isOpen && 
          !this.container.contains(e.target) && 
          !e.target.closest('.notification-icon')) {
        this.close();
      }
    });

    // ESC键关闭
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });
  }

  /**
   * 打开通知中心
   */
  open() {
    this.isOpen = true;
    this.render();
    this.container.style.display = 'block';
    
    // 添加打开动画
    setTimeout(() => {
      this.container.classList.add('open');
    }, 10);
  }

  /**
   * 关闭通知中心
   */
  close() {
    this.container.classList.remove('open');
    
    setTimeout(() => {
      this.container.style.display = 'none';
      this.isOpen = false;
    }, 300);
  }

  /**
   * 切换通知中心显示状态
   */
  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  /**
   * 刷新通知列表
   */
  refresh() {
    if (this.isOpen) {
      this.render();
    }
  }

  /**
   * 渲染通知中心
   */
  render() {
    const notifications = notificationService.getNotifications(this.currentUser);
    const unreadCount = notificationService.getUnreadCount(this.currentUser);
    
    // 按类型分组通知
    const groupedNotifications = this.groupNotificationsByType(notifications);
    
    this.container.innerHTML = `
      <div class="notification-center-header">
        <h3>通知中心</h3>
        <div class="notification-center-actions">
          ${unreadCount > 0 ? `
            <button class="mark-all-read-btn" onclick="window.notificationCenter.markAllAsRead()">
              全部已读
            </button>
          ` : ''}
          <button class="close-btn" onclick="window.notificationCenter.close()">
            ✕
          </button>
        </div>
      </div>
      
      <div class="notification-center-body">
        ${notifications.length === 0 ? `
          <div class="empty-notifications">
            <div class="empty-icon">🔔</div>
            <p>暂无通知</p>
          </div>
        ` : `
          ${this.renderNotificationGroups(groupedNotifications)}
        `}
      </div>
    `;
  }

  /**
   * 按类型分组通知
   */
  groupNotificationsByType(notifications) {
    const groups = {
      friend_request: [],
      friend_accepted: [],
      message: [],
      like: [],
      comment: [],
      reminder: [],
      challenge_invite: [],
      challenge_complete: [],
      other: []
    };

    notifications.forEach(notification => {
      const type = notification.type || 'other';
      if (groups[type]) {
        groups[type].push(notification);
      } else {
        groups.other.push(notification);
      }
    });

    return groups;
  }

  /**
   * 渲染通知分组
   */
  renderNotificationGroups(groups) {
    const typeNames = {
      friend_request: '好友请求',
      friend_accepted: '好友通知',
      message: '消息',
      like: '点赞',
      comment: '评论',
      reminder: '提醒',
      challenge_invite: '挑战邀请',
      challenge_complete: '挑战完成',
      other: '其他'
    };

    let html = '';

    for (const [type, notifications] of Object.entries(groups)) {
      if (notifications.length > 0) {
        html += `
          <div class="notification-group">
            <div class="notification-group-header">${typeNames[type]}</div>
            ${notifications.map(n => this.renderNotification(n)).join('')}
          </div>
        `;
      }
    }

    return html;
  }

  /**
   * 渲染单个通知
   */
  renderNotification(notification) {
    const isUnread = !notification.read;
    const timeAgo = DateFormatter.formatRelativeTime(notification.createdAt);
    const icon = this.getNotificationIcon(notification.type);
    
    return `
      <div class="notification-item ${isUnread ? 'unread' : ''}" 
           data-notification-id="${notification.id}"
           onclick="window.notificationCenter.handleNotificationClick('${notification.id}', '${notification.type}', ${JSON.stringify(notification.data || {}).replace(/"/g, '&quot;')})">
        <div class="notification-icon">${icon}</div>
        <div class="notification-content">
          <div class="notification-message">
            ${this.formatNotificationMessage(notification)}
          </div>
          <div class="notification-time">${timeAgo}</div>
        </div>
        ${isUnread ? '<div class="notification-unread-dot"></div>' : ''}
      </div>
    `;
  }

  /**
   * 获取通知图标
   */
  getNotificationIcon(type) {
    const icons = {
      friend_request: '👋',
      friend_accepted: '✅',
      message: '💬',
      like: '❤️',
      comment: '💭',
      reminder: '⏰',
      challenge_invite: '🏆',
      challenge_complete: '🎉',
      other: '📢'
    };

    return icons[type] || icons.other;
  }

  /**
   * 格式化通知消息
   */
  formatNotificationMessage(notification) {
    let message = notification.message || '新通知';
    
    // 如果有发送者，添加发送者信息
    if (notification.fromUserId) {
      const senderName = this.getUserNickname(notification.fromUserId);
      message = `<strong>${senderName}</strong> ${message}`;
    }
    
    return message;
  }

  /**
   * 获取用户昵称
   */
  getUserNickname(userId) {
    try {
      const profileData = localStorage.getItem(`lifeflow_${userId}_profile`);
      if (profileData) {
        const profile = JSON.parse(profileData);
        return profile.nickname || userId;
      }
    } catch (error) {
      console.error('获取用户昵称失败:', error);
    }
    return userId;
  }

  /**
   * 处理通知点击
   */
  handleNotificationClick(notificationId, type, data) {
    // 标记为已读
    notificationService.markAsRead(this.currentUser, notificationId);
    
    // 根据通知类型跳转
    this.navigateByNotificationType(type, data);
    
    // 刷新显示
    this.refresh();
  }

  /**
   * 根据通知类型导航
   */
  navigateByNotificationType(type, data) {
    switch (type) {
      case 'friend_request':
      case 'friend_accepted':
        // 跳转到社交页面的好友列表
        window.location.href = 'social.html?tab=friends';
        break;
        
      case 'message':
        // 跳转到社交页面的聊天
        window.location.href = 'social.html?tab=chat';
        break;
        
      case 'like':
      case 'comment':
        // 跳转到社交页面并定位到特定动态
        if (data.postId) {
          window.location.href = `social.html?postId=${data.postId}`;
        } else {
          window.location.href = 'social.html';
        }
        break;
        
      case 'challenge_invite':
      case 'challenge_complete':
        // 跳转到社交页面的挑战
        window.location.href = 'social.html?tab=challenges';
        break;
        
      case 'reminder':
        // 根据提醒类型跳转
        if (data.reminderType === 'exercise') {
          window.location.href = 'exercise.html';
        } else if (data.reminderType === 'learning') {
          window.location.href = 'learning.html';
        }
        break;
        
      default:
        // 默认跳转到社交页面
        window.location.href = 'social.html';
    }
  }

  /**
   * 标记所有通知为已读
   */
  markAllAsRead() {
    const count = notificationService.markAllAsRead(this.currentUser);
    
    if (count > 0) {
      // 显示提示
      if (window.toastNotification) {
        window.toastNotification.show(`已标记 ${count} 条通知为已读`, 'success');
      }
      
      // 刷新显示
      this.refresh();
    }
  }

  /**
   * 清空所有通知
   */
  clearAll() {
    if (confirm('确定要清空所有通知吗？')) {
      const count = notificationService.clearAllNotifications(this.currentUser);
      
      if (window.toastNotification) {
        window.toastNotification.show(`已清空 ${count} 条通知`, 'success');
      }
      
      this.refresh();
    }
  }
}

// 导出
export { NotificationCenter };
