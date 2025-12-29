const Post = require('../models/Post');
const CreatePost = require('../models/CreatePost');

/**
 * Service to sync posts from CreatePost collection to Post collection
 * This allows posts created in CreatePost.jsx to appear in Posts.jsx
 */

// Sample user data for random assignment
const sampleUsers = [
  { name: "Alice Johnson", position: "HR Manager" },
  { name: "Bob Smith", position: "Software Engineer" },
  { name: "Carol Davis", position: "Marketing Specialist" },
  { name: "David Wilson", position: "Project Manager" },
  { name: "Emma Brown", position: "UX Designer" },
  { name: "Frank Miller", position: "Data Analyst" },
  { name: "Grace Lee", position: "HR Consultant" },
  { name: "Henry Taylor", position: "DevOps Engineer" },
];

/**
 * Convert a CreatePost to Post format
 * @param {Object} createPost - CreatePost document
 * @returns {Object} - Post format object
 */
const convertCreatePostToPost = (createPost) => {
  // Randomly assign a user
  const randomUser = sampleUsers[Math.floor(Math.random() * sampleUsers.length)];
  
  return {
    name: randomUser.name,
    position: randomUser.position,
    content: `${createPost.title}\n\n${createPost.description}`,
    image: createPost.mediaURL || '',
    views: Math.floor(Math.random() * 1000) + 50, // Random views between 50-1050
    likes: Math.floor(Math.random() * 100), // Random likes between 0-100
    liked: false,
    comments: [],
    shares: Math.floor(Math.random() * 20), // Random shares between 0-20
    saved: false,
    createdAt: createPost.createdAt || new Date(),
  };
};

/**
 * Sync a specific CreatePost to Post collection
 * @param {String} createPostId - ID of the CreatePost to sync
 * @returns {Object} - The created Post document
 */
const syncCreatePostToPost = async (createPostId) => {
  try {
    // Find the CreatePost
    const createPost = await CreatePost.findById(createPostId);
    if (!createPost) {
      throw new Error('CreatePost not found');
    }

    // Check if already synced using a more specific approach
    const existingPost = await Post.findOne({
      $and: [
        { content: { $regex: createPost.title, $options: 'i' } },
        { content: { $regex: createPost.description, $options: 'i' } }
      ]
    });

    if (existingPost) {
      console.log('Post already synced:', createPost.title);
      return existingPost;
    }

    // Convert and create new Post
    const postData = convertCreatePostToPost(createPost);
    // Add reference to original CreatePost for tracking
    postData.sourceCreatePostId = createPost._id;

    const newPost = new Post(postData);
    const savedPost = await newPost.save();

    console.log('✅ Successfully synced CreatePost to Post:', createPost.title);
    return savedPost;
  } catch (error) {
    console.error('❌ Error syncing CreatePost to Post:', error.message);
    throw error;
  }
};

/**
 * Sync all CreatePosts to Posts collection
 * @returns {Array} - Array of created Post documents
 */
const syncAllCreatePostsToPosts = async () => {
  try {
    const createPosts = await CreatePost.find().sort({ createdAt: -1 });
    const syncedPosts = [];

    for (const createPost of createPosts) {
      try {
        const syncedPost = await syncCreatePostToPost(createPost._id);
        syncedPosts.push(syncedPost);
      } catch (error) {
        console.error(`Failed to sync CreatePost ${createPost._id}:`, error.message);
      }
    }

    console.log(`✅ Synced ${syncedPosts.length} posts from CreatePost to Post collection`);
    return syncedPosts;
  } catch (error) {
    console.error('❌ Error syncing all CreatePosts:', error.message);
    throw error;
  }
};

/**
 * Delete synced post when CreatePost is deleted
 * @param {String} createPostId - ID of the deleted CreatePost
 * @returns {Object} - Result of deletion
 */
const deleteSyncedPost = async (createPostId) => {
  try {
    const createPost = await CreatePost.findById(createPostId);
    if (!createPost) {
      // If CreatePost doesn't exist, find and delete any synced posts
      const syncedPosts = await Post.find({ sourceCreatePostId: createPostId });
      if (syncedPosts.length > 0) {
        await Post.deleteMany({ sourceCreatePostId: createPostId });
        console.log(`✅ Deleted ${syncedPosts.length} synced posts for CreatePost ${createPostId}`);
        return { deleted: syncedPosts.length };
      }
      return { deleted: 0 };
    }

    // Find synced post by content match or sourceCreatePostId
    const syncedPost = await Post.findOne({
      $or: [
        { sourceCreatePostId: createPostId },
        {
          $and: [
            { content: { $regex: createPost.title, $options: 'i' } },
            { content: { $regex: createPost.description, $options: 'i' } }
          ]
        }
      ]
    });

    if (syncedPost) {
      await Post.findByIdAndDelete(syncedPost._id);
      console.log('✅ Successfully deleted synced post:', createPost.title);
      return { deleted: 1, postId: syncedPost._id };
    }

    console.log('No synced post found for:', createPost.title);
    return { deleted: 0 };
  } catch (error) {
    console.error('❌ Error deleting synced post:', error.message);
    throw error;
  }
};

/**
 * Get all posts with random order
 * @returns {Array} - Array of Post documents in random order
 */
const getRandomizedPosts = async () => {
  try {
    // Get all posts and randomize their order
    const posts = await Post.find().sort({ createdAt: -1 });

    // Shuffle array using Fisher-Yates algorithm
    for (let i = posts.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [posts[i], posts[j]] = [posts[j], posts[i]];
    }

    return posts;
  } catch (error) {
    console.error('❌ Error getting randomized posts:', error.message);
    throw error;
  }
};

module.exports = {
  syncCreatePostToPost,
  syncAllCreatePostsToPosts,
  getRandomizedPosts,
  convertCreatePostToPost,
  deleteSyncedPost,
};
