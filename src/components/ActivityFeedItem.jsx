import { UserAvatar } from './UserAvatar.jsx';

export function ActivityFeedItem({ item }) {
  return (
    <li className="activity-feed-item">
      <UserAvatar initials={item.avatar} tone={item.tone} />
      <div>
        <strong>{item.name}</strong>
        <span>{item.detail}</span>
      </div>
      <time>{item.time}</time>
    </li>
  );
}
