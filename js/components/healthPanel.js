/**
 * HealthPanel - 健康数据管理面板组件
 * 负责显示和管理用户的健康数据，包括身高、体重、BMI、目标体重等
 */

class HealthPanel {
  constructor(containerId, healthService, username) {
    this.container = document.getElementById(containerId);
    this.healthService = healthService;
    this.username = username;
    this.healthData = null;
  }

  /**
   * 渲染健康面板
   */
  render() {
    if (!this.container) {
      console.error('Health panel container not found');
      return;
    }

    // 加载健康数据
    this.loadHealthData();

    // 渲染面板HTML
    this.container.innerHTML = this.getHTML();

    // 绑定事件
    this.bindEvents();

    // 渲染体重趋势图表
    this.renderWeightTrendChart();
  }

  /**
   * 加载健康数据
   */
  loadHealthData() {
    try {
      this.healthData = this.healthService.getHealthData(this.username);
    } catch (error) {
      console.error('Failed to load health data:', error);
      this.healthData = this.healthService.getDefaultHealthData(this.username);
    }
  }

  /**
   * 生成面板HTML
   */
  getHTML() {
    const bmi = this.calculateBMI();
    const bmiStatus = this.getBMIStatus(bmi);
    const targetProgress = this.getTargetProgress();

    return `
      <div class="health-panel">
        <div class="health-panel-header">
          <h2 class="health-panel-title">健康数据</h2>
          <p class="health-panel-subtitle">管理您的身高、体重和健康目标</p>
        </div>

        <!-- 基础数据输入 -->
        <div class="health-inputs">
          <div class="health-input-group">
            <label class="health-label">
              <span class="label-text">身高</span>
              <span class="label-hint">(100-250cm)</span>
            </label>
            <div class="input-with-unit">
              <input 
                type="number" 
                id="heightInput" 
                class="health-input" 
                placeholder="请输入身高"
                min="100"
                max="250"
                step="0.1"
                value="${this.healthData.height || ''}"
              />
              <span class="input-unit">cm</span>
            </div>
            <span class="input-error" id="heightError"></span>
          </div>

          <div class="health-input-group">
            <label class="health-label">
              <span class="label-text">体重</span>
              <span class="label-hint">(30-300kg)</span>
            </label>
            <div class="input-with-unit">
              <input 
                type="number" 
                id="weightInput" 
                class="health-input" 
                placeholder="请输入体重"
                min="30"
                max="300"
                step="0.1"
                value="${this.healthData.weight || ''}"
              />
              <span class="input-unit">kg</span>
            </div>
            <span class="input-error" id="weightError"></span>
          </div>

          <div class="health-input-group">
            <label class="health-label">
              <span class="label-text">目标体重</span>
              <span class="label-hint">(30-300kg)</span>
            </label>
            <div class="input-with-unit">
              <input 
                type="number" 
                id="targetWeightInput" 
                class="health-input" 
                placeholder="请输入目标体重"
                min="30"
                max="300"
                step="0.1"
                value="${this.healthData.targetWeight || ''}"
              />
              <span class="input-unit">kg</span>
            </div>
            <span class="input-error" id="targetWeightError"></span>
          </div>

          <div class="health-input-group">
            <label class="health-label">
              <span class="label-text">性别</span>
              <span class="label-hint">(用于体脂率估算)</span>
            </label>
            <div class="gender-selector">
              <button 
                type="button"
                class="gender-btn ${(this.healthData.gender || 'male') === 'male' ? 'active' : ''}" 
                data-gender="male"
                id="genderMaleBtn"
              >
                👨 男性
              </button>
              <button 
                type="button"
                class="gender-btn ${this.healthData.gender === 'female' ? 'active' : ''}" 
                data-gender="female"
                id="genderFemaleBtn"
              >
                👩 女性
              </button>
            </div>
          </div>
        </div>

        <!-- BMI显示区域 -->
        <div class="bmi-display">
          <div class="bmi-card">
            <div class="bmi-header">
              <span class="bmi-label">BMI指数</span>
              <span class="bmi-value" style="color: ${bmiStatus.color}">${bmi > 0 ? bmi : '--'}</span>
            </div>
            <div class="bmi-status" style="background: ${bmiStatus.color}">
              ${bmiStatus.status}
            </div>
            <div class="bmi-description">
              ${this.getBMIDescription(bmi)}
            </div>
          </div>

          <!-- 体脂率估算 -->
          ${bmi > 0 ? `
            <div class="body-fat-card">
              <div class="body-fat-header">
                <span class="body-fat-label">体脂率估算</span>
                <span class="body-fat-value">${this.estimateBodyFat(bmi)}</span>
              </div>
              <div class="body-fat-note">
                * 基于BMI和性别的估算值，仅供参考
              </div>
            </div>
          ` : ''}
        </div>

        <!-- 目标进度 -->
        ${targetProgress.hasTarget ? `
          <div class="target-progress">
            <div class="progress-header">
              <span class="progress-label">目标进度</span>
              <span class="progress-value">
                ${targetProgress.direction === 'lose' ? '需减重' : targetProgress.direction === 'gain' ? '需增重' : '保持'}
                ${targetProgress.remaining.toFixed(1)} kg
              </span>
            </div>
            <div class="progress-bar-container">
              <div class="progress-bar" style="width: ${targetProgress.progress}%"></div>
            </div>
            <div class="progress-info">
              <span>当前: ${targetProgress.current} kg</span>
              <span>目标: ${targetProgress.target} kg</span>
            </div>
          </div>
        ` : ''}

        <!-- 体重趋势图表 -->
        ${this.healthData.weightHistory && this.healthData.weightHistory.length > 1 ? `
          <div class="weight-chart-section">
            <h3 class="chart-title">体重趋势（最近30天）</h3>
            <div class="chart-container">
              <canvas id="weightTrendChart"></canvas>
            </div>
          </div>
        ` : ''}

        <!-- 健康建议 -->
        ${bmi > 0 ? `
          <div class="health-advice-section">
            <h3 class="advice-title">
              <span class="advice-icon">💡</span>
              健康建议
            </h3>
            ${this.renderHealthAdvice(bmi)}
          </div>
        ` : ''}

        <!-- 体重历史 -->
        ${this.healthData.weightHistory && this.healthData.weightHistory.length > 0 ? `
          <div class="weight-history">
            <h3 class="history-title">体重记录</h3>
            <div class="history-list">
              ${this.renderWeightHistory()}
            </div>
          </div>
        ` : ''}

        <!-- 保存按钮 -->
        <div class="health-actions">
          <button class="btn-primary" id="saveHealthBtn">
            保存健康数据
          </button>
        </div>
      </div>
    `;
  }

