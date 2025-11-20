# PostEditor Component

## 概述

PostEditor 是 LifeFlow 社交系统的动态发布编辑器组件，提供完整的动态创建功能，包括文字输入、图片上传、成就分享、标签添加和可见范围设置。

## 功能特性

### ✅ 已实现功能

1. **文字输入** (需求 3.1, 3.2)
   - 支持 1-500 字符的文字内容
   - 实时字符计数显示
   - 接近限制时颜色提示

2. **图片上传** (需求 3.3)
   - 支持 JPG、PNG 格式
   - 最多上传 9 张图片
   - 单张图片最大 5MB
   - 自动图片压缩
   - 图片预览和删除功能

3. **成就分享** (需求 3.4, 3.5)
   - 显示最近解锁的成就列表
   - 选择成就后自动生成特殊样式
   - 成就预览和移除功能

4. **标签功能** (需求 11.11, 11.12)
   - 预设常用标签（#运动 #学习 #生活 #健康 #成就）
   - 支持自定义标签输入
   - 标签预览和删除功能

5. **可见范围设置** (需求 3.6, 10.1, 10.2)
   - 公开：所有人可见
   - 仅好友：只有好友可见
   - 仅自己：只有自己可见

6. **发布验证** (需求 3.7, 3.8)
   - 内容长度验证
   - 图片数量和大小验证
   - 至少包含内容或图片的验证
   - 发布状态管理

## 使用方法

### 基本用法

```javascript
// 初始化编辑器
const postEditor = new PostEditor('postEditor', {
  maxLength: 500,
  maxImages: 9,
  maxImageSize: 5 * 1024 * 1024,
  onPublish: async (postData) => {
    // 处理发布逻辑
    console.log('发布的动态:', postData);
  }
});
```

### 配置选项

```javascript
{
  maxLength: 500,              // 最大字符数
  maxImages: 9,                // 最大图片数
  maxImageSize: 5 * 1024 * 1024, // 最大图片大小（字节）
  onPublish: Function          // 发布回调函数
}
```

### 发布数据格式

```javascript
{
  content: "动态文字内容",
  images: ["base64图片1", "base64图片2"],
  type: "normal" | "achievement",
  achievementId: "achievement_id" | null,
  tags: ["#运动", "#学习"],
  visibility: "public" | "friends" | "private"
}
```

## 依赖项

### 必需依赖

1. **StorageManager** - 数据存储管理
   - 路径: `js/modules/storageManager.js`

2. **AchievementManager** - 成就系统管理
   - 路径: `js/modules/achievementManager.js`

3. **ImageCompressor** - 图片压缩工具
   - 路径: `js/utils/imageCompressor.js`

### 样式文件

- `css/postEditor.css` - 组件样式

### HTML 结构

```html
<div id="postEditor"></div>
```

## API 方法

### 公共方法

#### `reset()`
重置编辑器到初始状态

```javascript
postEditor.reset();
```

#### `destroy()`
销毁编辑器实例

```javascript
postEditor.destroy();
```

### 内部方法

- `handleTextInput()` - 处理文字输入
- `openImagePicker()` - 打开图片选择器
- `handleImageSelect()` - 处理图片选择
- `validateImageFile()` - 验证图片文件
- `compressImage()` - 压缩图片
- `updateImagePreview()` - 更新图片预览
- `removeImage()` - 删除图片
- `openAchievementPicker()` - 打开成就选择器
- `getRecentAchievements()` - 获取最近成就
- `selectAchievement()` - 选择成就
- `updateAchievementPreview()` - 更新成就预览
- `openTagPicker()` - 打开标签选择器
- `updateTagsPreview()` - 更新标签预览
- `openVisibilityPicker()` - 打开可见范围选择器
- `updateVisibilityDisplay()` - 更新可见范围显示
- `handlePublish()` - 处理发布
- `validatePost()` - 验证动态内容

## 事件

### 触发的事件

#### `post:publish`
当用户点击发布按钮时触发（如果未提供 onPublish 回调）

```javascript
window.addEventListener('post:publish', (event) => {
  const postData = event.detail.postData;
  console.log('发布动态:', postData);
});
```

