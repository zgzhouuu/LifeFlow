/**
 * NotificationService - 通知系统服务
 * Handles all notification operations including sending, reading, and managing notifications
 */

class NotificationService {
  constructor(storageManager) {
    this.storage = storageManager || (window.storageManager ? window.storageManager : new StorageManager());
    this.maxNotifications = 100; // 最多保留100条通知
  }

  /**
   * 发送通知
   * @param {string} toUserId - 接收者用户ID
   * @param {Object} notification - 通知对象
   * @returns {Object} 创建的通知
   */
  send(toUserId, notification) {
    if (!toUserId) {
      console.warn('No recipient specified for notification');
      return null;
    }

    const notificationKey = `${toUserId}_notifications`;
    const notifications = this.storage.load(notificationKey) || [];

    // 创建通知对象
    const newNotification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: notification.type || 'info', // like, comment, friend_request, friend_accepted, message, reminder
      fromUserId: notification.fromUserId || null,
      message: notification.message || '',
      data: notification.data || {}, // 额外数据（如postId, commentId等）
      read: false,
      createdAt: Date.now()
    };

    // 添加到通知列表开头
    notifications.unshift(newNotification);

    // 只保留最近的通知
    if (notifications.length > this.maxNotifications) {
      notifications.splice(this.maxNotifications);
    }

    // 保存
    this.storage.save(notificationKey, notifications);

    // 更新未读数量
    this.updateUnreadCount(toUserId);