  /**
   * 计算BMI
   */
  calculateBMI() {
    const height = this.healthData.height;
    const weight = this.healthData.weight;
    
    if (!height || !weight || height <= 0 || weight <= 0) {
      return 0;
    }

    return this.healthService.calculateBMI(height, weight);
  }

  /**
   * 获取BMI状态
   */
  getBMIStatus(bmi) {
    if (bmi === 0) {
      return { status: '未设置', color: '#95a5a6' };
    }
    return this.healthService.getBMIStatus(bmi);
  }

  /**
   * 获取BMI描述
   */
  getBMIDescription(bmi) {
    if (bmi === 0) {
      return '请输入身高和体重以计算BMI';
    }
    if (bmi < 18.5) {
      return 'BMI偏低，建议增加营养摄入';
    }
    if (bmi < 25) {
      return 'BMI正常，请保持健康的生活方式';
    }
    if (bmi < 30) {
      return 'BMI偏高，建议控制饮食并增加运动';
    }
    return 'BMI过高，建议咨询专业医生';
  }

  /**
   * 估算体脂率
   */
  estimateBodyFat(bmi) {
    const gender = this.healthData.gender || 'male';
    return this.healthService.estimateBodyFat(bmi, gender);
  }

  /**
   * 获取目标进度
   */
  getTargetProgress() {
    return this.healthService.getTargetProgress(this.username);
  }

  /**
   * 渲染健康建议
   */
  renderHealthAdvice(bmi) {
    const advice = this.healthService.getHealthAdvice(bmi);
    const bmiStatus = this.getBMIStatus(bmi);
    const bodyFat = this.estimateBodyFat(bmi);
    const gender = this.healthData.gender || 'male';
    const genderText = gender === 'male' ? '男性' : '女性';

    return `
      <div class="advice-card">
        <div class="advice-status-banner" style="background: ${bmiStatus.color}">
          <span class="status-label">当前状态：${advice.status}</span>
        </div>

        <div class="advice-body-fat">
          <div class="body-fat-info">
            <span class="body-fat-label">体脂率估算（${genderText}）</span>
            <span class="body-fat-range">${bodyFat}</span>
          </div>
          <div class="body-fat-description">
            ${this.getBodyFatDescription(bmi, gender)}
          </div>
        </div>

        <div class="advice-recommendations">
          <h4 class="recommendations-title">针对性建议</h4>
          <ul class="advice-list">
            ${advice.advice.map(item => `
              <li class="advice-item">
                <span class="advice-bullet">•</span>
                <span class="advice-text">${item}</span>
              </li>
            `).join('')}
          </ul>
        </div>

        <div class="advice-metrics">
          <div class="metric-card">
            <div class="metric-icon">🍽️</div>
            <div class="metric-content">
              <div class="metric-label">每日热量建议</div>
              <div class="metric-value">${advice.dailyCalories}</div>
            </div>
          </div>
          <div class="metric-card">
            <div class="metric-icon">🏃</div>
            <div class="metric-content">
              <div class="metric-label">运动时长建议</div>
              <div class="metric-value">${advice.exerciseTime}</div>
            </div>
          </div>
        </div>

        ${bmi < 18.5 || bmi >= 30 ? `
          <div class="advice-warning">
            <span class="warning-icon">⚠️</span>
            <span class="warning-text">
              ${bmi < 18.5 
                ? '您的BMI偏低，建议咨询营养师制定增重计划' 
                : '您的BMI偏高，建议咨询医生制定科学的减重方案'}
            </span>
          </div>
        ` : ''}
      </div>
    `;
  }

