/**
 * BadgeWall Component
 * 勋章墙组件 - 在个人资料页面显示所有已解锁的成就徽章
 */
class BadgeWall {
    constructor(containerId, achievementManager) {
        this.containerId = containerId;
        this.achievementManager = achievementManager;
        this.draggedBadge = null;
        this.badgeOrder = this.loadBadgeOrder();
    }

    /**
     * 加载徽章顺序
     */
    loadBadgeOrder() {
        const currentUser = localStorage.getItem('lifeflow_current_user') || 'default';
        const key = `lifeflow_${currentUser}_badge_order`;
        const order = localStorage.getItem(key);
        return order ? JSON.parse(order) : [];
    }

    /**
     * 保存徽章顺序
     */
    saveBadgeOrder() {
        const currentUser = localStorage.getItem('lifeflow_current_user') || 'default';
        const key = `lifeflow_${currentUser}_badge_order`;
        localStorage.setItem(key, JSON.stringify(this.badgeOrder));
    }

    /**
     * 渲染勋章墙
     */
    render() {
        const container = document.getElementById(this.containerId);
        if (!container) return;

        const unlockedAchievements = this.achievementManager.getUnlockedAchievements();
        const totalPoints = this.achievementManager.getTotalPoints();

        // 按照用户自定义顺序排序徽章
        const sortedBadges = this.sortBadgesByOrder(unlockedAchievements);

        container.innerHTML = `
            <div class="badge-wall">
                <div class="badge-wall-header">
                    <h3>🏆 勋章墙</h3>
                    <div class="badge-wall-stats">
                        <span class="badge-count">${unlockedAchievements.length} 个徽章</span>
                        <span class="badge-points">${totalPoints} 成就点</span>
                    </div>
                </div>
                
                ${unlockedAchievements.length === 0 ? `
                    <div class="badge-wall-empty">
                        <div class="empty-icon">🎯</div>
                        <p>还没有解锁任何徽章</p>
                        <p class="empty-hint">完成运动和学习任务来解锁成就吧！</p>
                    </div>
                ` : `
                    <div class="badge-wall-hint">
                        <span>💡 提示：点击徽章查看详情，长按可调整顺序</span>
                    </div>
                    <div class="badge-wall-grid" id="badgeWallGrid">
                        ${this.renderBadges(sortedBadges)}
                    </div>
                `}
            </div>
        `;

        // 绑定事件
        if (unlockedAchievements.length > 0) {
            this.attachEventListeners();
        }
    }

    /**
     * 按照用户自定义顺序排序徽章
     */
    sortBadgesByOrder(badges) {
        if (this.badgeOrder.length === 0) {
            // 如果没有自定义顺序，按解锁时间倒序
            return [...badges].sort((a, b) => 
                new Date(b.unlockedAt) - new Date(a.unlockedAt)
            );
        }

        // 按照自定义顺序排序
        const ordered = [];
        const unordered = [];

        badges.forEach(badge => {
            const index = this.badgeOrder.indexOf(badge.id);
            if (index !== -1) {
                ordered[index] = badge;
            } else {
                unordered.push(badge);
            }
        });

        // 合并已排序和未排序的徽章
        return [...ordered.filter(b => b), ...unordered];
    }

    /**
     * 渲染徽章列表
     */
    renderBadges(badges) {
        return badges.map((badge, index) => `
            <div class="badge-wall-item" 
                 data-badge-id="${badge.id}"
                 data-index="${index}"
                 draggable="true">
                <div class="badge-wall-icon">${badge.icon}</div>
                <div class="badge-wall-name">${badge.name}</div>
                <div class="badge-wall-points">+${badge.points}</div>
                <div class="badge-wall-date">${this.formatDate(badge.unlockedAt)}</div>
            </div>
        `).join('');
    }

