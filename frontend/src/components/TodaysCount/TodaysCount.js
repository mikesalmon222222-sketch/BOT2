import React from 'react';
import { useApp } from '../../context/AppContext';
import './TodaysCount.css';

const TodaysCount = () => {
  const { todaysCount, lastRefresh, loading } = useApp();

  const formatLastRefresh = (timestamp) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  return (
    <div className="todays-count">
      <h3>Today's Count</h3>
      <div className="count-display">
        <div className="count-number">
          {loading ? '...' : todaysCount}
        </div>
        <div className="count-label">Bids Today</div>
      </div>
      <div className="last-refresh">
        Last updated: {formatLastRefresh(lastRefresh)}
      </div>
      <div className="auto-refresh-info">
        <small>Auto-refreshes every 15 minutes</small>
      </div>
    </div>
  );
};

export default TodaysCount;