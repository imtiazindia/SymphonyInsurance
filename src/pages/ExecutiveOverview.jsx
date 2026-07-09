import {
  AlertTriangle,
  BriefcaseBusiness,
  CheckCircle2,
  CircleDollarSign,
  FileWarning,
  UsersRound,
} from 'lucide-react';
import {
  BusinessActivityTimeline,
  BusinessKpiCard,
  ClientHealthBadge,
  PriorityItemCard,
  WorkloadIndicator,
} from '../components/BusinessComponents.jsx';
import { simulationData } from '../data/demoData.js';
import {
  calculateRevenueAtRisk,
  getAverage,
  getClaimsExposure,
  getClientHealthCategory,
  getHighPriorityClients,
  getOverdueTasks,
  getRenewalsDueSoon,
  getSum,
  getTeamWorkload,
} from '../utils/businessCalculations.js';

const asOfDate = '2026-07-09';

const compactCurrencyFormatter = new Intl.NumberFormat('en-US', {
  currency: 'USD',
  maximumFractionDigits: 1,
  notation: 'compact',
  style: 'currency',
});

const percentFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 0,
  style: 'percent',
});

const timeFormatter = new Intl.DateTimeFormat('en-US', {
  hour: 'numeric',
  minute: '2-digit',
  month: 'short',
  day: 'numeric',
});

const clientById = new Map(simulationData.clients.map((client) => [client.id, client]));
const userById = new Map(simulationData.teamMembers.map((user) => [user.id, user]));

function compactCurrency(value) {
  return compactCurrencyFormatter.format(value).replace('.0', '');
}

function clientName(clientId) {
  return clientById.get(clientId)?.name ?? 'Portfolio';
}

function userName(userId) {
  return userById.get(userId)?.name ?? 'Unassigned';
}

function SectionHeader({ title, text }) {
  return (
    <div className="overview-section-header">
      <h2>{title}</h2>
      {text ? <p>{text}</p> : null}
    </div>
  );
}

