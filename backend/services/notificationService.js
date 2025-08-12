const User = require('../models/User');
const Community = require('../models/Community');
const { createNotification } = require('../controllers/notificationController');

class NotificationService {
  static async sendInterestBasedNotifications(post, hashtags = [], category = '', communityId = null) {
    try {
      console.log('Debug - Post author:', post.author);
      console.log('Debug - Hashtags:', hashtags);
      console.log('Debug - Category:', category);
      console.log('Debug - Post title:', post.title);
      
      const users = await User.find({ 
        interests: { $exists: true, $ne: [] },
        _id: { $ne: post.author }
      });

      console.log('Debug - Total users with interests:', users.length);
      if (users.length > 0) {
        console.log('Debug - All user interests:');
        users.forEach(user => {
          console.log(`  User ${user._id}: [${user.interests.join(', ')}]`);
        });
      } else {
        console.log('Debug - No users found with interests!');
      }

      const matchingUsers = users.filter(user => {
        console.log(`Debug - Checking user ${user._id} with interests: [${user.interests.join(', ')}]`);
        
        const hasMatch = user.interests.some(interest => {
          const interestLower = interest.toLowerCase();
          const categoryMatch = category && category.toLowerCase() === interestLower;
          const hashtagMatch = hashtags.some(tag => tag.toLowerCase() === interestLower);
          
          console.log(`  Checking interest "${interest}" (${interestLower}) against category "${category}" and hashtags [${hashtags.join(', ')}]`);
          console.log(`  Category match: ${categoryMatch}, Hashtag match: ${hashtagMatch}`);
          
          if (categoryMatch || hashtagMatch) {
            console.log(`Debug - MATCH FOUND for user ${user._id}: interest="${interest}" matches category="${category}" or hashtags="${hashtags}"`);
          }
          
          return categoryMatch || hashtagMatch;
        });
        
        console.log(`Debug - User ${user._id} has match: ${hasMatch}`);
        return hasMatch;
      });

      console.log('Debug - Matching users before community filter:', matchingUsers.length);

      let finalUsers = matchingUsers;
      if (communityId) {
        const community = await Community.findById(communityId);
        if (community) {
          console.log('Debug - Community found:', community.name);
          console.log('Debug - Community members count:', community.members.length);
          finalUsers = matchingUsers.filter(user => 
            community.members.includes(user._id)
          );
          console.log('Debug - Users after community filtering:', finalUsers.length);
        }
      }

      const notificationPromises = finalUsers.map(user => {
        const isWhistle = post.anonymous || post.anonymousId;
        const notificationType = communityId 
          ? (isWhistle ? 'community_whistle' : 'community_post')
          : (isWhistle ? 'new_whistle' : 'new_post');

        const authorName = post.anonymous ? 'Anonymous' : (post.author?.username || 'Someone');
        const message = `${authorName} posted ${isWhistle ? 'a whistle' : 'a post'} about ${category || 'your interests'}`;

        return createNotification(
          user._id,
          notificationType,
          message,
          post.author || null,
          post._id,
          null,
          {
            postTitle: post.title,
            category: category,
            communityId: communityId,
            isWhistle: isWhistle
          }
        );
      });

      console.log('Debug - Creating notifications for users:', finalUsers.map(u => u._id));
      await Promise.all(notificationPromises);
      console.log(`Sent ${finalUsers.length} interest-based notifications for post ${post._id}`);
    } catch (error) {
      console.error('Error sending interest-based notifications:', error);
    }
  }

  static async sendWhistleNotifications(whistle, hashtags = [], category = '', communityId = null) {
    try {
      const users = await User.find({ 
        interests: { $exists: true, $ne: [] },
        _id: { $ne: whistle.submittedBy }
      });

      const matchingUsers = users.filter(user =>
        user.interests.some(interest => {
          const interestLower = interest.toLowerCase();
          return hashtags.some(tag => tag.toLowerCase() === interestLower) ||
                 (category && category.toLowerCase() === interestLower);
        })
      );

      let finalUsers = matchingUsers;
      if (communityId) {
        const community = await Community.findById(communityId);
        if (community) {
          finalUsers = matchingUsers.filter(user => 
            community.members.includes(user._id)
          );
        }
      }

      const notificationPromises = finalUsers.map(user => {
        const notificationType = communityId ? 'community_whistle' : 'new_whistle';
        const message = `Anonymous posted a whistle about ${category || 'your interests'}`;

        return createNotification(
          user._id,
          notificationType,
          message,
          whistle.submittedBy || null,
          null,
          null,
          {
            whistleTitle: whistle.title,
            category: category,
            communityId: communityId,
            isWhistle: true,
            submissionId: whistle._id
          }
        );
      });

      await Promise.all(notificationPromises);
      console.log(`Sent ${finalUsers.length} interest-based notifications for whistle ${whistle._id}`);
    } catch (error) {
      console.error('Error sending whistle notifications:', error);
    }
  }
}

module.exports = NotificationService;
