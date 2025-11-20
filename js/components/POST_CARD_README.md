# PostCard Component

动态卡片组件 - 用于显示单个社交动态的完整信息

## 功能特性

### 核心功能
- ✅ 显示作者头像、昵称和发布时间
- ✅ 渲染动态文字内容
- ✅ 实现图片网格布局（1张/2-4张/5-9张）
- ✅ 实现成就分享特殊样式（金色边框）
- ✅ 显示标签（蓝色高亮）
- ✅ 添加点赞和评论按钮
- ✅ 显示评论列表
- ✅ 支持删除动态和评论
- ✅ 支持举报功能

### 图片布局
- **1张图片**: 居中大图显示（最大宽度400px）
- **2-4张图片**: 2x2网格布局
- **5-9张图片**: 3x3网格布局

### 成就分享样式
- 金色边框（#FFD700）
- 渐变背景（#FFF5E6 到 #FFE8CC）
- 特殊的成就图标和文字
- 脉冲动画效果

### 标签样式
- 蓝色背景（#667eea）
- 白色文字
- 圆角设计
- 悬停效果

## 使用方法

### 基本用法

```javascript
// 创建动态数据
const post = {
  id: 'post_123',
  authorId: 'user001',
  content: '今天天气真好！',
  images: [],
  type: 'normal',
  achievementId: null,
  tags: ['#生活'],
  visibility: 'public',
  likes: ['user002'],
  comments: [],
  createdAt: Date.now()
};

// 创建PostCard实例
const postCard = new PostCard(post, {
  currentUserId: 'user001',
  onLike: (postId) => {
    console.log('点赞:', postId);
  },
  onComment: (postId) => {
    console.log('评论:', postId);
  }
});

// 渲染HTML
const html = postCard.render();
document.getElementById('container').innerHTML = html;

// 或者创建DOM元素
const element = postCard.createElement();
document.getElementById('container').appendChild(element);
```

### 配置选项

```javascript
const options = {
  currentUserId: 'user001',           // 当前用户ID（必需）
  showActions: true,                  // 是否显示操作按钮
  showComments: true,                 // 是否显示评论
  maxComments: 3,                     // 最多显示评论数
  
  // 回调函数
  onLike: (postId) => {},            // 点赞回调
  onUnlike: (postId) => {},          // 取消点赞回调
  onComment: (postId) => {},         // 评论回调
  onDelete: (postId) => {},          // 删除回调
  onReport: (postId) => {},          // 举报回调
  onImageClick: (postId, index) => {}, // 图片点击回调
  onTagClick: (tag) => {},           // 标签点击回调
  onDeleteComment: (postId, commentId) => {}, // 删除评论回调
  onViewAllComments: (postId) => {}, // 查看所有评论回调
  getUserProfile: (userId) => {}     // 获取用户资料回调
};
```

### 动态数据结构

```javascript
const post = {
  id: 'post_123',                    // 动态ID
  authorId: 'user001',               // 作者ID
  content: '动态内容',                // 文字内容
  images: ['url1', 'url2'],          // 图片数组（Base64或URL）
  type: 'normal',                    // 类型：normal | achievement
  achievementId: 'ach_001',          // 成就ID（type为achievement时）
  tags: ['#标签1', '#标签2'],         // 标签数组
  visibility: 'public',              // 可见性：public | friends | private
  likes: ['user002', 'user003'],     // 点赞用户ID数组
  comments: [                        // 评论数组
    {
      id: 'comment_1',
      authorId: 'user002',
      content: '评论内容',
      createdAt: 1234567890
    }
  ],
  createdAt: 1234567890              // 创建时间戳
};
```

## API 方法

### render()
渲染动态卡片HTML字符串

```javascript
const html = postCard.render();
```

### createElement()
创建动态卡片DOM元素（已附加事件监听器）

```javascript
const element = postCard.createElement();
```

### updatePost(newPost)
更新动态数据

```javascript
postCard.updatePost(updatedPost);
```

### getPostId()
获取动态ID

```javascript
const postId = postCard.getPostId();
```

### getPost()
获取动态数据对象

```javascript
const post = postCard.getPost();
```

## 事件处理

