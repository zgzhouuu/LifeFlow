/**
 * Challenge - 打卡挑战模型
 */
class Challenge {
  constructor(data = {}) {
    this.id = data.id || `challenge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.creatorId = data.creatorId || '';
    this.type = data.type || 'exercise';     // exercise, learning
    this.targetMinutes = data.targetMinutes || 0;
    this.durationDays = data.durationDays || 7;
    this.participants = data.participants || []; // 参与者ID数组
    this.progress = data.progress || {};     // {userId: {day1: 30, day2: 45}}
    this.startDate = data.startDate || new Date().toISOString().split('T')[0];
    this.endDate = data.endDate || this.calculateEndDate(data.startDate, data.durationDays);
    this.status = data.status || 'active';   // active, completed
    this.createdAt = data.createdAt || Date.now();
  }
  
  calculateEndDate(startDate, durationDays) {
    const start = new Date(startDate || this.startDate);
    start.setDate(start.getDate() + (durationDays || this.durationDays));
    return start.toISOString().split('T')[0];
  }
  
  addParticipant(userId) {
    if (!this.participants.includes(userId)) {
      this.participants.push(userId);
      this.progress[userId] = {};
    }
  }
  
  updateProgress(userId, day, minutes) {
    if (!this.progress[userId]) {
      this.progress[userId] = {};
    }
    this.progress[userId][day] = minutes;
  }
  
  getLeaderboard() {
    return this.participants.map(userId => {
      const userProgress = this.progress[userId] || {};
      const totalMinutes = Object.values(userProgress).reduce((sum, m) => sum + m, 0);
      const completionRate = (totalMinutes / (this.targetMinutes * this.durationDays)) * 100;
      return { userId, totalMinutes, completionRate };
    }).sort((a, b) => b.completionRate - a.completionRate);
  }
  
  toJSON() {
    return {
      id: this.id,
      creatorId: this.creatorId,
      type: this.type,
      targetMinutes: this.targetMinutes,
      durationDays: this.durationDays,
      participants: this.participants,
      progress: this.progress,
      startDate: this.startDate,
      endDate: this.endDate,
      status: this.status,
      createdAt: this.createdAt
    };
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Challenge;
}
