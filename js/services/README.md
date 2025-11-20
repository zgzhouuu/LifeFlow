# Service Layer Documentation

## Overview

The service layer provides a unified interface for managing user profiles, health data, and notifications in the LifeFlow application. All services use the `StorageManager` for data persistence and emit events for real-time updates.

## Services

### 1. ProfileService

Manages user profile information including avatar, nickname, and bio.

#### Usage

```javascript
import { profileService } from './services/profileService.js';

// Set current user
profileService.setCurrentUser('username');

// Get profile
const profile = profileService.getProfile('username');

// Update profile
const updated = profileService.updateProfile('username', {
  nickname: '新昵称',
  bio: '个人简介'
});

// Upload avatar
const file = document.querySelector('input[type="file"]').files[0];
const avatarBase64 = await profileService.uploadAvatar('username', file);

// Update nickname
profileService.updateNickname('username', '新昵称');

// Search users
const results = profileService.searchUsers('query');
```

#### Events

- `profile:updated` - Triggered when profile is updated
  ```javascript
  window.addEventListener('profile:updated', (event) => {
    const { username, profile } = event.detail;
    console.log('Profile updated:', username, profile);
  });
  ```

#### Methods

- `setCurrentUser(username)` - Set the current active user
- `getCurrentUser()` - Get the current active user
- `getProfile(username)` - Get user profile
- `updateProfile(username, data)` - Update profile data
- `uploadAvatar(username, file)` - Upload and compress avatar
- `updateNickname(username, nickname)` - Update nickname
- `updateBio(username, bio)` - Update bio
- `deleteProfile(username)` - Delete profile
- `userExists(username)` - Check if user exists
- `getAllUsers()` - Get all registered users
- `searchUsers(query)` - Search users by username or nickname
- `exportProfile(username)` - Export profile data
- `importProfile(username, profileData)` - Import profile data

---

### 2. HealthService

Manages health data including height, weight, BMI calculations, and health advice.

#### Usage

```javascript
import { healthService } from './services/healthService.js';

// Get health data
const health = healthService.getHealthData('username');

// Update height
healthService.updateHeight('username', 175); // cm

// Update weight
healthService.updateWeight('username', 70); // kg

// Set target weight
healthService.setTargetWeight('username', 65); // kg

// Calculate BMI
const bmi = healthService.calculateBMI(175, 70);

// Get BMI status
const status = healthService.getBMIStatus(bmi);
// Returns: { status: '正常', color: '#27ae60', level: 'normal' }

// Get health advice
const advice = healthService.getHealthAdvice(bmi);
// Returns: { status, advice[], dailyCalories, exerciseTime }

// Estimate body fat
const bodyFat = healthService.estimateBodyFat(bmi, 'male');

// Get weight trend
const trend = healthService.getWeightTrend('username', 30); // last 30 days

// Get target progress
const progress = healthService.getTargetProgress('username');

// Export health report
const report = healthService.exportHealthReport('username');

// Export as CSV
const csv = healthService.exportHealthDataCSV('username');
```

#### Events

- `health:updated` - Triggered when health data is updated
  ```javascript
  window.addEventListener('health:updated', (event) => {
    const { username, healthData } = event.detail;
    console.log('Health data updated:', username, healthData);
  });
  ```

#### BMI Categories

- **Underweight**: BMI < 18.5
- **Normal**: BMI 18.5 - 24.9
- **Overweight**: BMI 25 - 29.9
- **Obese**: BMI ≥ 30

#### Methods

- `getHealthData(username)` - Get health data
- `updateHeight(username, height)` - Update height (100-250 cm)
- `updateWeight(username, weight)` - Update weight (30-300 kg)
- `setTargetWeight(username, targetWeight)` - Set target weight
- `updateGender(username, gender)` - Update gender (male/female)
- `calculateBMI(height, weight)` - Calculate BMI
- `getBMIStatus(bmi)` - Get BMI status and color
- `estimateBodyFat(bmi, gender)` - Estimate body fat percentage
- `getHealthAdvice(bmi)` - Get personalized health advice
- `getWeightTrend(username, days)` - Get weight history
- `getTargetProgress(username)` - Get progress toward target weight
- `exportHealthReport(username)` - Export comprehensive health report
- `exportHealthDataCSV(username)` - Export data as CSV
- `deleteHealthData(username)` - Delete health data

---

### 3. NotificationService

Manages all notifications including likes, comments, friend requests, and messages.

#### Usage

