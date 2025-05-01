import React from 'react';
import './RunScraperSection.css';

interface Props {
  scraperRunLoading: boolean;
  scraperRunResult: string;
  scraperRunDaysBack: number;
  setScraperRunDaysBack: (n: number) => void;
  handleRunScraper: () => void;
}

const RunScraperSection: React.FC<Props> = ({
  scraperRunLoading,
  scraperRunResult,
  scraperRunDaysBack,
  setScraperRunDaysBack,
  handleRunScraper
}) => (
  <div className="runscraper-section">
    <h2>Run Facebook Scraper</h2>
    <form onSubmit={e => { e.preventDefault(); handleRunScraper(); }} className="form-row">
      <div className="form-label">
        <b>Days Back:</b>
        <input
          type="number"
          min={1}
          max={365}
          value={scraperRunDaysBack}
          onChange={e => setScraperRunDaysBack(Number(e.target.value))}
          disabled={scraperRunLoading}
          className="form-input"
        />
      </div>
      <button type="submit" disabled={scraperRunLoading} className="form-btn">
        {scraperRunLoading ? 'Starting Scraper...' : 'Start Scraper'}
      </button>
    </form>
    {scraperRunLoading && <div className="run-status">Running...</div>}
    {scraperRunResult && <div className={`run-status ${scraperRunResult.startsWith('Error') ? 'error' : 'success'}`}>{scraperRunResult}</div>}
  </div>
);

export default RunScraperSection;
