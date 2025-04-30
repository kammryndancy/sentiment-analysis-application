import React from 'react';
import CommentsOverTimeChart, { CommentOverTimeDatum } from './CommentsOverTimeChart';

const CommentsOverTimeSection: React.FC<{
  commentsOverTime: CommentOverTimeDatum[];
  loading: boolean;
  error: string | null;
}> = ({ commentsOverTime, loading, error }) => (
  <div>
    <h3>Comments Over Time</h3>
    {loading ? (
      <div>Loading chart...</div>
    ) : error ? (
      <div style={{ color: 'red' }}>{error}</div>
    ) : (
      <CommentsOverTimeChart data={commentsOverTime} />
    )}
  </div>
);

export default CommentsOverTimeSection;
