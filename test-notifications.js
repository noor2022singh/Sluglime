#!/usr/bin/env node

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api';

async function testNotificationSystem() {
  console.log('🧪 Testing Notification System...\n');

  try {
    console.log('1. Testing basic notification creation...');
    const testNotification = await axios.post(`${API_BASE_URL}/notifications/test`, {
      userId: 'test-user-id',
      type: 'new_post',
      message: 'Test notification for new post',
      postId: 'test-post-id',
      metadata: {
        postTitle: 'Test Post',
        category: 'technology'
      }
    });
    console.log('✅ Basic notification test passed\n');

    console.log('2. Testing interest-based notifications...');
    const interestTest = await axios.post(`${API_BASE_URL}/notifications/test-interest`, {
      userId: 'test-user-id',
      category: 'technology',
      hashtags: ['technology', 'ai', 'programming']
    });
    console.log('✅ Interest-based notification test passed\n');

    console.log('3. Testing notification retrieval...');
    const notifications = await axios.get(`${API_BASE_URL}/notifications?userId=test-user-id`);
    console.log(`✅ Retrieved ${notifications.data.length} notifications\n`);

    console.log('🎉 All notification tests passed!');
    console.log('\n📋 Test Summary:');
    console.log('- Basic notification creation: ✅');
    console.log('- Interest-based notifications: ✅');
    console.log('- Notification retrieval: ✅');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    console.log('\n💡 Make sure:');
    console.log('1. Your server is running on the correct port');
    console.log('2. Replace "test-user-id" with an actual user ID from your database');
    console.log('3. The API_BASE_URL is correct');
  }
}

testNotificationSystem();
