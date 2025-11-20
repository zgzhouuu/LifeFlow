/**
 * TaskEditor - 任务编辑器组件
 * 提供任务编辑功能，与Calendar组件集成
 * 支持编辑任务标题、备注、奖励和日期
 */
class TaskEditor {
  constructor(storageManager = null) {
    this.storageManager = storageManager
    this.currentTask = null
    this.currentTaskId = null
    this.currentDate = null
    this.currentIndex = null
    this.initModal()
  }

  /**
   * 初始化编辑模态框
   */
  initModal() {
    // 创建模态框HTML
    const modalHTML = `
      <div class="edit-modal" id="editTaskModal">
        <div class="modal-overlay" onclick="taskEditor.closeModal()"></div>
        <div class="modal-content">
          <div class="modal-header">
            <h3>✏️ 编辑任务</h3>
            <button class="modal-close" onclick="taskEditor.closeModal()">×</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label for="editTaskTitle">任务标题 *</label>
              <input type="text" id="editTaskTitle" class="form-input" placeholder="输入任务标题" required>
            </div>
            <div class="form-group">
              <label for="editTaskNotes">备注</label>
              <textarea id="editTaskNotes" class="form-input" rows="3" placeholder="添加备注信息"></textarea>
            </div>
            <div class="form-group">
              <label for="editTaskReward">奖励</label>
              <input type="text" id="editTaskReward" class="form-input" placeholder="完成后的奖励">
            </div>
            <div class="form-group">
              <label for="editTaskDate">日期 *</label>
              <input type="date" id="editTaskDate" class="form-input" required>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="taskEditor.closeModal()">取消</button>
            <button class="btn btn-primary" onclick="taskEditor.saveEdit()">保存</button>
          </div>
        </div>
      </div>
    `

    // 添加到页面
    if (!document.getElementById('editTaskModal')) {
      document.body.insertAdjacentHTML('beforeend', modalHTML)
    }

    // 添加样式
    this.addStyles()
  }

  /**
   * 添加模态框样式
   */
  addStyles() {
    if (document.getElementById('taskEditorStyles')) return

    const styles = `
      <style id="taskEditorStyles">
        .edit-modal {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 10000;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 200ms ease;
        }

        .edit-modal.show {
          opacity: 1;
        }

        .modal-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
        }

        .modal-content {
          position: relative;
          background: white;
          border-radius: 16px;
          width: 90%;
          max-width: 500px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          transform: scale(0.9);
          transition: transform 200ms ease;
        }

        .edit-modal.show .modal-content {
          transform: scale(1);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px;
          border-bottom: 1px solid #E0E6ED;
        }

        .modal-header h3 {
          margin: 0;
          color: #2C3E50;
          font-size: 20px;
        }

        .modal-close {
          background: none;
          border: none;
          font-size: 32px;
          color: #7F8C8D;
          cursor: pointer;
          padding: 0;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: all 150ms ease;
        }

        .modal-close:hover {
          background: #F5F7FA;
          color: #2C3E50;
        }

        .modal-body {
          padding: 24px;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          margin-bottom: 8px;
          color: #2C3E50;
          font-weight: 500;
          font-size: 14px;
        }

        .form-input {
          width: 100%;
          padding: 12px;
          border: 1px solid #E0E6ED;
          border-radius: 8px;
          font-size: 14px;
          font-family: inherit;
          transition: all 150ms ease;
        }

        .form-input:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        textarea.form-input {
          resize: vertical;
          min-height: 80px;
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding: 24px;
          border-top: 1px solid #E0E6ED;
        }

        .btn {
          padding: 10px 20px;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 150ms ease;
        }

        .btn-secondary {
          background: #F5F7FA;
          color: #2C3E50;
        }

        .btn-secondary:hover {
          background: #E0E6ED;
        }

        .btn-primary {
          background: #667eea;
          color: white;
        }

        .btn-primary:hover {
          background: #5568d3;
        }

        .task-actions {
          display: flex;
          gap: 8px;
          margin-left: auto;
        }

        .task-edit,
        .task-delete {
          padding: 6px 12px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
          transition: all 150ms ease;
        }

        .task-edit {
          background: #3498db;
          color: white;
        }

        .task-edit:hover {
          background: #2980b9;
          transform: scale(1.05);
        }

        .task-delete {
          background: #e74c3c;
          color: white;
        }

        .task-delete:hover {
          background: #c0392b;
          transform: scale(1.05);
        }
      </style>
    `

    document.head.insertAdjacentHTML('beforeend', styles)
  }

