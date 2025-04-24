import './Header.css';

const Header = () => (
  <header className="main-header">
    <div className="header-left">
      <span className="header-title">Today's Feeds</span>
      <select className="header-dropdown">
        <option>Today's Feeds</option>
        <option>Yesterday's Feeds</option>
      </select>
    </div>
    <div className="header-actions">
      <input className="header-search" placeholder="Quick Search" />
      <input className="header-search" placeholder="Search" />
      <button className="header-export">Export Feeds</button>
    </div>
  </header>
);

export default Header;
