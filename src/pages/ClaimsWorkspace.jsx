import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BadgeDollarSign,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  FileText,
  MessageSquarePlus,
  Search,
  ShieldCheck,
  UserRoundCog,
} from 'lucide-react';
import {
  BusinessActivityTimeline,
  BusinessKpiCard,
  RevenueImpactLabel,
  TaskPriorityBadge,
} from '../components/BusinessComponents.jsx';
import { simulationData } from '../data/demoData.js';
import { getAriView } from '../utils/aviationRiskIndex.js';
import { getAverage, getSum } from '../utils/businessCalculations.js';

const asOfDate = '2026-07-10';
const workflowStages = ['Reported', 'Acknowledged', 'Coverage Review', 'Adjuster Assigned', 'Investigation', 'Settlement Negotiation', 'Payment', 'Closed'];
const savedViews = [
  ['all', 'All Claims'],
  ['highSeverity', 'High Severity'],
  ['awaitingCarrier', 'Awaiting Carrier'],
  ['awaitingClient', 'Awaiting Client'],
  ['settlementPending', 'Settlement Pending'],
  ['recentlyReported', 'Recently Reported'],
];

const compactCurrencyFormatter = new Intl.NumberFormat('en-US', {
  currency: 'USD',
  maximumFractionDigits: 1,
  notation: 'compact',
  style: 'currency',
});

const dateFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
const timeFormatter = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', month: 'short', day: 'numeric' });

const clientById = new Map(simulationData.clients.map((client) => [client.id, client]));
const policyById = new Map(simulationData.policies.map((policy) => [policy.id, policy]));
const userById = new Map(simulationData.teamMembers.map((user) => [user.id, user]));
const claimsCoordinators = simulationData.teamMembers.filter((member) => member.role === 'Claims Coordinator');

function compactCurrency(value) {
  return compactCurrencyFormatter.format(value || 0).replace('.0', '');
}

function formatDate(date) {
  return dateFormatter.format(new Date(`${date}T00:00:00Z`));
}

function userName(userId) {
  return userById.get(userId)?.name ?? 'Unassigned';
}

function getCoordinator(claim) {
  return claimsCoordinators[Number(claim.id.slice(-1)) % Math.max(1, claimsCoordinators.length)] ?? claimsCoordinators[0] ?? simulationData.teamMembers[0];
}

function getStage(claim) {
  if (claim.status === 'Closed') return 'Closed';
  if (claim.status === 'Executive Review') return claim.daysOpen > 70 ? 'Settlement Negotiation' : 'Coverage Review';
  if (claim.status === 'Monitoring') return claim.daysOpen > 90 ? 'Payment' : 'Investigation';
  if (claim.daysOpen <= 14) return 'Acknowledged';
  if (claim.daysOpen <= 45) return 'Adjuster Assigned';
  return 'Investigation';
}

function getWaitingFor(claim) {
  if (claim.executiveReviewRequired) return 'Brokerage action';
  if (claim.daysOpen > 90) return 'Carrier response';
  if (claim.status === 'Open') return 'Client information';
  return 'Adjuster update';
}

function getPriority(claim) {
  if (claim.severity === 'High' || claim.executiveReviewRequired || claim.reserveAmount > 750000) return 'High';
  if (claim.severity === 'Medium' || claim.daysOpen > 75) return 'Medium';
  return 'Low';
}

function getClaimTypeLabel(claim) {
  if (claim.claimType.includes('physical')) return 'Hull damage';
  if (claim.claimType.includes('liability')) return 'Liability';
  if (claim.claimType.includes('Training')) return 'Training aircraft';
  if (claim.claimType.includes('Ground')) return 'Ground handling';
  if (claim.claimType.includes('Premises')) return 'Premises';
  return 'Operational incident';
}

