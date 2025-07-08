import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAppContext, selectors } from '../../context/AppContext';
import { apiService } from '../../services/apiService';
import StampCard from '../common/StampCard';
import LoadingSpinner from '../common/LoadingSpinner';
import './Dashboard.css';

const Dashboard = () => {
  const { state, actions } = useAppContext();
  const { stamps, loading } = state;
  const stats = selectors.getStampStats(state);
  
  const [recentStamps, setRecentStamps] = useState([]);
  const [dashboardLoading, setDashboardLoading] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setDashboardLoading(true);
      
      // Get recent stamps (last 5)
      const recent = stamps.slice(0, 5);
      setRecentStamps(recent);
      
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setDashboardLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: '#fbbf24',
      processing: '#3b82f6',
      completed: '#10b981',
      failed: '#ef4444'
    };
    return colors[status] || '#6b7280';
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: '⏳',
      processing: '⚙️',
      completed: '✅',
      failed: '❌'
    };
    return icons[status] || '❓';
  };

  if (loading || dashboardLoading) {
    return (
      <div className="dashboard-loading">
        <LoadingSpinner size="large" />
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Dashboard</h1>
        <p className="dashboard-subtitle">
          Welcome back! Here's an overview of your stamp collection.
        </p>
      </div>

      {/* Stats Overview */}
      <div className="stats-overview">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📮</div>
            <div className="stat-content">
              <h3 className="stat-value">{stats.total}</h3>
              <p className="stat-label">Total Stamps</p>
            </div>
            <div className="stat-trend positive">
              <span className="trend-icon">↗️</span>
              <span className="trend-text">+12%</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">💰</div>
            <div className="stat-content">
              <h3 className="stat-value">${stats.totalValue.toFixed(2)}</h3>
              <p className="stat-label">Total Value</p>
            </div>
            <div className="stat-trend positive">
              <span className="trend-icon">↗️</span>
              <span className="trend-text">+8%</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <h3 className="stat-value">{stats.completed}</h3>
              <p className="stat-label">Processed</p>
            </div>
            <div className="stat-progress">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ 
                    width: `${stats.total > 0 ? (stats.completed / stats.total) * 100 : 0}%` 
                  }}
                />
              </div>
              <span className="progress-text">
                {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%
              </span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">⏳</div>
            <div className="stat-content">
              <h3 className="stat-value">{stats.pending}</h3>
              <p className="stat-label">Pending</p>
            </div>
            {stats.processing > 0 && (
              <div className="processing-indicator">
                <span className="spinner-small"></span>
                <span className="processing-text">{stats.processing} processing</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Processing Status */}
      {(stats.pending > 0 || stats.processing > 0) && (
        <div className="processing-status-section">
          <h2 className="section-title">Processing Status</h2>
          <div className="status-cards">
            {stats.pending > 0 && (
              <div className="status-card pending">
                <div className="status-header">
                  <span className="status-icon">⏳</span>
                  <h3>Pending Analysis</h3>
                </div>
                <p className="status-count">{stats.pending} stamps waiting for AI analysis</p>
                <Link to="/collection?status=pending" className="status-action">
                  View Pending →
                </Link>
              </div>
            )}
            
            {stats.processing > 0 && (
              <div className="status-card processing">
                <div className="status-header">
                  <span className="status-icon">⚙️</span>
                  <h3>Currently Processing</h3>
                </div>
                <p className="status-count">{stats.processing} stamps being analyzed</p>
                <div className="processing-animation">
                  <span className="spinner"></span>
                  <span>AI analysis in progress...</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recent Stamps */}
      <div className="recent-stamps-section">
        <div className="section-header">
          <h2 className="section-title">Recent Stamps</h2>
          <Link to="/collection" className="section-action">
            View All →
          </Link>
        </div>
        
        {recentStamps.length > 0 ? (
          <div className="stamps-grid">
            {recentStamps.map((stamp) => (
              <StampCard 
                key={stamp.stamp_uuid} 
                stamp={stamp} 
                compact={true}
              />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">📮</div>
            <h3>No stamps yet</h3>
            <p>Upload your first stamp to get started!</p>
            <Link to="/upload" className="cta-button">
              Upload Stamps
            </Link>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="quick-actions-section">
        <h2 className="section-title">Quick Actions</h2>
        <div className="actions-grid">
          <Link to="/upload" className="action-card upload">
            <div className="action-icon">📤</div>
            <h3>Upload Stamps</h3>
            <p>Add new stamps to your collection</p>
          </Link>
          
          <Link to="/market" className="action-card market">
            <div className="action-icon">📈</div>
            <h3>Market Research</h3>
            <p>Check current market values</p>
          </Link>
          
          <Link to="/settings" className="action-card settings">
            <div className="action-icon">⚙️</div>
            <h3>Settings</h3>
            <p>Configure API integrations</p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
