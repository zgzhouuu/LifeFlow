/**
 * FriendService - 好友关系管理服务
 * Handles friend requests, friendships, and blocklist management
 */

class FriendService {
  constructor(storageManager) {
    this.storage = storageManager;
    this.friendshipsKey = 'lifeflow_friendships';
    this.friendRequestsKey = 'lifeflow_friend_requests';
  }

  /**
   * 发送好友请求
   * @param {string} fromUserId - 发送者用户ID
   * @param {string} toUserId - 接收者用户ID
   * @returns {boolean} 是否成功
   */
  sendFriendRequest(fromUserId, toUserId) {
    if (!fromUserId || !toUserId) {
      throw new Error('用户ID不能为空');
    }

    if (fromUserId === toUserId) {
      throw new Error('不能添加自己为好友');
    }

    // 检查是否已经是好友
    if (this.areFriends(fromUserId, toUserId)) {
      throw new Error('已经是好友了');
    }

    const requests = this.storage.load(this.friendRequestsKey) || [];
    
    // 检查是否已经发送过请求
    const existing = requests.find(r => 
      r.fromUserId === fromUserId && 
      r.toUserId === toUserId && 
      r.status === 'pending'
    );
    
    if (existing) {
      throw new Error('已经发送过好友请求');
    }

    // 创建好友请求
    const request = {
      id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      fromUserId: fromUserId,
      toUserId: toUserId,
      status: 'pending', // pending, accepted, rejected
      createdAt: Date.now()
    };

    requests.push(request);
    this.storage.save(this.friendRequestsKey, requests);

    // 发送通知
    if (window.notificationService) {
      window.notificationService.sendFriendRequestNotification(toUserId, fromUserId);
    }

    return true;
  }

  /**
   * 接受好友请求
   * @param {string} requestId - 请求ID
   * @param {string} userId - 当前用户ID
   * @returns {boolean} 是否成功
   */
  acceptFriendRequest(requestId, userId) {
    const requests = this.storage.load(this.friendRequestsKey) || [];
    const request = requests.find(r => r.id === requestId && r.toUserId === userId);

    if (!request) {
      return false;
    }

    if (request.status !== 'pending') {
      return false;
    }

    // 更新请求状态
    request.status = 'accepted';
    request.acceptedAt = Date.now();
    this.storage.save(this.friendRequestsKey, requests);

    // 添加双向好友关系
    this.addFriendship(request.fromUserId, request.toUserId);

    // 发送通知
    if (window.notificationService) {
      window.notificationService.sendFriendAcceptedNotification(
        request.fromUserId,
        userId
      );
    }

    // 触发事件
    this.notifyFriendAdded(request.fromUserId, request.toUserId);

    return true;
  }

  /**
   * 拒绝好友请求
   * @param {string} requestId - 请求ID
   * @param {string} userId - 当前用户ID
   * @returns {boolean} 是否成功
   */
  rejectFriendRequest(requestId, userId) {
    const requests = this.storage.load(this.friendRequestsKey) || [];
    const index = requests.findIndex(r => r.id === requestId && r.toUserId === userId);

    if (index === -1) {
      return false;
    }

    // 直接删除请求（不保留拒绝记录）
    requests.splice(index, 1);
    this.storage.save(this.friendRequestsKey, requests);

    return true;
  }

  /**
   * 添加好友关系（双向）
   * @param {string} userId1 - 用户1 ID
   * @param {string} userId2 - 用户2 ID
   */
  addFriendship(userId1, userId2) {
    const friendships = this.storage.load(this.friendshipsKey) || [];

    // 检查是否已存在
    const exists = friendships.some(f =>
      (f.userId === userId1 && f.friendId === userId2) ||
      (f.userId === userId2 && f.friendId === userId1)
    );

    if (exists) {
      return;
    }

    // 添加双向关系
    friendships.push({
      userId: userId1,
      friendId: userId2,
      createdAt: Date.now()
    });

    friendships.push({
      userId: userId2,
      friendId: userId1,
      createdAt: Date.now()
    });

    this.storage.save(this.friendshipsKey, friendships);
  }

  /**
   * 获取用户的好友列表
   * @param {string} userId - 用户ID
   * @returns {Array} 好友ID列表
   */
  getFriends(userId) {
    if (!userId) {
      return [];
    }

    const friendships = this.storage.load(this.friendshipsKey) || [];
    
    return friendships
      .filter(f => f.userId === userId)
      .map(f => f.friendId);
  }

