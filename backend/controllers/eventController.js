const Event = require('../models/Event');
const Caption = require('../models/Caption');

// Get all events
exports.getAllEvents = async (req, res) => {
  try {
    const events = await Event.find()
      .sort({ createdAt: -1 }) // Newest first
      .lean();

    console.log(`📋 Retrieved ${events.length} events`);

    res.status(200).json({
      status: 'success',
      data: {
        events: events
      }
    });

  } catch (error) {
    console.error('❌ Error fetching events:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching events',
      error: error.message
    });
  }
};

// Create new event
exports.createEvent = async (req, res) => {
  try {
    const {
      name,
      description,
      language,
      maxSpeakers,
      customVocabulary,
      autoStartSpeech
    } = req.body;

    console.log('🆕 Creating event:', name);

    const event = await Event.create({
      name: name.trim(),
      description: description?.trim(),
      language: language || 'en-US',
      maxSpeakers: maxSpeakers || 1,
      customVocabulary: customVocabulary?.trim(),
      autoStartSpeech: autoStartSpeech || false,
      status: 'created',
      captionCount: 0,
      participants: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log('✅ Event created:', event._id, event.name);

    res.status(201).json({
      status: 'success',
      data: {
        event: event
      }
    });

  } catch (error) {
    console.error('❌ Error creating event:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error creating event',
      error: error.message
    });
  }
};

// Start event
exports.startEvent = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('🚀 Starting event with ID:', id);

    // Find and validate event
    const event = await Event.findById(id);
    if (!event) {
      console.log('❌ Event not found:', id);
      return res.status(404).json({
        status: 'error',
        message: 'Event not found'
      });
    }

    console.log('📋 Found event:', event.name, 'Current status:', event.status);

    // Check if event can be started
    if (event.status === 'active') {
      console.log('⚠️ Event already active:', event.name);
      return res.status(400).json({
        status: 'error',
        message: 'Event is already active'
      });
    }

    // Update event status to active
    const updatedEvent = await Event.findByIdAndUpdate(
      id,
      {
        status: 'active',
        startTime: new Date(),
        updatedAt: new Date()
      },
      {
        new: true, // Return updated document
        runValidators: true
      }
    );

    console.log('✅ Event started successfully:', updatedEvent.name, 'Status:', updatedEvent.status);

    res.status(200).json({
      status: 'success',
      data: {
        event: updatedEvent
      }
    });

  } catch (error) {
    console.error('❌ Error starting event:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error starting event',
      error: error.message
    });
  }
};

// Stop event
exports.stopEvent = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('🛑 Stopping event with ID:', id);

    // Find and validate event
    const event = await Event.findById(id);
    if (!event) {
      console.log('❌ Event not found:', id);
      return res.status(404).json({
        status: 'error',
        message: 'Event not found'
      });
    }

    console.log('📋 Found event:', event.name, 'Current status:', event.status);

    // Update event status to completed
    const updatedEvent = await Event.findByIdAndUpdate(
      id,
      {
        status: 'completed',
        endTime: new Date(),
        updatedAt: new Date()
      },
      {
        new: true,
        runValidators: true
      }
    );

    console.log('✅ Event stopped successfully:', updatedEvent.name, 'Status:', updatedEvent.status);

    res.status(200).json({
      status: 'success',
      data: {
        event: updatedEvent
      }
    });

  } catch (error) {
    console.error('❌ Error stopping event:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error stopping event',
      error: error.message
    });
  }
};

// Delete event
exports.deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('🗑️ Deleting event with ID:', id);

    // Check if event exists
    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({
        status: 'error',
        message: 'Event not found'
      });
    }

    // Don't allow deleting active events
    if (event.status === 'active') {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot delete an active event. Stop the event first.'
      });
    }

    // Delete associated captions first
    await Caption.deleteMany({ eventId: id });
    console.log('🗑️ Deleted captions for event:', event.name);

    // Delete the event
    await Event.findByIdAndDelete(id);
    console.log('✅ Event deleted successfully:', event.name);

    res.status(200).json({
      status: 'success',
      message: 'Event deleted successfully'
    });

  } catch (error) {
    console.error('❌ Error deleting event:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error deleting event',
      error: error.message
    });
  }
};

// Get event statistics
exports.getEventStats = async (req, res) => {
  try {
    const [
      totalEvents,
      activeEvents,
      totalCaptions,
      events
    ] = await Promise.all([
      Event.countDocuments(),
      Event.countDocuments({ status: 'active' }),
      Caption.countDocuments(),
      Event.find().select('participants').lean()
    ]);

    const avgParticipants = events.length > 0 
      ? Math.round(events.reduce((sum, event) => sum + (event.participants || 1), 0) / events.length)
      : 0;

    const stats = {
      totalEvents,
      activeEvents,
      totalCaptions,
      avgParticipants
    };

    console.log('📊 Event stats:', stats);

    res.status(200).json({
      status: 'success',
      data: stats
    });

  } catch (error) {
    console.error('❌ Error fetching event stats:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching event stats',
      error: error.message
    });
  }
};

// Get single event by ID
exports.getEventById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({
        status: 'error',
        message: 'Event not found'
      });
    }

    // Get caption count for this event
    const captionCount = await Caption.countDocuments({ eventId: id });
    
    const eventWithCaptions = {
      ...event.toObject(),
      captionCount
    };

    res.status(200).json({
      status: 'success',
      data: {
        event: eventWithCaptions
      }
    });

  } catch (error) {
    console.error('❌ Error fetching event:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching event',
      error: error.message
    });
  }
};
