import React from 'react';

interface PageIdRow {
  page_id: string;
  name?: string;
  description?: string;
  enabled: boolean;
  last_scraped?: string | null;
  added_at?: string | null;
  last_updated?: string | null;
}

interface Props {
  pageSearch: string;
  setPageSearch: (s: string) => void;
  loading: boolean;
  error: string;
  pages: PageIdRow[];
  pageSort: { field: keyof PageIdRow; asc: boolean };
  handlePageSort: (field: keyof PageIdRow) => void;
  editMode: { [id: string]: boolean };
  editName: { [id: string]: string };
  setEditName: React.Dispatch<React.SetStateAction<{ [id: string]: string }>>;
  editDesc: { [id: string]: string };
  handleEditDesc: (id: string, desc: string) => void;
  actionLoading: string | null;
  handleEnable: (page_id: string, enabled: boolean) => void;
  handleSaveDesc: (page: PageIdRow) => void;
  setEditMode: React.Dispatch<React.SetStateAction<{ [id: string]: boolean }>>;
  handleDeletePage: (page_id: string) => void;
  addPageId: string;
  setAddPageId: (s: string) => void;
  addDesc: string;
  setAddDesc: (s: string) => void;
  addLoading: boolean;
  handleAddPage: (e: React.FormEvent) => void;
  onRefresh: () => void;
  className?: string;
}

const PageIdSection: React.FC<Props> = ({
  pageSearch, setPageSearch, loading, error, pages, pageSort, handlePageSort, editMode, editName, setEditName, editDesc, handleEditDesc, actionLoading, handleEnable, handleSaveDesc, setEditMode, handleDeletePage, addPageId, setAddPageId, addDesc, setAddDesc, addLoading, handleAddPage, onRefresh, className
}) => {
  // Pagination constants and state
  const PAGE_SIZE = 5;
  const [pagePage, setPagePage] = React.useState(1);
  const pageCount = Math.ceil(pages.length / PAGE_SIZE);
  const pagedPages = pages.slice((pagePage - 1) * PAGE_SIZE, pagePage * PAGE_SIZE);

  return (
    <div className={`datapage-section-card ${className || ''}`.trim()}>
      <div className="datapage-section-header">
        <h2>Page IDs</h2>
        <div className="datapage-search-bar" style={{ display: 'flex', alignItems: 'center' }}>
          <input
            className="datapage-search-input"
            type="text"
            placeholder="Search page IDs, names, or descriptions..."
            value={pageSearch}
            onChange={e => setPageSearch(e.target.value)}
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
      </div>
      {loading ? (
        <div className="datapage-loading">Loading...</div>
      ) : error ? (
        <div className="datapage-error">{error}</div>
      ) : (
        <div className="datapage-table-wrapper">
          <table className="datapage-table">
            <thead>
              <tr>
                <th className="datapage-table-header" style={{ cursor: 'pointer' }} onClick={() => handlePageSort('page_id')}>Page ID {pageSort.field === 'page_id' ? (pageSort.asc ? '▲' : '▼') : ''}</th>
                <th className="datapage-table-header" style={{ cursor: 'pointer' }} onClick={() => handlePageSort('name')}>Name {pageSort.field === 'name' ? (pageSort.asc ? '▲' : '▼') : ''}</th>
                <th className="datapage-table-header" style={{ cursor: 'pointer' }} onClick={() => handlePageSort('description')}>Description {pageSort.field === 'description' ? (pageSort.asc ? '▲' : '▼') : ''}</th>
                <th className="datapage-table-header" style={{ cursor: 'pointer' }} onClick={() => handlePageSort('enabled')}>Enabled {pageSort.field === 'enabled' ? (pageSort.asc ? '▲' : '▼') : ''}</th>
                <th className="datapage-table-header">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pagedPages.map(page => (
                <tr key={page.page_id}>
                  <td className="datapage-table-cell">{page.page_id}</td>
                  <td className="datapage-table-cell">
                    {editMode[page.page_id] ? (
                      <input
                        className="datapage-edit-input"
                        type="text"
                        value={editName[page.page_id] ?? page.name ?? ''}
                        onChange={e => setEditName(prev => ({ ...prev, [page.page_id]: e.target.value }))}
                      />
                    ) : (
                      page.name
                    )}
                  </td>
                  <td className="datapage-table-cell">
                    {editMode[page.page_id] ? (
                      <input
                        className="datapage-edit-input"
                        type="text"
                        value={editDesc[page.page_id] ?? page.description ?? ''}
                        onChange={e => handleEditDesc(page.page_id, e.target.value)}
                      />
                    ) : (
                      page.description || ''
                    )}
                  </td>
                  <td className="datapage-table-cell">
                    <button
                      className={page.enabled ? 'primary-btn' : 'secondary-btn'}
                      disabled={actionLoading === page.page_id}
                      onClick={() => handleEnable(page.page_id, page.enabled)}
                    >
                      {page.enabled ? 'Enabled' : 'Disabled'}
                    </button>
                  </td>
                  <td className="datapage-table-cell">
                    {editMode[page.page_id] ? (
                      <>
                        <button
                          className="primary-btn"
                          disabled={actionLoading === page.page_id}
                          onClick={() => handleSaveDesc(page)}
                        >
                          Save
                        </button>
                        <button
                          className="secondary-btn"
                          onClick={() => {
                            setEditMode(prev => ({ ...prev, [page.page_id]: false }));
                            setEditName(prev => {
                              const n = { ...prev };
                              delete n[page.page_id];
                              return n;
                            });
                          }}
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          className="secondary-btn"
                          onClick={() => {
                            setEditName(prev => ({ ...prev, [page.page_id]: page.name ?? '' }));
                            setEditMode(prev => ({ ...prev, [page.page_id]: true }));
                          }}
                        >
                          Edit
                        </button>
                        <button
                          className="danger-btn"
                          disabled={actionLoading === page.page_id}
                          onClick={() => handleDeletePage(page.page_id)}
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
                disabled={pagePage === 1}
                onClick={() => setPagePage(pagePage - 1)}
              >
                Prev
              </button>
              <span>
                Page {pagePage} of {pageCount}
              </span>
              <button
                className="datapage-secondary-btn"
                disabled={pagePage === pageCount}
                onClick={() => setPagePage(pagePage + 1)}
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
      <form onSubmit={handleAddPage} className="datapage-add-form">
        <input
          className="datapage-add-input"
          type="text"
          placeholder="New Page ID"
          value={addPageId}
          onChange={e => setAddPageId(e.target.value)}
          required
        />
        <input
          className="datapage-add-input"
          type="text"
          placeholder="Description (optional)"
          value={addDesc}
          onChange={e => setAddDesc(e.target.value)}
        />
        <button className="primary-btn" type="submit" disabled={addLoading}>
          Add Page
        </button>
      </form>
    </div>
  );
};

export default PageIdSection;
