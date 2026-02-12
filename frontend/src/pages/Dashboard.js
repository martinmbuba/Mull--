import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/supabase';
import equityLogo from '../img/equity.png';
import kcbLogo from '../img/kcb.png';
import coopLogo from '../img/coop.png';
import absaLogo from '../img/absa.png';
import standardLogo from '../img/standard.png';
import './Dashboard.css';

const KENYAN_BANKS = [
  { id: 'equity', name: 'Equity Bank', logo: equityLogo },
  { id: 'kcb', name: 'KCB Bank', logo: kcbLogo },
  { id: 'coop', name: 'Co-op Bank', logo: coopLogo },
  { id: 'absa', name: 'Absa Bank', logo: absaLogo },
  { id: 'standard', name: 'Standard Chartered', logo: standardLogo },
];

const COUNTRIES = [
  { code: 'KE', name: 'Kenya', phone: '+254', flag: '🇰🇪' },
  { code: 'UG', name: 'Uganda', phone: '+256', flag: '🇺🇬' },
  { code: 'TZ', name: 'Tanzania', phone: '+255', flag: '🇹🇿' },
  { code: 'RW', name: 'Rwanda', phone: '+250', flag: '🇷🇼' },
  { code: 'NG', name: 'Nigeria', phone: '+234', flag: '🇳🇬' },
  { code: 'ZA', name: 'South Africa', phone: '+27', flag: '🇿🇦' },
  { code: 'GH', name: 'Ghana', phone: '+233', flag: '🇬🇭' },
  { code: 'ET', name: 'Ethiopia', phone: '+251', flag: '🇪🇹' },
  { code: 'EG', name: 'Egypt', phone: '+20', flag: '🇪🇬' },
  { code: 'MA', name: 'Morocco', phone: '+212', flag: '🇲🇦' },
  { code: 'UK', name: 'United Kingdom', phone: '+44', flag: '🇬🇧' },
  { code: 'US', name: 'United States', phone: '+1', flag: '🇺🇸' },
  { code: 'CA', name: 'Canada', phone: '+1', flag: '🇨🇦' },
  { code: 'AU', name: 'Australia', phone: '+61', flag: '🇦🇺' },
  { code: 'DE', name: 'Germany', phone: '+49', flag: '🇩🇪' },
  { code: 'FR', name: 'France', phone: '+33', flag: '🇫🇷' },
  { code: 'CN', name: 'China', phone: '+86', flag: '🇨🇳' },
  { code: 'IN', name: 'India', phone: '+91', flag: '🇮🇳' },
  { code: 'JP', name: 'Japan', phone: '+81', flag: '🇯🇵' },
  { code: 'AE', name: 'UAE', phone: '+971', flag: '🇦🇪' },
];

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawalMethod, setWithdrawalMethod] = useState('mpesa');
  const [depositMethod, setDepositMethod] = useState('bank'); // 'mpesa' or 'bank'
  const [depositBank, setDepositBank] = useState(null);
  const [depositAccountNumber, setDepositAccountNumber] = useState('');
  const [selectedBank, setSelectedBank] = useState(null);
  const [accountNumber, setAccountNumber] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [showDepositBankDropdown, setShowDepositBankDropdown] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('withdraw');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);
  const [showTransactionsModal, setShowTransactionsModal] = useState(false);
  const [confirmAmount, setConfirmAmount] = useState(0);
  const [confirmType, setConfirmType] = useState('');
  const [confirmMethod, setConfirmMethod] = useState(null);

  const dropdownRef = useRef(null);
  const depositBankRef = useRef(null);

  const fetchData = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const balanceData = await api.getBalance(token);
      if (balanceData.balance !== undefined) {
        setBalance(balanceData.balance);
      }

      const transactionsData = await api.getTransactions(token);
      if (transactionsData.transactions) {
        setTransactions(transactionsData.transactions);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      if (err.message && err.message.includes('401')) {
        navigate('/login');
      }
    }
  }, [navigate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowCountryDropdown(false);
      }
      if (depositBankRef.current && !depositBankRef.current.contains(event.target)) {
        setShowDepositBankDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDepositBankSelect = (bank) => {
    setDepositBank(bank);
    setDepositAccountNumber('');
    setShowDepositBankDropdown(false);
    setError('');
  };

  const handleChangeDepositBank = () => {
    setDepositBank(null);
    setDepositAccountNumber('');
    setShowDepositBankDropdown(true);
  };

  const handleBankSelect = (bank) => {
    setSelectedBank(bank);
    setAccountNumber('');
    setShowBankModal(false);
    setWithdrawalMethod('bank');
    setError('');
  };

  const handleCountrySelect = (country) => {
    setSelectedCountry(country);
    setShowCountryDropdown(false);
  };

  const handleChangeBank = () => {
    setSelectedBank(null);
    setAccountNumber('');
    setWithdrawalMethod('mpesa');
    setShowBankModal(true);
  };

  const initiateTransaction = (type, amount, method = null) => {
    setConfirmType(type);
    setConfirmAmount(parseFloat(amount));
    setConfirmMethod(method);
    setShowConfirmModal(true);
    setError('');
    setSuccess('');
  };

  const handleConfirmTransaction = async () => {
    setShowConfirmModal(false);
    const token = localStorage.getItem('token');
    
    if (confirmType === 'withdraw') {
      setLoading(true);
      try {
        const details = {
          phoneCountryCode: confirmMethod.phoneCountryCode,
          phoneNumber: confirmMethod.phoneNumber,
          bankId: confirmMethod.bank?.id || null,
          bankName: confirmMethod.bank?.name || null,
          accountNumber: confirmMethod.accountNumber || null
        };
        const result = await api.withdraw(token, confirmAmount, confirmMethod.type, details);
        if (result.error) {
          setError(result.error);
        } else {
          const methodDisplay = confirmMethod.type === 'bank' ? confirmMethod.bank?.name : 'MPESA';
          setSuccess(`Successfully withdrew $${confirmAmount.toFixed(2)} via ${methodDisplay}`);
          setBalance(result.new_balance);
          fetchData();
          setWithdrawAmount('');
          setSelectedBank(null);
          setAccountNumber('');
          setPhoneNumber('');
        }
      } catch (err) {
        setError('Withdrawal failed. Please try again.');
      } finally {
        setLoading(false);
      }
    } else if (confirmType === 'deposit' && confirmMethod?.type === 'mpesa') {
      // M-PESA deposit flow
      setLoading(true);
      try {
        // Format phone number for M-PESA
        const phone = confirmMethod.phoneCountryCode + confirmMethod.phoneNumber;
        const result = await api.initiateMpesaDeposit(token, phone, confirmAmount);
        
        if (result.error) {
          setError(result.error);
        } else {
          const methodDisplay = confirmMethod.bank?.name || 'M-PESA';
          setSuccess(`STK Push sent to ${phone}. Please enter your M-PESA PIN on your phone.`);
          fetchData();
          setDepositAmount('');
          setDepositBank(null);
          setDepositAccountNumber('');
        }
      } catch (err) {
        setError('Deposit initiation failed. Please try again.');
      } finally {
        setLoading(false);
      }
    } else {
      // Standard deposit (bank simulation)
      setLoading(true);
      try {
        const result = await api.deposit(token, confirmAmount, { 
          bank: confirmMethod.bank,
          accountNumber: confirmMethod.accountNumber 
        });
        if (result.error) {
          setError(result.error);
        } else {
          const bankDisplay = confirmMethod.bank?.name || 'Bank';
          setSuccess(`Successfully deposited $${confirmAmount.toFixed(2)} from ${bankDisplay} (${confirmMethod.accountNumber})`);
          setBalance(result.new_balance);
          fetchData();
          setDepositAmount('');
          setDepositBank(null);
          setDepositAccountNumber('');
        }
      } catch (err) {
        setError('Deposit failed. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleWithdraw = (e) => {
    e.preventDefault();
    const amount = parseFloat(withdrawAmount);
    
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

    if (withdrawalMethod === 'mpesa') {
      if (!phoneNumber || phoneNumber.length < 6) {
        setError('Please enter a valid phone number');
        return;
      }
    }

    if (withdrawalMethod === 'bank' && !selectedBank) {
      setShowBankModal(true);
      return;
    }

    if (withdrawalMethod === 'bank' && !accountNumber) {
      setError('Please enter your account number');
      return;
    }

    const methodData = {
      type: withdrawalMethod,
      bank: selectedBank,
      accountNumber: accountNumber,
      phoneCountryCode: selectedCountry.phone,
      phoneNumber: phoneNumber
    };

    initiateTransaction('withdraw', amount, methodData);
  };

  const handleDeposit = (e) => {
    e.preventDefault();
    const amount = parseFloat(depositAmount);
    
    if (!amount || amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (amount < 1) {
      setError('Minimum deposit amount is $1');
      return;
    }

    if (amount > 50000) {
      setError('Maximum deposit amount is $50,000');
      return;
    }

    if (depositMethod === 'mpesa') {
      // For M-PESA deposit
      if (!phoneNumber || phoneNumber.length < 6) {
        setError('Please enter a valid phone number');
        return;
      }
      
      const methodData = {
        type: 'mpesa',
        bank: null,
        accountNumber: null,
        phoneCountryCode: selectedCountry.phone,
        phoneNumber: phoneNumber
      };

      initiateTransaction('deposit', amount, methodData);
    } else {
      // For BANK deposit
      if (!depositBank) {
        setError('Please select a bank to deposit from');
        return;
      }

      if (!depositAccountNumber || depositAccountNumber.length < 5) {
        setError('Please enter a valid account number');
        return;
      }

      initiateTransaction('deposit', amount, { 
        bank: depositBank, 
        accountNumber: depositAccountNumber,
        type: 'bank'
      });
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

  const getMethodDisplayName = (method) => {
    if (!method) return 'MPESA';
    if (method.type === 'bank' && method.bank) {
      return method.bank.name;
    }
    return 'MPESA';
  };

  return (
    <div className="dashboard">
      {showBankModal && (
        <div className="modal-overlay" onClick={() => setShowBankModal(false)}>
          <div className="modal-content bank-modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Select Your Bank</h3>
            <p>Choose from the list of Kenyan banks</p>
            <div className="bank-list">
              {KENYAN_BANKS.map((bank) => (
                <button
                  key={bank.id}
                  className="bank-option"
                  onClick={() => handleBankSelect(bank)}
                >
                  <img src={bank.logo} alt={bank.name} className="bank-logo" />
                  <span className="bank-name">{bank.name}</span>
                </button>
              ))}
            </div>
            <button 
              className="btn-cancel bank-modal-cancel"
              onClick={() => setShowBankModal(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {showConfirmModal && (
        <div className="modal-overlay" onClick={() => setShowConfirmModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Confirm Transaction</h3>
            <p>
              Are you sure you want to {confirmType === 'withdraw' ? 'withdraw' : 'deposit'} 
              <strong> ${confirmAmount.toFixed(2)}</strong>
              {confirmType === 'withdraw' && confirmMethod && (
                <span> via <strong>{getMethodDisplayName(confirmMethod)}</strong></span>
              )}?
            </p>
            {confirmType === 'deposit' && confirmMethod?.bank && (
              <div className="bank-details-preview">
                <p><strong>From Bank:</strong> {confirmMethod.bank.name}</p>
                <p><strong>Account:</strong> {confirmMethod.accountNumber}</p>
              </div>
            )}
            {confirmMethod?.type === 'mpesa' && (
              <div className="phone-details-preview">
                <p><strong>Phone:</strong> {confirmMethod.phoneCountryCode} {confirmMethod.phoneNumber}</p>
              </div>
            )}
            {confirmMethod?.type === 'bank' && confirmMethod?.bank && (
              <div className="bank-details-preview">
                <p><strong>Bank:</strong> {confirmMethod.bank.name}</p>
                <p><strong>Account:</strong> {confirmMethod.accountNumber}</p>
              </div>
            )}
            <div className="modal-actions">
              <button 
                className="btn-cancel" 
                onClick={() => setShowConfirmModal(false)}
              >
                Cancel
              </button>
              <button 
                className={confirmType === 'withdraw' ? 'btn-confirm-withdraw' : 'btn-confirm-deposit'}
                onClick={handleConfirmTransaction}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {showTransactionsModal && (
        <div className="modal-overlay" onClick={() => setShowTransactionsModal(false)}>
          <div className="modal-content transactions-modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Transaction History</h3>
            {transactions.length === 0 ? (
              <p className="no-transactions">No transactions yet</p>
            ) : (
              <div className="transactions-list-modal">
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
            <button 
              className="btn-cancel transactions-modal-cancel"
              onClick={() => setShowTransactionsModal(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      <header className="dashboard-header">
        <div className="logo">
          <h1>Online Bank</h1>
        </div>
        <div className="user-info">
          <Link to="/profile" className="btn-profile">Profile</Link>
          <span>Welcome, {user?.email}</span>
          <button onClick={handleLogout} className="btn-logout">
            Logout
          </button>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="balance-row">
          <div className="balance-card">
            <h2>Account Balance</h2>
            <div className="balance-amount">
              ${balance.toFixed(2)}
            </div>
          </div>
          <button 
            className="btn-transactions-side"
            onClick={() => setShowTransactionsModal(true)}
          >
            Transactions
          </button>
        </div>

        <div className="transaction-section">
          <div className="transaction-tabs">
            <button 
              className={`tab ${activeTab === 'withdraw' ? 'active' : ''}`}
              onClick={() => setActiveTab('withdraw')}
            >
              Withdraw
            </button>
            <button 
              className={`tab ${activeTab === 'deposit' ? 'active' : ''}`}
              onClick={() => setActiveTab('deposit')}
            >
              Deposit
            </button>
          </div>

          <div className="transaction-form-container">
            {activeTab === 'withdraw' ? (
              <div className="withdraw-section">
                <h2>Withdraw Money</h2>
                <form onSubmit={handleWithdraw} className="withdraw-form">
                  <div className="form-group">
                    <label>Withdraw To</label>
                    <div className="withdrawal-method-options">
                      <button
                        type="button"
                        className={`method-option ${withdrawalMethod === 'mpesa' ? 'active' : ''}`}
                        onClick={() => {
                          setWithdrawalMethod('mpesa');
                          setSelectedBank(null);
                          setAccountNumber('');
                        }}
                      >
                        <span className="method-name">MPESA</span>
                      </button>
                      <button
                        type="button"
                        className={`method-option ${withdrawalMethod === 'bank' ? 'active' : ''}`}
                        onClick={() => setShowBankModal(true)}
                      >
                        <span className="method-name">BANK</span>
                      </button>
                    </div>
                  </div>
                  
                  {withdrawalMethod === 'mpesa' ? (
                    <div className="form-group">
                      <label htmlFor="phoneNumber">Phone Number</label>
                      <div className="phone-input-container" ref={dropdownRef}>
                        <button
                          type="button"
                          className="country-code-btn"
                          onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                        >
                          <span className="country-flag">{selectedCountry.flag}</span>
                          <span className="country-phone">{selectedCountry.phone}</span>
                          <span className="dropdown-arrow">▼</span>
                        </button>
                        {showCountryDropdown && (
                          <div className="country-dropdown">
                            <div className="country-search">
                              <input
                                type="text"
                                placeholder="Search countries..."
                                className="country-search-input"
                              />
                            </div>
                            <div className="country-list">
                              {COUNTRIES.map((country) => (
                                <button
                                  key={country.code}
                                  className={`country-option ${selectedCountry.code === country.code ? 'selected' : ''}`}
                                  type="button"
                                  onClick={() => handleCountrySelect(country)}
                                >
                                  <span className="country-flag">{country.flag}</span>
                                  <span className="country-name">{country.name}</span>
                                  <span className="country-phone">{country.phone}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                        <input
                          type="tel"
                          id="phoneNumber"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                          placeholder="Phone number"
                          maxLength="10"
                          className="phone-number-input"
                        />
                      </div>
                    </div>
                  ) : null}
                  
                  {withdrawalMethod === 'bank' && selectedBank ? (
                    <div className="selected-bank-display">
                      <div className="selected-bank-info">
                        <span className="selected-bank-name">{selectedBank.name}</span>
                        <button 
                          type="button" 
                          className="change-bank-btn"
                          onClick={handleChangeBank}
                        >
                          Change Bank
                        </button>
                      </div>
                    </div>
                  ) : null}
                  
                  {withdrawalMethod === 'bank' && selectedBank ? (
                    <div className="form-group">
                      <label htmlFor="accountNumber">Account Number</label>
                      <input
                        type="text"
                        id="accountNumber"
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                        placeholder="Enter account number"
                        maxLength="20"
                      />
                    </div>
                  ) : null}
                  
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
                    {loading ? 'Processing...' : 'Proceed to Withdraw'}
                  </button>
                </form>
              </div>
            ) : (
              <div className="deposit-section">
                <h2>Deposit Money</h2>
                <form onSubmit={handleDeposit} className="deposit-form">
                  <div className="form-group">
                    <label>Deposit Method</label>
                    <div className="withdrawal-method-options">
                      <button
                        type="button"
                        className={`method-option ${depositMethod === 'bank' ? 'active' : ''}`}
                        onClick={() => {
                          setDepositMethod('bank');
                          setDepositBank(null);
                          setDepositAccountNumber('');
                        }}
                      >
                        <span className="method-name">BANK</span>
                      </button>
                      <button
                        type="button"
                        className={`method-option ${depositMethod === 'mpesa' ? 'active' : ''}`}
                        onClick={() => {
                          setDepositMethod('mpesa');
                          setDepositBank(null);
                          setDepositAccountNumber('');
                        }}
                      >
                        <span className="method-name">MPESA</span>
                      </button>
                    </div>
                  </div>
                  
                  {depositMethod === 'bank' ? (
                    <>
                      <div className="form-group">
                        <label>Deposit From Bank</label>
                        {!depositBank ? (
                          <div className="bank-select-dropdown" ref={depositBankRef}>
                            <button
                              type="button"
                              className="bank-select-btn"
                              onClick={() => setShowDepositBankDropdown(!showDepositBankDropdown)}
                            >
                              <span>Select your bank</span>
                              <span className="dropdown-arrow">▼</span>
                            </button>
                            {showDepositBankDropdown && (
                              <div className="bank-dropdown-menu">
                                <div className="bank-dropdown-header">Choose from the list of Kenyan banks</div>
                                {KENYAN_BANKS.map((bank) => (
                                  <button
                                    key={bank.id}
                                    type="button"
                                    className="bank-dropdown-item"
                                    onClick={() => handleDepositBankSelect(bank)}
                                  >
                                    <img src={bank.logo} alt={bank.name} className="bank-logo-small" />
                                    <span>{bank.name}</span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="selected-bank-display">
                            <div className="selected-bank-info">
                              <img src={depositBank.logo} alt={depositBank.name} className="bank-logo-small" />
                              <span className="selected-bank-name">{depositBank.name}</span>
                              <button 
                                type="button" 
                                className="change-bank-btn"
                                onClick={handleChangeDepositBank}
                              >
                                Change Bank
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {depositBank && (
                        <div className="form-group">
                          <label htmlFor="depositAccountNumber">Account Number (Source)</label>
                          <input
                            type="text"
                            id="depositAccountNumber"
                            value={depositAccountNumber}
                            onChange={(e) => setDepositAccountNumber(e.target.value)}
                            placeholder="Enter account number to deposit from"
                            maxLength="20"
                          />
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="form-group">
                      <label htmlFor="depositPhoneNumber">Phone Number (for STK Push)</label>
                      <div className="phone-input-container" ref={dropdownRef}>
                        <button
                          type="button"
                          className="country-code-btn"
                          onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                        >
                          <span className="country-flag">{selectedCountry.flag}</span>
                          <span className="country-phone">{selectedCountry.phone}</span>
                          <span className="dropdown-arrow">▼</span>
                        </button>
                        {showCountryDropdown && (
                          <div className="country-dropdown">
                            <div className="country-search">
                              <input
                                type="text"
                                placeholder="Search countries..."
                                className="country-search-input"
                              />
                            </div>
                            <div className="country-list">
                              {COUNTRIES.map((country) => (
                                <button
                                  key={country.code}
                                  className={`country-option ${selectedCountry.code === country.code ? 'selected' : ''}`}
                                  type="button"
                                  onClick={() => handleCountrySelect(country)}
                                >
                                  <span className="country-flag">{country.flag}</span>
                                  <span className="country-name">{country.name}</span>
                                  <span className="country-phone">{country.phone}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                        <input
                          type="tel"
                          id="depositPhoneNumber"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                          placeholder="Phone number"
                          maxLength="10"
                          className="phone-number-input"
                        />
                      </div>
                      <small style={{color: '#666', fontSize: '12px'}}>
                        You will receive an M-PESA STK push prompt on this phone
                      </small>
                    </div>
                  )}
                  
                  <div className="form-group">
                    <label htmlFor="depositAmount">Amount ($)</label>
                    <input
                      type="number"
                      id="depositAmount"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      placeholder="Enter amount (min $1, max $50,000)"
                      min="1"
                      max="50000"
                      step="0.01"
                    />
                  </div>
                  <button type="submit" className="btn-deposit" disabled={loading}>
                    {loading ? 'Processing...' : 'Proceed to Deposit'}
                  </button>
                </form>
              </div>
            )}
            
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;

