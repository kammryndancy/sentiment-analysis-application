import './AnalyticsPanel.css';

const AnalyticsPanel = () => {
  return (
    <section className="analytics-panel">
    <div className="analytics-chart">
      <div className="chart-title">Real-Time Polarity</div>
      <div className="chart-placeholder">[Chart Here]</div>
    </div>
    <div className="analytics-hot-topics">
      <div className="chart-title">Hot Topics</div>
      <div className="wordcloud-placeholder">[Word Cloud]</div>
    </div>
    <div className="analytics-top-pages">
      <div className="chart-title">Top Pages</div>
      <div className="top-pages-placeholder">[Avatars]</div>
    </div>
  </section>
  );
};

export default AnalyticsPanel;
