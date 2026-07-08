export function StatusBadge({ status = 'active', tone = 'green' }) {
  return (
    <span className={`status-badge status-badge--${tone}`}>
      <span className="status-badge__dot" />
      {status}
    </span>
  );
}
