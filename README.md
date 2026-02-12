# Online Banking Withdrawal System

A full-stack online banking application built with React.js frontend, Python Flask backend, and Supabase for database and authentication.

## Features

### Authentication
- User registration with email confirmation
- Secure login/logout
- Password reset functionality
- Session management

### Banking Operations
- View account balance
- Withdraw money (minimum $10)
- Deposit money (minimum $1, maximum $50,000)
- Transaction history

### Security
- Rate limiting on API endpoints
- Input sanitization
- Email format validation
- Password strength validation
- JWT token-based authentication

### User Experience
- Real-time password validation
- Transaction confirmation dialogs
- Error boundaries
- Loading states
- Responsive design

## Tech Stack

### Frontend
- React.js 18
- React Router DOM 6
- Supabase JavaScript Client
- CSS3 with responsive design

### Backend
- Python Flask
- Flask-CORS
- Supabase Python Client

### Database & Auth
- Supabase (PostgreSQL)
- Supabase Auth

## Project Structure

```
bank-withdrawal-system/
├── backend/
│   ├── app.py              # Main Flask application
│   ├── config.py           # Configuration settings
│   ├── requirements.txt    # Python dependencies
│   ├── supabase_client.py  # Supabase client setup
│   └── schema.sql         # Database schema
│
├── frontend/
│   ├── public/
│   │   └── index.html     # HTML template
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   │   ├── ErrorBoundary.js
│   │   │   ├── LoadingSpinner.js
│   │   │   └── ProtectedRoute.js
│   │   ├── context/       # State management
│   │   │   └── AuthContext.js
│   │   ├── pages/        # Page components
│   │   │   ├── Dashboard.js/css
│   │   │   ├── Login.js
│   │   │   ├── PasswordReset.js
│   │   │   ├── Profile.js/css
│   │   │   └── Register.js
│   │   ├── services/     # API services
│   │   │   └── supabase.js
│   │   ├── App.js
│   │   └── index.js
│   ├── package.json
│   └── .env
│
├── .env.example           # Environment template
├── PLAN.md               # Project plan
├── SETUP_SUPABASE.md     # Supabase setup guide
├── SQL_COMMANDS.sql      # Database SQL
└── README.md            # This file
```

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.11+
- Supabase account

### Backend Setup

1. Create a virtual environment:
```bash
cd backend
python -m venv venv2
source venv2/bin/activate  # On Windows: venv2\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Configure environment variables:
```bash
cp ../.env.example .env
# Edit .env with your Supabase credentials
```

4. Start the backend server:
```bash
python app.py
# Backend runs on http://localhost:5000
```

### Frontend Setup

1. Install dependencies:
```bash
cd frontend
npm install
```

2. Configure environment variables:
```bash
cp ../.env.example .env
# Edit .env with your Supabase credentials
```

3. Start the frontend:
```bash
npm start
# Frontend runs on http://localhost:3000
```

### Database Setup

1. Create a Supabase project at https://supabase.com
2. Go to SQL Editor in your Supabase dashboard
3. Run the contents of `backend/schema.sql`
4. Copy your Project URL and anon key to `.env` files

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| POST | `/api/auth/logout` | Logout user |
| POST | `/api/auth/reset-password` | Request password reset |
| GET | `/api/auth/me` | Get current user |

### Account
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/account/balance` | Get account balance |
| GET | `/api/account/transactions` | Get transaction history |

### Transactions
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/withdraw` | Process withdrawal |
| GET | `/api/withdraw/history` | Get withdrawal history |
| POST | `/api/deposit` | Process deposit |
| GET | `/api/deposit/history` | Get deposit history |

### Profile
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/profile` | Get user profile |
| PUT | `/api/profile` | Update user profile |

## Security Features

- **Rate Limiting**: 5 requests per minute for login, 3 for registration
- **Input Sanitization**: XSS and injection attack prevention
- **Password Validation**: Minimum 8 characters
- **Email Validation**: Regex-based format checking
- **Amount Limits**: $1-$50,000 for deposits, $10+ for withdrawals

## Environment Variables

### Backend (.env)
```
SUPABASE_URL=your-project-url
SUPABASE_ANON_KEY=your-anon-key
SECRET_KEY=your-secret-key
DEBUG=True/False
```

### Frontend (.env)
```
REACT_APP_SUPABASE_URL=your-project-url
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
REACT_APP_API_URL=http://localhost:5000/api
```

## License

MIT License

