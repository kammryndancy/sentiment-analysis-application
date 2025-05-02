import React, { useEffect, useState } from 'react';
import FeedCard from './FeedCard';
import './FeedList.css';

const FeedList = () => {
  const [feeds, setFeeds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFeeds = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/data-processor/processed-comments/extremes');
        const json = await res.json();
        if (json.success && json.data) {
          // Filter out nulls and label each
          const labeled = [
            json.data.highest ? { ...json.data.highest, _extreme: 'Highest Sentiment' } : null,
            json.data.lowest ? { ...json.data.lowest, _extreme: 'Lowest Sentiment' } : null,
            json.data.neutralist ? { ...json.data.neutralist, _extreme: 'Most Neutral Sentiment' } : null
          ].filter(Boolean);
          setFeeds(labeled);
        } else {
          setError('No feed data found');
        }
      } catch (e) {
        setError('Failed to fetch feeds');
      }
      setLoading(false);
    };
    fetchFeeds();
  }, []);

  if (loading) return <div className="feed-list">Loading...</div>;
  if (error) return <div className="feed-list feed-list-error">{error}</div>;

  return (
    <div className="feed-list-section">
      <h2>Recent Feeds</h2>
      <div className="feed-list">
        {feeds.map((feed, idx) => (
          <FeedCard
            key={feed._id || idx}
            user={feed.username || feed.user || 'Unknown'}
            time={feed.created_time || ''}
            sentiment={
              feed.weighted_sentiment > 0.05 ? 'positive' : feed.weighted_sentiment < -0.05 ? 'negative' : 'neutral'
            }
            text={feed.message || feed.text || ''}
            tags={[feed._extreme]}
          />
        ))}
      </div>
    </div>
  );
};

export default FeedList;
