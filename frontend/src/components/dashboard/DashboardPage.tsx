import React from 'react';
import Sidebar from '../layout/Sidebar';
import Header from '../layout/Header';
import AnalyticsPanel from './AnalyticsPanel';
import FiltersPanel from './FiltersPanel';
import FeedList from './FeedList';
import '../../App.css';

const DashboardPage: React.FC = () => {
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
};

export default DashboardPage;
