/**
 * ChallengeService - 打卡挑战管理服务
 * Handles challenge creation, participation, progress tracking, and completion
 */

class ChallengeService {
  constructor(storageManager) {
    this.storage = storageManager;
    this.challengesKey = 'challenges';
  }

  /**
   * 创建挑战
   * @param {string} creatorId - 创建者用户ID
   * @param {Object} challengeData - 挑战数据
   * @returns {Object} 创建的挑战对象
   */
  createChallenge(creatorId, challengeData) {
    if (!creatorId) {
      throw new Error('创建者ID不能为空');
    }

    // 验证数据
    if (!challengeData.type || !['exercise', 'learning'].includes(challengeData.type)) {
      throw new Error('挑战类型必须是 exercise 或 learning');
    }

    if (!challengeData.targetMinutes || challengeData.targetMinutes <= 0) {
      throw new Error('目标时长必须大于0');
    }

    if (!challengeData.durationDays || challengeData.durationDays < 1 || challengeData.durationDays > 30) {
      throw new Error('挑战天数必须在1-30天之间');
    }

    // 创建挑战对象
    const challenge = {
      id: `challenge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      creatorId: creatorId,
      type: challengeData.type,
      targetMinutes: challengeData.targetMinutes,
      durationDays: challengeData.durationDays,
      participants: [creatorId], // 创建者自动参与
      invitedFriends: challengeData.invitedFriends || [],
      progress: {
        [creatorId]: {}
      },
      startDate: new Date().toISOString().split('T')[0],
      endDate: this.calculateEndDate(new Date().toISOString().split('T')[0], challengeData.durationDays),
      status: 'active',
      createdAt: Date.now()
    };

    // 获取所有挑战
    const challenges = this.getAllChallenges();
    
    // 添加到列表
    challenges.push(challenge);
    
    // 保存
    this.storage.save(this.challengesKey, challenges);
    
    // 发送邀请通知
    if (challengeData.invitedFriends && challengeData.invitedFriends.length > 0) {
      this.sendInvitations(challenge);
    }
    
    // 触发事件
    this.notifyChallengeCreated(challenge);
    
    return challenge;
  }

  /**
   * 计算结束日期
   * @param {string} startDate - 开始日期
   * @param {number} durationDays - 持续天数
   * @returns {string} 结束日期
   */
  calculateEndDate(startDate, durationDays) {
    const start = new Date(startDate);
    start.setDate(start.getDate() + durationDays);
    return start.toISOString().split('T')[0];
  }

  /**
   * 发送挑战邀请
   * @param {Object} challenge - 挑战对象
   */
  sendInvitations(challenge) {
    if (!window.notificationService) {
      console.warn('NotificationService not available');
      return;
    }

    challenge.invitedFriends.forEach(friendId => {
      window.notificationService.sendChallengeInviteNotification(
        friendId,
        challenge.creatorId,
        challenge.id,
        challenge.type
      );
    });
  }

  /**
   * 获取所有挑战
   * @returns {Array} 挑战列表
   */
  getAllChallenges() {
    return this.storage.load(this.challengesKey) || [];
  }

  /**
   * 根据ID获取挑战
   * @param {string} challengeId - 挑战ID
   * @returns {Object|null} 挑战对象
   */
  getChallengeById(challengeId) {
    const challenges = this.getAllChallenges();
    return challenges.find(c => c.id === challengeId) || null;
  }

  /**
   * 获取用户创建的挑战
   * @param {string} userId - 用户ID
   * @returns {Array} 挑战列表
   */
  getChallengesByCreator(userId) {
    return this.getAllChallenges().filter(c => c.creatorId === userId);
  }

  /**
   * 获取用户参与的挑战
   * @param {string} userId - 用户ID
   * @returns {Array} 挑战列表
   */
  getChallengesByParticipant(userId) {
    return this.getAllChallenges().filter(c => c.participants.includes(userId));
  }

  /**
   * 获取用户的活跃挑战
   * @param {string} userId - 用户ID
   * @returns {Array} 活跃挑战列表
   */
  getActiveChallenges(userId) {
    return this.getChallengesByParticipant(userId).filter(c => c.status === 'active');
  }

  /**
   * 获取用户收到的挑战邀请
   * @param {string} userId - 用户ID
   * @returns {Array} 邀请列表
   */
  getChallengeInvitations(userId) {
    return this.getAllChallenges().filter(c => 
      c.invitedFriends.includes(userId) && 
      !c.participants.includes(userId) &&
      c.status === 'active'
    );
  }

  /**
   * 接受挑战邀请
   * @param {string} challengeId - 挑战ID
   * @param {string} userId - 用户ID
   * @returns {boolean} 是否成功
   */
  acceptChallenge(challengeId, userId) {
    const challenges = this.getAllChallenges();
    const challenge = challenges.find(c => c.id === challengeId);
    
    if (!challenge) {
      return false;
    }

    // 检查是否已经参与
    if (challenge.participants.includes(userId)) {
      return false;
    }

    // 检查是否被邀请
    if (!challenge.invitedFriends.includes(userId)) {
      return false;
    }

    // 添加参与者
    challenge.participants.push(userId);
    challenge.progress[userId] = {};
    
    // 保存
    this.storage.save(this.challengesKey, challenges);
    
    // 通知创建者
    if (window.notificationService && challenge.creatorId !== userId) {
      window.notificationService.send(challenge.creatorId, {
        type: 'challenge_accepted',
        fromUserId: userId,
        message: '接受了你的挑战邀请',
        data: { challengeId: challenge.id }
      });
    }
    
    // 触发事件
    this.notifyChallengeUpdated(challenge);
    
    return true;
  }

  /**
   * 拒绝挑战邀请
   * @param {string} challengeId - 挑战ID
   * @param {string} userId - 用户ID
   * @returns {boolean} 是否成功
   */
  declineChallenge(challengeId, userId) {
    const challenges = this.getAllChallenges();
    const challenge = challenges.find(c => c.id === challengeId);
    
    if (!challenge) {
      return false;
    }

    // 从邀请列表中移除
    const index = challenge.invitedFriends.indexOf(userId);
    if (index > -1) {
      challenge.invitedFriends.splice(index, 1);
      this.storage.save(this.challengesKey, challenges);
      return true;
    }
    
    return false;
  }

  /**
   * 更新挑战进度
   * @param {string} challengeId - 挑战ID
   * @param {string} userId - 用户ID
   * @param {string} date - 日期 (YYYY-MM-DD)
   * @param {number} minutes - 完成分钟数
   * @returns {boolean} 是否成功
   */
  updateProgress(challengeId, userId, date, minutes) {
    const challenges = this.getAllChallenges();
    const challenge = challenges.find(c => c.id === challengeId);
    
    if (!challenge) {
      return false;
    }

    // 检查是否是参与者
    if (!challenge.participants.includes(userId)) {
      return false;
    }

    // 检查日期是否在挑战期间
    if (date < challenge.startDate || date > challenge.endDate) {
      return false;
    }

    // 初始化用户进度
    if (!challenge.progress[userId]) {
      challenge.progress[userId] = {};
    }

    // 更新进度
    challenge.progress[userId][date] = minutes;
    
    // 保存
    this.storage.save(this.challengesKey, challenges);
    
    // 触发事件
    this.notifyChallengeUpdated(challenge);
    
    return true;
  }

  /**
   * 自动同步用户活动数据到挑战进度
   * @param {string} userId - 用户ID
   * @param {string} date - 日期
   * @param {string} type - 类型 (exercise/learning)
   * @param {number} minutes - 分钟数
   */
  syncActivityToChallenge(userId, date, type, minutes) {
    const activeChallenges = this.getActiveChallenges(userId);
    
    activeChallenges.forEach(challenge => {
      if (challenge.type === type) {
        this.updateProgress(challenge.id, userId, date, minutes);
      }
    });
  }

  /**
   * 获取挑战排行榜
   * @param {string} challengeId - 挑战ID
   * @returns {Array} 排行榜数据
   */
  getLeaderboard(challengeId) {
    const challenge = this.getChallengeById(challengeId);
    
    if (!challenge) {
      return [];
    }

    return challenge.participants.map(userId => {
      const userProgress = challenge.progress[userId] || {};
      const totalMinutes = Object.values(userProgress).reduce((sum, m) => sum + m, 0);
      const daysCompleted = Object.keys(userProgress).length;
      const targetTotal = challenge.targetMinutes * challenge.durationDays;
      const completionRate = targetTotal > 0 ? (totalMinutes / targetTotal) * 100 : 0;
      
      return {
        userId,
        totalMinutes,
        daysCompleted,
        completionRate: Math.min(completionRate, 100),
        avgMinutesPerDay: daysCompleted > 0 ? totalMinutes / daysCompleted : 0
      };
    }).sort((a, b) => b.completionRate - a.completionRate);
  }

  /**
   * 检查并完成过期的挑战
   */
  checkAndCompleteExpiredChallenges() {
    const challenges = this.getAllChallenges();
    const today = new Date().toISOString().split('T')[0];
    let updated = false;

    challenges.forEach(challenge => {
      if (challenge.status === 'active' && challenge.endDate < today) {
        challenge.status = 'completed';
        updated = true;
        
        // 发送完成通知
        this.sendCompletionNotifications(challenge);
      }
    });

    if (updated) {
      this.storage.save(this.challengesKey, challenges);
    }
  }

  /**
   * 发送挑战完成通知
   * @param {Object} challenge - 挑战对象
   */
  sendCompletionNotifications(challenge) {
    if (!window.notificationService) {
      return;
    }

    const leaderboard = this.getLeaderboard(challenge.id);
    const winner = leaderboard[0];

    challenge.participants.forEach(userId => {
      const userRank = leaderboard.findIndex(r => r.userId === userId) + 1;
      const userStats = leaderboard.find(r => r.userId === userId);
      
      let message = `挑战已完成！你排名第${userRank}，完成率${userStats.completionRate.toFixed(1)}%`;
      
      if (userRank === 1 && challenge.participants.length > 1) {
        message = `🏆 恭喜！你获得了挑战冠军！完成率${userStats.completionRate.toFixed(1)}%`;
        
        // 颁发徽章
        this.awardChampionBadge(userId, challenge);
      }

      window.notificationService.sendChallengeCompleteNotification(
        userId,
        challenge.id,
        message
      );
    });
  }

  /**
   * 颁发挑战冠军徽章
   * @param {string} userId - 用户ID
   * @param {Object} challenge - 挑战对象
   */
  awardChampionBadge(userId, challenge) {
    // 这里可以集成成就系统
    if (window.achievementManager) {
      const badgeType = challenge.type === 'exercise' ? 'exercise_champion' : 'learning_champion';
      window.achievementManager.unlockAchievement(userId, badgeType);
    }
  }

  /**
   * 获取挑战统计信息
   * @param {string} challengeId - 挑战ID
   * @returns {Object} 统计信息
   */
  getChallengeStats(challengeId) {
    const challenge = this.getChallengeById(challengeId);
    
    if (!challenge) {
      return null;
    }

    const leaderboard = this.getLeaderboard(challengeId);
    const totalMinutes = leaderboard.reduce((sum, r) => sum + r.totalMinutes, 0);
    const avgCompletionRate = leaderboard.reduce((sum, r) => sum + r.completionRate, 0) / leaderboard.length;

    // 计算已过天数
    const today = new Date().toISOString().split('T')[0];
    const startDate = new Date(challenge.startDate);
    const currentDate = new Date(today);
    const daysPassed = Math.floor((currentDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
    const daysRemaining = Math.max(0, challenge.durationDays - daysPassed);

    return {
      participantCount: challenge.participants.length,
      totalMinutes,
      avgCompletionRate: avgCompletionRate || 0,
      daysPassed: Math.min(daysPassed, challenge.durationDays),
      daysRemaining,
      isCompleted: challenge.status === 'completed'
    };
  }

  /**
   * 删除挑战
   * @param {string} challengeId - 挑战ID
   * @param {string} userId - 用户ID（只能删除自己创建的挑战）
   * @returns {boolean} 是否成功
   */
  deleteChallenge(challengeId, userId) {
    const challenges = this.getAllChallenges();
    const index = challenges.findIndex(c => c.id === challengeId && c.creatorId === userId);
    
    if (index === -1) {
      return false;
    }

    challenges.splice(index, 1);
    this.storage.save(this.challengesKey, challenges);
    
    return true;
  }

  /**
   * 触发挑战创建事件
   * @param {Object} challenge - 挑战对象
   */
  notifyChallengeCreated(challenge) {
    window.dispatchEvent(new CustomEvent('challenge:created', {
      detail: { challenge }
    }));
  }

  /**
   * 触发挑战更新事件
   * @param {Object} challenge - 挑战对象
   */
  notifyChallengeUpdated(challenge) {
    window.dispatchEvent(new CustomEvent('challenge:updated', {
      detail: { challenge }
    }));
  }

  /**
   * 导出挑战数据
   * @param {string} userId - 用户ID（可选）
   * @returns {Object} 挑战数据
   */
  exportChallenges(userId = null) {
    const challenges = userId 
      ? this.getChallengesByParticipant(userId) 
      : this.getAllChallenges();
    
    return {
      challenges,
      count: challenges.length,
      exportDate: new Date().toISOString()
    };
  }
}

// Export for CommonJS and global scope
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ChallengeService;
}
