import { useEffect, useRef, useState } from 'react';
import { useCaptionContext } from '../contexts/CaptionContext';

export const useWebSocket = (url = 'ws://localhost:5000') => {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const socketRef = useRef(null);
  const { dispatch } = useCaptionContext();

  useEffect(() => {
    const connect = () => {
      try {
        socketRef.current = new WebSocket(url);

        socketRef.current.onopen = () => {
          setIsConnected(true);
          setError(null);
          dispatch({ type: 'SET_CONNECTED', payload: true });
        };

        socketRef.current.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            if (data.type === 'caption') {
              dispatch({ type: 'ADD_CAPTION', payload: data.payload });
            } else if (data.type === 'transcript') {
              dispatch({ type: 'SET_TRANSCRIPT', payload: data.payload });
            } else if (data.type === 'error') {
              dispatch({ type: 'SET_ERROR', payload: data.payload });
            }
          } catch (err) {
            console.error('Failed to parse WebSocket message:', err);
          }
        };

        socketRef.current.onclose = () => {
          setIsConnected(false);
          dispatch({ type: 'SET_CONNECTED', payload: false });
          
          // Attempt to reconnect after 3 seconds
          setTimeout(connect, 3000);
        };

        socketRef.current.onerror = (error) => {
          setError(error);
          dispatch({ type: 'SET_ERROR', payload: error.message });
        };
      } catch (err) {
        setError(err);
        setTimeout(connect, 3000);
      }
    };

    connect();

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [url, dispatch]);

  const sendMessage = (message) => {
    if (socketRef.current && isConnected) {
      socketRef.current.send(JSON.stringify(message));
    }
  };

  const sendAudioData = (audioData) => {
    if (socketRef.current && isConnected) {
      socketRef.current.send(audioData);
    }
  };

  return {
    isConnected,
    error,
    sendMessage,
    sendAudioData
  };
};
