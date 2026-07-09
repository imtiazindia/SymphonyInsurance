import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

function priorityTone(priority = '') {
  if (['Critical', 'High'].includes(priority)) return 'high';
  if (priority === 'Medium') return 'medium';
  return 'low';
}

function documentTone(status = '') {
  const normalized = status.toLowerCase();
  if (normalized.includes('missing') || normalized.includes('expired')) return 'red';
  if (normalized.includes('review') || normalized.includes('pending')) return 'amber';
  return 'green';
}

function complianceTone(severity = '') {
  if (severity === 'High' || severity === 'Critical') return 'red';
  if (severity === 'Medium') return 'amber';
  return 'green';
}

export function BusinessKpiCard({ icon: Icon, label, value, helper, tone = 'blue', className = '' }) {
  return (
    <article className={`business-kpi-card business-kpi-card--${tone} ${className}`}>
      {Icon ? (
        <span className="business-kpi-card__icon">
          <Icon size={21} />
        </span>
      ) : null}
      <div>
        <strong>{value}</strong>
        <p>{label}</p>
        {helper ? <small>{helper}</small> : null}
      </div>
    </article>
  );
}

export function TaskPriorityBadge({ priority }) {
  return <span className={`business-badge business-badge--${priorityTone(priority)}`}>{priority}</span>;
}

export function ClientHealthBadge({ score }) {
  const tone = score >= 85 ? 'green' : score >= 72 ? 'blue' : score >= 60 ? 'amber' : 'red';
  const label = score >= 85 ? 'Strong' : score >= 72 ? 'Stable' : score >= 60 ? 'Watch' : 'At Risk';
  return <span className={`business-badge business-badge--${tone}`}>{score} / {label}</span>;
}

export function RenewalStatusBadge({ status }) {
  const tone = status === 'At Risk' ? 'red' : status === 'Binding' ? 'green' : status === 'Negotiation' ? 'amber' : 'blue';
  return <span className={`business-badge business-badge--${tone}`}>{status}</span>;
}

export function DocumentStatusBadge({ status }) {
  return <span className={`business-badge business-badge--${documentTone(status)}`}>{status}</span>;
}

export function ComplianceSeverityBadge({ severity }) {
  return <span className={`business-badge business-badge--${complianceTone(severity)}`}>{severity}</span>;
}

export function RevenueImpactLabel({ value, label = 'Revenue impact' }) {
  return (
    <span className="revenue-impact-label">
      <strong>{value}</strong>
      <small>{label}</small>
    </span>
  );
}

export function WorkloadIndicator({ score }) {
  const tone = score >= 80 ? 'red' : score >= 70 ? 'amber' : 'green';
  return (
    <span className={`workload-indicator workload-indicator--${tone}`}>
      <i><b style={{ width: `${score}%` }} /></i>
      <em>{score}%</em>
    </span>
  );
}

export function PriorityItemCard({ item, onAction, note }) {
  return (
    <article className="priority-item-card">
      <div className="priority-item-card__main">
        <TaskPriorityBadge priority={item.priority} />
        <div>
          <Link to={`/clients?clientId=${item.clientId}`} className="priority-item-card__client">
            {item.clientName}
          </Link>
          <p>{item.issue}</p>
          {note ? <small>{note}</small> : null}
        </div>
      </div>
      <dl>
        {item.dueLabel || item.dueDate ? (
          <div>
            <dt>Due Date</dt>
            <dd>{item.dueLabel ?? item.dueDate}</dd>
          </div>
        ) : null}
        <div>
          <dt>{item.impactLabel ?? 'Business Impact'}</dt>
          <dd>{item.impact}</dd>
        </div>
        <div>
          <dt>Related Workflow</dt>
          <dd>{item.workflow}</dd>
        </div>
        {item.owner ? (
          <div>
            <dt>Responsible Person</dt>
            <dd>{item.owner}</dd>
          </div>
        ) : null}
      </dl>
      <div className="priority-item-card__actions">
        {onAction ? (
          <button type="button" onClick={() => onAction(item)}>
            {item.nextStep}
            <ArrowRight size={15} />
          </button>
        ) : (
          <span>{item.nextStep}</span>
        )}
        {item.detailHref ? <Link to={item.detailHref}>{item.detailLabel ?? 'Open detail'}</Link> : null}
      </div>
    </article>
  );
}

export function BusinessActivityTimeline({ activities, getClientName, formatTime }) {
  return (
    <div className="business-activity-timeline">
      {activities.map((activity) => (
        <article key={activity.id}>
          <span className={`event-dot event-dot--${activity.importanceLevel.toLowerCase()}`} />
          <time>{formatTime(activity.timestamp)}</time>
          <div>
            <strong>{activity.activityType}</strong>
            <p>{activity.summary}</p>
          </div>
          <Link to={`/clients?clientId=${activity.clientId}`}>{getClientName(activity.clientId)}</Link>
        </article>
      ))}
    </div>
  );
}
