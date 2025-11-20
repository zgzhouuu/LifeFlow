/**
 * Leaderboard - 排行榜组件
 * Displays friend rankings for exercise and learning duration
 */

class Leaderboard {
  constructor(container, friendService, profileService) {
    this.container = typeof container === 'string' 
      ? document.getElementById(container) 
      : container;
    this.friendService = friendService;
    this.profileService = profileService;
    this.currentUserId = this.getCurrentUserId();
    this.currentView = 'week'; // 'week' or 'month'
    this.currentType = 'exercise'; // 'exercise' or 'learning'
    
    this.init();
  }

  /**
   * 获取当前用户ID
   * @returns {string} 用户ID
   */
  getCurrentUserId() {
    return localStorage.getItem('lifeflow_current_user') || 'user1';
  }

  /**
   * 初始化组件
   */
  init() {
    this.render();
    this.attachEventListeners();
    
    // 监听数据更新事件
    window.addEventListener('lifeflow:activity:updated', () => this.refresh());
    window.addEventListener('friend:added', () => this.refresh());
    window.addEventListener('friend:removed', () => this.refresh());
  }

  /**
   * 渲染组件
   */
  render() {
    if (!this.container) {
      console.error('Leaderboard container not found');
      return;
    }

    this.container.innerHTML = `
      <div class="leaderboard">
        <div class="leaderboard-header">
          <h3>🏆 好友排行榜</h3>
          <div class="leaderboard-controls">
            <div class="type-toggle">
              <button class="type-btn ${this.currentType === 'exercise' ? 'active' : ''}" data-type="exercise">
                💪 运动
              </button>
              <button class="type-btn ${this.currentType === 'learning' ? 'active' : ''}" data-type="learning">
                📚 学习
              </button>
            </div>
            <div class="view-toggle">
              <button class="view-btn ${this.currentView === 'week' ? 'active' : ''}" data-view="week">
                本周
              </button>
              <button class="view-btn ${this.currentView === 'month' ? 'active' : ''}" data-view="month">
                本月
              </button>
            </div>
          </div>
        </div>
        
        <div class="leaderboard-content">
          ${this.renderLeaderboardList()}
        </div>
      </div>
    `;
  }

  /**
   * 渲染排行榜列表
   * @returns {string} HTML
   */
  renderLeaderboardList() {
    const rankings = this.calculateRankings();
    
    if (rankings.length === 0) {
      return `
        <div class="empty-leaderboard">
          <div class="empty-icon">👥</div>
          <div class="empty-text">暂无排行数据</div>
          <div class="empty-hint">添加好友后即可查看排行榜</div>
        </div>
      `;
    }

    return `
      <div class="leaderboard-list">
        ${rankings.map((rank, index) => this.renderRankItem(rank, index)).join('')}
      </div>
    `;
  }

  /**
   * 渲染单个排名项
   * @param {Object} rank - 排名数据
   * @param {number} index - 索引
   * @returns {string} HTML
   */
  renderRankItem(rank, index) {
    const isCurrentUser = rank.userId === this.currentUserId;
    const rankNumber = index + 1;
    const medal = this.getMedal(rankNumber);
    
    return `
      <div class="rank-item ${isCurrentUser ? 'current-user' : ''}">
        <div class="rank-number ${rankNumber <= 3 ? 'top-three' : ''}">
          ${medal || rankNumber}
        </div>
        <div class="rank-avatar">
          ${rank.avatar 
            ? `<img src="${rank.avatar}" alt="${rank.nickname}">` 
            : `<div class="avatar-placeholder">${rank.nickname.charAt(0)}</div>`}
        </div>
        <div class="rank-info">
          <div class="rank-name">
            ${rank.nickname}${isCurrentUser ? ' (我)' : ''}
          </div>
          <div class="rank-stats">
            ${rank.totalMinutes} 分钟 · ${rank.daysActive} 天活跃
          </div>
        </div>
        <div class="rank-duration">
          <div class="duration-value">${this.formatDuration(rank.totalMinutes)}</div>
          <div class="duration-label">总时长</div>
        </div>
      </div>
    `;
  }

  /**
   * 获取奖牌图标
   * @param {number} rank - 排名
   * @returns {string|null} 奖牌图标
   */
  getMedal(rank) {
    const medals = {
      1: '🥇',
      2: '🥈',
      3: '🥉'
    };
    return medals[rank] || null;
  }

