import React from 'react';
import { useApp } from '../../context/AppContext';
import './HuntingData.css';

const HuntingData = () => {
  const { bids, loading, error, refreshBids } = useApp();

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const handleRefresh = async () => {
    await refreshBids();
  };

  if (loading) {
    return (
      <div className="hunting-data">
        <div className="section-header">
          <h3>Hunting Data</h3>
        </div>
        <div className="loading">Loading bids...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="hunting-data">
        <div className="section-header">
          <h3>Hunting Data</h3>
        </div>
        <div className="error">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="hunting-data">
      <div className="section-header">
        <h3>Hunting Data</h3>
        <button onClick={handleRefresh} className="refresh-btn" disabled={loading}>
          {loading ? 'Refreshing...' : 'Manual Refresh'}
        </button>
      </div>
      
      {bids.length === 0 ? (
        <div className="no-data">
          No bids found. Data will appear automatically when scraped.
        </div>
      ) : (
        <div className="table-container">
          <table className="bids-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Title</th>
                <th>Expiration Date</th>
                <th>Quantity</th>
                <th>Description</th>
                <th>Documents</th>
                <th>Portal</th>
              </tr>
            </thead>
            <tbody>
              {bids.map((bid) => (
                <tr key={bid._id}>
                  <td>{formatDate(bid.timestamp)}</td>
                  <td className="title-cell">{bid.title}</td>
                  <td>{formatDate(bid.expirationDate)}</td>
                  <td>{bid.quantity}</td>
                  <td className="description-cell">{bid.description}</td>
                  <td>
                    {bid.documents && bid.documents.length > 0 ? (
                      <div className="documents">
                        {bid.documents.map((doc, index) => (
                          <a 
                            key={index} 
                            href={doc} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="document-link"
                          >
                            Doc {index + 1}
                          </a>
                        ))}
                      </div>
                    ) : (
                      'No documents'
                    )}
                  </td>
                  <td>{bid.portal}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default HuntingData;