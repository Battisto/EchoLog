const mongoose = require('mongoose');

const captionSchema = new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true,
    index: true // Add index for faster queries
  },
  text: {
    type: String,
    required: true,
    trim: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  confidence: {
    type: Number,
    min: 0,
    max: 1,
    default: 0.9
  },
  speaker: {
    type: String,
    default: 'User'
  },
  provider: {
    type: String,
    default: 'webSpeech'
  },
  language: {
    type: String,
    default: 'en-US'
  }
}, {
  timestamps: true
});

// Index for efficient event-based queries
captionSchema.index({ eventId: 1, timestamp: 1 });

module.exports = mongoose.model('Caption', captionSchema);