### 点赞/取消点赞
```javascript
onLike: (postId) => {
  // 调用服务层点赞
  socialService.likePost(postId, currentUserId);
},
onUnlike: (postId) => {
  // 调用服务层取消点赞
  socialService.unlikePost(postId, currentUserId);
}
```

### 评论
```javascript
onComment: (postId) => {
  // 打开评论输入框
  openCommentDialog(postId);
}
```

### 删除动态
```javascript
onDelete: (postId) => {
  if (confirm('确定要删除这条动态吗？')) {
    socialService.deletePost(postId, currentUserId);
  }
}
```

### 图片查看
```javascript
onImageClick: (postId, index) => {
  // 打开图片查看器
  openImageViewer(post.images, index);
}
```

### 标签过滤
```javascript
onTagClick: (tag) => {
  // 过滤显示该标签的动态
  filterPostsByTag(tag);
}
```

## 样式定制

### CSS变量
可以通过修改CSS变量来定制样式：

```css
.post-card {
  --card-bg: white;
  --card-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  --card-radius: 12px;
  --card-padding: 20px;
  --primary-color: #667eea;
  --text-color: #2C3E50;
  --border-color: #E0E6ED;
}
```

### 成就卡片样式
```css
.post-card-achievement {
  border: 2px solid #FFD700;
  background: linear-gradient(to bottom, #FFFEF7, white);
}
```

## 响应式设计

组件自动适配不同屏幕尺寸：

- **桌面端** (>768px): 完整显示，大尺寸头像和按钮
- **平板端** (768px): 中等尺寸，优化布局
- **移动端** (<480px): 紧凑布局，小尺寸元素

## 无障碍支持

- 所有按钮都有 `aria-label` 属性
- 图片有 `alt` 属性
- 支持键盘导航
- 触摸目标不小于44x44px

## 性能优化

- 图片懒加载（`loading="lazy"`）
- CSS动画使用GPU加速
- 事件委托减少监听器数量
- HTML转义防止XSS攻击

## 浏览器兼容性

- Chrome/Edge: ✅ 完全支持
- Firefox: ✅ 完全支持
- Safari: ✅ 完全支持
- IE11: ⚠️ 需要polyfill

## 依赖

- `DateFormatter` - 日期格式化工具类

## 测试

运行测试页面：
```bash
# 打开浏览器访问
test-post-card.html
```

测试覆盖：
- ✅ 普通动态渲染
- ✅ 成就分享渲染
- ✅ 图片网格布局（1/2-4/5-9张）
- ✅ 标签显示和点击
- ✅ 点赞/取消点赞
- ✅ 评论显示和删除
- ✅ 动态删除和举报
- ✅ 响应式布局

## 示例

### 普通动态
```javascript
const normalPost = {
  id: 'post_1',
  authorId: 'user001',
  content: '今天天气真好！',
  images: [],
  type: 'normal',
  tags: ['#生活'],
  likes: [],
  comments: [],
  createdAt: Date.now()
};
```

### 成就分享
```javascript
const achievementPost = {
  id: 'post_2',
  authorId: 'user001',
  content: '解锁新成就：连续运动7天！',
  images: [],
  type: 'achievement',
  achievementId: 'ach_7days',
  tags: ['#运动', '#成就'],
  likes: ['user002'],
  comments: [],
  createdAt: Date.now()
};
```

### 带图片动态
```javascript
const imagePost = {
  id: 'post_3',
  authorId: 'user001',
  content: '今天的晚餐',
  images: ['data:image/jpeg;base64,...'],
  type: 'normal',
  tags: ['#美食'],
  likes: [],
  comments: [],
  createdAt: Date.now()
};
```

## 注意事项

1. **必须提供 currentUserId**: 用于判断点赞状态和权限
2. **图片格式**: 支持Base64和URL，建议压缩后存储
3. **XSS防护**: 所有用户输入都经过HTML转义
4. **事件处理**: 使用事件委托，性能更好
5. **时间格式**: 使用DateFormatter统一格式化

## 更新日志

### v1.0.0 (2024-01-19)
- ✅ 初始版本发布
- ✅ 实现所有核心功能
- ✅ 完整的响应式设计
- ✅ 成就分享特殊样式
- ✅ 图片网格布局
- ✅ 标签蓝色高亮
- ✅ 点赞和评论功能

## 许可证

MIT License