```javascript
import { notificationService } from './services/notificationService.js';

// Send a notification
notificationService.send('toUserId', {
  type: 'like',
  fromUserId: 'fromUserId',
  message: '赞了你的动态',
  data: { postId: 'post123' }
});

// Get notifications
const notifications = notificationService.getNotifications('userId');
const unreadOnly = notificationService.getNotifications('userId', true);

// Get unread count
const count = notificationService.getUnreadCount('userId');

// Mark as read
notificationService.markAsRead('userId', 'notificationId');
notificationService.markAllAsRead('userId');

// Delete notification
notificationService.deleteNotification('userId', 'notificationId');

// Clear all notifications
notificationService.clearAllNotifications('userId');

// Specialized notification methods
notificationService.sendLikeNotification('toUserId', 'fromUserId', 'postId');
notificationService.sendCommentNotification('toUserId', 'fromUserId', 'postId', 'commentId');
notificationService.sendFriendRequestNotification('toUserId', 'fromUserId');
notificationService.sendFriendAcceptedNotification('toUserId', 'fromUserId');
notificationService.sendMessageNotification('toUserId', 'fromUserId', 'messagePreview');
notificationService.sendReminderNotification('toUserId', 'fromUserId', 'exercise');
notificationService.sendChallengeInviteNotification('toUserId', 'fromUserId', 'challengeId', 'exercise');

// Get statistics
const stats = notificationService.getNotificationStats('userId');

// Clean old notifications
const removed = notificationService.cleanOldNotifications('userId', 30); // older than 30 days
```

#### Events

- `notifications:updated` - Triggered when notifications change
  ```javascript
  window.addEventListener('notifications:updated', (event) => {
    const { userId, count } = event.detail;
    console.log('Unread notifications:', count);
    // Update UI badge
  });
  ```

#### Notification Types

- `like` - Someone liked your post
- `comment` - Someone commented on your post
- `friend_request` - Someone sent you a friend request
- `friend_accepted` - Someone accepted your friend request
- `message` - New message received
- `reminder` - Reminder from a friend
- `challenge_invite` - Challenge invitation
- `challenge_complete` - Challenge completed

#### Notification Object Structure

```javascript
{
  id: 'notif_1234567890_abc123',
  type: 'like',
  fromUserId: 'sender_username',
  message: '赞了你的动态',
  data: { postId: 'post123' },
  read: false,
  createdAt: 1234567890000
}
```

#### Methods

- `send(toUserId, notification)` - Send a notification
- `getNotifications(userId, unreadOnly)` - Get notifications
- `markAsRead(userId, notificationId)` - Mark as read
- `markAllAsRead(userId)` - Mark all as read
- `deleteNotification(userId, notificationId)` - Delete notification
- `clearAllNotifications(userId)` - Clear all notifications
- `getUnreadCount(userId)` - Get unread count
- `getNotificationsByType(userId, type)` - Get by type
- `getNotificationsFromUser(userId, fromUserId)` - Get from specific user
- `sendLikeNotification(toUserId, fromUserId, postId)` - Send like notification
- `sendCommentNotification(toUserId, fromUserId, postId, commentId)` - Send comment notification
- `sendFriendRequestNotification(toUserId, fromUserId)` - Send friend request
- `sendFriendAcceptedNotification(toUserId, fromUserId)` - Send friend accepted
- `sendMessageNotification(toUserId, fromUserId, messagePreview)` - Send message notification
- `sendReminderNotification(toUserId, fromUserId, reminderType)` - Send reminder
- `sendChallengeInviteNotification(toUserId, fromUserId, challengeId, challengeType)` - Send challenge invite
- `sendChallengeCompleteNotification(toUserId, challengeId, result)` - Send challenge complete
- `getNotificationStats(userId)` - Get statistics
- `cleanOldNotifications(userId, days)` - Clean old notifications
- `exportNotifications(userId)` - Export notifications

---

## Data Storage

All services use the `StorageManager` utility for data persistence. Data is stored in LocalStorage with the following key patterns:

### Profile Data
- `{username}_profile` - User profile data

### Health Data
- `{username}_health` - Health data including weight history

### Notification Data
- `{username}_notifications` - User notifications

## Error Handling

All services throw descriptive errors that can be caught and displayed to users:

```javascript
try {
  profileService.updateNickname('user', 'VeryLongNicknameThatExceedsLimit');
} catch (error) {
  console.error(error.message); // "昵称不能超过20字符"
  // Display error to user
}
```

## Testing

A test page is available at `js/services/serviceTest.html` to verify all service functionality.

## Requirements Covered

This service layer implementation covers the following requirements:

- **Requirement 1.6**: Profile data storage and loading
- **Requirement 9.1**: User-prefixed data storage
- **Requirement 9.2**: Multi-user data isolation

## Next Steps

After implementing the service layer, the next tasks are:

1. Create UI components (ProfileCard, HealthPanel, etc.)
2. Implement social features (posts, friends, chat)
3. Integrate AI analysis
4. Build responsive pages

## Notes

- All services are singleton instances exported as `profileService`, `healthService`, and `notificationService`
- Services emit custom events for real-time UI updates
- Data validation is performed at the service layer
- Image compression is automatic for avatars
- Weight history is limited to 90 days
- Notifications are limited to 100 per user
