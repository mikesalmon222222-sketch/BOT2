import React from 'react';
import { useTodaysCount } from '../../hooks/useBids';
import './TodaysCount.css';

const TodaysCount = () => {
  const { data: countData, isLoading, error } = useTodaysCount();

  const todaysCount = countData?.data?.count || 0;

  const formatLastRefresh = (timestamp) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  return (
    <div className="todays-count">
      <div className="count-header">
        <h2>Today's Bid Count</h2>
        <div className="refresh-info">
          Last updated: {formatLastRefresh(new Date())}
        </div>
      </div>

      <div className="count-display">
        {isLoading ? (
          <div className="loading">
            <div className="spinner"></div>
            <span>Loading...</span>
          </div>
        ) : error ? (
          <div className="error">
            <span className="error-icon">⚠️</span>
            <div className="error-details">
              <span>Connection Error</span>
              <small>Unable to connect to database</small>
            </div>
          </div>
        ) : (
          <div className="count-value">
            <span className="count-number">{todaysCount}</span>
            <span className="count-label">Bids Scraped Today</span>
          </div>
        )}
      </div>

      <div className="count-stats">
        <div className="stat-item">
          <span className="stat-label">Status</span>
          <span className={`stat-value ${error ? 'error' : 'success'}`}>
            {error ? 'Error' : 'Active'}
          </span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Auto-refresh</span>
          <span className="stat-value success">Every 15 min</span>
        </div>
      </div>

      <div className="count-info">
        <p>
          📊 This counter shows the total number of bids scraped today from all configured portals.
        </p>
        <p>
          🔄 The data automatically refreshes every 15 minutes, and the counter updates in real-time.
        </p>
      </div>
    </div>
  );
};

export default TodaysCount;