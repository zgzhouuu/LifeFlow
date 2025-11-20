/**
 * AchievementManager
 * 成就系统管理器 - 管理徽章、连续打卡、总时长成就
 */
class AchievementManager {
    constructor() {
        this.storageManager = new StorageManager();
        this.currentUser = localStorage.getItem('lifeflow_current_user') || 'default';
        
        // 定义所有成就
        this.achievements = this._defineAchievements();
        
        // 加载用户成就数据
        this.userAchievements = this.loadUserAchievements();
    }

    /**
     * 定义所有成就
     */
    _defineAchievements() {
        return {
            // 连续打卡成就 - 运动
            exercise_streak_7: {
                id: 'exercise_streak_7',
                name: '运动新星',
                description: '连续运动打卡7天',
                icon: '🌟',
                type: 'streak',
                category: 'exercise',
                requirement: { streak: 7 },
                points: 50
            },
            exercise_streak_30: {
                id: 'exercise_streak_30',
                name: '运动达人',
                description: '连续运动打卡30天',
                icon: '🏆',
                type: 'streak',
                category: 'exercise',
                requirement: { streak: 30 },
                points: 200
            },
            exercise_streak_100: {
                id: 'exercise_streak_100',
                name: '运动大师',
                description: '连续运动打卡100天',
                icon: '👑',
                type: 'streak',
                category: 'exercise',
                requirement: { streak: 100 },
                points: 1000
            },
            exercise_streak_365: {
                id: 'exercise_streak_365',
                name: '运动传奇',
                description: '连续运动打卡365天',
                icon: '💎',
                type: 'streak',
                category: 'exercise',
                requirement: { streak: 365 },
                points: 5000
            },
            
            // 连续打卡成就 - 学习
            learning_streak_7: {
                id: 'learning_streak_7',
                name: '学习新星',
                description: '连续学习打卡7天',
                icon: '⭐',
                type: 'streak',
                category: 'learning',
                requirement: { streak: 7 },
                points: 50
            },
            learning_streak_30: {
                id: 'learning_streak_30',
                name: '学习之星',
                description: '连续学习打卡30天',
                icon: '🎓',
                type: 'streak',
                category: 'learning',
                requirement: { streak: 30 },
                points: 200
            },
            learning_streak_100: {
                id: 'learning_streak_100',
                name: '学习大师',
                description: '连续学习打卡100天',
                icon: '📚',
                type: 'streak',
                category: 'learning',
                requirement: { streak: 100 },
                points: 1000
            },
            learning_streak_365: {
                id: 'learning_streak_365',
                name: '学习传奇',
                description: '连续学习打卡365天',
                icon: '🌈',
                type: 'streak',
                category: 'learning',
                requirement: { streak: 365 },
                points: 5000
            },
            
            // 总时长成就 - 运动
            exercise_total_10h: {
                id: 'exercise_total_10h',
                name: '运动起步',
                description: '累计运动10小时',
                icon: '🏃',
                type: 'total_duration',
                category: 'exercise',
                requirement: { minutes: 600 },
                points: 30
            },
            exercise_total_50h: {
                id: 'exercise_total_50h',
                name: '运动健将',
                description: '累计运动50小时',
                icon: '💪',
                type: 'total_duration',
                category: 'exercise',
                requirement: { minutes: 3000 },
                points: 150
            },
            exercise_total_100h: {
                id: 'exercise_total_100h',
                name: '运动精英',
                description: '累计运动100小时',
                icon: '🥇',
                type: 'total_duration',
                category: 'exercise',
                requirement: { minutes: 6000 },
                points: 300
            },
            exercise_total_500h: {
                id: 'exercise_total_500h',
                name: '运动冠军',
                description: '累计运动500小时',
                icon: '🏅',
                type: 'total_duration',
                category: 'exercise',
                requirement: { minutes: 30000 },
                points: 1500
            },
            exercise_total_1000h: {
                id: 'exercise_total_1000h',
                name: '运动之神',
                description: '累计运动1000小时',
                icon: '⚡',
                type: 'total_duration',
                category: 'exercise',
                requirement: { minutes: 60000 },
                points: 3000
            },
            
            // 总时长成就 - 学习
            learning_total_10h: {
                id: 'learning_total_10h',
                name: '学习起步',
                description: '累计学习10小时',
                icon: '📖',
                type: 'total_duration',
                category: 'learning',
                requirement: { minutes: 600 },
                points: 30
            },
            learning_total_50h: {
                id: 'learning_total_50h',
                name: '学习健将',
                description: '累计学习50小时',
                icon: '📝',
                type: 'total_duration',
                category: 'learning',
                requirement: { minutes: 3000 },
                points: 150
            },
            learning_total_100h: {
                id: 'learning_total_100h',
                name: '学习精英',
                description: '累计学习100小时',
                icon: '🎯',
                type: 'total_duration',
                category: 'learning',
                requirement: { minutes: 6000 },
                points: 300
            },
            learning_total_500h: {
                id: 'learning_total_500h',
                name: '学习冠军',
                description: '累计学习500小时',
                icon: '🏆',
                type: 'total_duration',
                category: 'learning',
                requirement: { minutes: 30000 },
                points: 1500
            },
            learning_total_1000h: {
                id: 'learning_total_1000h',
                name: '学识渊博',
                description: '累计学习1000小时',
                icon: '🌟',
                type: 'total_duration',
                category: 'learning',
                requirement: { minutes: 60000 },
                points: 3000
            }
        };
    }

