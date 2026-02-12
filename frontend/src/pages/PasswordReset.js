import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import './Auth.css';

const PasswordReset = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      });

      if (error) {
        throw error;
      }

      setMessage('✓ Password reset link has been sent to your email. Please check your inbox and spam folder.');
    } catch (err) {
      setError('⚠️ ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-particles">
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
      </div>
      
      <div className="auth-card">
        <div className="auth-card-header">
          <div className="logo">🔐</div>
          <h2>Reset Password</h2>
          <p className="auth-subtitle">Enter your email to receive a password reset link</p>
        </div>
        
        {error && (
          <div className="error-message">
            <span>⚠️</span> {error}
          </div>
        )}
        
        {message && (
          <div className="success-message">
            <span>✓</span> {message}
          </div>
        )}
        
        {!message && (
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                autoComplete="email"
              />
              <span className="input-icon">📧</span>
            </div>
            
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? (
                <span className="btn-loading">
                  <span className="spinner"></span>
                  Sending...
                </span>
              ) : (
                'Send Reset Link'
              )}
            </button>
          </form>
        )}
        
        <div className="auth-footer">
          <p>Remember your password?</p>
          <Link to="/login" className="link-button">
            Sign In
          </Link>
          <br />
          <p style={{ marginTop: '16px' }}>Don't have an account?</p>
          <Link to="/register">Create one</Link>
        </div>
      </div>
    </div>
  );
};

export default PasswordReset;

