# Social Services Documentation

## Overview

This directory contains three core services for the LifeFlow social system:

1. **SocialService** - Manages posts, likes, comments, and social interactions
2. **FriendService** - Handles friend relationships, requests, and blocklist
3. **ChatService** - Manages one-on-one chat messages and reminders

## Architecture

All services follow a consistent pattern:
- Accept a `StorageManager` instance in the constructor
- Use LocalStorage for data persistence
- Emit custom events for real-time updates
- Integrate with `NotificationService` for user notifications
- Support privacy filtering and blocklist functionality

## SocialService

### Purpose
Manages all social post operations including creation, likes, comments, and privacy filtering.

### Key Features
- ✅ Create posts with text, images, tags, and visibility settings
- ✅ Like/unlike posts
- ✅ Add/delete comments
- ✅ Privacy filtering (public, friends, private)
- ✅ Blocklist filtering
- ✅ Report posts
- ✅ Export post data

### Usage Example

```javascript
import { StorageManager } from '../utils/storage.js';

const storage = new StorageManager('lifeflow');
const socialService = new SocialService(storage);

// Create a post
const post = socialService.createPost('alice', {
  content: 'Hello world! 🌍',
  tags: ['生活', '心情'],
  visibility: 'public',
  images: []
});

// Like a post
socialService.likePost(post.id, 'bob');

// Add a comment
socialService.addComment(post.id, {
  authorId: 'bob',
  content: 'Great post!'
});

// Get visible posts (with privacy filtering)
const visiblePosts = socialService.getVisiblePosts(
  'bob',           // current user
  ['alice'],       // friend IDs
  ['charlie']      // blocked user IDs
);
```

### Data Model

```javascript
{
  id: 'post_1234567890_abc123',
  authorId: 'alice',
  content: 'Post content',
  images: [],
  type: 'normal',  // or 'achievement'
  achievementId: null,
  tags: ['tag1', 'tag2'],
  visibility: 'public',  // 'public', 'friends', 'private'
  likes: ['bob', 'charlie'],
  comments: [
    {
      id: 'comment_1234567890_xyz789',
      postId: 'post_1234567890_abc123',
      authorId: 'bob',
      content: 'Comment text',
      createdAt: 1234567890000
    }
  ],
  createdAt: 1234567890000
}
```

### Methods

| Method | Description |
|--------|-------------|
| `createPost(authorId, postData)` | Create a new post |
| `getAllPosts()` | Get all posts |
| `getPostById(postId)` | Get a specific post |
| `getPostsByUser(userId)` | Get posts by a user |
| `getPostsByTag(tag)` | Get posts with a tag |
| `getVisiblePosts(currentUserId, friendIds, blockedUserIds)` | Get posts with privacy filtering |
| `likePost(postId, userId)` | Like a post |
| `unlikePost(postId, userId)` | Unlike a post |
| `addComment(postId, commentData)` | Add a comment |
| `deleteComment(postId, commentId, userId)` | Delete a comment |
| `deletePost(postId, userId)` | Delete a post |
| `reportPost(postId, userId, reason)` | Report a post |

## FriendService

### Purpose
Manages friend relationships, friend requests, and user blocklist.

### Key Features
- ✅ Send/accept/reject friend requests
- ✅ Manage friendships (add/remove)
- ✅ Block/unblock users
- ✅ Search users
- ✅ Get friend statistics
- ✅ Export friend data

### Usage Example

```javascript
const friendService = new FriendService(storage);

// Send friend request
friendService.sendFriendRequest('alice', 'bob');

// Accept friend request
const requests = friendService.getPendingRequests('bob');
friendService.acceptFriendRequest(requests[0].id, 'bob');

// Get friends
const friends = friendService.getFriends('alice');

// Block a user
friendService.blockUser('alice', 'charlie');

// Search users
const results = friendService.searchUsers('alice', 'bob');
```

### Data Models

**Friend Request:**
```javascript
{
  id: 'req_1234567890_abc123',
  fromUserId: 'alice',
  toUserId: 'bob',
  status: 'pending',  // 'pending', 'accepted', 'rejected'
  createdAt: 1234567890000,
  acceptedAt: null
}
```

**Friendship:**
```javascript
{
  userId: 'alice',
  friendId: 'bob',
  createdAt: 1234567890000
}
```

### Methods

| Method | Description |
|--------|-------------|
| `sendFriendRequest(fromUserId, toUserId)` | Send a friend request |
| `acceptFriendRequest(requestId, userId)` | Accept a friend request |
| `rejectFriendRequest(requestId, userId)` | Reject a friend request |
| `getFriends(userId)` | Get user's friend list |
| `removeFriend(userId, friendId)` | Remove a friend |
| `areFriends(userId1, userId2)` | Check if two users are friends |
| `blockUser(userId, blockedUserId)` | Block a user |
| `unblockUser(userId, blockedUserId)` | Unblock a user |
| `getBlocklist(userId)` | Get user's blocklist |
| `isBlocked(userId, targetUserId)` | Check if a user is blocked |
| `searchUsers(currentUserId, query)` | Search for users |
| `getFriendStats(userId)` | Get friend statistics |

## ChatService

