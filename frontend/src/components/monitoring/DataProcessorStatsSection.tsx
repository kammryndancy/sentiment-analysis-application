import React from 'react';
import './DataProcessorStatsSection.css';

const DataProcessorStatsSection: React.FC<{ dataProcessorStats: any }> = ({ dataProcessorStats }) => (
  <div className="dataprocessorstats-section">
    <h2>Data Processor Stats</h2>
    <div className="dataprocessorstats-rows">
      <div className="dataprocessorstats-row">
        <h3 className="dataprocessorstats-header comment-header">
          Comments
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" style={{marginRight:'6px',verticalAlign:'middle'}}><rect x="2" y="4" width="14" height="8" rx="2" stroke="#7dd87d" strokeWidth="1.5"/><path d="M6 14h6" stroke="#7dd87d" strokeWidth="1.5" strokeLinecap="round"/></svg>
        </h3>
        <div className="dataprocessorstats-badges">
          <span className="dataprocessorstats-badge badge-total">Total: {dataProcessorStats?.totalComments}</span>
          <span className="dataprocessorstats-badge badge-processed">Processed: {dataProcessorStats?.processedComments}</span>
          <span className="dataprocessorstats-badge badge-ratio">Ratio: {dataProcessorStats?.processingRatio}</span>
        </div>
      </div>
      <div className="dataprocessorstats-row">
        <h3 className="dataprocessorstats-header post-header">
        Posts
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" style={{marginRight:'6px',verticalAlign:'middle'}}><rect x="3" y="3" width="12" height="12" rx="2" stroke="#7db6d8" strokeWidth="1.5"/><path d="M6 7.5h6M6 10.5h6" stroke="#7db6d8" strokeWidth="1.3" strokeLinecap="round"/></svg>
        </h3>
        <div className="dataprocessorstats-badges">
          <span className="dataprocessorstats-badge badge-total">Total: {dataProcessorStats?.totalPosts}</span>
          <span className="dataprocessorstats-badge badge-processed">Processed: {dataProcessorStats?.processedPosts}</span>
          <span className="dataprocessorstats-badge badge-ratio">Ratio: {dataProcessorStats?.postProcessingRatio}</span>
        </div>
      </div>
      {dataProcessorStats?.tokenStats && (
        <div className="dataprocessorstats-row">
          <h3 className="dataprocessorstats-header token-header">
            Token Stats
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" style={{marginRight:'6px',verticalAlign:'middle'}}><circle cx="9" cy="9" r="7" stroke="#e0c97d" strokeWidth="1.5"/><text x="9" y="13" textAnchor="middle" fontSize="8" fill="#e0c97d" fontFamily="monospace">#</text></svg>
          </h3>
          <div className="dataprocessorstats-badges">
            <span className="dataprocessorstats-badge badge-avg">Avg: {dataProcessorStats.tokenStats.avgTokenCount?.toFixed(2)}</span>
            <span className="dataprocessorstats-badge badge-min">Min: {dataProcessorStats.tokenStats.minTokenCount}</span>
            <span className="dataprocessorstats-badge badge-max">Max: {dataProcessorStats.tokenStats.maxTokenCount}</span>
          </div>
        </div>
      )}
    </div>
  </div>
);

export default DataProcessorStatsSection;
