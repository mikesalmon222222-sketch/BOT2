import React, { useState } from 'react';
import './Navbar.css';

const Navbar = ({ activeSection, onSectionChange }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const sections = [
    { id: 'today', label: "Today's Count", icon: '📊' },
    { id: 'hunting', label: 'Hunting Data', icon: '🎯' },
    { id: 'credentials', label: 'Credentials', icon: '🔐' }
  ];

  return (
    <nav className={`navbar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="navbar-header">
        <h2 className="navbar-title">
          {isCollapsed ? 'BS' : 'Bid Scraper'}
        </h2>
        <button 
          className="collapse-btn"
          onClick={() => setIsCollapsed(!isCollapsed)}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? '→' : '←'}
        </button>
      </div>
      
      <ul className="navbar-nav">
        {sections.map((section) => (
          <li key={section.id} className="nav-item">
            <button
              className={`nav-link ${activeSection === section.id ? 'active' : ''}`}
              onClick={() => onSectionChange(section.id)}
              title={section.label}
            >
              <span className="nav-icon">{section.icon}</span>
              {!isCollapsed && <span className="nav-label">{section.label}</span>}
            </button>
          </li>
        ))}
      </ul>
      
      <div className="navbar-footer">
        <div className="auto-refresh-indicator">
          {!isCollapsed && (
            <>
              <span className="indicator-dot"></span>
              <span className="indicator-text">Auto-refresh active</span>
            </>
          )}
          {isCollapsed && <span className="indicator-dot" title="Auto-refresh active"></span>}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;