/**
 * Post - 社交动态模型
 */
class Post {
  constructor(data = {}) {
    this.id = data.id || `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.authorId = data.authorId || '';
    this.content = data.content || '';
    this.images = data.images || [];         // Base64图片数组
    this.type = data.type || 'normal';       // normal, achievement
    this.achievementId = data.achievementId || null;
    this.tags = data.tags || [];             // 标签数组
    this.visibility = data.visibility || 'public'; // public, friends, private
    this.likes = data.likes || [];           // 点赞用户ID数组
    this.comments = data.comments || [];     // 评论数组
    this.createdAt = data.createdAt || Date.now();
  }
  
  addLike(userId) {
    if (!this.likes.includes(userId)) {
      this.likes.push(userId);
      return true;
    }
    return false;
  }
  
  removeLike(userId) {
    const index = this.likes.indexOf(userId);
    if (index > -1) {
      this.likes.splice(index, 1);
      return true;
    }
    return false;
  }
  
  hasLiked(userId) {
    return this.likes.includes(userId);
  }
  
  addComment(comment) {
    this.comments.push(comment);
  }
  
  removeComment(commentId) {
    this.comments = this.comments.filter(c => c.id !== commentId);
  }
  
  toJSON() {
    return {
      id: this.id,
      authorId: this.authorId,
      content: this.content,
      images: this.images,
      type: this.type,
      achievementId: this.achievementId,
      tags: this.tags,
      visibility: this.visibility,
      likes: this.likes,
      comments: this.comments,
      createdAt: this.createdAt
    };
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Post;
}
