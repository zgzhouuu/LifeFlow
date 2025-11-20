# ChatWindow 组件文档

## 概述

ChatWindow 是一个功能完整的聊天窗口组件，实现了一对一聊天功能，包括消息发送、历史记录加载、快捷鼓励、提醒功能等。

## 功能特性

### 核心功能
- ✅ 聊天窗口打开（点击好友）
- ✅ 加载历史消息（最近100条）
- ✅ 消息发送功能（1-500字符）
- ✅ 显示未读消息红点
- ✅ 消息已读标记
- ✅ 快捷鼓励按钮和预设语
- ✅ 提醒按钮（提醒运动/学习）
- ✅ 自动滚动到最新消息

### 附加功能
- 实时字符计数
- 输入框自动调整高度
- Ctrl/Cmd + Enter 快捷发送
- 消息时间格式化显示
- 提醒消息特殊样式
- 响应式设计
- 深色模式支持

## 使用方法

### 基本用法

```javascript
// 初始化聊天窗口
const chatWindow = new ChatWindow('chatWindowContainer', {
  currentUserId: 'user1',
  friendId: 'user2',
  chatService: chatService,
  profileService: profileService,
  onClose: () => {
    console.log('聊天窗口关闭');
  }
});
```

### 配置选项

```javascript
{
  currentUserId: null,           // 必需：当前用户ID
  friendId: null,                // 必需：聊天对象ID
  chatService: null,             // 必需：ChatService实例
  profileService: null,          // 可选：ProfileService实例
  onClose: null,                 // 可选：关闭回调函数
  maxMessages: 100,              // 可选：最多显示消息数（默认100）
  autoScroll: true,              // 可选：自动滚动到底部（默认true）
  showQuickActions: true         // 可选：显示快捷操作（默认true）
}
```

## API 方法

### 公共方法

#### `refresh()`
刷新聊天窗口，重新加载消息并标记为已读。

```javascript
chatWindow.refresh();
```

#### `switchFriend(friendId)`
切换聊天对象。

```javascript
chatWindow.switchFriend('user3');
```

#### `close()`
关闭聊天窗口。

```javascript
chatWindow.close();
```

#### `getUnreadCount()`
获取未读消息数量。

```javascript
const unreadCount = chatWindow.getUnreadCount();
```

#### `scrollToBottom()`
滚动到消息底部。

```javascript
chatWindow.scrollToBottom();
```

#### `destroy()`
销毁组件，清理资源。

```javascript
chatWindow.destroy();
```

## 事件

### 监听事件

组件会触发以下全局事件：

#### `message:sent`
消息发送时触发。

```javascript
window.addEventListener('message:sent', (e) => {
  console.log('消息已发送:', e.detail.message);
});
```

#### `messages:read`
消息标记为已读时触发。

```javascript
window.addEventListener('messages:read', (e) => {
  console.log('消息已读:', e.detail);
});
```

## 消息类型

### 普通文本消息
```javascript
{
  id: 'msg_xxx',
  senderId: 'user1',
  receiverId: 'user2',
  content: '你好！',
  type: 'text',
  read: false,
  createdAt: 1234567890
}
```

### 提醒消息
```javascript
{
  id: 'msg_xxx',
  senderId: 'user1',
  receiverId: 'user2',
  content: '⏰ 提醒你今天要运动哦！',
  type: 'reminder',
  read: false,
  createdAt: 1234567890
}
```

## 快捷鼓励语列表

组件内置了以下快捷鼓励语：
- 加油！💪
- 坚持就是胜利！🎯
- 你真棒！👍
- 继续保持！✨
- 做得好！🌟
- 相信自己！💫
- 你可以的！🔥
- 太厉害了！🎉
- 再接再厉！🚀
- 非常棒！👏

## 样式定制

### CSS 变量

可以通过修改 CSS 变量来定制样式：

