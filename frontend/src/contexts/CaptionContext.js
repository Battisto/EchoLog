import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { io } from 'socket.io-client';
import apiService from '../services/apiService';
import { toast } from 'react-hot-toast';

const CaptionContext = createContext();

const initialState = {
  captions: [],
  currentEvent: null,
  isRecording: false,
  isConnected: false,
  socket: null,
  transcript: '',
  confidence: 0,
  speaker: 'Unknown',
  error: null,
  loading: false
};

const captionReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_SOCKET':
      return { ...state, socket: action.payload };
    case 'SET_CONNECTED':
      return { ...state, isConnected: action.payload };
    case 'ADD_CAPTION':
      return {
        ...state,
        captions: [...state.captions, action.payload],
        transcript: action.payload.text
      };
    case 'SET_CAPTIONS':
      return { ...state, captions: action.payload };
    case 'SET_RECORDING':
      return { ...state, isRecording: action.payload };
    case 'SET_TRANSCRIPT':
      return { ...state, transcript: action.payload };
    case 'SET_CONFIDENCE':
      return { ...state, confidence: action.payload };
    case 'SET_SPEAKER':
      return { ...state, speaker: action.payload };
    case 'SET_CURRENT_EVENT':
      return { ...state, currentEvent: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'CLEAR_CAPTIONS':
      return { ...state, captions: [], transcript: '' };
    default:
      return state;
  }
};

export const CaptionProvider = ({ children }) => {
  const [state, dispatch] = useReducer(captionReducer, initialState);

  useEffect(() => {
    const socket = io('http://localhost:5000', {
      transports: ['websocket'],
      autoConnect: true
    });

    dispatch({ type: 'SET_SOCKET', payload: socket });

    socket.on('connect', () => {
      dispatch({ type: 'SET_CONNECTED', payload: true });
      console.log('Connected to server:', socket.id);
    });

    socket.on('disconnect', () => {
      dispatch({ type: 'SET_CONNECTED', payload: false });
      console.log('Disconnected from server');
    });

    socket.on('caption_received', (data) => {
      dispatch({ type: 'ADD_CAPTION', payload: data });
    });

    socket.on('recording_status_update', (data) => {
      dispatch({ type: 'SET_RECORDING', payload: data.isRecording });
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Load event captions when current event changes
  useEffect(() => {
    if (state.socket && state.currentEvent && state.currentEvent._id) {
      const eventId = state.currentEvent._id;
      state.socket.emit('join_event', eventId);
      loadEventCaptions(eventId);
      console.log('📋 Joined event room and loading captions for:', state.currentEvent.name);
    }
  }, [state.socket, state.currentEvent?._id]);

  const loadEventCaptions = async (eventId) => {
    if (!eventId) return;
    
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      console.log('📥 Loading captions for event ID:', eventId);
      
      const response = await apiService.captions.getByEvent(eventId);
      const captions = response.data.captions || [];
      
      dispatch({ type: 'SET_CAPTIONS', payload: captions });
      console.log(`✅ Loaded ${captions.length} captions for event:`, eventId);
      
    } catch (error) {
      console.error('❌ Error loading captions:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const sendCaption = async (caption) => {
    if (!state.currentEvent || !state.currentEvent._id) {
      console.log('❌ No current event - caption not saved');
      return;
    }

    const eventId = state.currentEvent._id;
    console.log('💾 Saving caption to event:', state.currentEvent.name, '| Event ID:', eventId);

    try {
      const captionData = {
        ...caption,
        eventId: eventId, // Ensure correct event ID
        timestamp: new Date().toISOString()
      };

      console.log('📤 Caption data being sent:', {
        text: captionData.text,
        eventId: captionData.eventId,
        eventName: state.currentEvent.name
      });

      // Save to database via API
      const response = await apiService.captions.create(captionData);
      
      console.log('✅ Caption saved successfully:', {
        captionId: response.data.caption._id,
        eventId: response.data.caption.eventId,
        text: response.data.caption.text
      });
      
      // Add to local state immediately
      dispatch({ type: 'ADD_CAPTION', payload: response.data.caption });

      // Emit to socket for real-time updates to other clients
      if (state.socket) {
        state.socket.emit('new_caption', response.data.caption);
      }

    } catch (error) {
      console.error('❌ Error saving caption:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
      toast.error('Failed to save caption to database');
    }
  };

  const clearCaptions = () => {
    dispatch({ type: 'CLEAR_CAPTIONS' });
  };

  const setCurrentEvent = (event) => {
    console.log('🎯 Setting current event:', event?.name, '| ID:', event?._id);
    dispatch({ type: 'SET_CURRENT_EVENT', payload: event });
  };

  return (
    <CaptionContext.Provider value={{
      ...state,
      dispatch,
      sendCaption,
      clearCaptions,
      setCurrentEvent,
      loadEventCaptions
    }}>
      {children}
    </CaptionContext.Provider>
  );
};

export const useCaptionContext = () => {
  const context = useContext(CaptionContext);
  if (!context) {
    throw new Error('useCaptionContext must be used within a CaptionProvider');
  }
  return context;
};
