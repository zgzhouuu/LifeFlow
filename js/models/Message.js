/**
 * Message - 聊天消息模型
 */
class Message {
  constructor(data = {}) {
    this.id = data.id || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.senderId = data.senderId || '';
    this.receiverId = data.receiverId || '';
    this.content = data.content || '';
    this.type = data.type || 'text';         // text, reminder
    this.read = data.read || false;
    this.createdAt = data.createdAt || Date.now();
  }
  
  markAsRead() {
    this.read = true;
  }
  
  toJSON() {
    return {
      id: this.id,
      senderId: this.senderId,
      receiverId: this.receiverId,
      content: this.content,
      type: this.type,
      read: this.read,
      createdAt: this.createdAt
    };
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Message;
}
