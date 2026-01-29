import React from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  IconButton, 
  Box,
  Chip
} from '@mui/material';
import { 
  Mic, 
  MicOff, 
  Settings as SettingsIcon
} from '@mui/icons-material';
import { useCaptionContext } from '../../contexts/CaptionContext';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import './Header.css';

const Header = () => {
  const { isRecording, isConnected, currentEvent } = useCaptionContext();
  const { 
    startListening, 
    stopListening, 
    isSupported,
    listening
  } = useSpeechRecognition();

  const handleMicToggle = () => {
    if (listening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <AppBar position="static" className="header">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          LiveSpeak - AI Captioning
        </Typography>
        
        <Box display="flex" alignItems="center" gap={2}>
          {/* Connection Status */}
          <Chip
            label={isConnected ? 'Connected' : 'Offline'}
            color={isConnected ? 'success' : 'default'}
            size="small"
          />

          {/* Current Event */}
          {currentEvent && (
            <Chip 
              label={`📅 ${currentEvent.name}`}
              color="primary"
              size="small"
            />
          )}

          {/* Recording Status */}
          {listening && (
            <Chip 
              label="🎤 Recording"
              color="secondary"
              size="small"
              className="pulse-animation"
            />
          )}
          
          {/* Microphone Button */}
          {isSupported && (
            <IconButton
              color="inherit"
              onClick={handleMicToggle}
              className={`mic-button ${listening ? 'recording' : ''}`}
            >
              {listening ? <MicOff /> : <Mic />}
            </IconButton>
          )}
          
          <IconButton color="inherit">
            <SettingsIcon />
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
