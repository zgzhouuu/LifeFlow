/**
 * DataMigration
 * 数据迁移工具 - 将旧的exercises和learnings数据转换为新的activities格式
 */

class DataMigration {
    constructor() {
        // 旧数据的LocalStorage键名
        this.OLD_KEYS = {
            EXERCISES: 'lifeflow_exercises',
            LEARNINGS: 'lifeflow_learnings'
        };

        // 新数据的LocalStorage键名
        this.NEW_KEYS = {
            EXERCISE_ACTIVITIES: 'lifeflow_exercise_activities',
            LEARNING_ACTIVITIES: 'lifeflow_learning_activities'
        };

        // 迁移状态标记键名
        this.MIGRATION_STATUS_KEYS = {
            EXERCISE: 'lifeflow_migration_exercise_completed',
            LEARNING: 'lifeflow_migration_learning_completed'
        };

        // 备份键名
        this.BACKUP_KEYS = {
            EXERCISES: 'lifeflow_exercises_backup',
            LEARNINGS: 'lifeflow_learnings_backup'
        };
    }

    /**
     * 检查是否需要迁移运动数据
     * @returns {boolean} 是否需要迁移
     */
    needsExerciseMigration() {
        // 如果已经迁移过，不需要再次迁移
        if (localStorage.getItem(this.MIGRATION_STATUS_KEYS.EXERCISE) === 'true') {
            return false;
        }

        // 检查是否存在旧数据
        const oldData = localStorage.getItem(this.OLD_KEYS.EXERCISES);
        if (!oldData) {
            return false;
        }

        try {
            const exercises = JSON.parse(oldData);
            return Array.isArray(exercises) && exercises.length > 0;
        } catch (error) {
            console.error('检查运动数据迁移需求失败:', error);
            return false;
        }
    }

    /**
     * 检查是否需要迁移学习数据
     * @returns {boolean} 是否需要迁移
     */
    needsLearningMigration() {
        // 如果已经迁移过，不需要再次迁移
        if (localStorage.getItem(this.MIGRATION_STATUS_KEYS.LEARNING) === 'true') {
            return false;
        }

        // 检查是否存在旧数据
        const oldData = localStorage.getItem(this.OLD_KEYS.LEARNINGS);
        if (!oldData) {
            return false;
        }

        try {
            const learnings = JSON.parse(oldData);
            return Array.isArray(learnings) && learnings.length > 0;
        } catch (error) {
            console.error('检查学习数据迁移需求失败:', error);
            return false;
        }
    }

    /**
     * 迁移运动数据
     * 将旧的exercises数据转换为新的activities格式
     * @returns {Object} 迁移结果 { success: boolean, migratedCount: number, error?: string }
     */
    migrateExerciseData() {
        try {
            console.log('开始迁移运动数据...');

            // 加载旧数据
            const oldData = localStorage.getItem(this.OLD_KEYS.EXERCISES);
            if (!oldData) {
                console.log('没有找到旧的运动数据');
                return { success: true, migratedCount: 0 };
            }

            const exercises = JSON.parse(oldData);
            if (!Array.isArray(exercises) || exercises.length === 0) {
                console.log('旧的运动数据为空');
                return { success: true, migratedCount: 0 };
            }

            // 备份原有数据
            localStorage.setItem(this.BACKUP_KEYS.EXERCISES, oldData);
            console.log(`已备份 ${exercises.length} 条运动数据`);

            // 转换数据格式
            const activities = exercises.map(exercise => this._convertExerciseToActivity(exercise));

            // 保存新格式数据
            localStorage.setItem(this.NEW_KEYS.EXERCISE_ACTIVITIES, JSON.stringify(activities));
            console.log(`已转换并保存 ${activities.length} 条运动活动`);

            // 标记迁移完成
            localStorage.setItem(this.MIGRATION_STATUS_KEYS.EXERCISE, 'true');

            return {
                success: true,
                migratedCount: activities.length
            };
        } catch (error) {
            console.error('迁移运动数据失败:', error);
            return {
                success: false,
                migratedCount: 0,
                error: error.message
            };
        }
    }

    /**
     * 迁移学习数据
     * 将旧的learnings数据转换为新的activities格式
     * @returns {Object} 迁移结果 { success: boolean, migratedCount: number, error?: string }
     */
    migrateLearningData() {
        try {
            console.log('开始迁移学习数据...');

            // 加载旧数据
            const oldData = localStorage.getItem(this.OLD_KEYS.LEARNINGS);
            if (!oldData) {
                console.log('没有找到旧的学习数据');
                return { success: true, migratedCount: 0 };
            }

            const learnings = JSON.parse(oldData);
            if (!Array.isArray(learnings) || learnings.length === 0) {
                console.log('旧的学习数据为空');
                return { success: true, migratedCount: 0 };
            }

            // 备份原有数据
            localStorage.setItem(this.BACKUP_KEYS.LEARNINGS, oldData);
            console.log(`已备份 ${learnings.length} 条学习数据`);

            // 转换数据格式
            const activities = learnings.map(learning => this._convertLearningToActivity(learning));

            // 保存新格式数据
            localStorage.setItem(this.NEW_KEYS.LEARNING_ACTIVITIES, JSON.stringify(activities));
            console.log(`已转换并保存 ${activities.length} 条学习活动`);

            // 标记迁移完成
            localStorage.setItem(this.MIGRATION_STATUS_KEYS.LEARNING, 'true');

            return {
                success: true,
                migratedCount: activities.length
            };
        } catch (error) {
            console.error('迁移学习数据失败:', error);
            return {
                success: false,
                migratedCount: 0,
                error: error.message
            };
        }
    }