function buildAttentionItems(metrics) {
  const ownerRenewal = simulationData.renewals
    .filter((renewal) => renewal.ownerAttentionRequired || renewal.readinessScore < 75)
    .sort((a, b) => b.revenueAtRisk - a.revenueAtRisk)[0];

  const majorClaim = simulationData.claims
    .filter((claim) => claim.executiveReviewRequired)
    .sort((a, b) => b.reserveAmount - a.reserveAmount)[0];

  const decision = simulationData.negotiations
    .filter((negotiation) => negotiation.decisionRequired)
    .sort((a, b) => b.estimatedSavings - a.estimatedSavings)[0];

  const overloadedManager = simulationData.teamMembers
    .filter((member) => member.role === 'Account Manager')
    .sort((a, b) => b.workloadScore - a.workloadScore)[0];

  const retentionConcern = getHighPriorityClients(simulationData.clients)
    .sort((a, b) => b.estimatedRevenue - a.estimatedRevenue)[0];

  const complianceIssue = simulationData.compliance
    .filter((item) => item.severity === 'High' || item.status === 'Overdue')
    .sort((a, b) => {
      const severityScore = (value) => (value === 'High' ? 2 : value === 'Medium' ? 1 : 0);
      return severityScore(b.severity) - severityScore(a.severity) || new Date(a.dueDate) - new Date(b.dueDate);
    })[0];

  const overloadedClient = overloadedManager
    ? simulationData.clients
        .filter((client) => overloadedManager.assignedClients.includes(client.id))
        .sort((a, b) => b.openTasksCount - a.openTasksCount)[0]
    : null;

  return [
    ownerRenewal && {
      id: 'renewal-risk',
      clientId: ownerRenewal.clientId,
      clientName: clientName(ownerRenewal.clientId),
      issue: `${ownerRenewal.currentStage} renewal has ${ownerRenewal.missingItems.length} open item${ownerRenewal.missingItems.length === 1 ? '' : 's'}.`,
      impact: compactCurrency(ownerRenewal.revenueAtRisk),
      owner: userName(ownerRenewal.assignedUserId),
      nextStep: 'Schedule owner review and clear blockers before market follow-up.',
      priority: 'Critical',
      workflow: 'Renewals',
      detailHref: `/renewals/${ownerRenewal.id}`,
      detailLabel: 'Open renewal',
    },
    majorClaim && {
      id: 'claim-review',
      clientId: majorClaim.clientId,
      clientName: clientName(majorClaim.clientId),
      issue: `${majorClaim.claimType} claim requires executive review.`,
      impact: `${compactCurrency(majorClaim.reserveAmount)} reserve`,
      owner: 'Elena Brooks',
      nextStep: majorClaim.nextAction,
      priority: majorClaim.severity,
      workflow: 'Claims',
      detailHref: `/claims/${majorClaim.id}`,
      detailLabel: 'Open claim',
    },
    decision && {
      id: 'placement-decision',
      clientId: decision.clientId,
      clientName: clientName(decision.clientId),
      issue: `${decision.recommendedInsurer} terms require an owner decision.`,
      impact: `${compactCurrency(decision.estimatedSavings)} savings opportunity`,
      owner: userName(clientById.get(decision.clientId)?.assignedPlacementLeadId),
      nextStep: decision.pendingQuestions[0] ?? 'Review quote strategy and approve market direction.',
      priority: 'High',
      workflow: 'Market Placement',
      detailHref: `/market-placement/${decision.id}`,
      detailLabel: 'Open placement',
    },
    overloadedManager && overloadedClient && {
      id: 'manager-load',
      clientId: overloadedClient.id,
      clientName: overloadedClient.name,
      issue: `${overloadedManager.name} is carrying ${overloadedManager.workloadScore}% workload across key accounts.`,
      impact: compactCurrency(
        simulationData.clients
          .filter((client) => overloadedManager.assignedClients.includes(client.id))
          .reduce((total, client) => total + client.estimatedRevenue, 0),
      ),
      owner: overloadedManager.name,
      nextStep: 'Reassign two lower-complexity accounts before renewal deadlines tighten.',
      priority: 'High',
      workflow: 'Team Workload',
      detailHref: '/account-manager',
      detailLabel: 'Open workspace',
    },
    retentionConcern && {
      id: 'retention-concern',
      clientId: retentionConcern.id,
      clientName: retentionConcern.name,
      issue: `${retentionConcern.retentionRisk} retention risk with ${retentionConcern.openTasksCount} open tasks.`,
      impact: compactCurrency(retentionConcern.estimatedRevenue),
      owner: userName(retentionConcern.assignedAccountManagerId),
      nextStep: 'Hold relationship review and confirm client communication plan.',
      priority: retentionConcern.priorityLevel,
      workflow: 'Client Health',
      detailHref: `/clients?clientId=${retentionConcern.id}`,
      detailLabel: 'Open client',
    },
    complianceIssue && {
      id: 'compliance-issue',
      clientId: complianceIssue.clientId,
      clientName: clientName(complianceIssue.clientId),
      issue: `${complianceIssue.findingType} is ${complianceIssue.status.toLowerCase()} with ${complianceIssue.severity.toLowerCase()} severity.`,
      impact: complianceIssue.businessImpact,
      owner: userName(complianceIssue.assignedUserId),
      nextStep: complianceIssue.correctiveAction,
      priority: complianceIssue.severity,
      workflow: 'Compliance',
      detailHref: `/compliance/${complianceIssue.id}`,
      detailLabel: 'Open compliance item',
    },
  ]
    .filter(Boolean)
    .slice(0, Math.max(5, metrics.openExecutivePriorities));
}

function TopSummary({ metrics }) {
  return (
    <section className="owner-summary-grid" aria-label="Executive business summary">
      <BusinessKpiCard
        label="Estimated Annual Revenue"
        value={compactCurrency(metrics.estimatedAnnualRevenue)}
        helper="Projected brokerage revenue"
        icon={CircleDollarSign}
      />
      <BusinessKpiCard
        label="Renewal Revenue Pipeline"
        value={compactCurrency(metrics.renewalRevenuePipeline)}
        helper="Premium tied to active renewals"
        icon={BriefcaseBusiness}
      />
      <BusinessKpiCard
        label="Revenue at Risk"
        value={compactCurrency(metrics.revenueAtRisk)}
        helper="Needs owner or team action"
        icon={AlertTriangle}
        tone="red"
      />
      <BusinessKpiCard
        label="Active Clients"
        value={metrics.activeClients}
        helper={`${metrics.averageClientHealth}% average client health`}
        icon={UsersRound}
      />
      <BusinessKpiCard
        label="Retention Rate"
        value={`${metrics.retentionRate}%`}
        helper="Trailing 12 months"
        icon={CheckCircle2}
        tone="green"
      />
      <BusinessKpiCard
        label="Open Executive Priorities"
        value={metrics.openExecutivePriorities}
        helper="Requires owner attention"
        icon={FileWarning}
        tone="amber"
      />
    </section>
  );
}

