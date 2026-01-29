import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Alert,
  CircularProgress,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  Divider
} from '@mui/material';
import {
  ExpandMore,
  Refresh,
  Download,
  Delete,
  Event as EventIcon
} from '@mui/icons-material';
import apiService from '../../services/apiService';
import moment from 'moment';
import { toast } from 'react-hot-toast';

const EventHistory = () => {
  const [events, setEvents] = useState([]);
  const [eventCaptions, setEventCaptions] = useState({});
  const [loading, setLoading] = useState(true); // Start with loading true
  const [loadingCaptions, setLoadingCaptions] = useState({});
  const [expandedEvent, setExpandedEvent] = useState(null);

  // Load events on component mount
  useEffect(() => {
    console.log('🔄 EventHistory component mounted, loading events...');
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      console.log('📋 Loading events for history...');
      
      // Use the same API call as Dashboard
      const response = await apiService.events.getAll();
      console.log('📊 Raw API response:', response);
      
      // Handle the response structure (same as Dashboard)
      let eventsData = [];
      if (response && response.data) {
        if (Array.isArray(response.data)) {
          eventsData = response.data;
        } else if (response.data.events && Array.isArray(response.data.events)) {
          eventsData = response.data.events;
        }
      }
      
      console.log('📋 Processed events data:', eventsData);
      
      // Filter and validate events
      const validEvents = eventsData.filter(event => 
        event && 
        (event._id || event.id) && 
        event.name
      ).map(event => ({
        ...event,
        _id: event._id || event.id,
        name: event.name || 'Untitled Event',
        status: event.status || 'created',
        createdAt: event.createdAt || new Date().toISOString(),
        captionCount: event.captionCount || 0
      }));
      
      // Sort by creation date (newest first) 
      const sortedEvents = validEvents.sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      );
      
      setEvents(sortedEvents);
      console.log(`✅ Loaded ${sortedEvents.length} events for history:`, sortedEvents);
      
    } catch (error) {
      console.error('❌ Failed to load event history:', error);
      toast.error('Failed to load event history');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const loadEventCaptions = async (eventId, eventName) => {
    if (eventCaptions[eventId]) {
      console.log('📋 Captions already loaded for:', eventName);
      return;
    }

    try {
      setLoadingCaptions(prev => ({ ...prev, [eventId]: true }));
      console.log('📥 Loading captions for event:', eventName, 'ID:', eventId);
      
      const response = await apiService.captions.getByEvent(eventId);
      console.log('📊 Captions response:', response);
      
      let captions = [];
      if (response && response.data) {
        if (Array.isArray(response.data)) {
          captions = response.data;
        } else if (response.data.captions && Array.isArray(response.data.captions)) {
          captions = response.data.captions;
        }
      }
      
      setEventCaptions(prev => ({
        ...prev,
        [eventId]: captions
      }));
      
      console.log(`✅ Loaded ${captions.length} captions for event: ${eventName}`);
      
    } catch (error) {
      console.error('❌ Failed to load captions for event:', eventName, error);
      toast.error(`Failed to load captions for ${eventName}`);
      setEventCaptions(prev => ({
        ...prev,
        [eventId]: []
      }));
    } finally {
      setLoadingCaptions(prev => ({ ...prev, [eventId]: false }));
    }
  };

  const handleEventToggle = (eventId, eventName) => {
    console.log('🔄 Toggling event:', eventName, 'ID:', eventId);
    if (expandedEvent === eventId) {
      setExpandedEvent(null);
    } else {
      setExpandedEvent(eventId);
      loadEventCaptions(eventId, eventName);
    }
  };

  const handleDownloadCaptions = async (event) => {
    const captions = eventCaptions[event._id] || [];
    
    if (captions.length === 0) {
      toast.error('No captions to download');
      return;
    }

    try {
      const header = `Event: ${event.name}\nDate: ${moment(event.createdAt).format('MMMM DD, YYYY')}\nStatus: ${event.status}\nTotal Captions: ${captions.length}\n\n`;
      
      const captionText = captions.map((caption, index) => 
        `${index + 1}. [${moment(caption.timestamp).format('HH:mm:ss')}] ${caption.speaker || 'User'}: ${caption.text}`
      ).join('\n\n');

      const fullText = header + captionText;
      const blob = new Blob([fullText], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${event.name.replace(/\s+/g, '_')}-captions.txt`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('Captions downloaded successfully!');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download captions');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'completed': return 'primary';
      case 'created': return 'warning';
      case 'failed': return 'error';
      default: return 'default';
    }
  };

  const getEventDuration = (event) => {
    if (event.startTime && event.endTime) {
      const duration = moment(event.endTime).diff(moment(event.startTime), 'minutes');
      return `${duration} minutes`;
    } else if (event.startTime && event.status === 'active') {
      const duration = moment().diff(moment(event.startTime), 'minutes');
      return `${duration} minutes (ongoing)`;
    }
    return 'Not started';
  };

  // Debug info
  console.log('🔍 EventHistory render state:', {
    loading,
    eventsCount: events.length,
    events: events.map(e => ({ id: e._id, name: e.name, status: e.status }))
  });

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>Loading event history...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4">
          📚 Event History
        </Typography>
        <Box display="flex" gap={2}>
          <Typography variant="body2" color="textSecondary">
            {events.length} total events
          </Typography>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={loadEvents}
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Debug Info */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          📊 Debug: Found {events.length} events | Loading: {loading ? 'Yes' : 'No'}
        </Typography>
      </Alert>

      {/* Statistics */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="primary">
                {events.length}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Total Events
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="success.main">
                {events.filter(e => e.status === 'completed').length}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Completed
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="warning.main">
                {events.filter(e => e.status === 'active').length}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Active
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="info.main">
                {events.reduce((sum, event) => sum + (event.captionCount || 0), 0)}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Total Captions
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Events List */}
      {events.length === 0 ? (
        <Alert severity="info">
          <Typography variant="h6" gutterBottom>No Events Found</Typography>
          <Typography>
            No events have been created yet. The events you see in Dashboard should appear here.
            Try clicking Refresh or check the browser console for errors.
          </Typography>
        </Alert>
      ) : (
        <Box>
          <Typography variant="h6" gutterBottom>
            All Events ({events.length})
          </Typography>
          {events.map((event) => (
            <Accordion 
              key={event._id}
              expanded={expandedEvent === event._id}
              onChange={() => handleEventToggle(event._id, event.name)}
              sx={{ mb: 2 }}
            >
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Box display="flex" justifyContent="space-between" alignItems="center" width="100%">
                  <Box display="flex" alignItems="center" gap={2} flex={1}>
                    <EventIcon color="primary" />
                    <Box>
                      <Typography variant="h6">{event.name}</Typography>
                      <Typography variant="body2" color="textSecondary">
                        {event.description || 'No description'}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        ID: {event._id}
                      </Typography>
                    </Box>
                  </Box>
                  <Box display="flex" gap={1} alignItems="center" onClick={(e) => e.stopPropagation()}>
                    <Chip 
                      label={event.status} 
                      color={getStatusColor(event.status)}
                      size="small"
                    />
                    <Chip 
                      label={`${event.captionCount || 0} captions`}
                      size="small"
                    />
                    <Typography variant="caption" color="textSecondary">
                      {moment(event.createdAt).format('MMM DD, YYYY')}
                    </Typography>
                  </Box>
                </Box>
              </AccordionSummary>
              
              <AccordionDetails>
                <Box>
                  {/* Event Details */}
                  <Grid container spacing={2} mb={3}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" gutterBottom>
                        📅 Event Information
                      </Typography>
                      <Box display="flex" flexDirection="column" gap={1}>
                        <Typography variant="body2">
                          <strong>Created:</strong> {moment(event.createdAt).format('MMMM DD, YYYY HH:mm')}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Language:</strong> {event.language || 'en-US'}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Duration:</strong> {getEventDuration(event)}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Participants:</strong> {event.participants || 1}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>

                  <Divider sx={{ my: 2 }} />

                  {/* Action Buttons */}
                  <Box display="flex" gap={1} mb={3}>
                    <Button
                      startIcon={<Download />}
                      onClick={() => handleDownloadCaptions(event)}
                      disabled={!eventCaptions[event._id] || eventCaptions[event._id].length === 0}
                      size="small"
                    >
                      Download Captions
                    </Button>
                  </Box>

                  {/* Captions */}
                  <Typography variant="h6" gutterBottom>
                    🎤 Captions ({eventCaptions[event._id]?.length || 0})
                  </Typography>
                  
                  {loadingCaptions[event._id] ? (
                    <Box display="flex" justifyContent="center" p={3}>
                      <CircularProgress size={20} />
                      <Typography variant="body2" sx={{ ml: 2 }}>Loading captions...</Typography>
                    </Box>
                  ) : !eventCaptions[event._id] || eventCaptions[event._id].length === 0 ? (
                    <Alert severity="info">
                      No captions found for this event.
                    </Alert>
                  ) : (
                    <Box maxHeight="400px" overflow="auto">
                      {eventCaptions[event._id].map((caption, index) => (
                        <Card key={caption._id || index} variant="outlined" sx={{ mb: 1 }}>
                          <CardContent sx={{ py: 1.5 }}>
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                              <Typography variant="caption" color="textSecondary">
                                #{index + 1} • {moment(caption.timestamp).format('HH:mm:ss')}
                              </Typography>
                              <Box display="flex" gap={1}>
                                <Chip
                                  label={caption.speaker || 'User'}
                                  size="small"
                                  color="primary"
                                />
                                <Chip
                                  label={`${Math.round((caption.confidence || 0.9) * 100)}%`}
                                  size="small"
                                  color="success"
                                />
                              </Box>
                            </Box>
                            <Typography variant="body2">
                              {caption.text}
                            </Typography>
                          </CardContent>
                        </Card>
                      ))}
                    </Box>
                  )}
                </Box>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default EventHistory;
