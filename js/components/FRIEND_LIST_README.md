# FriendList Component

好友列表组件 - 用于显示和管理用户的好友关系

## 功能特性

### 核心功能
- ✅ 显示好友列表（头像、昵称、活跃时间）
- ✅ 搜索用户功能
- ✅ 发送好友请求
- ✅ 接受/拒绝好友请求
- ✅ 删除好友
- ✅ 加入黑名单
- ✅ 好友请求通知徽章
- ✅ 响应式设计

### 视图模式
1. **好友列表视图** - 显示所有好友
2. **搜索视图** - 搜索并添加新好友
3. **请求视图** - 管理待处理的好友请求

## 使用方法

### 基本用法

```javascript
// 初始化服务
const storageManager = new StorageManager();
const profileService = new ProfileService(storageManager);
const friendService = new FriendService(storageManager);

// 创建组件
const friendList = new FriendList('friendListContainer', {
    currentUserId: 'username',
    friendService: friendService,
    profileService: profileService,
    showSearch: true,
    showRequests: true,
    onFriendClick: (friendId) => {
        console.log('Open chat with:', friendId);
    },
    onFriendAdded: (friendId) => {
        console.log('Friend added:', friendId);
    },
    onFriendRemoved: (friendId) => {
        console.log('Friend removed:', friendId);
    }
});
```

### HTML 结构

```html
<div id="friendListContainer"></div>
```

### 样式引入

```html
<link rel="stylesheet" href="css/friendList.css">
```

## 配置选项

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `currentUserId` | string | null | 当前用户ID（必需） |
| `friendService` | FriendService | null | 好友服务实例（必需） |
| `profileService` | ProfileService | null | 资料服务实例（可选） |
| `onFriendClick` | function | null | 好友点击回调 |
| `onFriendAdded` | function | null | 好友添加回调 |
| `onFriendRemoved` | function | null | 好友删除回调 |
| `showSearch` | boolean | true | 是否显示搜索功能 |
| `showRequests` | boolean | true | 是否显示好友请求 |
| `maxDisplayFriends` | number | 50 | 最多显示好友数 |

## API 方法

### refresh()
刷新组件数据和显示

```javascript
friendList.refresh();
```

### switchView(view)
切换视图模式

```javascript
friendList.switchView('list');    // 好友列表
friendList.switchView('search');  // 搜索视图
friendList.switchView('requests'); // 请求视图
```

### destroy()
销毁组件

```javascript
friendList.destroy();
```

## 事件监听

组件会监听以下全局事件：

- `friend:added` - 好友添加时触发
- `friend:removed` - 好友删除时触发

## 组件结构

```
FriendList
├── Header
│   ├── Tabs (好友/请求)
│   └── Add Friend Button
├── Content
│   ├── Friends List View
│   │   └── Friend Items
│   ├── Search View
│   │   ├── Search Box
│   │   └── Search Results
│   └── Requests View
│       └── Request Items
```

## 好友列表视图

### 功能
- 显示所有好友
- 显示最近活跃时间
- 点击好友打开聊天
- 长按显示菜单（删除、屏蔽）

### 示例
```
┌─────────────────────────────┐
│ 👥 好友 (3)  📬 请求       │
│ ➕ 添加好友                 │
├─────────────────────────────┤
│ 👤 爱丽丝                   │
│    活跃于 2小时前      💬 ⋮ │
├─────────────────────────────┤
│ 👤 鲍勃                     │
│    活跃于 1天前        💬 ⋮ │
└─────────────────────────────┘
```

## 搜索视图

### 功能
- 搜索用户名或昵称
- 显示搜索结果
- 发送好友请求
- 显示已发送状态

### 示例
```
┌─────────────────────────────┐
│ ← 返回    添加好友          │
├─────────────────────────────┤
│ [搜索框]              🔍    │
├─────────────────────────────┤
│ 👤 查理                     │
│    @charlie          [添加] │
├─────────────────────────────┤
│ 👤 大卫                     │
│    @david          [已发送] │
└─────────────────────────────┘
```

## 请求视图

### 功能
- 显示待处理的好友请求
- 接受或拒绝请求
- 显示请求时间

