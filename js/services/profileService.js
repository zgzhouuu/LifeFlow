/**
 * ProfileService - 用户资料管理服务
 * Handles user profile management including avatar, nickname, and basic info
 */

class ProfileService {
  constructor(storageManager) {
    this.storage = storageManager;
    this.currentUser = null;
  }

  /**
   * 设置当前用户
   * @param {string} username - 用户名
   */
  setCurrentUser(username) {
    this.currentUser = username;
  }

  /**
   * 获取当前用户名
   * @returns {string|null} 当前用户名
   */
  getCurrentUser() {
    if (!this.currentUser) {
      // 尝试从localStorage获取当前用户
      this.currentUser = localStorage.getItem('lifeflow_current_user');
    }
    return this.currentUser;
  }

  /**
   * 获取用户资料
   * @param {string} username - 用户名（可选，默认当前用户）
   * @returns {Object|null} 用户资料对象
   */
  getProfile(username = null) {
    const user = username || this.getCurrentUser();
    if (!user) {
      console.warn('No user specified and no current user set');
      return null;
    }

    // 如果查询的是当前用户，使用loadData（会自动添加当前用户前缀）
    // 如果查询的是其他用户，直接从localStorage读取
    let profile;
    
    if (user === this.getCurrentUser()) {
      // 当前用户：使用storage的loadData方法
      profile = this.storage.loadData('profile');
    } else {
      // 其他用户：直接读取localStorage
      try {
        const profileKey = `lifeflow_${user}_profile`;
        const data = localStorage.getItem(profileKey);
        profile = data ? JSON.parse(data) : null;
      } catch (error) {
        console.error(`获取用户 ${user} 的资料失败:`, error);
        profile = null;
      }
    }
    
    // 返回默认资料如果不存在
    if (!profile) {
      return {
        username: user,
        nickname: user,
        avatar: '',
        bio: '',
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
    }

    return profile;
  }

  /**
   * 更新用户资料
   * @param {string} username - 用户名
   * @param {Object} data - 要更新的资料数据
   * @returns {Object} 更新后的资料
   * @throws {Error} 如果验证失败
   */
  updateProfile(username, data) {
    if (!username) {
      throw new Error('用户名不能为空');
    }

    // 验证昵称长度
    if (data.nickname && data.nickname.length > 20) {
      throw new Error('昵称不能超过20字符');
    }

    // 获取现有资料
    const existingProfile = this.getProfile(username);
    
    // 合并数据
    const updatedProfile = {
      ...existingProfile,
      ...data,
      username: username, // 确保用户名不被覆盖
      updatedAt: Date.now()
    };

    // 保存到storage
    const profileKey = `profile`;
    this.storage.saveData(profileKey, updatedProfile);

    // 触发更新事件
    this.notifyUpdate(username, updatedProfile);

    return updatedProfile;
  }

  /**
   * 上传并压缩头像
   * @param {string} username - 用户名
   * @param {File} file - 图片文件
   * @returns {Promise<string>} Base64编码的头像
   * @throws {Error} 如果文件类型或大小不符合要求
   */
  async uploadAvatar(username, file) {
    // 验证文件类型
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      throw new Error('只支持JPG和PNG格式的图片');
    }

    // 验证文件大小（5MB）
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new Error('图片大小不能超过5MB');
    }