    /**
     * 加载用户成就数据
     */
    loadUserAchievements() {
        const key = this.storageManager._getUserKey('achievements');
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : {
            unlockedAchievements: [],
            totalPoints: 0,
            lastChecked: null
        };
    }

    /**
     * 保存用户成就数据
     */
    saveUserAchievements() {
        const key = this.storageManager._getUserKey('achievements');
        localStorage.setItem(key, JSON.stringify(this.userAchievements));
    }

    /**
     * 检查并解锁成就
     * @param {string} category - 类别（'exercise' | 'learning'）
     */
    checkAndUnlockAchievements(category) {
        const newAchievements = [];
        
        // 检查连续打卡成就
        const streakAchievements = this._checkStreakAchievements(category);
        newAchievements.push(...streakAchievements);
        
        // 检查总时长成就
        const durationAchievements = this._checkDurationAchievements(category);
        newAchievements.push(...durationAchievements);
        
        // 解锁新成就
        if (newAchievements.length > 0) {
            newAchievements.forEach(achievement => {
                this._unlockAchievement(achievement);
            });
            
            this.saveUserAchievements();
        }
        
        return newAchievements;
    }

    /**
     * 检查连续打卡成就
     */
    _checkStreakAchievements(category) {
        const newAchievements = [];
        const currentStreak = this._calculateCurrentStreak(category);
        
        // 遍历该类别的连续打卡成就
        Object.values(this.achievements).forEach(achievement => {
            if (achievement.category === category && 
                achievement.type === 'streak' &&
                !this._isAchievementUnlocked(achievement.id)) {
                
                if (currentStreak >= achievement.requirement.streak) {
                    newAchievements.push(achievement);
                }
            }
        });
        
        return newAchievements;
    }

    /**
     * 检查总时长成就
     */
    _checkDurationAchievements(category) {
        const newAchievements = [];
        const totalMinutes = this._calculateTotalDuration(category);
        
        // 遍历该类别的总时长成就
        Object.values(this.achievements).forEach(achievement => {
            if (achievement.category === category && 
                achievement.type === 'total_duration' &&
                !this._isAchievementUnlocked(achievement.id)) {
                
                if (totalMinutes >= achievement.requirement.minutes) {
                    newAchievements.push(achievement);
                }
            }
        });
        
        return newAchievements;
    }

