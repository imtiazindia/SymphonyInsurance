import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  FileCheck2,
  Mail,
  Plane,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
  UsersRound,
  WalletCards,
} from 'lucide-react';
import { simulationData } from '../data/demoData.js';
import { getAverage, getRenewalsDueSoon, getSum } from '../utils/businessCalculations.js';

const currencyCompact = new Intl.NumberFormat('en-US', {
  currency: 'USD',
  maximumFractionDigits: 1,
  notation: 'compact',
  style: 'currency',
});

const currencyMillions = new Intl.NumberFormat('en-US', {
  currency: 'USD',
  maximumFractionDigits: 1,
  style: 'currency',
});

const dateFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });
const timeFormatter = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', month: 'short', day: 'numeric' });

const clientById = new Map(simulationData.clients.map((client) => [client.id, client]));
const userById = new Map(simulationData.teamMembers.map((user) => [user.id, user]));
const renewalById = new Map(simulationData.renewals.map((renewal) => [renewal.id, renewal]));

function compactCurrency(value) {
  return currencyCompact.format(value).replace('.0', '');
}

function millionCurrency(value) {
  return currencyMillions.format(value / 1000000).replace('.0', '') + 'M';
}

function clientName(clientId) {
  return clientById.get(clientId)?.name ?? 'Unassigned Account';
}

function userName(userId) {
  return userById.get(userId)?.name ?? 'Unassigned';
}

function formatDate(date) {
  return dateFormatter.format(new Date(`${date}T00:00:00Z`));
}

function dueLabel(date) {
  const due = new Date(`${date}T00:00:00Z`);
  const today = new Date('2026-07-09T00:00:00Z');
  const days = Math.max(0, Math.ceil((due - today) / 86400000));
  if (days === 0) return 'Due today';
  if (days === 1) return 'Due tomorrow';
  return `Due in ${days} days`;
}

function StatusPill({ children, tone = 'blue' }) {
  return <span className={`business-pill business-pill--${tone}`}>{children}</span>;
}

function PortfolioRing({ value }) {
  return (
    <div className="portfolio-ring" style={{ '--score': `${value * 3.6}deg` }} aria-label={`Portfolio health ${value}`}>
      <div>
        <strong>{value}</strong>
        <span>Good</span>
      </div>
    </div>
  );
}

function ExecutiveSummary({ metrics }) {
  const dueRenewals = getRenewalsDueSoon(simulationData.renewals, 60).length;
  const submissionDue = simulationData.submissions.filter((submission) => submission.completionPercent < 85).length;
  const claimsAttention = simulationData.claims.filter((claim) => claim.executiveReviewRequired).length;

  return (
    <section className="executive-summary card">
      <h2>Executive Summary</h2>
      <div className="card-rule" />
      <div className="executive-summary__body">
        <div>
          <h3>Portfolio Health</h3>
          <PortfolioRing value={metrics.averageClientHealth} />
        </div>
        <div className="today-priorities">
          <h3>Today's Priorities</h3>
          <PriorityMini icon={CalendarDays} value={dueRenewals} label="Renewals Due" meta="Next 60 Days" tone="blue" />
          <PriorityMini icon={FileCheck2} value={submissionDue} label="Submissions Due" meta="Need documents" tone="blue" />
          <PriorityMini icon={ShieldCheck} value={claimsAttention} label="Claims Needing Attention" meta="Executive review" tone="red" />
          <button className="text-link" type="button">
            View All Priorities
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </section>
  );
}

function PriorityMini({ icon: Icon, value, label, meta, tone }) {
  return (
    <div className="priority-mini">
      <span className={`priority-mini__icon priority-mini__icon--${tone}`}>
        <Icon size={16} />
      </span>
      <strong>{value}</strong>
      <div>
        <span>{label}</span>
        <small>{meta}</small>
      </div>
    </div>
  );
}

function KpiStrip({ metrics }) {
  const kpis = [
    { label: 'Active Clients', value: metrics.activeClients, meta: '+ 6 vs last 30 days', icon: UsersRound },
    { label: 'Premium Under Management', value: millionCurrency(metrics.totalManagedPremium), meta: '+ 12.4% vs prior year', icon: WalletCards },
    { label: 'Renewals Due', value: getRenewalsDueSoon(simulationData.renewals, 60).length, meta: 'Next 60 days', icon: CalendarDays },
    { label: 'Open Claims', value: metrics.openClaims, meta: `${millionCurrency(getSum(simulationData.claims, 'incurredAmount'))} incurred`, icon: ClipboardCheck },
    { label: 'Submission Success Rate', value: '72%', meta: 'Last 90 days', icon: RefreshCw },
    { label: 'Client Retention', value: `${metrics.retentionRate}%`, meta: 'Trailing 12 months', icon: UsersRound },
  ];

  return (
    <section className="kpi-strip card" aria-label="Portfolio indicators">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        return (
          <article className="kpi-item" key={kpi.label}>
            <span>{kpi.label}</span>
            <Icon size={34} strokeWidth={1.45} />
            <strong>{kpi.value}</strong>
            <small>{kpi.meta}</small>
          </article>
        );
      })}
    </section>
  );
}