```css
.chat-window {
  --chat-primary-color: #667eea;
  --chat-secondary-color: #764ba2;
  --chat-bg-color: #f8f9fa;
  --chat-message-sent-bg: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  --chat-message-received-bg: white;
}
```

### 自定义样式类

主要样式类：
- `.chat-window` - 聊天窗口容器
- `.chat-header` - 头部区域
- `.chat-messages` - 消息容器
- `.chat-message` - 单条消息
- `.chat-message-sent` - 发送的消息
- `.chat-message-received` - 接收的消息
- `.chat-message-reminder` - 提醒消息
- `.chat-input-area` - 输入区域
- `.chat-quick-actions` - 快捷操作面板
- `.chat-encouragements-panel` - 鼓励语面板

## 响应式设计

### 桌面端（>768px）
- 消息最大宽度：70%
- 显示字符计数
- 快捷操作横向排列

### 移动端（≤768px）
- 消息最大宽度：85%
- 隐藏字符计数
- 快捷操作纵向排列
- 输入框字体大小16px（防止iOS自动缩放）

## 性能优化

### 消息加载
- 默认只加载最近100条消息
- 支持配置最大消息数量
- 自动清理旧消息

### 滚动优化
- 使用 `scroll-behavior: smooth`
- 防抖处理滚动事件
- 延迟滚动到底部（100ms）

### 内存管理
- 组件销毁时清理事件监听
- 清空DOM引用
- 释放资源

## 安全性

### XSS 防护
所有用户输入都经过 HTML 转义处理：

```javascript
escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
```

### 输入验证
- 消息长度限制：1-500字符
- 自动去除首尾空格
- 防止空消息发送

## 集成示例

### 与 FriendList 集成

```javascript
// 在 FriendList 中打开聊天窗口
const friendList = new FriendList('friendListContainer', {
  currentUserId: 'user1',
  friendService: friendService,
  profileService: profileService,
  onFriendClick: (friendId) => {
    // 打开聊天窗口
    const chatWindow = new ChatWindow('chatWindowContainer', {
      currentUserId: 'user1',
      friendId: friendId,
      chatService: chatService,
      profileService: profileService
    });
  }
});
```

### 与 NotificationService 集成

```javascript
// 监听新消息通知
window.addEventListener('message:sent', (e) => {
  const { message } = e.detail;
  
  // 如果是接收到的消息，显示通知
  if (message.receiverId === currentUserId) {
    notificationService.sendMessageNotification(
      message.receiverId,
      message.senderId,
      message.content
    );
  }
});
```

## 浏览器兼容性

- Chrome/Edge: ✅ 完全支持
- Firefox: ✅ 完全支持
- Safari: ✅ 完全支持
- iOS Safari: ✅ 完全支持
- Android Chrome: ✅ 完全支持

## 已知问题

1. **iOS 虚拟键盘遮挡**
   - 解决方案：使用 `viewport-fit=cover` 和动态调整布局

2. **长消息性能**
   - 解决方案：限制消息长度为500字符

3. **大量消息加载**
   - 解决方案：默认只加载100条，支持分页

## 测试

运行测试页面：
```bash
# 在浏览器中打开
test-chat-window.html
```

测试功能：
- ✅ 发送消息
- ✅ 接收消息
- ✅ 快捷鼓励
- ✅ 提醒功能
- ✅ 消息已读
- ✅ 自动滚动
- ✅ 字符计数
- ✅ 响应式布局

## 更新日志

### v1.0.0 (2024-01-19)
- ✅ 初始版本发布
- ✅ 实现所有核心功能
- ✅ 完成响应式设计
- ✅ 添加深色模式支持

## 相关文档

- [ChatService API 文档](../services/chatService.js)
- [ProfileService API 文档](../services/profileService.js)
- [需求文档](../../.kiro/specs/user-profile-and-social/requirements.md)
- [设计文档](../../.kiro/specs/user-profile-and-social/design.md)

## 许可证

MIT License
