import React, { useState, useMemo } from 'react';
import './ScraperStatsSection.css';

const PAGE_SIZE = 5;

const ScraperStatsSection: React.FC<{ scraperStats: any }> = ({ scraperStats }) => {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<'pageId' | 'count'>('pageId');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(0);

  const commentsPerPage = scraperStats.commentsPerPage || [];
  const pageIds = scraperStats.pageIds || [];

  // Map page_id to name for lookup
  const pageIdToName: Record<string, string> = {};
  pageIds.forEach((p: any) => {
    if (p.page_id) pageIdToName[p.page_id] = p.name || p.page_id;
  });

  const filtered = useMemo(() => {
    let data = commentsPerPage;
    if (search) {
      data = data.filter((row: any) =>
        row._id.toLowerCase().includes(search.toLowerCase()) ||
        (pageIdToName[row._id] && pageIdToName[row._id].toLowerCase().includes(search.toLowerCase()))
      );
    }
    data = [...data].sort((a: any, b: any) => {
      if (sortKey === 'pageId') {
        return sortDir === 'asc'
          ? a._id.localeCompare(b._id)
          : b._id.localeCompare(a._id);
      } else {
        return sortDir === 'asc' ? a.count - b.count : b.count - a.count;
      }
    });
    return data;
  }, [commentsPerPage, search, sortKey, sortDir, pageIdToName]);

  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const numPages = Math.ceil(filtered.length / PAGE_SIZE);

  return (
    <div className="scraperstats-section">
      <h2>Scraper Stats</h2>
      <div className="scraperstats-badges">
        <span className="scraperstats-badge stats-comments">Comments: {scraperStats.totalProcessedComments}</span>
        <span className="scraperstats-badge stats-posts">Posts: {scraperStats.totalProcessedPosts}</span>
        <span className="scraperstats-badge stats-pages">Total Pages: {scraperStats.totalPages}</span>
      </div>
      <h3>Comments Per Page</h3>
      {commentsPerPage.length > PAGE_SIZE && (
        <div className="scraperstats-table-controls">
          <input
            className="scraperstats-search input-field"
            type="text"
            placeholder="Search Page ID or Name..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }}
          />
        </div>
      )}
      <table>
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
            <th>Name</th>
            <th
              className="sortable"
              onClick={() => {
                if (sortKey === 'count') setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
                setSortKey('count');
              }}
            >
              Comments {sortKey === 'count' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
            </th>
          </tr>
        </thead>
        <tbody>
          {paged.map((row: any) => (
            <tr key={row._id}>
              <td>{row._id}</td>
              <td>{pageIdToName[row._id] || row._id}</td>
              <td>{row.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {commentsPerPage.length > PAGE_SIZE && (
        <div className="scraperstats-pagination">
          <button
            className="scraperstats-page-btn"
            onClick={() => setPage(page - 1)}
            disabled={page === 0}
          >
            Prev
          </button>
          <span className="scraperstats-page-info">
            Page {page + 1} of {numPages}
          </span>
          <button
            className="scraperstats-page-btn"
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

export default ScraperStatsSection;
