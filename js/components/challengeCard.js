/**
 * ChallengeCard - 挑战卡片组件
 * Displays challenge information, progress, and leaderboard
 */

class ChallengeCard {
  constructor(container, challengeService, profileService, friendService) {
    this.container = container;
    this.challengeService = challengeService;
    this.profileService = profileService;
    this.friendService = friendService;
    this.currentUserId = this.getCurrentUserId();
    
    this.init();
  }

  /**
   * 初始化组件
   */
  init() {
    this.render();
    this.attachEventListeners();
    
    // 监听挑战更新事件
    window.addEventListener('challenge:created', () => this.render());
    window.addEventListener('challenge:updated', () => this.render());
  }

  /**
   * 获取当前用户ID
   * @returns {string} 用户ID
   */
  getCurrentUserId() {
    return localStorage.getItem('lifeflow_current_user') || 'user1';
  }

  /**
   * 渲染组件
   */
  render() {
    const activeChallenges = this.challengeService.getActiveChallenges(this.currentUserId);
    const invitations = this.challengeService.getChallengeInvitations(this.currentUserId);

    this.container.innerHTML = `
      <div class="challenge-card">
        <div class="challenge-header">
          <h3>🏆 打卡挑战</h3>
          <button class="btn-create-challenge">创建挑战</button>
        </div>

        ${invitations.length > 0 ? this.renderInvitations(invitations) : ''}
        
        <div class="challenge-tabs">
          <button class="tab-btn active" data-tab="active">进行中 (${activeChallenges.length})</button>
          <button class="tab-btn" data-tab="completed">已完成</button>
        </div>

        <div class="challenge-content">
          <div class="tab-content active" data-tab="active">
            ${activeChallenges.length > 0 
              ? activeChallenges.map(c => this.renderChallengeItem(c)).join('') 
              : '<div class="empty-state">暂无进行中的挑战<br>创建一个挑战邀请好友一起打卡吧！</div>'}
          </div>
          <div class="tab-content" data-tab="completed">
            ${this.renderCompletedChallenges()}
          </div>
        </div>
      </div>

      <!-- 创建挑战模态框 -->
      <div class="challenge-modal" id="createChallengeModal" style="display: none;">
        <div class="modal-content">
          <div class="modal-header">
            <h3>创建挑战</h3>
            <button class="btn-close-modal">&times;</button>
          </div>
          <div class="modal-body">
            ${this.renderCreateChallengeForm()}
          </div>
        </div>
      </div>

      <!-- 挑战详情模态框 -->
      <div class="challenge-modal" id="challengeDetailModal" style="display: none;">
        <div class="modal-content">
          <div class="modal-header">
            <h3>挑战详情</h3>
            <button class="btn-close-modal">&times;</button>
          </div>
          <div class="modal-body" id="challengeDetailContent">
          </div>
        </div>
      </div>
    `;
  }

