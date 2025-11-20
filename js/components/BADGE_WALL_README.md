# BadgeWall Component

勋章墙组件 - 在个人资料页面显示所有已解锁的成就徽章

## 功能特性

### 核心功能
- ✅ 显示所有已解锁的成就徽章
- ✅ 显示徽章总数和总成就点
- ✅ 点击徽章查看详细信息
- ✅ 拖拽调整徽章顺序（桌面端）
- ✅ 长按调整徽章顺序（移动端）
- ✅ 自动保存用户自定义的徽章顺序
- ✅ 空状态提示
- ✅ 响应式设计

### 徽章详情模态框
- 显示徽章图标、名称、描述
- 显示徽章类型（运动/学习）
- 显示成就点数
- 显示解锁时间
- 显示获得要求

## 使用方法

### 基本用法

```javascript
// 初始化成就管理器
const achievementManager = new AchievementManager();

// 创建勋章墙组件
const badgeWall = new BadgeWall('badgeWall', achievementManager);

// 渲染勋章墙
badgeWall.render();
```

### HTML 结构

```html
<!-- 在页面中添加容器 -->
<div id="badgeWall"></div>

<!-- 引入必要的脚本 -->
<script src="js/modules/storageManager.js"></script>
<script src="js/modules/achievementManager.js"></script>
<script src="js/components/badgeWall.js"></script>
```

### CSS 样式

```html
<!-- 引入样式文件 -->
<link rel="stylesheet" href="css/badgeWall.css">
```

## API 文档

### 构造函数

```javascript
new BadgeWall(containerId, achievementManager)
```

**参数：**
- `containerId` (string): 容器元素的 ID
- `achievementManager` (AchievementManager): 成就管理器实例

### 方法

#### render()
渲染勋章墙组件

```javascript
badgeWall.render();
```

#### refresh()
刷新勋章墙显示

```javascript
badgeWall.refresh();
```

#### showBadgeDetail(badgeId)
显示徽章详情模态框

```javascript
badgeWall.showBadgeDetail('exercise_streak_7');
```

**参数：**
- `badgeId` (string): 徽章 ID

#### loadBadgeOrder()
加载用户自定义的徽章顺序

```javascript
const order = badgeWall.loadBadgeOrder();
```

**返回：**
- `Array<string>`: 徽章 ID 数组

#### saveBadgeOrder()
保存用户自定义的徽章顺序

```javascript
badgeWall.saveBadgeOrder();
```

## 数据存储

### LocalStorage 键

- `lifeflow_{username}_badge_order`: 用户自定义的徽章顺序

### 数据格式

```javascript
// 徽章顺序
["exercise_streak_7", "learning_streak_7", "exercise_total_10h", ...]
```

## 交互功能

### 桌面端拖拽

1. 鼠标按住徽章
2. 拖动到目标位置
3. 释放鼠标完成排序
4. 自动保存新顺序

### 移动端长按

1. 长按徽章（500ms）
2. 触发震动反馈
3. 显示提示信息
4. 可以拖动调整顺序

### 点击查看详情

1. 点击徽章
2. 弹出详情模态框
3. 显示完整信息
4. 点击遮罩或关闭按钮关闭

## 样式定制

### CSS 变量

```css
.badge-wall-item {
    /* 自定义徽章卡片样式 */
    background: linear-gradient(135deg, #F8F9FA 0%, #E9ECEF 100%);
    border-radius: 16px;
    padding: 20px;
}

.badge-wall-item:hover {
    /* 自定义悬停效果 */
    border-color: #FFD700;
    background: linear-gradient(135deg, #FFF9E6 0%, #FFF3CC 100%);
}
```

### 动画效果

- `badgeIconFloat`: 徽章图标浮动动画
- `badgeIconBounce`: 徽章图标弹跳动画
- `longPressShake`: 长按震动动画
- `badgeDetailIconPulse`: 详情图标脉冲动画

## 响应式设计

### 桌面端 (>768px)
- 网格布局：最小 140px，自适应填充
- 显示拖拽提示
- 完整的悬停效果

### 平板端 (768px)
- 网格布局：最小 110px
- 简化的交互效果

### 移动端 (<480px)
- 网格布局：最小 90px
- 长按调整顺序
- 触摸优化

## 集成示例

### 在个人资料页面中使用

```javascript
document.addEventListener('DOMContentLoaded', () => {
    const achievementManager = new AchievementManager();
    const badgeWall = new BadgeWall('badgeWall', achievementManager);
    badgeWall.render();
    
    // 监听成就解锁事件
    window.addEventListener('achievement:unlocked', () => {
        badgeWall.refresh();
    });
});
```

### 与其他组件配合

```javascript
// 在解锁新成就后刷新勋章墙
function onAchievementUnlocked() {
    achievementManager.checkAndUnlockAchievements('exercise');
    badgeWall.refresh();
}
```

## 测试

运行测试页面：

```bash
# 在浏览器中打开
test-badge-wall.html
```

测试功能：
- ✅ 解锁单个徽章
- ✅ 批量解锁徽章
- ✅ 清空所有徽章
- ✅ 拖拽排序
- ✅ 点击查看详情
- ✅ 响应式布局

## 注意事项

1. **依赖关系**
   - 需要 `AchievementManager` 实例
   - 需要 `StorageManager` 支持
   - 需要 `toastNotification` 全局对象（可选）

2. **性能优化**
   - 使用 CSS 动画而非 JavaScript
   - 事件委托处理点击事件
   - 防抖处理拖拽事件

3. **浏览器兼容性**
   - 支持现代浏览器
   - 使用 HTML5 拖拽 API
   - 使用 CSS Grid 布局

4. **数据持久化**
   - 徽章顺序保存在 LocalStorage
   - 按用户隔离存储
   - 自动加载和保存

## 更新日志

### v1.0.0 (2024-11-19)
- ✅ 初始版本
- ✅ 基本徽章展示功能
- ✅ 拖拽排序功能
- ✅ 详情模态框
- ✅ 响应式设计
- ✅ 空状态处理

## 相关文件

- `js/components/badgeWall.js` - 组件代码
- `css/badgeWall.css` - 样式文件
- `test-badge-wall.html` - 测试页面
- `js/modules/achievementManager.js` - 成就管理器
- `profile.html` - 集成页面

## 许可证

MIT License