  /**
   * 打开编辑模态框
   * @param {string} dateOrTaskId - 日期或任务ID
   * @param {number} index - 索引 (可选，用于旧格式)
   */
  openEditModal(dateOrTaskId, index = null) {
    console.log('openEditModal called with:', dateOrTaskId, index);
    let task = null
    
    // 获取当前用户
    const currentUser = localStorage.getItem('lifeflow_current_user') || 'default'
    
    // 判断是新格式还是旧格式
    // 新格式: taskId 包含 '-' (UUID格式)
    // 旧格式: date 是日期字符串 (YYYY-MM-DD)，index 是数字
    
    if (typeof dateOrTaskId === 'string' && dateOrTaskId.includes('-') && index === null) {
      // 新格式: 使用 Task 模型
      const allTasks = JSON.parse(localStorage.getItem('lifeflow_tasks') || '[]')
      task = allTasks.find(t => t.id === dateOrTaskId)
      
      if (task) {
        this.currentTaskId = dateOrTaskId
        this.currentTask = task
        this.currentDate = task.date
        this.currentIndex = null
        console.log('Found task in new format:', task);
      }
    } else if (index !== null) {
      // 旧格式: 使用日期和索引，支持用户隔离
      const date = dateOrTaskId
      
      // 尝试用户隔离的键
      const userKey = `lifeflow_${currentUser}_life_tasks`
      let tasks = JSON.parse(localStorage.getItem(userKey) || '{}')
      
      // 如果用户隔离的键没有数据，尝试旧的全局键
      if (Object.keys(tasks).length === 0) {
        tasks = JSON.parse(localStorage.getItem('lifeflow_life_tasks') || '{}')
      }
      
      console.log('Looking for task in old format:', date, index);
      console.log('Using storage key:', userKey);
      console.log('Available tasks:', tasks);
      
      if (!tasks[date] || !tasks[date][index]) {
        console.error('Task not found:', date, index);
        console.error('Tasks for date:', tasks[date]);
        alert('任务不存在，无法编辑')
        return
      }

      task = tasks[date][index]
      this.currentTask = task
      this.currentDate = date
      this.currentIndex = index
      this.currentTaskId = null
      console.log('Found task in old format:', task);
    }
    
    if (!task) {
      console.error('Task not found');
      alert('任务不存在，无法编辑')
      return
    }

    // 填充表单 - 兼容新旧格式
    const titleValue = task.title || task.text || ''
    const notesValue = task.notes || task.note || ''
    const rewardValue = task.reward || ''
    
    console.log('Filling form with:', { titleValue, notesValue, rewardValue, date: this.currentDate });
    
    document.getElementById('editTaskTitle').value = titleValue
    document.getElementById('editTaskNotes').value = notesValue
    document.getElementById('editTaskReward').value = rewardValue
    document.getElementById('editTaskDate').value = this.currentDate

    // 显示模态框
    const modal = document.getElementById('editTaskModal')
    modal.style.display = 'flex'
    setTimeout(() => {
      modal.classList.add('show')
    }, 10)
    
    console.log('Modal opened');
    
    // 聚焦到标题输入框
    setTimeout(() => {
      document.getElementById('editTaskTitle').focus()
    }, 100)
  }

  /**
   * 关闭模态框
   */
  closeModal() {
    const modal = document.getElementById('editTaskModal')
    modal.classList.remove('show')
    
    // 等待动画完成后隐藏
    setTimeout(() => {
      modal.style.display = 'none'
      
      // 清空表单
      document.getElementById('editTaskTitle').value = ''
      document.getElementById('editTaskNotes').value = ''
      document.getElementById('editTaskReward').value = ''
      document.getElementById('editTaskDate').value = ''
      
      // 清空当前任务信息
      this.currentTask = null
      this.currentDate = null
      this.currentIndex = null
      this.currentTaskId = null
    }, 200)
  }

