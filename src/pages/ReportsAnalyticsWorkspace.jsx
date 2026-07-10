import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  BadgeDollarSign,
  BarChart3,
  BriefcaseBusiness,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  FileText,
  Gauge,
  LineChart,
  Printer,
  Send,
  ShieldCheck,
  TrendingUp,
  UsersRound,
} from 'lucide-react';
import {
  BusinessActivityTimeline,
  BusinessKpiCard,
  RevenueImpactLabel,
  WorkloadIndicator,
} from '../components/BusinessComponents.jsx';
import { simulationData } from '../data/demoData.js';
import { aviationRiskIndex, getAriTopFactors, getAriView } from '../utils/aviationRiskIndex.js';
import {
  calculateRevenueAtRisk,
  getAverage,
  getClaimsExposure,
  getDocumentGapCount,
  getOverdueTasks,
  getSum,
} from '../utils/businessCalculations.js';

const asOfDate = '2026-07-10';
const ariView = getAriView('domestic');

const compactCurrencyFormatter = new Intl.NumberFormat('en-US', {
  currency: 'USD',
  maximumFractionDigits: 1,
  notation: 'compact',
  style: 'currency',
});

const timeFormatter = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', month: 'short', day: 'numeric' });

const clientById = new Map(simulationData.clients.map((client) => [client.id, client]));
const userById = new Map(simulationData.teamMembers.map((user) => [user.id, user]));

const savedViews = [
  ['executive', 'Executive Summary'],
  ['currentMonth', 'Current Month'],
  ['quarter', 'Quarter'],
  ['year', 'Year'],
  ['highValue', 'High Value Clients'],
  ['renewals', 'Renewals'],
  ['claims', 'Claims'],
  ['compliance', 'Compliance'],
];

function compactCurrency(value) {
  return compactCurrencyFormatter.format(value || 0).replace('.0', '');
}

function userName(userId) {
  return userById.get(userId)?.name ?? 'Unassigned';
}

function getRegion(location = '') {
  const state = location.split(',').at(-1)?.trim();
  if (['TX', 'OK', 'AZ', 'NM'].includes(state)) return 'Southwest';
  if (['CA', 'WA', 'OR', 'WY'].includes(state)) return 'West';
  if (['NJ', 'NY', 'FL', 'GA'].includes(state)) return 'East';
  return 'Central';
}

function getBusinessMetrics() {
  const clients = simulationData.clients;
  const renewals = simulationData.renewals;
  const claims = simulationData.claims;
  const submissions = simulationData.submissions;
  const negotiations = simulationData.negotiations;
  const compliance = simulationData.compliance;
  const documents = simulationData.documents;
  const tasks = simulationData.tasks;
  const teamMembers = simulationData.teamMembers;
  const totalPremium = getSum(clients, 'annualPremium');
  const annualRevenue = getSum(clients, 'estimatedRevenue');
  const revenueAtRisk = calculateRevenueAtRisk(renewals, clients);
  const revenuePipeline = getSum(renewals, 'premiumAtRenewal');
  const openExecutivePriorities =
    renewals.filter((renewal) => renewal.ownerAttentionRequired).length +
    claims.filter((claim) => claim.executiveReviewRequired).length +
    compliance.filter((item) => item.status === 'Overdue').length;
  const retentionRate = 100 - Math.round((clients.filter((client) => client.retentionRisk === 'High').length / Math.max(1, clients.length)) * 100);
  const renewalSuccess = Math.round(getAverage(renewals, 'readinessScore'));
  const submissionReadiness = Math.round(getAverage(submissions, 'completionPercent'));
  const quoteSuccess = Math.round((negotiations.filter((item) => item.quotesReceived > 0).length / Math.max(1, negotiations.length)) * 100);
  const complianceClosure = Math.round((compliance.filter((item) => item.status !== 'Overdue').length / Math.max(1, compliance.length)) * 100);
  const taskCompletion = Math.round((tasks.filter((task) => task.status === 'Completed').length / Math.max(1, tasks.length)) * 100);
  const claimsExposure = getClaimsExposure(claims);
  const averageTeamCapacity = Math.round(getAverage(teamMembers, 'workloadScore'));
  const businessHealthScore = Math.round(
    retentionRate * 0.18 +
    renewalSuccess * 0.16 +
    submissionReadiness * 0.12 +
    (100 - Math.min(100, (revenueAtRisk / Math.max(1, annualRevenue)) * 100)) * 0.16 +
    (100 - Math.min(100, claimsExposure.requiringReview * 9)) * 0.12 +
    complianceClosure * 0.12 +
    (100 - Math.abs(averageTeamCapacity - 72)) * 0.08 +
    (100 - ariView.score) * 0.06,
  );
  return {
    annualRevenue,
    averageClientHealth: Math.round(getAverage(clients, 'clientHealthScore')),
    averageCompliance: Math.round(getAverage(clients, 'complianceScore')),
    averageTeamCapacity,
    businessHealthScore,
    claimsExposure,
    complianceClosure,
    documentCompletion: Math.round(getAverage(clients, 'documentCompleteness')),
    openExecutivePriorities,
    quoteSuccess,
    renewalSuccess,
    retentionRate,
    revenueAtRisk,
    revenuePipeline,
    submissionReadiness,
    taskCompletion,
    totalPremium,
  };
}

