import React, { useState } from 'react';
import './Navbar.css';

const Navbar = ({ activeSection, setActiveSection }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navItems = [
    { id: 'today', label: "Today's Count", icon: '📊' },
    { id: 'hunting', label: 'Hunting Data', icon: '🎯' },
    { id: 'credentials', label: 'Credentials', icon: '🔐' }
  ];

  return (
    <nav className={`navbar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="navbar-header">
        <h2 className="navbar-title">
          {isCollapsed ? '🤖' : '🤖 Bid Scraper'}
        </h2>
        <button 
          className="collapse-btn"
          onClick={() => setIsCollapsed(!isCollapsed)}
          title={isCollapsed ? 'Expand' : 'Collapse'}
        >
          {isCollapsed ? '▶' : '◀'}
        </button>
      </div>
      
      <ul className="navbar-menu">
        {navItems.map((item) => (
          <li key={item.id} className="navbar-item">
            <button
              className={`navbar-link ${activeSection === item.id ? 'active' : ''}`}
              onClick={() => setActiveSection(item.id)}
              title={item.label}
            >
              <span className="navbar-icon">{item.icon}</span>
              {!isCollapsed && <span className="navbar-text">{item.label}</span>}
            </button>
          </li>
        ))}
      </ul>
      
      <div className="navbar-footer">
        <div className="status-indicator">
          <span className="status-dot active"></span>
          {!isCollapsed && <span className="status-text">Active</span>}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;