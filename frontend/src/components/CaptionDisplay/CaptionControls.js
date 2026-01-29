import React from 'react';
import { Box, Button, IconButton, Tooltip, Chip } from '@mui/material';
import {
  Mic,
  MicOff,
  Stop,
  Clear,
  Download,
  Settings
} from '@mui/icons-material';
import { useCaptionContext } from '../../contexts/CaptionContext';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import { toast } from 'react-hot-toast';

const CaptionControls = () => {
  const { 
    isRecording, 
    captions, 
    clearCaptions,
    isConnected 
  } = useCaptionContext();
  
  const { 
    startListening, 
    stopListening, 
    abortListening,
    listening 
  } = useSpeechRecognition();

  const handleStartRecording = () => {
    startListening();
    toast.success('Recording started');
  };

  const handleStopRecording = () => {
    stopListening();
    toast.success('Recording stopped');
  };

  const handleAbortRecording = () => {
    abortListening();
    toast.error('Recording aborted');
  };

  const handleClearCaptions = () => {
    clearCaptions();
    toast.success('Captions cleared');
  };

  const handleDownloadCaptions = () => {
    if (captions.length === 0) {
      toast.error('No captions to download');
      return;
    }

    const captionText = captions.map((caption, index) => 
      `${index + 1}\n${caption.timestamp}\n${caption.text}\n`
    ).join('\n');

    const blob = new Blob([captionText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `captions-${new Date().toISOString().slice(0, 19)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Captions downloaded');
  };

  return (
    <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
      <Chip 
        label={isConnected ? 'Connected' : 'Disconnected'}
        color={isConnected ? 'success' : 'error'}
        size="small"
      />
      
      <Chip 
        label={`${captions.length} captions`}
        color="primary"
        size="small"
      />

      <Box display="flex" gap={1}>
        {!isRecording && !listening ? (
          <Tooltip title="Start Recording">
            <Button
              variant="contained"
              color="success"
              startIcon={<Mic />}
              onClick={handleStartRecording}
            >
              Start
            </Button>
          </Tooltip>
        ) : (
          <>
            <Tooltip title="Stop Recording">
              <Button
                variant="contained"
                color="warning"
                startIcon={<MicOff />}
                onClick={handleStopRecording}
              >
                Stop
              </Button>
            </Tooltip>
            
            <Tooltip title="Abort Recording">
              <IconButton
                color="error"
                onClick={handleAbortRecording}
              >
                <Stop />
              </IconButton>
            </Tooltip>
          </>
        )}

        <Tooltip title="Clear Captions">
          <IconButton
            onClick={handleClearCaptions}
            disabled={captions.length === 0}
          >
            <Clear />
          </IconButton>
        </Tooltip>

        <Tooltip title="Download Captions">
          <IconButton
            onClick={handleDownloadCaptions}
            disabled={captions.length === 0}
          >
            <Download />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
};

export default CaptionControls;
