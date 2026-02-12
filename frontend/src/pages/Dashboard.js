import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/supabase';
import './Dashboard.css';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const [balanceData, transactionsData] = await Promise.all([
        api.getBalance(token),
        api.getTransactions(token)
      ]);

      if (balanceData.balance !== undefined) {
        setBalance(balanceData.balance);
      }

      if (transactionsData.transactions) {
        setTransactions(transactionsData.transactions);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  }, [navigate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleWithdraw = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const amount = parseFloat(withdrawAmount);
    const token = localStorage.getItem('token');

    if (!amount || amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (amount < 10) {
      setError('Minimum withdrawal amount is $10');
      return;
    }

    if (amount > balance) {
      setError('Insufficient balance');
      return;
    }

    setLoading(true);

    try {
      const result = await api.withdraw(token, amount);
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(`Successfully withdrew $${amount.toFixed(2)}`);
        setBalance(result.new_balance);
        fetchData(); // Refresh transactions
        setWithdrawAmount('');
      }
    } catch (err) {
      setError('Withdrawal failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    localStorage.removeItem('token');
    navigate('/login');
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="logo">
          <h1>🏦 Online Bank</h1>
        </div>
        <div className="user-info">
          <span>Welcome, {user?.email}</span>
          <button onClick={handleLogout} className="btn-logout">
            Logout
          </button>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="balance-card">
          <h2>Account Balance</h2>
          <div className="balance-amount">
            ${balance.toFixed(2)}
          </div>
        </div>

        <div className="withdraw-section">
          <h2>Withdraw Money</h2>
          <form onSubmit={handleWithdraw} className="withdraw-form">
            <div className="form-group">
              <label htmlFor="amount">Amount ($)</label>
              <input
                type="number"
                id="amount"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="Enter amount (min $10)"
                min="10"
                step="0.01"
              />
            </div>
            <button type="submit" className="btn-withdraw" disabled={loading}>
              {loading ? 'Processing...' : 'Withdraw'}
            </button>
          </form>
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}
        </div>

        <div className="transactions-section">
          <h2>Transaction History</h2>
          {transactions.length === 0 ? (
            <p className="no-transactions">No transactions yet</p>
          ) : (
            <div className="transactions-list">
              {transactions.map((tx) => (
                <div key={tx.id} className={`transaction-item ${tx.type}`}>
                  <div className="transaction-info">
                    <span className="transaction-type">
                      {tx.type === 'deposit' ? '💰' : '💸'} {tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}
                    </span>
                    <span className="transaction-description">
                      {tx.description}
                    </span>
                  </div>
                  <div className="transaction-details">
                    <span className={`transaction-amount ${tx.type}`}>
                      {tx.type === 'withdrawal' ? '-' : '+'}${Math.abs(tx.amount).toFixed(2)}
                    </span>
                    <span className="transaction-date">
                      {formatDate(tx.created_at)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;

