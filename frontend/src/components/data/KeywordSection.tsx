import React from 'react';
import './DataPage.css';

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
  keywords: KeywordRow[];
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
  kwAdd: string;
  setKwAdd: (s: string) => void;
  kwAddCategory: string;
  setKwAddCategory: (s: string) => void;
  kwAddDesc: string;
  setKwAddDesc: (s: string) => void;
  kwAddLoading: boolean;
  handleAddKeyword: (e: React.FormEvent) => void;
  onRefresh: () => void;
}

const KeywordSection: React.FC<Props> = ({
  keywordSearch, setKeywordSearch, kwLoading, kwError, keywords, keywordSort, handleKeywordSort, kwEditMode, kwEdit, handleEditKeyword, kwActionLoading, handleEnableKeyword, handleSaveKeyword, setKwEditMode, handleDeleteKeyword, kwAdd, setKwAdd, kwAddCategory, setKwAddCategory, kwAddDesc, setKwAddDesc, kwAddLoading, handleAddKeyword, onRefresh
}) => {
  // Pagination constants and state
  const PAGE_SIZE = 5;
  const [keywordPage, setKeywordPage] = React.useState(1);
  const pageCount = Math.ceil(keywords.length / PAGE_SIZE);
  const pagedKeywords = keywords.slice((keywordPage - 1) * PAGE_SIZE, keywordPage * PAGE_SIZE);

  return (
    <div className="datapage-section-card">
      <div className="datapage-section-header">
        <h2>Keywords</h2>
      </div>
      <div className="datapage-search-bar" style={{ display: 'flex', alignItems: 'center' }}>
        <input
          className="datapage-search-input"
          type="text"
          placeholder="Search keywords, categories, or descriptions..."
          value={keywordSearch}
          onChange={e => setKeywordSearch(e.target.value)}
        />
        <button
          className="datapage-refresh-btn"
          title="Refresh"
          onClick={onRefresh}
          style={{ marginLeft: 8 }}
        >
          &#x21bb; Refresh
        </button>
      </div>
      {kwLoading ? (
        <div className="datapage-loading">Loading...</div>
      ) : kwError ? (
        <div className="datapage-error">{kwError}</div>
      ) : (
        <div className="datapage-table-wrapper">
          <table className="datapage-table">
            <thead>
              <tr>
                <th className="datapage-sortable" onClick={() => handleKeywordSort('keyword')}>Keyword {keywordSort.field === 'keyword' ? (keywordSort.asc ? '▲' : '▼') : ''}</th>
                <th className="datapage-sortable" onClick={() => handleKeywordSort('category')}>Category {keywordSort.field === 'category' ? (keywordSort.asc ? '▲' : '▼') : ''}</th>
                <th className="datapage-sortable" onClick={() => handleKeywordSort('description')}>Description {keywordSort.field === 'description' ? (keywordSort.asc ? '▲' : '▼') : ''}</th>
                <th className="datapage-sortable" onClick={() => handleKeywordSort('enabled')}>Enabled {keywordSort.field === 'enabled' ? (keywordSort.asc ? '▲' : '▼') : ''}</th>
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
                        className="datapage-input"
                        type="text"
                        value={kwEdit[kw.keyword]?.category ?? kw.category ?? ''}
                        onChange={e => handleEditKeyword(kw.keyword, 'category', e.target.value)}
                      />
                    ) : (
                      kw.category || ''
                    )}
                  </td>
                  <td>
                    {kwEditMode[kw.keyword] ? (
                      <input
                        className="datapage-input"
                        type="text"
                        value={kwEdit[kw.keyword]?.description ?? kw.description ?? ''}
                        onChange={e => handleEditKeyword(kw.keyword, 'description', e.target.value)}
                      />
                    ) : (
                      kw.description || ''
                    )}
                  </td>
                  <td>
                    <button
                      className={kw.enabled ? 'primary-btn' : 'secondary-btn'}
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
          {pageCount > 1 && (
            <div className="datapage-pagination">
              <button
                className="datapage-secondary-btn"
                disabled={keywordPage === 1}
                onClick={() => setKeywordPage(keywordPage - 1)}
              >
                Prev
              </button>
              <span>
                Page {keywordPage} of {pageCount}
              </span>
              <button
                className="datapage-secondary-btn"
                disabled={keywordPage === pageCount}
                onClick={() => setKeywordPage(keywordPage + 1)}
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
      <form onSubmit={handleAddKeyword} className="datapage-add-keyword">
        <input
          className="datapage-input"
          type="text"
          placeholder="New Keyword"
          value={kwAdd}
          onChange={e => setKwAdd(e.target.value)}
          required
        />
        <input
          className="datapage-input"
          type="text"
          placeholder="Category (optional)"
          value={kwAddCategory}
          onChange={e => setKwAddCategory(e.target.value)}
        />
        <input
          className="datapage-input"
          type="text"
          placeholder="Description (optional)"
          value={kwAddDesc}
          onChange={e => setKwAddDesc(e.target.value)}
        />
        <button className="primary-btn" type="submit" disabled={kwAddLoading}>
          Add Keyword
        </button>
      </form>
    </div>
  );
};

export default KeywordSection;