  /**
   * 获取用户的好友详细信息
   * @param {string} userId - 用户ID
   * @returns {Array} 好友信息列表
   */
  getFriendsWithDetails(userId) {
    const friendIds = this.getFriends(userId);
    const friendships = this.storage.load(this.friendshipsKey) || [];

    return friendIds.map(friendId => {
      const friendship = friendships.find(f => 
        f.userId === userId && f.friendId === friendId
      );

      return {
        userId: friendId,
        friendSince: friendship ? friendship.createdAt : null
      };
    });
  }

  /**
   * 删除好友
   * @param {string} userId - 用户ID
   * @param {string} friendId - 好友ID
   * @returns {boolean} 是否成功
   */
  removeFriend(userId, friendId) {
    const friendships = this.storage.load(this.friendshipsKey) || [];

    // 删除双向关系
    const filtered = friendships.filter(f =>
      !(f.userId === userId && f.friendId === friendId) &&
      !(f.userId === friendId && f.friendId === userId)
    );

    const removed = friendships.length !== filtered.length;

    if (removed) {
      this.storage.save(this.friendshipsKey, filtered);
      this.notifyFriendRemoved(userId, friendId);
    }

    return removed;
  }

  /**
   * 检查两个用户是否是好友
   * @param {string} userId1 - 用户1 ID
   * @param {string} userId2 - 用户2 ID
   * @returns {boolean} 是否是好友
   */
  areFriends(userId1, userId2) {
    const friendships = this.storage.load(this.friendshipsKey) || [];
    
    return friendships.some(f =>
      (f.userId === userId1 && f.friendId === userId2) ||
      (f.userId === userId2 && f.friendId === userId1)
    );
  }

  /**
   * 获取待处理的好友请求
   * @param {string} userId - 用户ID
   * @returns {Array} 好友请求列表
   */
  getPendingRequests(userId) {
    const requests = this.storage.load(this.friendRequestsKey) || [];
    
    return requests.filter(r => 
      r.toUserId === userId && r.status === 'pending'
    );
  }

  /**
   * 获取发送的好友请求
   * @param {string} userId - 用户ID
   * @returns {Array} 好友请求列表
   */
  getSentRequests(userId) {
    const requests = this.storage.load(this.friendRequestsKey) || [];
    
    return requests.filter(r => 
      r.fromUserId === userId && r.status === 'pending'
    );
  }

  /**
   * 添加用户到黑名单
   * @param {string} userId - 用户ID
   * @param {string} blockedUserId - 被屏蔽的用户ID
   * @returns {boolean} 是否成功
   */
  blockUser(userId, blockedUserId) {
    if (!userId || !blockedUserId) {
      return false;
    }

    if (userId === blockedUserId) {
      throw new Error('不能屏蔽自己');
    }

    const blocklistKey = `${userId}_blocklist`;
    const blocklist = this.storage.load(blocklistKey) || [];

    if (blocklist.includes(blockedUserId)) {
      return false; // 已经在黑名单中
    }

    blocklist.push(blockedUserId);
    this.storage.save(blocklistKey, blocklist);

    // 如果是好友，自动删除好友关系
    if (this.areFriends(userId, blockedUserId)) {
      this.removeFriend(userId, blockedUserId);
    }

    // 触发事件
    this.notifyUserBlocked(userId, blockedUserId);

    return true;
  }

  /**
   * 从黑名单移除用户
   * @param {string} userId - 用户ID
   * @param {string} blockedUserId - 被屏蔽的用户ID
   * @returns {boolean} 是否成功
   */
  unblockUser(userId, blockedUserId) {
    if (!userId || !blockedUserId) {
      return false;
    }

    const blocklistKey = `${userId}_blocklist`;
    const blocklist = this.storage.load(blocklistKey) || [];

    const index = blocklist.indexOf(blockedUserId);
    
    if (index === -1) {
      return false; // 不在黑名单中
    }

    blocklist.splice(index, 1);
    this.storage.save(blocklistKey, blocklist);

    // 触发事件
    this.notifyUserUnblocked(userId, blockedUserId);

    return true;
  }

  /**
   * 获取用户的黑名单
   * @param {string} userId - 用户ID
   * @returns {Array} 黑名单用户ID列表
   */
  getBlocklist(userId) {
    if (!userId) {
      return [];
    }

    const blocklistKey = `${userId}_blocklist`;
    return this.storage.load(blocklistKey) || [];
  }

  /**
   * 检查用户是否被屏蔽
   * @param {string} userId - 用户ID
   * @param {string} targetUserId - 目标用户ID
   * @returns {boolean} 是否被屏蔽
   */
  isBlocked(userId, targetUserId) {
    const blocklist = this.getBlocklist(userId);
    return blocklist.includes(targetUserId);
  }

