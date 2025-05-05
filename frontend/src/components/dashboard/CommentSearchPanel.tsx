import React, { useEffect, useState } from 'react';
import './CommentSearchPanel.css';

interface Comment {
  _id: string;
  message: string;
  matched_keywords: string[];
  tokens: string[];
  page_id: string;
  created_time: string;
  source: 'post' | 'comment';
  weighted_sentiment?: number;
}

interface CommentSearchPanelProps {}

const PAGE_SIZE = 10;

const CommentSearchPanel: React.FC<CommentSearchPanelProps> = () => {
  const [keywords, setKeywords] = useState<string[]>([]);
  const [pendingKeyword, setPendingKeyword] = useState('');
  const [pendingSearchWord, setPendingSearchWord] = useState('');
  const [selectedKeyword, setSelectedKeyword] = useState('');
  const [searchWord, setSearchWord] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [sortField, setSortField] = useState<'created_time' | 'page_id'>('created_time');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [loading, setLoading] = useState(false);
  const [triggerSearch, setTriggerSearch] = useState(0);

  useEffect(() => {
    fetch('/api/keywords')
    .then(res => res.json())
    .then(data => {
      // Defensive: handle both array and wrapped object (success/data)
      let keywords: any[] = [];
      if (Array.isArray(data)) {
        keywords = data;
      } else if (data && Array.isArray(data.data)) {
        keywords = data.data;
      }
      setKeywords(keywords.map((k: any) => k.keyword || k.name || k));
    });
  }, []);

  useEffect(() => {
    if (triggerSearch === 0) return;
    setLoading(true);
    const params = new URLSearchParams({
      keyword: selectedKeyword,
      searchWord,
      page: String(page),
      pageSize: String(PAGE_SIZE),
      sortField,
      sortOrder
    });
    fetch(`/api/data-processor/search-comments?${params.toString()}`)
      .then(res => res.json())
      .then(data => {
        setComments(data.comments || []);
        setTotal(data.total || 0);
        setLoading(false);
      });
  }, [selectedKeyword, searchWord, page, sortField, sortOrder, triggerSearch]);

  const handleSearch = () => {
    setSelectedKeyword(pendingKeyword);
    setSearchWord(pendingSearchWord);
    setPage(1);
    setTriggerSearch(triggerSearch + 1);
  };

  return (
    <div className="comment-search-panel">
      <h2>Comment Search</h2>
      <div className="search-controls">
        <label>Keyword:</label>
        <select value={pendingKeyword} onChange={e => setPendingKeyword(e.target.value)}>
          <option value="">-- Select --</option>
          {keywords.map(k => <option key={k} value={k}>{k}</option>)}
        </select>
        <label>Or Search Word:</label>
        <input type="text" value={pendingSearchWord} onChange={e => setPendingSearchWord(e.target.value)} placeholder="Type a word..." />
        <button className="search-btn" onClick={handleSearch} disabled={loading} style={{marginLeft: 16}}>Search</button>
      </div>
      <div className="table-wrapper">
        {loading ? <div className="loading">Loading...</div> : (
          <table className="comment-table">
            <thead>
              <tr>
                <th onClick={() => { setSortField('created_time'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }}>
                  Date {sortField === 'created_time' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                </th>
                <th>Source</th>
                <th>Sentiment</th>
                <th>Page ID</th>
                <th>Message</th>
              </tr>
            </thead>
            <tbody>
              {comments.map(c => (
                <tr key={c._id}>
                  <td>{new Date(c.created_time).toLocaleString()}</td>
                  <td>{c.source}</td>
                  <td>{c.weighted_sentiment !== undefined ? c.weighted_sentiment.toFixed(1) : ''}</td>
                  <td>{c.page_id}</td>
                  <td>{c.message}</td>
                </tr>
              ))}
              {comments.length === 0 && (
                <tr><td colSpan={4} style={{ textAlign: 'center', color: '#aaa' }}>No results found.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
      <div className="pagination">
        <button onClick={() => setPage(page - 1)} disabled={page === 1}>Prev</button>
        <span>Page {page} of {Math.ceil(total / PAGE_SIZE) || 1}</span>
        <button onClick={() => setPage(page + 1)} disabled={page * PAGE_SIZE >= total}>Next</button>
      </div>
    </div>
  );
};

export default CommentSearchPanel;
