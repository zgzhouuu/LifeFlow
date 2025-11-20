# NotificationCenter Component

## 概述

NotificationCenter 是一个浮层组件，用于显示和管理用户的所有通知。它提供了一个集中的界面来查看、标记已读和处理各种类型的通知。

## 功能特性

### 核心功能

1. **通知显示**
   - 显示所有未读和已读通知
   - 按类型分组显示（好友请求、消息、点赞、评论等）
   - 显示通知时间（相对时间格式）
   - 未读通知高亮显示

2. **通知操作**
   - 点击通知标记为已读
   - 点击通知跳转到相关页面
   - 全部标记已读功能
   - 清空所有通知功能

3. **交互体验**
   - 平滑的打开/关闭动画
   - 点击外部区域关闭
   - ESC键关闭
   - 响应式设计，适配移动端

4. **实时更新**
   - 监听通知更新事件
   - 自动刷新通知列表
   - 自动更新未读数量徽章

## 使用方法

### 基本使用

```javascript
import { NotificationCenter } from './js/components/notificationCenter.js';

// 创建通知中心实例
const notificationCenter = new NotificationCenter();

// 打开通知中心
notificationCenter.open();

// 关闭通知中心
notificationCenter.close();

// 切换显示状态
notificationCenter.toggle();
```

### 在 HTML 中集成

```html
<!-- 引入样式 -->
<link rel="stylesheet" href="css/notificationCenter.css">

<!-- 通知图标 -->
<div class="notification-icon" onclick="toggleNotificationCenter()">
    🔔
    <span class="notification-badge" id="notificationBadge">0</span>
</div>

<!-- 引入脚本 -->
<script type="module">
    import { NotificationCenter } from './js/components/notificationCenter.js';
    
    const notificationCenter = new NotificationCenter();
    window.notificationCenter = notificationCenter;
    
    function toggleNotificationCenter() {
        notificationCenter.toggle();
    }
</script>
```

## 通知类型

支持以下通知类型：

| 类型 | 图标 | 说明 | 跳转目标 |
|------|------|------|----------|
| `friend_request` | 👋 | 好友请求 | 社交页面-好友列表 |
| `friend_accepted` | ✅ | 好友接受 | 社交页面-好友列表 |
| `message` | 💬 | 新消息 | 社交页面-聊天 |
| `like` | ❤️ | 点赞 | 社交页面-动态详情 |
| `comment` | 💭 | 评论 | 社交页面-动态详情 |
| `reminder` | ⏰ | 提醒 | 运动/学习页面 |
| `challenge_invite` | 🏆 | 挑战邀请 | 社交页面-挑战 |
| `challenge_complete` | 🎉 | 挑战完成 | 社交页面-挑战 |

## API 方法

### open()

打开通知中心。

```javascript
notificationCenter.open();
```

### close()

关闭通知中心。

```javascript
notificationCenter.close();
```

### toggle()

切换通知中心的显示状态。

```javascript
notificationCenter.toggle();
```

### refresh()

刷新通知列表（仅在打开状态下有效）。

```javascript
notificationCenter.refresh();
```

### markAllAsRead()

标记所有通知为已读。

```javascript
notificationCenter.markAllAsRead();
```

### clearAll()

清空所有通知（需要用户确认）。

```javascript
notificationCenter.clearAll();
```

## 事件监听

通知中心会监听以下事件：

### notifications:updated

当通知更新时触发，自动刷新显示。

```javascript
window.addEventListener('notifications:updated', (e) => {
    console.log('通知已更新:', e.detail);
});
```

## 样式定制

### CSS 变量

可以通过修改 CSS 变量来定制样式：

```css
.notification-center {
    /* 位置 */
    top: 80px;
    right: 20px;
    
    /* 尺寸 */
    width: 400px;
    max-height: calc(100vh - 120px);
    
    /* 颜色 */
    background: white;
    
    /* 圆角 */
    border-radius: 16px;
    
    /* 阴影 */
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}
```

### 响应式断点

- 桌面端：宽度 400px
- 移动端（<768px）：全宽，左右各留 10px 边距

## 数据结构

### 通知对象

```javascript
{
    id: 'notif_1234567890_abc',
    type: 'like',
    fromUserId: 'user123',
    message: '赞了你的动态',
    data: {
        postId: 'post_456'
    },
    read: false,
    createdAt: 1234567890000
}
```

## 依赖项

- `notificationService.js` - 通知服务
- `dateFormatter.js` - 日期格式化工具
- `notificationCenter.css` - 样式文件

## 浏览器兼容性

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 性能优化

1. **虚拟滚动**：当通知数量超过 100 条时，只保留最近的通知
2. **事件委托**：使用事件委托处理通知点击
3. **防抖处理**：避免频繁刷新
4. **懒加载**：只在打开时渲染内容

## 测试

使用 `test-notification-center.html` 进行功能测试：

```bash
# 在浏览器中打开
open test-notification-center.html
```

测试功能包括：
- 发送各种类型的通知
- 批量发送通知
- 打开/关闭通知中心
- 标记已读/清空通知
- 查看通知统计

## 已知问题

无

## 更新日志

### v1.0.0 (2025-01-19)
- 初始版本
- 实现基本的通知显示和管理功能
- 支持 8 种通知类型
- 响应式设计
- 完整的交互动画

## 贡献指南

如需添加新的通知类型：

1. 在 `getNotificationIcon()` 中添加图标
2. 在 `navigateByNotificationType()` 中添加跳转逻辑
3. 在 `groupNotificationsByType()` 中添加分组
4. 更新文档

## 许可证

MIT License
