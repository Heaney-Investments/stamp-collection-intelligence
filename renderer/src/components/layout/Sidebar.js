import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAppContext, selectors } from '../../context/AppContext';
import './Sidebar.css';

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { state } = useAppContext();
  const stats = selectors.getStampStats(state);

  const menuItems = [
    {
      path: '/dashboard',
      icon: '📊',
      label: 'Dashboard',
      badge: null
    },
    {
      path: '/upload',
      icon: '📤',
      label: 'Upload Stamps',
      badge: null
    },
    {
      path: '/collection',
      icon: '📂',
      label: 'My Collection',
      badge: stats.total > 0 ? stats.total : null
    },
    {
      path: '/market',
      icon: '📈',
      label: 'Market Research',
      badge: null
    },
    {
      path: '/settings',
      icon: '⚙️',
      label: 'Settings',
      badge: null
    }
  ];

  const isActivePath = (path) => {
    return location.pathname === path;
  };

  return (
    <>
      {isOpen && <div className="sidebar-backdrop" onClick={onClose} />}
      
      <aside className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <h2 className="sidebar-title">Menu</h2>
          <button className="close-button" onClick={onClose} aria-label="Close sidebar">
            ✕
          </button>
        </div>

        <nav className="sidebar-nav">
          <ul className="nav-list">
            {menuItems.map((item) => (
              <li key={item.path} className="nav-item">
                <Link
                  to={item.path}
                  className={`nav-link ${isActivePath(item.path) ? 'active' : ''}`}
                  onClick={onClose}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-label">{item.label}</span>
                  {item.badge && (
                    <span className="nav-badge">{item.badge}</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="sidebar-stats">
          <h3 className="stats-title">Quick Stats</h3>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-value">{stats.total}</span>
              <span className="stat-label">Total Stamps</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{stats.completed}</span>
              <span className="stat-label">Processed</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">${stats.totalValue.toFixed(2)}</span>
              <span className="stat-label">Total Value</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{stats.pending}</span>
              <span className="stat-label">Pending</span>
            </div>
          </div>
        </div>

        <div className="sidebar-footer">
          <div className="processing-status">
            {stats.processing > 0 && (
              <div className="processing-indicator">
                <span className="spinner"></span>
                <span className="processing-text">
                  Processing {stats.processing} stamp{stats.processing !== 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
