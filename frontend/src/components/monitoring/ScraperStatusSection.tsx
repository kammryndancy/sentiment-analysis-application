import React from 'react';

const ScraperStatusSection: React.FC<{
  scraperStatus: any[];
  loading: boolean;
  error: string | null;
}> = ({ scraperStatus, loading, error }) => (
  <div>
    <h2>Facebook Scraper Status</h2>
    {loading ? (
      <div>Loading scraper status...</div>
    ) : error ? (
      <div style={{ color: 'red' }}>{error}</div>
    ) : (
      <table style={{ borderCollapse: 'collapse', width: '100%', marginBottom: 16 }}>
        <thead>
          <tr>
            <th style={{ border: '1px solid #ccc', padding: 8 }}>Page ID</th>
            <th style={{ border: '1px solid #ccc', padding: 8 }}>Name</th>
            <th style={{ border: '1px solid #ccc', padding: 8 }}>Last Scraped</th>
            <th style={{ border: '1px solid #ccc', padding: 8 }}>Added At</th>
          </tr>
        </thead>
        <tbody>
          {scraperStatus.length === 0 ? (
            <tr><td colSpan={4} style={{ textAlign: 'center', padding: 8 }}>No pages found.</td></tr>
          ) : (
            scraperStatus.map((page, idx) => (
              <tr key={page.pageId || idx}>
                <td style={{ border: '1px solid #ccc', padding: 8 }}>{page.pageId}</td>
                <td style={{ border: '1px solid #ccc', padding: 8 }}>{page.name}</td>
                <td style={{ border: '1px solid #ccc', padding: 8 }}>{page.lastScraped ? new Date(page.lastScraped).toLocaleString() : 'Never'}</td>
                <td style={{ border: '1px solid #ccc', padding: 8 }}>{page.addedAt ? new Date(page.addedAt).toLocaleString() : ''}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    )}
  </div>
);

export default ScraperStatusSection;
