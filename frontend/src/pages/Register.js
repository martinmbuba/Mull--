import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const Register = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      await register(email, password, fullName);
      navigate('/login');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Password validation
  const passwordValid = password.length >= 6;
  const passwordsMatch = password && confirmPassword && password === confirmPassword;
  
  // Password strength calculation
  const getPasswordStrength = () => {
    if (!password) return { score: 0, label: '', color: '' };
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    
    if (score <= 2) return { score, label: 'Weak', color: '#ff4757' };
    if (score <= 3) return { score, label: 'Medium', color: '#ffa502' };
    if (score <= 4) return { score, label: 'Strong', color: '#00d4ff' };
    return { score, label: 'Very Strong', color: '#00ff88' };
  };
  
  const strength = getPasswordStrength();

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
          <h2>Create Account</h2>
          <p className="auth-subtitle">Get started with your bank account</p>
        </div>
        
        {error && (
          <div className="error-message">
            <span>⚠️</span> {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="fullName">Full Name</label>
            <input
              type="text"
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter your full name"
              required
              autoComplete="name"
            />
            <span className="input-icon">👤</span>
          </div>
          
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
              placeholder="Create a password"
              required
              autoComplete="new-password"
              className={password && (passwordValid ? 'success' : 'error')}
            />
            <span 
              className="input-icon" 
              style={{ cursor: 'pointer' }}
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? '🙈' : '👁️'}
            </span>
          </div>
          
          {password && (
            <div className="password-strength">
              <div className="password-strength-bar">
                <div 
                  className="password-strength-bar-fill"
                  style={{ 
                    width: `${(strength.score / 5) * 100}%`,
                    background: strength.color
                  }}
                />
              </div>
              <span className="password-strength-label" style={{ color: strength.color }}>
                {strength.label}
              </span>
            </div>
          )}
          
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
              required
              autoComplete="new-password"
              className={confirmPassword && (passwordsMatch ? 'success' : 'error')}
              style={{ borderColor: confirmPassword && (passwordsMatch ? '#00ff88' : '#ff4757') }}
            />
            <span 
              className="input-icon" 
              style={{ cursor: 'pointer' }}
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? '🙈' : '👁️'}
            </span>
          </div>
          
          {confirmPassword && (
            <div style={{ 
              fontSize: '12px', 
              color: passwordsMatch ? '#00ff88' : '#ff4757',
              marginTop: '-16px',
              marginBottom: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              {passwordsMatch ? '✓' : '✗'} {passwordsMatch ? 'Passwords match' : 'Passwords do not match'}
            </div>
          )}
          
          <button 
            type="submit" 
            className="btn-primary" 
            disabled={loading || (password && !passwordValid) || (confirmPassword && !passwordsMatch)}
          >
            {loading ? (
              <span className="btn-loading">
                <span className="spinner"></span>
                Creating account...
              </span>
            ) : (
              'Create Account'
            )}
          </button>
        </form>
        
        <div className="auth-footer">
          <p>Already have an account?</p>
          <Link to="/login" className="link-button">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;

