import React, { createContext, useContext, useState, useEffect } from 'react';

const SettingsContext = createContext();

const defaultSettings = {
  language: 'en-US',
  fontSize: 24,
  fontFamily: 'Arial, sans-serif',
  textColor: '#ffffff',
  backgroundColor: '#000000',
  position: 'bottom',
  opacity: 0.9,
  maxWidth: '80%',
  showConfidence: true,
  showSpeaker: true,
  autoScroll: true,
  speechProvider: 'webSpeech',
  interimResults: true,
  continuous: true
};

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(defaultSettings);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('livespeak-settings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('livespeak-settings', JSON.stringify(settings));
  }, [settings]);

  const updateSettings = (newSettings) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    localStorage.removeItem('livespeak-settings');
  };

  return (
    <SettingsContext.Provider value={{
      settings,
      updateSettings,
      resetSettings
    }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
