/**
 * HealthService - 健康数据管理服务
 * Handles health data, BMI calculations, and health advice
 */

import { StorageManager } from '../utils/storage.js';

class HealthService {
  constructor() {
    this.storage = new StorageManager('lifeflow');
  }

  /**
   * 获取用户健康数据
   * @param {string} username - 用户名
   * @returns {Object} 健康数据对象
   */
  getHealthData(username) {
    if (!username) {
      console.warn('No username provided');
      return this.getDefaultHealthData(username);
    }

    const healthKey = `${username}_health`;
    const data = this.storage.load(healthKey);

    if (!data) {
      return this.getDefaultHealthData(username);
    }

    return data;
  }

  /**
   * 获取默认健康数据
   * @param {string} username - 用户名
   * @returns {Object} 默认健康数据
   */
  getDefaultHealthData(username) {
    return {
      username: username || '',
      height: 0,
      weight: 0,
      targetWeight: 0,
      gender: 'male', // male, female
      weightHistory: [],
      updatedAt: Date.now()
    };
  }

  /**
   * 保存健康数据
   * @param {string} username - 用户名
   * @param {Object} healthData - 健康数据
   */
  saveHealthData(username, healthData) {
    const healthKey = `${username}_health`;
    const data = {
      ...healthData,
      username,
      updatedAt: Date.now()
    };

    this.storage.save(healthKey, data);
    this.notifyUpdate(username, data);
  }

  /**
   * 更新身高
   * @param {string} username - 用户名
   * @param {number} height - 身高（厘米）
   * @returns {Object} 更新后的健康数据
   * @throws {Error} 如果身高不在有效范围内
   */
  updateHeight(username, height) {
    const heightNum = parseFloat(height);

    if (isNaN(heightNum) || heightNum < 100 || heightNum > 250) {
      throw new Error('身高必须在100-250厘米之间');
    }

    const health = this.getHealthData(username);
    health.height = heightNum;
    this.saveHealthData(username, health);

    return health;
  }

  /**
   * 更新体重
   * @param {string} username - 用户名
   * @param {number} weight - 体重（公斤）
   * @returns {Object} 更新后的健康数据
   * @throws {Error} 如果体重不在有效范围内
   */
  updateWeight(username, weight) {
    const weightNum = parseFloat(weight);

    if (isNaN(weightNum) || weightNum < 30 || weightNum > 300) {
      throw new Error('体重必须在30-300公斤之间');
    }

    const health = this.getHealthData(username);
    health.weight = weightNum;

    // 添加到体重历史
    this.addWeightRecord(health, weightNum);

    this.saveHealthData(username, health);

    return health;
  }

  /**
   * 添加体重记录
   * @param {Object} health - 健康数据对象
   * @param {number} weight - 体重
   */
  addWeightRecord(health, weight) {
    const today = new Date().toISOString().split('T')[0];
    
    // 检查今天是否已有记录
    const existingIndex = health.weightHistory.findIndex(
      record => record.date === today
    );

    const bmi = this.calculateBMI(health.height, weight);

    if (existingIndex >= 0) {
      // 更新今天的记录
      health.weightHistory[existingIndex] = {
        date: today,
        weight: weight,
        bmi: bmi
      };
    } else {
      // 添加新记录
      health.weightHistory.push({
        date: today,
        weight: weight,
        bmi: bmi
      });
    }

    // 按日期排序
    health.weightHistory.sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    );

