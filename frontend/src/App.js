import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { CaptionProvider } from './contexts/CaptionContext';
import { SettingsProvider } from './contexts/SettingsContext';
import Header from './components/Common/Header';
import Sidebar from './components/Common/Sidebar';
import EventDashboard from './components/Dashboard/EventDashboard';
import EventHistory from './components/Dashboard/EventHistory'; // Add this import
import LiveCaption from './components/CaptionDisplay/LiveCaption';
import Settings from './components/Settings/Settings';
import './App.css';

function App() {
  return (
    <div className="App">
      <CaptionProvider>
        <SettingsProvider>
          <Router>
            <Header />
            <div className="app-container">
              <Sidebar />
              <main className="main-content">
                <Routes>
                  <Route path="/" element={<EventDashboard />} />
                  <Route path="/live" element={<LiveCaption />} />
                  <Route path="/history" element={<EventHistory />} /> {/* Add this route */}
                  <Route path="/settings" element={<Settings />} />
                </Routes>
              </main>
            </div>
            <Toaster position="top-right" />
          </Router>
        </SettingsProvider>
      </CaptionProvider>
    </div>
  );
}

export default App;