### Purpose
Manages one-on-one chat messages, reminders, and quick encouragements.

### Key Features
- ✅ Send/receive messages
- ✅ Mark messages as read
- ✅ Send reminders (exercise/learning)
- ✅ Quick encouragement messages
- ✅ Get recent chats
- ✅ Unread message count
- ✅ Export chat history

### Usage Example

```javascript
const chatService = new ChatService(storage);

// Send a message
const message = chatService.sendMessage(
  'alice',
  'bob',
  'Hello! How are you?'
);

// Mark messages as read
chatService.markAsRead('alice', 'bob', 'bob');

// Send a reminder
chatService.sendReminder('alice', 'bob', 'exercise');

// Get quick encouragements
const encouragements = chatService.getQuickEncouragements();

// Send quick encouragement
chatService.sendQuickEncouragement('alice', 'bob', '加油！💪');

// Get recent chats
const recentChats = chatService.getRecentChats('alice');

// Get unread count
const unreadCount = chatService.getUnreadCount('alice');
```

### Data Model

```javascript
{
  id: 'msg_1234567890_abc123',
  senderId: 'alice',
  receiverId: 'bob',
  content: 'Message text',
  type: 'text',  // 'text', 'reminder'
  read: false,
  createdAt: 1234567890000
}
```

### Methods

| Method | Description |
|--------|-------------|
| `sendMessage(senderId, receiverId, content, type)` | Send a message |
| `getMessages(userId1, userId2, limit)` | Get chat messages |
| `markAsRead(userId1, userId2, currentUserId)` | Mark messages as read |
| `getUnreadCount(userId, friendId)` | Get unread message count |
| `getRecentChats(userId)` | Get recent chat list |
| `sendQuickEncouragement(senderId, receiverId, text)` | Send quick encouragement |
| `sendReminder(senderId, receiverId, reminderType)` | Send a reminder |
| `deleteMessage(userId1, userId2, messageId, currentUserId)` | Delete a message |
| `clearChat(userId1, userId2)` | Clear chat history |
| `searchMessages(userId1, userId2, query)` | Search messages |
| `getChatStats(userId1, userId2)` | Get chat statistics |

## Storage Keys

All services use consistent storage key naming:

- **Posts**: `lifeflow_social_posts`
- **Reports**: `lifeflow_social_reports`
- **Friendships**: `lifeflow_friendships`
- **Friend Requests**: `lifeflow_friend_requests`
- **Blocklist**: `lifeflow_{userId}_blocklist`
- **Chat**: `lifeflow_chat_{userId1}_{userId2}` (sorted alphabetically)

## Events

Services emit custom events for real-time updates:

### SocialService Events
- `post:created` - When a post is created
- `post:deleted` - When a post is deleted

### FriendService Events
- `friend:added` - When a friendship is established
- `friend:removed` - When a friendship is removed
- `user:blocked` - When a user is blocked
- `user:unblocked` - When a user is unblocked

### ChatService Events
- `message:sent` - When a message is sent
- `messages:read` - When messages are marked as read

## Integration with NotificationService

All services integrate with the global `NotificationService` to send notifications:

- **SocialService**: Sends notifications for likes and comments
- **FriendService**: Sends notifications for friend requests and acceptances
- **ChatService**: Sends notifications for new messages and reminders

## Privacy & Security

### Privacy Filtering
Posts support three visibility levels:
- **public**: Visible to everyone
- **friends**: Visible to friends only
- **private**: Visible to author only

The `getVisiblePosts()` method automatically filters posts based on:
1. Visibility settings
2. Friend relationships
3. Blocklist

### Blocklist
Users can block other users, which:
- Hides their posts from the feed
- Prevents them from seeing your posts
- Automatically removes friend relationship if exists
- Prevents future friend requests

## Testing

A comprehensive test suite is available at `js/services/socialServicesTest.html`.

To run tests:
1. Open `socialServicesTest.html` in a browser
2. Click test buttons to verify functionality
3. View statistics to see system state
4. Clear test data when done

## Performance Considerations

### Data Cleanup
Services provide cleanup methods to manage storage:

- `socialService.cleanOldPosts(days)` - Remove old posts
- `friendService.cleanOldRequests(days)` - Remove old requests
- `chatService.cleanOldMessages(userId1, userId2, days, keepRecent)` - Remove old messages

### Optimization Tips
1. Limit post queries with visibility filtering
2. Use pagination for large post lists
3. Clean old data regularly
4. Compress images before storing
5. Limit chat history to recent messages

## Future Enhancements

Potential improvements:
- [ ] Real-time updates with WebSocket
- [ ] Cloud sync with backend API
- [ ] Image optimization and CDN
- [ ] Advanced search with filters
- [ ] Group chats
- [ ] Voice/video messages
- [ ] Read receipts
- [ ] Typing indicators

## Requirements Mapping

This implementation satisfies the following requirements from the spec:

- **需求 3.6**: Privacy filtering (public/friends/private)
- **需求 4.1**: Get visible posts based on privacy settings
- **需求 6.1**: Friend management system
- **需求 10.3**: Privacy settings for posts
- **需求 10.4**: Visibility control
- **需求 10.6**: Blocklist functionality

## License

Part of the LifeFlow application.
