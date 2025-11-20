# StorageManager - 数据存储与隔离管理器

## 概述

StorageManager 是 LifeFlow 应用的核心数据存储管理器，提供完整的多用户数据隔离、存储空间管理和数据清理功能。

## 主要功能

### 1. 多用户数据隔离

支持多个用户在同一浏览器中使用应用，每个用户的数据完全隔离。

```javascript
const storage = new StorageManager();

// 切换用户
storage.switchUser('user1');

// 获取当前用户
const currentUser = storage.getCurrentUser(); // 'user1'

// 注册新用户
storage.registerUser({
    username: 'newuser',
    nickname: '新用户',
    avatar: 'base64_image_data'
});

// 获取所有用户
const allUsers = storage.getAllUsers();
```

### 2. 用户数据操作

每个用户的数据自动添加用户前缀，确保隔离。

```javascript
// 保存用户数据（自动添加用户前缀）
storage.saveData('profile', {
    username: 'user1',
    nickname: '测试用户',
    avatar: 'base64_data'
});

// 加载用户数据
const profile = storage.loadData('profile');

// 保存健康数据
storage.saveData('health', {
    height: 175,
    weight: 70,
    bmi: 22.9
});
```

### 3. 聊天记录唯一键生成

确保两个用户之间的聊天记录使用唯一且一致的键。

```javascript
// 生成聊天键（无论用户顺序如何，键都相同）
const key1 = storage.getChatKey('alice', 'bob');
const key2 = storage.getChatKey('bob', 'alice');
// key1 === key2 === 'lifeflow_chat_alice_bob'

// 保存聊天消息
storage.saveChatMessages('alice', 'bob', [
    { id: 1, senderId: 'alice', receiverId: 'bob', content: '你好' },
    { id: 2, senderId: 'bob', receiverId: 'alice', content: '你好啊' }
]);

// 加载聊天消息
const messages = storage.loadChatMessages('alice', 'bob');
```

### 4. LocalStorage 空间检测

实时监控存储空间使用情况，提供警告和建议。

```javascript
// 获取存储空间信息
const info = storage.getStorageInfo();
console.log(info);
// {
//     usedSpace: 2048576,           // 已使用字节数
//     userSpace: 512000,            // 当前用户数据大小
//     estimatedLimit: 5242880,      // 估计限制（5MB）
//     usedPercentage: '39.06',      // 使用百分比
//     formattedUsed: '2.00 MB',     // 格式化的已使用空间
//     formattedLimit: '5.00 MB',    // 格式化的限制
//     needsCleanup: false,          // 是否需要清理
//     critical: false               // 是否严重不足
// }

// 检查存储空间（会自动显示警告）
storage.checkStorageSpace();

// 格式化字节大小
const formatted = storage.formatBytes(1024 * 1024); // '1.00 MB'
```

### 5. 数据清理功能

提供智能的数据清理建议和执行功能。

```javascript
// 获取清理建议
const suggestions = storage.getCleanupSuggestions();
console.log(suggestions);
// {
//     needsCleanup: true,
//     storageInfo: {...},
//     suggestions: [
//         {
//             type: 'posts',
//             count: 25,
//             description: '删除25条超过90天的旧动态',
//             estimatedSpace: '500.00 KB'
//         },
//         {
//             type: 'chats',
//             count: 15,
//             description: '清理15个聊天记录（每个只保留最近100条）',
//             estimatedSpace: '250.00 KB'
//         }
//     ]
// }

// 执行清理
const result = storage.performCleanup(['posts', 'chats', 'notifications']);
console.log(result);
// {
//     success: true,
//     cleaned: [
//         { type: 'posts', count: 25 },
//         { type: 'chats', count: 15 }
//     ],
//     errors: []
// }

// 导出用户数据
const userData = storage.exportUserData();
// 返回包含所有用户数据的对象

// 清除当前用户所有数据
storage.clearUserData();
```

### 6. 全局数据操作

某些数据（如所有动态、好友关系）是全局的，不需要用户前缀。

```javascript
// 保存全局数据
storage.saveGlobalData('social_posts', [
    { id: 1, content: '动态1', authorId: 'user1' },
    { id: 2, content: '动态2', authorId: 'user2' }
]);

// 加载全局数据
const posts = storage.loadGlobalData('social_posts', []);

// 全局数据键
storage.GLOBAL_KEYS = {
    SOCIAL_POSTS: 'lifeflow_social_posts',
    SOCIAL_REPORTS: 'lifeflow_social_reports',
    FRIENDSHIPS: 'lifeflow_friendships',
    FRIEND_REQUESTS: 'lifeflow_friend_requests',
    CHALLENGES: 'lifeflow_challenges',
    USERS: 'lifeflow_users'
};
```

## 存储键命名规范

### 用户数据键
格式: `lifeflow_{username}_{dataKey}`