  /**
   * 获取体脂率描述
   */
  getBodyFatDescription(bmi, gender) {
    if (gender === 'male') {
      if (bmi < 18.5) {
        return '体脂率偏低，可能影响激素分泌和免疫功能';
      } else if (bmi < 25) {
        return '体脂率在健康范围内，保持良好的运动习惯';
      } else if (bmi < 30) {
        return '体脂率偏高，建议增加有氧运动减少体脂';
      } else {
        return '体脂率过高，需要制定系统的减脂计划';
      }
    } else {
      if (bmi < 18.5) {
        return '体脂率偏低，可能影响生理周期和骨骼健康';
      } else if (bmi < 25) {
        return '体脂率在健康范围内，继续保持均衡饮食';
      } else if (bmi < 30) {
        return '体脂率偏高，建议结合饮食控制和运动';
      } else {
        return '体脂率过高，建议寻求专业指导';
      }
    }
  }

  /**
   * 渲染体重历史
   */
  renderWeightHistory() {
    const history = this.healthData.weightHistory.slice(-5).reverse(); // 显示最近5条
    
    return history.map(record => `
      <div class="history-item">
        <span class="history-date">${record.date}</span>
        <span class="history-weight">${record.weight} kg</span>
        <span class="history-bmi">BMI: ${record.bmi}</span>
      </div>
    `).join('');
  }

