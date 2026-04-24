import { NavLink } from 'react-router-dom';
import '../../styles/MobileNav.css';

const MobileNav = () => {
  const items = [
    { path: '/dashboard', label: 'Home', icon: '🏠' },
    { path: '/accounts', label: 'Accounts', icon: '🏦' },
    { path: '/transactions', label: 'Txns', icon: '💸' },
    { path: '/budgets', label: 'Budgets', icon: '📋' },
    { path: '/settings', label: 'Settings', icon: '⚙️' }
  ];

  return (
    <nav className="mobile-nav" aria-label="Primary navigation">
      {items.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}
        >
          <span className="mobile-nav-icon" aria-hidden="true">{item.icon}</span>
          <span className="mobile-nav-label">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
};

export default MobileNav;