function RenewalPipeline() {
  const stages = ['Data Collection', 'Submission Ready', 'Marketed', 'Negotiation', 'Binding'];
  const totals = stages.map((stage) => {
    const stageRenewals = simulationData.renewals.filter((renewal) => renewal.currentStage === stage);
    return {
      count: stageRenewals.length,
      premium: getSum(stageRenewals, 'premiumAtRenewal'),
      stage,
    };
  });

  return (
    <section className="renewal-pipeline card">
      <div className="section-title-row">
        <h2>Renewal Pipeline</h2>
      </div>
      <div className="pipeline-chevrons">
        {totals.map((item, index) => (
          <article className={`pipeline-chevron pipeline-chevron--${index}`} key={item.stage}>
            <span>{item.stage}</span>
            <strong>{item.count}</strong>
            <small>{compactCurrency(item.premium || 0)}</small>
            <em>Avg. Premium</em>
          </article>
        ))}
      </div>
      <div className="pipeline-footer">
        <div>
          <span>Total Pipeline Premium</span>
          <strong>{millionCurrency(getSum(simulationData.renewals, 'premiumAtRenewal'))}</strong>
        </div>
        <div>
          <span>Total Opportunities</span>
          <strong>{simulationData.renewals.length}</strong>
        </div>
        <button className="text-link" type="button">
          View Renewal Pipeline
          <ArrowRight size={15} />
        </button>
      </div>
    </section>
  );
}

function PriorityActions() {
  const actions = simulationData.tasks
    .filter((task) => task.status !== 'Completed')
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, 4);
  const icons = [Mail, CalendarDays, TrendingUp, ShieldCheck];

  return (
    <section className="priority-actions-panel card">
      <h2>Priority Actions</h2>
      <div className="priority-action-list">
        {actions.map((task, index) => {
          const Icon = icons[index] ?? CheckCircle2;
          return (
            <article className="priority-action" key={task.id}>
              <Icon size={23} strokeWidth={1.65} />
              <div>
                <strong>{task.title}</strong>
                <span>{clientName(task.clientId)}</span>
              </div>
              <time>{formatDate(task.dueDate)}</time>
            </article>
          );
        })}
      </div>
      <button className="text-link text-link--center" type="button">
        View All Actions
        <ArrowRight size={15} />
      </button>
    </section>
  );
}

function ActivePlacements() {
  const rows = simulationData.negotiations.slice(0, 5);

  return (
    <section className="active-placements card">
      <h2>Active Market Placements</h2>
      <div className="placements-table">
        <div className="placements-table__head">
          <span>Client</span>
          <span>Lead Underwriter</span>
          <span>Status</span>
          <span>Premium Trend</span>
          <span>Next Action</span>
        </div>
        {rows.map((placement, index) => {
          const renewal = renewalById.get(placement.renewalId);
          const client = clientById.get(placement.clientId);
          const statusTone = placement.currentStatus.includes('Negotiation') ? 'blue' : placement.currentStatus.includes('Submitted') ? 'teal' : 'soft';
          return (
            <article className="placement-row" key={placement.id}>
              <div className="placement-client">
                <span className={`client-icon client-icon--${index}`}>
                  <Plane size={17} />
                </span>
                <div>
                  <strong>{client?.name}</strong>
                  <small>{renewal?.currentStage ?? 'Placement'} / {client?.clientType}</small>
                </div>
              </div>
              <div>
                <strong>{placement.recommendedInsurer}</strong>
                <small>{userName(client?.assignedPlacementLeadId)}</small>
              </div>
              <StatusPill tone={statusTone}>{placement.currentStatus.replace('Terms ', '')}</StatusPill>
              <div className="trend-cell">
                <svg viewBox="0 0 80 22" aria-hidden="true">
                  <path d={index === 3 ? 'M2 8 L13 11 L24 7 L35 13 L46 15 L57 12 L70 17 L78 14' : 'M2 16 L13 13 L24 15 L35 9 L46 12 L57 6 L70 9 L78 4'} />
                </svg>
                <span className={index === 3 ? 'negative' : ''}>{index === 3 ? '-3%' : `+${index + 2}%`}</span>
              </div>
              <button className="row-action" type="button" aria-label={`Open ${client?.name}`}>
                <span>{placement.nextAction ?? placement.decisionRequired}</span>
                <ArrowRight size={17} />
              </button>
            </article>
          );
        })}
      </div>
      <button className="text-link text-link--center" type="button">
        View All Placements
        <ArrowRight size={15} />
      </button>
    </section>
  );
}

