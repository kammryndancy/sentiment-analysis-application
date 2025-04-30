import React from 'react';

interface KeywordRow {
  keyword: string;
  category?: string;
  description?: string;
  enabled: boolean;
  added_at?: string | null;
  last_updated?: string | null;
}

interface Props {
  keywordSearch: string;
  setKeywordSearch: (s: string) => void;
  kwLoading: boolean;
  kwError: string;
  pagedKeywords: KeywordRow[];
  keywordSort: { field: keyof KeywordRow; asc: boolean };
  handleKeywordSort: (field: keyof KeywordRow) => void;
  kwEditMode: { [kw: string]: boolean };
  kwEdit: { [kw: string]: { description: string; category: string } };
  handleEditKeyword: (keyword: string, field: 'description' | 'category', value: string) => void;
  kwActionLoading: string | null;
  handleEnableKeyword: (keyword: string, enabled: boolean) => void;
  handleSaveKeyword: (kw: KeywordRow) => void;
  setKwEditMode: React.Dispatch<React.SetStateAction<{ [kw: string]: boolean }>>;
  handleDeleteKeyword: (keyword: string) => void;
  keywordPage: number;
  keywordCount: number;
  setKeywordPage: (n: number) => void;
  kwAdd: string;
  setKwAdd: (s: string) => void;
  kwAddCategory: string;
  setKwAddCategory: (s: string) => void;
  kwAddDesc: string;
  setKwAddDesc: (s: string) => void;
  kwAddLoading: boolean;
  handleAddKeyword: (e: React.FormEvent) => void;
}

const KeywordSection: React.FC<Props> = ({
  keywordSearch, setKeywordSearch, kwLoading, kwError, pagedKeywords, keywordSort, handleKeywordSort, kwEditMode, kwEdit, handleEditKeyword, kwActionLoading, handleEnableKeyword, handleSaveKeyword, setKwEditMode, handleDeleteKeyword, keywordPage, keywordCount, setKeywordPage, kwAdd, setKwAdd, kwAddCategory, setKwAddCategory, kwAddDesc, setKwAddDesc, kwAddLoading, handleAddKeyword
}) => (
  <div>
    <h2>Keywords</h2>
    <div style={{ marginBottom: 12 }}>
      <input
        type="text"
        placeholder="Search keywords, categories, or descriptions..."
        value={keywordSearch}
        onChange={e => setKeywordSearch(e.target.value)}
        style={{ padding: 8, width: 320 }}
      />
    </div>
    {kwLoading ? (
      <div>Loading...</div>
    ) : kwError ? (
      <div style={{ color: 'red' }}>{kwError}</div>
    ) : (
      <div style={{ overflowX: 'auto', marginBottom: 32 }}>
        <table className="table table-striped">
          <thead>
            <tr>
              <th style={{ cursor: 'pointer' }} onClick={() => handleKeywordSort('keyword')}>Keyword {keywordSort.field === 'keyword' ? (keywordSort.asc ? '▲' : '▼') : ''}</th>
              <th style={{ cursor: 'pointer' }} onClick={() => handleKeywordSort('category')}>Category {keywordSort.field === 'category' ? (keywordSort.asc ? '▲' : '▼') : ''}</th>
              <th style={{ cursor: 'pointer' }} onClick={() => handleKeywordSort('description')}>Description {keywordSort.field === 'description' ? (keywordSort.asc ? '▲' : '▼') : ''}</th>
              <th style={{ cursor: 'pointer' }} onClick={() => handleKeywordSort('enabled')}>Enabled {keywordSort.field === 'enabled' ? (keywordSort.asc ? '▲' : '▼') : ''}</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pagedKeywords.map(kw => (
              <tr key={kw.keyword}>
                <td>{kw.keyword}</td>
                <td>
                  {kwEditMode[kw.keyword] ? (
                    <input
                      type="text"
                      value={kwEdit[kw.keyword]?.category ?? kw.category ?? ''}
                      onChange={e => handleEditKeyword(kw.keyword, 'category', e.target.value)}
                      style={{ width: 120 }}
                    />
                  ) : (
                    kw.category || ''
                  )}
                </td>
                <td>
                  {kwEditMode[kw.keyword] ? (
                    <input
                      type="text"
                      value={kwEdit[kw.keyword]?.description ?? kw.description ?? ''}
                      onChange={e => handleEditKeyword(kw.keyword, 'description', e.target.value)}
                      style={{ width: 220 }}
                    />
                  ) : (
                    kw.description || ''
                  )}
                </td>
                <td>
                  <button
                    className={kw.enabled ? 'primary-btn' : 'secondary-btn'}
                    style={{ minWidth: 90 }}
                    disabled={kwActionLoading === kw.keyword}
                    onClick={() => handleEnableKeyword(kw.keyword, kw.enabled)}
                  >
                    {kw.enabled ? 'Enabled' : 'Disabled'}
                  </button>
                </td>
                <td>
                  {kwEditMode[kw.keyword] ? (
                    <>
                      <button
                        className="primary-btn"
                        style={{ marginRight: 8 }}
                        disabled={kwActionLoading === kw.keyword}
                        onClick={() => handleSaveKeyword(kw)}
                      >
                        Save
                      </button>
                      <button
                        className="secondary-btn"
                        onClick={() => setKwEditMode(prev => ({ ...prev, [kw.keyword]: false }))}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        className="secondary-btn"
                        style={{ marginRight: 8 }}
                        onClick={() => setKwEditMode(prev => ({ ...prev, [kw.keyword]: true }))}
                      >
                        Edit
                      </button>
                      <button
                        className="danger-btn"
                        disabled={kwActionLoading === kw.keyword}
                        onClick={() => handleDeleteKeyword(kw.keyword)}
                      >
                        Delete
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
          <button className="secondary-btn" disabled={keywordPage === 1} onClick={() => setKeywordPage((p: number) => Math.max(1, p - 1))}>Prev</button>
          <span>Page {keywordPage} of {keywordCount}</span>
          <button className="secondary-btn" disabled={keywordPage === keywordCount || keywordCount === 0} onClick={() => setKeywordPage((p: number) => Math.min(keywordCount, p + 1))}>Next</button>
        </div>
      </div>
    )}
    <form onSubmit={handleAddKeyword} style={{ marginBottom: 32, display: 'flex', gap: 12, alignItems: 'center' }}>
      <input
        type="text"
        placeholder="New Keyword"
        value={kwAdd}
        onChange={e => setKwAdd(e.target.value)}
        required
        style={{ width: 140 }}
      />
      <input
        type="text"
        placeholder="Category (optional)"
        value={kwAddCategory}
        onChange={e => setKwAddCategory(e.target.value)}
        style={{ width: 120 }}
      />
      <input
        type="text"
        placeholder="Description (optional)"
        value={kwAddDesc}
        onChange={e => setKwAddDesc(e.target.value)}
        style={{ width: 220 }}
      />
      <button className="primary-btn" type="submit" disabled={kwAddLoading}>
        Add Keyword
      </button>
    </form>
  </div>
);

export default KeywordSection;
