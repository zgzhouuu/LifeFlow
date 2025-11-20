# ImageViewer Component

全屏图片查看器组件，支持左右滑动、双指缩放、拖动查看等功能。

## 功能特性

### ✨ 核心功能

- **全屏显示**：图片以全屏模式显示，最大化查看体验
- **多图切换**：支持左右滑动或点击按钮切换多张图片
- **缩放功能**：支持双指缩放（移动端）和鼠标滚轮缩放（桌面端）
- **拖动查看**：缩放后可以拖动图片查看不同区域
- **双击缩放**：双击图片快速放大/缩小
- **键盘控制**：ESC关闭，左右箭头切换图片
- **关闭按钮**：右上角关闭按钮和点击遮罩关闭

### 📱 响应式设计

- 桌面端：鼠标滚轮缩放、拖动、左右箭头按钮
- 平板端：触摸缩放、滑动切换
- 移动端：双指缩放、左右滑动、优化的触摸体验

### 🎨 视觉效果

- 平滑的过渡动画
- 半透明遮罩背景
- 毛玻璃效果按钮
- 图片计数器显示
- 加载状态提示

## 使用方法

### 基本用法

```javascript
// 创建图片查看器实例
const viewer = new ImageViewer({
  images: [
    'https://example.com/image1.jpg',
    'https://example.com/image2.jpg',
    'https://example.com/image3.jpg'
  ],
  initialIndex: 0,  // 从第一张开始
  onClose: () => {
    console.log('查看器已关闭');
  }
});

// 打开查看器
viewer.open();
```

### 配置选项

```javascript
const viewer = new ImageViewer({
  images: [],              // 必需：图片URL数组
  initialIndex: 0,         // 初始显示的图片索引
  onClose: null,           // 关闭回调函数
  enableZoom: true,        // 是否启用缩放
  enableSwipe: true,       // 是否启用滑动
  maxZoom: 3,              // 最大缩放倍数
  minZoom: 1               // 最小缩放倍数
});
```

### 与PostCard集成

PostCard组件已经自动集成了ImageViewer，点击图片即可打开：

```javascript
const postCard = new PostCard(post, {
  currentUserId: 'user_123',
  // 不需要提供onImageClick，会自动使用ImageViewer
});
```

如果需要自定义图片点击行为：

```javascript
const postCard = new PostCard(post, {
  currentUserId: 'user_123',
  onImageClick: (postId, imageIndex) => {
    // 自定义处理逻辑
    console.log('点击了图片', postId, imageIndex);
  }
});
```

### 手动控制

```javascript
const viewer = new ImageViewer({
  images: imageArray,
  initialIndex: 0
});

// 打开查看器
viewer.open();

// 关闭查看器
viewer.close();

// 显示上一张
viewer.showPrevious();

// 显示下一张
viewer.showNext();

// 销毁查看器
viewer.destroy();
```

## API 文档

### 构造函数

```javascript
new ImageViewer(options)
```

**参数：**
- `options` (Object): 配置选项对象

**选项：**
- `images` (Array): 图片URL数组（必需）
- `initialIndex` (Number): 初始显示的图片索引，默认0
- `onClose` (Function): 关闭回调函数
- `enableZoom` (Boolean): 是否启用缩放，默认true
- `enableSwipe` (Boolean): 是否启用滑动，默认true
- `maxZoom` (Number): 最大缩放倍数，默认3
- `minZoom` (Number): 最小缩放倍数，默认1

### 方法

#### open()
打开图片查看器

```javascript
viewer.open();
```

#### close()
关闭图片查看器

```javascript
viewer.close();
```

#### showPrevious()
显示上一张图片

```javascript
viewer.showPrevious();
```

#### showNext()
显示下一张图片

```javascript
viewer.showNext();
```

#### loadImage(index)
加载指定索引的图片

```javascript
viewer.loadImage(2); // 加载第3张图片
```

#### resetTransform()
重置图片变换（缩放和位移）

```javascript
viewer.resetTransform();
```

#### destroy()
销毁查看器并清理资源

```javascript
viewer.destroy();
```

## 交互说明

### 桌面端

| 操作 | 功能 |
|------|------|
| 点击左右箭头 | 切换图片 |
| 鼠标滚轮 | 缩放图片 |
| 双击图片 | 放大/缩小 |
| 拖动图片 | 移动查看（缩放后） |
| ESC键 | 关闭查看器 |
| 左右箭头键 | 切换图片 |
| 点击遮罩 | 关闭查看器 |
| 点击关闭按钮 | 关闭查看器 |

### 移动端

| 操作 | 功能 |
|------|------|
| 左右滑动 | 切换图片 |
| 双指缩放 | 缩放图片 |
| 双击图片 | 放大/缩小 |
| 拖动图片 | 移动查看（缩放后） |
| 点击遮罩 | 关闭查看器 |
| 点击关闭按钮 | 关闭查看器 |

## 样式定制

### CSS变量

可以通过覆盖CSS变量来定制样式：

```css
.image-viewer {
  /* 自定义遮罩背景 */
  --viewer-overlay-bg: rgba(0, 0, 0, 0.95);
  
  /* 自定义按钮颜色 */
  --viewer-button-bg: rgba(255, 255, 255, 0.1);
  --viewer-button-border: rgba(255, 255, 255, 0.3);
}
```

### 自定义样式

```css
/* 修改关闭按钮样式 */
.image-viewer-close {
  background: red;
  border-color: darkred;
}

/* 修改计数器样式 */
.image-viewer-counter {
  background: rgba(102, 126, 234, 0.8);
  color: white;
}
```

## 浏览器兼容性

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ iOS Safari 14+
- ✅ Android Chrome 90+

## 性能优化

### 图片加载优化

- 使用懒加载，只加载当前显示的图片
- 图片加载失败时显示友好提示
- 支持Base64编码的图片

### 内存管理

- 关闭时自动清理事件监听器
- 销毁时移除DOM元素
- 恢复页面滚动状态

### 触摸优化

- 使用`touch-action: none`防止默认行为
- 优化触摸事件处理性能
- 支持多点触控

## 测试

### 单元测试

运行测试页面：
```bash
# 打开测试页面
open test-image-viewer.html
```

### 集成测试

运行集成测试页面：
```bash
# 打开集成测试页面
open test-image-viewer-integration.html
```

### 测试场景

1. **单张图片**：测试单张图片的显示和缩放
2. **多张图片**：测试图片切换功能
3. **不同尺寸**：测试横向、纵向、正方形图片
4. **Base64图片**：测试Base64编码的图片
5. **PostCard集成**：测试与动态卡片的集成

## 常见问题

### Q: 图片加载失败怎么办？
A: 组件会自动显示"图片加载失败"提示，并在控制台输出错误信息。

### Q: 如何禁用缩放功能？
A: 在创建实例时设置`enableZoom: false`。

### Q: 如何禁用滑动切换？
A: 在创建实例时设置`enableSwipe: false`。

### Q: 移动端滑动不流畅？
A: 确保CSS中的`touch-action: none`已应用到图片元素。

### Q: 如何自定义最大缩放倍数？
A: 在创建实例时设置`maxZoom`选项，例如`maxZoom: 5`。

## 更新日志

### v1.0.0 (2024-01-19)
- ✨ 初始版本发布
- ✅ 支持全屏显示
- ✅ 支持左右滑动切换
- ✅ 支持双指缩放
- ✅ 支持拖动查看
- ✅ 支持键盘控制
- ✅ 响应式设计
- ✅ 与PostCard集成

## 许可证

MIT License

## 作者

LifeFlow Team