  /**
   * 渲染邀请通知
   * @param {Array} invitations - 邀请列表
   * @returns {string} HTML
   */
  renderInvitations(invitations) {
    return `
      <div class="challenge-invitations">
        <h4>📬 挑战邀请</h4>
        ${invitations.map(challenge => `
          <div class="invitation-item" data-challenge-id="${challenge.id}">
            <div class="invitation-info">
              <span class="challenge-type-badge ${challenge.type}">${this.getTypeLabel(challenge.type)}</span>
              <span>邀请你参加 ${challenge.durationDays} 天挑战</span>
            </div>
            <div class="invitation-actions">
              <button class="btn-accept-challenge" data-challenge-id="${challenge.id}">接受</button>
              <button class="btn-decline-challenge" data-challenge-id="${challenge.id}">拒绝</button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  /**
   * 渲染挑战项
   * @param {Object} challenge - 挑战对象
   * @returns {string} HTML
   */
  renderChallengeItem(challenge) {
    const stats = this.challengeService.getChallengeStats(challenge.id);
    const leaderboard = this.challengeService.getLeaderboard(challenge.id);
    const userRank = leaderboard.findIndex(r => r.userId === this.currentUserId);
    const userStats = leaderboard[userRank];

    return `
      <div class="challenge-item" data-challenge-id="${challenge.id}">
        <div class="challenge-item-header">
          <div class="challenge-type-info">
            <span class="challenge-type-badge ${challenge.type}">${this.getTypeLabel(challenge.type)}</span>
            <span class="challenge-duration">${challenge.durationDays}天挑战</span>
          </div>
          <button class="btn-view-detail" data-challenge-id="${challenge.id}">详情</button>
        </div>

        <div class="challenge-target">
          <div class="target-label">目标：每天 ${challenge.targetMinutes} 分钟</div>
          <div class="progress-info">
            <span>第 ${stats.daysPassed}/${challenge.durationDays} 天</span>
            <span>剩余 ${stats.daysRemaining} 天</span>
          </div>
        </div>

        <div class="challenge-progress">
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${userStats ? userStats.completionRate : 0}%"></div>
          </div>
          <div class="progress-text">${userStats ? userStats.completionRate.toFixed(1) : 0}% 完成</div>
        </div>

        <div class="challenge-participants">
          <span>👥 ${stats.participantCount} 人参与</span>
          <span>🏅 你的排名：第 ${userRank + 1} 名</span>
        </div>
      </div>
    `;
  }

  /**
   * 渲染已完成的挑战
   * @returns {string} HTML
   */
  renderCompletedChallenges() {
    const allChallenges = this.challengeService.getChallengesByParticipant(this.currentUserId);
    const completedChallenges = allChallenges.filter(c => c.status === 'completed');

    if (completedChallenges.length === 0) {
      return '<div class="empty-state">暂无已完成的挑战</div>';
    }

    return completedChallenges.map(challenge => {
      const leaderboard = this.challengeService.getLeaderboard(challenge.id);
      const userRank = leaderboard.findIndex(r => r.userId === this.currentUserId);
      const userStats = leaderboard[userRank];

      return `
        <div class="challenge-item completed" data-challenge-id="${challenge.id}">
          <div class="challenge-item-header">
            <div class="challenge-type-info">
              <span class="challenge-type-badge ${challenge.type}">${this.getTypeLabel(challenge.type)}</span>
              <span class="challenge-duration">${challenge.durationDays}天挑战</span>
              ${userRank === 0 ? '<span class="champion-badge">🏆 冠军</span>' : ''}
            </div>
            <button class="btn-view-detail" data-challenge-id="${challenge.id}">查看</button>
          </div>

          <div class="challenge-result">
            <div class="result-item">
              <span class="result-label">完成率</span>
              <span class="result-value">${userStats ? userStats.completionRate.toFixed(1) : 0}%</span>
            </div>
            <div class="result-item">
              <span class="result-label">排名</span>
              <span class="result-value">第 ${userRank + 1} 名</span>
            </div>
            <div class="result-item">
              <span class="result-label">总时长</span>
              <span class="result-value">${userStats ? userStats.totalMinutes : 0} 分钟</span>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  /**
   * 渲染创建挑战表单
   * @returns {string} HTML
   */
  renderCreateChallengeForm() {
    const friends = this.friendService ? this.friendService.getFriends(this.currentUserId) : [];

    return `
      <form id="createChallengeForm">
        <div class="form-group">
          <label>挑战类型</label>
          <div class="radio-group">
            <label class="radio-label">
              <input type="radio" name="type" value="exercise" checked>
              <span>🏃 运动挑战</span>
            </label>
            <label class="radio-label">
              <input type="radio" name="type" value="learning">
              <span>📚 学习挑战</span>
            </label>
          </div>
        </div>

        <div class="form-group">
          <label>每日目标时长（分钟）</label>
          <input type="number" name="targetMinutes" min="1" max="1440" value="30" required>
          <small>建议：运动30-60分钟，学习60-120分钟</small>
        </div>

        <div class="form-group">
          <label>挑战天数</label>
          <input type="number" name="durationDays" min="1" max="30" value="7" required>
          <small>1-30天</small>
        </div>

        <div class="form-group">
          <label>邀请好友（可选）</label>
          <div class="friend-select-list">
            ${friends.length > 0 
              ? friends.map(friendId => {
                  const profile = this.profileService ? this.profileService.getProfile(friendId) : null;
                  const nickname = profile ? profile.nickname || friendId : friendId;
                  return `
                    <label class="checkbox-label">
                      <input type="checkbox" name="invitedFriends" value="${friendId}">
                      <span>${nickname}</span>
                    </label>
                  `;
                }).join('')
              : '<div class="empty-state">暂无好友</div>'}
          </div>
        </div>

        <div class="form-actions">
          <button type="button" class="btn-cancel">取消</button>
          <button type="submit" class="btn-primary">创建挑战</button>
        </div>
      </form>
    `;
  }

  /**
   * 渲染挑战详情
   * @param {string} challengeId - 挑战ID
   */
  renderChallengeDetail(challengeId) {
    const challenge = this.challengeService.getChallengeById(challengeId);
    if (!challenge) return;

    const stats = this.challengeService.getChallengeStats(challengeId);
    const leaderboard = this.challengeService.getLeaderboard(challengeId);

    const detailContent = document.getElementById('challengeDetailContent');
    detailContent.innerHTML = `
      <div class="challenge-detail">
        <div class="detail-header">
          <span class="challenge-type-badge ${challenge.type}">${this.getTypeLabel(challenge.type)}</span>
          <span class="challenge-status ${challenge.status}">${challenge.status === 'active' ? '进行中' : '已完成'}</span>
        </div>

        <div class="detail-info">
          <div class="info-row">
            <span class="info-label">挑战周期</span>
            <span class="info-value">${challenge.startDate} 至 ${challenge.endDate}</span>
          </div>
          <div class="info-row">
            <span class="info-label">每日目标</span>
            <span class="info-value">${challenge.targetMinutes} 分钟</span>
          </div>
          <div class="info-row">
            <span class="info-label">挑战天数</span>
            <span class="info-value">${challenge.durationDays} 天</span>
          </div>
          <div class="info-row">
            <span class="info-label">参与人数</span>
            <span class="info-value">${stats.participantCount} 人</span>
          </div>
          <div class="info-row">
            <span class="info-label">进度</span>
            <span class="info-value">第 ${stats.daysPassed}/${challenge.durationDays} 天</span>
          </div>
        </div>

        <div class="detail-leaderboard">
          <h4>🏅 排行榜</h4>
          <div class="leaderboard-list">
            ${leaderboard.map((rank, index) => {
              const profile = this.profileService ? this.profileService.getProfile(rank.userId) : null;
              const nickname = profile ? profile.nickname || rank.userId : rank.userId;
              const isCurrentUser = rank.userId === this.currentUserId;

              return `
                <div class="leaderboard-item ${isCurrentUser ? 'current-user' : ''}">
                  <div class="rank-number ${index === 0 ? 'first' : index === 1 ? 'second' : index === 2 ? 'third' : ''}">
                    ${index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                  </div>
                  <div class="rank-user">
                    <div class="user-name">${nickname}${isCurrentUser ? ' (我)' : ''}</div>
                    <div class="user-stats">
                      ${rank.totalMinutes} 分钟 · ${rank.daysCompleted} 天
                    </div>
                  </div>
                  <div class="rank-completion">
                    <div class="completion-bar">
                      <div class="completion-fill" style="width: ${rank.completionRate}%"></div>
                    </div>
                    <div class="completion-text">${rank.completionRate.toFixed(1)}%</div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        ${challenge.status === 'active' && challenge.creatorId === this.currentUserId ? `
          <div class="detail-actions">
            <button class="btn-delete-challenge" data-challenge-id="${challenge.id}">删除挑战</button>
          </div>
        ` : ''}
      </div>
    `;
  }

  /**
   * 获取类型标签
   * @param {string} type - 类型
   * @returns {string} 标签文本
   */
  getTypeLabel(type) {
    return type === 'exercise' ? '🏃 运动' : '📚 学习';
  }

  /**
   * 附加事件监听器
   */
  attachEventListeners() {
    // 创建挑战按钮
    this.container.addEventListener('click', (e) => {
      if (e.target.classList.contains('btn-create-challenge')) {
        this.showCreateChallengeModal();
      }

      // 标签切换
      if (e.target.classList.contains('tab-btn')) {
        this.switchTab(e.target.dataset.tab);
      }

      // 查看详情
      if (e.target.classList.contains('btn-view-detail')) {
        const challengeId = e.target.dataset.challengeId;
        this.showChallengeDetail(challengeId);
      }

      // 接受挑战
      if (e.target.classList.contains('btn-accept-challenge')) {
        const challengeId = e.target.dataset.challengeId;
        this.acceptChallenge(challengeId);
      }

      // 拒绝挑战
      if (e.target.classList.contains('btn-decline-challenge')) {
        const challengeId = e.target.dataset.challengeId;
        this.declineChallenge(challengeId);
      }

      // 关闭模态框
      if (e.target.classList.contains('btn-close-modal') || e.target.classList.contains('challenge-modal')) {
        this.closeModals();
      }

      // 取消按钮
      if (e.target.classList.contains('btn-cancel')) {
        this.closeModals();
      }

      // 删除挑战
      if (e.target.classList.contains('btn-delete-challenge')) {
        const challengeId = e.target.dataset.challengeId;
        this.deleteChallenge(challengeId);
      }
    });

    // 创建挑战表单提交
    this.container.addEventListener('submit', (e) => {
      if (e.target.id === 'createChallengeForm') {
        e.preventDefault();
        this.handleCreateChallenge(e.target);
      }
    });
  }

  /**
   * 显示创建挑战模态框
   */
  showCreateChallengeModal() {
    const modal = document.getElementById('createChallengeModal');
    if (modal) {
      modal.style.display = 'flex';
    }
  }

  /**
   * 显示挑战详情
   * @param {string} challengeId - 挑战ID
   */
  showChallengeDetail(challengeId) {
    this.renderChallengeDetail(challengeId);
    const modal = document.getElementById('challengeDetailModal');
    if (modal) {
      modal.style.display = 'flex';
    }
  }

  /**
   * 关闭所有模态框
   */
  closeModals() {
    const modals = this.container.querySelectorAll('.challenge-modal');
    modals.forEach(modal => {
      modal.style.display = 'none';
    });
  }

  /**
   * 切换标签
   * @param {string} tab - 标签名
   */
  switchTab(tab) {
    // 更新标签按钮状态
    this.container.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tab);
    });

    // 更新内容显示
    this.container.querySelectorAll('.tab-content').forEach(content => {
      content.classList.toggle('active', content.dataset.tab === tab);
    });
  }

  /**
   * 处理创建挑战
   * @param {HTMLFormElement} form - 表单元素
   */
  handleCreateChallenge(form) {
    const formData = new FormData(form);
    
    const challengeData = {
      type: formData.get('type'),
      targetMinutes: parseInt(formData.get('targetMinutes')),
      durationDays: parseInt(formData.get('durationDays')),
      invitedFriends: formData.getAll('invitedFriends')
    };

    try {
      this.challengeService.createChallenge(this.currentUserId, challengeData);
      this.closeModals();
      this.showToast('挑战创建成功！', 'success');
      this.render();
    } catch (error) {
      this.showToast(error.message, 'error');
    }
  }

  /**
   * 接受挑战
   * @param {string} challengeId - 挑战ID
   */
  acceptChallenge(challengeId) {
    const success = this.challengeService.acceptChallenge(challengeId, this.currentUserId);
    
    if (success) {
      this.showToast('已接受挑战！', 'success');
      this.render();
    } else {
      this.showToast('接受挑战失败', 'error');
    }
  }

  /**
   * 拒绝挑战
   * @param {string} challengeId - 挑战ID
   */
  declineChallenge(challengeId) {
    const success = this.challengeService.declineChallenge(challengeId, this.currentUserId);
    
    if (success) {
      this.showToast('已拒绝挑战', 'info');
      this.render();
    }
  }

  /**
   * 删除挑战
   * @param {string} challengeId - 挑战ID
   */
  deleteChallenge(challengeId) {
    if (!confirm('确定要删除这个挑战吗？')) {
      return;
    }

    const success = this.challengeService.deleteChallenge(challengeId, this.currentUserId);
    
    if (success) {
      this.showToast('挑战已删除', 'success');
      this.closeModals();
      this.render();
    } else {
      this.showToast('删除失败，只能删除自己创建的挑战', 'error');
    }
  }

  /**
   * 显示提示消息
   * @param {string} message - 消息内容
   * @param {string} type - 消息类型
   */
  showToast(message, type = 'info') {
    if (window.toastNotification) {
      window.toastNotification.show(message, type);
    } else {
      alert(message);
    }
  }
}

// Export for CommonJS and global scope
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ChallengeCard;
}
