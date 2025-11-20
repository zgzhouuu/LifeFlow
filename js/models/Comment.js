/**
 * Comment - 评论模型
 */
class Comment {
  constructor(data = {}) {
    this.id = data.id || `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.postId = data.postId || '';
    this.authorId = data.authorId || '';
    this.content = data.content || '';
    this.createdAt = data.createdAt || Date.now();
  }
  
  toJSON() {
    return {
      id: this.id,
      postId: this.postId,
      authorId: this.authorId,
      content: this.content,
      createdAt: this.createdAt
    };
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Comment;
}
