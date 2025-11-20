/**
 * PostEditor - 动态发布编辑器组件
 * 支持文字、图片、成就分享、标签和可见范围设置
 */

class PostEditor {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      throw new Error(`Container element with id "${containerId}" not found`);
    }

    this.options = {
      maxLength: 500,
      maxImages: 9,
      maxImageSize: 5 * 1024 * 1024, // 5MB
      onPublish: options.onPublish || null,
      ...options
    };

    // 状态
    this.content = '';
    this.images = []; // Array of {file, base64, preview}
    this.selectedAchievement = null;
    this.tags = [];
    this.visibility = 'public'; // public, friends, private

    // 服务
    this.currentUser = localStorage.getItem('lifeflow_current_user');
    if (!this.currentUser) {
      throw new Error('用户未登录');
    }

    // 初始化
    this.init();
  }

  /**
   * 初始化编辑器
   */
  init() {
    this.render();
    this.attachEventListeners();
  }

  /**
   * 渲染编辑器
   */
  render() {
    this.container.innerHTML = `
      <div class="post-editor-wrapper">
        <!-- 文字输入区 -->
        <textarea 
          class="post-editor-textarea" 
          placeholder="分享你的生活、运动或学习心得..."
          maxlength="${this.options.maxLength}"
          id="postEditorTextarea"
        ></textarea>
        
        <!-- 字符计数 -->
        <div class="post-editor-char-count">
          <span id="postEditorCharCount">0/${this.options.maxLength}</span>
        </div>

        <!-- 图片预览区 -->
        <div class="post-editor-images" id="postEditorImages" style="display: none;">
          <div class="post-editor-images-grid" id="postEditorImagesGrid"></div>
        </div>

        <!-- 成就预览区 -->
        <div class="post-editor-achievement" id="postEditorAchievement" style="display: none;">
          <div class="achievement-preview" id="achievementPreview"></div>
        </div>

        <!-- 标签显示区 -->
        <div class="post-editor-tags" id="postEditorTags" style="display: none;">
          <div class="tags-container" id="tagsContainer"></div>
        </div>

        <!-- 可见范围显示 -->
        <div class="post-editor-visibility" id="postEditorVisibility">
          <span class="visibility-label">可见范围：</span>
          <span class="visibility-value" id="visibilityValue">公开</span>
        </div>

        <!-- 操作按钮区 -->
        <div class="post-editor-actions">
          <div class="editor-action-buttons">
            <button class="editor-action-btn" id="addImageBtn" title="添加图片">
              <span class="btn-icon">🖼️</span>
              <span class="btn-text">图片</span>
            </button>
            <button class="editor-action-btn" id="addAchievementBtn" title="分享成就">
              <span class="btn-icon">🏆</span>
              <span class="btn-text">成就</span>
            </button>
            <button class="editor-action-btn" id="addTagBtn" title="添加标签">
              <span class="btn-icon">#️⃣</span>
              <span class="btn-text">标签</span>
            </button>
            <button class="editor-action-btn" id="setVisibilityBtn" title="设置可见范围">
              <span class="btn-icon">👁️</span>
              <span class="btn-text">可见范围</span>
            </button>
          </div>
          <button class="editor-publish-btn" id="publishBtn">发布</button>
        </div>

        <!-- 隐藏的文件输入 -->
        <input type="file" id="imageFileInput" accept="image/jpeg,image/jpg,image/png" multiple style="display: none;">
      </div>
    `;
  }

  /**
   * 附加事件监听器
   */
  attachEventListeners() {
    // 文字输入
    const textarea = document.getElementById('postEditorTextarea');
    textarea.addEventListener('input', () => this.handleTextInput());

    // 添加图片按钮
    const addImageBtn = document.getElementById('addImageBtn');
    addImageBtn.addEventListener('click', () => this.openImagePicker());

    // 文件输入
    const fileInput = document.getElementById('imageFileInput');
    fileInput.addEventListener('change', (e) => this.handleImageSelect(e));

    // 添加成就按钮
    const addAchievementBtn = document.getElementById('addAchievementBtn');
    addAchievementBtn.addEventListener('click', () => this.openAchievementPicker());

    // 添加标签按钮
    const addTagBtn = document.getElementById('addTagBtn');
    addTagBtn.addEventListener('click', () => this.openTagPicker());

    // 设置可见范围按钮
    const setVisibilityBtn = document.getElementById('setVisibilityBtn');
    setVisibilityBtn.addEventListener('click', () => this.openVisibilityPicker());

    // 发布按钮
    const publishBtn = document.getElementById('publishBtn');
    publishBtn.addEventListener('click', () => this.handlePublish());
  }

  /**
   * 处理文字输入
   */
  handleTextInput() {
    const textarea = document.getElementById('postEditorTextarea');
    this.content = textarea.value;
    
    // 更新字符计数
    const charCount = document.getElementById('postEditorCharCount');
    const length = this.content.length;
    charCount.textContent = `${length}/${this.options.maxLength}`;
    
    // 接近限制时改变颜色
    if (length > this.options.maxLength * 0.9) {
      charCount.style.color = '#E74C3C';
    } else {
      charCount.style.color = '#7F8C8D';
    }
  }

  /**
   * 打开图片选择器
   */
  openImagePicker() {
    if (this.images.length >= this.options.maxImages) {
      this.showNotification(`最多只能添加${this.options.maxImages}张图片`, 'warning');
      return;
    }

    const fileInput = document.getElementById('imageFileInput');
    fileInput.click();
  }

  /**
   * 处理图片选择
   */
  async handleImageSelect(event) {
    const files = Array.from(event.target.files);
    
    if (files.length === 0) return;

    // 检查数量限制
    const remainingSlots = this.options.maxImages - this.images.length;
    if (files.length > remainingSlots) {
      this.showNotification(`最多还能添加${remainingSlots}张图片`, 'warning');
      return;
    }

    // 处理每个文件
    for (const file of files) {
      try {
        // 验证文件
        if (!this.validateImageFile(file)) {
          continue;
        }

        // 压缩图片
        const base64 = await this.compressImage(file);
        
        // 添加到列表
        this.images.push({
          file: file,
          base64: base64,
          preview: base64
        });
      } catch (error) {
        console.error('处理图片失败:', error);
        this.showNotification(`图片处理失败: ${error.message}`, 'error');
      }
    }

    // 更新预览
    this.updateImagePreview();
    
    // 清空文件输入
    event.target.value = '';
  }

  /**
   * 验证图片文件
   */
  validateImageFile(file) {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    
    if (!validTypes.includes(file.type)) {
      this.showNotification('只支持 JPG 和 PNG 格式的图片', 'error');
      return false;
    }
    
    if (file.size > this.options.maxImageSize) {
      this.showNotification('图片大小不能超过 5MB', 'error');
      return false;
    }
    
    return true;
  }

  /**
   * 压缩图片
   */
  async compressImage(file) {
    // 使用 ImageCompressor 工具类
    if (typeof ImageCompressor !== 'undefined') {
      return await ImageCompressor.compress(file, {
        maxSize: this.options.maxImageSize,
        quality: 0.8,
        maxWidth: 1200,
        maxHeight: 1200
      });
    }
    
    // 如果工具类不可用，直接转换
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = () => reject(new Error('文件读取失败'));
      reader.readAsDataURL(file);
    });
  }

  /**
   * 更新图片预览
   */
  updateImagePreview() {
    const imagesContainer = document.getElementById('postEditorImages');
    const imagesGrid = document.getElementById('postEditorImagesGrid');
    
    if (this.images.length === 0) {
      imagesContainer.style.display = 'none';
      return;
    }
    
    imagesContainer.style.display = 'block';
    
    // 渲染图片网格
    imagesGrid.innerHTML = this.images.map((img, index) => `
      <div class="image-preview-item">
        <img src="${img.preview}" alt="预览图${index + 1}">
        <button class="image-remove-btn" data-index="${index}" title="删除">×</button>
      </div>
    `).join('');
    
    // 附加删除按钮事件
    imagesGrid.querySelectorAll('.image-remove-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = parseInt(e.target.dataset.index);
        this.removeImage(index);
      });
    });
  }

  /**
   * 删除图片
   */
  removeImage(index) {
    this.images.splice(index, 1);
    this.updateImagePreview();
  }

  /**
   * 打开成就选择器
   */
  openAchievementPicker() {
    // 获取最近解锁的成就
    const achievements = this.getRecentAchievements();
    
    if (achievements.length === 0) {
      this.showNotification('还没有解锁的成就', 'info');
      return;
    }
    
    // 创建成就选择对话框
    this.showAchievementDialog(achievements);
  }

  /**
   * 获取最近解锁的成就
   */
  getRecentAchievements() {
    try {
      // 使用 AchievementManager 获取成就
      if (typeof AchievementManager !== 'undefined') {
        const achievementManager = new AchievementManager();
        const unlocked = achievementManager.getUnlockedAchievements();
        
        // 按解锁时间排序，取最近10个
        return unlocked
          .sort((a, b) => new Date(b.unlockedAt) - new Date(a.unlockedAt))
          .slice(0, 10);
      }
      
      return [];
    } catch (error) {
      console.error('获取成就失败:', error);
      return [];
    }
  }

  /**
   * 显示成就选择对话框
   */
  showAchievementDialog(achievements) {
    const dialog = document.createElement('div');
    dialog.className = 'post-editor-dialog';
    dialog.innerHTML = `
      <div class="dialog-overlay"></div>
      <div class="dialog-content">
        <div class="dialog-header">
          <h3>选择要分享的成就</h3>
          <button class="dialog-close-btn">×</button>
        </div>
        <div class="dialog-body">
          <div class="achievements-list">
            ${achievements.map(achievement => `
              <div class="achievement-item" data-achievement='${JSON.stringify(achievement)}'>
                <span class="achievement-icon">${achievement.icon}</span>
                <div class="achievement-info">
                  <div class="achievement-name">${achievement.name}</div>
                  <div class="achievement-desc">${achievement.description}</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(dialog);
    
    // 关闭按钮
    dialog.querySelector('.dialog-close-btn').addEventListener('click', () => {
      document.body.removeChild(dialog);
    });
    
    dialog.querySelector('.dialog-overlay').addEventListener('click', () => {
      document.body.removeChild(dialog);
    });
    
    // 成就选择
    dialog.querySelectorAll('.achievement-item').forEach(item => {
      item.addEventListener('click', () => {
        const achievement = JSON.parse(item.dataset.achievement);
        this.selectAchievement(achievement);
        document.body.removeChild(dialog);
      });
    });
  }

  /**
   * 选择成就
   */
  selectAchievement(achievement) {
    this.selectedAchievement = achievement;
    this.updateAchievementPreview();
  }

  /**
   * 更新成就预览
   */
  updateAchievementPreview() {
    const achievementContainer = document.getElementById('postEditorAchievement');
    const achievementPreview = document.getElementById('achievementPreview');
    
    if (!this.selectedAchievement) {
      achievementContainer.style.display = 'none';
      return;
    }
    
    achievementContainer.style.display = 'block';
    achievementPreview.innerHTML = `
      <div class="achievement-preview-card">
        <span class="achievement-preview-icon">${this.selectedAchievement.icon}</span>
        <div class="achievement-preview-info">
          <div class="achievement-preview-name">${this.selectedAchievement.name}</div>
          <div class="achievement-preview-desc">${this.selectedAchievement.description}</div>
        </div>
        <button class="achievement-remove-btn" title="移除">×</button>
      </div>
    `;
    
    // 移除按钮
    achievementPreview.querySelector('.achievement-remove-btn').addEventListener('click', () => {
      this.selectedAchievement = null;
      this.updateAchievementPreview();
    });
  }

  /**
   * 打开标签选择器
   */
  openTagPicker() {
    const predefinedTags = ['#运动', '#学习', '#生活', '#健康', '#成就', '#打卡', '#坚持', '#进步'];
    
    const dialog = document.createElement('div');
    dialog.className = 'post-editor-dialog';
    dialog.innerHTML = `
      <div class="dialog-overlay"></div>
      <div class="dialog-content">
        <div class="dialog-header">
          <h3>添加标签</h3>
          <button class="dialog-close-btn">×</button>
        </div>
        <div class="dialog-body">
          <div class="tag-input-group">
            <input type="text" class="tag-input" placeholder="输入自定义标签..." id="customTagInput">
            <button class="tag-add-btn" id="addCustomTagBtn">添加</button>
          </div>
          <div class="predefined-tags">
            <h4>常用标签</h4>
            <div class="tags-grid">
              ${predefinedTags.map(tag => `
                <button class="tag-option ${this.tags.includes(tag) ? 'selected' : ''}" data-tag="${tag}">
                  ${tag}
                </button>
              `).join('')}
            </div>
          </div>
          <div class="dialog-footer">
            <button class="dialog-confirm-btn">确定</button>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(dialog);
    
    // 关闭按钮
    dialog.querySelector('.dialog-close-btn').addEventListener('click', () => {
      document.body.removeChild(dialog);
    });
    
    dialog.querySelector('.dialog-overlay').addEventListener('click', () => {
      document.body.removeChild(dialog);
    });
    
    // 标签选择
    dialog.querySelectorAll('.tag-option').forEach(btn => {
      btn.addEventListener('click', () => {
        const tag = btn.dataset.tag;
        if (this.tags.includes(tag)) {
          this.tags = this.tags.filter(t => t !== tag);
          btn.classList.remove('selected');
        } else {
          this.tags.push(tag);
          btn.classList.add('selected');
        }
      });
    });
    
    // 自定义标签
    const customTagInput = dialog.querySelector('#customTagInput');
    const addCustomTagBtn = dialog.querySelector('#addCustomTagBtn');
    
    const addCustomTag = () => {
      let tag = customTagInput.value.trim();
      if (tag) {
        if (!tag.startsWith('#')) {
          tag = '#' + tag;
        }
        if (!this.tags.includes(tag)) {
          this.tags.push(tag);
        }
        customTagInput.value = '';
      }
    };
    
    addCustomTagBtn.addEventListener('click', addCustomTag);
    customTagInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        addCustomTag();
      }
    });
    
    // 确定按钮
    dialog.querySelector('.dialog-confirm-btn').addEventListener('click', () => {
      this.updateTagsPreview();
      document.body.removeChild(dialog);
    });
  }

  /**
   * 更新标签预览
   */
  updateTagsPreview() {
    const tagsContainer = document.getElementById('postEditorTags');
    const tagsContainerInner = document.getElementById('tagsContainer');
    
    if (this.tags.length === 0) {
      tagsContainer.style.display = 'none';
      return;
    }
    
    tagsContainer.style.display = 'block';
    tagsContainerInner.innerHTML = this.tags.map(tag => `
      <span class="tag-chip">
        ${tag}
        <button class="tag-remove-btn" data-tag="${tag}">×</button>
      </span>
    `).join('');
    
    // 移除标签按钮
    tagsContainerInner.querySelectorAll('.tag-remove-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tag = btn.dataset.tag;
        this.tags = this.tags.filter(t => t !== tag);
        this.updateTagsPreview();
      });
    });
  }

  /**
   * 打开可见范围选择器
   */
  openVisibilityPicker() {
    const options = [
      { value: 'public', label: '公开', icon: '🌐', desc: '所有人可见' },
      { value: 'friends', label: '仅好友', icon: '👥', desc: '只有好友可见' },
      { value: 'private', label: '仅自己', icon: '🔒', desc: '只有自己可见' }
    ];
    
    const dialog = document.createElement('div');
    dialog.className = 'post-editor-dialog';
    dialog.innerHTML = `
      <div class="dialog-overlay"></div>
      <div class="dialog-content">
        <div class="dialog-header">
          <h3>设置可见范围</h3>
          <button class="dialog-close-btn">×</button>
        </div>
        <div class="dialog-body">
          <div class="visibility-options">
            ${options.map(option => `
              <div class="visibility-option ${this.visibility === option.value ? 'selected' : ''}" data-value="${option.value}">
                <span class="visibility-icon">${option.icon}</span>
                <div class="visibility-info">
                  <div class="visibility-label">${option.label}</div>
                  <div class="visibility-desc">${option.desc}</div>
                </div>
                <span class="visibility-check">✓</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(dialog);
    
    // 关闭按钮
    dialog.querySelector('.dialog-close-btn').addEventListener('click', () => {
      document.body.removeChild(dialog);
    });
    
    dialog.querySelector('.dialog-overlay').addEventListener('click', () => {
      document.body.removeChild(dialog);
    });
    
    // 选项选择
    dialog.querySelectorAll('.visibility-option').forEach(option => {
      option.addEventListener('click', () => {
        this.visibility = option.dataset.value;
        this.updateVisibilityDisplay();
        document.body.removeChild(dialog);
      });
    });
  }

  /**
   * 更新可见范围显示
   */
  updateVisibilityDisplay() {
    const visibilityValue = document.getElementById('visibilityValue');
    const labels = {
      'public': '公开',
      'friends': '仅好友',
      'private': '仅自己'
    };
    visibilityValue.textContent = labels[this.visibility] || '公开';
  }

  /**
   * 处理发布
   */
  async handlePublish() {
    try {
      // 验证内容
      if (!this.validatePost()) {
        return;
      }
      
      // 禁用发布按钮
      const publishBtn = document.getElementById('publishBtn');
      publishBtn.disabled = true;
      publishBtn.textContent = '发布中...';
      
      // 构建动态数据
      const postData = {
        content: this.content.trim(),
        images: this.images.map(img => img.base64),
        type: this.selectedAchievement ? 'achievement' : 'normal',
        achievementId: this.selectedAchievement ? this.selectedAchievement.id : null,
        tags: this.tags,
        visibility: this.visibility
      };
      
      // 调用回调或触发事件
      if (this.options.onPublish) {
        await this.options.onPublish(postData);
      } else {
        // 触发自定义事件
        window.dispatchEvent(new CustomEvent('post:publish', {
          detail: { postData }
        }));
      }
      
      // 清空编辑器
      this.reset();
      
      // 显示成功提示
      this.showNotification('发布成功！', 'success');
      
    } catch (error) {
      console.error('发布失败:', error);
      this.showNotification(`发布失败: ${error.message}`, 'error');
    } finally {
      // 恢复发布按钮
      const publishBtn = document.getElementById('publishBtn');
      publishBtn.disabled = false;
      publishBtn.textContent = '发布';
    }
  }

  /**
   * 验证动态内容
   */
  validatePost() {
    // 至少要有内容或图片
    if (!this.content.trim() && this.images.length === 0 && !this.selectedAchievement) {
      this.showNotification('请输入内容或添加图片', 'warning');
      return false;
    }
    
    // 验证内容长度
    if (this.content.length > this.options.maxLength) {
      this.showNotification(`内容不能超过${this.options.maxLength}字符`, 'warning');
      return false;
    }
    
    // 验证图片数量
    if (this.images.length > this.options.maxImages) {
      this.showNotification(`图片数量不能超过${this.options.maxImages}张`, 'warning');
      return false;
    }
    
    return true;
  }

  /**
   * 重置编辑器
   */
  reset() {
    this.content = '';
    this.images = [];
    this.selectedAchievement = null;
    this.tags = [];
    this.visibility = 'public';
    
    // 重置UI
    const textarea = document.getElementById('postEditorTextarea');
    if (textarea) textarea.value = '';
    
    const charCount = document.getElementById('postEditorCharCount');
    if (charCount) {
      charCount.textContent = `0/${this.options.maxLength}`;
      charCount.style.color = '#7F8C8D';
    }
    
    this.updateImagePreview();
    this.updateAchievementPreview();
    this.updateTagsPreview();
    this.updateVisibilityDisplay();
  }

  /**
   * 显示通知
   */
  showNotification(message, type = 'info') {
    // 使用全局通知系统
    if (typeof showNotification !== 'undefined') {
      showNotification(message, type);
      return;
    }
    
    // 简单的alert作为后备
    alert(message);
  }

  /**
   * 销毁编辑器
   */
  destroy() {
    if (this.container) {
      this.container.innerHTML = '';
    }
  }
}

// Export for CommonJS
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PostEditor;
}

// Make available globally for browser
if (typeof window !== 'undefined') {
  window.PostEditor = PostEditor;
}
