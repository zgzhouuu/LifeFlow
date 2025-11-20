/**
 * ProfileCard Component
 * 个人资料卡片组件
 */

class ProfileCard {
    constructor(containerId, profileService, username) {
        this.container = document.getElementById(containerId);
        this.profileService = profileService;
        this.username = username;
        this.profile = null;
        this.isEditingNickname = false;
        this.isEditingBio = false;
    }

    /**
     * 渲染组件
     */
    render() {
        if (!this.container) {
            console.error('Container not found:', this.containerId);
            return;
        }

        // 加载用户资料
        this.profile = this.profileService.getProfile(this.username);

        if (!this.profile) {
            this.container.innerHTML = '<div class="loading">加载失败</div>';
            return;
        }

        this.container.innerHTML = this.getHTML();
        this.attachEventListeners();
    }

    /**
     * 生成HTML
     */
    getHTML() {
        const { username, nickname, avatar, createdAt } = this.profile;
        const displayName = nickname || username;
        const joinDate = new Date(createdAt).toLocaleDateString('zh-CN');

        return `
            <div class="profile-card">
                <div class="profile-header">
                    <div class="avatar-section">
                        <div class="avatar-container" id="avatarContainer">
                            ${avatar 
                                ? `<img src="${avatar}" alt="头像" id="avatarImage">` 
                                : `<div class="avatar-placeholder">👤</div>`
                            }
                            <div class="avatar-overlay">点击更换头像</div>
                        </div>
                        <input type="file" id="avatarInput" class="avatar-input" accept="image/jpeg,image/png,image/jpg">
                    </div>

                    <div class="basic-info">
                        <div class="username-display">${username}</div>
                        <div class="nickname-section" id="nicknameSection">
                            ${this.getNicknameHTML(displayName)}
                        </div>
                        <div class="join-date">加入时间：${joinDate}</div>
                    </div>
                </div>

                <div class="profile-details">
                    <div class="detail-item detail-item-compact">
                        <div class="detail-label">用户名</div>
                        <div class="detail-value">${username}</div>
                    </div>
                    <div class="detail-item detail-item-compact">
                        <div class="detail-label">昵称</div>
                        <div class="detail-value">${displayName}</div>
                    </div>
                </div>
                <div class="profile-details">
                    <div class="detail-item detail-item-full">
                        <div class="detail-label">个性签名</div>
                        <div class="detail-value bio-section" id="bioSection">
                            ${this.getBioHTML()}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 生成昵称区域HTML
     */
    getNicknameHTML(displayName) {
        if (this.isEditingNickname) {
            return `
                <input type="text" 
                       id="nicknameInput" 
                       class="nickname-input" 
                       value="${displayName}" 
                       maxlength="20"
                       placeholder="请输入昵称（1-20字符）">
                <button class="save-btn" id="saveNicknameBtn">保存</button>
                <button class="cancel-btn" id="cancelNicknameBtn">取消</button>
                <div class="nickname-error" id="nicknameError"></div>
            `;
        } else {
            return `
                <span class="nickname-display">${displayName}</span>
                <button class="edit-btn" id="editNicknameBtn">编辑昵称</button>
            `;
        }
    }
    
    /**
     * 生成个性签名区域HTML
     */
    getBioHTML() {
        const bio = this.profile.bio || '这个人很懒，什么都没写';
        
        if (this.isEditingBio) {
            return `
                <textarea id="bioInput" 
                          class="bio-input" 
                          maxlength="100"
                          placeholder="请输入个性签名（最多100字符）"
                          rows="3">${bio !== '这个人很懒，什么都没写' ? bio : ''}</textarea>
                <div class="bio-actions">
                    <button class="save-btn" id="saveBioBtn">保存</button>
                    <button class="cancel-btn" id="cancelBioBtn">取消</button>
                </div>
                <div class="bio-error" id="bioError"></div>
            `;
        } else {
            return `
                <div class="bio-display">${bio}</div>
                <button class="edit-btn" id="editBioBtn">编辑签名</button>
            `;
        }
    }

    /**
     * 附加事件监听器
     */
    attachEventListeners() {
        // 头像上传
        const avatarContainer = document.getElementById('avatarContainer');
        const avatarInput = document.getElementById('avatarInput');

        if (avatarContainer && avatarInput) {
            avatarContainer.addEventListener('click', () => {
                avatarInput.click();
            });

            avatarInput.addEventListener('change', (e) => {
                this.handleAvatarUpload(e);
            });
        }

        // 昵称编辑
        const editBtn = document.getElementById('editNicknameBtn');
        if (editBtn) {
            editBtn.addEventListener('click', () => {
                this.startEditingNickname();
            });
        }

        const saveBtn = document.getElementById('saveNicknameBtn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                this.saveNickname();
            });
        }

        const cancelBtn = document.getElementById('cancelNicknameBtn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.cancelEditingNickname();
            });
        }

        // 昵称输入框回车保存
        const nicknameInput = document.getElementById('nicknameInput');
        if (nicknameInput) {
            nicknameInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.saveNickname();
                }
            });
        }
        
        // 个性签名编辑
        const editBioBtn = document.getElementById('editBioBtn');
        if (editBioBtn) {
            editBioBtn.addEventListener('click', () => {
                this.startEditingBio();
            });
        }

        const saveBioBtn = document.getElementById('saveBioBtn');
        if (saveBioBtn) {
            saveBioBtn.addEventListener('click', () => {
                this.saveBio();
            });
        }

        const cancelBioBtn = document.getElementById('cancelBioBtn');
        if (cancelBioBtn) {
            cancelBioBtn.addEventListener('click', () => {
                this.cancelEditingBio();
            });
        }
    }

    /**
     * 处理头像上传
     */
    async handleAvatarUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        try {
            // 检查ImageCompressor是否存在
            if (typeof ImageCompressor === 'undefined') {
                throw new Error('图片压缩工具未加载，请刷新页面重试');
            }
            
            // 验证文件
            ImageCompressor.validateImage(file);

            // 显示加载提示
            if (window.toastNotification) {
                window.toastNotification.show('正在上传头像...', 'info');
            }

            // 上传并压缩头像
            const base64 = await this.profileService.uploadAvatar(this.username, file);

            // 更新显示
            this.profile.avatar = base64;
            const avatarContainer = document.getElementById('avatarContainer');
            if (avatarContainer) {
                avatarContainer.innerHTML = `
                    <img src="${base64}" alt="头像" id="avatarImage">
                    <div class="avatar-overlay">点击更换头像</div>
                `;
            }

            // 显示成功提示
            if (window.toastNotification) {
                window.toastNotification.show('头像上传成功！', 'success');
            }

        } catch (error) {
            console.error('Avatar upload error:', error);
            if (window.toastNotification) {
                window.toastNotification.show(error.message, 'error');
            }
        }

        // 清空input，允许重复选择同一文件
        event.target.value = '';
    }

    /**
     * 开始编辑昵称
     */
    startEditingNickname() {
        this.isEditingNickname = true;
        const nicknameSection = document.getElementById('nicknameSection');
        if (nicknameSection) {
            const displayName = this.profile.nickname || this.profile.username;
            nicknameSection.innerHTML = this.getNicknameHTML(displayName);
            this.attachEventListeners();

            // 聚焦到输入框
            const input = document.getElementById('nicknameInput');
            if (input) {
                input.focus();
                input.select();
            }
        }
    }

    /**
     * 保存昵称
     */
    saveNickname() {
        const input = document.getElementById('nicknameInput');
        const errorDiv = document.getElementById('nicknameError');

        if (!input) return;

        const nickname = input.value.trim();

        // 验证昵称
        if (!nickname) {
            input.classList.add('error');
            if (errorDiv) errorDiv.textContent = '昵称不能为空';
            return;
        }

        if (nickname.length > 20) {
            input.classList.add('error');
            if (errorDiv) errorDiv.textContent = '昵称不能超过20字符';
            return;
        }

        try {
            // 更新昵称
            this.profileService.updateNickname(this.username, nickname);
            this.profile.nickname = nickname;

            // 退出编辑模式
            this.isEditingNickname = false;
            const nicknameSection = document.getElementById('nicknameSection');
            if (nicknameSection) {
                nicknameSection.innerHTML = this.getNicknameHTML(nickname);
                this.attachEventListeners();
            }

            // 更新详细信息区域
            this.render();

            // 显示成功提示
            if (window.toastNotification) {
                window.toastNotification.show('昵称更新成功！', 'success');
            }

        } catch (error) {
            console.error('Save nickname error:', error);
            input.classList.add('error');
            if (errorDiv) errorDiv.textContent = error.message;
        }
    }

    /**
     * 取消编辑昵称
     */
    cancelEditingNickname() {
        this.isEditingNickname = false;
        const nicknameSection = document.getElementById('nicknameSection');
        if (nicknameSection) {
            const displayName = this.profile.nickname || this.profile.username;
            nicknameSection.innerHTML = this.getNicknameHTML(displayName);
            this.attachEventListeners();
        }
    }

    /**
     * 开始编辑个性签名
     */
    startEditingBio() {
        this.isEditingBio = true;
        const bioSection = document.getElementById('bioSection');
        if (bioSection) {
            bioSection.innerHTML = this.getBioHTML();
            this.attachEventListeners();

            // 聚焦到输入框
            const input = document.getElementById('bioInput');
            if (input) {
                input.focus();
            }
        }
    }

    /**
     * 保存个性签名
     */
    saveBio() {
        const input = document.getElementById('bioInput');
        const errorDiv = document.getElementById('bioError');

        if (!input) return;

        const bio = input.value.trim();

        // 验证签名
        if (bio.length > 100) {
            input.classList.add('error');
            if (errorDiv) errorDiv.textContent = '个性签名不能超过100字符';
            return;
        }

        try {
            // 更新签名
            this.profileService.updateProfile(this.username, { bio: bio || '这个人很懒，什么都没写' });
            this.profile.bio = bio || '这个人很懒，什么都没写';

            // 退出编辑模式
            this.isEditingBio = false;
            const bioSection = document.getElementById('bioSection');
            if (bioSection) {
                bioSection.innerHTML = this.getBioHTML();
                this.attachEventListeners();
            }
            
            // 触发资料更新事件
            window.dispatchEvent(new CustomEvent('profile:updated', {
                detail: { username: this.username }
            }));

            // 显示成功提示
            if (window.toastNotification) {
                window.toastNotification.show('个性签名更新成功！', 'success');
            }

        } catch (error) {
            console.error('Save bio error:', error);
            input.classList.add('error');
            if (errorDiv) errorDiv.textContent = error.message;
        }
    }

    /**
     * 取消编辑个性签名
     */
    cancelEditingBio() {
        this.isEditingBio = false;
        const bioSection = document.getElementById('bioSection');
        if (bioSection) {
            bioSection.innerHTML = this.getBioHTML();
            this.attachEventListeners();
        }
    }
    
    /**
     * 刷新组件
     */
    refresh() {
        this.render();
    }
}

// Export for CommonJS and global scope
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProfileCard;
}
