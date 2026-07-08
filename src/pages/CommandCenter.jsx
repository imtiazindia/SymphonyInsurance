import {
  ArrowUpRight,
  BrainCircuit,
  ChevronRight,
  CircleCheck,
  PlaneTakeoff,
  Radar,
  Route,
  ShieldAlert,
  Sparkles,
  Target,
} from 'lucide-react';
import { ActivityFeedItem } from '../components/ActivityFeedItem.jsx';
import { DataCard } from '../components/DataCard.jsx';
import { MetricCard } from '../components/MetricCard.jsx';
import { RiskBadge } from '../components/RiskBadge.jsx';
import { StatusBadge } from '../components/StatusBadge.jsx';
import { TimelineItem } from '../components/TimelineItem.jsx';
import { RiskMap } from '../components/charts/RiskMap.jsx';
import {
  activities,
  claimsReviewItems,
  complianceMissions,
  intelligenceBriefing,
  insurerStatusCards,
  metrics,
  missionStatements,
  renewalStages,
  timeline,
} from '../data/demoData.js';

function MissionHero() {
  return (
    <section className="mission-hero" aria-label="Executive mission briefing">
      <div className="mission-hero__content">
        <div className="mission-kicker">
          <span className="tail-label">N312MC</span>
          <StatusBadge status="Stable" tone="green" />
        </div>
        <p className="eyebrow">Aviation Insurance Operations</p>
        <h1>MISSION CONTROL</h1>
        <p className="mission-hero__subtitle">
          Executive command surface for fleet renewals, market negotiations, claims escalation and compliance readiness.
        </p>

        <div className="mission-statements">
          {missionStatements.map((statement) => (
            <article key={statement.label} className={`mission-statement mission-statement--${statement.tone}`}>
              <strong>{statement.value}</strong>
              <span>{statement.label}</span>
            </article>
          ))}
        </div>
      </div>

      <div className="airspace-visual" aria-hidden="true">
        <span className="airspace-visual__label">AIRSPACE RISK GRID</span>
        <svg viewBox="0 0 460 260" role="img">
          <path className="flight-path flight-path--primary" d="M18 196 C92 108 156 130 226 82 S354 34 434 74" />
          <path className="flight-path flight-path--secondary" d="M48 218 C118 160 186 184 262 134 S352 98 420 132" />
          <path className="runway-line" d="M62 222 L390 38" />
          <circle cx="226" cy="82" r="7" />
          <circle cx="342" cy="44" r="5" />
          <circle cx="386" cy="116" r="6" />
        </svg>
        <div className="airspace-visual__readouts">
          <span>FLEET OPS 94%</span>
          <span>MARKET WINDOW 04:12</span>
          <span>REVIEW QUEUE 11</span>
        </div>
      </div>
    </section>
  );
}