function AttentionRequired({ items }) {
  return (
    <section className="overview-card owner-attention-card">
      <SectionHeader
        title="Owner Attention Required"
        text="Prioritized items with financial or relationship impact."
      />
      <div className="attention-list">
        {items.map((item) => (
          <PriorityItemCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}

function BusinessPerformance({ metrics }) {
  const forecast = [0.88, 0.93, 0.97, 1.02, 1.08, 1.14].map((factor, index) => ({
    label: ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][index],
    value: Math.round(metrics.projectedMonthlyRevenue * factor),
  }));
  const maxForecast = Math.max(...forecast.map((month) => month.value));
  const stageNames = ['Data Collection', 'Submission Ready', 'Marketed', 'Negotiation', 'Binding', 'At Risk'];
  const renewalStages = stageNames.map((stage) => ({
    label: stage,
    value: getSum(simulationData.renewals.filter((renewal) => renewal.currentStage === stage), 'premiumAtRenewal'),
  }));
  const maxStage = Math.max(...renewalStages.map((stage) => stage.value));
  const optimizedPolicies = simulationData.policies.filter((policy) => policy.optimizationOpportunity);
  const optimizationRevenue = Math.round(getSum(optimizedPolicies, 'estimatedCommission') * 0.08);

  return (
    <section className="overview-card business-performance-card">
      <SectionHeader
        title="Business Performance"
        text="A concise view of revenue momentum and where margin can improve."
      />
      <div className="performance-grid">
        <div className="performance-panel">
          <h3>Monthly Revenue Forecast</h3>
          <div className="forecast-bars">
            {forecast.map((month) => (
              <div className="forecast-bar" key={month.label}>
                <i style={{ height: `${Math.max(18, (month.value / maxForecast) * 100)}%` }} />
                <span>{month.label}</span>
              </div>
            ))}
          </div>
          <strong>{compactCurrency(metrics.projectedMonthlyRevenue)}</strong>
          <small>Projected current month revenue</small>
        </div>
        <div className="performance-panel">
          <h3>Renewal Pipeline Value</h3>
          <div className="pipeline-value-list">
            {renewalStages.filter((stage) => stage.value > 0).map((stage) => (
              <div className="pipeline-value-row" key={stage.label}>
                <span>{stage.label}</span>
                <i><b style={{ width: `${(stage.value / maxStage) * 100}%` }} /></i>
                <strong>{compactCurrency(stage.value)}</strong>
              </div>
            ))}
          </div>
        </div>
        <div className="performance-panel">
          <h3>Premium / Revenue Trend</h3>
          <svg className="business-line-chart" viewBox="0 0 280 110" aria-label="Premium and revenue trend">
            <path className="trend-area" d="M12 88 C44 78 58 70 88 72 S136 48 165 54 S214 30 268 22 L268 104 L12 104 Z" />
            <path className="trend-line-primary" d="M12 88 C44 78 58 70 88 72 S136 48 165 54 S214 30 268 22" />
            <path className="trend-line-secondary" d="M12 96 C54 90 70 86 104 84 S154 68 178 70 S226 52 268 47" />
          </svg>
          <small>Premium growth is outpacing revenue risk concentration.</small>
        </div>
        <div className="performance-panel optimization-panel">
          <h3>Policy Optimization Opportunity</h3>
          <strong>{optimizedPolicies.length}</strong>
          <span>coverage or commission opportunities</span>
          <p>System Insight: prioritize cyber/control evidence and preferred pricing requests on strong submissions.</p>
          <em>{compactCurrency(optimizationRevenue)} estimated near-term revenue lift</em>
        </div>
      </div>
    </section>
  );
}

function ClientHealthSnapshot() {
  const healthGroups = simulationData.clients.reduce(
    (groups, client) => {
      const category = getClientHealthCategory(client.clientHealthScore);
      if (category === 'Strong' || category === 'Stable') groups.healthy += 1;
      if (category === 'Watch') groups.watch += 1;
      if (category === 'At Risk' || client.retentionRisk === 'High') groups.risk += 1;
      return groups;
    },
    { healthy: 0, watch: 0, risk: 0 },
  );

  const needsAttention = simulationData.clients
    .slice()
    .sort((a, b) => {
      const riskRank = { Critical: 3, High: 2, Medium: 1, Low: 0 };
      return riskRank[b.priorityLevel] - riskRank[a.priorityLevel] || a.clientHealthScore - b.clientHealthScore;
    })
    .slice(0, 5);

  return (
    <section className="overview-card">
      <SectionHeader title="Client Health Snapshot" />
      <div className="health-count-grid">
        <div>
          <span>Healthy Clients</span>
          <strong>{healthGroups.healthy}</strong>
        </div>
        <div>
          <span>Watchlist Clients</span>
          <strong>{healthGroups.watch}</strong>
        </div>
        <div>
          <span>At-Risk Clients</span>
          <strong>{healthGroups.risk}</strong>
        </div>
      </div>
      <div className="compact-list">
        {needsAttention.map((client) => (
          <article key={client.id}>
            <div>
              <strong>{client.name}</strong>
              <span>{client.relationshipStatus} / {client.retentionRisk} retention risk</span>
            </div>
            <ClientHealthBadge score={client.clientHealthScore} />
          </article>
        ))}
      </div>
    </section>
  );
}

function RenewalPlacementSnapshot({ metrics }) {
  const submissionsNotReady = simulationData.submissions.filter((submission) => submission.completionPercent < 85).length;
  const negotiationsAwaitingDecision = simulationData.negotiations.filter((negotiation) => negotiation.decisionRequired).length;

  return (
    <section className="overview-card">
      <SectionHeader title="Renewal & Placement Snapshot" />
      <div className="snapshot-metric-grid">
        <SnapshotMetric label="Renewals due in 30 days" value={getRenewalsDueSoon(simulationData.renewals, 30).length} />
        <SnapshotMetric label="Renewals at risk" value={metrics.renewalsAtRisk} tone="red" />
        <SnapshotMetric label="Submissions not ready" value={submissionsNotReady} tone="amber" />
        <SnapshotMetric label="Placement decisions pending" value={negotiationsAwaitingDecision} tone="blue" />
        <SnapshotMetric label="Estimated savings opportunity" value={compactCurrency(metrics.negotiationSavingsOpportunity)} tone="green" />
      </div>
    </section>
  );
}

function ClaimsComplianceSnapshot({ metrics }) {
  const claimsExposure = getClaimsExposure(simulationData.claims);
  const overdueCompliance = simulationData.compliance.filter((item) => item.status === 'Overdue').length;
  const highSeverityFindings = simulationData.compliance.filter((item) => item.severity === 'High').length;

  return (
    <section className="overview-card">
      <SectionHeader title="Claims & Compliance Snapshot" />
      <div className="snapshot-metric-grid">
        <SnapshotMetric label="Open claims" value={claimsExposure.count} />
        <SnapshotMetric label="Claims requiring review" value={claimsExposure.requiringReview} tone="red" />
        <SnapshotMetric label="Reserve exposure" value={compactCurrency(claimsExposure.reserveAmount)} tone="amber" />
        <SnapshotMetric label="Incurred exposure" value={compactCurrency(claimsExposure.incurredAmount)} />
        <SnapshotMetric label="Overdue compliance actions" value={overdueCompliance} tone="red" />
        <SnapshotMetric label="High-severity findings" value={highSeverityFindings} tone="amber" />
      </div>
      <p className="system-note">Recommended Action: review high-reserve claims before approving renewal strategy for affected accounts.</p>
    </section>
  );
}

function SnapshotMetric({ label, value, tone = 'blue' }) {
  return (
    <article className={`snapshot-metric snapshot-metric--${tone}`}>
      <strong>{value}</strong>
      <span>{label}</span>
    </article>
  );
}

function TeamWorkload({ metrics }) {
  const workload = getTeamWorkload(simulationData.teamMembers, simulationData.tasks);
  const overloaded = workload.filter((member) => member.workloadScore >= 80);
  const overdueTasks = getOverdueTasks(simulationData.tasks, asOfDate);
  const reassignmentAccounts = simulationData.clients.filter((client) => {
    const manager = userById.get(client.assignedAccountManagerId);
    return manager?.workloadScore >= 80 && client.openTasksCount >= 6;
  });

  return (
    <section className="overview-card team-workload-card">
      <SectionHeader title="Team Workload" text="Capacity view for reassignment and escalation decisions." />
      <div className="team-summary-row">
        <SnapshotMetric label="Overloaded people" value={overloaded.length} tone="amber" />
        <SnapshotMetric label="Overdue tasks" value={overdueTasks.length} tone="red" />
        <SnapshotMetric label="Accounts needing reassignment" value={reassignmentAccounts.length} tone="blue" />
        <SnapshotMetric label="Team utilization" value={`${metrics.teamUtilization}%`} tone="green" />
      </div>
      <div className="workload-list">
        {workload.map((member) => (
          <article className="workload-person" key={member.id}>
            <div>
              <strong>{member.name}</strong>
              <span>{member.role}</span>
            </div>
            <WorkloadIndicator score={member.workloadScore} />
          </article>
        ))}
      </div>
    </section>
  );
}

function RecentBusinessActivity() {
  const meaningfulTypes = ['Placement Update', 'Renewal Update', 'Claim Update', 'Document Update', 'Compliance Update'];
  const events = simulationData.activities
    .filter((activity) => meaningfulTypes.includes(activity.activityType) || activity.importanceLevel === 'High')
    .slice(0, 6);

  return (
    <section className="overview-card recent-business-card">
      <SectionHeader title="Recent Business Activity" />
      <BusinessActivityTimeline
        activities={events}
        getClientName={clientName}
        formatTime={(timestamp) => timeFormatter.format(new Date(timestamp))}
      />
    </section>
  );
}

export function ExecutiveOverview() {
  const calculatedMetrics = {
    ...simulationData.businessMetrics,
    activeClients: simulationData.clients.length,
    averageClientHealth: getAverage(simulationData.clients, 'clientHealthScore'),
    estimatedAnnualRevenue: getSum(simulationData.clients, 'estimatedRevenue'),
    negotiationSavingsOpportunity: getSum(simulationData.negotiations, 'estimatedSavings'),
    openExecutivePriorities:
      simulationData.renewals.filter((renewal) => renewal.ownerAttentionRequired).length +
      simulationData.claims.filter((claim) => claim.executiveReviewRequired).length +
      simulationData.negotiations.filter((negotiation) => negotiation.decisionRequired).length,
    renewalRevenuePipeline: getSum(simulationData.renewals, 'premiumAtRenewal'),
    revenueAtRisk: calculateRevenueAtRisk(simulationData.renewals, simulationData.clients),
    teamUtilization: getAverage(simulationData.teamMembers, 'workloadScore'),
  };
  const attentionItems = buildAttentionItems(calculatedMetrics);

  return (
    <div className="executive-overview page-transition">
      <section className="overview-hero">
        <div>
          <span>Owner Workspace</span>
          <h1>Executive Overview</h1>
          <p>How the business is performing today, and what needs your attention.</p>
        </div>
        <aside>
          <strong>{percentFormatter.format(calculatedMetrics.retentionRate / 100)}</strong>
          <span>Retention rate</span>
        </aside>
      </section>

      <TopSummary metrics={calculatedMetrics} />
      <AttentionRequired items={attentionItems} />
      <BusinessPerformance metrics={calculatedMetrics} />

      <section className="overview-two-column">
        <ClientHealthSnapshot />
        <RenewalPlacementSnapshot metrics={calculatedMetrics} />
      </section>

      <section className="overview-two-column overview-two-column--wide-left">
        <ClaimsComplianceSnapshot metrics={calculatedMetrics} />
        <TeamWorkload metrics={calculatedMetrics} />
      </section>

      <RecentBusinessActivity />
    </div>
  );
}
