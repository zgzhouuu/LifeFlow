/**
 * ChatService - 聊天消息管理服务
 * Handles one-on-one chat messages, reminders, and quick encouragements
 */

class ChatService {
  constructor(storageManager) {
    this.storage = storageManager;
  }

  /**
   * 获取聊天存储键（确保一致性）
   * @param {string} userId1 - 用户1 ID
   * @param {string} userId2 - 用户2 ID
   * @returns {string} 聊天存储键
   */
  getChatKey(userId1, userId2) {
    // 按字母顺序排序，确保键的一致性
    const sortedIds = [userId1, userId2].sort();
    return `lifeflow_chat_${sortedIds[0]}_${sortedIds[1]}`;
  }

  /**
   * 发送消息
   * @param {string} senderId - 发送者ID
   * @param {string} receiverId - 接收者ID
   * @param {string} content - 消息内容
   * @param {string} type - 消息类型（text, reminder）
   * @returns {Object} 创建的消息对象
   */
  sendMessage(senderId, receiverId, content, type = 'text') {
    if (!senderId || !receiverId) {
      throw new Error('发送者和接收者ID不能为空');
    }

    if (!content || content.trim().length === 0) {
      throw new Error('消息内容不能为空');
    }

    if (content.length > 500) {
      throw new Error('消息内容不能超过500字符');
    }

    const chatKey = this.getChatKey(senderId, receiverId);
    const messages = JSON.parse(localStorage.getItem(chatKey)) || [];

    // 创建消息对象
    const message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      senderId: senderId,
      receiverId: receiverId,
      content: content.trim(),
      type: type, // text, reminder
      read: false,
      createdAt: Date.now()
    };

    // 添加消息
    messages.push(message);

    // 保存
    localStorage.setItem(chatKey, JSON.stringify(messages));

    // 发送通知
    if (window.notificationService) {
      window.notificationService.sendMessageNotification(
        receiverId,
        senderId,
        content
      );
    }

    // 触发事件
    this.notifyMessageSent(message);

