/**
 * TodayTodoPanel - 今日待办面板组件
 * 整合生活任务、运动目标和学习目标
 */
class TodayTodoPanel {
  constructor(storageManager) {
    this.storageManager = storageManager
    this.today = new Date().toISOString().split('T')[0]
    this.setupEventListeners()
  }

  /**
   * 设置事件监听器以实现实时更新
   */
  setupEventListeners() {
    // 监听storage事件（跨标签页同步）
    window.addEventListener('storage', (e) => {
      if (e.key && e.key.startsWith('lifeflow_')) {
        this.refresh()
      }
    })

    // 监听自定义事件（同页面内更新）
    window.addEventListener('lifeflow:task:updated', () => this.loadLifeTasks())
    window.addEventListener('lifeflow:exercise:updated', () => this.loadExerciseGoals())
    window.addEventListener('lifeflow:learning:updated', () => this.loadLearningGoals())
    window.addEventListener('lifeflow:activity:updated', (e) => {
      // 新的Activity系统事件
      if (e.detail && e.detail.type === 'exercise') {
        this.loadExerciseGoals()
      } else if (e.detail && e.detail.type === 'learning') {
        this.loadLearningGoals()
      } else {
        // 如果没有指定类型，刷新所有
        this.loadExerciseGoals()
        this.loadLearningGoals()
      }
    })
    window.addEventListener('lifeflow:goal:updated', () => {
      this.loadExerciseGoals()
      this.loadLearningGoals()
    })
  }

  /**
   * 初始化面板
   */
  init() {
    this.loadAll()
    // 每30秒刷新一次
    setInterval(() => this.loadAll(), 30000)
  }

  /**
   * 加载所有待办内容
   */
  loadAll() {
    this.loadLifeTasks()
    this.loadExerciseGoals()
    this.loadLearningGoals()
  }

  /**
   * 加载生活任务
   */
  loadLifeTasks() {
    const container = document.getElementById('lifeTodos')
    if (!container) return

    // 使用用户隔离的数据
    let tasksObj = {};
    if (typeof userDataManager !== 'undefined') {
      userDataManager.migrateOldData('lifeflow_life_tasks', 'life_tasks');
      tasksObj = userDataManager.loadData('life_tasks', {});
    } else {
      tasksObj = JSON.parse(localStorage.getItem('lifeflow_life_tasks') || '{}');
    }
    const todayTasksFromObj = tasksObj[this.today] || []
    
    // 格式2: lifeflow_tasks (数组格式，使用Task模型)
    const tasksArray = JSON.parse(localStorage.getItem('lifeflow_tasks') || '[]')
    const todayTasksFromArray = tasksArray.filter(t => 
      t.date === this.today && t.type === 'life'
    )
    
    // 合并两种格式的任务
    let allTasks = []
    
    // 添加对象格式的任务
    todayTasksFromObj.forEach(task => {
      allTasks.push({
        id: task.id || `task_${Date.now()}_${Math.random()}`,
        title: task.text || task.title || '',
        completed: task.completed || false,
        source: 'obj'
      })
    })
    
    // 添加数组格式的任务
    todayTasksFromArray.forEach(task => {
      // 避免重复
      if (!allTasks.find(t => t.id === task.id)) {
        allTasks.push({
          id: task.id,
          title: task.title,
          completed: task.completed || false,
          source: 'array'
        })
      }
    })
    
    // 过滤未完成的任务
    const uncompletedTasks = allTasks.filter(t => !t.completed)

    if (uncompletedTasks.length === 0) {
      container.innerHTML = '<div class="empty-todos">✨ 暂无待办</div>'
    } else {
      container.innerHTML = uncompletedTasks.map((task) => {
        return `
          <div class="todo-item" data-task-id="${task.id}" data-task-source="${task.source}">
            <input type="checkbox" 
                   id="life-task-${task.id}" 
                   onchange="todayTodoPanel.toggleLifeTask('${task.id}', '${task.source}')">
            <label for="life-task-${task.id}" class="todo-text">${this.escapeHtml(task.title)}</label>
          </div>
        `
      }).join('')
    }
  }

