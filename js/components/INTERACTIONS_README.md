# 动态互动功能实现文档

## 概述

本文档描述了LifeFlow社交系统的动态互动功能实现，包括点赞、评论、删除评论和通知系统。

## 功能特性

### 1. 点赞功能
- ✅ 点击点赞按钮切换点赞状态
- ✅ 点赞后按钮变为红色心形 (❤️)
- ✅ 实时更新点赞计数
- ✅ 取消点赞功能
- ✅ 点赞通知（不给自己发通知）

### 2. 评论功能
- ✅ 评论输入框（1-200字符限制）
- ✅ 实时字符计数显示
- ✅ 评论发布和显示
- ✅ 评论列表展示
- ✅ 评论时间显示（相对时间）
- ✅ 评论通知（不给自己发通知）

### 3. 删除评论功能
- ✅ 仅评论作者可删除自己的评论
- ✅ 动态作者可删除动态下的任何评论
- ✅ 删除前确认对话框
- ✅ 删除后实时更新UI

### 4. 通知系统
- ✅ 点赞通知
- ✅ 评论通知
- ✅ 未读通知计数
- ✅ 通知事件触发

## 组件说明

### CommentList 组件

评论列表组件，负责显示和管理动态的评论。

#### 构造函数参数

```javascript
new CommentList(postId, options)
```

**参数:**
- `postId` (string): 动态ID
- `options` (object): 配置选项
  - `currentUserId` (string): 当前用户ID
  - `maxDisplay` (number): 默认显示的评论数量，默认3条
  - `showAll` (boolean): 是否显示所有评论，默认false
  - `onCommentAdded` (function): 评论添加回调
  - `onCommentDeleted` (function): 评论删除回调
  - `getUserProfile` (function): 获取用户资料回调

#### 主要方法

**render()**
- 渲染评论列表HTML
- 返回: HTML字符串

**createElement()**
- 创建DOM元素
- 返回: HTMLElement

**loadComments(comments)**
- 加载评论数据
- 参数: comments (Array) - 评论列表

**getCommentCount()**
- 获取评论数量
- 返回: number

#### 使用示例

```javascript
// 创建评论列表
const commentList = new CommentList('post_123', {
  currentUserId: 'user1',
  maxDisplay: 3,
  showAll: false,
  onCommentAdded: (postId, comment) => {
    console.log('评论已添加:', comment);
  },
  onCommentDeleted: (postId, commentId) => {
    console.log('评论已删除:', commentId);
  },
  getUserProfile: (userId) => {
    return { nickname: '用户昵称', avatar: null };
  }
});

// 加载评论
commentList.loadComments(post.comments);

// 渲染到页面
const element = commentList.createElement();
document.getElementById('container').appendChild(element);
```

### PostCard 组件更新

PostCard组件已更新以支持互动功能。

#### 新增回调选项

- `onLike` (function): 点赞回调
- `onUnlike` (function): 取消点赞回调
- `onComment` (function): 评论回调
- `onDeleteComment` (function): 删除评论回调

#### 使用示例

```javascript
const postCard = new PostCard(post, {
  currentUserId: 'user1',
  showActions: true,
  showComments: true,
  onLike: (postId) => {
    socialService.likePost(postId, currentUserId);
  },
  onComment: (postId) => {
    // 打开评论模态框
    showCommentModal(postId);
  },
  onDeleteComment: (postId, commentId) => {
    socialService.deleteComment(postId, commentId, currentUserId);
  }
});
```

### SocialService 服务

社交服务已包含完整的互动功能支持。

#### 点赞相关方法

**likePost(postId, userId)**
- 点赞动态
- 返回: boolean - 是否成功

**unlikePost(postId, userId)**
- 取消点赞
- 返回: boolean - 是否成功

**hasLiked(postId, userId)**
- 检查是否已点赞
- 返回: boolean

#### 评论相关方法

**addComment(postId, commentData)**
- 添加评论
- 参数: commentData { authorId, content }
- 返回: Object - 评论对象

**deleteComment(postId, commentId, userId)**
- 删除评论
- 返回: boolean - 是否成功

**getComments(postId)**
- 获取动态的评论列表
- 返回: Array - 评论列表

### NotificationService 服务

通知服务支持点赞和评论通知。

#### 通知方法

**sendLikeNotification(toUserId, fromUserId, postId)**
- 发送点赞通知

**sendCommentNotification(toUserId, fromUserId, postId, commentId)**
- 发送评论通知

**getNotifications(userId, unreadOnly)**
- 获取通知列表
- 参数: unreadOnly (boolean) - 是否只获取未读通知
- 返回: Array - 通知列表

**getUnreadCount(userId)**
- 获取未读通知数量
- 返回: number

## 样式说明

### CommentList 样式

评论列表使用独立的CSS文件 `css/commentList.css`。

#### 主要样式类

- `.comment-list` - 评论列表容器
- `.comment-input-wrapper` - 评论输入框包装器
- `.comment-input` - 评论输入框
- `.comment-submit-btn` - 提交按钮
- `.comment-items` - 评论项容器
- `.comment-item` - 单个评论项
- `.comment-avatar` - 评论者头像
- `.comment-body` - 评论内容区域
- `.comment-delete-btn` - 删除按钮
- `.view-all-comments-btn` - 查看全部评论按钮

