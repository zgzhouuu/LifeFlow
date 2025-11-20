/**
 * SocialService - 社交动态管理服务
 * Handles post creation, likes, comments, and social interactions
 */

class SocialService {
  constructor(storageManager) {
    this.storage = storageManager;
    this.postsKey = 'lifeflow_social_posts';
    this.reportsKey = 'lifeflow_social_reports';
  }

  /**
   * 创建动态
   * @param {string} authorId - 作者用户ID
   * @param {Object} postData - 动态数据
   * @returns {Object} 创建的动态对象
   */
  createPost(authorId, postData) {
    if (!authorId) {
      throw new Error('作者ID不能为空');
    }

    // 验证内容
    if (!postData.content && (!postData.images || postData.images.length === 0)) {
      throw new Error('动态内容不能为空');
    }

    if (postData.content && postData.content.length > 500) {
      throw new Error('动态内容不能超过500字符');
    }

    if (postData.images && postData.images.length > 9) {
      throw new Error('图片数量不能超过9张');
    }

    // 创建动态对象
    const post = {
      id: `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      authorId: authorId,
      content: postData.content || '',
      images: postData.images || [],
      type: postData.type || 'normal', // normal, achievement
      achievementId: postData.achievementId || null,
      tags: postData.tags || [],
      visibility: postData.visibility || 'public', // public, friends, private
      likes: [],
      comments: [],
      createdAt: Date.now()
    };

    // 获取所有动态
    const posts = this.getAllPosts();
    
    // 添加到列表开头
    posts.unshift(post);
    
    // 保存
    this.storage.save(this.postsKey, posts);
    
    // 触发事件
    this.notifyPostCreated(post);
    
    return post;
  }

  /**
   * 获取所有动态
   * @returns {Array} 动态列表
   */
  getAllPosts() {
    return this.storage.load(this.postsKey) || [];
  }

  /**
   * 根据ID获取动态
   * @param {string} postId - 动态ID
   * @returns {Object|null} 动态对象
   */
  getPostById(postId) {
    const posts = this.getAllPosts();
    return posts.find(p => p.id === postId) || null;
  }

  /**
   * 获取用户的动态
   * @param {string} userId - 用户ID
   * @returns {Array} 动态列表
   */
  getPostsByUser(userId) {
    return this.getAllPosts().filter(p => p.authorId === userId);
  }

  /**
   * 根据标签获取动态
   * @param {string} tag - 标签
   * @returns {Array} 动态列表
   */
  getPostsByTag(tag) {
    return this.getAllPosts().filter(p => p.tags.includes(tag));
  }

  /**
   * 获取可见的动态（根据隐私设置和好友关系）
   * @param {string} currentUserId - 当前用户ID
   * @param {Array} friendIds - 好友ID列表
   * @param {Array} blockedUserIds - 黑名单用户ID列表
   * @returns {Array} 可见的动态列表
   */
  getVisiblePosts(currentUserId, friendIds = [], blockedUserIds = []) {
    return this.getAllPosts().filter(post => {
      // 过滤黑名单用户的动态
      if (blockedUserIds.includes(post.authorId)) {
        return false;
      }

      // 检查可见性
      if (post.visibility === 'public') {
        return true;
      }
      
      if (post.visibility === 'private') {
        return post.authorId === currentUserId;
      }
      
      if (post.visibility === 'friends') {
        return post.authorId === currentUserId || friendIds.includes(post.authorId);
      }
      
      return false;
    });
  }

  /**
   * 点赞动态
   * @param {string} postId - 动态ID
   * @param {string} userId - 用户ID
   * @returns {boolean} 是否成功
   */
  likePost(postId, userId) {
    const posts = this.getAllPosts();
    const post = posts.find(p => p.id === postId);
    
    if (!post) {
      return false;
    }

    // 检查是否已点赞
    if (post.likes.includes(userId)) {
      return false;
    }

    // 添加点赞
    post.likes.push(userId);
    
    // 保存
    this.storage.save(this.postsKey, posts);
    
    // 发送通知（如果不是自己点赞自己）
    if (post.authorId !== userId) {
      this.notifyLike(post, userId);
    }
    
    return true;
  }

  /**
   * 取消点赞
   * @param {string} postId - 动态ID
   * @param {string} userId - 用户ID
   * @returns {boolean} 是否成功
   */
  unlikePost(postId, userId) {
    const posts = this.getAllPosts();
    const post = posts.find(p => p.id === postId);
    
    if (!post) {
      return false;
    }

    // 查找点赞索引
    const index = post.likes.indexOf(userId);
    
    if (index === -1) {
      return false;
    }

    // 移除点赞
    post.likes.splice(index, 1);
    
    // 保存
    this.storage.save(this.postsKey, posts);
    
    return true;
  }

  /**
   * 添加评论
   * @param {string} postId - 动态ID
   * @param {string} authorId - 评论者ID
   * @param {string} content - 评论内容
   * @returns {Object|null} 创建的评论对象
   */
  addComment(postId, authorId, content) {
    // 支持两种调用方式：addComment(postId, authorId, content) 或 addComment(postId, {authorId, content})
    let commentData;
    if (typeof authorId === 'object') {
      commentData = authorId;
    } else {
      commentData = { authorId, content };
    }

    if (!commentData.content || commentData.content.trim().length === 0) {
      throw new Error('评论内容不能为空');
    }

    if (commentData.content.length > 200) {
      throw new Error('评论内容不能超过200字符');
    }

    const posts = this.getAllPosts();
    const post = posts.find(p => p.id === postId);
    
    if (!post) {
      throw new Error('动态不存在');
    }

    // 创建评论对象
    const comment = {
      id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      postId: postId,
      authorId: commentData.authorId,
      content: commentData.content.trim(),
      createdAt: Date.now()
    };

    // 添加评论
    post.comments.push(comment);
    
    // 保存
    this.storage.save(this.postsKey, posts);
    
    // 触发评论创建事件
    window.dispatchEvent(new CustomEvent('comment:created', {
      detail: { postId, comment }
    }));
    
    // 发送通知（如果不是自己评论自己）
    if (post.authorId !== commentData.authorId) {
      this.notifyComment(post, comment);
    }
    
    return comment;
  }

  /**
   * 删除评论
   * @param {string} postId - 动态ID
   * @param {string} commentId - 评论ID
   * @param {string} userId - 用户ID（只能删除自己的评论）
   * @returns {boolean} 是否成功
   */
  deleteComment(postId, commentId, userId) {
    const posts = this.getAllPosts();
    const post = posts.find(p => p.id === postId);
    
    if (!post) {
      return false;
    }

    // 查找评论
    const commentIndex = post.comments.findIndex(c => c.id === commentId);
    
    if (commentIndex === -1) {
      return false;
    }

    // 检查权限（只能删除自己的评论或自己动态下的评论）
    const comment = post.comments[commentIndex];
    if (comment.authorId !== userId && post.authorId !== userId) {
      return false;
    }

    // 删除评论
    post.comments.splice(commentIndex, 1);
    
    // 保存
    this.storage.save(this.postsKey, posts);
    
    return true;
  }

  /**
   * 删除动态
   * @param {string} postId - 动态ID
   * @param {string} userId - 用户ID（只能删除自己的动态）
   * @returns {boolean} 是否成功
   */
  deletePost(postId, userId) {
    const posts = this.getAllPosts();
    const index = posts.findIndex(p => p.id === postId && p.authorId === userId);
    
    if (index === -1) {
      return false;
    }

    // 删除动态
    posts.splice(index, 1);
    
    // 保存
    this.storage.save(this.postsKey, posts);
    
    // 触发事件
    this.notifyPostDeleted(postId);
    
    return true;
  }

  /**
   * 举报动态
   * @param {string} postId - 动态ID
   * @param {string} userId - 举报者ID
   * @param {string} reason - 举报原因
   */
  reportPost(postId, userId, reason) {
    const reports = this.storage.load(this.reportsKey) || [];
    
    reports.push({
      id: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      postId: postId,
      reporterId: userId,
      reason: reason,
      timestamp: Date.now()
    });
    
    this.storage.save(this.reportsKey, reports);
  }

  /**
   * 获取动态的评论列表
   * @param {string} postId - 动态ID
   * @returns {Array} 评论列表
   */
  getComments(postId) {
    const post = this.getPostById(postId);
    return post ? post.comments : [];
  }

  /**
   * 检查用户是否点赞了动态
   * @param {string} postId - 动态ID
   * @param {string} userId - 用户ID
   * @returns {boolean} 是否已点赞
   */
  hasLiked(postId, userId) {
    const post = this.getPostById(postId);
    return post ? post.likes.includes(userId) : false;
  }

  /**
   * 获取动态统计信息
   * @param {string} postId - 动态ID
   * @returns {Object} 统计信息
   */
  getPostStats(postId) {
    const post = this.getPostById(postId);
    
    if (!post) {
      return null;
    }

    return {
      likes: post.likes.length,
      comments: post.comments.length,
      hasImages: post.images.length > 0,
      imageCount: post.images.length,
      tags: post.tags.length
    };
  }

  /**
   * 触发动态创建事件
   * @param {Object} post - 动态对象
   */
  notifyPostCreated(post) {
    window.dispatchEvent(new CustomEvent('post:created', {
      detail: { post }
    }));
  }

  /**
   * 触发动态删除事件
   * @param {string} postId - 动态ID
   */
  notifyPostDeleted(postId) {
    window.dispatchEvent(new CustomEvent('post:deleted', {
      detail: { postId }
    }));
  }

  /**
   * 触发点赞通知
   * @param {Object} post - 动态对象
   * @param {string} userId - 点赞用户ID
   */
  notifyLike(post, userId) {
    // 使用通知服务发送通知
    if (window.notificationService) {
      window.notificationService.sendLikeNotification(post.authorId, userId, post.id);
    }
  }

  /**
   * 触发评论通知
   * @param {Object} post - 动态对象
   * @param {Object} comment - 评论对象
   */
  notifyComment(post, comment) {
    // 使用通知服务发送通知
    if (window.notificationService) {
      window.notificationService.sendCommentNotification(
        post.authorId,
        comment.authorId,
        post.id,
        comment.id
      );
    }
  }

  /**
   * 清理旧动态（超过指定天数）
   * @param {number} days - 天数
   * @returns {number} 清理的动态数量
   */
  cleanOldPosts(days = 90) {
    const posts = this.getAllPosts();
    const cutoffTime = Date.now() - (days * 24 * 60 * 60 * 1000);
    
    const filtered = posts.filter(p => p.createdAt > cutoffTime);
    const removedCount = posts.length - filtered.length;
    
    if (removedCount > 0) {
      this.storage.save(this.postsKey, filtered);
    }
    
    return removedCount;
  }

  /**
   * 获取用户的动态（别名方法，兼容性）
   * @param {string} userId - 用户ID
   * @returns {Array} 动态列表
   */
  getUserPosts(userId) {
    return this.getPostsByUser(userId);
  }

  /**
   * 导出动态数据
   * @param {string} userId - 用户ID（可选，导出特定用户的动态）
   * @returns {Object} 动态数据
   */
  exportPosts(userId = null) {
    const posts = userId ? this.getPostsByUser(userId) : this.getAllPosts();
    
    return {
      posts,
      count: posts.length,
      exportDate: new Date().toISOString()
    };
  }
}

// Export for CommonJS and global scope
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SocialService;
}