function OperationalSnapshot({ metrics }) {
  const workload = simulationData.teamMembers.slice(0, 5);

  return (
    <section className="operational-snapshot card">
      <h2>Operational Snapshot</h2>
      <div className="snapshot-grid">
        <div className="workload-panel">
          <h3>Team Workload</h3>
          <small>By Team</small>
          {workload.map((member) => (
            <div className="workload-row" key={member.id}>
              <span>{member.role.replace(' Coordinator', '')}</span>
              <i><b style={{ width: `${member.workloadScore}%` }} /></i>
              <em>{member.workloadScore}%</em>
            </div>
          ))}
          <button className="text-link" type="button">
            View Team Capacity
            <ArrowRight size={14} />
          </button>
        </div>
        <div className="compliance-panel">
          <h3>Compliance Status</h3>
          <div className="compliance-score">
            <ShieldCheck size={45} />
            <strong>{metrics.averageComplianceScore}%</strong>
          </div>
          <span>Compliant</span>
          <dl>
            <div><dt>Policies Reviewed</dt><dd>248 / 258</dd></div>
            <div><dt>Overdue Items</dt><dd>{simulationData.compliance.filter((item) => item.status === 'Overdue').length}</dd></div>
          </dl>
          <button className="text-link" type="button">
            View Compliance Center
            <ArrowRight size={14} />
          </button>
        </div>
        <div className="satisfaction-panel">
          <h3>Client Satisfaction</h3>
          <small>Trailing 12 Months</small>
          <div className="satisfaction-ring">
            <strong>4.6</strong>
            <span>out of 5</span>
          </div>
          <dl>
            <div><dt>Response Time</dt><dd>1.6 hrs</dd></div>
            <div><dt>NPS Score</dt><dd>68</dd></div>
          </dl>
          <button className="text-link" type="button">
            View Client Feedback
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </section>
  );
}

function RecentActivity() {
  const rows = simulationData.activities.slice(0, 5);

  return (
    <section className="recent-activity card">
      <h2>Recent Business Activity</h2>
      <div className="activity-timeline">
        {rows.map((activity) => (
          <article className="business-activity-row" key={activity.id}>
            <span className="activity-node" />
            <time>{timeFormatter.format(new Date(activity.timestamp))}</time>
            <strong>{clientName(activity.clientId)}</strong>
            <span>{activity.summary}</span>
            <em>{compactCurrency(clientById.get(activity.clientId)?.annualPremium ?? 0)} Premium</em>
          </article>
        ))}
      </div>
      <button className="text-link text-link--center" type="button">
        View All Activity
        <ArrowRight size={15} />
      </button>
    </section>
  );
}

function UpcomingMilestones() {
  const milestones = simulationData.renewals
    .slice()
    .sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate))
    .slice(0, 3);

  return (
    <section className="upcoming-milestones card">
      <h2>Upcoming Milestones</h2>
      <div className="milestone-list">
        {milestones.map((renewal) => (
          <article className="milestone-row" key={renewal.id}>
            <time>{formatDate(renewal.expiryDate)}</time>
            <div>
              <strong>{clientName(renewal.clientId)}</strong>
              <span>Renewal due</span>
            </div>
            <div>
              <strong>{millionCurrency(renewal.premiumAtRenewal)}</strong>
              <span>Premium</span>
            </div>
            <div>
              <strong>{dueLabel(renewal.expiryDate).replace('Due in ', '').replace(' days', '')}</strong>
              <span>Days</span>
            </div>
          </article>
        ))}
      </div>
      <button className="text-link text-link--center" type="button">
        View Full Calendar
        <ArrowRight size={15} />
      </button>
    </section>
  );
}

export function CommandCenter() {
  const businessMetrics = {
    ...simulationData.businessMetrics,
    activeClients: simulationData.clients.length,
    averageClientHealth: Math.round(getAverage(simulationData.clients, 'clientHealthScore')),
    averageComplianceScore: Math.round(getAverage(simulationData.clients, 'complianceScore')),
    totalManagedPremium: getSum(simulationData.clients, 'annualPremium'),
  };

  return (
    <div className="executive-dashboard page-transition">
      <section className="dashboard-title">
        <div>
          <h1>Executive Dashboard</h1>
          <p>Your portfolio overview across clients, renewals, submissions, and claims.</p>
        </div>
      </section>

      <section className="dashboard-top-grid">
        <ExecutiveSummary metrics={businessMetrics} />
        <KpiStrip metrics={businessMetrics} />
      </section>

      <section className="dashboard-main-grid">
        <RenewalPipeline />
        <PriorityActions />
        <ActivePlacements />
        <OperationalSnapshot metrics={businessMetrics} />
        <RecentActivity />
        <UpcomingMilestones />
      </section>
    </div>
  );
}
