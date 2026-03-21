// src/pages/NotFound.jsx
import { useNavigate } from 'react-router-dom';
import '../styles/NotFound.css';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="not-found-container">
      <div className="not-found-content">
        <div className="not-found-illustration">
          <div className="error-code">404</div>
          <div className="error-icon">🔍</div>
        </div>
        
        <h1>Page Not Found</h1>
        <p className="not-found-message">
          Oops! The page you're looking for doesn't exist or has been moved.
        </p>
        
        <div className="not-found-actions">
          <button onClick={() => navigate('/dashboard')} className="btn-primary">
            Go to Dashboard
          </button>
          <button onClick={() => navigate(-1)} className="btn-secondary">
            Go Back
          </button>
        </div>
        
        <div className="helpful-links">
          <h3>Helpful Links</h3>
          <div className="links-grid">
            <a href="/dashboard">🏠 Dashboard</a>
            <a href="/accounts">🏦 Accounts</a>
            <a href="/transactions">💸 Transactions</a>
            <a href="/budgets">📊 Budgets</a>
            <a href="/baby-steps">🪜 Baby Steps</a>
            <a href="/analytics">📈 Analytics</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;