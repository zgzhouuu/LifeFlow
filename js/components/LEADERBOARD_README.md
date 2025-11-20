# Leaderboard Component

排行榜组件 - 显示好友运动和学习时长排名

## 功能特性

### 核心功能
- ✅ 显示好友运动时长排名
- ✅ 显示好友学习时长排名
- ✅ 本周/本月视图切换
- ✅ 高亮显示当前用户排名
- ✅ 显示用户头像和昵称
- ✅ 显示总时长和活跃天数
- ✅ 前三名奖牌显示（🥇🥈🥉）

### 数据计算
- 自动计算指定时间范围内的活动数据
- 支持按周（从周一开始）和按月（从月初开始）统计
- 按总时长降序排序，时长相同时按活跃天数排序
- 实时响应数据更新

## 使用方法

### 基本用法

```html
<!-- 引入依赖 -->
<link rel="stylesheet" href="css/leaderboard.css">
<script src="js/models/Activity.js"></script>
<script src="js/modules/storageManager.js"></script>
<script src="js/services/profileService.js"></script>
<script src="js/services/friendService.js"></script>
<script src="js/components/leaderboard.js"></script>

<!-- 容器 -->
<div id="leaderboardContainer"></div>

<!-- 初始化 -->
<script>
  // 创建服务实例
  const storageManager = {
    load: (key) => {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    },
    save: (key, value) => {
      localStorage.setItem(key, JSON.stringify(value));
    }
  };
  
  const profileService = new ProfileService(storageManager);
  const friendService = new FriendService(storageManager);
  
  // 初始化排行榜
  const leaderboard = new Leaderboard(
    'leaderboardContainer',
    friendService,
    profileService
  );
</script>
```

### 在社交页面中使用

```html
<!-- social.html -->
<div class="social-container">
  <!-- 其他社交组件 -->
  
  <!-- 排行榜 -->
  <div id="leaderboardContainer"></div>
</div>

<script>
  // 假设已经初始化了 friendService 和 profileService
  const leaderboard = new Leaderboard(
    'leaderboardContainer',
    window.friendService,
    window.profileService
  );
</script>
```

## API 文档

### 构造函数

```javascript
new Leaderboard(container, friendService, profileService)
```

**参数：**
- `container` (string | HTMLElement) - 容器元素或ID
- `friendService` (FriendService) - 好友服务实例
- `profileService` (ProfileService) - 用户资料服务实例

### 方法

#### `init()`
初始化组件，渲染界面并附加事件监听器。

```javascript
leaderboard.init();
```

#### `render()`
渲染组件界面。

```javascript
leaderboard.render();
```

#### `refresh()`
刷新组件数据和界面。

```javascript
leaderboard.refresh();
```

#### `destroy()`
销毁组件，移除事件监听器。

```javascript
leaderboard.destroy();
```

### 属性

#### `currentView`
当前视图模式：`'week'` 或 `'month'`

#### `currentType`
当前活动类型：`'exercise'` 或 `'learning'`

#### `currentUserId`
当前用户ID

## 数据结构

### 排名数据格式

```javascript
{
  userId: 'user1',           // 用户ID
  nickname: '张三',          // 用户昵称
  avatar: 'avatar_url',      // 用户头像URL
  totalMinutes: 150,         // 总时长（分钟）
  daysActive: 5              // 活跃天数
}
```

## 样式定制

### CSS 变量

组件使用以下主要颜色：

```css
/* 主色调 */
--primary-color: #667eea;
--primary-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

/* 当前用户高亮 */
--highlight-bg: linear-gradient(135deg, #fff9e6 0%, #ffe8a3 100%);
--highlight-border: #FFD700;

/* 文字颜色 */
--text-primary: #2C3E50;
--text-secondary: #7F8C8D;
```

### 自定义样式示例

```css
/* 修改排名项背景 */
.rank-item {
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

/* 修改当前用户高亮颜色 */
.rank-item.current-user {
  background: linear-gradient(135deg, #ffeaa7 0%, #fdcb6e 100%);
  border-color: #e17055;
}

/* 修改奖牌大小 */
.rank-number.top-three {
  font-size: 28px;
}
```

## 事件监听

组件会自动监听以下事件：

### `lifeflow:activity:updated`
活动数据更新时触发，组件会自动刷新。

```javascript
window.dispatchEvent(new CustomEvent('lifeflow:activity:updated', {
  detail: { type: 'exercise' }
}));
```

### `friend:added`
添加好友时触发，组件会自动刷新。

```javascript
window.dispatchEvent(new CustomEvent('friend:added', {
  detail: { userId1: 'user1', userId2: 'user2' }
}));
```

### `friend:removed`
删除好友时触发，组件会自动刷新。

```javascript
window.dispatchEvent(new CustomEvent('friend:removed', {
  detail: { userId: 'user1', friendId: 'user2' }
}));
```

## 测试

### 运行测试页面

1. 打开 `test-leaderboard.html`
2. 点击"生成测试用户和活动数据"
3. 查看排行榜显示
4. 切换类型（运动/学习）和视图（本周/本月）
5. 切换用户查看不同视角

### 测试场景

- ✅ 空状态显示（无好友）
- ✅ 单个好友排名
- ✅ 多个好友排名
- ✅ 当前用户高亮
- ✅ 前三名奖牌显示
- ✅ 类型切换（运动/学习）
- ✅ 视图切换（本周/本月）
- ✅ 数据实时更新

## 性能优化

### 数据缓存
- 使用 StorageManager 的缓存机制
- 避免重复读取 localStorage

### 渲染优化
- 只在数据变化时重新渲染
- 使用 CSS 动画而非 JavaScript 动画

### 内存管理
- 组件销毁时清理事件监听器
- 避免内存泄漏

## 浏览器兼容性

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

## 依赖项

- `Activity.js` - 活动数据模型
- `StorageManager` - 数据存储管理
- `ProfileService` - 用户资料服务
- `FriendService` - 好友关系服务

## 已知问题

无

## 更新日志

### v1.0.0 (2024-01-XX)
- ✅ 初始版本
- ✅ 支持运动和学习排行榜
- ✅ 支持本周/本月视图
- ✅ 高亮当前用户
- ✅ 前三名奖牌显示

## 许可证

MIT License
