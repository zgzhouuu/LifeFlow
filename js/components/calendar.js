import { formatDate } from '../utils/dateUtils.js';
import { Task, ValidationError } from '../models/Task.js';
import { Reflection } from '../models/Reflection.js';
import { sanitizeInput } from '../utils/sanitizer.js';

/**
 * Calendar Component
 * Displays a monthly calendar view for life, exercise, or learning management
 * Supports task management, color labels, and daily reflections
 */
class Calendar {
  constructor(containerId, type, storageManager) {
    this.containerId = containerId;
    this.type = type; // 'life' | 'exercise' | 'learning'
    this.storageManager = storageManager;
    this.currentYear = new Date().getFullYear();
    this.currentMonth = new Date().getMonth(); // 0-11
    this.expandedDate = null; // Currently expanded date
    this.monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', 
                       '七月', '八月', '九月', '十月', '十一月', '十二月'];
    this.dayNames = ['日', '一', '二', '三', '四', '五', '六'];
  }

  /**
   * Renders the calendar for the current month
   */
  render(year = this.currentYear, month = this.currentMonth) {
    this.currentYear = year;
    this.currentMonth = month;

    const container = document.getElementById(this.containerId);
    if (!container) {
      console.error(`Container with id "${this.containerId}" not found`);
      return;
    }

    container.innerHTML = `
      <div class="calendar-container">
        <div class="calendar-header">
          <button class="calendar-nav-btn" id="prev-month-${this.type}">
            <span>&lt;</span>
          </button>
          <h2 class="calendar-title">${this.currentYear}年 ${this.monthNames[this.currentMonth]}</h2>
          <button class="calendar-nav-btn" id="next-month-${this.type}">
            <span>&gt;</span>
          </button>
        </div>
        <div class="calendar-grid">
          ${this.renderDayHeaders()}
          ${this.renderDays()}
        </div>
        <div id="task-detail-${this.type}" class="task-detail-panel"></div>
        <div id="task-modal-${this.type}" class="task-modal hidden"></div>
      </div>
    `;

    this.attachEventListeners();
  }

  /**
   * Renders day headers (Sun-Sat)
   */
  renderDayHeaders() {
    return this.dayNames.map(day => 
      `<div class="calendar-day-header">${day}</div>`
    ).join('');
  }

  /**
   * Renders the calendar grid with days
   */
  renderDays() {
    const firstDay = new Date(this.currentYear, this.currentMonth, 1);
    const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay(); // 0 = Sunday

    let daysHTML = '';

    // Empty cells before the first day
    for (let i = 0; i < startingDayOfWeek; i++) {
      daysHTML += '<div class="calendar-day empty"></div>';
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = formatDate(new Date(this.currentYear, this.currentMonth, day));
      const isToday = date === formatDate(new Date());
      const tasks = this.getTasksForDate(date);
      const reflection = this.getReflectionForDate(date);
      const hasTask = tasks.length > 0;
      const hasReflection = reflection !== null;
      const colorLabel = this.getDateColor(date);

      let dayClasses = 'calendar-day';
      if (isToday) dayClasses += ' today';
      if (hasTask) dayClasses += ' has-task';
      if (hasReflection) dayClasses += ' has-reflection';
      if (this.expandedDate === date) dayClasses += ' expanded';

      let dayStyle = '';
      if (colorLabel) {
        dayStyle = `style="border: 2px solid ${colorLabel}; background-color: ${colorLabel}20;"`;
      }

      daysHTML += `
        <div class="${dayClasses}" data-date="${date}" ${dayStyle}>
          <div class="calendar-day-number">${day}</div>
          ${hasTask ? '<div class="calendar-indicator task-indicator"></div>' : ''}
          ${hasReflection ? '<div class="calendar-indicator reflection-indicator"></div>' : ''}
        </div>
      `;
    }

    return daysHTML;
  }

  /**
   * Attaches event listeners to calendar elements
   */
  attachEventListeners() {
    // Navigation buttons
    const prevBtn = document.getElementById(`prev-month-${this.type}`);
    const nextBtn = document.getElementById(`next-month-${this.type}`);

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        this.currentMonth--;
        if (this.currentMonth < 0) {
          this.currentMonth = 11;
          this.currentYear--;
        }
        this.render();
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        this.currentMonth++;
        if (this.currentMonth > 11) {
          this.currentMonth = 0;
          this.currentYear++;
        }
        this.render();
      });
    }

    // Day click handlers
    const days = document.querySelectorAll(`#${this.containerId} .calendar-day:not(.empty)`);
    days.forEach(day => {
      day.addEventListener('click', (e) => {
        const date = day.getAttribute('data-date');
        if (date) {
          this.handleDateClick(date);
        }
      });
    });
  }

  /**
   * Gets tasks for a specific date
   */
  getTasksForDate(date) {
    const allTasks = this.storageManager.loadTasks();
    return allTasks.filter(task => task.date === date && task.type === this.type);
  }

  /**
   * Gets reflection for a specific date
   */
  getReflectionForDate(date) {
    const allReflections = this.storageManager.loadReflections();
    return allReflections.find(r => r.date === date && r.type === this.type) || null;
  }

  /**
   * Gets the color label for a date
   */
  getDateColor(date) {
    const tasks = this.getTasksForDate(date);
    // Return the color of the first task that has a color
    const taskWithColor = tasks.find(task => task.color);
    return taskWithColor ? taskWithColor.color : null;
  }

  /**
   * Handles date click events
   * Toggles expansion of task list and reflection for the clicked date
   * @param {string} date - Date in YYYY-MM-DD format
   */
  handleDateClick(date) {
    if (this.expandedDate === date) {
      // Clicking the same date collapses it
      this.collapseTaskList(date);
    } else {
      // Collapse previous date if any
      if (this.expandedDate) {
        this.collapseTaskList(this.expandedDate);
      }
      // Expand the new date
      this.expandTaskList(date);
    }
  }

  /**
   * Displays date indicators (dots) on dates with tasks
   * This is automatically handled in the renderDays() method
   * which adds indicator dots for tasks and reflections
   */
  displayDateIndicators() {
    // Indicators are rendered inline in renderDays()
    // Task indicator: orange dot
    // Reflection indicator: green dot
  }

  /**
   * Sets a color label for a date
   * Updates the first task for that date with the specified color
   * @param {string} date - Date in YYYY-MM-DD format
   * @param {string} color - Hex color code (e.g., '#FF0000')
   */
  setDateColor(date, color) {
    const allTasks = this.storageManager.loadTasks();
    const tasksForDate = allTasks.filter(task => task.date === date && task.type === this.type);
    
    if (tasksForDate.length === 0) {
      // No tasks for this date, create a placeholder task with just the color
      const colorTask = new Task({
        date: date,
        type: this.type,
        title: '重要日期',
        color: color
      });
      allTasks.push(colorTask.toJSON());
    } else {
      // Update all tasks for this date with the color
      tasksForDate.forEach(task => {
        const taskIndex = allTasks.findIndex(t => t.id === task.id);
        if (taskIndex !== -1) {
          allTasks[taskIndex].color = color;
        }
      });
    }
    
    this.storageManager.saveTasks(allTasks);
    this.render(); // Re-render to show the color
  }

  /**
   * Expands task list for a date
   * Shows tasks with checkboxes and reflection input
   * @param {string} date - Date in YYYY-MM-DD format
   */
  expandTaskList(date) {
    this.expandedDate = date;
    const tasks = this.getTasksForDate(date);
    const reflection = this.getReflectionForDate(date);
    const detailPanel = document.getElementById(`task-detail-${this.type}`);
    
    if (!detailPanel) return;

    // Update calendar day styling
    const allDays = document.querySelectorAll(`#${this.containerId} .calendar-day`);
    allDays.forEach(day => day.classList.remove('expanded'));
    const clickedDay = document.querySelector(`#${this.containerId} .calendar-day[data-date="${date}"]`);
    if (clickedDay) {
      clickedDay.classList.add('expanded');
    }

    // Build the detail panel content
    let content = `
      <div class="task-detail-header">
        <h3 class="task-detail-title">${date}</h3>
        <button class="task-detail-close" data-action="close">&times;</button>
      </div>
    `;

    if (tasks.length > 0) {
      content += `
        <div class="task-list">
          ${this.renderTaskCheckboxes(tasks)}
        </div>
      `;
    } else {
      content += `
        <button class="add-task-btn" data-action="add-task" data-date="${date}">
          + 添加任务
        </button>
      `;
    }

    // Add color picker section
    content += `
      <div class="color-picker-section" style="margin-bottom: 16px;">
        <label class="form-label">设置日期颜色标签：</label>
        <div class="color-picker-group">
          <div class="color-option" style="background: #FF0000;" data-color="#FF0000" title="红色"></div>
          <div class="color-option" style="background: #FF8C42;" data-color="#FF8C42" title="橙色"></div>
          <div class="color-option" style="background: #FFD700;" data-color="#FFD700" title="金色"></div>
          <div class="color-option" style="background: #4CAF50;" data-color="#4CAF50" title="绿色"></div>
          <div class="color-option" style="background: #2196F3;" data-color="#2196F3" title="蓝色"></div>
          <div class="color-option" style="background: #9C27B0;" data-color="#9C27B0" title="紫色"></div>
          <div class="color-option" style="background: transparent; border: 2px solid #ccc;" data-color="" title="清除颜色"></div>
        </div>
      </div>
    `;

    // Add reflection section
    content += this.renderReflectionInput(date, reflection);

    detailPanel.innerHTML = content;
    detailPanel.classList.add('visible');

    // Attach event listeners
    this.attachDetailPanelListeners(date);
  }

  /**
   * Collapses task list
   * Hides the task detail panel
   * @param {string} date - Date in YYYY-MM-DD format
   */
  collapseTaskList(date) {
    this.expandedDate = null;
    const detailPanel = document.getElementById(`task-detail-${this.type}`);
    
    if (detailPanel) {
      detailPanel.classList.remove('visible');
      detailPanel.innerHTML = '';
    }

    // Remove expanded styling from calendar day
    const allDays = document.querySelectorAll(`#${this.containerId} .calendar-day`);
    allDays.forEach(day => day.classList.remove('expanded'));
  }

  /**
   * Renders task checkboxes
   * @param {Array} tasks - Array of task objects
   * @returns {string} HTML string for task checkboxes
   */
  renderTaskCheckboxes(tasks) {
    return tasks.map(task => `
      <div class="task-item ${task.completed ? 'completed' : ''}" data-task-id="${task.id}">
        <input 
          type="checkbox" 
          class="task-checkbox" 
          ${task.completed ? 'checked' : ''}
          data-task-id="${task.id}"
        />
        <div class="task-item-content">
          <div class="task-item-title">${sanitizeInput(task.title)}</div>
          ${task.notes ? `<div class="task-item-notes">${sanitizeInput(task.notes)}</div>` : ''}
          ${task.reward ? `<div class="task-item-reward">奖励: ${sanitizeInput(task.reward)}</div>` : ''}
        </div>
        <div class="task-item-actions">
          <button class="task-action-btn edit" data-action="edit-task" data-task-id="${task.id}">编辑</button>
          <button class="task-action-btn delete" data-action="delete-task" data-task-id="${task.id}">删除</button>
        </div>
      </div>
    `).join('');
  }

  /**
   * Attaches event listeners to the detail panel
   * @param {string} date - Current date
   */
  attachDetailPanelListeners(date) {
    const detailPanel = document.getElementById(`task-detail-${this.type}`);
    if (!detailPanel) return;

    // Close button
    const closeBtn = detailPanel.querySelector('[data-action="close"]');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.collapseTaskList(date));
    }

    // Add task button
    const addBtn = detailPanel.querySelector('[data-action="add-task"]');
    if (addBtn) {
      addBtn.addEventListener('click', () => this.showTaskModal(date, 'add'));
    }

    // Task checkboxes
    const checkboxes = detailPanel.querySelectorAll('.task-checkbox');
    checkboxes.forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        const taskId = e.target.getAttribute('data-task-id');
        this.toggleTaskCompletion(taskId);
      });
    });

    // Edit buttons
    const editBtns = detailPanel.querySelectorAll('[data-action="edit-task"]');
    editBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const taskId = e.target.getAttribute('data-task-id');
        this.showTaskModal(date, 'edit', taskId);
      });
    });

    // Delete buttons
    const deleteBtns = detailPanel.querySelectorAll('[data-action="delete-task"]');
    deleteBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const taskId = e.target.getAttribute('data-task-id');
        if (confirm('确定要删除这个任务吗？')) {
          this.deleteTask(taskId);
        }
      });
    });

    // Color picker
    const colorOptions = detailPanel.querySelectorAll('.color-option');
    colorOptions.forEach(option => {
      option.addEventListener('click', (e) => {
        const color = e.target.getAttribute('data-color');
        this.setDateColor(date, color);
        // Update selected state
        colorOptions.forEach(opt => opt.classList.remove('selected'));
        e.target.classList.add('selected');
      });
    });

    // Reflection save button
    const reflectionSaveBtn = detailPanel.querySelector('.reflection-save-btn');
    if (reflectionSaveBtn) {
      reflectionSaveBtn.addEventListener('click', () => {
        const textarea = detailPanel.querySelector('.reflection-textarea');
        if (textarea) {
          this.saveReflection(date, textarea.value);
        }
      });
    }
  }

  /**
   * Shows task modal for add/edit
   * @param {string} date - Date in YYYY-MM-DD format
   * @param {string} mode - 'add' or 'edit'
   * @param {string} taskId - Task ID (required for edit mode)
   */
  showTaskModal(date, mode, taskId = null) {
    const modal = document.getElementById(`task-modal-${this.type}`);
    if (!modal) return;

    let task = null;
    if (mode === 'edit' && taskId) {
      const allTasks = this.storageManager.loadTasks();
      task = allTasks.find(t => t.id === taskId);
      if (!task) {
        console.error('Task not found:', taskId);
        return;
      }
    }

    const modalTitle = mode === 'add' ? '添加任务' : '编辑任务';
    const submitBtnText = mode === 'add' ? '添加' : '保存';

    modal.innerHTML = `
      <div class="task-modal-content">
        <div class="task-modal-header">
          <h2 class="task-modal-title">${modalTitle}</h2>
          <button class="task-modal-close" data-action="close-modal">&times;</button>
        </div>
        <form class="task-form" id="task-form-${this.type}">
          <div class="form-group">
            <label class="form-label">任务标题 *</label>
            <input 
              type="text" 
              class="form-input" 
              id="task-title-${this.type}" 
              value="${task ? sanitizeInput(task.title) : ''}"
              placeholder="输入任务标题"
              required
            />
          </div>
          <div class="form-group">
            <label class="form-label">备注</label>
            <textarea 
              class="form-textarea" 
              id="task-notes-${this.type}"
              placeholder="添加备注信息"
            >${task ? sanitizeInput(task.notes) : ''}</textarea>
          </div>
          <div class="form-group">
            <label class="form-label">奖励</label>
            <input 
              type="text" 
              class="form-input" 
              id="task-reward-${this.type}"
              value="${task ? sanitizeInput(task.reward) : ''}"
              placeholder="完成后的奖励"
            />
          </div>
          <div class="form-group">
            <label class="form-label">日期颜色标签</label>
            <div class="color-picker-group">
              <div class="color-option ${!task || !task.color ? 'selected' : ''}" style="background: transparent; border: 2px solid #ccc;" data-color="" title="无颜色"></div>
              <div class="color-option ${task && task.color === '#FF0000' ? 'selected' : ''}" style="background: #FF0000;" data-color="#FF0000" title="红色"></div>
              <div class="color-option ${task && task.color === '#FF8C42' ? 'selected' : ''}" style="background: #FF8C42;" data-color="#FF8C42" title="橙色"></div>
              <div class="color-option ${task && task.color === '#FFD700' ? 'selected' : ''}" style="background: #FFD700;" data-color="#FFD700" title="金色"></div>
              <div class="color-option ${task && task.color === '#4CAF50' ? 'selected' : ''}" style="background: #4CAF50;" data-color="#4CAF50" title="绿色"></div>
              <div class="color-option ${task && task.color === '#2196F3' ? 'selected' : ''}" style="background: #2196F3;" data-color="#2196F3" title="蓝色"></div>
              <div class="color-option ${task && task.color === '#9C27B0' ? 'selected' : ''}" style="background: #9C27B0;" data-color="#9C27B0" title="紫色"></div>
            </div>
            <input type="hidden" id="task-color-${this.type}" value="${task ? task.color || '' : ''}" />
          </div>
          <div class="form-actions">
            <button type="button" class="form-btn form-btn-secondary" data-action="cancel">取消</button>
            <button type="submit" class="form-btn form-btn-primary">${submitBtnText}</button>
          </div>
        </form>
      </div>
    `;

    modal.classList.remove('hidden');

    // Attach event listeners
    this.attachModalListeners(modal, date, mode, taskId);
  }

  /**
   * Attaches event listeners to modal elements
   */
  attachModalListeners(modal, date, mode, taskId) {
    // Close button
    const closeBtn = modal.querySelector('[data-action="close-modal"]');
    const cancelBtn = modal.querySelector('[data-action="cancel"]');
    
    const closeModal = () => {
      modal.classList.add('hidden');
      modal.innerHTML = '';
    };

    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

    // Click outside to close
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });

    // Color picker
    const colorOptions = modal.querySelectorAll('.color-option');
    const colorInput = modal.querySelector(`#task-color-${this.type}`);
    
    colorOptions.forEach(option => {
      option.addEventListener('click', (e) => {
        const color = e.target.getAttribute('data-color');
        colorInput.value = color;
        colorOptions.forEach(opt => opt.classList.remove('selected'));
        e.target.classList.add('selected');
      });
    });

    // Form submission
    const form = modal.querySelector(`#task-form-${this.type}`);
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const title = document.getElementById(`task-title-${this.type}`).value.trim();
        const notes = document.getElementById(`task-notes-${this.type}`).value.trim();
        const reward = document.getElementById(`task-reward-${this.type}`).value.trim();
        const color = document.getElementById(`task-color-${this.type}`).value;

        if (!title) {
          alert('请输入任务标题');
          return;
        }

        const taskData = {
          title,
          notes,
          reward,
          color: color || null
        };

        if (mode === 'add') {
          this.addTask(date, taskData);
        } else if (mode === 'edit') {
          this.editTask(taskId, taskData);
        }

        closeModal();
      });
    }
  }

  /**
   * Adds a new task
   * @param {string} date - Date in YYYY-MM-DD format
   * @param {Object} taskData - Task data (title, notes, reward, color)
   */
  addTask(date, taskData) {
    try {
      const task = new Task({
        date: date,
        type: this.type,
        title: taskData.title,
        notes: taskData.notes || '',
        reward: taskData.reward || '',
        color: taskData.color || null,
        completed: false
      });

      task.validate();

      const allTasks = this.storageManager.loadTasks();
      allTasks.push(task.toJSON());
      this.storageManager.saveTasks(allTasks);

      // Refresh the calendar and expand the date
      this.render();
      this.expandTaskList(date);
    } catch (error) {
      console.error('Error adding task:', error);
      alert('添加任务失败: ' + error.message);
    }
  }

  /**
   * Edits an existing task
   * @param {string} taskId - Task ID
   * @param {Object} taskData - Updated task data
   */
  editTask(taskId, taskData) {
    try {
      const allTasks = this.storageManager.loadTasks();
      const taskIndex = allTasks.findIndex(t => t.id === taskId);

      if (taskIndex === -1) {
        throw new Error('Task not found');
      }

      // Update task properties
      allTasks[taskIndex].title = taskData.title;
      allTasks[taskIndex].notes = taskData.notes || '';
      allTasks[taskIndex].reward = taskData.reward || '';
      allTasks[taskIndex].color = taskData.color || null;

      // Validate updated task
      const updatedTask = Task.fromJSON(allTasks[taskIndex]);
      updatedTask.validate();

      this.storageManager.saveTasks(allTasks);

      // Refresh the calendar and expand the date
      const date = allTasks[taskIndex].date;
      this.render();
      this.expandTaskList(date);
    } catch (error) {
      console.error('Error editing task:', error);
      alert('编辑任务失败: ' + error.message);
    }
  }

  /**
   * Deletes a task
   * @param {string} taskId - Task ID
   */
  deleteTask(taskId) {
    try {
      const allTasks = this.storageManager.loadTasks();
      const taskIndex = allTasks.findIndex(t => t.id === taskId);

      if (taskIndex === -1) {
        throw new Error('Task not found');
      }

      const date = allTasks[taskIndex].date;
      allTasks.splice(taskIndex, 1);
      this.storageManager.saveTasks(allTasks);

      // Refresh the calendar and expand the date
      this.render();
      this.expandTaskList(date);
    } catch (error) {
      console.error('Error deleting task:', error);
      alert('删除任务失败: ' + error.message);
    }
  }

  /**
   * Toggles task completion status
   * Applies strikethrough CSS effect and saves immediately
   * @param {string} taskId - Task ID
   */
  toggleTaskCompletion(taskId) {
    try {
      const allTasks = this.storageManager.loadTasks();
      const taskIndex = allTasks.findIndex(t => t.id === taskId);

      if (taskIndex === -1) {
        throw new Error('Task not found');
      }

      // Toggle completion status
      allTasks[taskIndex].completed = !allTasks[taskIndex].completed;

      // Save immediately to storage
      this.storageManager.saveTasks(allTasks);

      // Update UI without full re-render for smooth experience
      const taskItem = document.querySelector(`.task-item[data-task-id="${taskId}"]`);
      if (taskItem) {
        if (allTasks[taskIndex].completed) {
          taskItem.classList.add('completed');
        } else {
          taskItem.classList.remove('completed');
        }
      }

      // Also update the calendar day indicators
      this.render();
      if (this.expandedDate) {
        this.expandTaskList(this.expandedDate);
      }
    } catch (error) {
      console.error('Error toggling task completion:', error);
      alert('更新任务状态失败: ' + error.message);
    }
  }

  /**
   * Renders reflection input area
   * @param {string} date - Date in YYYY-MM-DD format
   * @param {Object|null} reflection - Existing reflection object or null
   * @returns {string} HTML string for reflection input
   */
  renderReflectionInput(date, reflection = null) {
    const content = reflection ? sanitizeInput(reflection.content) : '';
    
    return `
      <div class="reflection-section">
        <label class="reflection-label">每日心得</label>
        <textarea 
          class="reflection-textarea" 
          placeholder="记录今天的想法和感受..."
          data-date="${date}"
        >${content}</textarea>
        <button class="reflection-save-btn" data-date="${date}">保存心得</button>
      </div>
    `;
  }

  /**
   * Saves a reflection
   * Persists reflection content with date and type immediately to storage
   * @param {string} date - Date in YYYY-MM-DD format
   * @param {string} content - Reflection content
   */
  saveReflection(date, content) {
    try {
      const trimmedContent = content.trim();
      
      if (!trimmedContent) {
        // If content is empty, delete the reflection
        this.deleteReflection(date);
        return;
      }

      const allReflections = this.storageManager.loadReflections();
      const existingIndex = allReflections.findIndex(
        r => r.date === date && r.type === this.type
      );

      if (existingIndex !== -1) {
        // Update existing reflection
        allReflections[existingIndex].content = trimmedContent;
        allReflections[existingIndex].updatedAt = new Date().toISOString();
      } else {
        // Create new reflection
        const reflection = new Reflection({
          date: date,
          type: this.type,
          content: trimmedContent
        });

        reflection.validate();
        allReflections.push(reflection.toJSON());
      }

      // Save immediately to storage
      this.storageManager.saveReflections(allReflections);

      // Show success feedback
      this.showNotification('心得已保存', 'success');

      // Refresh calendar to update indicators
      this.render();
      this.expandTaskList(date);
    } catch (error) {
      console.error('Error saving reflection:', error);
      this.showNotification('保存心得失败: ' + error.message, 'error');
    }
  }

  /**
   * Loads a reflection for a date
   * @param {string} date - Date in YYYY-MM-DD format
   * @returns {Object|null} Reflection object or null if not found
   */
  loadReflection(date) {
    return this.getReflectionForDate(date);
  }

  /**
   * Deletes a reflection for a date
   * @param {string} date - Date in YYYY-MM-DD format
   */
  deleteReflection(date) {
    const allReflections = this.storageManager.loadReflections();
    const filteredReflections = allReflections.filter(
      r => !(r.date === date && r.type === this.type)
    );
    
    if (filteredReflections.length !== allReflections.length) {
      this.storageManager.saveReflections(filteredReflections);
      this.showNotification('心得已删除', 'info');
      this.render();
      this.expandTaskList(date);
    }
  }

  /**
   * Shows a notification message
   * @param {string} message - Notification message
   * @param {string} type - Notification type ('success', 'error', 'info', 'warning')
   */
  showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 24px;
      background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#E74C3C' : type === 'warning' ? '#F39C12' : '#2196F3'};
      color: white;
      border-radius: 6px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 10000;
      animation: slideInRight 0.3s ease;
    `;

    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
      notification.style.animation = 'slideOutRight 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }
}

export { Calendar };
