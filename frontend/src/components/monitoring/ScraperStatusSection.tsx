import React, { useState, useMemo } from 'react';
import './ScraperStatusSection.css';

const PAGE_SIZE = 5;

const ScraperStatusSection: React.FC<{
  scraperStatus: any[];
  loading: boolean;
  error: string | null;
}> = ({ scraperStatus, loading, error }) => {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<'pageId' | 'name' | 'lastScraped' | 'addedAt'>('pageId');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    let data = scraperStatus;
    if (search) {
      data = data.filter((row: any) =>
        row.pageId?.toLowerCase().includes(search.toLowerCase()) ||
        row.name?.toLowerCase().includes(search.toLowerCase())
      );
    }
    data = [...data].sort((a: any, b: any) => {
      if (sortKey === 'pageId') {
        return sortDir === 'asc'
          ? (a.pageId || '').localeCompare(b.pageId || '')
          : (b.pageId || '').localeCompare(a.pageId || '');
      } else if (sortKey === 'name') {
        return sortDir === 'asc'
          ? (a.name || '').localeCompare(b.name || '')
          : (b.name || '').localeCompare(a.name || '');
      } else if (sortKey === 'lastScraped') {
        return sortDir === 'asc'
          ? new Date(a.lastScraped || 0).getTime() - new Date(b.lastScraped || 0).getTime()
          : new Date(b.lastScraped || 0).getTime() - new Date(a.lastScraped || 0).getTime();
      } else if (sortKey === 'addedAt') {
        return sortDir === 'asc'
          ? new Date(a.addedAt || 0).getTime() - new Date(b.addedAt || 0).getTime()
          : new Date(b.addedAt || 0).getTime() - new Date(a.addedAt || 0).getTime();
      }
      return 0;
    });
    return data;
  }, [scraperStatus, search, sortKey, sortDir]);

  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const numPages = Math.ceil(filtered.length / PAGE_SIZE);

  return (
    <div className="scraperstatus-section">
      <h2>Facebook Scraper Status</h2>
      {scraperStatus.length > PAGE_SIZE && (
        <div className="scraperstatus-table-controls">
          <input
            className="scraperstatus-search input-field"
            type="text"
            placeholder="Search Page ID or Name..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }}
          />
        </div>
      )}
      {loading ? (
        <div className="monitoring-loading">Loading scraper status...</div>
      ) : error ? (
        <div className="monitoring-error">{error}</div>
      ) : (
        <table className="scraperstatus-table">
          <thead>
            <tr>
              <th
                className="sortable"
                onClick={() => {
                  if (sortKey === 'pageId') setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
                  setSortKey('pageId');
                }}
              >
                Page ID {sortKey === 'pageId' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
              </th>
              <th
                className="sortable"
                onClick={() => {
                  if (sortKey === 'name') setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
                  setSortKey('name');
                }}
              >
                Name {sortKey === 'name' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
              </th>
              <th
                className="sortable"
                onClick={() => {
                  if (sortKey === 'lastScraped') setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
                  setSortKey('lastScraped');
                }}
              >
                Last Scraped {sortKey === 'lastScraped' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
              </th>
              <th
                className="sortable"
                onClick={() => {
                  if (sortKey === 'addedAt') setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
                  setSortKey('addedAt');
                }}
              >
                Added At {sortKey === 'addedAt' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={4} className="scraperstatus-empty">No pages found.</td></tr>
            ) : (
              paged.map((page, idx) => (
                <tr key={page.pageId || idx}>
                  <td>{page.pageId}</td>
                  <td>{page.name}</td>
                  <td>{page.lastScraped ? new Date(page.lastScraped).toLocaleString() : 'Never'}</td>
                  <td>{page.addedAt ? new Date(page.addedAt).toLocaleString() : ''}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
      {scraperStatus.length > PAGE_SIZE && (
        <div className="scraperstatus-pagination">
          <button
            className="scraperstatus-page-btn"
            onClick={() => setPage(page - 1)}
            disabled={page === 0}
          >
            Prev
          </button>
          <span className="scraperstatus-page-info">
            Page {page + 1} of {numPages}
          </span>
          <button
            className="scraperstatus-page-btn"
            onClick={() => setPage(page + 1)}
            disabled={page >= numPages - 1}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default ScraperStatusSection;
