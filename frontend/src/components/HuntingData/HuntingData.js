import React, { useState } from 'react';
import { useBids, useRefreshBids, useDeleteBid } from '../../hooks/useBids';
import { testSeptaScraper } from '../../services/api';
import Pagination from '../Pagination/Pagination';
import './HuntingData.css';

const HuntingData = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [testingScaper, setTestingScraper] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const limit = 10; // Items per page
  
  const { data: bidsData, isLoading, error } = useBids(currentPage, limit, sortField, sortOrder);
  const refreshMutation = useRefreshBids();
  const deleteMutation = useDeleteBid();

  const bids = bidsData?.data || [];
  const pagination = {
    currentPage: bidsData?.page || 1,
    totalPages: bidsData?.pages || 1,
    total: bidsData?.total || 0,
    count: bidsData?.count || 0
  };

  const handleSort = (field) => {
    if (field === sortField) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
    setCurrentPage(1); // Reset to first page when sorting
  };

  const handleRefresh = async () => {
    try {
      await refreshMutation.mutateAsync();
    } catch (error) {
      console.error('Failed to refresh bids:', error);
    }
  };

  const handleTestScraper = async () => {
    try {
      setTestingScraper(true);
      setTestResult(null);
      const response = await testSeptaScraper();
      setTestResult({
        success: response.success,
        message: response.message,
        details: response.success 
          ? `Found ${response.results?.bidsFound || 0} bids using ${response.testCredentials?.username}@${response.testCredentials?.portal}`
          : response.error
      });
      
      // Refresh bids after test to show any new data
      if (response.success) {
        setTimeout(() => {
          handleRefresh();
        }, 1000);
      }
    } catch (error) {
      console.error('Failed to test scraper:', error);
      setTestResult({
        success: false,
        message: 'Test failed',
        details: error.message
      });
    } finally {
      setTestingScraper(false);
    }
  };

  const handleDeleteClick = (bid) => {
    setDeleteConfirm(bid);
  };

  const handleDeleteConfirm = async () => {
    if (deleteConfirm) {
      try {
        await deleteMutation.mutateAsync(deleteConfirm.id);
        setDeleteConfirm(null);
      } catch (error) {
        console.error('Failed to delete bid:', error);
      }
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirm(null);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const formatExpiration = (dateString) => {
    if (!dateString) return 'N/A';
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
    if (!dateString) return 'normal';
    const date = new Date(dateString);
    const now = new Date();
    const diff = date - now;
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    
    if (days < 0) return 'expired';
    if (days <= 3) return 'urgent';
    if (days <= 7) return 'warning';
    return 'normal';
  };

  const formatLastRefresh = (timestamp) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  // Filter bids client-side for search functionality
  const filteredBids = bids.filter(bid => 
    bid.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bid.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bid.portal.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="hunting-data">
      <div className="hunting-header">
        <div className="title-section">
          <h2>Hunting Data</h2>
          <div className="data-info">
            <span className="bid-count">{filteredBids.length} of {pagination.total} bids</span>
            <span className="last-refresh">Last refresh: {formatLastRefresh(new Date())}</span>
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
            className={`refresh-btn ${isLoading || refreshMutation.isPending ? 'loading' : ''}`}
            onClick={handleRefresh}
            disabled={isLoading || refreshMutation.isPending}
          >
            {isLoading || refreshMutation.isPending ? '⏳' : '🔄'} Refresh
          </button>
          
          <button 
            className={`test-scraper-btn ${testingScaper ? 'loading' : ''}`}
            onClick={handleTestScraper}
            disabled={testingScaper}
            title="Test SEPTA scraper with JoeRoot/Quan999999 credentials"
          >
            {testingScaper ? '⏳' : '🧪'} Test SEPTA Scraper
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {testResult && (
        <div className={`test-result ${testResult.success ? 'success' : 'error'}`}>
          <span className="result-icon">{testResult.success ? '✅' : '❌'}</span>
          <div className="result-content">
            <strong>{testResult.message}</strong>
            <p>{testResult.details}</p>
          </div>
          <button className="close-result" onClick={() => setTestResult(null)}>✕</button>
        </div>
      )}

      <div className="table-container">
        {isLoading && bids.length === 0 ? (
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
                : error 
                  ? 'Unable to connect to server. Please check if the backend is running and database is connected.'
                  : 'No portals configured. Please add a portal in Credentials to start collecting bid data.'
              }
            </p>
          </div>
        ) : (
          <table className="bids-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('postedDate')} className="sortable">
                  Posted Date {sortField === 'postedDate' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('title')} className="sortable">
                  Title {sortField === 'title' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('dueDate')} className="sortable">
                  Due Date {sortField === 'dueDate' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('quantity')} className="sortable">
                  Quantity {sortField === 'quantity' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th>Description</th>
                <th>Documents</th>
                <th>Bid Link</th>
                <th onClick={() => handleSort('portal')} className="sortable">
                  Portal {sortField === 'portal' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBids.map((bid) => (
                <tr key={bid.id || bid._id}>
                  <td className="date-cell">
                    {formatDate(bid.postedDate || bid.timestamp)}
                  </td>
                  <td className="title-cell">
                    <span className="bid-title" title={bid.title}>
                      {bid.title}
                    </span>
                  </td>
                  <td className={`date-cell ${getExpirationClass(bid.dueDate || bid.expirationDate)}`}>
                    <span className="due-date" title={formatDate(bid.dueDate || bid.expirationDate)}>
                      {formatExpiration(bid.dueDate || bid.expirationDate)}
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
                  <td className="bid-link-cell">
                    {bid.bidLink ? (
                      <a 
                        href={bid.bidLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bid-link"
                        title="View original solicitation"
                      >
                        🔗 View Bid
                      </a>
                    ) : (
                      <span className="no-link">No link</span>
                    )}
                  </td>
                  <td className="portal-cell">
                    <span className="portal-badge">{bid.portal}</span>
                  </td>
                  <td className="actions-cell">
                    <button
                      className="delete-btn"
                      onClick={() => handleDeleteClick(bid)}
                      title="Delete this bid"
                      disabled={deleteMutation.isPending}
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        
        {/* Pagination */}
        {filteredBids.length > 0 && (
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            onPageChange={setCurrentPage}
            itemsPerPage={limit}
            totalItems={pagination.total}
          />
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteConfirm && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Confirm Delete</h3>
            <p>Are you sure you want to delete the bid "{deleteConfirm.title}"?</p>
            <p className="warning">This action cannot be undone.</p>
            <div className="modal-actions">
              <button 
                className="cancel-btn" 
                onClick={handleDeleteCancel}
                disabled={deleteMutation.isPending}
              >
                Cancel
              </button>
              <button 
                className="delete-confirm-btn" 
                onClick={handleDeleteConfirm}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Messages */}
      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          <span>Unable to connect to server. Please check if the backend is running.</span>
        </div>
      )}
    </div>
  );
};

export default HuntingData;