function enrichClaim(claim) {
  const client = clientById.get(claim.clientId);
  const policy = policyById.get(claim.policyId) ?? simulationData.policies.find((item) => item.clientId === claim.clientId);
  const coordinator = getCoordinator(claim);
  const accountManager = client ? userById.get(client.assignedAccountManagerId) : null;
  const renewal = simulationData.renewals.find((item) => item.clientId === claim.clientId);
  const submission = simulationData.submissions.find((item) => item.clientId === claim.clientId);
  const compliance = simulationData.compliance.filter((item) => item.clientId === claim.clientId);
  const documents = simulationData.documents.filter((item) => item.clientId === claim.clientId);
  const tasks = simulationData.tasks.filter((item) => item.clientId === claim.clientId && item.relatedModule === 'Claims');
  const activities = simulationData.activities.filter((item) => item.clientId === claim.clientId || item.relatedModule === 'Claims');
  const stage = getStage(claim);
  const priority = getPriority(claim);
  const paidAmount = Math.round(claim.incurredAmount * (claim.daysOpen > 95 ? 0.38 : claim.daysOpen > 60 ? 0.22 : 0.08));
  const outstanding = Math.max(0, claim.reserveAmount - paidAmount);
  const estimatedRecovery = Math.round(claim.reserveAmount * (claim.claimType.includes('liability') ? 0.18 : 0.11));
  const potentialUninsured = Math.max(0, Math.round(claim.incurredAmount - (policy?.limit ?? claim.incurredAmount)));
  const exposure = claim.reserveAmount + paidAmount;
  const renewalImpact = claim.severity === 'High' || claim.executiveReviewRequired ? 'High' : claim.severity === 'Medium' ? 'Moderate' : 'Low';
  const retentionImpact = client?.retentionRisk === 'High' || claim.severity === 'High' ? 'Moderate' : 'Low';

  return {
    ...claim,
    accountManager,
    activities,
    aircraft: claim.claimType.includes('Training') ? 'Training aircraft fleet' : claim.claimType.includes('Ground') ? 'Transient aircraft on ramp' : `${client?.clientType ?? 'Aviation'} aircraft`,
    businessImpact: `${claim.claimType} claim represents ${compactCurrency(exposure)} of managed exposure and may affect ${client?.renewalDate ? 'the upcoming renewal' : 'market conversations'}.`,
    client,
    compliance,
    coordinator,
    documents,
    estimatedRecovery,
    exposure,
    location: client?.location ?? 'Aviation operation',
    outstanding,
    paidAmount,
    policy,
    potentialUninsured,
    priority,
    renewal,
    renewalImpact,
    retentionImpact,
    stage,
    submission,
    tasks,
    typeLabel: getClaimTypeLabel(claim),
    waitingFor: getWaitingFor(claim),
  };
}

function applyFilters(items, filters) {
  const search = filters.search.trim().toLowerCase();
  return items.filter((item) => {
    if (filters.client !== 'all' && item.clientId !== filters.client) return false;
    if (filters.severity !== 'all' && item.severity !== filters.severity) return false;
    if (filters.status !== 'all' && item.status !== filters.status) return false;
    if (filters.coordinator !== 'all' && item.coordinator.id !== filters.coordinator) return false;
    if (filters.policyType !== 'all' && item.policy?.policyType !== filters.policyType) return false;
    if (filters.lossDate === 'recent' && item.daysOpen > 45) return false;
    if (filters.openDays === 'over60' && item.daysOpen <= 60) return false;
    if (filters.openDays === 'over90' && item.daysOpen <= 90) return false;
    if (filters.revenueImpact === 'high' && item.client?.estimatedRevenue < 750000) return false;
    if (filters.savedView === 'highSeverity' && item.severity !== 'High') return false;
    if (filters.savedView === 'awaitingCarrier' && item.waitingFor !== 'Carrier response') return false;
    if (filters.savedView === 'awaitingClient' && item.waitingFor !== 'Client information') return false;
    if (filters.savedView === 'settlementPending' && item.stage !== 'Settlement Negotiation') return false;
    if (filters.savedView === 'recentlyReported' && item.daysOpen > 45) return false;
    if (search && !`${item.client?.name} ${item.id} ${item.claimType} ${item.status} ${item.policy?.policyType}`.toLowerCase().includes(search)) return false;
    return true;
  });
}

function SectionHeader({ title, text, action }) {
  return (
    <div className="claims-section-header">
      <div>
        <h2>{title}</h2>
        {text ? <p>{text}</p> : null}
      </div>
      {action}
    </div>
  );
}