  /**
   * 绑定事件
   */
  bindEvents() {
    // 身高输入事件
    const heightInput = document.getElementById('heightInput');
    if (heightInput) {
      heightInput.addEventListener('input', () => this.handleHeightInput());
      heightInput.addEventListener('blur', () => this.validateHeight());
    }

    // 体重输入事件
    const weightInput = document.getElementById('weightInput');
    if (weightInput) {
      weightInput.addEventListener('input', () => this.handleWeightInput());
      weightInput.addEventListener('blur', () => this.validateWeight());
    }

    // 目标体重输入事件
    const targetWeightInput = document.getElementById('targetWeightInput');
    if (targetWeightInput) {
      targetWeightInput.addEventListener('input', () => this.handleTargetWeightInput());
      targetWeightInput.addEventListener('blur', () => this.validateTargetWeight());
    }

    // 性别选择按钮事件
    const genderMaleBtn = document.getElementById('genderMaleBtn');
    const genderFemaleBtn = document.getElementById('genderFemaleBtn');
    
    if (genderMaleBtn) {
      genderMaleBtn.addEventListener('click', () => this.handleGenderSelect('male'));
    }
    
    if (genderFemaleBtn) {
      genderFemaleBtn.addEventListener('click', () => this.handleGenderSelect('female'));
    }

    // 保存按钮事件
    const saveBtn = document.getElementById('saveHealthBtn');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => this.saveHealthData());
    }
  }

  /**
   * 处理性别选择
   */
  handleGenderSelect(gender) {
    this.healthData.gender = gender;
    
    // 更新按钮状态
    const maleBtn = document.getElementById('genderMaleBtn');
    const femaleBtn = document.getElementById('genderFemaleBtn');
    
    if (maleBtn && femaleBtn) {
      maleBtn.classList.toggle('active', gender === 'male');
      femaleBtn.classList.toggle('active', gender === 'female');
    }
    
    // 更新体脂率和健康建议显示
    this.updateBMIDisplay();
  }

  /**
   * 处理身高输入
   */
  handleHeightInput() {
    const input = document.getElementById('heightInput');
    const value = parseFloat(input.value);
    
    if (!isNaN(value)) {
      this.healthData.height = value;
      this.updateBMIDisplay();
    }
  }

  /**
   * 验证身高
   */
  validateHeight() {
    const input = document.getElementById('heightInput');
    const error = document.getElementById('heightError');
    const value = parseFloat(input.value);

    if (!input.value) {
      error.textContent = '';
      input.classList.remove('error');
      return true;
    }

    if (isNaN(value) || value < 100 || value > 250) {
      error.textContent = '身高必须在100-250厘米之间';
      input.classList.add('error');
      return false;
    }

    error.textContent = '';
    input.classList.remove('error');
    return true;
  }

  /**
   * 处理体重输入
   */
  handleWeightInput() {
    const input = document.getElementById('weightInput');
    const value = parseFloat(input.value);
    
    if (!isNaN(value)) {
      this.healthData.weight = value;
      this.updateBMIDisplay();
    }
  }

  /**
   * 验证体重
   */
  validateWeight() {
    const input = document.getElementById('weightInput');
    const error = document.getElementById('weightError');
    const value = parseFloat(input.value);

    if (!input.value) {
      error.textContent = '';
      input.classList.remove('error');
      return true;
    }

    if (isNaN(value) || value < 30 || value > 300) {
      error.textContent = '体重必须在30-300公斤之间';
      input.classList.add('error');
      return false;
    }

    error.textContent = '';
    input.classList.remove('error');
    return true;
  }

  /**
   * 处理目标体重输入
   */
  handleTargetWeightInput() {
    const input = document.getElementById('targetWeightInput');
    const value = parseFloat(input.value);
    
    if (!isNaN(value)) {
      this.healthData.targetWeight = value;
    }
  }

  /**
   * 验证目标体重
   */
  validateTargetWeight() {
    const input = document.getElementById('targetWeightInput');
    const error = document.getElementById('targetWeightError');
    const value = parseFloat(input.value);

    if (!input.value) {
      error.textContent = '';
      input.classList.remove('error');
      return true;
    }

    if (isNaN(value) || value < 30 || value > 300) {
      error.textContent = '目标体重必须在30-300公斤之间';
      input.classList.add('error');
      return false;
    }

    error.textContent = '';
    input.classList.remove('error');
    return true;
  }

  /**
   * 更新BMI显示
   */
  updateBMIDisplay() {
    const bmi = this.calculateBMI();
    const bmiStatus = this.getBMIStatus(bmi);

    // 更新BMI值
    const bmiValue = document.querySelector('.bmi-value');
    if (bmiValue) {
      bmiValue.textContent = bmi > 0 ? bmi : '--';
      bmiValue.style.color = bmiStatus.color;
    }

    // 更新BMI状态
    const bmiStatusEl = document.querySelector('.bmi-status');
    if (bmiStatusEl) {
      bmiStatusEl.textContent = bmiStatus.status;
      bmiStatusEl.style.background = bmiStatus.color;
    }

    // 更新BMI描述
    const bmiDescription = document.querySelector('.bmi-description');
    if (bmiDescription) {
      bmiDescription.textContent = this.getBMIDescription(bmi);
    }

    // 更新体脂率
    const bodyFatValue = document.querySelector('.body-fat-value');
    if (bodyFatValue && bmi > 0) {
      bodyFatValue.textContent = this.estimateBodyFat(bmi);
    }

    // 更新健康建议区域（如果存在）
    const adviceSection = document.querySelector('.health-advice-section');
    if (adviceSection && bmi > 0) {
      const adviceCard = adviceSection.querySelector('.advice-card');
      if (adviceCard) {
        adviceCard.innerHTML = this.renderHealthAdvice(bmi).match(/<div class="advice-card">([\s\S]*)<\/div>/)[1];
      }
    }
  }

  /**
   * 保存健康数据
   */
  async saveHealthData() {
    // 验证所有输入
    const heightValid = this.validateHeight();
    const weightValid = this.validateWeight();
    const targetWeightValid = this.validateTargetWeight();

    if (!heightValid || !weightValid || !targetWeightValid) {
      window.toastNotification?.show('请检查输入的数据是否正确', 'error');
      return;
    }

    // 检查是否有数据
    if (!this.healthData.height && !this.healthData.weight) {
      window.toastNotification?.show('请至少输入身高和体重', 'error');
      return;
    }

    try {
      // 保存身高
      if (this.healthData.height) {
        this.healthService.updateHeight(this.username, this.healthData.height);
      }

      // 保存体重（会自动添加到历史记录）
      if (this.healthData.weight) {
        this.healthService.updateWeight(this.username, this.healthData.weight);
      }

      // 保存目标体重
      if (this.healthData.targetWeight) {
        this.healthService.setTargetWeight(this.username, this.healthData.targetWeight);
      }

      // 保存性别
      if (this.healthData.gender) {
        this.healthService.updateGender(this.username, this.healthData.gender);
      }

      window.toastNotification?.show('健康数据保存成功！', 'success');
      
      // 重新渲染以显示更新后的数据
      setTimeout(() => {
        this.render();
      }, 500);

    } catch (error) {
      console.error('Failed to save health data:', error);
      window.toastNotification?.show(error.message || '保存失败，请重试', 'error');
    }
  }

  /**
   * 渲染体重趋势图表
   */
  renderWeightTrendChart() {
    // 检查Chart.js是否可用
    if (typeof Chart === 'undefined') {
      console.warn('Chart.js not loaded, skipping weight trend chart');
      return;
    }

    // 检查是否有足够的数据
    if (!this.healthData.weightHistory || this.healthData.weightHistory.length < 2) {
      return;
    }

    const canvas = document.getElementById('weightTrendChart');
    if (!canvas) {
      return;
    }

    // 销毁已存在的图表实例
    if (this.weightChart) {
      this.weightChart.destroy();
    }

    // 准备图表数据（最近30天）
    const chartData = this.prepareChartData();

    // 创建图表
    const ctx = canvas.getContext('2d');
    this.weightChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: chartData.labels,
        datasets: [
          {
            label: '体重 (kg)',
            data: chartData.weights,
            borderColor: '#667eea',
            backgroundColor: 'rgba(102, 126, 234, 0.1)',
            borderWidth: 2,
            tension: 0.4,
            fill: true,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBackgroundColor: '#667eea',
            pointBorderColor: '#fff',
            pointBorderWidth: 2
          },
          // 目标体重参考线
          ...(this.healthData.targetWeight ? [{
            label: '目标体重',
            data: chartData.labels.map(() => this.healthData.targetWeight),
            borderColor: '#27ae60',
            backgroundColor: 'transparent',
            borderWidth: 2,
            borderDash: [5, 5],
            tension: 0,
            fill: false,
            pointRadius: 0,
            pointHoverRadius: 0
          }] : [])
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        aspectRatio: 2,
        interaction: {
          mode: 'index',
          intersect: false
        },
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              usePointStyle: true,
              padding: 15,
              font: {
                size: 12,
                family: "'Segoe UI', 'Microsoft YaHei', sans-serif"
              }
            }
          },
          tooltip: {
            enabled: true,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: '#fff',
            bodyColor: '#fff',
            borderColor: '#667eea',
            borderWidth: 1,
            padding: 12,
            displayColors: true,
            callbacks: {
              title: (context) => {
                return chartData.fullDates[context[0].dataIndex];
              },
              label: (context) => {
                const label = context.dataset.label || '';
                const value = context.parsed.y;
                if (label === '体重 (kg)') {
                  const bmi = chartData.bmis[context.dataIndex];
                  return [
                    `${label}: ${value.toFixed(1)} kg`,
                    `BMI: ${bmi}`
                  ];
                }
                return `${label}: ${value.toFixed(1)} kg`;
              }
            }
          }
        },
        scales: {
          x: {
            display: true,
            grid: {
              display: false
            },
            ticks: {
              font: {
                size: 11,
                family: "'Segoe UI', 'Microsoft YaHei', sans-serif"
              },
              maxRotation: 45,
              minRotation: 0
            }
          },
          y: {
            display: true,
            beginAtZero: false,
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            },
            ticks: {
              font: {
                size: 11,
                family: "'Segoe UI', 'Microsoft YaHei', sans-serif"
              },
              callback: (value) => value.toFixed(1) + ' kg'
            }
          }
        }
      }
    });
  }

  /**
   * 准备图表数据
   */
  prepareChartData() {
    // 获取最近30天的数据
    const history = this.healthData.weightHistory.slice(-30);
    
    const labels = [];
    const fullDates = [];
    const weights = [];
    const bmis = [];

    history.forEach(record => {
      // 格式化日期标签（显示月-日）
      const date = new Date(record.date);
      const monthDay = `${date.getMonth() + 1}/${date.getDate()}`;
      labels.push(monthDay);
      
      // 保存完整日期用于tooltip
      fullDates.push(record.date);
      
      // 保存体重和BMI数据
      weights.push(parseFloat(record.weight));
      bmis.push(record.bmi);
    });

    return {
      labels,
      fullDates,
      weights,
      bmis
    };
  }

  /**
   * 刷新面板
   */
  refresh() {
    this.render();
  }
}

// 导出组件
if (typeof module !== 'undefined' && module.exports) {
  module.exports = HealthPanel;
}