    try {
      // 压缩图片 - 使用更激进的压缩以节省存储空间
      const base64 = await ImageCompressor.compress(file, { 
        maxSize: 150 * 1024, // 压缩到150KB以下
        quality: 0.6,
        maxWidth: 400,
        maxHeight: 400
      });

      // 检查存储空间
      if (this.storage.checkStorageSpace) {
        const spaceInfo = this.storage.checkStorageSpace();
        if (spaceInfo.critical) {
          throw new Error('存储空间不足，请清理浏览器缓存或删除一些旧数据后再试');
        }
      }

      // 更新资料
      this.updateProfile(username, { avatar: base64 });
      
      // 触发资料更新事件
      window.dispatchEvent(new CustomEvent('profile:updated', {
        detail: { username }
      }));

      return base64;
    } catch (error) {
      console.error('Avatar upload failed:', error);
      
      // 如果是存储空间错误，提供更友好的提示
      if (error.name === 'QuotaExceededError' || error.message.includes('存储空间')) {
        throw new Error('存储空间不足！请清理浏览器缓存：\n1. 按 Ctrl+Shift+Delete\n2. 选择"缓存的图片和文件"\n3. 点击"清除数据"');
      }
      
      throw new Error('头像上传失败：' + error.message);
    }
  }

  /**
   * 更新昵称
   * @param {string} username - 用户名
   * @param {string} nickname - 新昵称
   * @returns {Object} 更新后的资料
   */
  updateNickname(username, nickname) {
    if (!nickname || nickname.trim().length === 0) {
      throw new Error('昵称不能为空');
    }

    if (nickname.length < 1 || nickname.length > 20) {
      throw new Error('昵称长度必须在1-20字符之间');
    }

    const result = this.updateProfile(username, { nickname: nickname.trim() });
    
    // 触发资料更新事件
    window.dispatchEvent(new CustomEvent('profile:updated', {
      detail: { username }
    }));
    
    return result;
  }

  /**
   * 更新个人简介
   * @param {string} username - 用户名
   * @param {string} bio - 个人简介
   * @returns {Object} 更新后的资料
   */
  updateBio(username, bio) {
    if (bio && bio.length > 200) {
      throw new Error('个人简介不能超过200字符');
    }

    return this.updateProfile(username, { bio: bio || '' });
  }

  /**
   * 删除用户资料
   * @param {string} username - 用户名
   */
  deleteProfile(username) {
    const profileKey = `profile`;
    this.storage.saveData(profileKey, null);
    this.notifyUpdate(username, null);
  }

  /**
   * 检查用户是否存在
   * @param {string} username - 用户名
   * @returns {boolean} 用户是否存在
   */
  userExists(username) {
    const profile = this.getProfile(username);
    return profile !== null && profile.username === username;
  }

  /**
   * 获取所有用户列表
   * @returns {Array} 用户列表
   */
  getAllUsers() {
    const users = [];
    const keys = Object.keys(localStorage);
    
    keys.forEach(key => {
      if (key.endsWith('_profile')) {
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
   * 搜索用户
   * @param {string} query - 搜索关键词
   * @returns {Array} 匹配的用户列表
   */
  searchUsers(query) {
    if (!query || query.trim().length === 0) {
      return [];
    }

    const allUsers = this.getAllUsers();
    const lowerQuery = query.toLowerCase().trim();

    return allUsers.filter(user => 
      user.username.toLowerCase().includes(lowerQuery) ||
      (user.nickname && user.nickname.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * 触发资料更新事件
   * @param {string} username - 用户名
   * @param {Object} profile - 更新后的资料
   */
  notifyUpdate(username, profile) {
    window.dispatchEvent(new CustomEvent('profile:updated', {
      detail: { username, profile }
    }));
  }

  /**
   * 导出用户资料
   * @param {string} username - 用户名
   * @returns {Object} 用户资料数据
   */
  exportProfile(username) {
    const profile = this.getProfile(username);
    return {
      profile,
      exportDate: new Date().toISOString()
    };
  }

  /**
   * 导入用户资料
   * @param {string} username - 用户名
   * @param {Object} profileData - 要导入的资料数据
   */
  importProfile(username, profileData) {
    if (!profileData || !profileData.profile) {
      throw new Error('无效的资料数据');
    }

    const profile = {
      ...profileData.profile,
      username: username, // 确保使用当前用户名
      updatedAt: Date.now()
    };

    const profileKey = `profile`;
    this.storage.saveData(profileKey, profile);
    this.notifyUpdate(username, profile);
  }
}

// Export for CommonJS and global scope
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ProfileService;
}