示例:
- `lifeflow_user1_profile` - 用户资料
- `lifeflow_user1_health` - 健康数据
- `lifeflow_user1_notifications` - 通知
- `lifeflow_user1_blocklist` - 黑名单

### 全局数据键
格式: `lifeflow_{dataKey}`

示例:
- `lifeflow_social_posts` - 所有动态
- `lifeflow_friendships` - 好友关系
- `lifeflow_challenges` - 挑战数据

### 聊天记录键
格式: `lifeflow_chat_{user1}_{user2}` (按字母顺序排序)

示例:
- `lifeflow_chat_alice_bob`
- `lifeflow_chat_charlie_david`

## 事件系统

StorageManager 会触发以下自定义事件：

### 用户切换事件
```javascript
window.addEventListener('lifeflow:user:switched', (e) => {
    console.log('用户已切换:', e.detail.username);
});
```

### 存储空间警告事件
```javascript
window.addEventListener('lifeflow:storage:warning', (e) => {
    console.log('存储警告:', e.detail.level); // 'warning' | 'critical'
    console.log('消息:', e.detail.message);
    console.log('存储信息:', e.detail.info);
});
```

### 存储空间不足事件
```javascript
window.addEventListener('lifeflow:storage:quota_exceeded', (e) => {
    console.log('存储空间已满:', e.detail);
    // 显示清理建议
});
```

### 活动更新事件
```javascript
window.addEventListener('lifeflow:activity:updated', (e) => {
    console.log('活动已更新:', e.detail.type); // 'exercise' | 'learning'
});
```

## 错误处理

### QuotaExceededError
当 LocalStorage 空间不足时，会自动捕获并处理：

```javascript
try {
    storage.saveData('large_data', hugeObject);
} catch (error) {
    // 自动触发 lifeflow:storage:quota_exceeded 事件
    // 显示清理建议
}
```

## 数据清理策略

### 自动清理规则
1. **动态**: 只保留最近 90 天的动态
2. **聊天记录**: 每个聊天只保留最近 100 条消息
3. **通知**: 只保留最近 100 条通知
4. **图片**: 上传时自动压缩到合理大小

### 手动清理
用户可以通过界面手动触发清理：
- 清理旧动态
- 清理聊天记录
- 清理通知
- 导出数据后清空

## 性能优化

### 缓存机制
如果存在 `storageCache` 对象，会自动使用缓存优化读写性能：

```javascript
// 使用缓存（如果可用）
if (this.cache) {
    this.cache.set(key, data);
    const data = this.cache.get(key);
}
```

### 批量操作
建议批量操作数据，减少 LocalStorage 读写次数：

```javascript
// 不推荐：多次读写
for (let i = 0; i < 100; i++) {
    const data = storage.loadData(`item_${i}`);
    // 处理数据
    storage.saveData(`item_${i}`, data);
}

// 推荐：批量读写
const allData = storage.loadData('all_items', []);
// 批量处理
storage.saveData('all_items', allData);
```

## 迁移旧数据

StorageManager 会自动迁移旧格式的数据到新的用户隔离格式：

```javascript
// 旧格式: lifeflow_exercise_activities
// 新格式: lifeflow_default_exercise_activities

// 自动迁移（在首次加载时）
storage.migrateOldData('exercise');
storage.migrateOldData('learning');
```

## 最佳实践

### 1. 始终使用 StorageManager
不要直接使用 `localStorage`，始终通过 StorageManager 操作数据。

### 2. 定期检查存储空间
在关键操作前检查存储空间：

```javascript
const info = storage.checkStorageSpace();
if (info.critical) {
    // 提示用户清理数据
    showCleanupDialog();
}
```

### 3. 提供数据导出功能
允许用户导出数据后清理：

```javascript
function exportAndClean() {
    const data = storage.exportUserData();
    downloadJSON(data);
    storage.clearUserData();
}
```

### 4. 压缩大型数据
对于图片等大型数据，使用压缩：

```javascript
// 使用 ImageCompressor 压缩图片
const compressed = await ImageCompressor.compress(file, {
    maxSize: 5 * 1024 * 1024,
    quality: 0.8
});
storage.saveData('avatar', compressed);
```

## 测试

使用 `test-storage-isolation.html` 测试所有功能：

1. 多用户数据隔离
2. 用户数据操作
3. 聊天记录唯一键生成
4. LocalStorage 空间检测
5. 数据清理建议
6. 全局数据操作

## 兼容性

- 支持所有现代浏览器
- LocalStorage 限制: 5-10MB（因浏览器而异）
- 自动处理存储空间不足错误

## 相关文件

- `js/modules/storageManager.js` - 核心实现
- `test-storage-isolation.html` - 功能测试页面
- `.kiro/specs/user-profile-and-social/design.md` - 设计文档
- `.kiro/specs/user-profile-and-social/requirements.md` - 需求文档