  /**
   * 搜索用户（排除已是好友和黑名单）
   * @param {string} currentUserId - 当前用户ID
   * @param {string} query - 搜索关键词
   * @returns {Array} 用户列表
   */
  searchUsers(currentUserId, query) {
    if (!query || query.trim().length === 0) {
      return [];
    }

    // 获取所有用户（从ProfileService）
    const allUsers = this.getAllUsers();
    const friends = this.getFriends(currentUserId);
    const blocklist = this.getBlocklist(currentUserId);

    const lowerQuery = query.toLowerCase().trim();

    return allUsers.filter(user => {
      // 排除自己
      if (user.username === currentUserId) {
        return false;
      }

      // 排除已是好友
      if (friends.includes(user.username)) {
        return false;
      }

      // 排除黑名单
      if (blocklist.includes(user.username)) {
        return false;
      }

      // 匹配用户名或昵称
      return user.username.toLowerCase().includes(lowerQuery) ||
        (user.nickname && user.nickname.toLowerCase().includes(lowerQuery));
    });
  }

  /**
   * 获取所有用户列表（从localStorage）
   * @returns {Array} 用户列表
   */
  getAllUsers() {
    const users = [];
    const keys = Object.keys(localStorage);

    keys.forEach(key => {
      // 匹配格式: lifeflow_用户名_profile
      if (key.startsWith('lifeflow_') && key.endsWith('_profile')) {
        try {
          const profile = JSON.parse(localStorage.getItem(key));
          if (profile && profile.username) {
            users.push({
              username: profile.username,
              nickname: profile.nickname || profile.username,
              avatar: profile.avatar || '',
              createdAt: profile.createdAt
            });
          }
        } catch (error) {
          console.error('Error parsing profile:', key, error);
        }
      }
    });

    return users;
  }

  /**
   * 获取好友统计信息
   * @param {string} userId - 用户ID
   * @returns {Object} 统计信息
   */
  getFriendStats(userId) {
    const friends = this.getFriends(userId);
    const pendingRequests = this.getPendingRequests(userId);
    const sentRequests = this.getSentRequests(userId);
    const blocklist = this.getBlocklist(userId);

    return {
      friendCount: friends.length,
      pendingRequestCount: pendingRequests.length,
      sentRequestCount: sentRequests.length,
      blocklistCount: blocklist.length
    };
  }

  /**
   * 触发好友添加事件
   * @param {string} userId1 - 用户1 ID
   * @param {string} userId2 - 用户2 ID
   */
  notifyFriendAdded(userId1, userId2) {
    window.dispatchEvent(new CustomEvent('friend:added', {
      detail: { userId1, userId2 }
    }));
  }

  /**
   * 触发好友删除事件
   * @param {string} userId - 用户ID
   * @param {string} friendId - 好友ID
   */
  notifyFriendRemoved(userId, friendId) {
    window.dispatchEvent(new CustomEvent('friend:removed', {
      detail: { userId, friendId }
    }));
  }

  /**
   * 触发用户屏蔽事件
   * @param {string} userId - 用户ID
   * @param {string} blockedUserId - 被屏蔽的用户ID
   */
  notifyUserBlocked(userId, blockedUserId) {
    window.dispatchEvent(new CustomEvent('user:blocked', {
      detail: { userId, blockedUserId }
    }));
  }

  /**
   * 触发用户解除屏蔽事件
   * @param {string} userId - 用户ID
   * @param {string} unblockedUserId - 解除屏蔽的用户ID
   */
  notifyUserUnblocked(userId, unblockedUserId) {
    window.dispatchEvent(new CustomEvent('user:unblocked', {
      detail: { userId, unblockedUserId }
    }));
  }

  /**
   * 清理旧的好友请求（超过指定天数）
   * @param {number} days - 天数
   * @returns {number} 清理的请求数量
   */
  cleanOldRequests(days = 30) {
    const requests = this.storage.load(this.friendRequestsKey) || [];
    const cutoffTime = Date.now() - (days * 24 * 60 * 60 * 1000);

    const filtered = requests.filter(r => 
      r.status === 'pending' || r.createdAt > cutoffTime
    );

    const removedCount = requests.length - filtered.length;

    if (removedCount > 0) {
      this.storage.save(this.friendRequestsKey, filtered);
    }

    return removedCount;
  }

  /**
   * 导出好友数据
   * @param {string} userId - 用户ID
   * @returns {Object} 好友数据
   */
  exportFriendData(userId) {
    return {
      friends: this.getFriendsWithDetails(userId),
      pendingRequests: this.getPendingRequests(userId),
      sentRequests: this.getSentRequests(userId),
      blocklist: this.getBlocklist(userId),
      stats: this.getFriendStats(userId),
      exportDate: new Date().toISOString()
    };
  }
}

// Export for CommonJS and global scope
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FriendService;
}
