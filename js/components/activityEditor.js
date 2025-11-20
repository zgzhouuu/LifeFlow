/**
 * ActivityEditor Component
 * 活动编辑器组件 - 提供添加和编辑活动的表单界面
 */
class ActivityEditor {
    /**
     * 创建ActivityEditor实例
     * @param {string} type - 活动类型（'exercise' | 'learning'）
     * @param {Function} onSave - 保存回调函数
     * @param {Function} onCancel - 取消回调函数
     */
    constructor(type, onSave, onCancel) {
        this.type = type;
        this.onSave = onSave;
        this.onCancel = onCancel;
        this.activity = null; // 编辑模式时设置
        this.modalElement = null;
        
        // 错误消息
        this.ERROR_MESSAGES = {
            EMPTY_NAME: '请输入活动名称',
            INVALID_DURATION: '时长必须在1-300分钟之间',
            NAME_TOO_LONG: '活动名称不能超过50个字符',
            NOTES_TOO_LONG: '备注不能超过200个字符'
        };
    }

    /**
     * 显示表单（添加或编辑模式）
     * @param {Activity|null} activity - 要编辑的活动（null表示添加模式）
     */
    show(activity = null) {
        this.activity = activity;
        this.render();
        this.attachEventListeners();
        
        // 显示modal
        this.modalElement.style.display = 'flex';
        
        // 使用FocusManager自动聚焦
        if (typeof FocusManager !== 'undefined') {
            FocusManager.autoFocus(this.modalElement, 100);
            
            // 陷阱焦点在模态框内
            this.cleanupFocusTrap = FocusManager.trapFocus(this.modalElement);
        } else {
            // 回退到原始实现
            setTimeout(() => {
                const nameInput = this.modalElement.querySelector('#activityName');
                if (nameInput) {
                    nameInput.focus();
                }
            }, 100);
        }
    }

    /**
     * 隐藏表单
     */
    hide() {
        if (this.modalElement) {
            // 清理焦点陷阱
            if (this.cleanupFocusTrap) {
                this.cleanupFocusTrap();
                this.cleanupFocusTrap = null;
            }

            // 添加关闭动画
            this.modalElement.classList.add('closing');
            
            setTimeout(() => {
                if (this.modalElement && this.modalElement.parentNode) {
                    this.modalElement.parentNode.removeChild(this.modalElement);
                }
                this.modalElement = null;
            }, 300);
        }
    }

