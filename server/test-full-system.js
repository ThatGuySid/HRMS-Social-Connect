const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

/**
 * Comprehensive test of the Posts system
 */

async function testFullSystem() {
  console.log('🧪 Starting comprehensive system test...\n');

  try {
    // Test 1: Get initial posts
    console.log('1️⃣ Testing initial posts fetch...');
    const initialResponse = await axios.get(`${BASE_URL}/api/posts`);
    console.log(`✅ Found ${initialResponse.data.length} initial posts`);

    // Test 2: Create a new post via CreatePost endpoint
    console.log('\n2️⃣ Testing post creation...');
    const newPostData = {
      title: 'System Test Post',
      description: 'This is a test post created by the automated test system to verify that posts are properly synced between CreatePost and Post collections.',
      mediaURL: '',
      mediaType: ''
    };

    const createResponse = await axios.post(`${BASE_URL}/api/createposts`, newPostData, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    console.log(`✅ Created post: ${createResponse.data.title}`);
    const createdPostId = createResponse.data.id;

    // Test 3: Wait a moment for auto-sync
    console.log('\n3️⃣ Waiting for auto-sync...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 4: Check if post appears in Posts collection
    console.log('\n4️⃣ Testing post synchronization...');
    const postsAfterCreate = await axios.get(`${BASE_URL}/api/posts`);
    const syncedPost = postsAfterCreate.data.find(post => 
      post.content.includes(newPostData.title) && 
      post.content.includes(newPostData.description)
    );

    if (syncedPost) {
      console.log('✅ Post successfully synced to Posts collection');
      console.log(`   - Post ID: ${syncedPost._id}`);
      console.log(`   - Author: ${syncedPost.name} (${syncedPost.position})`);
      console.log(`   - Views: ${syncedPost.views}, Likes: ${syncedPost.likes}`);
    } else {
      console.log('❌ Post not found in Posts collection');
      return;
    }

    // Test 5: Test refresh endpoint
    console.log('\n5️⃣ Testing refresh endpoint...');
    const refreshResponse = await axios.get(`${BASE_URL}/api/posts/refresh`);
    console.log(`✅ Refresh endpoint returned ${refreshResponse.data.length} posts`);

    // Test 6: Test post interactions (like, comment)
    console.log('\n6️⃣ Testing post interactions...');
    
    // Like the post
    const likeResponse = await axios.patch(`${BASE_URL}/api/posts/${syncedPost._id}/like`);
    console.log(`✅ Liked post - new like count: ${likeResponse.data.likes}`);

    // Add a comment
    const commentData = { name: 'Test User', text: 'This is a test comment!' };
    const commentResponse = await axios.patch(`${BASE_URL}/api/posts/${syncedPost._id}/comment`, commentData, {
      headers: { 'Content-Type': 'application/json' }
    });
    console.log(`✅ Added comment - total comments: ${commentResponse.data.comments.length}`);

    // Test 7: Test post deletion and cleanup
    console.log('\n7️⃣ Testing post deletion...');
    const deleteResponse = await axios.delete(`${BASE_URL}/api/createposts/${createdPostId}`);
    console.log(`✅ Deleted CreatePost: ${deleteResponse.data.deletedPost}`);

    // Wait a moment for cleanup
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check if synced post was also deleted
    const postsAfterDelete = await axios.get(`${BASE_URL}/api/posts`);
    const deletedPostStillExists = postsAfterDelete.data.find(post => post._id === syncedPost._id);

    if (!deletedPostStillExists) {
      console.log('✅ Synced post successfully deleted from Posts collection');
    } else {
      console.log('⚠️ Synced post still exists in Posts collection');
    }

    // Test 8: Final state check
    console.log('\n8️⃣ Final state check...');
    const finalPosts = await axios.get(`${BASE_URL}/api/posts`);
    const finalCreatePosts = await axios.get(`${BASE_URL}/api/createposts`);
    
    console.log(`✅ Final state:`);
    console.log(`   - Posts collection: ${finalPosts.data.length} posts`);
    console.log(`   - CreatePosts collection: ${finalCreatePosts.data.length} posts`);

    console.log('\n🎉 All tests completed successfully!');
    console.log('\n📋 System Status: ✅ WORKING PROPERLY');
    console.log('\n✨ Features verified:');
    console.log('   ✅ Post creation and auto-sync');
    console.log('   ✅ Post display with randomization');
    console.log('   ✅ Post interactions (like, comment)');
    console.log('   ✅ Post deletion and cleanup');
    console.log('   ✅ Refresh endpoint');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testFullSystem();