    /**
     * 计算当前连续打卡天数
     */
    _calculateCurrentStreak(category) {
        const activities = this.storageManager.loadActivities(category);
        if (activities.length === 0) return 0;
        
        // 按日期分组
        const dateMap = new Map();
        activities.forEach(activity => {
            const date = activity.date;
            if (!dateMap.has(date)) {
                dateMap.set(date, true);
            }
        });
        
        // 计算连续天数
        const today = new Date();
        let streak = 0;
        let currentDate = new Date(today);
        
        while (true) {
            const dateStr = currentDate.toISOString().split('T')[0];
            if (dateMap.has(dateStr)) {
                streak++;
                currentDate.setDate(currentDate.getDate() - 1);
            } else {
                // 如果是今天没有打卡，允许一天的宽限期
                if (streak === 0 && dateStr === today.toISOString().split('T')[0]) {
                    currentDate.setDate(currentDate.getDate() - 1);
                    continue;
                }
                break;
            }
        }
        
        return streak;
    }

    /**
     * 计算总时长（分钟）
     */
    _calculateTotalDuration(category) {
        const activities = this.storageManager.loadActivities(category);
        return activities.reduce((total, activity) => {
            return total + (activity.duration || 0);
        }, 0);
    }

    /**
     * 检查成就是否已解锁
     */
    _isAchievementUnlocked(achievementId) {
        return this.userAchievements.unlockedAchievements.some(a => a.id === achievementId);
    }

    /**
     * 解锁成就
     */
    _unlockAchievement(achievement) {
        const unlockedData = {
            id: achievement.id,
            name: achievement.name,
            description: achievement.description,
            icon: achievement.icon,
            points: achievement.points,
            unlockedAt: new Date().toISOString()
        };
        
        this.userAchievements.unlockedAchievements.push(unlockedData);
        this.userAchievements.totalPoints += achievement.points;
        
        // 显示成就解锁通知
        this._showAchievementNotification(achievement);
    }

    /**
     * 显示成就解锁通知
     */
    _showAchievementNotification(achievement) {
        if (typeof showNotification !== 'undefined') {
            showNotification(
                `🎉 恭喜解锁成就！\n${achievement.icon} ${achievement.name}\n${achievement.description}\n+${achievement.points} 成就点`,
                'achievement',
                5000
            );
        }
    }

    /**
     * 获取用户所有已解锁成就
     */
    getUnlockedAchievements() {
        return this.userAchievements.unlockedAchievements;
    }

    /**
     * 获取用户总成就点
     */
    getTotalPoints() {
        return this.userAchievements.totalPoints;
    }

    /**
     * 获取成就进度
     */
    getAchievementProgress(category) {
        const currentStreak = this._calculateCurrentStreak(category);
        const totalMinutes = this._calculateTotalDuration(category);
        
        const progress = {
            streak: currentStreak,
            totalHours: Math.floor(totalMinutes / 60),
            totalMinutes: totalMinutes,
            nextStreakAchievement: null,
            nextDurationAchievement: null
        };
        
        // 找到下一个连续打卡成就
        const streakAchievements = Object.values(this.achievements)
            .filter(a => a.category === category && a.type === 'streak' && !this._isAchievementUnlocked(a.id))
            .sort((a, b) => a.requirement.streak - b.requirement.streak);
        
        if (streakAchievements.length > 0) {
            progress.nextStreakAchievement = streakAchievements[0];
        }
        
        // 找到下一个总时长成就
        const durationAchievements = Object.values(this.achievements)
            .filter(a => a.category === category && a.type === 'total_duration' && !this._isAchievementUnlocked(a.id))
            .sort((a, b) => a.requirement.minutes - b.requirement.minutes);
        
        if (durationAchievements.length > 0) {
            progress.nextDurationAchievement = durationAchievements[0];
        }
        
        return progress;
    }

    /**
     * 获取所有成就列表（包括未解锁的）
     */
    getAllAchievements(category = null) {
        let achievementList = Object.values(this.achievements);
        
        if (category) {
            achievementList = achievementList.filter(a => a.category === category);
        }
        
        return achievementList.map(achievement => ({
            ...achievement,
            unlocked: this._isAchievementUnlocked(achievement.id),
            unlockedAt: this._getUnlockedDate(achievement.id)
        }));
    }

    /**
     * 获取成就解锁日期
     */
    _getUnlockedDate(achievementId) {
        const unlocked = this.userAchievements.unlockedAchievements.find(a => a.id === achievementId);
        return unlocked ? unlocked.unlockedAt : null;
    }
}