  /**
   * 切换生活任务完成状态
   */
  toggleLifeTask(taskId, source) {
    if (source === 'obj') {
      // 处理对象格式的任务 - 使用用户隔离
      let tasks = {};
      if (typeof userDataManager !== 'undefined') {
        tasks = userDataManager.loadData('life_tasks', {});
      } else {
        tasks = JSON.parse(localStorage.getItem('lifeflow_life_tasks') || '{}');
      }
      
      if (tasks[this.today]) {
        const taskIndex = tasks[this.today].findIndex(t => 
          (t.id && t.id === taskId) || (!t.id && `task_${t.text}` === taskId)
        )
        if (taskIndex !== -1) {
          tasks[this.today][taskIndex].completed = true
          if (typeof userDataManager !== 'undefined') {
            userDataManager.saveData('life_tasks', tasks);
          } else {
            localStorage.setItem('lifeflow_life_tasks', JSON.stringify(tasks));
          }
        }
      }
    } else if (source === 'array') {
      // 处理数组格式的任务
      const tasks = JSON.parse(localStorage.getItem('lifeflow_tasks') || '[]')
      const taskIndex = tasks.findIndex(t => t.id === taskId)
      if (taskIndex !== -1) {
        tasks[taskIndex].completed = true
        localStorage.setItem('lifeflow_tasks', JSON.stringify(tasks))
      }
    }
    
    // 添加成功动画
    const taskElement = document.querySelector(`[data-task-id="${taskId}"]`)
    if (taskElement) {
      taskElement.classList.add('success-animation')
      setTimeout(() => {
        this.loadLifeTasks()
        // 触发更新事件
        window.dispatchEvent(new CustomEvent('lifeflow:task:updated'))
      }, 300)
    }
  }

  /**
   * 加载运动目标
   */
  loadExerciseGoals() {
    const container = document.getElementById('exerciseGoals')
    if (!container) return

    // 使用 StorageManager 读取用户隔离的数据
    let activities = []
    if (typeof StorageManager !== 'undefined') {
      const storageManager = new StorageManager()
      activities = storageManager.loadActivities('exercise')
    } else {
      // 降级到旧方式
      const activitiesData = localStorage.getItem('lifeflow_exercise_activities')
      if (activitiesData) {
        try {
          activities = JSON.parse(activitiesData)
        } catch (e) {
          console.error('Error parsing exercise activities:', e)
        }
      }
    }
    
    // 计算今日已完成的运动时长
    const todayActivities = activities.filter(a => a.date === this.today && a.completed)
    const totalMinutes = todayActivities.reduce((sum, a) => sum + (a.duration || 0), 0)
    
    // 获取每日目标
    let targetMinutes = 60
    if (typeof StorageManager !== 'undefined') {
      const storageManager = new StorageManager()
      targetMinutes = storageManager.loadDailyGoal('exercise')
    } else {
      targetMinutes = parseInt(localStorage.getItem('lifeflow_exercise_daily_goal') || '60', 10)
    }
    
    const progress = Math.min(100, (totalMinutes / targetMinutes) * 100)
    const completed = progress >= 100

    // 加载自定义目标
    const customGoals = JSON.parse(localStorage.getItem('lifeflow_custom_exercise_goals') || '[]')
    const todayCustomGoals = customGoals.filter(g => g.date === this.today)

    let html = `
      <div class="goal-progress ${completed ? 'completed' : ''}">
        <div class="goal-title">
          ${completed ? '✅' : '⏱️'} 每日运动
        </div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${progress}%"></div>
        </div>
        <div class="progress-text">
          <span>${totalMinutes} / ${targetMinutes} 分钟</span>
          <span class="progress-check">${Math.round(progress)}%</span>
        </div>
      </div>
    `

    // 添加自定义目标
    if (todayCustomGoals.length > 0) {
      todayCustomGoals.forEach(goal => {
        const goalProgress = Math.min(100, (goal.current / goal.target) * 100)
        const goalCompleted = goalProgress >= 100
        html += `
          <div class="goal-progress ${goalCompleted ? 'completed' : ''}" style="margin-top: 12px;">
            <div class="goal-title">
              ${goalCompleted ? '✅' : '🎯'} ${this.escapeHtml(goal.name)}
            </div>
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${goalProgress}%"></div>
            </div>
            <div class="progress-text">
              <span>${goal.current} / ${goal.target} ${goal.unit}</span>
              <span class="progress-check">${Math.round(goalProgress)}%</span>
            </div>
          </div>
        `
      })
    }

    container.innerHTML = html
  }

