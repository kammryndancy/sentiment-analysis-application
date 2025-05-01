import React from 'react';
import CommentsOverTimeChart, { CommentOverTimeDatum } from './CommentsOverTimeChart';
import './CommentsOverTimeSection.css';

const CommentsOverTimeSection: React.FC<{
  processedCommentsOverTime: CommentOverTimeDatum[];
  processedPostsOverTime: CommentOverTimeDatum[];
  loading: boolean;
  error: string | null;
}> = ({ processedCommentsOverTime, processedPostsOverTime, loading, error }) => (
  <div className="comments-overtime-section">
    <h2>Processed Comments and Posts Over Time</h2>
    <div className="comments-overtime-chart">
      {loading ? (
        <div className="comments-overtime-loading">Loading chart...</div>
      ) : error ? (
        <div className="comments-overtime-error">{error}</div>
      ) : (
        <CommentsOverTimeChart
          processedCommentsOverTime={processedCommentsOverTime}
          processedPostsOverTime={processedPostsOverTime}
        />
      )}
    </div>
  </div>
);

export default CommentsOverTimeSection;
