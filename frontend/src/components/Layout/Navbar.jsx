// src/components/Layout/Navbar.jsx
import { useAuth } from '../../context/AuthContext';
import { useAccounts } from '../../context/AccountContext'; // Import this
import { useCurrency } from '../../context/CurrencyContext'; // Import this
import { formatMoney } from '../../utils/moneyUtils';
import '../../styles/Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  // Subscribe to live global state instead of relying on props
  const { netWorth } = useAccounts(); 
  const { currency } = useCurrency();

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <h1>StepSeven</h1>
        </div>

        <div className="navbar-center">
          <div className="net-worth-badge">
            <span className="badge-label">Net Worth</span>
            {/* Using the live data from AccountContext and CurrencyContext */}
            <span className={`badge-amount ${netWorth < 0 ? 'negative' : ''}`}>
              {formatMoney(netWorth, currency.symbol, currency.subunitToUnit)}
            </span>
          </div>
        </div>

        <div className="navbar-right">
          <div className="user-menu">
            <div className="user-avatar">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <div className="user-info">
              <span className="user-name">{user?.firstName} {user?.lastName}</span>
              <button onClick={logout} className="logout-btn">Logout</button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;