## 样式定制

### CSS 变量

组件使用以下主要颜色：

```css
--primary-color: #667eea;
--secondary-color: #764ba2;
--text-color: #2C3E50;
--text-muted: #7F8C8D;
--background: #F5F7FA;
--border-color: #E0E6ED;
--error-color: #E74C3C;
--success-color: #27ae60;
```

### 响应式设计

- **桌面端** (>768px): 完整功能显示
- **移动端** (<768px): 
  - 隐藏按钮文字，只显示图标
  - 调整布局为垂直排列
  - 优化触摸目标大小（最小 44x44px）

## 集成示例

### 在 social.html 中集成

```html
<!-- HTML -->
<div class="post-editor-card">
  <h3 class="editor-title">✍️ 发布动态</h3>
  <div id="postEditor"></div>
</div>

<!-- CSS -->
<link rel="stylesheet" href="css/postEditor.css">

<!-- JavaScript -->
<script src="js/modules/storageManager.js"></script>
<script src="js/modules/achievementManager.js"></script>
<script src="js/utils/imageCompressor.js"></script>
<script src="js/services/socialService.js"></script>
<script src="js/components/postEditor.js"></script>

<script>
  const storageManager = new StorageManager();
  const socialService = new SocialService(storageManager);
  const currentUser = localStorage.getItem('lifeflow_current_user');

  const postEditor = new PostEditor('postEditor', {
    onPublish: async (postData) => {
      const post = socialService.createPost(currentUser, postData);
      // 刷新动态流
      loadPosts();
    }
  });
</script>
```

## 测试

### 测试页面

使用 `test-post-editor.html` 进行功能测试：

```bash
# 在浏览器中打开
test-post-editor.html
```

### 测试场景

1. **文字输入测试**
   - 输入不同长度的文字
   - 测试字符计数功能
   - 测试超出限制的提示

2. **图片上传测试**
   - 上传单张图片
   - 上传多张图片（最多9张）
   - 测试图片格式验证
   - 测试图片大小限制
   - 测试图片删除功能

3. **成就分享测试**
   - 选择成就
   - 查看成就预览
   - 移除成就

4. **标签功能测试**
   - 选择预设标签
   - 添加自定义标签
   - 删除标签

5. **可见范围测试**
   - 切换不同可见范围
   - 验证显示正确

6. **发布测试**
   - 空内容发布（应失败）
   - 只有文字发布
   - 只有图片发布
   - 完整内容发布

## 错误处理

### 常见错误

1. **用户未登录**
   ```
   Error: 用户未登录
   ```
   解决：确保 localStorage 中有 `lifeflow_current_user`

2. **容器元素不存在**
   ```
   Error: Container element with id "xxx" not found
   ```
   解决：确保 HTML 中存在对应 ID 的元素

3. **图片格式不支持**
   ```
   只支持 JPG 和 PNG 格式的图片
   ```
   解决：选择正确格式的图片

4. **图片大小超限**
   ```
   图片大小不能超过 5MB
   ```
   解决：压缩图片或选择更小的图片

5. **内容验证失败**
   ```
   请输入内容或添加图片
   ```
   解决：至少输入文字或添加图片

## 性能优化

1. **图片压缩**
   - 自动压缩超过 5MB 的图片
   - 限制图片尺寸为 1200x1200

2. **懒加载**
   - 对话框按需创建
   - 成就列表按需加载

3. **事件优化**
   - 使用事件委托
   - 防止重复提交

## 浏览器兼容性

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 已知问题

无

## 未来改进

1. 支持视频上传
2. 支持 GIF 动图
3. 支持 @ 提及好友
4. 支持表情选择器
5. 支持草稿保存
6. 支持定时发布

## 更新日志

### v1.0.0 (2024-11-19)
- ✅ 初始版本发布
- ✅ 实现文字输入功能
- ✅ 实现图片上传功能
- ✅ 实现成就分享功能
- ✅ 实现标签功能
- ✅ 实现可见范围设置
- ✅ 实现发布验证逻辑

## 许可证

MIT License

## 作者

LifeFlow Development Team
