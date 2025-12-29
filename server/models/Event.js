const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Event title is required'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Event description is required'],
    trim: true,
    maxlength: [1000, 'Description cannot be more than 1000 characters']
  },
  category: {
    type: String,
    required: [true, 'Event category is required'],
    enum: {
      values: ['Company Meeting', 'Training', 'Team Building', 'Review', 'Wellness', 'Technology'],
      message: 'Category must be one of: Company Meeting, Training, Team Building, Review, Wellness, Technology'
    },
    default: 'Company Meeting'
  },
  time: {
    type: String,
    required: [true, 'Event time is required'],
    trim: true
  },
  location: {
    type: String,
    required: [true, 'Event location is required'],
    trim: true,
    maxlength: [200, 'Location cannot be more than 200 characters']
  },
  date: {
    type: String,
    required: [true, 'Event date is required'],
    trim: true
  },
  image: {
    type: String,
    trim: true,
    default: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400'
  },
  attendees: {
    type: Number,
    default: 0,
    min: [0, 'Attendees cannot be negative']
  }
}, {
  timestamps: true // This adds createdAt and updatedAt fields automatically
});

// Add index for better query performance
eventSchema.index({ date: 1, category: 1 });

// Virtual for formatted date
eventSchema.virtual('formattedDate').get(function() {
  return new Date(this.date).toLocaleDateString();
});

// Ensure virtual fields are serialized
eventSchema.set('toJSON', {
  virtuals: true
});

const Event = mongoose.model('Event', eventSchema);

module.exports = Event;
