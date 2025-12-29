const express = require('express');
const router = express.Router();
const Event = require('../models/Event');

// @desc    Get all events
// @route   GET /api/events
// @access  Public
router.get('/', async (req, res, next) => {
  try {
    const { category, date, limit = 50, page = 1 } = req.query;
    
    // Build query object
    let query = {};
    
    if (category && category !== 'all') {
      query.category = category;
    }
    
    if (date) {
      query.date = date;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute query with pagination
    const events = await Event.find(query)
      .sort({ date: 1, createdAt: -1 })
      .limit(limit * 1)
      .skip(skip);

    // Get total count for pagination
    const total = await Event.countDocuments(query);

    res.status(200).json({
      success: true,
      count: events.length,
      total,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      },
      data: events
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get single event
// @route   GET /api/events/:id
// @access  Public
router.get('/:id', async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    res.status(200).json({
      success: true,
      data: event
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Create new event
// @route   POST /api/events
// @access  Public
router.post('/', async (req, res, next) => {
  try {
    const event = await Event.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: event
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Update event
// @route   PUT /api/events/:id
// @access  Public
router.put('/:id', async (req, res, next) => {
  try {
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Event updated successfully',
      data: event
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Delete event
// @route   DELETE /api/events/:id
// @access  Public
router.delete('/:id', async (req, res, next) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Event deleted successfully',
      data: {}
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get events by category
// @route   GET /api/events/category/:category
// @access  Public
router.get('/category/:category', async (req, res, next) => {
  try {
    const { category } = req.params;
    const events = await Event.find({ category }).sort({ date: 1 });

    res.status(200).json({
      success: true,
      count: events.length,
      data: events
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get upcoming events
// @route   GET /api/events/filter/upcoming
// @access  Public
router.get('/filter/upcoming', async (req, res, next) => {
  try {
    const today = new Date().toDateString();
    const events = await Event.find({
      date: { $gte: today }
    }).sort({ date: 1 });

    res.status(200).json({
      success: true,
      count: events.length,
      data: events
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
