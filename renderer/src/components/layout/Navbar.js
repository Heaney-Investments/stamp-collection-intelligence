import React from 'react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import './Navbar.css';

const Navbar = () => {
  const { state } = useAppContext();
  const { user } = state;

  return (
    <nav className="navbar">
      <Link to="/dashboard" className="navbar-brand">
        <span className="navbar-brand-icon">🔍</span>
        <span>Stamp Collection</span>
      </Link>
      
      <div className="navbar-center">
        <div className="navbar-search">
          <input
            type="text"
            className="navbar-search-input"
            placeholder="Search collections, categories, stamps..."
          />
          <span className="navbar-search-icon">🔍</span>
        </div>
      </div>

      <div className="navbar-actions">
        <Link to="/upload" className="navbar-nav-link">
          Upload
        </Link>
        <div className="navbar-profile">
          <span className="navbar-avatar">{user.name ? user.name[0] : 'U'}</span>
          <span>{user.name || 'User'}</span>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
