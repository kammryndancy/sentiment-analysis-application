import React, { useEffect, useState } from 'react';
import Sidebar from '../layout/Sidebar';
import Header from '../layout/Header';
import '../../App.css';

const MonitoringPage: React.FC = () => {
  const [scraperStats, setScraperStats] = useState<any>(null);
  const [dataProcessorStats, setDataProcessorStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError('');
      try {
        const [scraperRes, processorRes] = await Promise.all([
          fetch('/api/scraper/stats', { credentials: 'include' }),
          fetch('/api/data-processor/stats', { credentials: 'include' })
        ]);
        const scraperData = await scraperRes.json();
        const processorData = await processorRes.json();
        if (!scraperData.success) throw new Error(scraperData.message || 'Failed to load scraper stats');
        if (!processorData.success) throw new Error(processorData.message || 'Failed to load processor stats');
        setScraperStats(scraperData);
        setDataProcessorStats(processorData);
      } catch (e: any) {
        setError(e.message || 'Failed to load stats');
      }
      setLoading(false);
    };
    fetchStats();
  }, []);

  return (
    <div className="dashboard-app">
      <Sidebar />
      <div className="main-area">
        <Header title="Monitoring" />
        <div className="main-content">
          {loading ? <div>Loading statistics...</div> : error ? <div style={{ color: 'red' }}>{error}</div> : (
            <div>
              <h2>Scraper Stats</h2>
              <ul>
                <li><b>Total Comments:</b> {scraperStats.totalComments}</li>
                <li><b>Total Posts:</b> {scraperStats.totalPosts}</li>
                <li><b>Total Pages:</b> {scraperStats.totalPages}</li>
              </ul>
              <h3>Comments Per Page</h3>
              <table className="table table-striped">
                <thead><tr><th>Page ID</th><th>Comments</th></tr></thead>
                <tbody>
                  {scraperStats.commentsPerPage?.map((row: any) => (
                    <tr key={row._id}><td>{row._id}</td><td>{row.count}</td></tr>
                  ))}
                </tbody>
              </table>
              <h3>Comments Over Time (by Month)</h3>
              {/* You may want to add a chart here in the future */}
              <ul>
                {scraperStats.commentsOverTime?.map((row: any) => (
                  <li key={row._id}>{row._id}: {row.count}</li>
                ))}
              </ul>

              <h2>Data Processor Stats</h2>
              <ul>
                {dataProcessorStats.data && Object.entries(dataProcessorStats.data).map(([key, value]) => (
                  <li key={key}><b>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:</b> {String(value)}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MonitoringPage;
