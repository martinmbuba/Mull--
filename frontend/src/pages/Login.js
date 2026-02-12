import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { session } = await login(email, password);
      localStorage.setItem('token', session.access_token);
      navigate('/dashboard');
    } catch (err) {
      if (err.message.includes('Email not confirmed') || err.message.includes('not confirmed')) {
        setError('⚠️ Please check your email and click the confirmation link before logging in. Also check your spam folder.');
      } else {
        setError(err.message);
      }
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
          <div className="logo">🏦</div>
          <h2>Welcome Back</h2>
          <p className="auth-subtitle">Sign in to access your account</p>
        </div>
        
        {error && (
          <div className="error-message">
            <span>⚠️</span> {error}
          </div>
        )}
        
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
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              autoComplete="current-password"
            />
            <span 
              className="input-icon" 
              style={{ cursor: 'pointer' }}
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? '🙈' : '👁️'}
            </span>
          </div>
          
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? (
              <span className="btn-loading">
                <span className="spinner"></span>
                Signing in...
              </span>
            ) : (
              'Sign In'
            )}
          </button>
        </form>
        
        <div className="auth-footer">
          <p>Don't have an account?</p>
          <Link to="/register" className="link-button">
            Create Account
          </Link>
          <br />
          <Link to="/reset-password">Forgot your password?</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;

