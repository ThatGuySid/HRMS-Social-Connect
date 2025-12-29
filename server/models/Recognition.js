const mongoose = require('mongoose');

const recognitionSchema = new mongoose.Schema({
  from: {
    type: String,
    required: [true, 'From field is required'],
    trim: true
  },
  to: {
    type: String,
    required: [true, 'To field is required'],
    trim: true
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    trim: true,
    maxlength: [500, 'Message cannot exceed 500 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['teamwork', 'leadership', 'innovation', 'excellence', 'collaboration', 'mentorship'],
    default: 'teamwork'
  },

  isPublic: {
    type: Boolean,
    default: true
  },
  status: {
    type: String,
    enum: ['active', 'archived', 'hidden'],
    default: 'active'
  },
  tags: [{
    type: String,
    trim: true
  }],
  metadata: {
    department: String,
    project: String,
    quarter: String
  }
}, {
  timestamps: true, // This adds createdAt and updatedAt fields
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for formatted timestamp
recognitionSchema.virtual('timestamp').get(function() {
  return this.createdAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
});

// Virtual for from avatar (first letter of name)
recognitionSchema.virtual('fromAvatar').get(function() {
  return this.from ? this.from.charAt(0).toUpperCase() : 'U';
});

// Virtual for to avatar (first letter of name)
recognitionSchema.virtual('toAvatar').get(function() {
  return this.to ? this.to.charAt(0).toUpperCase() : 'U';
});

// Virtual for like count
recognitionSchema.virtual('likeCount').get(function() {
  return this.likes ? this.likes.length : 0;
});

// Virtual for comment count
recognitionSchema.virtual('commentCount').get(function() {
  return this.comments ? this.comments.length : 0;
});

// Index for better query performance
recognitionSchema.index({ createdAt: -1 });
recognitionSchema.index({ from: 1 });
recognitionSchema.index({ to: 1 });
recognitionSchema.index({ category: 1 });
recognitionSchema.index({ status: 1 });

// Pre-save middleware to set default values
recognitionSchema.pre('save', function(next) {
  // Auto-generate tags based on category
  if (!this.tags || this.tags.length === 0) {
    const categoryTags = {
      teamwork: ['collaboration', 'team-player'],
      leadership: ['leader', 'guidance'],
      innovation: ['creative', 'innovative'],
      excellence: ['outstanding', 'quality'],
      collaboration: ['teamwork', 'cooperation'],
      mentorship: ['mentor', 'guidance']
    };
    this.tags = categoryTags[this.category] || [];
  }
  next();
});

// Static method to get recognition statistics
recognitionSchema.statics.getStats = async function() {
  const totalRecognitions = await this.countDocuments({ status: 'active' });
  const thisMonth = new Date();
  thisMonth.setDate(1);
  thisMonth.setHours(0, 0, 0, 0);
  
  const lastMonth = new Date(thisMonth);
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  
  const thisMonthCount = await this.countDocuments({
    status: 'active',
    createdAt: { $gte: thisMonth }
  });
  
  const lastMonthCount = await this.countDocuments({
    status: 'active',
    createdAt: { $gte: lastMonth, $lt: thisMonth }
  });
  
  const percentageChange = lastMonthCount > 0 
    ? Math.round(((thisMonthCount - lastMonthCount) / lastMonthCount) * 100)
    : 100;
  
  const activeParticipants = await this.distinct('from', { status: 'active' });
  const totalLikes = 0; // Likes are not stored in database anymore
  
  const averageRating = 0; // Rating calculation removed since likes are not stored
  
  return {
    totalRecognitions,
    percentageChange: percentageChange >= 0 ? `+${percentageChange}%` : `${percentageChange}%`,
    activeParticipants: activeParticipants.length,
    averageRating: Math.min(averageRating, 5.0) // Cap at 5.0
  };
};

// Static method to get top recipients
recognitionSchema.statics.getTopRecipients = async function(limit = 5) {
  return await this.aggregate([
    { $match: { status: 'active' } },
    { $group: { _id: '$to', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: limit },
    { $project: { name: '$_id', recognitions: '$count', _id: 0 } }
  ]);
};



const Recognition = mongoose.model('Recognition', recognitionSchema);

module.exports = Recognition;
