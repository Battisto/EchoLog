const express = require('express');
const router = express.Router();
const captionController = require('../controllers/captionController');

// Create new caption
router.post('/', captionController.createCaption);

// Get captions by event ID
router.get('/event/:eventId', captionController.getCaptionsByEvent);

// Get all captions
router.get('/', captionController.getAllCaptions);

// Delete caption
router.delete('/:id', captionController.deleteCaption);

module.exports = router;
