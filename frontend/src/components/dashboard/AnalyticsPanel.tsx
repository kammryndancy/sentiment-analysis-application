import './AnalyticsPanel.css';
import React, { useEffect, useState } from 'react';
import SimpleWordCloud from '../visualizations/SimpleWordCloud';

const AnalyticsPanel = () => {
  const [wordCloud, setWordCloud] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWordCloud = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/data-processor/posts/wordcloud');
        const json = await res.json();
        if (json.success && json.data) {
          setWordCloud(json.data);
        } else {
          setError('No word cloud data');
        }
      } catch (e) {
        setError('Failed to fetch word cloud');
      }
      setLoading(false);
    };
    fetchWordCloud();
  }, []);

  return (
    <section className="analytics-panel">
      {/* <div className="analytics-chart">
        <div className="chart-title">Real-Time Polarity</div>
        <div className="chart-placeholder">[Chart Here]</div>
      </div> */}
      <div className="analytics-hot-topics-section">
        <h2>Hot Topics</h2>
        <div className="analytics-hot-topics-chart">
          {loading ? (
            <div className="analytics-hot-topics-loading">Loading word cloud...</div>
          ) : error ? (
            <div className="analytics-hot-topics-error">{error}</div>
          ) : (
            <SimpleWordCloud words={wordCloud} width={900} height={350} />
          )}
        </div>
      </div>
      {/* <div className="analytics-top-pages">
        <div className="chart-title">Top Pages</div>
        <div className="top-pages-placeholder">[Avatars]</div>
      </div> */}
    </section>
  );
};

export default AnalyticsPanel;