function ClaimMeta({ label, value }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function ClaimsSummary({ items }) {
  const open = items.filter((item) => item.status !== 'Closed');
  const high = items.filter((item) => item.severity === 'High').length;
  const awaitingBrokerage = items.filter((item) => item.waitingFor === 'Brokerage action').length;
  const awaitingCarrier = items.filter((item) => item.waitingFor === 'Carrier response').length;
  const awaitingClient = items.filter((item) => item.waitingFor === 'Client information').length;
  const outstandingExposure = getSum(items.map((item) => ({ value: item.outstanding })), 'value');
  const averageDays = Math.round(getAverage(open, 'daysOpen'));
  const estimatedRecovery = getSum(items.map((item) => ({ value: item.estimatedRecovery })), 'value');

  return (
    <section className="claims-summary-grid" aria-label="Claims executive summary">
      <BusinessKpiCard icon={ClipboardList} label="Open Claims" value={open.length} helper="Active claim files" />
      <BusinessKpiCard icon={AlertTriangle} label="High Severity Claims" value={high} helper="Needs senior attention" tone="red" />
      <BusinessKpiCard icon={UserRoundCog} label="Brokerage Action" value={awaitingBrokerage} helper="Symphony-owned next step" tone="amber" />
      <BusinessKpiCard icon={CalendarClock} label="Carrier Response" value={awaitingCarrier} helper="Adjuster or insurer follow-up" />
      <BusinessKpiCard icon={FileText} label="Client Information" value={awaitingClient} helper="Documents or statements needed" tone="amber" />
      <BusinessKpiCard icon={BadgeDollarSign} label="Outstanding Exposure" value={compactCurrency(outstandingExposure)} helper={`${averageDays} average days open`} tone="red" />
      <BusinessKpiCard icon={CheckCircle2} label="Closed This Month" value="3" helper="Simulated brokerage closeout" tone="green" />
      <BusinessKpiCard icon={ShieldCheck} label="Estimated Recovery" value={compactCurrency(estimatedRecovery)} helper="Expected salvage or recovery" tone="green" />
    </section>
  );
}

function FilterBar({ clients, coordinators, filters, policyTypes, setFilters, severities, statuses }) {
  function update(key, value) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  return (
    <section className="claims-filter-card">
      <div className="claims-filter-card__search">
        <Search size={18} />
        <input value={filters.search} onChange={(event) => update('search', event.target.value)} placeholder="Search claims, clients, policies..." />
      </div>
      <Select label="Saved View" value={filters.savedView} onChange={(value) => update('savedView', value)} options={savedViews} />
      <Select label="Client" value={filters.client} onChange={(value) => update('client', value)} options={[['all', 'All Clients'], ...clients.map((client) => [client.id, client.name])]} />
      <Select label="Severity" value={filters.severity} onChange={(value) => update('severity', value)} options={[['all', 'All Severities'], ...severities.map((item) => [item, item])]} />
      <Select label="Status" value={filters.status} onChange={(value) => update('status', value)} options={[['all', 'All Statuses'], ...statuses.map((item) => [item, item])]} />
      <Select label="Coordinator" value={filters.coordinator} onChange={(value) => update('coordinator', value)} options={[['all', 'All Coordinators'], ...coordinators.map((user) => [user.id, user.name])]} />
      <Select label="Policy Type" value={filters.policyType} onChange={(value) => update('policyType', value)} options={[['all', 'All Policies'], ...policyTypes.map((item) => [item, item])]} />
      <Select label="Date of Loss" value={filters.lossDate} onChange={(value) => update('lossDate', value)} options={[['all', 'All Dates'], ['recent', 'Last 45 Days']]} />
      <Select label="Open Days" value={filters.openDays} onChange={(value) => update('openDays', value)} options={[['all', 'Any Age'], ['over60', 'Over 60 Days'], ['over90', 'Over 90 Days']]} />
      <Select label="Revenue Impact" value={filters.revenueImpact} onChange={(value) => update('revenueImpact', value)} options={[['all', 'Any Revenue'], ['high', 'High Revenue']]} />
    </section>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <label>
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}
      </select>
    </label>
  );
}

