export function ActivityFeedItem({ item }) {
  return (
    <li className={`activity-feed-item activity-feed-item--${item.tone}`}>
      <time>{item.time}</time>
      <div>
        <span className="activity-feed-item__type">{item.eventType}</span>
        <strong>{item.action}</strong>
        <span>{item.account}</span>
      </div>
      <em>{item.status}</em>
    </li>
  );
}
