/**
 * Friend - 好友关系模型
 */
class Friend {
  constructor(data = {}) {
    this.userId = data.userId || '';
    this.friendId = data.friendId || '';
    this.status = data.status || 'pending';  // pending, accepted, blocked
    this.createdAt = data.createdAt || Date.now();
    this.acceptedAt = data.acceptedAt || null;
  }
  
  accept() {
    this.status = 'accepted';
    this.acceptedAt = Date.now();
  }
  
  block() {
    this.status = 'blocked';
  }
  
  toJSON() {
    return {
      userId: this.userId,
      friendId: this.friendId,
      status: this.status,
      createdAt: this.createdAt,
      acceptedAt: this.acceptedAt
    };
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Friend;
}
