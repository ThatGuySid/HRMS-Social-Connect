const express = require('express');
const router = express.Router();
const Recognition = require('../models/Recognition');

// GET /api/recognitions - Get all recognitions
router.get('/', async (req, res) => {
  try {
    console.log('📊 Fetching recognitions...');
    
    const { 
      page = 1, 
      limit = 10, 
      category, 
      from, 
      to, 
      status = 'active',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = { status };
    if (category) filter.category = category;
    if (from) filter.from = new RegExp(from, 'i');
    if (to) filter.to = new RegExp(to, 'i');

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Fetch recognitions with pagination
    const recognitions = await Recognition.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Get total count for pagination
    const total = await Recognition.countDocuments(filter);

    console.log(`✅ Found ${recognitions.length} recognitions`);

    res.status(200).json({
      success: true,
      data: recognitions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('❌ Error fetching recognitions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch recognitions',
      details: error.message
    });
  }
});

// GET /api/recognitions/stats/overview - Get recognition statistics
router.get('/stats/overview', async (req, res) => {
  try {
    console.log('📈 Fetching recognition statistics...');
    
    const stats = await Recognition.getStats();
    
    console.log('✅ Statistics fetched successfully:', stats);
    
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('❌ Error fetching statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics',
      details: error.message
    });
  }
});

// GET /api/recognitions/top-recipients - Get top recipients
router.get('/top-recipients', async (req, res) => {
  try {
    console.log('🏆 Fetching top recipients...');
    
    const { limit = 5 } = req.query;
    const topRecipients = await Recognition.getTopRecipients(parseInt(limit));
    
    console.log(`✅ Found ${topRecipients.length} top recipients`);
    
    res.status(200).json({
      success: true,
      data: topRecipients
    });
  } catch (error) {
    console.error('❌ Error fetching top recipients:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch top recipients',
      details: error.message
    });
  }
});

// GET /api/recognitions/:id - Get single recognition
router.get('/:id', async (req, res) => {
  try {
    console.log(`🔍 Fetching recognition with ID: ${req.params.id}`);
    
    const recognition = await Recognition.findById(req.params.id);
    
    if (!recognition) {
      return res.status(404).json({
        success: false,
        error: 'Recognition not found'
      });
    }
    
    console.log('✅ Recognition found');
    
    res.status(200).json({
      success: true,
      data: recognition
    });
  } catch (error) {
    console.error('❌ Error fetching recognition:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch recognition',
      details: error.message
    });
  }
});

// POST /api/recognitions - Create new recognition
router.post('/', async (req, res) => {
  try {
    console.log('🎉 Creating new recognition...');
    console.log('📝 Request body:', req.body);
    
    const { from, to, message, category, tags, metadata } = req.body;
    
    // Validate required fields
    if (!from || !to || !message || !category) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: from, to, message, category'
      });
    }
    
    // Create new recognition
    const recognitionData = {
      from: from.trim(),
      to: to.trim(),
      message: message.trim(),
      category,
      tags: tags || [],
      metadata: metadata || {}
    };
    
    const recognition = new Recognition(recognitionData);
    const savedRecognition = await recognition.save();
    
    console.log('✅ Recognition created successfully:', savedRecognition._id);
    
    res.status(201).json({
      success: true,
      data: savedRecognition,
      message: 'Recognition created successfully'
    });
  } catch (error) {
    console.error('❌ Error creating recognition:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: Object.values(error.errors).map(err => err.message)
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to create recognition',
      details: error.message
    });
  }
});

// PUT /api/recognitions/:id - Update recognition
router.put('/:id', async (req, res) => {
  try {
    console.log(`📝 Updating recognition with ID: ${req.params.id}`);
    
    const { from, to, message, category, tags, metadata, status } = req.body;
    
    const updateData = {};
    if (from) updateData.from = from.trim();
    if (to) updateData.to = to.trim();
    if (message) updateData.message = message.trim();
    if (category) updateData.category = category;
    if (tags) updateData.tags = tags;
    if (metadata) updateData.metadata = metadata;
    if (status) updateData.status = status;
    
    const recognition = await Recognition.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!recognition) {
      return res.status(404).json({
        success: false,
        error: 'Recognition not found'
      });
    }
    
    console.log('✅ Recognition updated successfully');
    
    res.status(200).json({
      success: true,
      data: recognition,
      message: 'Recognition updated successfully'
    });
  } catch (error) {
    console.error('❌ Error updating recognition:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: Object.values(error.errors).map(err => err.message)
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to update recognition',
      details: error.message
    });
  }
});

// POST /api/recognitions/:id/like - Add like to recognition (client-side only)
router.post('/:id/like', async (req, res) => {
  try {
    console.log(`👍 Like action for recognition: ${req.params.id} (not stored in database)`);

    const recognition = await Recognition.findById(req.params.id);

    if (!recognition) {
      return res.status(404).json({
        success: false,
        error: 'Recognition not found'
      });
    }

    console.log('✅ Like action acknowledged (client-side handling)');

    res.status(200).json({
      success: true,
      data: recognition,
      message: 'Like action acknowledged'
    });
  } catch (error) {
    console.error('❌ Error processing like action:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process like action',
      details: error.message
    });
  }
});

// POST /api/recognitions/:id/comment - Add comment to recognition (client-side only)
router.post('/:id/comment', async (req, res) => {
  try {
    console.log(`💬 Comment action for recognition: ${req.params.id} (not stored in database)`);

    const recognition = await Recognition.findById(req.params.id);

    if (!recognition) {
      return res.status(404).json({
        success: false,
        error: 'Recognition not found'
      });
    }

    console.log('✅ Comment action acknowledged (client-side handling)');

    res.status(200).json({
      success: true,
      data: recognition,
      message: 'Comment action acknowledged'
    });
  } catch (error) {
    console.error('❌ Error processing comment action:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process comment action',
      details: error.message
    });
  }
});

// DELETE /api/recognitions/:id - Delete recognition
router.delete('/:id', async (req, res) => {
  try {
    console.log(`🗑️ Deleting recognition with ID: ${req.params.id}`);
    
    const recognition = await Recognition.findByIdAndDelete(req.params.id);
    
    if (!recognition) {
      return res.status(404).json({
        success: false,
        error: 'Recognition not found'
      });
    }
    
    console.log('✅ Recognition deleted successfully');
    
    res.status(200).json({
      success: true,
      message: 'Recognition deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting recognition:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete recognition',
      details: error.message
    });
  }
});

module.exports = router;