    // 只保留最近90天
    if (health.weightHistory.length > 90) {
      health.weightHistory = health.weightHistory.slice(-90);
    }
  }

  /**
   * 设置目标体重
   * @param {string} username - 用户名
   * @param {number} targetWeight - 目标体重（公斤）
   * @returns {Object} 更新后的健康数据
   * @throws {Error} 如果目标体重不在有效范围内
   */
  setTargetWeight(username, targetWeight) {
    const weightNum = parseFloat(targetWeight);

    if (isNaN(weightNum) || weightNum < 30 || weightNum > 300) {
      throw new Error('目标体重必须在30-300公斤之间');
    }

    const health = this.getHealthData(username);
    health.targetWeight = weightNum;
    this.saveHealthData(username, health);

    return health;
  }

  /**
   * 更新性别
   * @param {string} username - 用户名
   * @param {string} gender - 性别（male/female）
   * @returns {Object} 更新后的健康数据
   */
  updateGender(username, gender) {
    if (!['male', 'female'].includes(gender)) {
      throw new Error('性别必须是male或female');
    }

    const health = this.getHealthData(username);
    health.gender = gender;
    this.saveHealthData(username, health);

    return health;
  }

  /**
   * 计算BMI
   * @param {number} height - 身高（厘米）
   * @param {number} weight - 体重（公斤）
   * @returns {number} BMI值（保留一位小数）
   */
  calculateBMI(height, weight) {
    if (!height || !weight || height <= 0 || weight <= 0) {
      return 0;
    }

    const heightInMeters = height / 100;
    const bmi = weight / (heightInMeters * heightInMeters);
    return parseFloat(bmi.toFixed(1));
  }

  /**
   * 获取BMI状态
   * @param {number} bmi - BMI值
   * @returns {Object} 包含状态和颜色的对象
   */
  getBMIStatus(bmi) {
    if (bmi < 18.5) {
      return { 
        status: '偏瘦', 
        color: '#3498db',
        level: 'underweight'
      };
    }
    if (bmi < 25) {
      return { 
        status: '正常', 
        color: '#27ae60',
        level: 'normal'
      };
    }
    if (bmi < 30) {
      return { 
        status: '超重', 
        color: '#f39c12',
        level: 'overweight'
      };
    }
    return { 
      status: '肥胖', 
      color: '#e74c3c',
      level: 'obese'
    };
  }

  /**
   * 估算体脂率
   * @param {number} bmi - BMI值
   * @param {string} gender - 性别（male/female）
   * @returns {string} 体脂率范围
   */
  estimateBodyFat(bmi, gender = 'male') {
    if (gender === 'male') {
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

  /**
   * 获取健康建议
   * @param {number} bmi - BMI值
   * @returns {Object} 包含状态和建议的对象
   */
  getHealthAdvice(bmi) {
    if (bmi < 18.5) {
      return {
        status: '偏瘦',
        advice: [
          '增加热量摄入，建议每日增加300-500卡路里',
          '进行力量训练，增加肌肉量',
          '保证充足睡眠，每天7-8小时',
          '多吃高蛋白食物，如鸡蛋、牛奶、瘦肉'
        ],
        dailyCalories: '建议每日摄入2500-3000卡路里',
        exerciseTime: '建议每周进行3-4次力量训练'
      };
    } else if (bmi < 25) {
      return {
        status: '正常',
        advice: [
          '保持当前饮食和运动习惯',
          '每周进行150分钟中等强度运动',
          '均衡饮食，多吃蔬菜水果',
          '保持良好的作息规律'
        ],
        dailyCalories: '建议每日摄入2000-2500卡路里',
        exerciseTime: '建议每周运动150分钟以上'
      };
    } else if (bmi < 30) {
      return {
        status: '超重',
        advice: [
          '控制热量摄入，建议每日减少300-500卡路里',
          '增加有氧运动，每周至少5次，每次30分钟',
          '减少高糖高脂食物摄入',
          '多喝水，每天至少8杯',
          '避免久坐，每小时起身活动'
        ],
        dailyCalories: '建议每日摄入1500-2000卡路里',
        exerciseTime: '建议每周运动200分钟以上'
      };
    } else {
      return {
        status: '肥胖',
        advice: [
          '建议咨询专业营养师制定减重计划',
          '逐步增加运动量，从低强度开始',
          '控制饮食，采用少食多餐策略',
          '定期监测体重和BMI变化',
          '保持积极心态，循序渐进',
          '考虑寻求医生指导'
        ],
        dailyCalories: '建议每日摄入1200-1800卡路里',
        exerciseTime: '建议每周运动250分钟以上'
      };
    }
  }

  /**
   * 获取体重趋势
   * @param {string} username - 用户名
   * @param {number} days - 天数（默认30天）
   * @returns {Array} 体重历史记录
   */
  getWeightTrend(username, days = 30) {
    const health = this.getHealthData(username);
    
    if (!health.weightHistory || health.weightHistory.length === 0) {
      return [];
    }

    // 获取最近N天的记录
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return health.weightHistory.filter(record => {
      const recordDate = new Date(record.date);
      return recordDate >= cutoffDate;
    });
  }

  /**
   * 计算目标进度
   * @param {string} username - 用户名
   * @returns {Object} 目标进度信息
   */
  getTargetProgress(username) {
    const health = this.getHealthData(username);

    if (!health.weight || !health.targetWeight) {
      return {
        hasTarget: false,
        progress: 0,
        remaining: 0,
        direction: 'none'
      };
    }

    const current = health.weight;
    const target = health.targetWeight;
    const diff = current - target;
    const direction = diff > 0 ? 'lose' : diff < 0 ? 'gain' : 'maintain';

    // 假设初始体重是历史记录中的第一个，或当前体重
    const initialWeight = health.weightHistory.length > 0 
      ? health.weightHistory[0].weight 
      : current;

    const totalChange = Math.abs(initialWeight - target);
    const currentChange = Math.abs(initialWeight - current);
    const progress = totalChange > 0 
      ? Math.min(100, (currentChange / totalChange) * 100) 
      : 0;

    return {
      hasTarget: true,
      current,
      target,
      initial: initialWeight,
      progress: parseFloat(progress.toFixed(1)),
      remaining: Math.abs(diff),
      direction
    };
  }

  /**
   * 导出健康报告
   * @param {string} username - 用户名
   * @returns {Object} 健康报告数据
   */
  exportHealthReport(username) {
    const health = this.getHealthData(username);
    const bmi = this.calculateBMI(health.height, health.weight);
    const bmiStatus = this.getBMIStatus(bmi);
    const bodyFat = this.estimateBodyFat(bmi, health.gender);
    const advice = this.getHealthAdvice(bmi);
    const targetProgress = this.getTargetProgress(username);

    // 获取运动和学习数据
    const exercises = this.storage.loadExercises() || [];
    const learning = this.storage.loadLearningActivities() || [];

    return {
      profile: {
        username,
        height: health.height,
        weight: health.weight,
        bmi,
        bmiStatus: bmiStatus.status,
        bodyFat,
        gender: health.gender,
        targetWeight: health.targetWeight
      },
      targetProgress,
      weightHistory: health.weightHistory,
      advice,
      exercise: this.summarizeActivities(exercises),
      learning: this.summarizeActivities(learning),
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * 汇总活动数据
   * @param {Array} activities - 活动数组
   * @returns {Object} 汇总数据
   */
  summarizeActivities(activities) {
    const last30Days = activities.filter(a => {
      const activityDate = new Date(a.date);
      const daysDiff = (Date.now() - activityDate) / (1000 * 60 * 60 * 24);
      return daysDiff <= 30;
    });

    const totalMinutes = last30Days.reduce((sum, a) => sum + (a.duration || 0), 0);
    const avgPerDay = totalMinutes / 30;

    return {
      totalMinutes,
      avgPerDay: parseFloat(avgPerDay.toFixed(1)),
      count: last30Days.length
    };
  }

  /**
   * 导出健康数据为CSV
   * @param {string} username - 用户名
   * @returns {string} CSV格式的数据
   */
  exportHealthDataCSV(username) {
    const health = this.getHealthData(username);
    
    let csv = '日期,体重(kg),BMI\n';
    
    health.weightHistory.forEach(record => {
      csv += `${record.date},${record.weight},${record.bmi}\n`;
    });

    return csv;
  }

  /**
   * 触发健康数据更新事件
   * @param {string} username - 用户名
   * @param {Object} healthData - 健康数据
   */
  notifyUpdate(username, healthData) {
    window.dispatchEvent(new CustomEvent('health:updated', {
      detail: { username, healthData }
    }));
  }

  /**
   * 删除健康数据
   * @param {string} username - 用户名
   */
  deleteHealthData(username) {
    const healthKey = `${username}_health`;
    this.storage.remove(healthKey);
    this.notifyUpdate(username, null);
  }
}

// 创建全局实例
const healthService = new HealthService();

export { HealthService, healthService };
