import './FiltersPanel.css';

const FiltersPanel = () => (
  <aside className="filters-panel">
    <div className="filters-title">Filters</div>
    <div className="filters-total">Total feeds: <b>14700</b></div>
    <div className="filters-section">
      <div className="filters-label">Sentiments</div>
      <div className="filters-sentiments">
        <span className="sentiment positive">😊<span>13000</span></span>
        <span className="sentiment negative">😡<span>500</span></span>
        <span className="sentiment neutral">😐<span>1200</span></span>
      </div>
    </div>
    <div className="filters-section">
      <div className="filters-label">Sources</div>
      <div className="filters-sources">
        <span>Facebook</span>
        <span>Twitter</span>
      </div>
    </div>
  </aside>
);

export default FiltersPanel;
