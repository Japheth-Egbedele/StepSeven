// src/components/Layout/Sidebar.jsx
import { NavLink } from 'react-router-dom';
import '../../styles/Sidebar.css';

const Sidebar = () => {
  const menuItems = [
    { path: '/dashboard', icon: '📊', label: 'Dashboard' },
    { path: '/accounts', icon: '🏦', label: 'Accounts' },
    { path: '/transactions', icon: '💸', label: 'Transactions' },
    { path: '/budgets', icon: '📋', label: 'Budgets' },
    { path: '/babysteps', icon: '🎯', label: 'Baby Steps' },
    { path: '/analytics', icon: '📈', label: 'Analytics' },
    { path: '/settings', icon: '⚙️', label: 'Settings' }
  ];

  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        {menuItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <span className="sidebar-icon">{item.icon}</span>
            <span className="sidebar-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;