    /**
     * 渲染表单UI
     */
    render() {
        // 如果已存在modal，先移除
        if (this.modalElement) {
            this.modalElement.remove();
        }

        // 确定标题和按钮文本
        const isEditMode = this.activity !== null;
        const title = isEditMode 
            ? `编辑${this.type === 'exercise' ? '运动' : '学习'}计划`
            : `添加${this.type === 'exercise' ? '运动' : '学习'}计划`;
        
        // 获取表单默认值
        const defaultName = isEditMode ? this.activity.name : '';
        const defaultDuration = isEditMode ? this.activity.duration : '';
        const defaultNotes = isEditMode ? this.activity.notes : '';

        // 创建modal HTML
        const modalHTML = `
            <div class="modal-overlay" id="activityEditorModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>${title}</h3>
                        <button class="btn-close" type="button" aria-label="关闭">×</button>
                    </div>
                    <form class="activity-form" id="activityForm">
                        <div class="form-group">
                            <label for="activityName">活动名称 <span class="required">*</span></label>
                            <input 
                                type="text" 
                                id="activityName" 
                                name="name"
                                placeholder="如：跑步、游泳、学习JavaScript" 
                                value="${defaultName}"
                                maxlength="50"
                                required 
                            />
                            <span class="error-message" id="nameError"></span>
                        </div>
                        <div class="form-group">
                            <label for="activityDuration">计划时长（分钟） <span class="required">*</span></label>
                            <input 
                                type="number" 
                                id="activityDuration" 
                                name="duration"
                                min="1" 
                                max="300"
                                placeholder="30" 
                                value="${defaultDuration}"
                                required 
                            />
                            <span class="error-message" id="durationError"></span>
                        </div>
                        <div class="form-group">
                            <label for="activityNotes">备注（可选）</label>
                            <textarea 
                                id="activityNotes" 
                                name="notes"
                                rows="3" 
                                maxlength="200"
                                placeholder="记录你的感受或计划..."
                            >${defaultNotes}</textarea>
                            <span class="char-count">
                                <span id="notesCharCount">${defaultNotes.length}</span>/200
                            </span>
                        </div>
                        <div class="form-actions">
                            <button type="submit" class="btn-primary">
                                ${isEditMode ? '保存' : '添加'}
                            </button>
                            <button type="button" class="btn-secondary" id="btnCancel">
                                取消
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        // 添加到body
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.modalElement = document.getElementById('activityEditorModal');
    }

    /**
     * 附加事件监听器
     */
    attachEventListeners() {
        if (!this.modalElement) return;

        const form = this.modalElement.querySelector('#activityForm');
        const btnCancel = this.modalElement.querySelector('#btnCancel');
        const btnClose = this.modalElement.querySelector('.btn-close');
        const overlay = this.modalElement;
        const notesTextarea = this.modalElement.querySelector('#activityNotes');
        const charCountSpan = this.modalElement.querySelector('#notesCharCount');

        // 表单提交
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSubmit();
        });

        // 取消按钮
        btnCancel.addEventListener('click', () => {
            this.handleCancel();
        });

        // 关闭按钮
        btnClose.addEventListener('click', () => {
            this.handleCancel();
        });

        // 点击overlay外部关闭
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                this.handleCancel();
            }
        });

        // ESC键关闭
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                this.handleCancel();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);

        // 备注字符计数（使用节流优化）
        if (notesTextarea && charCountSpan) {
            const updateCharCount = () => {
                charCountSpan.textContent = notesTextarea.value.length;
            };
            
            // 使用节流函数优化性能
            const throttledUpdate = typeof throttle !== 'undefined'
                ? throttle(updateCharCount, 100)
                : updateCharCount;
            
            notesTextarea.addEventListener('input', throttledUpdate);
        }

        // 实时验证（使用防抖优化）
        const nameInput = this.modalElement.querySelector('#activityName');
        const durationInput = this.modalElement.querySelector('#activityDuration');

        if (nameInput) {
            const debouncedValidate = typeof debounce !== 'undefined'
                ? debounce(() => this.validateField('name', nameInput.value), 300)
                : () => this.validateField('name', nameInput.value);
            
            nameInput.addEventListener('input', debouncedValidate);
            nameInput.addEventListener('blur', () => {
                this.validateField('name', nameInput.value);
            });
        }

        if (durationInput) {
            const debouncedValidate = typeof debounce !== 'undefined'
                ? debounce(() => this.validateField('duration', durationInput.value), 300)
                : () => this.validateField('duration', durationInput.value);
            
            durationInput.addEventListener('input', debouncedValidate);
            durationInput.addEventListener('blur', () => {
                this.validateField('duration', durationInput.value);
            });
        }
    }

    /**
     * 验证单个字段
     * @param {string} fieldName - 字段名
     * @param {string} value - 字段值
     * @returns {boolean} 是否有效
     */
    validateField(fieldName, value) {
        let errorMessage = '';
        let isValid = true;

        if (fieldName === 'name') {
            if (!value || value.trim() === '') {
                errorMessage = this.ERROR_MESSAGES.EMPTY_NAME;
                isValid = false;
            } else if (value.length > 50) {
                errorMessage = this.ERROR_MESSAGES.NAME_TOO_LONG;
                isValid = false;
            }
            this.showFieldError('nameError', errorMessage);
        } else if (fieldName === 'duration') {
            const duration = parseInt(value, 10);
            if (isNaN(duration) || duration < 1 || duration > 300) {
                errorMessage = this.ERROR_MESSAGES.INVALID_DURATION;
                isValid = false;
            }
            this.showFieldError('durationError', errorMessage);
        }

        return isValid;
    }

    /**
     * 显示字段错误消息
     * @param {string} errorElementId - 错误元素ID
     * @param {string} message - 错误消息
     */
    showFieldError(errorElementId, message) {
        const errorElement = this.modalElement.querySelector(`#${errorElementId}`);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = message ? 'block' : 'none';
        }
    }

    /**
     * 验证整个表单
     * @returns {boolean} 表单是否有效
     */
    validate() {
        const formData = this.getFormData();
        
        let isValid = true;

        // 验证活动名称
        if (!this.validateField('name', formData.name)) {
            isValid = false;
        }

        // 验证时长
        if (!this.validateField('duration', formData.duration)) {
            isValid = false;
        }

        // 验证备注长度
        if (formData.notes && formData.notes.length > 200) {
            this.showFieldError('notesError', this.ERROR_MESSAGES.NOTES_TOO_LONG);
            isValid = false;
        }

        return isValid;
    }

    /**
     * 获取表单数据
     * @returns {Object} 表单数据 { name, duration, notes }
     */
    getFormData() {
        const nameInput = this.modalElement.querySelector('#activityName');
        const durationInput = this.modalElement.querySelector('#activityDuration');
        const notesInput = this.modalElement.querySelector('#activityNotes');

        return {
            name: nameInput ? nameInput.value.trim() : '',
            duration: durationInput ? durationInput.value : '',
            notes: notesInput ? notesInput.value.trim() : ''
        };
    }

    /**
     * 处理表单提交
     */
    handleSubmit() {
        // 验证表单
        if (!this.validate()) {
            // 添加抖动动画提示错误
            const form = this.modalElement.querySelector('.activity-form');
            if (form) {
                form.classList.add('animate-shake');
                setTimeout(() => {
                    form.classList.remove('animate-shake');
                }, 400);
            }
            return;
        }

        // 获取表单数据
        const formData = this.getFormData();
        
        // 转换duration为数字
        formData.duration = parseInt(formData.duration, 10);

        // 调用保存回调
        if (this.onSave) {
            this.onSave(formData, this.activity);
        }

        // 隐藏表单
        this.hide();
    }

    /**
     * 处理取消操作
     */
    handleCancel() {
        // 调用取消回调
        if (this.onCancel) {
            this.onCancel();
        }

        // 隐藏表单
        this.hide();
    }
}
