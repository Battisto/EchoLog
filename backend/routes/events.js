const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');

// Get all events
router.get('/', eventController.getAllEvents);

// Get event stats
router.get('/stats', eventController.getEventStats);

// Get single event by ID
router.get('/:id', eventController.getEventById);

// Create new event
router.post('/', eventController.createEvent);

// Start event
router.put('/:id/start', eventController.startEvent);

// Stop event
router.put('/:id/stop', eventController.stopEvent);

// Delete event
router.delete('/:id', eventController.deleteEvent);

module.exports = router;
