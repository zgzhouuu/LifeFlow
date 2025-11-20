/**
 * HealthData - 健康数据模型
 */
class HealthData {
  constructor(data = {}) {
    this.username = data.username || '';
    this.height = data.height || 0;           // 身高(cm)
    this.weight = data.weight || 0;           // 体重(kg)
    this.targetWeight = data.targetWeight || 0; // 目标体重
    this.weightHistory = data.weightHistory || []; // 体重历史
    this.gender = data.gender || 'male';      // 性别
    this.updatedAt = data.updatedAt || Date.now();
  }
  
  calculateBMI() {
    if (!this.height || !this.weight) return 0;
    const heightInMeters = this.height / 100;
    return (this.weight / (heightInMeters * heightInMeters)).toFixed(1);
  }
  
  getBMIStatus() {
    const bmi = parseFloat(this.calculateBMI());
    if (bmi < 18.5) return { status: '偏瘦', color: '#3498db' };
    if (bmi < 25) return { status: '正常', color: '#27ae60' };
    if (bmi < 30) return { status: '超重', color: '#f39c12' };
    return { status: '肥胖', color: '#e74c3c' };
  }
  
  estimateBodyFat() {
    const bmi = parseFloat(this.calculateBMI());
    if (this.gender === 'male') {
      if (bmi < 18.5) return '8-15%';
      if (bmi < 25) return '15-20%';
      if (bmi < 30) return '20-25%';
      return '>25%';
    } else {
      if (bmi < 18.5) return '15-22%';
      if (bmi < 25) return '22-28%';
      if (bmi < 30) return '28-35%';
      return '>35%';
    }
  }
  
  addWeightRecord(weight) {
    this.weight = weight;
    this.weightHistory.push({
      date: new Date().toISOString().split('T')[0],
      weight: weight,
      bmi: this.calculateBMI()
    });
    // 只保留最近90天
    if (this.weightHistory.length > 90) {
      this.weightHistory = this.weightHistory.slice(-90);
    }
    this.updatedAt = Date.now();
  }
  
  getWeightProgress() {
    if (!this.targetWeight || !this.weight) return null;
    const diff = this.weight - this.targetWeight;
    const progress = Math.abs(diff);
    const direction = diff > 0 ? 'lose' : 'gain';
    return { diff, progress, direction };
  }
  
  toJSON() {
    return {
      username: this.username,
      height: this.height,
      weight: this.weight,
      targetWeight: this.targetWeight,
      weightHistory: this.weightHistory,
      gender: this.gender,
      updatedAt: this.updatedAt
    };
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = HealthData;
}
