import React, { useEffect, useState } from 'react';
import Sidebar from '../layout/Sidebar';
import Header from '../layout/Header';
import PageIdSection from './PageIdSection';
import KeywordSection from './KeywordSection';
import '../../App.css';

interface PageIdRow {
  page_id: string;
  name?: string;
  description?: string;
  enabled: boolean;
  last_scraped?: string | null;
  added_at?: string | null;
  last_updated?: string | null;
}

interface KeywordRow {
  keyword: string;
  category?: string;
  description?: string;
  enabled: boolean;
  added_at?: string | null;
  last_updated?: string | null;
}

const DataPage: React.FC = () => {
  const [pages, setPages] = useState<PageIdRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editDesc, setEditDesc] = useState<{ [id: string]: string }>({});
  const [editName, setEditName] = useState<{ [id: string]: string }>({});
  const [editMode, setEditMode] = useState<{ [id: string]: boolean }>({});
  const [addPageId, setAddPageId] = useState('');
  const [addDesc, setAddDesc] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [keywords, setKeywords] = useState<KeywordRow[]>([]);
  const [kwLoading, setKwLoading] = useState(true);
  const [kwError, setKwError] = useState('');
  const [kwEdit, setKwEdit] = useState<{ [kw: string]: { description: string; category: string } }>({});
  const [kwEditMode, setKwEditMode] = useState<{ [kw: string]: boolean }>({});
  const [kwAdd, setKwAdd] = useState('');
  const [kwAddCategory, setKwAddCategory] = useState('');
  const [kwAddDesc, setKwAddDesc] = useState('');
  const [kwAddLoading, setKwAddLoading] = useState(false);
  const [kwActionLoading, setKwActionLoading] = useState<string | null>(null);

  const [pageSearch, setPageSearch] = useState('');
  const [keywordSearch, setKeywordSearch] = useState('');

  const PAGE_SIZE = 10;
  const [pagePage, setPagePage] = useState(1);
  const [keywordPage, setKeywordPage] = useState(1);

  const [pageSort, setPageSort] = useState<{ field: keyof PageIdRow; asc: boolean }>({ field: 'page_id', asc: true });
  const [keywordSort, setKeywordSort] = useState<{ field: keyof KeywordRow; asc: boolean }>({ field: 'keyword', asc: true });

  const sortFn = <T,>(arr: T[], field: keyof T, asc: boolean) => {
    return arr.slice().sort((a, b) => {
      const aVal = a[field];
      const bVal = b[field];
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return asc ? -1 : 1;
      if (bVal == null) return asc ? 1 : -1;
      if (typeof aVal === 'boolean' && typeof bVal === 'boolean') {
        return asc ? (aVal === bVal ? 0 : aVal ? 1 : -1) : (aVal === bVal ? 0 : aVal ? -1 : 1);
      }
      return asc
        ? String(aVal).localeCompare(String(bVal), undefined, { numeric: true })
        : String(bVal).localeCompare(String(aVal), undefined, { numeric: true });
    });
  };

  const filteredPages = pages.filter(
    p =>
      p.page_id.toLowerCase().includes(pageSearch.toLowerCase()) ||
      (p.name && p.name.toLowerCase().includes(pageSearch.toLowerCase())) ||
      (p.description && p.description.toLowerCase().includes(pageSearch.toLowerCase()))
  );
  const filteredKeywords = keywords.filter(
    k =>
      k.keyword.toLowerCase().includes(keywordSearch.toLowerCase()) ||
      (k.category && k.category.toLowerCase().includes(keywordSearch.toLowerCase())) ||
      (k.description && k.description.toLowerCase().includes(keywordSearch.toLowerCase()))
  );

  const sortedPages = sortFn(filteredPages, pageSort.field, pageSort.asc);
  const sortedKeywords = sortFn(filteredKeywords, keywordSort.field, keywordSort.asc);

  const pagedPages = sortedPages.slice((pagePage - 1) * PAGE_SIZE, pagePage * PAGE_SIZE);
  const pagedKeywords = sortedKeywords.slice((keywordPage - 1) * PAGE_SIZE, keywordPage * PAGE_SIZE);

  const pageCount = Math.ceil(sortedPages.length / PAGE_SIZE);
  const keywordCount = Math.ceil(sortedKeywords.length / PAGE_SIZE);

  const handlePageSort = (field: keyof PageIdRow) => {
    setPageSort(s => ({ field, asc: s.field === field ? !s.asc : true }));
  };
  const handleKeywordSort = (field: keyof KeywordRow) => {
    setKeywordSort(s => ({ field, asc: s.field === field ? !s.asc : true }));
  };

  useEffect(() => {
    fetchPages();
    fetchKeywords();
  }, []);

  const fetchPages = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/pages', { credentials: 'include' });
      const data = await res.json();
      if (res.ok && data.success) {
        setPages(data.data);
      } else {
        setError(data.error || 'Failed to fetch pages');
      }
    } catch (e) {
      setError('Server error');
    }
    setLoading(false);
  };

  const fetchKeywords = async () => {
    setKwLoading(true);
    setKwError('');
    try {
      const res = await fetch('/api/keywords', { credentials: 'include' });
      const data = await res.json();
      if (res.ok && data.success) {
        setKeywords(data.data);
      } else {
        setKwError(data.error || 'Failed to fetch keywords');
      }
    } catch (e) {
      setKwError('Server error');
    }
    setKwLoading(false);
  };

  const handleEnable = async (page_id: string, enabled: boolean) => {
    setActionLoading(page_id);
    try {
      const res = await fetch(`/api/pages/${encodeURIComponent(page_id)}/enabled`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ enabled: !enabled })
      });
      if (res.ok) {
        await fetchPages();
      } else {
        setError('Failed to update status');
      }
    } catch (e) {
      setError('Server error');
    }
    setActionLoading(null);
  };

  const handleEnableKeyword = async (keyword: string, enabled: boolean) => {
    setKwActionLoading(keyword);
    try {
      const res = await fetch(`/api/keywords/${encodeURIComponent(keyword)}/enabled`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ enabled: !enabled })
      });
      if (res.ok) {
        await fetchKeywords();
      } else {
        setKwError('Failed to update status');
      }
    } catch (e) {
      setKwError('Server error');
    }
    setKwActionLoading(null);
  };

  const handleEditDesc = (page_id: string, desc: string) => {
    setEditDesc(prev => ({ ...prev, [page_id]: desc }));
  };

  const handleEditKeyword = (keyword: string, field: 'description' | 'category', value: string) => {
    setKwEdit(prev => ({ ...prev, [keyword]: { ...prev[keyword], [field]: value } }));
  };

  const handleSaveDesc = async (page: PageIdRow) => {
    setActionLoading(page.page_id);
    try {
      const res = await fetch(`/api/pages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          page_id: page.page_id,
          name: editName[page.page_id] ?? page.name ?? page.page_id,
          description: editDesc[page.page_id] ?? page.description ?? ''
        })
      });
      if (res.ok) {
        setEditMode(prev => ({ ...prev, [page.page_id]: false }));
        await fetchPages();
      } else {
        setError('Failed to save description');
      }
    } catch (e) {
      setError('Server error');
    }
    setActionLoading(null);
  };

  const handleSaveKeyword = async (kw: KeywordRow) => {
    setKwActionLoading(kw.keyword);
    try {
      const res = await fetch(`/api/keywords`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          keyword: kw.keyword,
          category: kwEdit[kw.keyword]?.category ?? kw.category ?? '',
          description: kwEdit[kw.keyword]?.description ?? kw.description ?? ''
        })
      });
      if (res.ok) {
        setKwEditMode(prev => ({ ...prev, [kw.keyword]: false }));
        await fetchKeywords();
      } else {
        setKwError('Failed to save keyword');
      }
    } catch (e) {
      setKwError('Server error');
    }
    setKwActionLoading(null);
  };

  const handleAddPage = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddLoading(true);
    setError('');
    try {
      const res = await fetch('/api/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          page_id: addPageId,
          name: addPageId,
          description: addDesc
        })
      });
      if (res.ok) {
        setAddPageId('');
        setAddDesc('');
        await fetchPages();
      } else {
        setError('Failed to add page');
      }
    } catch (e) {
      setError('Server error');
    }
    setAddLoading(false);
  };

  const handleAddKeyword = async (e: React.FormEvent) => {
    e.preventDefault();
    setKwAddLoading(true);
    setKwError('');
    try {
      const res = await fetch('/api/keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          keyword: kwAdd,
          category: kwAddCategory,
          description: kwAddDesc
        })
      });
      if (res.ok) {
        setKwAdd('');
        setKwAddCategory('');
        setKwAddDesc('');
        await fetchKeywords();
      } else {
        setKwError('Failed to add keyword');
      }
    } catch (e) {
      setKwError('Server error');
    }
    setKwAddLoading(false);
  };

  const handleDeletePage = async (page_id: string) => {
    if (!window.confirm('Are you sure you want to delete this page?')) return;
    setActionLoading(page_id);
    setError('');
    try {
      const res = await fetch(`/api/pages/${encodeURIComponent(page_id)}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) {
        await fetchPages();
      } else {
        setError('Failed to delete page');
      }
    } catch (e) {
      setError('Server error');
    }
    setActionLoading(null);
  };

  const handleDeleteKeyword = async (keyword: string) => {
    if (!window.confirm('Are you sure you want to delete this keyword?')) return;
    setKwActionLoading(keyword);
    setKwError('');
    try {
      const res = await fetch(`/api/keywords/${encodeURIComponent(keyword)}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) {
        await fetchKeywords();
      } else {
        setKwError('Failed to delete keyword');
      }
    } catch (e) {
      setKwError('Server error');
    }
    setKwActionLoading(null);
  };

  return (
    <div className="dashboard-app">
      <Sidebar />
      <div className="main-area">
        <Header title="Data" />
        <div className="main-content">
          <PageIdSection
            pageSearch={pageSearch}
            setPageSearch={setPageSearch}
            loading={loading}
            error={error}
            pagedPages={pagedPages}
            pageSort={pageSort}
            handlePageSort={handlePageSort}
            editMode={editMode}
            editName={editName}
            setEditName={setEditName}
            editDesc={editDesc}
            handleEditDesc={handleEditDesc}
            actionLoading={actionLoading}
            handleEnable={handleEnable}
            handleSaveDesc={handleSaveDesc}
            setEditMode={setEditMode}
            handleDeletePage={handleDeletePage}
            pagePage={pagePage}
            pageCount={pageCount}
            setPagePage={setPagePage}
            addPageId={addPageId}
            setAddPageId={setAddPageId}
            addDesc={addDesc}
            setAddDesc={setAddDesc}
            addLoading={addLoading}
            handleAddPage={handleAddPage}
          />
          <KeywordSection
            keywordSearch={keywordSearch}
            setKeywordSearch={setKeywordSearch}
            kwLoading={kwLoading}
            kwError={kwError}
            pagedKeywords={pagedKeywords}
            keywordSort={keywordSort}
            handleKeywordSort={handleKeywordSort}
            kwEditMode={kwEditMode}
            kwEdit={kwEdit}
            handleEditKeyword={handleEditKeyword}
            kwActionLoading={kwActionLoading}
            handleEnableKeyword={handleEnableKeyword}
            handleSaveKeyword={handleSaveKeyword}
            setKwEditMode={setKwEditMode}
            handleDeleteKeyword={handleDeleteKeyword}
            keywordPage={keywordPage}
            keywordCount={keywordCount}
            setKeywordPage={setKeywordPage}
            kwAdd={kwAdd}
            setKwAdd={setKwAdd}
            kwAddCategory={kwAddCategory}
            setKwAddCategory={setKwAddCategory}
            kwAddDesc={kwAddDesc}
            setKwAddDesc={setKwAddDesc}
            kwAddLoading={kwAddLoading}
            handleAddKeyword={handleAddKeyword}
          />
        </div>
      </div>
    </div>
  );
};

export default DataPage;
