import { useState, useEffect, useCallback, useRef } from 'react';
import SpeechRecognition, { useSpeechRecognition as useReactSpeechRecognition } from 'react-speech-recognition';
import { useCaptionContext } from '../contexts/CaptionContext';
import { useSettings } from '../contexts/SettingsContext';

export const useSpeechRecognition = () => {
  const { sendCaption, dispatch, currentEvent } = useCaptionContext();
  const { settings } = useSettings();
  const [isSupported, setIsSupported] = useState(true);
  
  // Enhanced duplicate prevention
  const savedCaptions = useRef(new Set()); // Track all saved captions
  const lastProcessedTranscript = useRef('');
  const processingTimeout = useRef(null);
  const isProcessing = useRef(false);
  
  const {
    transcript,
    interimTranscript,
    finalTranscript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition
  } = useReactSpeechRecognition();

  useEffect(() => {
    setIsSupported(browserSupportsSpeechRecognition);
  }, [browserSupportsSpeechRecognition]);

  // Enhanced final transcript handler with complete duplicate prevention
  useEffect(() => {
    if (!finalTranscript || 
        !currentEvent || 
        currentEvent.status !== 'active' || 
        isProcessing.current) {
      return;
    }

    const trimmedText = finalTranscript.trim();
    
    // Skip empty or very short captions
    if (!trimmedText || trimmedText.length < 3) {
      return;
    }

    // Normalize text for comparison (remove extra spaces, convert to lowercase)
    const normalizedText = trimmedText.replace(/\s+/g, ' ').toLowerCase();
    
    // Check if we've already saved this exact caption
    if (savedCaptions.current.has(normalizedText)) {
      console.log('⏭️ Skipping exact duplicate:', trimmedText);
      return;
    }

    // Check if this is the same as the last processed transcript
    if (normalizedText === lastProcessedTranscript.current) {
      console.log('⏭️ Skipping repeat transcript:', trimmedText);
      return;
    }

    // Check for similarity with recent captions (prevent near-duplicates)
    const recentCaptions = Array.from(savedCaptions.current).slice(-3); // Check last 3 captions
    const isSimilar = recentCaptions.some(recentCaption => {
      return calculateSimilarity(normalizedText, recentCaption) > 0.8; // 80% similarity threshold
    });

    if (isSimilar) {
      console.log('⏭️ Skipping similar caption:', trimmedText);
      return;
    }

    // Set processing flag
    isProcessing.current = true;
    lastProcessedTranscript.current = normalizedText;

    console.log('💾 Processing unique caption:', trimmedText);

    const caption = {
      text: trimmedText,
      timestamp: new Date().toISOString(),
      confidence: 0.9,
      speaker: 'Current User',
      provider: 'webSpeech',
      language: settings?.language || 'en-US'
    };

    // Save to database
    sendCaption(caption);
    
    // Add to our tracking set
    savedCaptions.current.add(normalizedText);
    
    // Limit the size of our tracking set (keep last 50 captions)
    if (savedCaptions.current.size > 50) {
      const captionsArray = Array.from(savedCaptions.current);
      savedCaptions.current = new Set(captionsArray.slice(-50));
    }

    dispatch({ type: 'SET_TRANSCRIPT', payload: trimmedText });

    // Clear processing timeout if exists
    if (processingTimeout.current) {
      clearTimeout(processingTimeout.current);
    }

    // Reset processing flag after delay
    processingTimeout.current = setTimeout(() => {
      isProcessing.current = false;
      lastProcessedTranscript.current = '';
    }, 3000); // 3 second cooldown

    console.log('✅ Caption saved and tracked. Total unique captions:', savedCaptions.current.size);

  }, [finalTranscript, sendCaption, dispatch, currentEvent, settings?.language]);

  // Calculate text similarity (simple implementation)
  const calculateSimilarity = (text1, text2) => {
    const words1 = text1.split(' ');
    const words2 = text2.split(' ');
    const maxLength = Math.max(words1.length, words2.length);
    
    if (maxLength === 0) return 1;
    
    let commonWords = 0;
    words1.forEach(word => {
      if (words2.includes(word)) {
        commonWords++;
      }
    });
    
    return commonWords / maxLength;
  };

  // Handle interim results for live display only
  useEffect(() => {
    if (interimTranscript && settings?.interimResults && !isProcessing.current) {
      dispatch({ type: 'SET_TRANSCRIPT', payload: interimTranscript });
    }
  }, [interimTranscript, settings?.interimResults, dispatch]);

  const startListening = useCallback(() => {
    if (isSupported) {
      // Reset all tracking when starting new session
      savedCaptions.current.clear();
      lastProcessedTranscript.current = '';
      isProcessing.current = false;
      
      if (processingTimeout.current) {
        clearTimeout(processingTimeout.current);
      }
      
      resetTranscript();
      SpeechRecognition.startListening({
        continuous: true,
        language: settings?.language || 'en-US',
        interimResults: true
      });
      dispatch({ type: 'SET_RECORDING', payload: true });
      console.log('🎤 Started listening with complete tracking reset');
    }
  }, [isSupported, settings?.language, resetTranscript, dispatch]);

  const stopListening = useCallback(() => {
    SpeechRecognition.stopListening();
    dispatch({ type: 'SET_RECORDING', payload: false });
    
    // Clear processing timeout
    if (processingTimeout.current) {
      clearTimeout(processingTimeout.current);
    }
    
    // Reset processing state after stopping
    setTimeout(() => {
      isProcessing.current = false;
      lastProcessedTranscript.current = '';
    }, 1000);
    
    console.log('🛑 Stopped listening');
  }, [dispatch]);

  const forceStopListening = useCallback(() => {
    return new Promise((resolve) => {
      SpeechRecognition.abortListening();
      dispatch({ type: 'SET_RECORDING', payload: false });
      
      // Clear all timeouts and reset state
      if (processingTimeout.current) {
        clearTimeout(processingTimeout.current);
      }
      
      isProcessing.current = false;
      lastProcessedTranscript.current = '';
      
      console.log('🚫 Force stopped listening with complete cleanup');
      setTimeout(resolve, 500);
    });
  }, [dispatch]);

  // Reset tracking when event changes
  useEffect(() => {
    if (currentEvent) {
      console.log('🔄 Event changed, clearing caption tracking');
      savedCaptions.current.clear();
      lastProcessedTranscript.current = '';
      isProcessing.current = false;
    }
  }, [currentEvent?._id]);

  return {
    transcript,
    interimTranscript,
    finalTranscript,
    listening,
    isSupported,
    startListening,
    stopListening,
    forceStopListening,
    resetTranscript
  };
};
