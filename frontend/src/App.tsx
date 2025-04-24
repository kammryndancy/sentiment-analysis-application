import Sidebar from './components/Sidebar';
import Header from './components/Header';
import AnalyticsPanel from './components/AnalyticsPanel';
import FiltersPanel from './components/FiltersPanel';
import FeedList from './components/FeedList';
import './App.css';

function App() {
  return (
    <div className="dashboard-app">
      <Sidebar />
      <div className="main-area">
        <Header />
        <div className="main-content">
          <AnalyticsPanel />
          <div className="main-row">
            <FeedList />
            <FiltersPanel />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