    return newNotification;
  }

  /**
   * 获取用户的所有通知
   * @param {string} userId - 用户ID
   * @param {boolean} unreadOnly - 是否只获取未读通知
   * @returns {Array} 通知列表
   */
  getNotifications(userId, unreadOnly = false) {
    if (!userId) {
      return [];
    }

    const notificationKey = `${userId}_notifications`;
    const notifications = this.storage.load(notificationKey) || [];

    if (unreadOnly) {
      return notifications.filter(n => !n.read);
    }

    return notifications;
  }

  /**
   * 标记通知为已读
   * @param {string} userId - 用户ID
   * @param {string} notificationId - 通知ID
   * @returns {boolean} 是否成功
   */
  markAsRead(userId, notificationId) {
    if (!userId || !notificationId) {
      return false;
    }

    const notificationKey = `${userId}_notifications`;
    const notifications = this.storage.load(notificationKey) || [];

    const notification = notifications.find(n => n.id === notificationId);
    
    if (notification && !notification.read) {
      notification.read = true;
      this.storage.save(notificationKey, notifications);
      this.updateUnreadCount(userId);
      return true;
    }

    return false;
  }

  /**
   * 标记所有通知为已读
   * @param {string} userId - 用户ID
   * @returns {number} 标记的通知数量
   */
  markAllAsRead(userId) {
    if (!userId) {
      return 0;
    }

    const notificationKey = `${userId}_notifications`;
    const notifications = this.storage.load(notificationKey) || [];

    let count = 0;
    notifications.forEach(n => {
      if (!n.read) {
        n.read = true;
        count++;
      }
    });

    if (count > 0) {
      this.storage.save(notificationKey, notifications);
      this.updateUnreadCount(userId);
    }

    return count;
  }

  /**
   * 删除通知
   * @param {string} userId - 用户ID
   * @param {string} notificationId - 通知ID
   * @returns {boolean} 是否成功
   */
  deleteNotification(userId, notificationId) {
    if (!userId || !notificationId) {
      return false;
    }

    const notificationKey = `${userId}_notifications`;
    const notifications = this.storage.load(notificationKey) || [];

    const index = notifications.findIndex(n => n.id === notificationId);
    
    if (index > -1) {
      notifications.splice(index, 1);
      this.storage.save(notificationKey, notifications);
      this.updateUnreadCount(userId);
      return true;
    }

    return false;
  }

  /**
   * 清空所有通知
   * @param {string} userId - 用户ID
   * @returns {number} 删除的通知数量
   */
  clearAllNotifications(userId) {
    if (!userId) {
      return 0;
    }

    const notificationKey = `${userId}_notifications`;
    const notifications = this.storage.load(notificationKey) || [];
    const count = notifications.length;

    this.storage.save(notificationKey, []);
    this.updateUnreadCount(userId);

    return count;
  }

  /**
   * 获取未读通知数量
   * @param {string} userId - 用户ID
   * @returns {number} 未读数量
   */
  getUnreadCount(userId) {
    const notifications = this.getNotifications(userId, true);
    return notifications.length;
  }

  /**
   * 更新未读数量并触发事件
   * @param {string} userId - 用户ID
   */
  updateUnreadCount(userId) {
    const count = this.getUnreadCount(userId);
    
    window.dispatchEvent(new CustomEvent('notifications:updated', {
      detail: { userId, count }
    }));
  }

  /**
   * 按类型获取通知
   * @param {string} userId - 用户ID
   * @param {string} type - 通知类型
   * @returns {Array} 通知列表
   */
  getNotificationsByType(userId, type) {
    const notifications = this.getNotifications(userId);
    return notifications.filter(n => n.type === type);
  }

  /**
   * 获取来自特定用户的通知
   * @param {string} userId - 用户ID
   * @param {string} fromUserId - 发送者用户ID
   * @returns {Array} 通知列表
   */
  getNotificationsFromUser(userId, fromUserId) {
    const notifications = this.getNotifications(userId);
    return notifications.filter(n => n.fromUserId === fromUserId);
  }

  /**
   * 发送点赞通知
   * @param {string} toUserId - 接收者
   * @param {string} fromUserId - 点赞者
   * @param {string} postId - 动态ID
   */
  sendLikeNotification(toUserId, fromUserId, postId) {
    // 不给自己发通知
    if (toUserId === fromUserId) {
      return;
    }

    this.send(toUserId, {
      type: 'like',
      fromUserId,
      message: '赞了你的动态',
      data: { postId }
    });
  }

  /**
   * 发送评论通知
   * @param {string} toUserId - 接收者
   * @param {string} fromUserId - 评论者
   * @param {string} postId - 动态ID
   * @param {string} commentId - 评论ID
   */
  sendCommentNotification(toUserId, fromUserId, postId, commentId) {
    // 不给自己发通知
    if (toUserId === fromUserId) {
      return;
    }

    this.send(toUserId, {
      type: 'comment',
      fromUserId,
      message: '评论了你的动态',
      data: { postId, commentId }
    });
  }

  /**
   * 发送好友请求通知
   * @param {string} toUserId - 接收者
   * @param {string} fromUserId - 请求者
   */
  sendFriendRequestNotification(toUserId, fromUserId) {
    this.send(toUserId, {
      type: 'friend_request',
      fromUserId,
      message: '向你发送了好友请求',
      data: {}
    });
  }

  /**
   * 发送好友接受通知
   * @param {string} toUserId - 接收者
   * @param {string} fromUserId - 接受者
   */
  sendFriendAcceptedNotification(toUserId, fromUserId) {
    this.send(toUserId, {
      type: 'friend_accepted',
      fromUserId,
      message: '接受了你的好友请求',
      data: {}
    });
  }

  /**
   * 发送消息通知
   * @param {string} toUserId - 接收者
   * @param {string} fromUserId - 发送者
   * @param {string} messagePreview - 消息预览
   */
  sendMessageNotification(toUserId, fromUserId, messagePreview) {
    this.send(toUserId, {
      type: 'message',
      fromUserId,
      message: messagePreview.substring(0, 50),
      data: {}
    });
  }

  /**
   * 发送提醒通知
   * @param {string} toUserId - 接收者
   * @param {string} fromUserId - 发送者
   * @param {string} reminderType - 提醒类型（exercise/learning）
   */
  sendReminderNotification(toUserId, fromUserId, reminderType) {
    const messages = {
      exercise: '提醒你今天要运动哦！',
      learning: '提醒你今天要学习哦！'
    };

    this.send(toUserId, {
      type: 'reminder',
      fromUserId,
      message: messages[reminderType] || '有新的提醒',
      data: { reminderType }
    });
  }

  /**
   * 发送挑战邀请通知
   * @param {string} toUserId - 接收者
   * @param {string} fromUserId - 发送者
   * @param {string} challengeId - 挑战ID
   * @param {string} challengeType - 挑战类型
   */
  sendChallengeInviteNotification(toUserId, fromUserId, challengeId, challengeType) {
    const typeNames = {
      exercise: '运动',
      learning: '学习'
    };

    this.send(toUserId, {
      type: 'challenge_invite',
      fromUserId,
      message: `邀请你参加${typeNames[challengeType] || ''}挑战`,
      data: { challengeId, challengeType }
    });
  }

  /**
   * 发送挑战完成通知
   * @param {string} toUserId - 接收者
   * @param {string} challengeId - 挑战ID
   * @param {string} result - 结果描述
   */
  sendChallengeCompleteNotification(toUserId, challengeId, result) {
    this.send(toUserId, {
      type: 'challenge_complete',
      fromUserId: null,
      message: `挑战已完成：${result}`,
      data: { challengeId }
    });
  }

  /**
   * 获取通知统计
   * @param {string} userId - 用户ID
   * @returns {Object} 统计信息
   */
  getNotificationStats(userId) {
    const notifications = this.getNotifications(userId);
    const unreadCount = notifications.filter(n => !n.read).length;

    const typeCount = {};
    notifications.forEach(n => {
      typeCount[n.type] = (typeCount[n.type] || 0) + 1;
    });

    return {
      total: notifications.length,
      unread: unreadCount,
      read: notifications.length - unreadCount,
      byType: typeCount
    };
  }

  /**
   * 清理旧通知（超过指定天数）
   * @param {string} userId - 用户ID
   * @param {number} days - 天数
   * @returns {number} 清理的通知数量
   */
  cleanOldNotifications(userId, days = 30) {
    if (!userId) {
      return 0;
    }

    const notificationKey = `${userId}_notifications`;
    const notifications = this.storage.load(notificationKey) || [];

    const cutoffTime = Date.now() - (days * 24 * 60 * 60 * 1000);
    const filtered = notifications.filter(n => n.createdAt > cutoffTime);

    const removedCount = notifications.length - filtered.length;

    if (removedCount > 0) {
      this.storage.save(notificationKey, filtered);
      this.updateUnreadCount(userId);
    }

    return removedCount;
  }

  /**
   * 导出通知数据
   * @param {string} userId - 用户ID
   * @returns {Object} 通知数据
   */
  exportNotifications(userId) {
    const notifications = this.getNotifications(userId);
    const stats = this.getNotificationStats(userId);

    return {
      notifications,
      stats,
      exportDate: new Date().toISOString()
    };
  }
}

// Export for CommonJS and global scope
if (typeof module !== 'undefined' && module.exports) {
  module.exports = NotificationService;
}
