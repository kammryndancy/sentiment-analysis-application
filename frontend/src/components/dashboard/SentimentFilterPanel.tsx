import React, { useEffect, useState } from 'react';
import './SentimentFilterPanel.css';

interface SentimentFilterPanelProps {
  onFilter: (filter: SentimentFilter) => void;
}

export interface SentimentFilter {
  keyword?: string;
  customWord?: string;
  pageId?: string;
  startDate?: string;
  endDate?: string;
}

const SentimentFilterPanel: React.FC<SentimentFilterPanelProps> = ({ onFilter }) => {
  const [keywords, setKeywords] = useState<string[]>([]);
  const [pageIds, setPageIds] = useState<string[]>([]);
  const [selectedKeyword, setSelectedKeyword] = useState<string>('');
  const [selectedPageId, setSelectedPageId] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [customWord, setCustomWord] = useState<string>('');

  // Fetch keywords and pageIds from backend
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
    fetch('/api/pages')
      .then(res => res.json())
      .then(data => {
        // Defensive: handle both array and wrapped object (success/data)
        let pages: any[] = [];
        if (Array.isArray(data)) {
          pages = data;
        } else if (data && Array.isArray(data.data)) {
          pages = data.data;
        }
        setPageIds(pages.map((p: any) => p.pageId || p.page_id || p.id || p.name || p));
      });
  }, []);

  const handleApply = () => {
    onFilter({
      keyword: selectedKeyword,
      customWord: customWord.trim(),
      pageId: selectedPageId,
      startDate,
      endDate
    });
  };

  return (
    <div className="sentiment-filter-panel">
      <h3>Filter</h3>
      <div className="filter-row">
        <label>Keyword:</label>
        <select value={selectedKeyword} onChange={e => setSelectedKeyword(e.target.value)}>
          <option value="">-- Select --</option>
          {keywords.map(k => <option key={k} value={k}>{k}</option>)}
        </select>
      </div>
      <div className="filter-row">
        <label>Custom Word:</label>
        <input type="text" value={customWord} onChange={e => setCustomWord(e.target.value)} placeholder="Type a word..." />
      </div>
      <div className="filter-row">
        <label>Page ID:</label>
        <select value={selectedPageId} onChange={e => setSelectedPageId(e.target.value)}>
          <option value="">-- Select --</option>
          {pageIds.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>
      <div className="filter-row">
        <label>Date Range:</label>
        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
        <span>to</span>
        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
      </div>
      <button onClick={handleApply}>Apply Filter</button>
    </div>
  );
};

export default SentimentFilterPanel;