function SymphonyIntelligence() {
  return (
    <DataCard
      title="Symphony Intelligence"
      className="span-5 intelligence-card"
      action={
        <button className="ghost-button" type="button" aria-label="Open Symphony Intelligence">
          <ArrowUpRight size={16} />
        </button>
      }
    >
      <div className="intelligence-orbit" aria-hidden="true">
        <BrainCircuit size={28} />
      </div>
      <p className="intelligence-card__briefing">{intelligenceBriefing.summary}</p>

      <div className="intelligence-grid">
        <div>
          <h3>Recommended Priorities</h3>
          <ol className="priority-list">
            {intelligenceBriefing.priorities.map((priority) => (
              <li key={priority}>{priority}</li>
            ))}
          </ol>
        </div>
        <div>
          <h3>Risk Alerts</h3>
          <div className="risk-alert-list">
            {intelligenceBriefing.alerts.map((alert) => (
              <span key={alert.label} className={`risk-alert risk-alert--${alert.tone}`}>
                <ShieldAlert size={14} />
                {alert.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="next-actions">
        {intelligenceBriefing.actions.map((action) => (
          <button key={action} className="next-action" type="button">
            <Sparkles size={14} />
            {action}
          </button>
        ))}
      </div>
    </DataCard>
  );
}

function RenewalWorkflow() {
  return (
    <DataCard title="Renewal Mission Pipeline" className="span-4 workflow-card">
      <div className="workflow-stages">
        {renewalStages.map((stage) => (
          <article key={stage.label} className={`workflow-stage workflow-stage--${stage.tone}`}>
            <div>
              <span>{stage.label}</span>
              <strong>{stage.count}</strong>
            </div>
            <i style={{ '--progress': `${stage.progress}%` }} />
          </article>
        ))}
      </div>
    </DataCard>
  );
}

function ClaimsReview() {
  return (
    <DataCard title="Claims Executive Review" className="span-3 claims-card">
      <div className="claims-review-list">
        {claimsReviewItems.map((item) => (
          <article key={item.claim} className={`claims-review claims-review--${item.tone}`}>
            <div>
              <strong>{item.claim}</strong>
              <span>{item.account}</span>
            </div>
            <RiskBadge level={item.severity} tone={item.tone} />
            <p>{item.reserve}</p>
            <em>{item.review}</em>
          </article>
        ))}
      </div>
    </DataCard>
  );
}

function NegotiationDesk() {
  return (
    <DataCard title="Carrier Negotiation Desk" className="span-5 negotiation-card">
      <div className="insurer-card-grid">
        {insurerStatusCards.map((market) => (
          <article key={market.market} className={`insurer-card insurer-card--${market.tone}`}>
            <div className="insurer-card__header">
              <span>{market.account}</span>
              <RiskBadge level={market.premium} tone={market.tone} />
            </div>
            <strong>{market.market}</strong>
            <p>{market.status}</p>
            <small>{market.appetite}</small>
          </article>
        ))}
      </div>
    </DataCard>
  );
}

function ComplianceOps() {
  return (
    <DataCard title="Compliance Clearance" className="span-3 compliance-card">
      <div className="compliance-missions">
        {complianceMissions.map((mission) => (
          <article key={mission.label} className={`compliance-mission compliance-mission--${mission.tone}`}>
            <div>
              <strong>{mission.label}</strong>
              <span>{mission.status}</span>
            </div>
            <time>{mission.due}</time>
            <i style={{ '--progress': `${mission.progress}%` }} />
          </article>
        ))}
      </div>
    </DataCard>
  );
}

export function CommandCenter() {
  return (
    <div className="command-center page-transition">
      <MissionHero />

      <section className="metric-grid metric-grid--mission" aria-label="Executive mission metrics">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} metric={metric} />
        ))}
      </section>

      <section className="dashboard-grid dashboard-grid--mission">
        <SymphonyIntelligence />
        <RenewalWorkflow />
        <ClaimsReview />
        <NegotiationDesk />

        <DataCard title="Airspace Risk Map" className="span-4 airspace-card">
          <div className="card-context">
            <Radar size={16} />
            Tail-number concentrations and route corridor exposure
          </div>
          <RiskMap />
        </DataCard>

        <ComplianceOps />

        <DataCard title="Live Operations Feed" className="span-4 activity-card">
          <ul className="activity-list">
            {activities.map((item) => (
              <ActivityFeedItem key={`${item.time}-${item.account}`} item={item} />
            ))}
          </ul>
          <button className="link-button" type="button">
            View all activity
            <ChevronRight size={15} />
          </button>
        </DataCard>

        <DataCard title="Mission Timeline" className="span-4">
          <div className="card-context">
            <Route size={16} />
            Operational sequence for the next executive review cycle
          </div>
          <ol className="timeline-list">
            {timeline.map((item, index) => (
              <TimelineItem key={item.label} item={item} index={index} />
            ))}
          </ol>
        </DataCard>

        <DataCard title="Command Actions" className="span-4 command-actions-card">
          <button className="primary-button" type="button">
            <PlaneTakeoff size={17} />
            Launch renewal review
          </button>
          <button className="secondary-button" type="button">
            <Target size={16} />
            Open priority queue
          </button>
          <button className="secondary-button" type="button">
            <CircleCheck size={16} />
            Clear compliance packet
          </button>
        </DataCard>
      </section>
    </div>
  );
}
