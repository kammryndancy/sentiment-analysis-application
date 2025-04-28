import FeedCard from './FeedCard';
import './FeedList.css';

const dummyFeeds = [
  {
    user: 'Chris Williams',
    time: '23 Minutes ago',
    sentiment: 'positive',
    text: 'This is an amazing product. This builds health and physique. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim veniam, quis nostrud exercitation ullamco laboris',
    tags: ['Lorem Ipsum', 'Salome Dominy', 'Prospect', '2d', 'Like'],
  },
  {
    user: 'Chris Williams',
    time: '23 Minutes ago',
    sentiment: 'negative',
    text: 'This is an amazing product. This builds health and physique. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim veniam, quis nostrud exercitation ullamco laboris',
    tags: ['Lorem Ipsum', 'Salome Dominy', 'Prospect', '2d', 'Like'],
  },
  {
    user: 'Chris Williams',
    time: '23 Minutes ago',
    sentiment: 'neutral',
    text: 'This is an amazing product. This builds health and physique. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim veniam, quis nostrud exercitation ullamco laboris',
    tags: ['Lorem Ipsum', 'Salome Dominy', 'Prospect', '2d', 'Like'],
  },
];

const FeedList = () => (
  <div className="feed-list">
    {dummyFeeds.map((feed, idx) => (
      <FeedCard
        key={idx}
        {...feed}
        sentiment={
          feed.sentiment === 'positive' || feed.sentiment === 'negative' || feed.sentiment === 'neutral'
            ? feed.sentiment
            : 'neutral'
        }
      />
    ))}
  </div>
);

export default FeedList;
