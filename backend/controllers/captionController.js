const Caption = require('../models/Caption');
const Event = require('../models/Event');

// Create new caption
// Create new caption with duplicate prevention
// Create new caption with enhanced duplicate prevention
exports.createCaption = async (req, res) => {
  try {
    const { eventId, text, timestamp, confidence, speaker, provider, language } = req.body;

    // Verify event exists
    const event = await Event.findById(eventId);
    if (!event) {
      console.log('❌ Event not found:', eventId);
      return res.status(404).json({
        status: 'error',
        message: 'Event not found'
      });
    }

    const trimmedText = text?.trim();
    if (!trimmedText || trimmedText.length < 3) {
      return res.status(400).json({
        status: 'error',
        message: 'Caption text too short or empty'
      });
    }

    // Normalize text for duplicate checking
    const normalizedText = trimmedText.replace(/\s+/g, ' ').toLowerCase();

    // Check for exact duplicates in the last 10 minutes
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const exactDuplicate = await Caption.findOne({
      eventId: eventId,
      text: { $regex: new RegExp(`^${normalizedText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
      timestamp: { $gte: tenMinutesAgo }
    });

    if (exactDuplicate) {
      console.log('⏭️ Exact duplicate found, returning existing caption:', trimmedText);
      return res.status(200).json({
        status: 'success',
        data: {
          caption: exactDuplicate,
          message: 'Duplicate caption prevented'
        }
      });
    }

    // Check for similar captions (prevent near-duplicates)
    const recentCaptions = await Caption.find({
      eventId: eventId,
      timestamp: { $gte: tenMinutesAgo }
    }).sort({ timestamp: -1 }).limit(5);

    const isSimilar = recentCaptions.some(recentCaption => {
      const recentNormalized = recentCaption.text.replace(/\s+/g, ' ').toLowerCase();
      return calculateTextSimilarity(normalizedText, recentNormalized) > 0.85; // 85% similarity
    });

    if (isSimilar) {
      console.log('⏭️ Similar caption found, preventing duplicate:', trimmedText);
      return res.status(200).json({
        status: 'success',
        data: {
          caption: recentCaptions[0], // Return the most recent similar caption
          message: 'Similar caption prevented'
        }
      });
    }

    console.log('✅ Creating unique caption:', trimmedText);

    // Create new unique caption
    const caption = await Caption.create({
      eventId: eventId,
      text: trimmedText,
      timestamp: timestamp || new Date(),
      confidence: confidence || 0.9,
      speaker: speaker || 'User',
      provider: provider || 'webSpeech',
      language: language || 'en-US'
    });

    // Update event caption count
    await Event.findByIdAndUpdate(eventId, { 
      $inc: { captionCount: 1 },
      updatedAt: new Date()
    });

    console.log('✅ Unique caption created and event updated');

    res.status(201).json({
      status: 'success',
      data: {
        caption: caption
      }
    });

  } catch (error) {
    console.error('❌ Error creating caption:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error creating caption',
      error: error.message
    });
  }
};

// Helper function to calculate text similarity
function calculateTextSimilarity(text1, text2) {
  const words1 = text1.split(' ');
  const words2 = text2.split(' ');
  const maxLength = Math.max(words1.length, words2.length);
  
  if (maxLength === 0) return 1;
  
  let commonWords = 0;
  words1.forEach(word => {
    if (words2.includes(word)) {
      commonWords++;
    }
  });
  
  return commonWords / maxLength;
}


// Get captions by event ID
exports.getCaptionsByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    
    console.log('📋 Fetching captions for event:', eventId);

    // Verify event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        status: 'error',
        message: 'Event not found'
      });
    }

    // Get captions for this specific event
    const captions = await Caption.find({ eventId: eventId })
      .sort({ timestamp: 1 }) // Oldest first
      .populate('eventId', 'name'); // Populate event name

    console.log(`✅ Found ${captions.length} captions for event: ${event.name}`);

    res.status(200).json({
      status: 'success',
      data: {
        captions: captions,
        event: event
      }
    });

  } catch (error) {
    console.error('❌ Error fetching captions:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching captions',
      error: error.message
    });
  }
};

// Get all captions
exports.getAllCaptions = async (req, res) => {
  try {
    const captions = await Caption.find()
      .sort({ timestamp: -1 }) // Newest first
      .populate('eventId', 'name status');

    res.status(200).json({
      status: 'success',
      data: {
        captions: captions
      }
    });

  } catch (error) {
    console.error('Error fetching all captions:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching captions',
      error: error.message
    });
  }
};

// Delete caption
exports.deleteCaption = async (req, res) => {
  try {
    const { id } = req.params;

    const caption = await Caption.findByIdAndDelete(id);
    if (!caption) {
      return res.status(404).json({
        status: 'error',
        message: 'Caption not found'
      });
    }

    // Update event caption count
    await Event.findByIdAndUpdate(caption.eventId, { 
      $inc: { captionCount: -1 } 
    });

    res.status(200).json({
      status: 'success',
      message: 'Caption deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting caption:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error deleting caption',
      error: error.message
    });
  }
};
