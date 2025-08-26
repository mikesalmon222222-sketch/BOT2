import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { getCredentials, createCredential, updateCredential, deleteCredential } from '../../services/api';
import './Credentials.css';

const Credentials = () => {
  const { credentials, setCredentials, addCredential, updateCredential: updateContextCredential, deleteCredential: deleteContextCredential } = useApp();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingCredential, setEditingCredential] = useState(null);
  const [formData, setFormData] = useState({
    portalName: '',
    url: '',
    username: '',
    password: '',
    isPublic: false,
    isActive: true
  });

  useEffect(() => {
    fetchCredentials();
  }, []);

  const fetchCredentials = async () => {
    try {
      setLoading(true);
      const response = await getCredentials();
      setCredentials(response.data.data);
    } catch (error) {
      setError('Failed to fetch credentials');
      console.error('Error fetching credentials:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      portalName: '',
      url: '',
      username: '',
      password: '',
      isPublic: false,
      isActive: true
    });
    setEditingCredential(null);
    setShowForm(false);
    setError(null);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.portalName || !formData.url) {
      setError('Portal name and URL are required');
      return;
    }

    if (!formData.isPublic && (!formData.username || !formData.password)) {
      setError('Username and password are required for non-public portals');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (editingCredential) {
        const response = await updateCredential(editingCredential._id, formData);
        updateContextCredential(response.data.data);
      } else {
        const response = await createCredential(formData);
        addCredential(response.data.data);
      }

      resetForm();
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to save credential');
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
      isPublic: credential.isPublic,
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
      updateContextCredential(response.data.data);
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
                  <label htmlFor="portalName">Portal Name *</label>
                  <input
                    type="text"
                    id="portalName"
                    name="portalName"
                    value={formData.portalName}
                    onChange={handleInputChange}
                    placeholder="e.g., Metro Business Portal"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="url">Portal URL *</label>
                  <input
                    type="url"
                    id="url"
                    name="url"
                    value={formData.url}
                    onChange={handleInputChange}
                    placeholder="https://example.com/portal"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="isPublic"
                    checked={formData.isPublic}
                    onChange={handleInputChange}
                  />
                  <span className="checkbox-custom"></span>
                  Public Portal (no authentication required)
                </label>
              </div>

              {!formData.isPublic && (
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
        {loading && credentials.length === 0 ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading credentials...</p>
          </div>
        ) : credentials.length === 0 ? (
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
            {credentials.map((credential) => (
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