import React from 'react';
import Sidebar from '../layout/Sidebar';
import Header from '../layout/Header';
import '../../App.css';

const DataPage: React.FC = () => (
  <div className="dashboard-app">
    <Sidebar />
    <div className="main-area">
      <Header title="Data" />
      <div className="main-content"></div>
    </div>
  </div>
);

export default DataPage;
