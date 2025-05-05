import React, { useCallback, useState } from 'react';
import Sidebar from '../layout/Sidebar';
import Header from '../layout/Header';
import AnalyticsPanel from './AnalyticsPanel';
import FiltersPanel from './FiltersPanel';
import FeedList from './FeedList';
import SentimentFilterPanel from './SentimentFilterPanel';
import SentimentOverTimeGraph from './SentimentOverTimeGraph';
import CommentSearchPanel from './CommentSearchPanel'; // Import the new component
import '../../App.css';
import './DashboardPage.css';

const DashboardPage: React.FC = () => {
  const [sentimentData, setSentimentData] = useState<Array<{ date: string; sentiment: number }>>([]);
  const [sentimentLabel, setSentimentLabel] = useState<string>('');

  const handleSentimentFilter = useCallback(async (filter: any) => {
    let query = '?';
    if (filter.keyword) query += `keyword=${encodeURIComponent(filter.keyword)}&`;
    if (filter.customWord) query += `customWord=${encodeURIComponent(filter.customWord)}&`;
    if (filter.pageId) query += `pageId=${encodeURIComponent(filter.pageId)}&`;
    if (filter.startDate) query += `startDate=${encodeURIComponent(filter.startDate)}&`;
    if (filter.endDate) query += `endDate=${encodeURIComponent(filter.endDate)}&`;
    query = query.endsWith('&') ? query.slice(0, -1) : query;
    const res = await fetch(`/api/sentiment-over-time${query}`);
    const data = await res.json();
    setSentimentData(data.data || []);
    setSentimentLabel(
      [
        filter.keyword ? `${filter.keyword}` : null,
        filter.customWord ? `${filter.customWord}` : null,
        filter.pageId ? `${filter.pageId}` : null
      ].filter(Boolean).join(', ') || ''
    );
  }, []);

  return (
    <div className="dashboard-app">
      <Sidebar />
      <div className="main-area">
        <Header showExport={false} showSearch={false}/>
        <div className="main-content">
          <AnalyticsPanel />
          <div className="sentiment-overtime-section">
            <h2>Sentiment Over Time</h2>
            <div className="sentiment-overtime-chart">
              <SentimentFilterPanel onFilter={handleSentimentFilter} />
              {sentimentData.length === 0 ? (
                <div style={{ color: '#aef4c2', textAlign: 'center', marginTop: 24, fontSize: '1.1rem' }}>
                  {sentimentLabel === 'Sentiment' ?
                    'Apply a filter to see sentiment data.' :
                    'No data found for the selected filter.'}
                </div>
              ) : (
                <SentimentOverTimeGraph data={sentimentData} label={sentimentLabel} />
              )}
            </div>
          </div>
          <CommentSearchPanel />
          <FeedList />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
