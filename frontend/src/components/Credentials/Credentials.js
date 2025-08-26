import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import './Credentials.css';

const Credentials = () => {
  const { credentials, loading, error, addCredential, updateCredential, deleteCredential } = useApp();
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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCredential) {
        await updateCredential(editingCredential._id, formData);
      } else {
        await addCredential(formData);
      }
      resetForm();
    } catch (error) {
      console.error('Error saving credential:', error);
    }
  };

  const handleEdit = (credential) => {
    setFormData({
      portalName: credential.portalName,
      url: credential.url,
      username: credential.username || '',
      password: '', // Don't populate password for security
      isPublic: credential.isPublic,
      isActive: credential.isActive
    });
    setEditingCredential(credential);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this credential?')) {
      try {
        await deleteCredential(id);
      } catch (error) {
        console.error('Error deleting credential:', error);
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  return (
    <div className="credentials">
      <div className="section-header">
        <h3>Credentials Management</h3>
        <button 
          onClick={() => setShowForm(!showForm)} 
          className="add-btn"
        >
          {showForm ? 'Cancel' : 'Add Credential'}
        </button>
      </div>

      {showForm && (
        <div className="credential-form">
          <h4>{editingCredential ? 'Edit Credential' : 'Add New Credential'}</h4>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Portal Name:</label>
                <input
                  type="text"
                  name="portalName"
                  value={formData.portalName}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>URL:</label>
                <input
                  type="url"
                  name="url"
                  value={formData.url}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    name="isPublic"
                    checked={formData.isPublic}
                    onChange={handleInputChange}
                  />
                  Public Portal (no login required)
                </label>
              </div>
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleInputChange}
                  />
                  Active
                </label>
              </div>
            </div>

            {!formData.isPublic && (
              <div className="form-row">
                <div className="form-group">
                  <label>Username:</label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    required={!formData.isPublic}
                  />
                </div>
                <div className="form-group">
                  <label>Password:</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required={!formData.isPublic && !editingCredential}
                    placeholder={editingCredential ? 'Leave blank to keep current password' : ''}
                  />
                </div>
              </div>
            )}

            <div className="form-actions">
              <button type="submit" className="save-btn">
                {editingCredential ? 'Update' : 'Save'}
              </button>
              <button type="button" onClick={resetForm} className="cancel-btn">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {error && (
        <div className="error-message">
          Error: {error}
        </div>
      )}

      <div className="credentials-list">
        {loading ? (
          <div className="loading">Loading credentials...</div>
        ) : credentials.length === 0 ? (
          <div className="no-data">
            No credentials configured. Add credentials to enable portal scraping.
          </div>
        ) : (
          <div className="credentials-grid">
            {credentials.map((credential) => (
              <div key={credential._id} className="credential-card">
                <div className="credential-header">
                  <h4>{credential.portalName}</h4>
                  <div className="credential-actions">
                    <button onClick={() => handleEdit(credential)} className="edit-btn">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(credential._id)} className="delete-btn">
                      Delete
                    </button>
                  </div>
                </div>
                <div className="credential-details">
                  <p><strong>URL:</strong> {credential.url}</p>
                  <p><strong>Type:</strong> {credential.isPublic ? 'Public' : 'Login Required'}</p>
                  {!credential.isPublic && (
                    <p><strong>Username:</strong> {credential.username}</p>
                  )}
                  <p><strong>Status:</strong> 
                    <span className={`status ${credential.isActive ? 'active' : 'inactive'}`}>
                      {credential.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </p>
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