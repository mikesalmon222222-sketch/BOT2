import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import './HuntingData.css';

const HuntingData = () => {
  const { bids, loading, error, handleRefresh, lastRefresh } = useApp();
  const [sortField, setSortField] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [searchTerm, setSearchTerm] = useState('');

  const handleSort = (field) => {
    if (field === sortField) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const formatExpiration = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = date - now;
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    
    if (days < 0) return 'Expired';
    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    return `${days} days`;
  };

  const getExpirationClass = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = date - now;
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    
    if (days < 0) return 'expired';
    if (days <= 3) return 'urgent';
    if (days <= 7) return 'warning';
    return 'normal';
  };

  // Filter and sort bids
  const filteredBids = bids
    .filter(bid => 
      bid.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bid.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bid.portal.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];
      
      if (sortField === 'createdAt' || sortField === 'timestamp' || sortField === 'expirationDate') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const formatLastRefresh = (timestamp) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  return (
    <div className="hunting-data">
      <div className="hunting-header">
        <div className="title-section">
          <h2>Hunting Data</h2>
          <div className="data-info">
            <span className="bid-count">{filteredBids.length} bids</span>
            <span className="last-refresh">Last refresh: {formatLastRefresh(lastRefresh)}</span>
          </div>
        </div>
        
        <div className="controls">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search bids..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <span className="search-icon">🔍</span>
          </div>
          
          <button 
            className={`refresh-btn ${loading ? 'loading' : ''}`}
            onClick={handleRefresh}
            disabled={loading}
          >
            {loading ? '⏳' : '🔄'} Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      <div className="table-container">
        {loading && bids.length === 0 ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading bid data...</p>
          </div>
        ) : filteredBids.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">📋</span>
            <h3>No bids found</h3>
            <p>
              {searchTerm 
                ? `No bids match "${searchTerm}". Try a different search term.`
                : 'No bids have been scraped yet. Click refresh to get the latest data.'
              }
            </p>
          </div>
        ) : (
          <table className="bids-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('timestamp')} className="sortable">
                  Timestamp {sortField === 'timestamp' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('title')} className="sortable">
                  Title {sortField === 'title' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('expirationDate')} className="sortable">
                  Expiration {sortField === 'expirationDate' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('quantity')} className="sortable">
                  Quantity {sortField === 'quantity' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th>Description</th>
                <th>Documents</th>
                <th onClick={() => handleSort('portal')} className="sortable">
                  Portal {sortField === 'portal' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredBids.map((bid) => (
                <tr key={bid.id || bid._id}>
                  <td className="timestamp-cell">
                    {formatDate(bid.timestamp)}
                  </td>
                  <td className="title-cell">
                    <span className="bid-title" title={bid.title}>
                      {bid.title}
                    </span>
                  </td>
                  <td className={`expiration-cell ${getExpirationClass(bid.expirationDate)}`}>
                    <span className="expiration-date" title={formatDate(bid.expirationDate)}>
                      {formatExpiration(bid.expirationDate)}
                    </span>
                  </td>
                  <td className="quantity-cell">
                    {bid.quantity}
                  </td>
                  <td className="description-cell">
                    <span className="bid-description" title={bid.description}>
                      {bid.description.length > 100 
                        ? bid.description.substring(0, 100) + '...'
                        : bid.description
                      }
                    </span>
                  </td>
                  <td className="documents-cell">
                    {bid.documents && bid.documents.length > 0 ? (
                      <div className="documents-list">
                        {bid.documents.map((doc, index) => (
                          <a 
                            key={index}
                            href={doc}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="document-link"
                            title={doc}
                          >
                            📄 Doc {index + 1}
                          </a>
                        ))}
                      </div>
                    ) : (
                      <span className="no-docs">No documents</span>
                    )}
                  </td>
                  <td className="portal-cell">
                    <span className="portal-badge">{bid.portal}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default HuntingData;