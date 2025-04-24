import './Sidebar.css';
import toniqueLogo from '../assets/tonique-light.svg';

const Sidebar = () => (
  <aside className="sidebar">
    <div className="sidebar-logo">
      <div className="flex-container">
        <img src={toniqueLogo} alt="Tonique Logo" className="sidebar-logo-img" />
        <span className="custom-font sidebar-logo-text">TONIQUE</span>
      </div>
    </div>
    <nav className="sidebar-nav">
      <ul>
        <li className="active">DASHBOARD</li>
        <li>MONITORING</li>
        <li>DATA</li>
        <li>ENTITIES</li>
      </ul>
    </nav>
    <div className="sidebar-bottom-actions">
      <span className="header-icon user"></span>
      <span className="header-icon settings"></span>
    </div>
  </aside>
);

export default Sidebar;