    /**
     * 将旧的exercise对象转换为新的activity格式
     * @param {Object} exercise - 旧的运动记录对象
     * @returns {Object} 新的activity对象
     * @private
     */
    _convertExerciseToActivity(exercise) {
        return {
            id: exercise.id || Date.now() + Math.random(),
            date: exercise.date,
            type: 'exercise',
            name: exercise.type || '运动', // 旧数据的type字段对应新数据的name字段
            duration: exercise.duration || 0,
            notes: exercise.notes || '',
            completed: true, // 旧数据都是已完成的记录
            completedAt: exercise.createdAt || new Date(exercise.date).toISOString(),
            createdAt: exercise.createdAt || new Date(exercise.date).toISOString()
        };
    }

    /**
     * 将旧的learning对象转换为新的activity格式
     * @param {Object} learning - 旧的学习记录对象
     * @returns {Object} 新的activity对象
     * @private
     */
    _convertLearningToActivity(learning) {
        return {
            id: learning.id || Date.now() + Math.random(),
            date: learning.date,
            type: 'learning',
            name: learning.subject || '学习', // 旧数据的subject字段对应新数据的name字段
            duration: learning.duration || 0,
            notes: learning.note || learning.notes || '', // 旧数据可能用note或notes字段
            completed: true, // 旧数据都是已完成的记录
            completedAt: learning.createdAt || new Date(learning.date).toISOString(),
            createdAt: learning.createdAt || new Date(learning.date).toISOString()
        };
    }

    /**
     * 执行所有必要的数据迁移
     * @returns {Object} 迁移结果汇总
     */
    migrateAll() {
        const results = {
            exercise: { success: false, migratedCount: 0 },
            learning: { success: false, migratedCount: 0 }
        };

        // 迁移运动数据
        if (this.needsExerciseMigration()) {
            results.exercise = this.migrateExerciseData();
        } else {
            results.exercise = { success: true, migratedCount: 0, skipped: true };
        }

        // 迁移学习数据
        if (this.needsLearningMigration()) {
            results.learning = this.migrateLearningData();
        } else {
            results.learning = { success: true, migratedCount: 0, skipped: true };
        }

        return results;
    }

    /**
     * 重置迁移状态（用于测试）
     * @param {string} type - 'exercise' | 'learning' | 'all'
     */
    resetMigrationStatus(type = 'all') {
        if (type === 'exercise' || type === 'all') {
            localStorage.removeItem(this.MIGRATION_STATUS_KEYS.EXERCISE);
        }
        if (type === 'learning' || type === 'all') {
            localStorage.removeItem(this.MIGRATION_STATUS_KEYS.LEARNING);
        }
    }

    /**
     * 恢复备份数据（用于回滚）
     * @param {string} type - 'exercise' | 'learning'
     * @returns {boolean} 是否恢复成功
     */
    restoreBackup(type) {
        try {
            if (type === 'exercise') {
                const backup = localStorage.getItem(this.BACKUP_KEYS.EXERCISES);
                if (backup) {
                    localStorage.setItem(this.OLD_KEYS.EXERCISES, backup);
                    localStorage.removeItem(this.MIGRATION_STATUS_KEYS.EXERCISE);
                    console.log('已恢复运动数据备份');
                    return true;
                }
            } else if (type === 'learning') {
                const backup = localStorage.getItem(this.BACKUP_KEYS.LEARNINGS);
                if (backup) {
                    localStorage.setItem(this.OLD_KEYS.LEARNINGS, backup);
                    localStorage.removeItem(this.MIGRATION_STATUS_KEYS.LEARNING);
                    console.log('已恢复学习数据备份');
                    return true;
                }
            }
            return false;
        } catch (error) {
            console.error('恢复备份失败:', error);
            return false;
        }
    }

    /**
     * 获取迁移状态信息
     * @returns {Object} 迁移状态信息
     */
    getMigrationStatus() {
        return {
            exercise: {
                completed: localStorage.getItem(this.MIGRATION_STATUS_KEYS.EXERCISE) === 'true',
                hasOldData: !!localStorage.getItem(this.OLD_KEYS.EXERCISES),
                hasBackup: !!localStorage.getItem(this.BACKUP_KEYS.EXERCISES),
                hasNewData: !!localStorage.getItem(this.NEW_KEYS.EXERCISE_ACTIVITIES)
            },
            learning: {
                completed: localStorage.getItem(this.MIGRATION_STATUS_KEYS.LEARNING) === 'true',
                hasOldData: !!localStorage.getItem(this.OLD_KEYS.LEARNINGS),
                hasBackup: !!localStorage.getItem(this.BACKUP_KEYS.LEARNINGS),
                hasNewData: !!localStorage.getItem(this.NEW_KEYS.LEARNING_ACTIVITIES)
            }
        };
    }
}
