# PostFeed 组件文档

## 概述

PostFeed 是一个功能完整的动态流展示组件，用于显示社交动态列表。支持下拉刷新、分页加载、虚拟滚动、点赞、评论、标签过滤等功能。

## 功能特性

### 核心功能
- ✅ 动态列表加载和渲染
- ✅ 按时间倒序排列动态
- ✅ 下拉刷新功能（移动端）
- ✅ 滚动加载更多（分页）
- ✅ 虚拟滚动优化（超过20条）
- ✅ 空状态提示
- ✅ 加载状态提示
- ✅ 结束提示（没有更多）

### 交互功能
- ✅ 点赞/取消点赞
- ✅ 评论（回调）
- ✅ 删除动态（仅作者）
- ✅ 举报动态
- ✅ 标签过滤
- ✅ 图片查看（回调）
- ✅ 删除评论（作者或动态作者）

### 显示功能
- ✅ 用户头像和昵称
- ✅ 相对时间显示（如"3分钟前"）
- ✅ 动态内容（文字、图片、标签）
- ✅ 成就分享特殊样式
- ✅ 图片网格布局（1/2-4/5-9张）
- ✅ 评论列表（显示前3条）
- ✅ 点赞数和评论数

## 使用方法

### 基本用法

```javascript
// 初始化 PostFeed
const postFeed = new PostFeed('containerId', {
  currentUserId: 'user123',
  friendIds: ['friend1', 'friend2'],
  blockedUserIds: [],
  pageSize: 20,
  enableVirtualScroll: true,
  enablePullRefresh: true,
  onLike: (postId, isLiked) => {
    console.log(`Post ${postId} ${isLiked ? 'liked' : 'unliked'}`);
  },
  onComment: (postId) => {
    // 打开评论输入框
  },
  onDelete: (postId) => {
    console.log(`Post ${postId} deleted`);
  },
  onReport: (postId) => {
    // 打开举报对话框
  },
  onImageClick: (postId, index) => {
    // 打开图片查看器
  }
});
```

### HTML 结构

```html
<div id="postsFeed"></div>
```

### 引入依赖

```html
<!-- CSS -->
<link rel="stylesheet" href="css/postFeed.css">

<!-- JavaScript -->
<script src="js/modules/storageManager.js"></script>
<script src="js/utils/dateFormatter.js"></script>
<script src="js/services/socialService.js"></script>
<script src="js/components/postFeed.js"></script>
```

## 配置选项

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `pageSize` | Number | 20 | 每页显示的动态数量 |
| `enableVirtualScroll` | Boolean | true | 是否启用虚拟滚动 |
| `enablePullRefresh` | Boolean | true | 是否启用下拉刷新 |
| `currentUserId` | String | null | 当前用户ID |
| `friendIds` | Array | [] | 好友ID列表 |
| `blockedUserIds` | Array | [] | 黑名单用户ID列表 |
| `filterTag` | String | null | 标签过滤 |
| `onLike` | Function | null | 点赞回调 |
| `onComment` | Function | null | 评论回调 |
| `onDelete` | Function | null | 删除回调 |
| `onReport` | Function | null | 举报回调 |
| `onImageClick` | Function | null | 图片点击回调 |

## API 方法

### refresh()
刷新动态列表（重新加载第一页）

```javascript
postFeed.refresh();
```

### loadMore()
加载更多动态（下一页）

```javascript
postFeed.loadMore();
```

### clearFilter()
清除标签过滤

```javascript
postFeed.clearFilter();
```

### updateOptions(newOptions)
更新配置选项

```javascript
postFeed.updateOptions({
  filterTag: '#运动',
  friendIds: ['friend1', 'friend2', 'friend3']
});
```

### destroy()
销毁组件，移除事件监听器

```javascript
postFeed.destroy();
```

## 事件监听

PostFeed 会自动监听以下全局事件：

- `post:created` - 动态创建时自动刷新
- `post:deleted` - 动态删除时自动更新列表

## 动态数据结构

```javascript
{
  id: 'post_1234567890_abc',
  authorId: 'user123',
  content: '动态内容',
  images: ['base64...', 'base64...'],
  type: 'normal', // 或 'achievement'
  achievementId: 'achievement_id',
  tags: ['#运动', '#学习'],
  visibility: 'public', // 或 'friends', 'private'
  likes: ['user1', 'user2'],
  comments: [
    {
      id: 'comment_1234567890_abc',
      postId: 'post_1234567890_abc',
      authorId: 'user456',
      content: '评论内容',
      createdAt: 1234567890000
    }
  ],
  createdAt: 1234567890000
}
```

## 样式定制

### CSS 变量

可以通过覆盖 CSS 类来定制样式：

```css
/* 自定义卡片样式 */
.post-card {
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* 自定义点赞按钮颜色 */
.post-action-btn.liked {
  background: #FFE8E8;
  color: #E74C3C;
}

/* 自定义标签颜色 */
.post-tag {
  background: #667eea;
  color: white;
}
```

## 性能优化

### 虚拟滚动
当动态数量超过 `pageSize` 时，组件会自动启用分页加载，避免一次性渲染大量 DOM 元素。

### 图片懒加载
图片使用 `loading="lazy"` 属性，浏览器会自动延迟加载屏幕外的图片。

### 防抖处理
滚动事件已经过优化，只在滚动到底部 80% 时触发加载更多。

### 事件委托
所有动态交互事件使用事件委托，减少事件监听器数量。

## 响应式设计

PostFeed 完全支持响应式设计：

- **桌面端** (>768px): 完整显示所有功能
- **平板端** (768px): 适配中等屏幕
- **移动端** (<768px): 优化触摸交互，支持下拉刷新

## 浏览器兼容性

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 测试

使用 `test-post-feed.html` 进行功能测试：

```bash
# 在浏览器中打开
open test-post-feed.html
```

测试功能：
- 创建测试动态
- 批量创建动态
- 点赞/取消点赞
- 标签过滤
- 滚动加载更多
- 下拉刷新（移动端）
- 删除动态

## 常见问题

### Q: 为什么动态不显示？
A: 检查以下几点：
1. 确保 `socialService` 已正确初始化
2. 确保 `currentUserId` 已设置
3. 检查浏览器控制台是否有错误
4. 确认 LocalStorage 中有动态数据

### Q: 如何自定义空状态提示？
A: 修改 `render()` 方法中的空状态 HTML：

```javascript
<div class="post-feed-empty">
  <div class="empty-icon">📝</div>
  <p>自定义提示文字</p>
</div>
```

### Q: 如何禁用下拉刷新？
A: 在初始化时设置 `enablePullRefresh: false`：

```javascript
const postFeed = new PostFeed('containerId', {
  enablePullRefresh: false
});
```

### Q: 如何实现实时更新？
A: PostFeed 会自动监听 `post:created` 和 `post:deleted` 事件。当其他组件触发这些事件时，动态流会自动更新。

## 更新日志

### v1.0.0 (2024-11-19)
- ✅ 初始版本发布
- ✅ 支持动态列表加载和渲染
- ✅ 支持下拉刷新和分页加载
- ✅ 支持点赞、评论、删除等交互
- ✅ 支持标签过滤
- ✅ 完整的响应式设计

## 许可证

MIT License

## 作者

LifeFlow Team