    return message;
  }

  /**
   * 获取聊天消息
   * @param {string} userId1 - 用户1 ID
   * @param {string} userId2 - 用户2 ID
   * @param {number} limit - 限制数量（默认100条）
   * @returns {Array} 消息列表
   */
  getMessages(userId1, userId2, limit = 100) {
    const chatKey = this.getChatKey(userId1, userId2);
    const messages = JSON.parse(localStorage.getItem(chatKey)) || [];

    // 返回最近的消息
    return messages.slice(-limit);
  }

  /**
   * 获取所有聊天消息（不限制数量）
   * @param {string} userId1 - 用户1 ID
   * @param {string} userId2 - 用户2 ID
   * @returns {Array} 消息列表
   */
  getAllMessages(userId1, userId2) {
    const chatKey = this.getChatKey(userId1, userId2);
    return JSON.parse(localStorage.getItem(chatKey)) || [];
  }

  /**
   * 标记消息为已读
   * @param {string} userId1 - 用户1 ID
   * @param {string} userId2 - 用户2 ID
   * @param {string} currentUserId - 当前用户ID
   * @returns {number} 标记的消息数量
   */
  markAsRead(userId1, userId2, currentUserId) {
    const chatKey = this.getChatKey(userId1, userId2);
    const messages = JSON.parse(localStorage.getItem(chatKey)) || [];

    let count = 0;
    messages.forEach(msg => {
      if (msg.receiverId === currentUserId && !msg.read) {
        msg.read = true;
        count++;
      }
    });

    if (count > 0) {
      localStorage.setItem(chatKey, JSON.stringify(messages));
      this.notifyMessagesRead(userId1, userId2, currentUserId);
    }

    return count;
  }

  /**
   * 获取未读消息数量
   * @param {string} userId - 用户ID
   * @param {string} friendId - 好友ID（可选）
   * @returns {number} 未读消息数量
   */
  getUnreadCount(userId, friendId = null) {
    if (friendId) {
      // 获取与特定好友的未读消息数
      const messages = this.getMessages(userId, friendId);
      return messages.filter(m => m.receiverId === userId && !m.read).length;
    }

    // 获取所有未读消息数（需要遍历所有聊天）
    let totalUnread = 0;
    const keys = Object.keys(localStorage);

    keys.forEach(key => {
      if (key.startsWith('lifeflow_chat_') && key.includes(userId)) {
        try {
          const messages = JSON.parse(localStorage.getItem(key)) || [];
          totalUnread += messages.filter(m => 
            m.receiverId === userId && !m.read
          ).length;
        } catch (error) {
          console.error('Error parsing chat messages:', key, error);
        }
      }
    });

    return totalUnread;
  }

  /**
   * 获取最近的聊天列表
   * @param {string} userId - 用户ID
   * @returns {Array} 聊天列表
   */
  getRecentChats(userId) {
    const chats = [];
    const keys = Object.keys(localStorage);

    keys.forEach(key => {
      if (key.startsWith('lifeflow_chat_') && key.includes(userId)) {
        try {
          const messages = JSON.parse(localStorage.getItem(key)) || [];
          
          if (messages.length === 0) {
            return;
          }

          // 提取对方用户ID
          const keyParts = key.replace('lifeflow_chat_', '').split('_');
          const otherUserId = keyParts[0] === userId ? keyParts[1] : keyParts[0];

          // 获取最后一条消息
          const lastMessage = messages[messages.length - 1];

          // 计算未读数
          const unreadCount = messages.filter(m => 
            m.receiverId === userId && !m.read
          ).length;

          chats.push({
            userId: otherUserId,
            lastMessage: lastMessage,
            unreadCount: unreadCount,
            messageCount: messages.length
          });
        } catch (error) {
          console.error('Error parsing chat:', key, error);
        }
      }
    });

    // 按最后消息时间排序
    chats.sort((a, b) => b.lastMessage.createdAt - a.lastMessage.createdAt);

    return chats;
  }

  /**
   * 发送快捷鼓励
   * @param {string} senderId - 发送者ID
   * @param {string} receiverId - 接收者ID
   * @param {string} encouragementText - 鼓励语
   * @returns {Object} 创建的消息对象
   */
  sendQuickEncouragement(senderId, receiverId, encouragementText) {
    return this.sendMessage(senderId, receiverId, encouragementText, 'text');
  }

  /**
   * 发送提醒
   * @param {string} senderId - 发送者ID
   * @param {string} receiverId - 接收者ID
   * @param {string} reminderType - 提醒类型（exercise, learning）
   * @returns {Object} 创建的消息对象
   */
  sendReminder(senderId, receiverId, reminderType) {
    const reminderTexts = {
      exercise: '⏰ 提醒你今天要运动哦！',
      learning: '📚 提醒你今天要学习哦！'
    };

    const reminderText = reminderTexts[reminderType] || '⏰ 有新的提醒';

    // 发送提醒消息
    const message = this.sendMessage(senderId, receiverId, reminderText, 'reminder');

    // 发送提醒通知
    if (window.notificationService) {
      window.notificationService.sendReminderNotification(
        receiverId,
        senderId,
        reminderType
      );
    }

    return message;
  }

  /**
   * 删除聊天消息
   * @param {string} userId1 - 用户1 ID
   * @param {string} userId2 - 用户2 ID
   * @param {string} messageId - 消息ID
   * @param {string} currentUserId - 当前用户ID（只能删除自己发送的消息）
   * @returns {boolean} 是否成功
   */
  deleteMessage(userId1, userId2, messageId, currentUserId) {
    const chatKey = this.getChatKey(userId1, userId2);
    const messages = this.storage.load(chatKey) || [];

    const index = messages.findIndex(m => 
      m.id === messageId && m.senderId === currentUserId
    );

    if (index === -1) {
      return false;
    }

    messages.splice(index, 1);
    this.storage.save(chatKey, messages);

    return true;
  }

  /**
   * 清空聊天记录
   * @param {string} userId1 - 用户1 ID
   * @param {string} userId2 - 用户2 ID
   * @returns {number} 删除的消息数量
   */
  clearChat(userId1, userId2) {
    const chatKey = this.getChatKey(userId1, userId2);
    const messages = this.storage.load(chatKey) || [];
    const count = messages.length;

    this.storage.save(chatKey, []);

    return count;
  }

  /**
   * 搜索聊天消息
   * @param {string} userId1 - 用户1 ID
   * @param {string} userId2 - 用户2 ID
   * @param {string} query - 搜索关键词
   * @returns {Array} 匹配的消息列表
   */
  searchMessages(userId1, userId2, query) {
    if (!query || query.trim().length === 0) {
      return [];
    }

    const messages = this.getAllMessages(userId1, userId2);
    const lowerQuery = query.toLowerCase().trim();

    return messages.filter(m => 
      m.content.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * 获取聊天统计信息
   * @param {string} userId1 - 用户1 ID
   * @param {string} userId2 - 用户2 ID
   * @returns {Object} 统计信息
   */
  getChatStats(userId1, userId2) {
    const messages = this.getAllMessages(userId1, userId2);

    const sentByUser1 = messages.filter(m => m.senderId === userId1).length;
    const sentByUser2 = messages.filter(m => m.senderId === userId2).length;
    const unreadByUser1 = messages.filter(m => 
      m.receiverId === userId1 && !m.read
    ).length;
    const unreadByUser2 = messages.filter(m => 
      m.receiverId === userId2 && !m.read
    ).length;

    return {
      totalMessages: messages.length,
      sentByUser1: sentByUser1,
      sentByUser2: sentByUser2,
      unreadByUser1: unreadByUser1,
      unreadByUser2: unreadByUser2,
      firstMessageAt: messages.length > 0 ? messages[0].createdAt : null,
      lastMessageAt: messages.length > 0 ? messages[messages.length - 1].createdAt : null
    };
  }

  /**
   * 获取快捷鼓励语列表
   * @returns {Array} 鼓励语列表
   */
  getQuickEncouragements() {
    return [
      '加油！💪',
      '坚持就是胜利！🎯',
      '你真棒！👍',
      '继续保持！✨',
      '做得好！🌟',
      '相信自己！💫',
      '你可以的！🔥',
      '太厉害了！🎉',
      '再接再厉！🚀',
      '非常棒！👏'
    ];
  }

  /**
   * 触发消息发送事件
   * @param {Object} message - 消息对象
   */
  notifyMessageSent(message) {
    window.dispatchEvent(new CustomEvent('message:sent', {
      detail: { message }
    }));
  }

  /**
   * 触发消息已读事件
   * @param {string} userId1 - 用户1 ID
   * @param {string} userId2 - 用户2 ID
   * @param {string} readerId - 阅读者ID
   */
  notifyMessagesRead(userId1, userId2, readerId) {
    window.dispatchEvent(new CustomEvent('messages:read', {
      detail: { userId1, userId2, readerId }
    }));
  }

  /**
   * 清理旧消息（超过指定天数，保留最近N条）
   * @param {string} userId1 - 用户1 ID
   * @param {string} userId2 - 用户2 ID
   * @param {number} days - 天数
   * @param {number} keepRecent - 保留最近的消息数量
   * @returns {number} 清理的消息数量
   */
  cleanOldMessages(userId1, userId2, days = 90, keepRecent = 100) {
    const chatKey = this.getChatKey(userId1, userId2);
    const messages = this.storage.load(chatKey) || [];

    if (messages.length <= keepRecent) {
      return 0; // 消息数量未超过保留数量
    }

    const cutoffTime = Date.now() - (days * 24 * 60 * 60 * 1000);

    // 保留最近的消息或时间在截止时间之后的消息
    const recentMessages = messages.slice(-keepRecent);
    const filtered = messages.filter(m => 
      m.createdAt > cutoffTime || recentMessages.includes(m)
    );

    const removedCount = messages.length - filtered.length;

    if (removedCount > 0) {
      this.storage.save(chatKey, filtered);
    }

    return removedCount;
  }

  /**
   * 导出聊天记录
   * @param {string} userId1 - 用户1 ID
   * @param {string} userId2 - 用户2 ID
   * @returns {Object} 聊天记录数据
   */
  exportChat(userId1, userId2) {
    const messages = this.getAllMessages(userId1, userId2);
    const stats = this.getChatStats(userId1, userId2);

    return {
      participants: [userId1, userId2],
      messages: messages,
      stats: stats,
      exportDate: new Date().toISOString()
    };
  }

  /**
   * 批量标记所有聊天为已读
   * @param {string} userId - 用户ID
   * @returns {number} 标记的消息总数
   */
  markAllChatsAsRead(userId) {
    let totalMarked = 0;
    const keys = Object.keys(localStorage);

    keys.forEach(key => {
      if (key.startsWith('lifeflow_chat_') && key.includes(userId)) {
        try {
          const messages = JSON.parse(localStorage.getItem(key)) || [];
          let marked = 0;

          messages.forEach(msg => {
            if (msg.receiverId === userId && !msg.read) {
              msg.read = true;
              marked++;
            }
          });

          if (marked > 0) {
            localStorage.setItem(key, JSON.stringify(messages));
            totalMarked += marked;
          }
        } catch (error) {
          console.error('Error marking messages as read:', key, error);
        }
      }
    });

    return totalMarked;
  }

  /**
   * 获取用户的所有聊天统计
   * @param {string} userId - 用户ID
   * @returns {Object} 统计信息
   */
  getUserChatStats(userId) {
    const recentChats = this.getRecentChats(userId);
    const totalUnread = this.getUnreadCount(userId);

    let totalMessages = 0;
    let totalChats = 0;

    recentChats.forEach(chat => {
      totalMessages += chat.messageCount;
      totalChats++;
    });

    return {
      totalChats: totalChats,
      totalMessages: totalMessages,
      totalUnread: totalUnread,
      chatsWithUnread: recentChats.filter(c => c.unreadCount > 0).length
    };
  }
}

// Export for CommonJS and global scope
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ChatService;
}
