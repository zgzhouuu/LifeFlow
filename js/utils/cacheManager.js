/**
 * CacheManager - 缓存管理器
 * 用于缓存好友列表、用户头像等数据，提升性能
 */
class CacheManager {
  constructor() {
    this.cache = new Map();
    this.expiryTimes = new Map();
    this.defaultTTL = 5 * 60 * 1000; // 默认5分钟过期
  }
  
  /**
   * 设置缓存
   * @param {string} key - 缓存键
   * @param {any} value - 缓存值
   * @param {number} ttl - 过期时间（毫秒），默认5分钟
   */
  set(key, value, ttl = this.defaultTTL) {
    this.cache.set(key, value);
    this.expiryTimes.set(key, Date.now() + ttl);
  }
  
  /**
   * 获取缓存
   * @param {string} key - 缓存键
   * @returns {any} 缓存值，如果不存在或已过期返回null
   */
  get(key) {
    if (!this.cache.has(key)) {
      return null;
    }
    
    const expiryTime = this.expiryTimes.get(key);
    if (expiryTime && Date.now() > expiryTime) {
      // 缓存已过期
      this.delete(key);
      return null;
    }
    
    return this.cache.get(key);
  }
  
  /**
   * 检查缓存是否存在且未过期
   * @param {string} key - 缓存键
   * @returns {boolean} 是否存在
   */
  has(key) {
    return this.get(key) !== null;
  }
  
  /**
   * 删除缓存
   * @param {string} key - 缓存键
   */
  delete(key) {
    this.cache.delete(key);
    this.expiryTimes.delete(key);
  }
  
  /**
   * 清空所有缓存
   */
  clear() {
    this.cache.clear();
    this.expiryTimes.clear();
  }
  
  /**
   * 清理过期缓存
   */
  cleanup() {
    const now = Date.now();
    for (const [key, expiryTime] of this.expiryTimes.entries()) {
      if (now > expiryTime) {
        this.delete(key);
      }
    }
  }
  
  /**
   * 获取缓存大小
   * @returns {number} 缓存项数量
   */
  size() {
    return this.cache.size;
  }
  
  /**
   * 获取所有缓存键
   * @returns {Array<string>} 缓存键数组
   */
  keys() {
    return Array.from(this.cache.keys());
  }
}

/**
 * AvatarCache - 头像缓存管理器
 * 专门用于缓存用户头像，避免重复加载
 */
class AvatarCache extends CacheManager {
  constructor() {
    super();
    this.defaultTTL = 30 * 60 * 1000; // 头像缓存30分钟
  }
  
  /**
   * 获取用户头像
   * @param {string} userId - 用户ID
   * @param {Function} loadFn - 加载函数，当缓存不存在时调用
   * @returns {Promise<string>} 头像URL或Base64
   */
  async getAvatar(userId, loadFn) {
    const cached = this.get(`avatar_${userId}`);
    if (cached) {
      return cached;
    }
    
    // 缓存不存在，加载头像
    const avatar = await loadFn(userId);
    this.set(`avatar_${userId}`, avatar);
    return avatar;
  }
  
  /**
   * 设置用户头像
   * @param {string} userId - 用户ID
   * @param {string} avatar - 头像URL或Base64
   */
  setAvatar(userId, avatar) {
    this.set(`avatar_${userId}`, avatar);
  }
  
  /**
   * 删除用户头像缓存
   * @param {string} userId - 用户ID
   */
  deleteAvatar(userId) {
    this.delete(`avatar_${userId}`);
  }
  
  /**
   * 预加载多个用户头像
   * @param {Array<string>} userIds - 用户ID数组
   * @param {Function} loadFn - 加载函数
   */
  async preloadAvatars(userIds, loadFn) {
    const promises = userIds.map(userId => 
      this.getAvatar(userId, loadFn).catch(err => {
        console.warn(`Failed to preload avatar for ${userId}:`, err);
        return null;
      })
    );
    await Promise.all(promises);
  }
}

/**
 * FriendListCache - 好友列表缓存管理器
 * 专门用于缓存好友列表数据
 */
class FriendListCache extends CacheManager {
  constructor() {
    super();
    this.defaultTTL = 10 * 60 * 1000; // 好友列表缓存10分钟
  }
  
  /**
   * 获取好友列表
   * @param {string} userId - 用户ID
   * @param {Function} loadFn - 加载函数
   * @returns {Promise<Array>} 好友列表
   */
  async getFriendList(userId, loadFn) {
    const cached = this.get(`friends_${userId}`);
    if (cached) {
      return cached;
    }
    
    // 缓存不存在，加载好友列表
    const friends = await loadFn(userId);
    this.set(`friends_${userId}`, friends);
    return friends;
  }
  
  /**
   * 更新好友列表缓存
   * @param {string} userId - 用户ID
   * @param {Array} friends - 好友列表
   */
  updateFriendList(userId, friends) {
    this.set(`friends_${userId}`, friends);
  }
  
  /**
   * 使好友列表缓存失效
   * @param {string} userId - 用户ID
   */
  invalidateFriendList(userId) {
    this.delete(`friends_${userId}`);
  }
}

/**
 * PostCache - 动态缓存管理器
 * 用于缓存动态数据，减少重复加载
 */
class PostCache extends CacheManager {
  constructor() {
    super();
    this.defaultTTL = 2 * 60 * 1000; // 动态缓存2分钟
  }
  
  /**
   * 获取动态列表
   * @param {string} key - 缓存键（如'all', 'user_123', 'tag_运动'）
   * @param {Function} loadFn - 加载函数
   * @returns {Promise<Array>} 动态列表
   */
  async getPosts(key, loadFn) {
    const cached = this.get(`posts_${key}`);
    if (cached) {
      return cached;
    }
    
    // 缓存不存在，加载动态
    const posts = await loadFn();
    this.set(`posts_${key}`, posts);
    return posts;
  }
  
  /**
   * 更新动态列表缓存
   * @param {string} key - 缓存键
   * @param {Array} posts - 动态列表
   */
  updatePosts(key, posts) {
    this.set(`posts_${key}`, posts);
  }
  
  /**
   * 使所有动态缓存失效
   */
  invalidateAll() {
    const postKeys = this.keys().filter(key => key.startsWith('posts_'));
    postKeys.forEach(key => this.delete(key));
  }
}

// 创建全局实例
window.avatarCache = new AvatarCache();
window.friendListCache = new FriendListCache();
window.postCache = new PostCache();

// 定期清理过期缓存（每5分钟）
setInterval(() => {
  window.avatarCache?.cleanup();
  window.friendListCache?.cleanup();
  window.postCache?.cleanup();
}, 5 * 60 * 1000);

// Export for ES6 modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    CacheManager,
    AvatarCache,
    FriendListCache,
    PostCache
  };
}