function getBusinessHealthLabel(score) {
  if (score >= 84) return 'Healthy';
  if (score >= 72) return 'Stable';
  if (score >= 60) return 'Watch';
  return 'Needs Attention';
}

function buildPortfolioRows(clients = simulationData.clients) {
  return clients.map((client) => {
    const renewal = simulationData.renewals.find((item) => item.clientId === client.id);
    const claims = simulationData.claims.filter((item) => item.clientId === client.id);
    const compliance = simulationData.compliance.filter((item) => item.clientId === client.id);
    const documents = simulationData.documents.filter((item) => item.clientId === client.id);
    const documentGaps = getDocumentGapCount(documents);
    const riskScore = (100 - client.clientHealthScore) + documentGaps * 5 + claims.filter((claim) => claim.severity === 'High').length * 10 + compliance.filter((item) => item.status === 'Overdue').length * 8;
    return {
      client,
      claims,
      compliance,
      documentGaps,
      renewal,
      revenueAtRisk: renewal?.revenueAtRisk ?? Math.round(client.estimatedRevenue * 0.18),
      riskScore,
      riskLabel: riskScore >= 58 ? 'High' : riskScore >= 38 ? 'Elevated' : 'Guarded',
    };
  });
}

function applyFilters(rows, filters) {
  return rows.filter(({ client }) => {
    if (filters.accountManager !== 'all' && client.assignedAccountManagerId !== filters.accountManager) return false;
    if (filters.clientType !== 'all' && client.clientType !== filters.clientType) return false;
    if (filters.region !== 'all' && getRegion(client.location) !== filters.region) return false;
    if (filters.segment !== 'all' && client.industrySegment !== filters.segment) return false;
    if (filters.revenueRange === 'high' && client.estimatedRevenue < 1000000) return false;
    if (filters.revenueRange === 'mid' && (client.estimatedRevenue < 300000 || client.estimatedRevenue >= 1000000)) return false;
    if (filters.savedView === 'highValue' && client.annualPremium < 10000000) return false;
    return true;
  });
}

function SectionHeader({ title, text, action }) {
  return (
    <header className="reports-section-header">
      <div>
        <h2>{title}</h2>
        {text ? <p>{text}</p> : null}
      </div>
      {action}
    </header>
  );
}

