import './FeedCard.css';

const sentimentColors: Record<string, string> = {
  positive: '#2ecc40',
  negative: '#e74c3c',
  neutral: '#f1c40f',
};

type FeedCardProps = {
  user: string;
  time: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  text: string;
  tags: string[];
};

const FeedCard = ({ user, time, sentiment, text, tags }: FeedCardProps) => (
  <div className="feed-card" style={{ borderLeft: `5px solid ${sentimentColors[sentiment]}` }}>
    <div className="feed-card-header">
      <div className="feed-card-user">{user}</div>
      <div className="feed-card-time">{time}</div>
    </div>
    <div className="feed-card-text">{text}</div>
    <div className="feed-card-tags">
      {tags.map((tag, idx) => (
        <span className="feed-card-tag" key={idx}>{tag}</span>
      ))}
    </div>
  </div>
);

export default FeedCard;