  /**
   * 加载学习目标
   */
  loadLearningGoals() {
    const container = document.getElementById('learningGoals')
    if (!container) return

    // 使用 StorageManager 读取用户隔离的数据
    let activities = []
    let targetMinutes = 60
    
    if (typeof StorageManager !== 'undefined') {
      const storageManager = new StorageManager()
      activities = storageManager.loadActivities('learning')
      targetMinutes = storageManager.loadDailyGoal('learning')
    } else {
      // 降级到旧方式
      const activitiesData = localStorage.getItem('lifeflow_learning_activities')
      if (activitiesData) {
        try {
          activities = JSON.parse(activitiesData)
        } catch (e) {
          console.error('Error parsing learning activities:', e)
        }
      }
      targetMinutes = parseInt(localStorage.getItem('lifeflow_learning_daily_goal') || '60', 10)
    }
    
    // 计算今日已完成的学习时长
    const todayActivities = activities.filter(a => a.date === this.today && a.completed)
    const totalMinutes = todayActivities.reduce((sum, a) => sum + (a.duration || 0), 0)
    
    const progress = Math.min(100, (totalMinutes / targetMinutes) * 100)
    const completed = progress >= 100

    // 加载自定义目标
    const customGoals = JSON.parse(localStorage.getItem('lifeflow_custom_learning_goals') || '[]')
    const todayCustomGoals = customGoals.filter(g => g.date === this.today)

    let html = `
      <div class="goal-progress ${completed ? 'completed' : ''}">
        <div class="goal-title">
          ${completed ? '✅' : '📖'} 每日学习
        </div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${progress}%; background: linear-gradient(90deg, #2196F3, #64B5F6);"></div>
        </div>
        <div class="progress-text">
          <span>${totalMinutes} / ${targetMinutes} 分钟</span>
          <span class="progress-check">${Math.round(progress)}%</span>
        </div>
      </div>
    `

    // 添加自定义目标
    if (todayCustomGoals.length > 0) {
      todayCustomGoals.forEach(goal => {
        const goalProgress = Math.min(100, (goal.current / goal.target) * 100)
        const goalCompleted = goalProgress >= 100
        html += `
          <div class="goal-progress ${goalCompleted ? 'completed' : ''}" style="margin-top: 12px;">
            <div class="goal-title">
              ${goalCompleted ? '✅' : '🎯'} ${this.escapeHtml(goal.name)}
            </div>
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${goalProgress}%; background: linear-gradient(90deg, #2196F3, #64B5F6);"></div>
            </div>
            <div class="progress-text">
              <span>${goal.current} / ${goal.target} ${goal.unit}</span>
              <span class="progress-check">${Math.round(goalProgress)}%</span>
            </div>
          </div>
        `
      })
    }

    container.innerHTML = html
  }

  /**
   * 转义HTML以防止XSS
   */
  escapeHtml(text) {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }

  /**
   * 手动刷新所有数据
   */
  refresh() {
    this.today = new Date().toISOString().split('T')[0]
    this.loadAll()
  }
}

// 创建全局实例
let todayTodoPanel

// 页面加载完成后初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    todayTodoPanel = new TodayTodoPanel()
    todayTodoPanel.init()
  })
} else {
  todayTodoPanel = new TodayTodoPanel()
  todayTodoPanel.init()
}