function AttentionQueue({ items }) {
  const queue = items
    .slice()
    .sort((a, b) => {
      const rank = { High: 3, Medium: 2, Low: 1 };
      return rank[b.priority] - rank[a.priority] || b.exposure - a.exposure;
    })
    .slice(0, 8);

  return (
    <section className="claims-card">
      <SectionHeader title="Claims Requiring Attention" text="Primary brokerage work queue for claims that can affect renewals, client outcomes, or financial exposure." />
      <div className="claims-attention-list">
        {queue.map((item) => (
          <article className="claims-attention-card" key={item.id}>
            <div className="claims-attention-card__main">
              <TaskPriorityBadge priority={item.priority} />
              <div>
                <Link to={`/claims/${item.id}`}>{item.client?.name}</Link>
                <p>{item.claimType} / open {item.daysOpen} days</p>
              </div>
            </div>
            <dl>
              <ClaimMeta label="Date of Loss" value={formatDate(item.dateOfLoss)} />
              <ClaimMeta label="Severity" value={item.severity} />
              <ClaimMeta label="Current Stage" value={item.stage} />
              <ClaimMeta label="Exposure" value={compactCurrency(item.exposure)} />
              <ClaimMeta label="Claims Coordinator" value={item.coordinator.name} />
              <ClaimMeta label="Waiting For" value={item.waitingFor} />
            </dl>
            <p>{item.businessImpact}</p>
            <div className="claims-attention-card__actions">
              <span>{item.nextAction}</span>
              <Link to={`/claims/${item.id}`}>Open claim <ArrowRight size={15} /></Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function ClaimsPipeline({ items }) {
  const pipeline = workflowStages.map((stage) => {
    const scoped = items.filter((item) => item.stage === stage);
    return {
      averageAge: scoped.length ? Math.round(getAverage(scoped, 'daysOpen')) : 0,
      count: scoped.length,
      delayed: scoped.filter((item) => item.daysOpen > 75 || item.waitingFor === 'Carrier response').length,
      exposure: getSum(scoped.map((item) => ({ value: item.outstanding })), 'value'),
      stage,
    };
  });

  return (
    <section className="claims-card">
      <SectionHeader title="Claims Pipeline" text="Operational workflow view across reported, review, investigation, negotiation, payment and closed claim stages." />
      <div className="claims-pipeline-grid">
        {pipeline.map((stage) => (
          <article className={stage.delayed ? 'claims-stage-card claims-stage-card--delayed' : 'claims-stage-card'} key={stage.stage}>
            <h3>{stage.stage}</h3>
            <strong>{stage.count}</strong>
            <dl>
              <ClaimMeta label="Exposure" value={compactCurrency(stage.exposure)} />
              <ClaimMeta label="Avg Age" value={`${stage.averageAge} days`} />
              <ClaimMeta label="Delayed" value={stage.delayed} />
            </dl>
          </article>
        ))}
      </div>
    </section>
  );
}

function FinancialExposure({ items }) {
  const reserve = getSum(items, 'reserveAmount');
  const paid = getSum(items.map((item) => ({ value: item.paidAmount })), 'value');
  const outstanding = getSum(items.map((item) => ({ value: item.outstanding })), 'value');
  const expectedRecovery = getSum(items.map((item) => ({ value: item.estimatedRecovery })), 'value');
  const uninsured = getSum(items.map((item) => ({ value: item.potentialUninsured })), 'value');
  const largest = items.slice().sort((a, b) => b.exposure - a.exposure).slice(0, 5);
  const renewalClaims = items.filter((item) => item.renewalImpact !== 'Low').slice(0, 4);
  const retentionClaims = items.filter((item) => item.retentionImpact !== 'Low').slice(0, 4);

  return (
    <section className="claims-card">
      <SectionHeader title="Financial Exposure" text="Reserve, paid, outstanding, recovery, uninsured exposure, and revenue-sensitive claim impact." />
      <div className="claims-financial-layout">
        <div className="claims-financial-metrics">
          <FinancialMetric label="Reserve" value={compactCurrency(reserve)} />
          <FinancialMetric label="Paid" value={compactCurrency(paid)} />
          <FinancialMetric label="Outstanding" value={compactCurrency(outstanding)} tone="amber" />
          <FinancialMetric label="Expected Recovery" value={compactCurrency(expectedRecovery)} tone="green" />
          <FinancialMetric label="Potential Uninsured" value={compactCurrency(uninsured)} tone="red" />
        </div>
        <div className="claims-financial-list">
          <h3>Largest Open Claims</h3>
          {largest.map((item) => (
            <Link to={`/claims/${item.id}`} key={item.id}>
              <span>{item.client?.name}</span>
              <strong>{compactCurrency(item.exposure)}</strong>
            </Link>
          ))}
        </div>
        <div className="claims-financial-list">
          <h3>Claims Affecting Renewal Revenue</h3>
          {renewalClaims.map((item) => (
            <Link to={`/renewals/${item.renewal?.id ?? ''}`} key={item.id}>
              <span>{item.client?.name}</span>
              <strong>{item.renewalImpact}</strong>
            </Link>
          ))}
        </div>
        <div className="claims-financial-list">
          <h3>Claims Affecting Client Retention</h3>
          {retentionClaims.map((item) => (
            <Link to={`/clients?clientId=${item.clientId}`} key={item.id}>
              <span>{item.client?.name}</span>
              <strong>{item.retentionImpact}</strong>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinancialMetric({ label, value, tone = 'blue' }) {
  return (
    <article className={`claims-financial-metric claims-financial-metric--${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function RecentClaimActivity({ items }) {
  const claimClientIds = new Set(items.map((item) => item.clientId));
  const synthetic = items.slice(0, 5).map((item, index) => ({
    id: `claim-activity-${item.id}-${index}`,
    activityType: ['Reserve increased', 'Repair estimate uploaded', 'Carrier requested documents', 'Settlement meeting scheduled', 'Client notified'][index] ?? 'Claim update',
    clientId: item.clientId,
    importanceLevel: item.priority === 'High' ? 'High' : 'Medium',
    summary: index === 0 ? `${item.typeLabel} reserve reviewed for ${item.client?.name}` : `${item.nextAction} for ${item.client?.name}`,
    timestamp: `2026-07-10T${String(12 - index).padStart(2, '0')}:2${index}:00Z`,
  }));
  const source = simulationData.activities.filter((activity) => claimClientIds.has(activity.clientId) || activity.relatedModule === 'Claims');

  return (
    <section className="claims-card">
      <SectionHeader title="Recent Claim Activity" text="Business timeline of brokerage, carrier, adjuster and client movement." />
      <BusinessActivityTimeline
        activities={[...synthetic, ...source].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 10)}
        getClientName={(clientId) => clientById.get(clientId)?.name ?? 'Claim file'}
        formatTime={(timestamp) => timeFormatter.format(new Date(timestamp))}
      />
    </section>
  );
}

function ClaimsListWorkspace({ items, filteredItems, filters, setFilters }) {
  const clients = Array.from(new Map(items.map((item) => [item.clientId, item.client])).values()).filter(Boolean);
  const coordinators = Array.from(new Map(items.map((item) => [item.coordinator.id, item.coordinator])).values());
  const severities = Array.from(new Set(items.map((item) => item.severity))).sort();
  const statuses = Array.from(new Set(items.map((item) => item.status))).sort();
  const policyTypes = Array.from(new Set(items.map((item) => item.policy?.policyType).filter(Boolean))).sort();
  const totalExposure = getSum(filteredItems.map((item) => ({ value: item.outstanding })), 'value');

  return (
    <div className="claims-workspace page-transition">
      <section className="claims-hero">
        <div>
          <span>Claims Operations Workspace</span>
          <h1>Claims Operations</h1>
          <p>Which claims require our attention today, what is our financial exposure, and what actions should we take?</p>
        </div>
        <RevenueImpactLabel value={compactCurrency(totalExposure)} label="Filtered outstanding exposure" />
      </section>

      <ClaimsSummary items={filteredItems} />
      <FilterBar
        clients={clients}
        coordinators={coordinators}
        filters={filters}
        policyTypes={policyTypes}
        setFilters={setFilters}
        severities={severities}
        statuses={statuses}
      />
      <AttentionQueue items={filteredItems} />
      <ClaimsPipeline items={filteredItems} />
      <FinancialExposure items={filteredItems} />
      <RecentClaimActivity items={filteredItems} />
    </div>
  );
}

function ClaimOverview({ item }) {
  return (
    <section className="claims-card">
      <SectionHeader title="Claim Overview" />
      <div className="claim-overview-grid">
        <ClaimMeta label="Incident Summary" value={`${item.claimType} involving ${item.aircraft}.`} />
        <ClaimMeta label="Date of Loss" value={formatDate(item.dateOfLoss)} />
        <ClaimMeta label="Location" value={item.location} />
        <ClaimMeta label="Aircraft" value={item.aircraft} />
        <ClaimMeta label="Policy" value={`${item.policy?.policyType ?? 'Policy'} / ${item.policy?.insurer ?? 'Insurer'}`} />
        <ClaimMeta label="Coverage" value={compactCurrency(item.policy?.limit ?? 0)} />
        <ClaimMeta label="Claim Status" value={item.status} />
        <ClaimMeta label="Business Impact" value={item.businessImpact} />
      </div>
    </section>
  );
}

function ClaimFinancialSummary({ item }) {
  const potentialClientExposure = Math.max(0, item.outstanding - (item.policy?.deductible ?? 0) - item.estimatedRecovery);

  return (
    <section className="claims-card">
      <SectionHeader title="Financial Summary" />
      <div className="claims-detail-financial-grid">
        <FinancialMetric label="Reserve" value={compactCurrency(item.reserveAmount)} />
        <FinancialMetric label="Paid" value={compactCurrency(item.paidAmount)} />
        <FinancialMetric label="Outstanding" value={compactCurrency(item.outstanding)} tone="amber" />
        <FinancialMetric label="Estimated Recovery" value={compactCurrency(item.estimatedRecovery)} tone="green" />
        <FinancialMetric label="Coverage Limit" value={compactCurrency(item.policy?.limit ?? 0)} />
        <FinancialMetric label="Deductible" value={compactCurrency(item.policy?.deductible ?? 0)} />
        <FinancialMetric label="Potential Client Exposure" value={compactCurrency(potentialClientExposure)} tone="red" />
        <FinancialMetric label="Renewal Impact" value={item.renewalImpact} tone={item.renewalImpact === 'High' ? 'red' : 'amber'} />
      </div>
    </section>
  );
}

function ClaimBusinessImpact({ item }) {
  const ari = getAriView();

  return (
    <section className="claims-card">
      <SectionHeader title="Business Impact" />
      <p className="claim-impact-copy">
        This claim represents approximately {compactCurrency(item.exposure)} of exposure and is expected to receive additional underwriting scrutiny during the upcoming renewal. Symphony should coordinate the reserve position, client communication, and insurer narrative before market discussions tighten.
      </p>
      <div className="claim-impact-grid">
        <ImpactItem label="Why this matters" value={item.businessImpact} />
        <ImpactItem label="Renewal implications" value={`Renewal impact is ${item.renewalImpact.toLowerCase()} because the open claim may affect pricing, terms, and underwriting questions.`} />
        <ImpactItem label="Client relationship impact" value={`Relationship impact is ${item.retentionImpact.toLowerCase()} and should be handled with clear client updates.`} />
        <ImpactItem label="Operational impact" value={`${item.waitingFor} is the current blocker for moving the file forward.`} />
        <ImpactItem label="ARI insight" value={ari.workspaceSignals.claims} />
      </div>
    </section>
  );
}

function ImpactItem({ label, value }) {
  return (
    <article>
      <span>{label}</span>
      <p>{value}</p>
    </article>
  );
}

function ActionPlan({ item, onAction }) {
  const actions = [
    ['Request updated repair estimate', 'Adjuster cannot finalise reserve without current cost detail.'],
    ['Schedule renewal strategy discussion', 'Open claim may influence premium, retention, and market narrative.'],
    [item.nextAction, item.waitingFor === 'Carrier response' ? 'Reserve update overdue.' : 'Brokerage next step should be completed today.'],
  ];

  return (
    <section className="claims-card">
      <SectionHeader title="Action Plan" />
      <div className="claim-action-plan">
        {actions.map(([action, reason]) => (
          <article key={action}>
            <strong>{action}</strong>
            <p>{reason}</p>
            <button type="button" onClick={() => onAction(action)}>{action}</button>
          </article>
        ))}
      </div>
    </section>
  );
}

function CommunicationTimeline({ item }) {
  const events = [
    ['Claim Reported', item.dateOfLoss, 'Client reported incident to Symphony.'],
    ['Client Contacted', '2026-06-14', 'Account manager confirmed business impact and next information needs.'],
    ['Carrier Notified', '2026-06-15', `${item.policy?.insurer ?? 'Carrier'} acknowledged the claim file.`],
    ['Adjuster Assigned', '2026-06-17', 'Adjuster contact details recorded for brokerage follow-up.'],
    ['Repair Estimate Received', '2026-06-24', 'Estimate added to claim file for reserve review.'],
    ['Coverage Reviewed', '2026-06-28', 'Coverage position reviewed against policy terms.'],
    ['Reserve Updated', '2026-07-04', `${compactCurrency(item.reserveAmount)} reserve currently tracked.`],
    ['Next Brokerage Follow-up', asOfDate, item.nextAction],
  ];

  return (
    <section className="claims-card">
      <SectionHeader title="Communication Timeline" text="Chronological coordination history across client, carrier, adjuster, and brokerage actions." />
      <div className="claim-timeline">
        {events.map(([title, date, text]) => (
          <article key={`${title}-${date}`}>
            <time>{formatDate(date)}</time>
            <div>
              <strong>{title}</strong>
              <p>{text}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function Participants({ item }) {
  const participants = [
    ['Client Contact', `${item.client?.name} Risk Manager`],
    ['Account Manager', item.accountManager?.name ?? 'Unassigned'],
    ['Claims Coordinator', item.coordinator.name],
    ['Carrier', item.policy?.insurer ?? 'Carrier'],
    ['Adjuster', `${item.policy?.insurer?.split(' ')[0] ?? 'Carrier'} Aviation Adjusting`],
    ['Surveyor', item.claimType.includes('physical') ? 'AeroSurvey Technical Services' : 'Not currently assigned'],
    ['Legal Counsel', item.claimType.includes('liability') ? 'Panel aviation counsel' : 'Not currently required'],
  ];

  return (
    <section className="claims-card">
      <SectionHeader title="Participants" />
      <div className="claim-participant-grid">
        {participants.map(([label, value]) => <ClaimMeta key={label} label={label} value={value} />)}
      </div>
    </section>
  );
}

function RelatedDocuments({ item }) {
  const baseDocs = [
    'Incident Report',
    'Photographs',
    'Repair Estimate',
    'Maintenance Records',
    'Pilot Statement',
    'Carrier Correspondence',
    'Settlement Documents',
    'Certificates',
    'Policies',
  ];
  const linkedDocs = [...item.documents.map((document) => document.documentType), ...baseDocs].slice(0, 9);

  return (
    <section className="claims-card">
      <SectionHeader title="Related Documents" text="Preview-only claim support files connected to the shared document model." />
      <div className="claim-document-grid">
        {linkedDocs.map((document, index) => (
          <article key={`${document}-${index}`}>
            <FileText size={17} />
            <div>
              <strong>{document}</strong>
              <span>{index % 3 === 0 ? 'Needs review' : 'Preview available'}</span>
            </div>
            <button type="button">Preview</button>
          </article>
        ))}
      </div>
    </section>
  );
}

function RelatedRecords({ item }) {
  const records = [
    ['Client', `/clients?clientId=${item.clientId}`, item.client ? 1 : 0],
    ['Policies', `/clients?clientId=${item.clientId}`, item.policy ? 1 : 0],
    ['Renewals', item.renewal ? `/renewals/${item.renewal.id}` : '/renewals', item.renewal ? 1 : 0],
    ['Submissions', item.submission ? `/submissions/${item.submission.id}` : '/submissions', item.submission ? 1 : 0],
    ['Compliance', item.compliance[0] ? `/compliance/${item.compliance[0].id}` : '/compliance', item.compliance.length],
    ['Tasks', `/clients?clientId=${item.clientId}`, item.tasks.length],
    ['Activities', `/clients?clientId=${item.clientId}`, item.activities.length],
    ['Documents', item.documents[0] ? `/documents/${item.documents[0].id}` : '/documents', item.documents.length],
  ];

  return (
    <section className="claims-card">
      <SectionHeader title="Related Records" text="Cross-links into the shared Symphony business model." />
      <div className="claim-related-grid">
        {records.map(([label, href, count]) => (
          <Link to={href} key={label}>
            <span>{label}</span>
            <strong>{count}</strong>
          </Link>
        ))}
      </div>
    </section>
  );
}

function ClientImpact({ item }) {
  return (
    <section className="claims-card">
      <SectionHeader title="Client Impact" />
      <div className="claim-client-impact-grid">
        <ClaimMeta label="Client Relationship" value={item.client?.relationshipStatus ?? 'Stable'} />
        <ClaimMeta label="Renewal Impact" value={item.renewalImpact} />
        <ClaimMeta label="Compliance Impact" value={item.compliance.some((entry) => entry.status !== 'Closed') ? 'Active follow-up' : 'None'} />
        <ClaimMeta label="Revenue At Risk" value={compactCurrency(item.client?.estimatedRevenue ?? 0)} />
        <ClaimMeta label="Recommended Priority" value={item.priority} />
      </div>
    </section>
  );
}

function ClaimNotes({ item }) {
  const [note, setNote] = useState('');
  const [notes, setNotes] = useState([
    'Client called. Waiting for reserve confirmation.',
    'Carrier requested maintenance records.',
    'Adjuster inspection completed.',
  ]);

  function addNote() {
    if (!note.trim()) return;
    setNotes((current) => [`${note.trim()} (${item.id})`, ...current].slice(0, 6));
    setNote('');
  }

  return (
    <section className="claims-card">
      <SectionHeader title="Claim Notes" text="Local simulated notes for demo workflow." />
      <div className="claim-note-entry">
        <textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Add claim note..." />
        <button type="button" onClick={addNote}>
          <MessageSquarePlus size={16} />
          Add Note
        </button>
      </div>
      <div className="claim-note-list">
        {notes.map((itemNote) => <p key={itemNote}>{itemNote}</p>)}
      </div>
    </section>
  );
}

function QuickActions({ item, onAction, actionLog }) {
  const actions = ['Add Note', 'Assign Coordinator', 'Request Client Information', 'Request Carrier Update', 'Schedule Follow-up', 'Mark Waiting', 'Close Claim', 'Escalate'];

  return (
    <section className="claims-card">
      <SectionHeader title="Quick Actions" text="Simulated brokerage actions. No backend persistence." />
      <div className="claim-quick-actions">
        {actions.map((action) => <button type="button" key={action} onClick={() => onAction(`${action}: ${item.id}`)}>{action}</button>)}
      </div>
      {actionLog.length ? (
        <div className="claim-action-log">
          {actionLog.map((entry) => <span key={entry.id}>{entry.action}</span>)}
        </div>
      ) : null}
    </section>
  );
}

function ClaimDetailWorkspace({ item, actionLog, onAction }) {
  return (
    <div className="claims-workspace page-transition">
      <section className="claim-detail-hero">
        <Link to="/claims">
          <ArrowLeft size={16} />
          Claims Operations
        </Link>
        <div>
          <span>{item.client?.name}</span>
          <h1>{item.id} / {item.claimType}</h1>
          <p>{item.businessImpact}</p>
        </div>
        <dl>
          <ClaimMeta label="Policy" value={item.policy?.policyType ?? 'Policy'} />
          <ClaimMeta label="Severity" value={item.severity} />
          <ClaimMeta label="Current Status" value={item.status} />
          <ClaimMeta label="Coordinator" value={item.coordinator.name} />
          <ClaimMeta label="Account Manager" value={item.accountManager?.name ?? 'Unassigned'} />
        </dl>
      </section>

      <section className="claim-detail-layout">
        <div className="claim-detail-main">
          <ClaimOverview item={item} />
          <ClaimFinancialSummary item={item} />
          <ClaimBusinessImpact item={item} />
          <ActionPlan item={item} onAction={onAction} />
          <CommunicationTimeline item={item} />
          <RelatedDocuments item={item} />
          <RelatedRecords item={item} />
        </div>
        <aside className="claim-detail-side">
          <ClientImpact item={item} />
          <Participants item={item} />
          <QuickActions item={item} onAction={onAction} actionLog={actionLog} />
          <ClaimNotes item={item} />
        </aside>
      </section>
    </div>
  );
}

export function ClaimsWorkspace() {
  const { claimId } = useParams();
  const [filters, setFilters] = useState({
    client: 'all',
    coordinator: 'all',
    lossDate: 'all',
    openDays: 'all',
    policyType: 'all',
    revenueImpact: 'all',
    savedView: 'all',
    search: '',
    severity: 'all',
    status: 'all',
  });
  const [actionLog, setActionLog] = useState([]);
  const items = useMemo(() => simulationData.claims.map(enrichClaim), []);
  const filteredItems = useMemo(() => applyFilters(items, filters), [filters, items]);
  const activeItem = items.find((item) => item.id === claimId);

  function addAction(action) {
    setActionLog((current) => [{ id: `${Date.now()}-${action}`, action }, ...current].slice(0, 5));
  }

  if (claimId && activeItem) {
    return <ClaimDetailWorkspace item={activeItem} actionLog={actionLog} onAction={addAction} />;
  }

  return <ClaimsListWorkspace items={items} filteredItems={filteredItems} filters={filters} setFilters={setFilters} />;
}
