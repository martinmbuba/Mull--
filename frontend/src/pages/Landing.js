import React from 'react';
import { Link } from 'react-router-dom';
import './Landing.css';

const Landing = () => {
  return (
    <div className="landing">
      {/* Navigation */}
      <nav className="landing-nav">
        <div className="nav-brand">
          <span className="brand-icon">🏦</span>
          <span className="brand-text">Online Bank</span>
        </div>
        <div className="nav-actions">
          <Link to="/login" className="btn btn-outline">Sign In</Link>
          <Link to="/register" className="btn btn-primary">Get Started</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="hero">
        <div className="hero-content">
          <h1 className="hero-title">
            Banking Made <span className="highlight">Simple</span>
          </h1>
          <p className="hero-subtitle">
            Experience the future of banking with our secure, fast, and user-friendly platform. 
            Manage your finances with confidence, anytime, anywhere.
          </p>
          <div className="hero-actions">
            <Link to="/register" className="btn btn-primary btn-large">
              Open Free Account
            </Link>
            <Link to="/login" className="btn btn-outline btn-large">
              Existing Customer?
            </Link>
          </div>
          <div className="hero-stats">
            <div className="stat">
              <span className="stat-number">10K+</span>
              <span className="stat-label">Active Users</span>
            </div>
            <div className="stat">
              <span className="stat-number">$50M+</span>
              <span className="stat-label">Transactions</span>
            </div>
            <div className="stat">
              <span className="stat-number">99.9%</span>
              <span className="stat-label">Uptime</span>
            </div>
          </div>
        </div>
        <div className="hero-visual">
          <div className="credit-card">
            <div className="card-header">
              <span className="card-logo">🏦 Online Bank</span>
              <span className="card-chip">💳</span>
            </div>
            <div className="card-number">
              <span>••••</span>
              <span>••••</span>
              <span>••••</span>
              <span>1234</span>
            </div>
            <div className="card-footer">
              <div className="card-holder">
                <span className="label">Card Holder</span>
                <span className="value">YOUR NAME</span>
              </div>
              <div className="card-expiry">
                <span className="label">Expires</span>
                <span className="value">12/28</span>
              </div>
            </div>
          </div>
          <div className="floating-elements">
            <div className="float-badge float-1">
              <span className="icon">💰</span>
              <span>+ $2,500</span>
            </div>
            <div className="float-badge float-2">
              <span className="icon">🛡️</span>
              <span>Secure</span>
            </div>
            <div className="float-badge float-3">
              <span className="icon">⚡</span>
              <span>Fast Transfer</span>
            </div>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section className="features">
        <h2 className="section-title">Why Choose Online Bank?</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🔒</div>
            <h3>Bank-Grade Security</h3>
            <p>Your money is protected with industry-leading encryption and multi-layer security protocols.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">⚡</div>
            <h3>Instant Transfers</h3>
            <p>Send and receive money instantly with our real-time processing system.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📱</div>
            <h3>Mobile First</h3>
            <p>Bank on the go with our responsive mobile app available 24/7.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">💳</div>
            <h3>Easy Withdrawals</h3>
            <p>Withdraw your funds anytime with low fees and competitive rates.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Smart Analytics</h3>
            <p>Track your spending and savings with detailed transaction history.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🎯</div>
            <h3>No Hidden Fees</h3>
            <p>Transparent pricing with no surprise charges or maintenance fees.</p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works">
        <h2 className="section-title">Getting Started is Easy</h2>
        <div className="steps">
          <div className="step">
            <div className="step-number">1</div>
            <h3>Create Account</h3>
            <p>Sign up in minutes with just your email and basic information.</p>
          </div>
          <div className="step-arrow">→</div>
          <div className="step">
            <div className="step-number">2</div>
            <h3>Verify Identity</h3>
            <p>Quick and secure identity verification process.</p>
          </div>
          <div className="step-arrow">→</div>
          <div className="step">
            <div className="step-number">3</div>
            <h3>Start Banking</h3>
            <p>Access your account and start managing your finances.</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-content">
          <h2>Ready to Get Started?</h2>
          <p>Join thousands of users who trust Online Bank for their financial needs.</p>
          <Link to="/register" className="btn btn-primary btn-large">
            Create Your Free Account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <span className="brand-icon">🏦</span>
            <span className="brand-text">Online Bank</span>
          </div>
          <p className="footer-text">© 2024 Online Bank. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;

