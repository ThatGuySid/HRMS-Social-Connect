// routes/createPosts.js
const express = require("express");
const router = express.Router();
const CreatePost = require("../models/CreatePost"); // Updated path to new model file
const multer = require("multer");
const fs = require('fs');
const path = require('path');
const { syncCreatePostToPost, deleteSyncedPost } = require('../services/postSyncService');

const upload = multer({ storage: multer.memoryStorage() });

const uploadToCloudStorage = async (buffer, mimetype) => {
  // --- START OF CLOUD STORAGE INTEGRATION PLACEHOLDER ---
  // You MUST replace this with actual cloud storage integration (e.g., Cloudinary, AWS S3)
  // For demonstration WITHOUT a cloud service (will not persist across server restarts):
  const uploadsDir = path.join(__dirname, '../public/uploads');

  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${mimetype.split('/')[1]}`;
  const filePath = path.join(uploadsDir, fileName);

  fs.writeFileSync(filePath, buffer);
  const mediaURL = `http://localhost:${process.env.PORT || 4000}/uploads/${fileName}`;
  const mediaType = mimetype.split('/')[0];

  console.log(`Temporary file saved at: ${filePath}`);
  console.log(`Temporary URL: ${mediaURL}`);

  return { url: mediaURL, type: mediaType };
  // --- END OF CLOUD STORAGE INTEGRATION PLACEHOLDER ---
};

// Get all posts
router.get("/", async (req, res, next) => {
  try {
    const posts = await CreatePost.find().sort({ createdAt: -1 });
    res.status(200).json(posts);
  } catch (error) {
    next(error);
  }
});

// Get a single post by id
router.get("/:id", async (req, res, next) => {
  try {
    const post = await CreatePost.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    res.status(200).json(post);
  } catch (error) {
    next(error);
  }
});

// Create a new post
router.post("/", upload.single('media'), async (req, res, next) => {
  try {
    console.log("📥 POST request body:", req.body);
    console.log("📄 POST request file:", req.file);

    const { title, description } = req.body;
    let mediaURL = "";
    let mediaType = "";

    if (req.file) {
      const uploadResult = await uploadToCloudStorage(req.file.buffer, req.file.mimetype);
      mediaURL = uploadResult.url;
      mediaType = uploadResult.type;
    }

    const newPostData = {
      title,
      description,
      mediaURL: mediaURL,
      mediaType: mediaType,
    };

    const newPost = new CreatePost(newPostData);
    const savedPost = await newPost.save();

    // Automatically sync the new post to the Posts collection
    try {
      await syncCreatePostToPost(savedPost._id);
      console.log('✅ Post automatically synced to Posts collection');
    } catch (syncError) {
      console.error('⚠️ Failed to auto-sync post:', syncError.message);
      // Don't fail the request if sync fails
    }

    res.status(201).json(savedPost);
  } catch (error) {
    console.error("❌ Error creating post:", error.message);
    next(error);
  }
});

// Update a post by id
router.put("/:id", upload.single('media'), async (req, res, next) => {
  try {
    const { title, description } = req.body;
    let updateFields = { title, description };

    if (req.file) {
      const uploadResult = await uploadToCloudStorage(req.file.buffer, req.file.mimetype);
      updateFields.mediaURL = uploadResult.url;
      updateFields.mediaType = uploadResult.type;
    } else if (req.body.mediaURL === '' && req.body.mediaType === '') {
      updateFields.mediaURL = '';
      updateFields.mediaType = '';
    } else {
      updateFields.mediaURL = req.body.mediaURL || '';
      updateFields.mediaType = req.body.mediaType || '';
    }

    const updatedPost = await CreatePost.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true, runValidators: true }
    );
    if (!updatedPost) {
      return res.status(404).json({ message: "Post not found" });
    }
    res.status(200).json(updatedPost);
  } catch (error) {
    console.error("❌ Error updating post:", error.message);
    next(error);
  }
});

// Delete a post by id
router.delete("/:id", async (req, res, next) => {
  try {
    const postId = req.params.id;

    // First, delete the synced post from Post collection
    try {
      await deleteSyncedPost(postId);
      console.log('✅ Synced post deleted from Posts collection');
    } catch (syncError) {
      console.error('⚠️ Failed to delete synced post:', syncError.message);
      // Continue with deletion even if sync fails
    }

    // Then delete from CreatePost collection
    const deletedPost = await CreatePost.findByIdAndDelete(postId);
    if (!deletedPost) {
      return res.status(404).json({ message: "Post not found" });
    }

    res.status(200).json({
      message: "Post deleted successfully",
      deletedPost: deletedPost.title
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
