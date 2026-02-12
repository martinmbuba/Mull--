import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/supabase';
import { supabase } from '../services/supabase';
import LoadingSpinner from '../components/LoadingSpinner';
import './Profile.css';

const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchProfile = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const result = await api.getProfile(token);
      setProfile(result.profile);
      setFullName(result.profile.full_name || '');
      
      // Get avatar URL if exists
      if (result.profile.avatar_url) {
        setAvatarUrl(result.profile.avatar_url);
      }
    } catch (err) {
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const token = localStorage.getItem('token');
    
    try {
      const result = await api.updateProfile(token, fullName);
      setSuccess('Profile updated successfully!');
      setEditing(false);
      fetchProfile();
    } catch (err) {
      setError('Failed to update profile: ' + (err.message || 'Unknown error'));
    }
  };

  const handleAvatarUpload = async (event) => {
    try {
      setUploading(true);
      setError('');
      setSuccess('');
      
      const file = event.target.files[0];
      
      if (!file) {
        setUploading(false);
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        setUploading(false);
        return;
      }

      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB');
        setUploading(false);
        return;
      }

      const token = localStorage.getItem('token');
      const userId = user?.id || profile?.id;
      
      if (!userId) {
        setError('User ID not found. Please login again.');
        setUploading(false);
        return;
      }
      
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/avatar_${Date.now()}.${fileExt}`;
      
      // Upload to Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const publicUrl = urlData.publicUrl;
      
      // Update profile with avatar URL
      await api.updateProfile(token, fullName, publicUrl);
      
      setAvatarUrl(publicUrl);
      setSuccess('Profile picture updated successfully!');
      fetchProfile();
      
    } catch (err) {
      setError('Failed to upload profile picture: ' + (err.message || 'Unknown error'));
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    try {
      setUploading(true);
      setError('');
      setSuccess('');
      
      const token = localStorage.getItem('token');
      
      // Remove avatar from profile
      await api.updateProfile(token, fullName, null);
      
      setAvatarUrl(null);
      setSuccess('Profile picture removed');
      fetchProfile();
      
    } catch (err) {
      setError('Failed to remove profile picture: ' + (err.message || 'Unknown error'));
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    localStorage.removeItem('token');
    navigate('/login');
  };

  const getInitials = (name) => {
    if (!name) return '👤';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (loading) {
    return (
      <div className="profile-container">
        <LoadingSpinner message="Loading profile..." />
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-card">
        <div className="profile-header">
          <Link to="/dashboard" className="back-link">
            ← Back to Dashboard
          </Link>
          <button onClick={handleLogout} className="btn-logout">
            Logout
          </button>
        </div>

        {/* Profile Picture Section */}
        <div className="profile-picture-section">
          <div className="profile-avatar-container">
            <div className={`profile-avatar ${avatarUrl ? 'has-image' : ''}`}>
              {avatarUrl ? (
                <img src={avatarUrl} alt="Profile" />
              ) : (
                getInitials(fullName || user?.email)
              )}
            </div>
            
            {/* Upload Button */}
            <div className="upload-button" title="Change profile picture">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleAvatarUpload}
                accept="image/*"
                disabled={uploading}
              />
              <label onClick={() => fileInputRef.current?.click()}>
                {uploading ? '⏳' : '📷'}
              </label>
            </div>
          </div>
          
          <p className="upload-label">
            {uploading ? 'Uploading...' : 'Click camera icon to upload'}
          </p>
          
          {avatarUrl && (
            <button 
              className="remove-avatar-btn"
              onClick={handleRemoveAvatar}
              disabled={uploading}
            >
              Remove Photo
            </button>
          )}
          
          <h2 className="profile-name">{fullName || 'User'}</h2>
          <p className="profile-email">{user?.email}</p>
        </div>

        {error && (
          <div className="error-message">
            <span>⚠️</span> {error}
          </div>
        )}
        
        {success && (
          <div className="success-message">
            <span>✓</span> {success}
          </div>
        )}

        <div className="profile-section">
          <h2>Personal Information</h2>
          
          {!editing ? (
            <div className="profile-info">
              <div className="info-row">
                <label>Full Name:</label>
                <span>{profile?.full_name || 'Not set'}</span>
                <button onClick={() => { setEditing(true); setError(''); setSuccess(''); }} className="btn-edit">
                  Edit
                </button>
              </div>
              <div className="info-row">
                <label>Email:</label>
                <span>{user?.email}</span>
              </div>
              <div className="info-row">
                <label>Account Balance:</label>
                <span className="balance">${profile?.balance?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="info-row">
                <label>Member Since:</label>
                <span>{new Date(profile?.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          ) : (
            <form onSubmit={handleUpdateProfile} className="edit-form">
              <div className="form-group">
                <label htmlFor="fullName">Full Name</label>
                <input
                  type="text"
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                />
              </div>
              <div className="button-group">
                <button type="submit" className="btn-save">
                  Save Changes
                </button>
                <button 
                  type="button" 
                  onClick={() => { setEditing(false); setError(''); setSuccess(''); }} 
                  className="btn-cancel"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="profile-section">
          <h2>Account Statistics</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-value">${profile?.balance?.toFixed(2) || '0.00'}</span>
              <span className="stat-label">Current Balance</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">
                {profile?.transactions?.length || 0}
              </span>
              <span className="stat-label">Total Transactions</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
