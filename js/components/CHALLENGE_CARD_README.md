# ChallengeCard Component

## 概述

ChallengeCard 是 LifeFlow 应用的打卡挑战组件，提供完整的挑战创建、邀请、参与、进度追踪和排行榜功能。

## 功能特性

### 1. 挑战创建
- 支持运动挑战和学习挑战两种类型
- 自定义每日目标时长（分钟）
- 设置挑战持续天数（1-30天）
- 邀请好友参与挑战
- 创建者自动成为参与者

### 2. 挑战邀请
- 显示收到的挑战邀请通知
- 接受或拒绝邀请
- 接受后自动加入挑战
- 通知创建者邀请被接受

### 3. 进度追踪
- 显示挑战进度条
- 每日进度更新
- 自动同步运动/学习活动数据
- 实时计算完成率

### 4. 排行榜
- 显示所有参与者排名
- 按完成率排序
- 高亮当前用户
- 显示前三名特殊标识（🥇🥈🥉）

### 5. 挑战完成
- 自动检测挑战结束
- 发送完成通知给所有参与者
- 颁发冠军徽章
- 显示最终排名和统计

## 使用方法

### 基本用法

```javascript
import { StorageManager } from './js/utils/storage.js';
import { ChallengeService } from './js/services/challengeService.js';
import { ProfileService } from './js/services/profileService.js';
import { FriendService } from './js/services/friendService.js';
import { ChallengeCard } from './js/components/challengeCard.js';

// 创建服务实例
const storageManager = new StorageManager('lifeflow');
const challengeService = new ChallengeService(storageManager);
const profileService = new ProfileService(storageManager);
const friendService = new FriendService(storageManager);

// 创建组件
const container = document.getElementById('challengeContainer');
const challengeCard = new ChallengeCard(
  container,
  challengeService,
  profileService,
  friendService
);
```

### HTML 结构

```html
<div id="challengeContainer"></div>
```

### CSS 引入

```html
<link rel="stylesheet" href="css/challengeCard.css">
```

## API 文档

### ChallengeService

#### createChallenge(creatorId, challengeData)
创建新挑战

**参数:**
- `creatorId` (string): 创建者用户ID
- `challengeData` (object): 挑战数据
  - `type` (string): 'exercise' 或 'learning'
  - `targetMinutes` (number): 每日目标分钟数
  - `durationDays` (number): 挑战天数 (1-30)
  - `invitedFriends` (array): 邀请的好友ID列表

**返回:** 创建的挑战对象

**示例:**
```javascript
const challenge = challengeService.createChallenge('user1', {
  type: 'exercise',
  targetMinutes: 30,
  durationDays: 7,
  invitedFriends: ['user2', 'user3']
});
```

#### acceptChallenge(challengeId, userId)
接受挑战邀请

**参数:**
- `challengeId` (string): 挑战ID
- `userId` (string): 用户ID

**返回:** boolean - 是否成功

#### updateProgress(challengeId, userId, date, minutes)
更新挑战进度

**参数:**
- `challengeId` (string): 挑战ID
- `userId` (string): 用户ID
- `date` (string): 日期 (YYYY-MM-DD)
- `minutes` (number): 完成分钟数

**返回:** boolean - 是否成功

#### syncActivityToChallenge(userId, date, type, minutes)
自动同步活动数据到挑战

**参数:**
- `userId` (string): 用户ID
- `date` (string): 日期 (YYYY-MM-DD)
- `type` (string): 'exercise' 或 'learning'
- `minutes` (number): 活动分钟数

**示例:**
```javascript
// 当用户完成运动时
challengeService.syncActivityToChallenge('user1', '2024-01-15', 'exercise', 45);

// 当用户完成学习时
challengeService.syncActivityToChallenge('user1', '2024-01-15', 'learning', 90);
```

#### getLeaderboard(challengeId)
获取挑战排行榜

**参数:**
- `challengeId` (string): 挑战ID

**返回:** 排行榜数组，每项包含:
- `userId` (string): 用户ID
- `totalMinutes` (number): 总分钟数
- `daysCompleted` (number): 完成天数
- `completionRate` (number): 完成率 (0-100)
- `avgMinutesPerDay` (number): 平均每天分钟数

#### getActiveChallenges(userId)
获取用户的活跃挑战

**参数:**
- `userId` (string): 用户ID

**返回:** 活跃挑战数组

#### getChallengeInvitations(userId)
获取用户收到的挑战邀请

**参数:**
- `userId` (string): 用户ID

**返回:** 邀请数组

## 数据结构

### Challenge 对象

