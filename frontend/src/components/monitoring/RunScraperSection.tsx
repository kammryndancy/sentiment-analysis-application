import React from 'react';

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
  <div style={{ marginBottom: 40 }}>
    <h2>Run Facebook Scraper</h2>
    <form style={{ marginBottom: 10 }} onSubmit={e => { e.preventDefault(); handleRunScraper(); }}>
      <div style={{ marginBottom: 8 }}>
        <label>
          <b>Days Back:</b>
          <input
            type="number"
            min={1}
            max={365}
            value={scraperRunDaysBack}
            onChange={e => setScraperRunDaysBack(Number(e.target.value))}
            disabled={scraperRunLoading}
            style={{ width: 80, marginLeft: 8 }}
          />
        </label>
      </div>
      <button type="submit" disabled={scraperRunLoading} style={{ marginBottom: 10 }}>
        {scraperRunLoading ? 'Starting Scraper...' : 'Start Scraper'}
      </button>
    </form>
    {scraperRunResult && <div style={{ color: scraperRunResult.startsWith('Error') ? 'red' : 'green' }}>{scraperRunResult}</div>}
  </div>
);

export default RunScraperSection;
