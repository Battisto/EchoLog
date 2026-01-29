const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Event name is required'],
    trim: true,
    maxlength: [100, 'Event name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  status: {
    type: String,
    enum: ['created', 'active', 'completed', 'failed'],
    default: 'created',
    index: true
  },
  language: {
    type: String,
    default: 'en-US'
  },
  maxSpeakers: {
    type: Number,
    default: 1,
    min: 1,
    max: 10
  },
  participants: {
    type: Number,
    default: 1,
    min: 1
  },
  customVocabulary: {
    type: String,
    trim: true
  },
  autoStartSpeech: {
    type: Boolean,
    default: false
  },
  captionCount: {
    type: Number,
    default: 0,
    min: 0
  },
  accuracy: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  startTime: {
    type: Date
  },
  endTime: {
    type: Date
  }
}, {
  timestamps: true // Adds createdAt and updatedAt
});

// Index for efficient queries
eventSchema.index({ status: 1, createdAt: -1 });

// Virtual for duration
eventSchema.virtual('duration').get(function() {
  if (this.startTime && this.endTime) {
    return Math.round((this.endTime - this.startTime) / (1000 * 60)); // Duration in minutes
  }
  return 0;
});

module.exports = mongoose.model('Event', eventSchema);
