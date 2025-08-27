import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { createCredential, updateCredential, deleteCredential } from '../../services/api';
import './Credentials.css';

const Credentials = () => {
  const { credentials, setCredentials, addCredential, updateCredential: updateContextCredential, deleteCredential: deleteContextCredential, fetchCredentials } = useApp();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingCredential, setEditingCredential] = useState(null);
  const [formData, setFormData] = useState({
    portalName: '',
    url: '',
    username: '',
    password: '',
    isActive: true
  });

  useEffect(() => {
    // The context already fetches credentials on mount, but let's ensure we have the latest
    if (fetchCredentials) {
      fetchCredentials();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const resetForm = () => {
    setFormData({
      portalName: '',
      url: '',
      username: '',
      password: '',
      isActive: true
    });
    setEditingCredential(null);
    setShowForm(false);
    setError(null);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    setFormData(prev => {
      const updated = { ...prev, [name]: newValue };
      
      // Auto-fill URL and set defaults based on portal selection
      if (name === 'portalName') {
        if (value === 'Metro') {
          updated.url = 'https://business.metro.net/webcenter/portal/VendorPortal/pages_home/solicitations/openSolicitations';
          updated.username = '';
          updated.password = '';
        } else if (value === 'SEPTA') {
          updated.url = 'https://epsadmin.septa.org/vendor/requisitions/list/';
        }
      }
      
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.portalName) {
      setError('Portal selection is required');
      return;
    }

    // Portal-specific validation
    if (formData.portalName === 'SEPTA') {
      if (!formData.username || !formData.password) {
        setError('Username and password are required for SEPTA portal');
        return;
      }
    }

    try {
      setLoading(true);
      setError(null);

      if (editingCredential) {
        const response = await updateCredential(editingCredential._id, formData);
        updateContextCredential(response.data);
      } else {
        const response = await createCredential(formData);
        addCredential(response.data);
      }

      resetForm();
    } catch (error) {
      console.error('Credential submission error:', error);
      if (error.status === 400) {
        setError(error.data?.error || error.message);
      } else if (error.status === 503) {
        setError(error.data?.error || 'Database connection unavailable. Please try again later.');
      } else {
        setError(error.message || 'Failed to save credential');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (credential) => {
    setFormData({
      portalName: credential.portalName,
      url: credential.url,
      username: credential.username || '',
      password: '', // Don't pre-fill password for security
      isActive: credential.isActive
    });
    setEditingCredential(credential);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this credential?')) {
      return;
    }

    try {
      setLoading(true);
      await deleteCredential(id);
      deleteContextCredential(id);
    } catch (error) {
      setError('Failed to delete credential');
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (credential) => {
    try {
      setLoading(true);
      const response = await updateCredential(credential._id, {
        ...credential,
        isActive: !credential.isActive
      });
      updateContextCredential(response.data);
    } catch (error) {
      setError('Failed to update credential status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="credentials">
      <div className="credentials-header">
        <h2>Portal Credentials</h2>
        <button 
          className="add-btn"
          onClick={() => setShowForm(true)}
        >
          ➕ Add Credential
        </button>
      </div>

      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          <span>{error}</span>
          <button className="close-error" onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {showForm && (
        <div className="form-overlay">
          <div className="credential-form">
            <div className="form-header">
              <h3>{editingCredential ? 'Edit Credential' : 'Add New Credential'}</h3>
              <button className="close-btn" onClick={resetForm}>✕</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="portalName">Portal Type *</label>
                  <select
                    id="portalName"
                    name="portalName"
                    value={formData.portalName}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select a portal...</option>
                    <option value="Metro">Metro Business Portal (Public)</option>
                    <option value="SEPTA">SEPTA Vendor Portal (Requires Login)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="url">Portal URL</label>
                  <input
                    type="url"
                    id="url"
                    name="url"
                    value={formData.url}
                    onChange={handleInputChange}
                    placeholder="Auto-filled based on portal selection"
                    readOnly={formData.portalName !== ''}
                  />
                </div>
              </div>

              {formData.portalName === 'SEPTA' && (
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="username">Username</label>
                    <input
                      type="text"
                      id="username"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      placeholder="Portal username"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="password">Password</label>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder={editingCredential ? "Leave blank to keep current" : "Portal password"}
                    />
                  </div>
                </div>
              )}

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleInputChange}
                  />
                  <span className="checkbox-custom"></span>
                  Active (enable scraping for this portal)
                </label>
              </div>

              <div className="form-actions">
                <button type="button" className="cancel-btn" onClick={resetForm}>
                  Cancel
                </button>
                <button type="submit" className="save-btn" disabled={loading}>
                  {loading ? 'Saving...' : (editingCredential ? 'Update' : 'Save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="credentials-list">
        {loading && (!credentials || credentials.length === 0) ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading credentials...</p>
          </div>
        ) : (!credentials || credentials.length === 0) ? (
          <div className="empty-state">
            <span className="empty-icon">🔐</span>
            <h3>No credentials configured</h3>
            <p>Add portal credentials to enable automated bid scraping from protected portals.</p>
            <button className="add-first-btn" onClick={() => setShowForm(true)}>
              Add First Credential
            </button>
          </div>
        ) : (
          <div className="credentials-grid">
            {(credentials || []).map((credential) => (
              <div key={credential._id} className={`credential-card ${!credential.isActive ? 'inactive' : ''}`}>
                <div className="card-header">
                  <h4 className="portal-name">{credential.portalName}</h4>
                  <div className="card-actions">
                    <button
                      className={`toggle-btn ${credential.isActive ? 'active' : 'inactive'}`}
                      onClick={() => toggleActive(credential)}
                      title={credential.isActive ? 'Deactivate' : 'Activate'}
                    >
                      {credential.isActive ? '🟢' : '🔴'}
                    </button>
                    <button
                      className="edit-btn"
                      onClick={() => handleEdit(credential)}
                      title="Edit"
                    >
                      ✏️
                    </button>
                    <button
                      className="delete-btn"
                      onClick={() => handleDelete(credential._id)}
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                <div className="card-content">
                  <div className="url-section">
                    <span className="label">URL:</span>
                    <a 
                      href={credential.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="portal-url"
                      title={credential.url}
                    >
                      {credential.url.length > 40 
                        ? credential.url.substring(0, 40) + '...' 
                        : credential.url
                      }
                    </a>
                  </div>

                  <div className="auth-section">
                    <span className="label">Authentication:</span>
                    <span className={`auth-type ${credential.isPublic ? 'public' : 'private'}`}>
                      {credential.isPublic ? '🌐 Public' : '🔒 Private'}
                    </span>
                  </div>

                  {!credential.isPublic && credential.username && (
                    <div className="username-section">
                      <span className="label">Username:</span>
                      <span className="username">{credential.username}</span>
                    </div>
                  )}

                  <div className="status-section">
                    <span className="label">Status:</span>
                    <span className={`status ${credential.isActive ? 'active' : 'inactive'}`}>
                      {credential.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <div className="dates-section">
                    <small className="created-date">
                      Created: {new Date(credential.createdAt).toLocaleDateString()}
                    </small>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Credentials;