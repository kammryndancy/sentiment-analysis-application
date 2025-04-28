import './Sidebar.css';
import toniqueLogo from '../../assets/tonique-light.svg';
import { useNavigate, useLocation } from 'react-router-dom';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { label: 'DASHBOARD', path: '/dashboard' },
    { label: 'MONITORING', path: '/monitoring' },
    { label: 'DATA', path: '/data' },
    { label: 'ENTITIES', path: '/entities' },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="flex-container">
          <img src={toniqueLogo} alt="Tonique Logo" className="sidebar-logo-img" />
          <span className="custom-font sidebar-logo-text">TONIQUE</span>
        </div>
      </div>
      <nav className="sidebar-nav">
        <ul>
          {navItems.map(item => (
            <li
              key={item.path}
              className={location.pathname.startsWith(item.path) ? 'active' : ''}
              onClick={() => navigate(item.path)}
              style={{ cursor: 'pointer' }}
            >
              {item.label}
            </li>
          ))}
        </ul>
      </nav>
      <div className="sidebar-bottom-actions">
        <span className="header-icon user"
          style={{ cursor: 'pointer' }}
          onClick={() => navigate('/account')}
          title="Account settings"
        ></span>
        <span
          className="header-icon settings"
          style={{ cursor: 'pointer' }}
          onClick={() => navigate('/settings')}
          title="Application Settings"
        ></span>
      </div>
    </aside>
  );
};

export default Sidebar;
