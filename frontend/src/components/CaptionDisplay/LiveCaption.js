import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Fab,
  Chip,
  Alert,
  LinearProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  CircularProgress // Add this import
} from '@mui/material';
import { 
  Mic, 
  MicOff, 
  Clear, 
  Stop,
  Dashboard,
  Settings,
  Download,
  Warning
} from '@mui/icons-material';
import { useCaptionContext } from '../../contexts/CaptionContext';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import { useSettings } from '../../contexts/SettingsContext';
import apiService from '../../services/apiService';
import moment from 'moment';
import { toast } from 'react-hot-toast';

const LiveCaption = () => {
  const { captions, currentEvent, setCurrentEvent } = useCaptionContext();
  const { settings } = useSettings();
  const {
    startListening,
    stopListening,
    forceStopListening,
    isSupported,
    listening,
    transcript,
    interimTranscript,
    resetTranscript
  } = useSpeechRecognition();

  const captionsEndRef = useRef(null);
  const [liveText, setLiveText] = useState('');
  const [showStopDialog, setShowStopDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [eventCheckLoading, setEventCheckLoading] = useState(true);

  // Check for active events on component mount
  useEffect(() => {
    checkForActiveEvents();
  }, []);

  // Check for active events
  const checkForActiveEvents = async () => {
    try {
      setEventCheckLoading(true);
      console.log('🔍 Checking for active events...');
      
      const response = await apiService.events.getAll();
      let eventsData = [];
      
      if (response && response.data) {
        if (Array.isArray(response.data)) {
          eventsData = response.data;
        } else if (response.data.events && Array.isArray(response.data.events)) {
          eventsData = response.data.events;
        }
      }

      // Find active event
      const activeEvent = eventsData.find(event => 
        event && event.status === 'active' && (event._id || event.id)
      );

      if (activeEvent) {
        const normalizedEvent = {
          ...activeEvent,
          _id: activeEvent._id || activeEvent.id
        };
        
        console.log('✅ Found active event:', normalizedEvent.name, normalizedEvent._id);
        setCurrentEvent(normalizedEvent);
      } else {
        console.log('ℹ️ No active events found');
        setCurrentEvent(null);
      }
      
    } catch (error) {
      console.error('❌ Failed to check for active events:', error);
    } finally {
      setEventCheckLoading(false);
    }
  };

  // Auto scroll to latest caption
  useEffect(() => {
    if (settings?.autoScroll && captionsEndRef.current) {
      captionsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [captions, settings?.autoScroll]);

  // Update live text display
  useEffect(() => {
    if (transcript || interimTranscript) {
      setLiveText(transcript + (interimTranscript ? ` ${interimTranscript}` : ''));
    }
  }, [transcript, interimTranscript]);

  const handleToggleRecording = () => {
    if (!currentEvent) {
      toast.error('Please start an event first from the Dashboard');
      return;
    }
    
    if (currentEvent.status !== 'active') {
      toast.error('Event is not active. Please check event status in Dashboard.');
      return;
    }

    if (listening) {
      stopListening();
      toast.info('Recording stopped');
    } else {
      startListening();
      toast.success('Recording started');
    }
  };

  const handleClearText = () => {
    resetTranscript();
    setLiveText('');
  };

  // Simple navigation function
  const handleNavigation = async (path) => {
    try {
      if (listening) {
        await forceStopListening();
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      window.location.href = path;
    } catch (error) {
      console.error('Navigation error:', error);
      window.location.href = path;
    }
  };

  const handleStopEvent = async () => {
    if (!currentEvent) return;

    try {
      setLoading(true);
      
      if (listening) {
        await forceStopListening();
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      const response = await apiService.events.stop(currentEvent._id);
      setCurrentEvent(null);
      
      toast.success(`Event "${currentEvent.name}" stopped successfully!`);
      setShowStopDialog(false);
      
      setTimeout(() => {
        window.location.href = '/';
      }, 1500);
      
    } catch (error) {
      console.error('Failed to stop event:', error);
      toast.error('Failed to stop event');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCaptions = async () => {
    if (!currentEvent || captions.length === 0) {
      toast.error('No captions to download');
      return;
    }

    try {
      const captionText = captions.map((caption, index) => 
        `${index + 1}. [${moment(caption.timestamp).format('HH:mm:ss')}] ${caption.speaker || 'User'}: ${caption.text}`
      ).join('\n\n');

      const blob = new Blob([captionText], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${currentEvent.name.replace(/\s+/g, '_')}-captions.txt`);
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

  const getCaptionStyle = () => ({
    color: settings?.textColor || '#000000',
    backgroundColor: settings?.backgroundColor || '#f5f5f5',
    fontSize: `${settings?.fontSize || 24}px`,
    fontFamily: settings?.fontFamily || 'Arial, sans-serif',
    opacity: settings?.opacity || 1,
    padding: '20px',
    borderRadius: '12px',
    margin: '8px 0',
    minHeight: '100px',
    display: 'flex',
    alignItems: 'center',
    border: `3px solid ${listening ? '#4caf50' : '#e0e0e0'}`,
    transition: 'border-color 0.3s ease'
  });

  if (!isSupported) {
    return (
      <Box p={3}>
        <Alert severity="error">
          Speech recognition is not supported in this browser. 
          Please use Chrome, Edge, or Safari for the best experience.
        </Alert>
      </Box>
    );
  }

  // Show loading state while checking for events
  if (eventCheckLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>Checking for active events...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', p: 2 }}>
      {/* Header with Event Controls */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="h5" gutterBottom>
                🎤 Live Captioning
                {currentEvent && (
                  <Chip 
                    label={`📅 ${currentEvent.name}`}
                    color="primary"
                    sx={{ ml: 2 }}
                  />
                )}
              </Typography>
              
              <Box display="flex" gap={1} flexWrap="wrap">
                <Chip 
                  label={listening ? '🔴 Recording' : '⏸️ Stopped'} 
                  color={listening ? 'error' : 'default'}
                  size="small"
                />
                <Chip 
                  label={`💾 ${captions.length} captions`} 
                  size="small"
                />
                {currentEvent ? (
                  <Chip 
                    label={`Status: ${currentEvent.status.toUpperCase()}`}
                    color={currentEvent.status === 'active' ? 'success' : 'warning'}
                    size="small"
                  />
                ) : (
                  <Chip 
                    label="No Event"
                    color="error"
                    size="small"
                  />
                )}
              </Box>
            </Box>
            
            {/* Control Buttons */}
            <Box display="flex" gap={1} alignItems="center" flexWrap="wrap">
              <Tooltip title="Go to Dashboard">
                <Button
                  variant="outlined"
                  startIcon={<Dashboard />}
                  onClick={() => handleNavigation('/')}
                  size="small"
                  color={listening ? 'warning' : 'primary'}
                >
                  Dashboard
                </Button>
              </Tooltip>
              
              <Tooltip title="Settings">
                <Button
                  variant="outlined"
                  startIcon={<Settings />}
                  onClick={() => handleNavigation('/settings')}
                  size="small"
                  color={listening ? 'warning' : 'primary'}
                >
                  Settings
                </Button>
              </Tooltip>

              {captions.length > 0 && (
                <Tooltip title="Download Captions">
                  <IconButton
                    color="success"
                    onClick={handleDownloadCaptions}
                  >
                    <Download />
                  </IconButton>
                </Tooltip>
              )}

              <Button
                variant="outlined"
                startIcon={<Clear />}
                onClick={handleClearText}
                size="small"
              >
                Clear
              </Button>

              {/* Stop Event Button */}
              {currentEvent && currentEvent.status === 'active' && (
                <Button
                  variant="contained"
                  color="error"
                  startIcon={<Stop />}
                  onClick={() => setShowStopDialog(true)}
                  size="small"
                >
                  Stop Event
                </Button>
              )}

              <Fab
                color={listening ? 'secondary' : 'primary'}
                onClick={handleToggleRecording}
                size="medium"
                disabled={!currentEvent || currentEvent.status !== 'active'}
              >
                {listening ? <MicOff /> : <Mic />}
              </Fab>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Status Alerts */}
      {!currentEvent && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="h6" gutterBottom>⚠️ No Active Event Found</Typography>
          <Typography>
            No active event detected. Please go to Dashboard and start an event to begin recording captions.
          </Typography>
          <Box mt={1}>
            <Button
              variant="contained"
              startIcon={<Dashboard />}
              onClick={() => handleNavigation('/')}
              size="small"
            >
              Go to Dashboard
            </Button>
          </Box>
        </Alert>
      )}

      {currentEvent && currentEvent.status !== 'active' && (
        <Alert severity="error" sx={{ mb: 2 }}>
          <Typography variant="h6" gutterBottom>🛑 Event Not Active</Typography>
          <Typography>
            Event "{currentEvent.name}" has status: <strong>{currentEvent.status}</strong>. 
            Only active events can record captions.
          </Typography>
          <Box mt={1}>
            <Button
              variant="contained"
              startIcon={<Dashboard />}
              onClick={() => handleNavigation('/')}
              size="small"
            >
              Go to Dashboard
            </Button>
          </Box>
        </Alert>
      )}

      {currentEvent && currentEvent.status === 'active' && !listening && (
        <Alert severity="success" sx={{ mb: 2 }}>
          <Typography variant="h6" gutterBottom>✅ Ready to Record</Typography>
          <Typography>
            Event "{currentEvent.name}" is active! Click the microphone button to start recording captions.
          </Typography>
        </Alert>
      )}

      {currentEvent && currentEvent.status === 'active' && listening && (
        <Card sx={{ mb: 2, bgcolor: '#e8f5e8', border: '2px solid #4caf50' }}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="h6" color="success.main">
                  🎤 LIVE RECORDING ACTIVE
                </Typography>
                <Typography variant="body2">
                  All speech is being saved to "{currentEvent.name}" event
                </Typography>
              </Box>
              <Button
                variant="outlined"
                color="error"
                startIcon={<Stop />}
                onClick={() => setShowStopDialog(true)}
                size="small"
              >
                Stop Event
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Recording Indicator */}
      {listening && (
        <Box sx={{ mb: 2 }}>
          <LinearProgress 
            color="secondary" 
            sx={{ 
              height: 8, 
              borderRadius: 4,
              animation: 'pulse 1.5s ease-in-out infinite'
            }} 
          />
          <Typography variant="body1" align="center" sx={{ mt: 1, fontWeight: 'bold' }}>
            🎙️ Listening... Speak clearly into your microphone
          </Typography>
        </Box>
      )}

      {/* Live Caption Display - Only show when event is active */}
      {currentEvent && currentEvent.status === 'active' && (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Live Speech Preview
            </Typography>
            <Box sx={getCaptionStyle()}>
              <Typography sx={{ textAlign: 'center', wordBreak: 'break-word' }}>
                {liveText || (
                  listening 
                    ? '🎤 Listening... Start speaking to see live captions!' 
                    : '▶️ Click the microphone button to start recording'
                )}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Caption History - Only show when event is active */}
      {currentEvent && currentEvent.status === 'active' && (
        <Card sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <CardContent sx={{ pb: 1 }}>
            <Typography variant="h6" gutterBottom>
              Caption History ({currentEvent.name})
            </Typography>
            <Typography variant="caption" color="textSecondary">
              {captions.length} captions saved to database
            </Typography>
          </CardContent>
          <Box 
            sx={{ 
              flex: 1, 
              overflow: 'auto', 
              px: 2, 
              pb: 2,
              display: 'flex',
              flexDirection: 'column',
              gap: 1
            }}
          >
            {captions.length === 0 ? (
              <Alert severity="info">
                No captions saved yet. Start recording to see live captions here.
              </Alert>
            ) : (
              captions.map((caption, index) => (
                <Card key={index} variant="outlined" sx={{ '&:hover': { boxShadow: 2 } }}>
                  <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                      <Typography variant="caption" color="textSecondary">
                        #{index + 1} • {moment(caption.timestamp).format('HH:mm:ss')}
                      </Typography>
                      <Box display="flex" gap={1}>
                        <Chip
                          label={caption.speaker || 'User'}
                          size="small"
                          variant="outlined"
                          color="primary"
                        />
                        {caption.confidence && (
                          <Chip
                            label={`${Math.round((caption.confidence || 0) * 100)}%`}
                            size="small"
                            color="success"
                          />
                        )}
                      </Box>
                    </Box>
                    <Typography variant="body1" sx={{ wordBreak: 'break-word' }}>
                      {caption.text}
                    </Typography>
                  </CardContent>
                </Card>
              ))
            )}
            <div ref={captionsEndRef} />
          </Box>
        </Card>
      )}

      {/* Stop Event Confirmation Dialog */}
      <Dialog open={showStopDialog} onClose={() => setShowStopDialog(false)}>
        <DialogTitle>Stop Event Recording?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to stop the event "{currentEvent?.name}"?
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            • Speech recording will stop immediately
            • All {captions.length} captions will be saved
            • Event status will change to "completed"
            • You'll be redirected to the Dashboard
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setShowStopDialog(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleStopEvent}
            variant="contained"
            color="error"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} /> : <Stop />}
          >
            {loading ? 'Stopping...' : 'Stop Event'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.7; }
          100% { opacity: 1; }
        }
      `}</style>
    </Box>
  );
};

export default LiveCaption;
