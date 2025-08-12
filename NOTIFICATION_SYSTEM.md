# Notification System for Posts and Whistles

## Overview

This system automatically sends notifications to users when posts or whistles are created that match their interests. The notifications appear in the app's notification center instead of being sent via email.

## Features

### Interest-Based Notifications
- When a user creates a post or whistle, notifications are sent to all users who have saved the same interests
- For community posts/whistles, notifications are only sent to community members with matching interests
- Notifications include the username (or "Anonymous" for whistles) and post heading

### Notification Types

#### New Post Notifications
- **Type**: `new_post`
- **Trigger**: When a regular post is created
- **Recipients**: Users with matching interests
- **Message**: `"{username} posted a post about {category}"`

#### New Whistle Notifications
- **Type**: `new_whistle`
- **Trigger**: When a whistle is submitted (before approval)
- **Recipients**: Users with matching interests
- **Message**: `"Anonymous posted a whistle about {category}"`

#### Community Post Notifications
- **Type**: `community_post`
- **Trigger**: When a post is created in a community
- **Recipients**: Community members with matching interests
- **Message**: `"{username} posted a post about {category}"`

#### Community Whistle Notifications
- **Type**: `community_whistle`
- **Trigger**: When a whistle is submitted in a community
- **Recipients**: Community members with matching interests
- **Message**: `"Anonymous posted a whistle about {category}"`

### Navigation
- Clicking on a notification navigates the user directly to the post
- For whistle submissions, clicking navigates to the whistle approvals page (for admins)

## Implementation Details

### Backend Changes

#### 1. Notification Model Updates
- Added new notification types: `new_post`, `new_whistle`, `community_post`, `community_whistle`
- Enhanced link generation for better navigation

#### 2. Notification Service (`backend/services/notificationService.js`)
- `sendInterestBasedNotifications()`: Sends notifications for posts
- `sendWhistleNotifications()`: Sends notifications for whistle submissions
- Filters users by interests and community membership
- Excludes the post/whistle author from notifications

#### 3. Post Controller Updates
- Replaced email notifications with in-app notifications
- Integrated with NotificationService for interest-based notifications

#### 4. Admin Controller Updates
- Added interest-based notifications when whistles are approved
- Maintains existing admin notification functionality

### Mobile App Changes

#### 1. Notification Screen Updates (`mobile/app/notifications.js`)
- Added icons and colors for new notification types
- Enhanced navigation logic to handle post and whistle notifications
- Improved notification press handling with link-based navigation

#### 2. Notification Types and Icons
- `new_post` / `community_post`: Article icon (blue)
- `new_whistle` / `community_whistle`: Report icon (orange)
- `whistle_pending`: Schedule icon (yellow)
- `whistle_review`: Admin panel icon (purple)

## API Endpoints

### Existing Endpoints
- `GET /notifications?userId={id}` - Get user notifications
- `POST /notifications/mark-read` - Mark notifications as read
- `POST /notifications/clear-all` - Clear all notifications

### Test Endpoints
- `POST /notifications/test` - Create test notification
- `POST /notifications/test-interest` - Test interest-based notifications

## Usage Examples

### Creating a Post
```javascript
// When a post is created, the system automatically:
// 1. Finds users with matching interests
// 2. Filters by community membership (if applicable)
// 3. Sends notifications to eligible users
// 4. Excludes the post author
```

### Creating a Whistle
```javascript
// When a whistle is submitted:
// 1. Sends notification to admin for review
// 2. Sends interest-based notifications to users
// 3. When approved, sends additional notifications
```

## Configuration

### Interest Matching
- Interests are matched case-insensitively
- Both hashtags and categories are considered
- Users must have non-empty interests array

### Community Filtering
- For community posts/whistles, only community members receive notifications
- Community membership is checked before sending notifications

### Notification Expiry
- Notifications automatically expire after 24 hours (86400 seconds)
- This is configured in the Notification model schema

## Testing

### Test Interest-Based Notifications
```bash
POST /api/notifications/test-interest
{
  "userId": "user_id",
  "category": "technology",
  "hashtags": ["technology", "ai"]
}
```

### Test Regular Notifications
```bash
POST /api/notifications/test
{
  "userId": "user_id",
  "type": "new_post",
  "message": "Test notification",
  "postId": "post_id",
  "metadata": {
    "postTitle": "Test Post",
    "category": "technology"
  }
}
```

## Future Enhancements

1. **Notification Preferences**: Allow users to customize which types of notifications they receive
2. **Push Notifications**: Integrate with push notification services
3. **Notification Groups**: Group similar notifications together
4. **Advanced Filtering**: Allow users to set more specific interest criteria
5. **Notification Analytics**: Track notification engagement and effectiveness
