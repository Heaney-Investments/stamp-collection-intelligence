import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Components
import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';
import Dashboard from './components/pages/Dashboard';
import StampUpload from './components/pages/StampUpload';
import LoadingSpinner from './components/common/LoadingSpinner';
import DatabaseSearch from './components/common/DatabaseSearch';

// Services
import { apiService } from './services/apiService';

// Context
import { AppProvider, useAppContext } from './context/AppContext';

function AppContent() {
  const { state, dispatch } = useAppContext();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      setLoading(true);
      
      // Check server health
      const healthCheck = await apiService.healthCheck();
      if (healthCheck.status !== 'ok') {
        throw new Error('Server is not responding');
      }

      // Load initial stamps
      const stampsResponse = await apiService.getStamps({ limit: 20 });
      dispatch({
        type: 'SET_STAMPS',
        payload: stampsResponse.stamps || []
      });

      console.log('Application loaded successfully');
    } catch (error) {
      console.error('Failed to initialize app:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  if (loading) {
    return (
      <div className="app-loading">
        <LoadingSpinner size="large" />
        <p>Loading Stamp Collection App...</p>
      </div>
    );
  }

  return (
    <div className="app">
      <Navbar />
      
      <div className="app-container">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        <main className={`main-content ${sidebarOpen ? 'sidebar-open' : ''}`}>
          <DatabaseSearch />
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/upload" element={<StampUpload />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <Router>
        <AppContent />
      </Router>
    </AppProvider>
  );
}

export default App;