```javascript
{
  id: 'challenge_1234567890_abc123',
  creatorId: 'user1',
  type: 'exercise', // 'exercise' 或 'learning'
  targetMinutes: 30,
  durationDays: 7,
  participants: ['user1', 'user2', 'user3'],
  invitedFriends: ['user2', 'user3'],
  progress: {
    'user1': {
      '2024-01-15': 45,
      '2024-01-16': 30
    },
    'user2': {
      '2024-01-15': 60
    }
  },
  startDate: '2024-01-15',
  endDate: '2024-01-22',
  status: 'active', // 'active' 或 'completed'
  createdAt: 1705305600000
}
```

## 事件系统

### 监听事件

```javascript
// 挑战创建事件
window.addEventListener('challenge:created', (event) => {
  const challenge = event.detail.challenge;
  console.log('新挑战创建:', challenge);
});

// 挑战更新事件
window.addEventListener('challenge:updated', (event) => {
  const challenge = event.detail.challenge;
  console.log('挑战已更新:', challenge);
});
```

## 集成指南

### 与运动模块集成

在运动记录保存时自动同步到挑战：

```javascript
// 在 exercise.html 中
function saveExercise(exerciseData) {
  // 保存运动记录
  storageManager.saveExercises(exercises);
  
  // 同步到挑战
  const today = new Date().toISOString().split('T')[0];
  challengeService.syncActivityToChallenge(
    currentUserId,
    today,
    'exercise',
    exerciseData.duration
  );
}
```

### 与学习模块集成

在学习记录保存时自动同步到挑战：

```javascript
// 在 learning.html 中
function saveLearning(learningData) {
  // 保存学习记录
  storageManager.saveLearningActivities(activities);
  
  // 同步到挑战
  const today = new Date().toISOString().split('T')[0];
  challengeService.syncActivityToChallenge(
    currentUserId,
    today,
    'learning',
    learningData.duration
  );
}
```

### 定时检查过期挑战

建议在应用启动时检查并完成过期的挑战：

```javascript
// 在应用初始化时
document.addEventListener('DOMContentLoaded', () => {
  challengeService.checkAndCompleteExpiredChallenges();
});
```

## 样式定制

### 修改主题色

```css
/* 修改挑战卡片主色调 */
.btn-create-challenge {
  background: linear-gradient(135deg, #your-color-1 0%, #your-color-2 100%);
}

.progress-fill {
  background: linear-gradient(90deg, #your-color-1 0%, #your-color-2 100%);
}
```

### 修改类型徽章颜色

```css
.challenge-type-badge.exercise {
  background: #your-exercise-bg;
  color: #your-exercise-color;
}

.challenge-type-badge.learning {
  background: #your-learning-bg;
  color: #your-learning-color;
}
```

## 测试

### 运行测试页面

```bash
# 在浏览器中打开
open test-challenge.html
```

### 测试功能

1. **创建挑战**: 点击"创建测试挑战"按钮
2. **更新进度**: 点击"更新今日进度"按钮
3. **同步活动**: 点击"同步活动数据"按钮
4. **完成挑战**: 点击"完成挑战"按钮
5. **切换用户**: 点击用户切换按钮查看不同用户视角

## 性能优化

### 数据缓存

挑战数据存储在 LocalStorage 中，使用以下键：
- `challenges`: 所有挑战数据

### 建议

1. 定期清理已完成超过30天的挑战
2. 限制每个用户同时参与的挑战数量（建议不超过5个）
3. 使用虚拟滚动处理大量挑战列表

## 常见问题

### Q: 如何自动同步活动数据？

A: 在运动或学习记录保存时调用 `syncActivityToChallenge` 方法：

```javascript
challengeService.syncActivityToChallenge(userId, date, type, minutes);
```

### Q: 如何颁发挑战徽章？

A: 在 `awardChampionBadge` 方法中集成成就系统：

```javascript
awardChampionBadge(userId, challenge) {
  if (window.achievementManager) {
    const badgeType = challenge.type === 'exercise' 
      ? 'exercise_champion' 
      : 'learning_champion';
    window.achievementManager.unlockAchievement(userId, badgeType);
  }
}
```

### Q: 如何处理挑战过期？

A: 使用 `checkAndCompleteExpiredChallenges` 方法定期检查：

```javascript
// 每天检查一次
setInterval(() => {
  challengeService.checkAndCompleteExpiredChallenges();
}, 24 * 60 * 60 * 1000);
```

## 浏览器兼容性

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 许可证

MIT License

## 更新日志

### v1.0.0 (2024-01-15)
- 初始版本
- 实现挑战创建、邀请、参与功能
- 实现进度追踪和排行榜
- 实现挑战完成和徽章颁发
