import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Chip,
  CircularProgress,
  Alert,
  Switch,
  FormControlLabel
} from '@mui/material';
import { 
  Add, 
  PlayArrow, 
  Stop, 
  Edit, 
  Refresh,
  Mic,
  MicOff 
} from '@mui/icons-material';
import { useCaptionContext } from '../../contexts/CaptionContext';
import { toast } from 'react-hot-toast';
import moment from 'moment';
import apiService from '../../services/apiService';

const EventDashboard = () => {
  const { 
    currentEvent, 
    setCurrentEvent, 
    isRecording 
  } = useCaptionContext();
  
  // Initialize with empty array to prevent undefined errors
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [stats, setStats] = useState({});
  const [autoSpeechEnabled, setAutoSpeechEnabled] = useState(true);
  const [newEvent, setNewEvent] = useState({
    name: '',
    description: '',
    language: 'en-US',
    maxSpeakers: 1,
    customVocabulary: '',
    autoStartSpeech: true
  });

  // Load events and stats on component mount
  useEffect(() => {
    loadEvents();
    loadStats();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      console.log('📋 Loading events from backend...');
      
      const response = await apiService.events.getAll();
      console.log('API Response:', response);
      
      // Handle different response structures
      let eventsData = [];
      if (response && response.data) {
        if (Array.isArray(response.data)) {
          eventsData = response.data;
        } else if (response.data.events && Array.isArray(response.data.events)) {
          eventsData = response.data.events;
        } else if (response.data.data && Array.isArray(response.data.data.events)) {
          eventsData = response.data.data.events;
        }
      }
      
      // Filter out any invalid events and ensure they have required properties
      const validEvents = eventsData.filter(event => 
        event && 
        (event._id || event.id) && 
        event.name
      ).map(event => ({
        ...event,
        _id: event._id || event.id, // Ensure _id exists
        name: event.name || 'Untitled Event',
        status: event.status || 'created',
        createdAt: event.createdAt || new Date().toISOString(),
        captionCount: event.captionCount || 0,
        participants: event.participants || 1,
        language: event.language || 'en-US'
      }));
      
      setEvents(validEvents);
      console.log(`✅ Loaded ${validEvents.length} valid events`);
      
    } catch (error) {
      console.error('❌ Failed to load events:', error);
      toast.error('Failed to load events');
      setEvents([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await apiService.events.getStats();
      setStats(response.data || {});
    } catch (error) {
      console.error('Failed to load stats:', error);
      setStats({}); // Set empty object on error
    }
  };

  const handleCreateEvent = async () => {
    if (!newEvent.name.trim()) {
      toast.error('Event name is required');
      return;
    }

    try {
      setLoading(true);
      console.log('🆕 Creating new event:', newEvent.name);
      
      const response = await apiService.events.create(newEvent);
      console.log('Create event response:', response);
      
      // Handle different response structures
      let createdEvent = null;
      if (response && response.data) {
        if (response.data.event) {
          createdEvent = response.data.event;
        } else if (response.data.data && response.data.data.event) {
          createdEvent = response.data.data.event;
        } else {
          createdEvent = response.data;
        }
      }
      
      // Validate the created event
      if (createdEvent && (createdEvent._id || createdEvent.id)) {
        // Ensure proper event structure
        const validatedEvent = {
          ...createdEvent,
          _id: createdEvent._id || createdEvent.id,
          name: createdEvent.name || newEvent.name,
          status: createdEvent.status || 'created',
          createdAt: createdEvent.createdAt || new Date().toISOString(),
          captionCount: createdEvent.captionCount || 0,
          participants: createdEvent.participants || 1,
          language: createdEvent.language || newEvent.language
        };
        
        setEvents(prev => [validatedEvent, ...(prev || [])]);
        
        setOpenDialog(false);
        setNewEvent({
          name: '',
          description: '',
          language: 'en-US',
          maxSpeakers: 1,
          customVocabulary: '',
          autoStartSpeech: true
        });
        
        toast.success('Event created successfully');
        console.log('✅ Event created and added to list:', validatedEvent.name);
        loadStats();
      } else {
        throw new Error('Invalid event data returned from server');
      }
      
    } catch (error) {
      console.error('❌ Failed to create event:', error);
      toast.error('Failed to create event: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleStartEvent = async (event) => {
    if (!event || !event._id) {
      toast.error('Invalid event');
      return;
    }

    try {
      setLoading(true);
      console.log('🚀 Starting event:', event.name, event._id);
      
      // Start event in backend
      const response = await apiService.events.start(event._id);
      console.log('✅ Event started in backend:', response.data);
      
      let updatedEvent = null;
      if (response && response.data) {
        if (response.data.event) {
          updatedEvent = response.data.event;
        } else if (response.data.data && response.data.data.event) {
          updatedEvent = response.data.data.event;
        } else {
          updatedEvent = response.data;
        }
      }
      
      if (updatedEvent && (updatedEvent._id || updatedEvent.id)) {
        // Update local state
        setEvents(prev => 
          (prev || []).map(e => 
            e._id === event._id ? { ...updatedEvent, _id: updatedEvent._id || updatedEvent.id } : e
          )
        );
        
        // Set current event
        setCurrentEvent({ ...updatedEvent, _id: updatedEvent._id || updatedEvent.id });
        
        toast.success(`Event "${event.name}" started! Auto-recording will begin.`);
        
        // Redirect to live caption page
        setTimeout(() => {
          window.location.href = '/live';
        }, 2000);
      }
      
      loadStats();
    } catch (error) {
      console.error('❌ Failed to start event:', error);
      toast.error('Failed to start event');
    } finally {
      setLoading(false);
    }
  };

  const handleStopEvent = async (event) => {
    if (!event || !event._id) {
      toast.error('Invalid event');
      return;
    }

    try {
      setLoading(true);
      console.log('🛑 Stopping event:', event.name, event._id);
      
      // Stop event in backend
      const response = await apiService.events.stop(event._id);
      
      let updatedEvent = null;
      if (response && response.data) {
        if (response.data.event) {
          updatedEvent = response.data.event;
        } else if (response.data.data && response.data.data.event) {
          updatedEvent = response.data.data.event;
        } else {
          updatedEvent = response.data;
        }
      }
      
      if (updatedEvent) {
        // Update local state
        setEvents(prev => 
          (prev || []).map(e => 
            e._id === event._id ? { ...updatedEvent, _id: updatedEvent._id || updatedEvent.id } : e
          )
        );
        
        // Clear current event if it matches
        if (currentEvent && currentEvent._id === event._id) {
          setCurrentEvent(null);
        }
      }
      
      toast.success(`Event "${event.name}" stopped successfully.`);
      loadStats();
    } catch (error) {
      console.error('❌ Failed to stop event:', error);
      toast.error('Failed to stop event');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async (eventId, eventName) => {
    if (!eventId) {
      toast.error('Invalid event ID');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete "${eventName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setLoading(true);
      await apiService.events.delete(eventId);
      
      setEvents(prev => (prev || []).filter(event => event && event._id !== eventId));
      
      // Clear current event if it's the deleted one
      if (currentEvent && currentEvent._id === eventId) {
        setCurrentEvent(null);
      }
      
      toast.success('Event deleted successfully');
      loadStats();
    } catch (error) {
      console.error('❌ Failed to delete event:', error);
      toast.error('Failed to delete event');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadEvents();
    loadStats();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'completed': return 'default';
      case 'created': return 'primary';
      case 'failed': return 'error';
      default: return 'default';
    }
  };

  // Show loading state for initial load
  if (loading && (!events || events.length === 0)) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>Loading events...</Typography>
      </Box>
    );
  }

  return (
    <div className="dashboard-container" style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header Section */}
      <Box 
        display="flex" 
        justifyContent="space-between" 
        alignItems="center" 
        mb={4}
        sx={{
          flexWrap: 'wrap',
          gap: 2,
          '@media (max-width: 600px)': {
            flexDirection: 'column',
            alignItems: 'stretch'
          }
        }}
      >
        <Typography variant="h4" sx={{ flex: 1, minWidth: 'fit-content' }}>
          Event Dashboard
        </Typography>
        <Box display="flex" gap={2} alignItems="center">
          <FormControlLabel
            control={
              <Switch
                checked={autoSpeechEnabled}
                onChange={(e) => setAutoSpeechEnabled(e.target.checked)}
                color="primary"
              />
            }
            label="Auto-Speech"
          />
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={handleRefresh}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setOpenDialog(true)}
            disabled={loading}
          >
            Create Event
          </Button>
        </Box>
      </Box>

      {/* Auto-Speech Info */}
      {autoSpeechEnabled && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            🎤 Auto-Speech is enabled. When you start an event, speech recognition will automatically begin 
            and all captions will be saved to the database.
          </Typography>
        </Alert>
      )}

      {/* Stats Cards */}
      {Object.keys(stats).length > 0 && (
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="primary">
                  {stats.totalEvents || 0}
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
                  {stats.activeEvents || 0}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Active Events
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="info.main">
                  {stats.totalCaptions || 0}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Total Captions
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="warning.main">
                  {stats.avgParticipants || 0}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Avg Participants
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Current Active Event */}
      {currentEvent && currentEvent._id && (
        <Card sx={{ mb: 4, border: '2px solid #4caf50' }}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="h6" color="success.main" gutterBottom>
                  🔴 Currently Active Event
                </Typography>
                <Typography variant="h5">{currentEvent.name}</Typography>
                <Typography color="textSecondary">{currentEvent.description}</Typography>
                <Box mt={2} display="flex" gap={1} flexWrap="wrap">
                  <Chip label="Active" color="success" />
                  <Chip label={`Language: ${currentEvent.language}`} />
                  <Chip label={`Started: ${moment(currentEvent.startTime).format('HH:mm')}`} />
                  <Chip label={`Captions: ${currentEvent.captionCount || 0}`} />
                  {isRecording && (
                    <Chip 
                      icon={<Mic />} 
                      label="Recording" 
                      color="secondary" 
                      className="pulse-animation" 
                    />
                  )}
                </Box>
              </Box>
              <Box display="flex" gap={1}>
                <Button
                  variant="outlined"
                  href="/live"
                  startIcon={isRecording ? <MicOff /> : <Mic />}
                >
                  {isRecording ? 'View Live' : 'Go Live'}
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Events Grid */}
      {!events || events.length === 0 ? (
        <Alert severity="info" sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>No Events Found</Typography>
          <Typography>
            {loading 
              ? 'Loading events...' 
              : 'No events found. Create your first event to get started with live captioning!'
            }
          </Typography>
          {!loading && (
            <Box mt={2}>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setOpenDialog(true)}
              >
                Create Your First Event
              </Button>
            </Box>
          )}
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {events.filter(event => event && event._id).map((event) => (
            <Grid item xs={12} md={6} lg={4} key={event._id || `event-${Math.random()}`}>
              <Card sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                border: event._id === currentEvent?._id ? '2px solid #4caf50' : 'none'
              }}>
                <CardContent sx={{ flex: 1 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Typography variant="h6" gutterBottom sx={{ flex: 1, mr: 1 }}>
                      {event.name || 'Untitled Event'}
                    </Typography>
                    <Chip 
                      label={event.status || 'unknown'} 
                      color={getStatusColor(event.status)}
                      size="small"
                    />
                  </Box>
                  
                  <Typography color="textSecondary" gutterBottom>
                    {event.description || 'No description'}
                  </Typography>
                  
                  <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
                    <Chip 
                      label={`${event.participants || 1} participants`} 
                      size="small"
                    />
                    <Chip 
                      label={`${event.captionCount || 0} captions`} 
                      size="small"
                    />
                    {event.accuracy > 0 && (
                      <Chip 
                        label={`${event.accuracy}% accuracy`} 
                        size="small"
                        color="success"
                      />
                    )}
                  </Box>
                  
                  <Typography variant="caption" display="block" gutterBottom>
                    Created: {moment(event.createdAt).format('MMM DD, YYYY HH:mm')}
                  </Typography>
                  
                  <Box display="flex" gap={1} mt={2} flexWrap="wrap">
                    {event.status === 'created' && (
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<PlayArrow />}
                        onClick={() => handleStartEvent(event)}
                        disabled={loading}
                        color="success"
                      >
                        Start & Go Live
                      </Button>
                    )}
                    
                    {event.status === 'active' && (
                      <Button
                        variant="outlined"
                        size="small"
                        color="warning"
                        startIcon={<Stop />}
                        onClick={() => handleStopEvent(event)}
                        disabled={loading}
                      >
                        Stop
                      </Button>
                    )}
                    
                    <Button
                      variant="text"
                      size="small"
                      startIcon={<Edit />}
                      disabled={loading}
                    >
                      Edit
                    </Button>
                    
                    <Button
                      variant="text"
                      size="small"
                      color="error"
                      onClick={() => handleDeleteEvent(event._id, event.name)}
                      disabled={loading || event.status === 'active'}
                    >
                      Delete
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create Event Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Event with Live Captioning</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Event Name"
            margin="normal"
            variant="outlined"
            value={newEvent.name}
            onChange={(e) => setNewEvent(prev => ({ ...prev, name: e.target.value }))}
            required
          />
          
          <TextField
            fullWidth
            label="Description"
            margin="normal"
            variant="outlined"
            multiline
            rows={3}
            value={newEvent.description}
            onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
          />
          
          <FormControl fullWidth margin="normal">
            <InputLabel>Language</InputLabel>
            <Select
              value={newEvent.language}
              onChange={(e) => setNewEvent(prev => ({ ...prev, language: e.target.value }))}
            >
              <MenuItem value="en-US">🇺🇸 English (US)</MenuItem>
              <MenuItem value="en-GB">🇬🇧 English (UK)</MenuItem>
              <MenuItem value="es-ES">🇪🇸 Spanish</MenuItem>
              <MenuItem value="fr-FR">🇫🇷 French</MenuItem>
              <MenuItem value="de-DE">🇩🇪 German</MenuItem>
              <MenuItem value="ja-JP">🇯🇵 Japanese</MenuItem>
              <MenuItem value="zh-CN">🇨🇳 Chinese (Mandarin)</MenuItem>
            </Select>
          </FormControl>
          
          <TextField
            fullWidth
            label="Max Speakers"
            type="number"
            margin="normal"
            variant="outlined"
            value={newEvent.maxSpeakers}
            onChange={(e) => setNewEvent(prev => ({ ...prev, maxSpeakers: parseInt(e.target.value) }))}
            inputProps={{ min: 1, max: 10 }}
          />
          
          <Alert severity="info" sx={{ mt: 2 }}>
            💡 When you start this event, speech recognition will automatically begin and save all captions to the database.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleCreateEvent}
            variant="contained"
            disabled={!newEvent.name.trim() || loading}
          >
            {loading ? <CircularProgress size={20} /> : 'Create Event'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default EventDashboard;