function FilterBar({ filters, setFilters }) {
  const accountManagers = simulationData.teamMembers.filter((user) => user.role === 'Account Manager');
  const clientTypes = Array.from(new Set(simulationData.clients.map((client) => client.clientType))).sort();
  const regions = Array.from(new Set(simulationData.clients.map((client) => getRegion(client.location)))).sort();
  const segments = Array.from(new Set(simulationData.clients.map((client) => client.industrySegment))).sort();
  function update(key, value) {
    setFilters((current) => ({ ...current, [key]: value }));
  }
  return (
    <section className="reports-filter-card" aria-label="Reports filters">
      <label><span>Saved View</span><select value={filters.savedView} onChange={(event) => update('savedView', event.target.value)}>{savedViews.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <label><span>Time Period</span><select value={filters.period} onChange={(event) => update('period', event.target.value)}><option value="month">Current Month</option><option value="quarter">Quarter</option><option value="year">Year</option></select></label>
      <label><span>Account Manager</span><select value={filters.accountManager} onChange={(event) => update('accountManager', event.target.value)}><option value="all">All Managers</option>{accountManagers.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}</select></label>
      <label><span>Client Type</span><select value={filters.clientType} onChange={(event) => update('clientType', event.target.value)}><option value="all">All Types</option>{clientTypes.map((type) => <option key={type} value={type}>{type}</option>)}</select></label>
      <label><span>Region</span><select value={filters.region} onChange={(event) => update('region', event.target.value)}><option value="all">All Regions</option>{regions.map((region) => <option key={region} value={region}>{region}</option>)}</select></label>
      <label><span>Segment</span><select value={filters.segment} onChange={(event) => update('segment', event.target.value)}><option value="all">All Segments</option>{segments.map((segment) => <option key={segment} value={segment}>{segment}</option>)}</select></label>
      <label><span>Insurer</span><select value={filters.insurer} onChange={(event) => update('insurer', event.target.value)}><option value="all">All Insurers</option>{Array.from(new Set(simulationData.policies.map((policy) => policy.insurer))).sort().map((insurer) => <option key={insurer} value={insurer}>{insurer}</option>)}</select></label>
      <label><span>Revenue Range</span><select value={filters.revenueRange} onChange={(event) => update('revenueRange', event.target.value)}><option value="all">Any Revenue</option><option value="high">High Revenue</option><option value="mid">Mid Revenue</option></select></label>
    </section>
  );
}

function ExecutivePerformance({ metrics, onBrief }) {
  return (
    <section>
      <div className="reports-executive-grid">
        <BusinessKpiCard icon={BriefcaseBusiness} label="Managed Premium" value={compactCurrency(metrics.totalPremium)} helper={`${simulationData.clients.length} active clients`} />
        <BusinessKpiCard icon={BadgeDollarSign} label="Annual Revenue" value={compactCurrency(metrics.annualRevenue)} helper="Estimated brokerage revenue" tone="green" />
        <BusinessKpiCard icon={TrendingUp} label="Revenue Pipeline" value={compactCurrency(metrics.revenuePipeline)} helper="Renewal premium pipeline" />
        <BusinessKpiCard icon={AlertTriangle} label="Revenue At Risk" value={compactCurrency(metrics.revenueAtRisk)} helper="Renewal and priority exposure" tone="red" />
        <BusinessKpiCard icon={ShieldCheck} label="Retention Rate" value={`${metrics.retentionRate}%`} helper="High-risk clients excluded" tone="green" />
        <BusinessKpiCard icon={Gauge} label="Average Client Health" value={metrics.averageClientHealth} helper="Portfolio health score" />
        <BusinessKpiCard icon={UsersRound} label="Client Growth" value="+3" helper="Simulated current year" tone="green" />
        <BusinessKpiCard icon={CheckCircle2} label="Renewal Success Rate" value={`${metrics.renewalSuccess}%`} helper="Average readiness proxy" />
        <BusinessKpiCard icon={ClipboardList} label="Executive Priorities" value={metrics.openExecutivePriorities} helper="Needs management focus" tone="amber" />
        <BusinessKpiCard icon={LineChart} label="ARI Status" value={ariView.category} helper={`${ariView.score}/100 domestic`} tone="amber" />
      </div>
      <section className="reports-health-card">
        <div>
          <span>Business Health Index</span>
          <strong>{metrics.businessHealthScore}</strong>
          <em>{getBusinessHealthLabel(metrics.businessHealthScore)}</em>
        </div>
        <ul>
          <li>Retention: {metrics.retentionRate}%</li>
          <li>Renewal readiness: {metrics.renewalSuccess}%</li>
          <li>Document completion: {metrics.documentCompletion}%</li>
          <li>Team capacity: {metrics.averageTeamCapacity}%</li>
          <li>ARI drag: {ariView.category}</li>
        </ul>
        <button type="button" onClick={onBrief}><Printer size={15} /> Prepare Executive Brief</button>
      </section>
    </section>
  );
}

function ExecutiveInsights({ metrics, rows }) {
  const topRisk = rows.slice().sort((a, b) => b.revenueAtRisk - a.revenueAtRisk).slice(0, 3);
  const topRiskLabel = topRisk.length ? topRisk.map((row) => row.client.name).join(', ') : 'the current filtered portfolio';
  const insights = [
    `Revenue at risk is concentrated in ${topRiskLabel}.`,
    `Client retention remains ${metrics.retentionRate >= 88 ? 'strong' : 'watch-listed'} with ${simulationData.clients.filter((client) => client.retentionRisk === 'High').length} high-risk relationships.`,
    `Submission readiness is ${metrics.submissionReadiness}%, with document completion at ${metrics.documentCompletion}%.`,
    `Market activity has produced ${compactCurrency(getSum(simulationData.negotiations, 'estimatedSavings'))} in visible savings opportunity.`,
    `${metrics.openExecutivePriorities} executive priority items are visible across renewals, claims and compliance.`,
    `ARI remains ${ariView.category}; ${getAriTopFactors(ariView, 2).map((factor) => factor.label).join(' and ')} are the leading external factors.`,
  ];
  return (
    <section className="reports-card">
      <SectionHeader title="Executive Insights" text="Deterministic management observations from the shared business model." />
      <div className="reports-insight-grid">
        {insights.map((insight) => <article key={insight}><BarChart3 size={16} /><p>{insight}</p></article>)}
      </div>
    </section>
  );
}

function DecisionSupport() {
  const placement = simulationData.negotiations.find((item) => item.decisionRequired);
  const renewal = simulationData.renewals.slice().sort((a, b) => b.revenueAtRisk - a.revenueAtRisk)[0];
  const overloaded = simulationData.teamMembers.find((member) => member.workloadScore >= 80);
  const decisions = [
    placement ? {
      title: `Approve placement recommendation for ${clientById.get(placement.clientId)?.name}`,
      reason: `Recommended insurer is ${placement.recommendedInsurer}; decision is required before binding.`,
      impact: compactCurrency(placement.estimatedSavings || clientById.get(placement.clientId)?.estimatedRevenue),
      route: `/market-placement/${placement.id}`,
    } : null,
    renewal ? {
      title: `Escalate delayed renewal for ${clientById.get(renewal.clientId)?.name}`,
      reason: renewal.missingItems.length ? `Missing ${renewal.missingItems[0].toLowerCase()}.` : 'High revenue concentration needs review.',
      impact: compactCurrency(renewal.revenueAtRisk),
      route: `/renewals/${renewal.id}`,
    } : null,
    overloaded ? {
      title: `Reassign workload for ${overloaded.name}`,
      reason: `Portfolio workload is ${overloaded.workloadScore}, above recommended operating range.`,
      impact: `${overloaded.openTasks} open tasks`,
      route: '/account-manager',
    } : null,
  ].filter(Boolean);
  return (
    <section className="reports-card">
      <SectionHeader title="Decision Support" text="Management decisions with reason, financial impact and direct workflow navigation." />
      <div className="reports-decision-grid">
        {decisions.map((decision) => (
          <article key={decision.title}>
            <span>Decision Required</span>
            <h3>{decision.title}</h3>
            <p>{decision.reason}</p>
            <strong>{decision.impact}</strong>
            <Link to={decision.route}>Open workflow <ArrowRight size={14} /></Link>
          </article>
        ))}
      </div>
    </section>
  );
}

function PortfolioIntelligence({ rows }) {
  const byType = Array.from(new Map(rows.map((row) => [row.client.clientType, []])).keys()).map((type) => {
    const scoped = rows.filter((row) => row.client.clientType === type);
    return {
      type,
      revenue: getSum(scoped.map((row) => row.client), 'estimatedRevenue'),
      claims: scoped.reduce((total, row) => total + row.claims.length, 0),
      count: scoped.length,
      risk: Math.round(getAverage(scoped.map((row) => ({ value: row.riskScore })), 'value')),
      ari: scoped.filter((row) => row.client.clientType.includes('Charter') || row.client.industrySegment.includes('international')).length,
    };
  }).sort((a, b) => b.revenue - a.revenue);
  const topClients = rows.slice().sort((a, b) => b.client.estimatedRevenue - a.client.estimatedRevenue).slice(0, 6);
  const riskClients = rows.slice().sort((a, b) => b.riskScore - a.riskScore).slice(0, 6);
  return (
    <section className="reports-card">
      <SectionHeader title="Portfolio Intelligence" text="Client concentration, risk, relationship health and drill-down to Client 360." />
      <div className="reports-two-column">
        <div className="reports-table-card">
          <h3>Top Revenue Clients</h3>
          {topClients.map((row) => (
            <Link key={row.client.id} to={`/clients/${row.client.id}`}>
              <strong>{row.client.name}</strong>
              <span>{compactCurrency(row.client.estimatedRevenue)}</span>
              <em>{row.client.relationshipStatus}</em>
            </Link>
          ))}
        </div>
        <div className="reports-table-card">
          <h3>Retention Watchlist</h3>
          {riskClients.map((row) => (
            <Link key={row.client.id} to={`/clients/${row.client.id}`}>
              <strong>{row.client.name}</strong>
              <span>{row.riskLabel}</span>
              <em>{compactCurrency(row.revenueAtRisk)} at risk</em>
            </Link>
          ))}
        </div>
      </div>
      <div className="reports-segment-grid">
        {byType.map((segment) => (
          <article key={segment.type}>
            <strong>{segment.type}</strong>
            <span>{segment.count} clients</span>
            <dl>
              <div><dt>Revenue</dt><dd>{compactCurrency(segment.revenue)}</dd></div>
              <div><dt>Risk</dt><dd>{segment.risk}</dd></div>
              <div><dt>Claims</dt><dd>{segment.claims}</dd></div>
              <div><dt>ARI Exposure</dt><dd>{segment.ari}</dd></div>
            </dl>
          </article>
        ))}
      </div>
    </section>
  );
}

function OperationalPerformance({ metrics }) {
  const items = [
    ['Renewal Completion Rate', metrics.renewalSuccess, 'Average renewal readiness'],
    ['Submission Readiness', metrics.submissionReadiness, 'Average submission completion'],
    ['Quote Success Rate', metrics.quoteSuccess, 'Placements with quote activity'],
    ['Claims Resolution Progress', 100 - Math.min(100, metrics.claimsExposure.requiringReview * 12), 'Executive review drag'],
    ['Compliance Closure Rate', metrics.complianceClosure, 'Open findings under control'],
    ['Document Completion Rate', metrics.documentCompletion, 'Average client document score'],
    ['Task Completion Rate', metrics.taskCompletion, 'Completed task ratio'],
  ];
  return (
    <section className="reports-card">
      <SectionHeader title="Operational Performance" text="Brokerage efficiency across renewal, submission, placement, claims, compliance, documents and tasks." />
      <div className="reports-performance-grid">
        {items.map(([label, value, helper]) => (
          <article key={label}>
            <div><span>{label}</span><strong>{value}%</strong></div>
            <i><b style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></i>
            <p>{helper}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function MarketIntelligence() {
  const insurers = Array.from(new Set(simulationData.policies.map((policy) => policy.insurer))).map((insurer) => {
    const policies = simulationData.policies.filter((policy) => policy.insurer === insurer);
    const negotiations = simulationData.negotiations.filter((item) => item.recommendedInsurer === insurer || item.insurersApproached.includes(insurer));
    const premium = getSum(policies, 'premium');
    return {
      insurer,
      acceptance: Math.min(96, 62 + negotiations.filter((item) => item.recommendedInsurer === insurer).length * 8),
      averagePremium: premium / Math.max(1, policies.length),
      policies: policies.length,
      quotes: getSum(negotiations, 'quotesReceived'),
      responseTime: 4 + (insurer.length % 5),
      revenue: getSum(policies, 'estimatedCommission'),
    };
  }).sort((a, b) => b.revenue - a.revenue).slice(0, 7);
  return (
    <section className="reports-card">
      <SectionHeader title="Market Intelligence" text="Insurer and market activity focused on business decisions." />
      <div className="reports-market-layout">
        <article className="reports-market-outlook">
          <h3>Current Market Outlook</h3>
          <p>Average savings achieved: {compactCurrency(getSum(simulationData.negotiations, 'estimatedSavings'))}. ARI is {ariView.category}; top risks are {getAriTopFactors(ariView, 3).map((factor) => factor.label).join(', ')}.</p>
          <div className="reports-chip-list">
            <span>Avg premium movement +3%</span>
            <span>Quote win rate {Math.round((simulationData.negotiations.filter((item) => item.recommendedInsurer).length / simulationData.negotiations.length) * 100)}%</span>
            <span>Underwriter trend: documents</span>
          </div>
        </article>
        <div className="reports-insurer-table">
          <div><span>Insurer</span><span>Policies</span><span>Quotes</span><span>Avg Premium</span><span>Response</span><span>Acceptance</span><span>Recommendation</span></div>
          {insurers.map((item) => (
            <article key={item.insurer}>
              <strong>{item.insurer}</strong><span>{item.policies}</span><span>{item.quotes}</span><span>{compactCurrency(item.averagePremium)}</span><span>{item.responseTime}d</span><span>{item.acceptance}%</span><em>{item.acceptance > 76 ? 'Preferred' : 'Selective'}</em>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function TeamPerformance() {
  const team = simulationData.teamMembers.map((member) => {
    const tasks = simulationData.tasks.filter((task) => task.assignedUserId === member.id);
    const clients = simulationData.clients.filter((client) => client.assignedAccountManagerId === member.id || client.assignedPlacementLeadId === member.id);
    return {
      ...member,
      clients: clients.length,
      tasks: tasks.length,
      overdue: tasks.filter((task) => task.status === 'Overdue').length,
      throughput: tasks.filter((task) => task.status === 'Completed').length + Math.max(1, Math.round(tasks.length * 0.45)),
    };
  });
  return (
    <section className="reports-card">
      <SectionHeader title="Team Performance" text="Management visibility into workload, throughput, capacity and bottlenecks." />
      <div className="reports-team-grid">
        {team.map((member) => (
          <article key={member.id}>
            <div>
              <strong>{member.name}</strong>
              <span>{member.role}</span>
            </div>
            <WorkloadIndicator score={member.workloadScore} />
            <dl>
              <div><dt>Clients</dt><dd>{member.clients}</dd></div>
              <div><dt>Open Tasks</dt><dd>{member.openTasks}</dd></div>
              <div><dt>Overdue</dt><dd>{member.overdueTasks}</dd></div>
              <div><dt>Throughput</dt><dd>{member.throughput}</dd></div>
            </dl>
            <em>{member.workloadScore >= 80 ? 'Capacity concern' : member.workloadScore < 62 ? 'Available capacity' : 'Balanced'}</em>
          </article>
        ))}
      </div>
    </section>
  );
}

function ForecastOutlook({ metrics }) {
  const expectedRevenue = metrics.annualRevenue + Math.round(getSum(simulationData.negotiations, 'estimatedSavings') * 0.12);
  const expectedCommission = getSum(simulationData.policies, 'estimatedCommission') + Math.round(metrics.revenuePipeline * 0.012);
  const conversion = Math.round((simulationData.negotiations.filter((item) => item.quotesReceived > 1).length / Math.max(1, simulationData.negotiations.length)) * 100);
  const confidence = Math.round((metrics.businessHealthScore + metrics.retentionRate + conversion) / 3);
  return (
    <section className="reports-card">
      <SectionHeader title="Forecast & Strategic Outlook" text="Deterministic forecast using the shared JSON data and current workflow state." />
      <div className="reports-forecast-grid">
        <ForecastCard label="Expected Revenue" value={compactCurrency(expectedRevenue)} helper="Revenue plus visible savings conversion" />
        <ForecastCard label="Renewal Forecast" value={compactCurrency(metrics.revenuePipeline)} helper={`${simulationData.renewals.length} renewal records`} />
        <ForecastCard label="Expected Commission" value={compactCurrency(expectedCommission)} helper="Policy commission plus pipeline proxy" />
        <ForecastCard label="Revenue At Risk" value={compactCurrency(metrics.revenueAtRisk)} helper="Current management exposure" tone="red" />
        <ForecastCard label="Pipeline Conversion" value={`${conversion}%`} helper="Quote activity proxy" />
        <ForecastCard label="Growth Projection" value="+8%" helper="Simulated annualized view" tone="green" />
        <ForecastCard label="Retention Forecast" value={`${metrics.retentionRate}%`} helper="Client health adjusted" tone="green" />
        <ForecastCard label="Projected Workload" value={`${metrics.averageTeamCapacity}%`} helper="Team utilization outlook" />
        <ForecastCard label="ARI Trend Outlook" value={ariView.category} helper={aviationRiskIndex.domestic.changeWindow} tone="amber" />
        <ForecastCard label="Business Confidence" value={`${confidence}%`} helper={getBusinessHealthLabel(metrics.businessHealthScore)} tone="green" />
      </div>
    </section>
  );
}

function ForecastCard({ label, value, helper, tone = 'blue' }) {
  return (
    <article className={`reports-forecast-card reports-forecast-card--${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{helper}</p>
    </article>
  );
}

function TrendAnalysis() {
  const trends = [
    ['Revenue Trend', [52, 55, 58, 62, 66, 70, 74], '+9%'],
    ['Premium Trend', [44, 48, 51, 57, 60, 64, 69], '+7%'],
    ['Retention Trend', [88, 89, 91, 90, 92, 94, 94], 'stable'],
    ['Claims Trend', [28, 31, 35, 33, 39, 42, 40], '+2'],
    ['Submission Trend', [61, 66, 68, 72, 74, 78, 81], '+6%'],
    ['Renewal Trend', [58, 60, 63, 70, 75, 79, 82], '+5%'],
    ['ARI Trend', [45, 48, 51, 52, 55, 57, ariView.score], ariView.category],
    ['Workload Trend', [66, 68, 70, 71, 73, 76, 78], 'watch'],
  ];
  return (
    <section className="reports-card">
      <SectionHeader title="Trend Analysis" text="Clean trend visuals for executive interpretation." />
      <div className="reports-trend-grid">
        {trends.map(([label, values, delta]) => (
          <article key={label}>
            <div><strong>{label}</strong><span>{delta}</span></div>
            <svg viewBox="0 0 140 46" role="img" aria-label={label}>
              <polyline points={values.map((value, index) => `${index * 22 + 2},${44 - value * 0.42}`).join(' ')} />
            </svg>
          </article>
        ))}
      </div>
    </section>
  );
}

function WhatChanged() {
  const changes = [
    ['Revenue At Risk', 'down 6%', 'good'],
    ['New Renewal', '+1', 'neutral'],
    ['Claims Closed', '+2', 'good'],
    ['Compliance Findings', '-3', 'good'],
    ['New Documents', '+18', 'neutral'],
    ['ARI', `up ${aviationRiskIndex.domestic.change} / ${ariView.category}`, 'watch'],
  ];
  return (
    <section className="reports-card">
      <SectionHeader title="What Changed?" text="Executive-friendly movement since the previous business day." />
      <div className="reports-change-grid">
        {changes.map(([label, value, tone]) => <article className={`reports-change-card reports-change-card--${tone}`} key={label}><span>{label}</span><strong>{value}</strong></article>)}
      </div>
    </section>
  );
}

function RecentBusinessEvents() {
  const events = [
    ...simulationData.activities,
    { id: 'biz-bound', clientId: 'CLI-004', userId: 'USR-003', timestamp: '2026-07-09T15:40:00Z', activityType: 'Large Renewal Bound', summary: 'Preferred quote received below target premium.', relatedModule: 'Market Placement', importanceLevel: 'High' },
    { id: 'biz-decision', clientId: 'CLI-003', userId: 'USR-001', timestamp: '2026-07-09T09:20:00Z', activityType: 'Executive Decision Recorded', summary: 'Leadership requested renewal strategy review.', relatedModule: 'Executive', importanceLevel: 'High' },
  ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 10);
  return (
    <section className="reports-card">
      <SectionHeader title="Recent Business Events" text="Unified strategic timeline across clients, renewals, placement, claims, compliance and ARI." />
      <BusinessActivityTimeline activities={events} getClientName={(clientId) => clientById.get(clientId)?.name ?? 'Portfolio'} formatTime={(timestamp) => timeFormatter.format(new Date(timestamp))} />
    </section>
  );
}

function ExportActions({ onAction }) {
  return (
    <div className="reports-export-actions">
      {[
        ['Export PDF', Printer],
        ['Export Excel', FileText],
        ['Schedule Report', CalendarClock],
        ['Share Dashboard', Send],
        ['Bookmark View', CheckCircle2],
      ].map(([label, Icon]) => (
        <button key={label} type="button" onClick={() => onAction(label)}>
          <Icon size={15} />
          {label}
        </button>
      ))}
    </div>
  );
}

function ExecutiveBrief({ metrics, rows, onClose }) {
  const topRisk = rows.slice().sort((a, b) => b.revenueAtRisk - a.revenueAtRisk)[0];
  return (
    <div className="reports-brief-backdrop">
      <section className="reports-brief-panel">
        <header>
          <div>
            <span>Executive Business Brief</span>
            <h2>Symphony Business Analytics</h2>
          </div>
          <div>
            <button type="button" onClick={() => window.print()}><Printer size={15} /> Print</button>
            <button type="button" onClick={onClose}>Close</button>
          </div>
        </header>
        <div className="reports-brief-grid">
          <BriefItem title="Business Summary" text={`${compactCurrency(metrics.totalPremium)} managed premium and ${compactCurrency(metrics.annualRevenue)} estimated annual revenue.`} />
          <BriefItem title="Key Achievements" text={`Retention forecast is ${metrics.retentionRate}% and quote success is ${metrics.quoteSuccess}%.`} />
          <BriefItem title="Current Risks" text={`${compactCurrency(metrics.revenueAtRisk)} revenue at risk; top client exposure is ${topRisk?.client.name}.`} />
          <BriefItem title="Major Decisions" text="Review placement recommendation, renewal escalation and workload balancing." />
          <BriefItem title="Revenue Position" text={`Pipeline is ${compactCurrency(metrics.revenuePipeline)} with expected conversion pressure from documents and claims.`} />
          <BriefItem title="ARI Summary" text={`ARI is ${ariView.category}; leading factors are ${getAriTopFactors(ariView, 3).map((factor) => factor.label).join(', ')}.`} />
          <BriefItem title="Operational Health" text={`Business Health Index is ${metrics.businessHealthScore} (${getBusinessHealthLabel(metrics.businessHealthScore)}).`} />
          <BriefItem title="Recommended Priorities" text="Protect high-value renewals, unblock documents, monitor executive claims, and rebalance overloaded teams." />
        </div>
      </section>
    </div>
  );
}

function BriefItem({ title, text }) {
  return <article><h3>{title}</h3><p>{text}</p></article>;
}

export function ReportsAnalyticsWorkspace() {
  const [filters, setFilters] = useState({
    accountManager: 'all',
    clientType: 'all',
    insurer: 'all',
    period: 'month',
    region: 'all',
    revenueRange: 'all',
    savedView: 'executive',
    segment: 'all',
  });
  const [briefOpen, setBriefOpen] = useState(false);
  const [actionLog, setActionLog] = useState([]);
  const metrics = useMemo(getBusinessMetrics, []);
  const rows = useMemo(() => applyFilters(buildPortfolioRows(), filters), [filters]);

  function handleAction(action) {
    setActionLog((current) => [`${action} simulated for Reports & Analytics`, ...current].slice(0, 5));
  }

  return (
    <div className="reports-workspace page-transition">
      <section className="reports-hero">
        <div>
          <span>Reports & Business Analytics</span>
          <h1>Executive Intelligence Centre</h1>
          <p>Understand performance, emerging trends, strategic opportunities and risks from one connected business layer.</p>
        </div>
        <RevenueImpactLabel value={compactCurrency(metrics.revenueAtRisk)} label="Revenue at risk" />
      </section>

      <FilterBar filters={filters} setFilters={setFilters} />
      <ExportActions onAction={handleAction} />

      <ExecutivePerformance metrics={metrics} onBrief={() => setBriefOpen(true)} />
      <ExecutiveInsights metrics={metrics} rows={rows} />
      <DecisionSupport />
      <PortfolioIntelligence rows={rows} />
      <OperationalPerformance metrics={metrics} />
      <MarketIntelligence />
      <TeamPerformance />
      <ForecastOutlook metrics={metrics} />
      <TrendAnalysis />
      <WhatChanged />
      <RecentBusinessEvents />

      {actionLog.length ? (
        <section className="reports-action-log">
          {actionLog.map((entry) => <span key={entry}>{entry}</span>)}
        </section>
      ) : null}

      {briefOpen ? <ExecutiveBrief metrics={metrics} rows={rows} onClose={() => setBriefOpen(false)} /> : null}
    </div>
  );
}