  /**
   * 保存编辑
   * 支持新旧两种数据格式
   */
  saveEdit() {
    const title = document.getElementById('editTaskTitle').value.trim()
    const notes = document.getElementById('editTaskNotes').value.trim()
    const reward = document.getElementById('editTaskReward').value.trim()
    const newDate = document.getElementById('editTaskDate').value

    // 验证
    if (!title) {
      alert('请输入任务标题')
      document.getElementById('editTaskTitle').focus()
      return
    }

    if (!newDate) {
      alert('请选择日期')
      document.getElementById('editTaskDate').focus()
      return
    }

    // 获取当前用户
    const currentUser = localStorage.getItem('lifeflow_current_user') || 'default'

    // 如果是新格式 (Task模型)
    if (this.currentTaskId) {
      const allTasks = JSON.parse(localStorage.getItem('lifeflow_tasks') || '[]')
      const taskIndex = allTasks.findIndex(t => t.id === this.currentTaskId)
      
      if (taskIndex !== -1) {
        // 更新任务属性
        allTasks[taskIndex].title = title
        allTasks[taskIndex].notes = notes
        allTasks[taskIndex].reward = reward
        allTasks[taskIndex].date = newDate
        
        // 保存到localStorage
        localStorage.setItem('lifeflow_tasks', JSON.stringify(allTasks))
      }
    } else {
      // 旧格式 (lifeflow_life_tasks)，支持用户隔离
      const userKey = `lifeflow_${currentUser}_life_tasks`
      let tasks = JSON.parse(localStorage.getItem(userKey) || '{}')
      
      // 如果用户隔离的键没有数据，尝试从旧的全局键读取
      if (Object.keys(tasks).length === 0) {
        tasks = JSON.parse(localStorage.getItem('lifeflow_life_tasks') || '{}')
      }

      console.log('Saving task with key:', userKey);
      console.log('Current tasks:', tasks);

      // 如果日期改变了，需要移动任务
      if (newDate !== this.currentDate) {
        // 从原日期删除
        if (tasks[this.currentDate]) {
          tasks[this.currentDate].splice(this.currentIndex, 1)
          if (tasks[this.currentDate].length === 0) {
            delete tasks[this.currentDate]
          }
        }

        // 添加到新日期
        if (!tasks[newDate]) {
          tasks[newDate] = []
        }
        
        tasks[newDate].push({
          text: title,
          notes: notes,
          reward: reward,
          completed: this.currentTask.completed || false,
          note: notes // 兼容旧的note字段
        })
      } else {
        // 同一日期，直接更新
        if (tasks[this.currentDate] && tasks[this.currentDate][this.currentIndex]) {
          tasks[this.currentDate][this.currentIndex].text = title
          tasks[this.currentDate][this.currentIndex].notes = notes
          tasks[this.currentDate][this.currentIndex].reward = reward
          tasks[this.currentDate][this.currentIndex].note = notes // 兼容旧的note字段
        }
      }

      // 保存到用户隔离的键
      localStorage.setItem(userKey, JSON.stringify(tasks))
      console.log('Task saved successfully');
    }

    // 触发更新事件以通知其他组件
    window.dispatchEvent(new CustomEvent('lifeflow:task:updated'))

    // 关闭模态框
    this.closeModal()

    // 刷新显示 - 尝试多种刷新方式
    // 1. 如果有全局的renderCalendar函数
    if (typeof renderCalendar === 'function') {
      renderCalendar()
    }
    
    // 2. 如果有全局的calendar实例
    if (typeof window.lifeCalendar !== 'undefined' && window.lifeCalendar) {
      window.lifeCalendar.render()
      if (window.lifeCalendar.expandedDate) {
        window.lifeCalendar.expandTaskList(window.lifeCalendar.expandedDate)
      }
    }
    
    // 3. 如果在首页，刷新今日待办
    if (typeof todayTodoPanel !== 'undefined' && todayTodoPanel) {
      todayTodoPanel.refresh()
    }

    // 显示成功提示
    this.showSuccessMessage('任务已更新')
  }

  /**
   * 显示成功消息
   */
  showSuccessMessage(message) {
    const toast = document.createElement('div')
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #27AE60;
      color: white;
      padding: 16px 24px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10001;
      animation: slideIn 300ms ease;
    `
    toast.textContent = `✓ ${message}`
    document.body.appendChild(toast)

    setTimeout(() => {
      toast.style.animation = 'slideOut 300ms ease'
      setTimeout(() => toast.remove(), 300)
    }, 2000)
  }
}

// 创建全局实例
const taskEditor = new TaskEditor()

// 添加动画样式
if (!document.getElementById('taskEditorAnimations')) {
  const animations = `
    <style id="taskEditorAnimations">
      @keyframes slideIn {
        from {
          transform: translateX(400px);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }

      @keyframes slideOut {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(400px);
          opacity: 0;
        }
      }
    </style>
  `
  document.head.insertAdjacentHTML('beforeend', animations)
}
