export function DataCard({ title, children, action, className = '' }) {
  return (
    <section className={`data-card ${className}`}>
      <div className="data-card__header">
        <h2>{title}</h2>
        {action ? <div className="data-card__action">{action}</div> : null}
      </div>
      {children}
    </section>
  );
}