  /**
   * 格式化时长显示
   * @param {number} minutes - 分钟数
   * @returns {string} 格式化后的时长
   */
  formatDuration(minutes) {
    if (minutes < 60) {
      return `${minutes}分`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}小时${mins}分` : `${hours}小时`;
  }

  /**
   * 计算排行榜数据
   * @returns {Array} 排名列表
   */
  calculateRankings() {
    // 获取好友列表
    const friendIds = this.friendService 
      ? this.friendService.getFriends(this.currentUserId) 
      : [];
    
    // 包含当前用户
    const userIds = [this.currentUserId, ...friendIds];
    
    // 获取日期范围
    const { startDate, endDate } = this.getDateRange();
    
    // 计算每个用户的数据
    const rankings = userIds.map(userId => {
      const userData = this.getUserData(userId, startDate, endDate);
      const profile = this.profileService 
        ? this.profileService.getProfile(userId) 
        : null;
      
      return {
        userId,
        nickname: profile ? (profile.nickname || userId) : userId,
        avatar: profile ? profile.avatar : null,
        totalMinutes: userData.totalMinutes,
        daysActive: userData.daysActive
      };
    });

    // 按总时长降序排序
    rankings.sort((a, b) => {
      if (b.totalMinutes !== a.totalMinutes) {
        return b.totalMinutes - a.totalMinutes;
      }
      // 时长相同时按活跃天数排序
      return b.daysActive - a.daysActive;
    });

    return rankings;
  }

  /**
   * 获取日期范围
   * @returns {Object} {startDate, endDate}
   */
  getDateRange() {
    const today = new Date();
    const endDate = today.toISOString().split('T')[0];
    
    let startDate;
    if (this.currentView === 'week') {
      // 本周：从周一开始
      const dayOfWeek = today.getDay();
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const monday = new Date(today);
      monday.setDate(today.getDate() - daysToMonday);
      startDate = monday.toISOString().split('T')[0];
    } else {
      // 本月：从月初开始
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      startDate = firstDay.toISOString().split('T')[0];
    }
    
    return { startDate, endDate };
  }

  /**
   * 获取用户数据
   * @param {string} userId - 用户ID
   * @param {string} startDate - 开始日期
   * @param {string} endDate - 结束日期
   * @returns {Object} {totalMinutes, daysActive}
   */
  getUserData(userId, startDate, endDate) {
    // 创建用户特定的StorageManager
    const originalUser = localStorage.getItem('lifeflow_current_user');
    localStorage.setItem('lifeflow_current_user', userId);
    const storageManager = new StorageManager();
    
    // 加载活动数据
    const activities = storageManager.loadActivities(this.currentType);
    
    // 恢复原用户
    localStorage.setItem('lifeflow_current_user', originalUser);
    
    // 过滤日期范围内的已完成活动
    const filteredActivities = activities.filter(activity => 
      activity.completed && 
      activity.date >= startDate && 
      activity.date <= endDate
    );
    
    // 计算总时长
    const totalMinutes = filteredActivities.reduce((sum, activity) => 
      sum + (activity.duration || 0), 0
    );
    
    // 计算活跃天数
    const activeDates = new Set(filteredActivities.map(a => a.date));
    const daysActive = activeDates.size;
    
    return { totalMinutes, daysActive };
  }

  /**
   * 附加事件监听器
   */
  attachEventListeners() {
    if (!this.container) return;

    // 类型切换
    this.container.addEventListener('click', (e) => {
      if (e.target.classList.contains('type-btn')) {
        const type = e.target.dataset.type;
        if (type && type !== this.currentType) {
          this.currentType = type;
          this.refresh();
        }
      }

      // 视图切换
      if (e.target.classList.contains('view-btn')) {
        const view = e.target.dataset.view;
        if (view && view !== this.currentView) {
          this.currentView = view;
          this.refresh();
        }
      }
    });
  }

  /**
   * 刷新组件
   */
  refresh() {
    this.render();
    this.attachEventListeners();
  }

  /**
   * 销毁组件
   */
  destroy() {
    window.removeEventListener('lifeflow:activity:updated', () => this.refresh());
    window.removeEventListener('friend:added', () => this.refresh());
    window.removeEventListener('friend:removed', () => this.refresh());
    
    if (this.container) {
      this.container.innerHTML = '';
    }
  }
}

// Export for CommonJS and global scope
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Leaderboard;
}
