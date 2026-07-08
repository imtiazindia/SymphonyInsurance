import { Radar } from 'lucide-react';

export function EmptyState({ title = 'No signals yet', text = 'Mission data will appear here once feeds are connected.' }) {
  return (
    <div className="empty-state">
      <span className="icon-orb icon-orb--blue">
        <Radar size={22} />
      </span>
      <strong>{title}</strong>
      <p>{text}</p>
    </div>
  );
}