### 示例
```
┌─────────────────────────────┐
│ 👥 好友     📬 请求 (2)     │
├─────────────────────────────┤
│ 👤 艾玛                     │
│    2小时前    [接受] [拒绝] │
├─────────────────────────────┤
│ 👤 弗兰克                   │
│    1天前      [接受] [拒绝] │
└─────────────────────────────┘
```

## 样式定制

### CSS 变量
组件使用以下主要颜色：

```css
/* 主色调 */
--primary-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

/* 成功色 */
--success-gradient: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%);

/* 背景色 */
--bg-color: #f5f5f5;
--card-bg: white;

/* 文字色 */
--text-primary: #333;
--text-secondary: #666;
--text-hint: #999;
```

### 自定义样式示例

```css
/* 修改主色调 */
.friend-tab.active {
    background: linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%);
}

/* 修改好友项悬停效果 */
.friend-item:hover {
    background: #e8f4f8;
    transform: translateX(4px);
}

/* 修改头像样式 */
.friend-avatar {
    border: 2px solid #667eea;
}
```

## 响应式设计

### 桌面端 (>768px)
- 完整功能显示
- 悬停效果
- 较大的点击区域

### 移动端 (<768px)
- 紧凑布局
- 触摸优化
- 简化的交互

## 依赖项

### 必需
- `StorageManager` - 数据存储管理
- `FriendService` - 好友关系服务
- `DateFormatter` - 日期格式化工具

### 可选
- `ProfileService` - 用户资料服务（用于获取头像和昵称）

## 数据格式

### 好友数据
```javascript
{
    userId: 'alice',
    nickname: '爱丽丝',
    avatar: 'data:image/jpeg;base64,...',
    lastActive: 1234567890
}
```

### 好友请求数据
```javascript
{
    id: 'req_123456',
    fromUserId: 'bob',
    toUserId: 'alice',
    status: 'pending',
    createdAt: 1234567890
}
```

## 错误处理

组件会捕获并处理以下错误：

1. **初始化错误** - 缺少必需参数
2. **加载错误** - 数据加载失败
3. **操作错误** - 好友操作失败

错误会通过 `showNotification` 函数显示给用户。

## 性能优化

1. **虚拟滚动** - 大量好友时使用虚拟滚动
2. **防抖搜索** - 搜索输入使用防抖
3. **事件委托** - 使用事件委托减少监听器
4. **懒加载** - 头像懒加载

## 测试

### 测试页面
打开 `test-friend-list.html` 进行测试

### 测试功能
- 添加测试用户
- 添加测试好友
- 添加测试请求
- 清除数据
- 刷新组件

### 测试命令
```javascript
// 在浏览器控制台中
testAddMockUsers();     // 添加测试用户
testAddMockFriends();   // 添加测试好友
testAddMockRequests();  // 添加测试请求
testClearData();        // 清除数据
testRefresh();          // 刷新组件
```

## 集成示例

### 在社交页面中使用

```html
<!-- HTML -->
<div id="friendsList"></div>

<!-- JavaScript -->
<script>
const friendList = new FriendList('friendsList', {
    currentUserId: currentUser,
    friendService: friendService,
    profileService: profileService,
    onFriendClick: (friendId) => {
        // 打开聊天窗口
        openChatWindow(friendId);
    },
    onFriendAdded: (friendId) => {
        // 刷新动态流
        postFeed.refresh();
    }
});
</script>
```

## 常见问题

### Q: 如何自定义头像占位符？
A: 修改 CSS 中的 `.avatar-placeholder` 样式

### Q: 如何限制好友数量？
A: 在 `FriendService` 中添加好友数量检查

### Q: 如何添加在线状态？
A: 扩展 `getLastActiveTime` 方法，添加在线状态判断

### Q: 如何支持好友分组？
A: 扩展数据模型，添加分组字段和过滤逻辑

## 更新日志

### v1.0.0 (2024-01-XX)
- ✅ 初始版本
- ✅ 好友列表显示
- ✅ 用户搜索功能
- ✅ 好友请求管理
- ✅ 删除好友功能
- ✅ 黑名单功能
- ✅ 响应式设计

## 许可证

MIT License

## 作者

LifeFlow Team