#### 响应式设计

- 桌面端: 完整显示所有功能
- 移动端: 
  - 输入框字体大小16px（防止iOS自动缩放）
  - 删除按钮始终显示
  - 触摸目标≥44x44px

#### 暗色模式支持

使用 `@media (prefers-color-scheme: dark)` 自动适配暗色模式。

## 数据流程

### 点赞流程

```
用户点击点赞按钮
    ↓
PostCard.handleLike()
    ↓
SocialService.likePost() / unlikePost()
    ↓
更新LocalStorage
    ↓
NotificationService.sendLikeNotification()
    ↓
触发UI更新
```

### 评论流程

```
用户输入评论内容
    ↓
CommentList.handleSubmitComment()
    ↓
验证内容（1-200字符）
    ↓
SocialService.addComment()
    ↓
更新LocalStorage
    ↓
NotificationService.sendCommentNotification()
    ↓
更新评论列表UI
```

### 删除评论流程

```
用户点击删除按钮
    ↓
确认对话框
    ↓
CommentList.handleDeleteComment()
    ↓
验证权限（作者或动态作者）
    ↓
SocialService.deleteComment()
    ↓
更新LocalStorage
    ↓
更新评论列表UI
```

## 测试

### 测试页面

使用 `test-interactions.html` 进行功能测试。

#### 测试功能

1. **用户切换**: 切换不同用户测试权限控制
2. **点赞测试**: 测试点赞和取消点赞
3. **评论测试**: 测试评论发布和显示
4. **删除测试**: 测试评论删除权限
5. **通知测试**: 查看通知生成情况
6. **统计显示**: 实时显示点赞数、评论数、通知数

#### 测试步骤

1. 打开 `test-interactions.html`
2. 点击"创建测试动态"创建一条动态
3. 切换不同用户进行点赞测试
4. 点击"评论"按钮打开评论框
5. 输入评论内容并发送
6. 切换到动态作者查看通知
7. 测试删除评论功能
8. 查看统计数据更新

### 测试用户

- user1 (张三) - 动态作者
- user2 (李四) - 测试用户
- user3 (王五) - 测试用户

## 集成指南

### 在social.html中集成

```html
<!-- 引入CSS -->
<link rel="stylesheet" href="css/commentList.css">

<!-- 引入JavaScript -->
<script src="js/components/commentList.js"></script>

<!-- 使用示例 -->
<script>
// 初始化服务
const storageManager = new StorageManager('lifeflow');
const socialService = new SocialService(storageManager);
const notificationService = new NotificationService();

// 设置全局实例
window.socialService = socialService;
window.notificationService = notificationService;

// 创建PostCard时传入回调
const postCard = new PostCard(post, {
  currentUserId: getCurrentUserId(),
  onLike: handleLike,
  onComment: handleComment,
  onDeleteComment: handleDeleteComment
});
</script>
```

### 事件监听

```javascript
// 监听通知更新
window.addEventListener('notifications:updated', (e) => {
  const { userId, count } = e.detail;
  updateNotificationBadge(count);
});

// 监听动态创建
window.addEventListener('post:created', (e) => {
  const { post } = e.detail;
  refreshPostFeed();
});

// 监听动态删除
window.addEventListener('post:deleted', (e) => {
  const { postId } = e.detail;
  removePostFromUI(postId);
});
```

## 性能优化

### 1. 防抖处理
- 评论输入框使用防抖避免频繁更新

### 2. 事件委托
- 使用事件委托减少事件监听器数量

### 3. 懒加载
- 评论列表默认只显示3条，点击查看更多

### 4. 批量更新
- 使用DocumentFragment批量更新DOM

## 安全考虑

### 1. XSS防护
- 所有用户输入使用 `escapeHtml()` 转义

### 2. 权限验证
- 删除评论前验证用户权限
- 只能删除自己的评论或自己动态下的评论

### 3. 输入验证
- 评论长度限制1-200字符
- 内容不能为空

### 4. 数据验证
- 所有操作前验证数据完整性

## 已知问题

无

## 未来改进

1. 支持评论回复（二级评论）
2. 支持评论点赞
3. 支持@提及用户
4. 支持表情符号选择器
5. 支持评论编辑
6. 支持评论排序（最新/最热）
7. 支持评论搜索

## 更新日志

### v1.0.0 (2024-11-19)
- ✅ 实现点赞功能
- ✅ 实现评论功能
- ✅ 实现删除评论功能
- ✅ 实现通知系统
- ✅ 创建CommentList组件
- ✅ 创建测试页面
- ✅ 编写文档

## 相关文件

- `js/components/commentList.js` - 评论列表组件
- `css/commentList.css` - 评论列表样式
- `js/components/postCard.js` - 动态卡片组件（已更新）
- `js/services/socialService.js` - 社交服务（已更新）
- `js/services/notificationService.js` - 通知服务（已更新）
- `test-interactions.html` - 测试页面

## 参考资料

- [需求文档](../../.kiro/specs/user-profile-and-social/requirements.md)
- [设计文档](../../.kiro/specs/user-profile-and-social/design.md)
- [任务列表](../../.kiro/specs/user-profile-and-social/tasks.md)
