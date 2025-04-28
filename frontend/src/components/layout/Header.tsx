import React from 'react';
import { useAuth } from '../../auth';
import { useNavigate } from 'react-router-dom';
import './Header.css';

interface HeaderProps {
  title?: string;
  showSearch?: boolean;
  showExport?: boolean;
}

const Header: React.FC<HeaderProps> = ({ title, showSearch = true, showExport = true }) => {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header className="main-header">
      <div className="header-left">
        <span className="header-title">{title || "Today's Feeds"}</span>
        {!title && showSearch && (
          <select className="header-dropdown">
            <option>Today's Feeds</option>
            <option>Yesterday's Feeds</option>
          </select>
        )}
      </div>
      <div className="header-actions">
        {showSearch && (
          <>
            <input className="header-search" placeholder="Quick Search" />
            <input className="header-search" placeholder="Search" />
          </>
        )}
        {showExport && (
          <button className="header-export">Export Feeds</button>
        )}
        {isAuthenticated && (
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;
