import './FeedCard.css';

const sentimentColors: Record<string, string> = {
  positive: '#2ecc40',
  negative: '#e74c3c',
  neutral: '#f1c40f',
};

const getSentimentColor = (ws?: number) => {
  if (ws === undefined) return undefined;
  if (ws > 3) return 'green'; // green
  if (ws < -3) return 'red'; // red
  return 'yellow'; // yellow
};

type FeedCardProps = {
  page_id: string;
  created_time: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  text: string;
  tags: string[];
  matched_keywords?: string[];
  likes?: number;
  weighted_sentiment?: number;
};

const FeedCard = ({ page_id, created_time, sentiment, text, tags, matched_keywords, likes, weighted_sentiment }: FeedCardProps) => (
  <div className="feed-card" style={{ borderLeft: `5px solid ${sentimentColors[sentiment]}` }}>
    <div className="feed-card-header">
      <div className="feed-card-user">{page_id}</div>
      <div className="feed-card-time">{new Date(created_time).toLocaleString()}</div>
      <div className="feed-card-likes">
        <span role="img" aria-label="likes" className="feed-card-likes-icon">👍</span>
        <span className="feed-card-likes-count">{likes ?? 0}</span>
      </div>
      <div className="feed-card-weighted-sentiment">
        <span className="feed-card-weighted-label">Sentiment:</span>
        <span className={`feed-card-weighted-value ${getSentimentColor(weighted_sentiment)}`}>
          {weighted_sentiment !== undefined ? weighted_sentiment.toFixed(2) : 'N/A'}
        </span>
      </div>
    </div>
    <div className="feed-card-text">{text}</div>
    <div className="feed-card-tags-keywords-row">
      <div className="feed-card-tags">
        {tags.map((tag, idx) => (
          <span className="feed-card-tag" key={idx}>{tag}</span>
        ))}
      </div>
      {matched_keywords && matched_keywords.length > 0 && (
        <div className="feed-card-keywords">
          {matched_keywords.map((kw, idx) => (
            <span className="feed-card-keyword" key={idx}>{kw}</span>
          ))}
        </div>
      )}
    </div>
  </div>
);

export default FeedCard;
