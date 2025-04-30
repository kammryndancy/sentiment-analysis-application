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
  pagedPages: PageIdRow[];
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
  pagePage: number;
  pageCount: number;
  setPagePage: (updater: (p: number) => number) => void;
  addPageId: string;
  setAddPageId: (s: string) => void;
  addDesc: string;
  setAddDesc: (s: string) => void;
  addLoading: boolean;
  handleAddPage: (e: React.FormEvent) => void;
}

const PageIdSection: React.FC<Props> = ({
  pageSearch, setPageSearch, loading, error, pagedPages, pageSort, handlePageSort, editMode, editName, setEditName, editDesc, handleEditDesc, actionLoading, handleEnable, handleSaveDesc, setEditMode, handleDeletePage, pagePage, pageCount, setPagePage, addPageId, setAddPageId, addDesc, setAddDesc, addLoading, handleAddPage
}) => (
  <div>
    <h2>Page IDs</h2>
    <div style={{ marginBottom: 12 }}>
      <input
        type="text"
        placeholder="Search page IDs, names, or descriptions..."
        value={pageSearch}
        onChange={e => setPageSearch(e.target.value)}
        style={{ padding: 8, width: 320 }}
      />
    </div>
    {loading ? (
      <div>Loading...</div>
    ) : error ? (
      <div style={{ color: 'red' }}>{error}</div>
    ) : (
      <div style={{ overflowX: 'auto', marginBottom: 32 }}>
        <table className="table table-striped">
          <thead>
            <tr>
              <th style={{ cursor: 'pointer' }} onClick={() => handlePageSort('page_id')}>Page ID {pageSort.field === 'page_id' ? (pageSort.asc ? '▲' : '▼') : ''}</th>
              <th style={{ cursor: 'pointer' }} onClick={() => handlePageSort('name')}>Name {pageSort.field === 'name' ? (pageSort.asc ? '▲' : '▼') : ''}</th>
              <th style={{ cursor: 'pointer' }} onClick={() => handlePageSort('description')}>Description {pageSort.field === 'description' ? (pageSort.asc ? '▲' : '▼') : ''}</th>
              <th style={{ cursor: 'pointer' }} onClick={() => handlePageSort('enabled')}>Enabled {pageSort.field === 'enabled' ? (pageSort.asc ? '▲' : '▼') : ''}</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pagedPages.map(page => (
              <tr key={page.page_id}>
                <td>{page.page_id}</td>
                <td>
                  {editMode[page.page_id] ? (
                    <input
                      type="text"
                      value={editName[page.page_id] ?? page.name ?? ''}
                      onChange={e => setEditName(prev => ({ ...prev, [page.page_id]: e.target.value }))}
                      style={{ width: 140 }}
                    />
                  ) : (
                    page.name
                  )}
                </td>
                <td>
                  {editMode[page.page_id] ? (
                    <input
                      type="text"
                      value={editDesc[page.page_id] ?? page.description ?? ''}
                      onChange={e => handleEditDesc(page.page_id, e.target.value)}
                      style={{ width: 220 }}
                    />
                  ) : (
                    page.description || ''
                  )}
                </td>
                <td>
                  <button
                    className={page.enabled ? 'primary-btn' : 'secondary-btn'}
                    style={{ minWidth: 90 }}
                    disabled={actionLoading === page.page_id}
                    onClick={() => handleEnable(page.page_id, page.enabled)}
                  >
                    {page.enabled ? 'Enabled' : 'Disabled'}
                  </button>
                </td>
                <td>
                  {editMode[page.page_id] ? (
                    <>
                      <button
                        className="primary-btn"
                        style={{ marginRight: 8 }}
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
                        style={{ marginRight: 8 }}
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
        <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
          <button className="secondary-btn" disabled={pagePage === 1} onClick={() => setPagePage((p: number) => Math.max(1, p - 1))}>Prev</button>
          <span>Page {pagePage} of {pageCount}</span>
          <button className="secondary-btn" disabled={pagePage === pageCount || pageCount === 0} onClick={() => setPagePage((p: number) => Math.min(pageCount, p + 1))}>Next</button>
        </div>
      </div>
    )}
    <form onSubmit={handleAddPage} style={{ marginBottom: 32, display: 'flex', gap: 12, alignItems: 'center' }}>
      <input
        type="text"
        placeholder="New Page ID"
        value={addPageId}
        onChange={e => setAddPageId(e.target.value)}
        required
        style={{ width: 140 }}
      />
      <input
        type="text"
        placeholder="Description (optional)"
        value={addDesc}
        onChange={e => setAddDesc(e.target.value)}
        style={{ width: 220 }}
      />
      <button className="primary-btn" type="submit" disabled={addLoading}>
        Add Page
      </button>
    </form>
  </div>
);

export default PageIdSection;
