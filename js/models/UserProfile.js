/**
 * UserProfile Model
 * 用户资料数据模型
 */

class UserProfile {
    constructor(data = {}) {
        this.username = data.username || '';
        this.nickname = data.nickname || '';
        this.avatar = data.avatar || '';
        this.bio = data.bio || '';
        this.createdAt = data.createdAt || Date.now();
        this.updatedAt = data.updatedAt || Date.now();
    }

    /**
     * 验证用户资料数据
     * @returns {boolean} 验证是否通过
     * @throws {Error} 验证失败时抛出错误
     */
    validate() {
        if (!this.username) {
            throw new Error('用户名不能为空');
        }

        if (this.nickname && this.nickname.length > 20) {
            throw new Error('昵称不能超过20字符');
        }

        if (this.nickname && this.nickname.length < 1) {
            throw new Error('昵称不能为空');
        }

        return true;
    }

    /**
     * 转换为JSON对象
     * @returns {Object} JSON对象
     */
    toJSON() {
        return {
            username: this.username,
            nickname: this.nickname,
            avatar: this.avatar,
            bio: this.bio,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }

    /**
     * 从JSON对象创建UserProfile实例
     * @param {Object} json JSON对象
     * @returns {UserProfile} UserProfile实例
     */
    static fromJSON(json) {
        return new UserProfile(json);
    }
}

// 导出供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UserProfile;
}