    /**
     * 格式化日期
     */
    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return '今天';
        if (diffDays === 1) return '昨天';
        if (diffDays < 7) return `${diffDays}天前`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)}周前`;
        if (diffDays < 365) return `${Math.floor(diffDays / 30)}个月前`;
        return `${Math.floor(diffDays / 365)}年前`;
    }

    /**
     * 绑定事件监听器
     */
    attachEventListeners() {
        const grid = document.getElementById('badgeWallGrid');
        if (!grid) return;

        const badges = grid.querySelectorAll('.badge-wall-item');
        
        badges.forEach(badge => {
            // 点击查看详情
            badge.addEventListener('click', (e) => {
                if (!badge.classList.contains('dragging')) {
                    this.showBadgeDetail(badge.dataset.badgeId);
                }
            });

            // 拖拽事件 - 桌面端
            badge.addEventListener('dragstart', (e) => {
                this.handleDragStart(e);
            });

            badge.addEventListener('dragover', (e) => {
                this.handleDragOver(e);
            });

            badge.addEventListener('drop', (e) => {
                this.handleDrop(e);
            });

            badge.addEventListener('dragend', (e) => {
                this.handleDragEnd(e);
            });

            // 触摸事件 - 移动端
            let longPressTimer;
            let touchStartX, touchStartY;

            badge.addEventListener('touchstart', (e) => {
                touchStartX = e.touches[0].clientX;
                touchStartY = e.touches[0].clientY;
                
                longPressTimer = setTimeout(() => {
                    badge.classList.add('long-press-active');
                    this.enableTouchReorder(badge);
                }, 500);
            });

            badge.addEventListener('touchmove', (e) => {
                const touchX = e.touches[0].clientX;
                const touchY = e.touches[0].clientY;
                const distance = Math.sqrt(
                    Math.pow(touchX - touchStartX, 2) + 
                    Math.pow(touchY - touchStartY, 2)
                );
                
                if (distance > 10) {
                    clearTimeout(longPressTimer);
                }
            });

            badge.addEventListener('touchend', () => {
                clearTimeout(longPressTimer);
                badge.classList.remove('long-press-active');
            });
        });
    }

    /**
     * 处理拖拽开始
     */
    handleDragStart(e) {
        this.draggedBadge = e.target;
        e.target.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', e.target.innerHTML);
    }

    /**
     * 处理拖拽经过
     */
    handleDragOver(e) {
        if (e.preventDefault) {
            e.preventDefault();
        }
        e.dataTransfer.dropEffect = 'move';

        const target = e.target.closest('.badge-wall-item');
        if (target && target !== this.draggedBadge) {
            const grid = document.getElementById('badgeWallGrid');
            const badges = Array.from(grid.querySelectorAll('.badge-wall-item'));
            const draggedIndex = badges.indexOf(this.draggedBadge);
            const targetIndex = badges.indexOf(target);

            if (draggedIndex < targetIndex) {
                target.parentNode.insertBefore(this.draggedBadge, target.nextSibling);
            } else {
                target.parentNode.insertBefore(this.draggedBadge, target);
            }
        }

        return false;
    }

    /**
     * 处理放置
     */
    handleDrop(e) {
        if (e.stopPropagation) {
            e.stopPropagation();
        }
        return false;
    }

    /**
     * 处理拖拽结束
     */
    handleDragEnd(e) {
        e.target.classList.remove('dragging');
        
        // 保存新的顺序
        const grid = document.getElementById('badgeWallGrid');
        const badges = Array.from(grid.querySelectorAll('.badge-wall-item'));
        this.badgeOrder = badges.map(badge => badge.dataset.badgeId);
        this.saveBadgeOrder();

        // 显示提示
        if (typeof toastNotification !== 'undefined') {
            toastNotification.show('徽章顺序已保存', 'success');
        }
    }

    /**
     * 启用触摸重排序（移动端）
     */
    enableTouchReorder(badge) {
        // 显示重排序模式提示
        if (typeof toastNotification !== 'undefined') {
            toastNotification.show('长按并拖动可调整徽章顺序', 'info');
        }

        // 添加视觉反馈
        badge.style.transform = 'scale(1.1)';
        badge.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.2)';

        setTimeout(() => {
            badge.style.transform = '';
            badge.style.boxShadow = '';
        }, 300);
    }

    /**
     * 显示徽章详情
     */
    showBadgeDetail(badgeId) {
        const achievement = this.achievementManager.achievements[badgeId];
        const unlockedData = this.achievementManager.userAchievements.unlockedAchievements
            .find(a => a.id === badgeId);

        if (!achievement || !unlockedData) return;

        // 创建模态框
        const modal = document.createElement('div');
        modal.className = 'badge-detail-modal';
        modal.innerHTML = `
            <div class="badge-detail-overlay"></div>
            <div class="badge-detail-content">
                <button class="badge-detail-close">&times;</button>
                <div class="badge-detail-icon">${achievement.icon}</div>
                <h2 class="badge-detail-name">${achievement.name}</h2>
                <p class="badge-detail-description">${achievement.description}</p>
                <div class="badge-detail-info">
                    <div class="badge-detail-info-item">
                        <span class="info-label">类型</span>
                        <span class="info-value">${this.getCategoryName(achievement.category)}</span>
                    </div>
                    <div class="badge-detail-info-item">
                        <span class="info-label">成就点</span>
                        <span class="info-value">+${achievement.points}</span>
                    </div>
                    <div class="badge-detail-info-item">
                        <span class="info-label">解锁时间</span>
                        <span class="info-value">${new Date(unlockedData.unlockedAt).toLocaleString('zh-CN')}</span>
                    </div>
                    <div class="badge-detail-info-item">
                        <span class="info-label">要求</span>
                        <span class="info-value">${this.getRequirementText(achievement)}</span>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // 添加关闭事件
        const closeBtn = modal.querySelector('.badge-detail-close');
        const overlay = modal.querySelector('.badge-detail-overlay');

        const closeModal = () => {
            modal.classList.add('closing');
            setTimeout(() => modal.remove(), 300);
        };

        closeBtn.addEventListener('click', closeModal);
        overlay.addEventListener('click', closeModal);

        // 添加动画
        setTimeout(() => modal.classList.add('show'), 10);
    }

    /**
     * 获取类别名称
     */
    getCategoryName(category) {
        const names = {
            'exercise': '运动',
            'learning': '学习'
        };
        return names[category] || category;
    }

    /**
     * 获取要求文本
     */
    getRequirementText(achievement) {
        if (achievement.type === 'streak') {
            return `连续打卡 ${achievement.requirement.streak} 天`;
        } else if (achievement.type === 'total_duration') {
            const hours = Math.floor(achievement.requirement.minutes / 60);
            return `累计 ${hours} 小时`;
        }
        return '未知要求';
    }

    /**
     * 刷新显示
     */
    refresh() {
        this.render();
    }
}
