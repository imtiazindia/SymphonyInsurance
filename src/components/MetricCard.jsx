import { Sparkline } from './charts/Sparkline.jsx';
import { StatusBadge } from './StatusBadge.jsx';

export function MetricCard({ metric }) {
  const Icon = metric.icon;

  return (
    <article className={`metric-card glow-${metric.accent}`}>
      <div className="metric-card__top">
        <span className={`icon-orb icon-orb--${metric.accent}`}>
          <Icon size={18} />
        </span>
        <StatusBadge status={metric.status} />
      </div>
      <div>
        <p className="eyebrow">{metric.label}</p>
        <strong className="metric-card__value">{metric.value}</strong>
        <span className="metric-card__delta">{metric.delta}</span>
      </div>
      <Sparkline values={metric.spark} color={`var(--${metric.accent})`} />
    </article>
  );
}
