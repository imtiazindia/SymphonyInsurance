import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  ClipboardCheck,
  FileText,
  RefreshCw,
  Search,
} from 'lucide-react';
import {
  BusinessActivityTimeline,
  BusinessKpiCard,
  PriorityItemCard,
  RenewalStatusBadge,
  RevenueImpactLabel,
  TaskPriorityBadge,
} from '../components/BusinessComponents.jsx';
import { simulationData } from '../data/demoData.js';
import { getSum } from '../utils/businessCalculations.js';

const asOfDate = '2026-07-09';
const today = new Date(`${asOfDate}T00:00:00Z`);

const compactCurrencyFormatter = new Intl.NumberFormat('en-US', {
  currency: 'USD',
  maximumFractionDigits: 1,
  notation: 'compact',
  style: 'currency',
});

const dateFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
const shortDateFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });
const timeFormatter = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', month: 'short', day: 'numeric' });

const clientsById = new Map(simulationData.clients.map((client) => [client.id, client]));
const usersById = new Map(simulationData.teamMembers.map((user) => [user.id, user]));

const workflowStages = [
  'Information Gathering',
  'Client Review',
  'Submission Preparation',
  'Marketed',
  'Quotes Received',
  'Negotiation',
  'Client Approval',
  'Binding',
  'Completed',
];

function compactCurrency(value) {
  return compactCurrencyFormatter.format(value || 0).replace('.0', '');
}

function formatDate(date) {
  return dateFormatter.format(new Date(`${date}T00:00:00Z`));
}

function shortDate(date) {
  return shortDateFormatter.format(new Date(`${date}T00:00:00Z`));
}

function userName(userId) {
  return usersById.get(userId)?.name ?? 'Unassigned';
}

function clientName(clientId) {
  return clientsById.get(clientId)?.name ?? 'Unassigned client';
}

function readinessLabel(score) {
  if (score >= 90) return 'Ready';
  if (score >= 78) return 'Nearly Ready';
  return 'Needs Attention';
}

function priorityForRenewal(renewal) {
  if (renewal.ownerAttentionRequired || renewal.currentStage === 'At Risk' || renewal.readinessScore < 72) return 'High';
  if (renewal.daysToExpiry <= 45 || renewal.missingItems.length) return 'Medium';
  return 'Low';
}

function priorityTone(priority) {
  if (priority === 'High') return 'red';
  if (priority === 'Medium') return 'amber';
  return 'green';
}

function workflowStageFor(renewal, submission, negotiation) {
  if (renewal.currentStage === 'Binding') return 'Binding';
  if (renewal.currentStage === 'Negotiation') return negotiation?.decisionRequired ? 'Client Approval' : 'Negotiation';
  if (negotiation?.quotesReceived > 0 && renewal.currentStage === 'Marketed') return 'Quotes Received';
  if (renewal.currentStage === 'Marketed') return 'Marketed';
  if (renewal.currentStage === 'Submission Ready') return 'Submission Preparation';
  if (submission?.status === 'In Review') return 'Client Review';
  return 'Information Gathering';
}

function nextStepFor(renewal, submission, document, compliance, negotiation) {
  if (renewal.currentStage === 'At Risk') return 'Escalate renewal plan';
  if (renewal.missingItems[0]) return `Resolve ${renewal.missingItems[0]}`;
  if (document && ['Missing', 'Needs Review', 'Expired'].includes(document.status)) return `Request ${document.documentType}`;
  if (compliance && ['Open', 'Overdue'].includes(compliance.status)) return compliance.correctiveAction;
  if (submission && submission.completionPercent < 85) return submission.nextAction;
  if (negotiation?.decisionRequired) return 'Review placement decision';
  if (renewal.readinessScore >= 92) return 'Move to Market Placement';
  return 'Confirm renewal readiness';
}

function enrichRenewal(renewal) {
  const client = clientsById.get(renewal.clientId);
  const submission = simulationData.submissions.find((item) => item.clientId === renewal.clientId);
  const negotiation = simulationData.negotiations.find((item) => item.renewalId === renewal.id || item.clientId === renewal.clientId);
  const documents = simulationData.documents.filter((item) => item.clientId === renewal.clientId);
  const document = documents.find((item) => ['Missing', 'Needs Review', 'Expired'].includes(item.status));
  const claims = simulationData.claims.filter((item) => item.clientId === renewal.clientId);
  const compliance = simulationData.compliance.find((item) => item.clientId === renewal.clientId && item.status !== 'Closed');
  const tasks = simulationData.tasks.filter((item) => item.clientId === renewal.clientId && ['Renewals', 'Submissions', 'Compliance'].includes(item.relatedModule));
  const policies = simulationData.policies.filter((item) => item.clientId === renewal.clientId);
  const stage = workflowStageFor(renewal, submission, negotiation);
  const priority = priorityForRenewal(renewal);

  return {
    renewal,
    client,
    submission,
    negotiation,
    documents,
    document,
    claims,
    compliance,
    tasks,
    policies,
    stage,
    priority,
    blockingIssue: renewal.missingItems[0] ?? document?.documentType ?? compliance?.findingType ?? 'No blocking issue',
    nextStep: nextStepFor(renewal, submission, document, compliance, negotiation),
    estimatedCommission: getSum(policies, 'estimatedCommission'),
    estimatedRevenue: client?.estimatedRevenue ?? renewal.revenueAtRisk,
  };
}

function SectionHeader({ title, text, action }) {
  return (
    <div className="renewal-section-header">
      <div>
        <h2>{title}</h2>
        {text ? <p>{text}</p> : null}
      </div>
      {action}
    </div>
  );
}

function ProgressBar({ value, label }) {
  return (
    <div className="renewal-progress">
      <div>
        <span>{label}</span>
        <strong>{value}%</strong>
      </div>
      <i><b style={{ width: `${Math.max(6, value)}%` }} /></i>
    </div>
  );
}

function buildPriorityItem(item) {
  return {
    id: item.renewal.id,
    clientId: item.client.id,
    clientName: item.client.name,
    issue: item.blockingIssue,
    dueLabel: `${item.renewal.daysToExpiry} days remaining`,
    impact: compactCurrency(item.estimatedRevenue),
    impactLabel: 'Revenue Value',
    workflow: item.stage,
    owner: userName(item.renewal.assignedUserId),
    nextStep: item.nextStep,
    priority: item.priority,
    detailHref: `/renewals/${item.renewal.id}`,
    detailLabel: 'Open renewal',
  };
}

function RenewalSummary({ items }) {
  const due30 = items.filter((item) => item.renewal.daysToExpiry <= 30).length;
  const atRisk = items.filter((item) => item.priority === 'High').length;
  const revenueAtRisk = getSum(items.filter((item) => item.priority === 'High').map((item) => item.renewal), 'revenueAtRisk');
  const readyForMarket = items.filter((item) => item.renewal.readinessScore >= 90 && ['Submission Preparation', 'Marketed', 'Quotes Received'].includes(item.stage)).length;
  const waitingOnClient = items.filter((item) => item.blockingIssue !== 'No blocking issue').length;
  const bindingThisWeek = items.filter((item) => item.stage === 'Binding' && item.renewal.daysToExpiry <= 7).length;
  const estimatedRenewalRevenue = getSum(items.map((item) => ({ value: item.estimatedRevenue })), 'value');

  return (
    <section className="renewal-summary-grid" aria-label="Renewal summary">
      <BusinessKpiCard icon={CalendarClock} label="Renewals Due (30 Days)" value={due30} helper="Requires near-term attention" />
      <BusinessKpiCard icon={AlertTriangle} label="Renewals At Risk" value={atRisk} helper="High priority renewals" tone="red" />
      <BusinessKpiCard icon={CircleDollarSign} label="Revenue at Risk" value={compactCurrency(revenueAtRisk)} helper="Estimated annual revenue" tone="amber" />
      <BusinessKpiCard icon={ClipboardCheck} label="Ready For Market" value={readyForMarket} helper="Ready or nearly ready" tone="green" />
      <BusinessKpiCard icon={FileText} label="Waiting On Client" value={waitingOnClient} helper="Open client blockers" tone="amber" />
      <BusinessKpiCard icon={CheckCircle2} label="Binding This Week" value={bindingThisWeek} helper="Closing actions" tone="green" />
      <BusinessKpiCard icon={RefreshCw} label="Estimated Renewal Revenue" value={compactCurrency(estimatedRenewalRevenue)} helper="Across active renewals" />
    </section>
  );
}

function FilterBar({ filters, setFilters, accountManagers, clientTypes }) {
  const savedViews = [
    ['all', 'All Renewals'],
    ['mine', 'My Renewals'],
    ['highRevenue', 'High Revenue'],
    ['needsAttention', 'Needs Attention'],
    ['readyForMarket', 'Ready For Market'],
    ['bindingThisWeek', 'Binding This Week'],
  ];

  function update(key, value) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  return (
    <section className="renewal-filter-card">
      <div className="renewal-saved-views">
        {savedViews.map(([id, label]) => (
          <button key={id} type="button" className={filters.savedView === id ? 'renewal-chip renewal-chip--active' : 'renewal-chip'} onClick={() => update('savedView', id)}>
            {label}
          </button>
        ))}
      </div>
      <div className="renewal-filter-grid">
        <label>
          <span>Search Client</span>
          <div className="renewal-search-input">
            <Search size={16} />
            <input value={filters.search} onChange={(event) => update('search', event.target.value)} placeholder="Client name" />
          </div>
        </label>
        <label>
          <span>Account Manager</span>
          <select value={filters.accountManager} onChange={(event) => update('accountManager', event.target.value)}>
            <option value="all">All account managers</option>
            {accountManagers.map((manager) => <option key={manager.id} value={manager.id}>{manager.name}</option>)}
          </select>
        </label>
        <label>
          <span>Renewal Stage</span>
          <select value={filters.stage} onChange={(event) => update('stage', event.target.value)}>
            <option value="all">All stages</option>
            {workflowStages.map((stage) => <option key={stage} value={stage}>{stage}</option>)}
          </select>
        </label>
        <label>
          <span>Client Type</span>
          <select value={filters.clientType} onChange={(event) => update('clientType', event.target.value)}>
            <option value="all">All client types</option>
            {clientTypes.map((type) => <option key={type} value={type}>{type}</option>)}
          </select>
        </label>
        <label>
          <span>Revenue Range</span>
          <select value={filters.revenueRange} onChange={(event) => update('revenueRange', event.target.value)}>
            <option value="all">All revenue</option>
            <option value="high">Over $1M</option>
            <option value="mid">$250K - $1M</option>
            <option value="low">Under $250K</option>
          </select>
        </label>
        <label>
          <span>Days Remaining</span>
          <select value={filters.daysRemaining} onChange={(event) => update('daysRemaining', event.target.value)}>
            <option value="all">All timelines</option>
            <option value="30">0-30 days</option>
            <option value="60">31-60 days</option>
            <option value="90">61-90 days</option>
          </select>
        </label>
        <label>
          <span>Readiness Score</span>
          <select value={filters.readiness} onChange={(event) => update('readiness', event.target.value)}>
            <option value="all">All scores</option>
            <option value="ready">Ready</option>
            <option value="nearly">Nearly ready</option>
            <option value="attention">Needs attention</option>
          </select>
        </label>
        <label>
          <span>Priority</span>
          <select value={filters.priority} onChange={(event) => update('priority', event.target.value)}>
            <option value="all">All priorities</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </label>
      </div>
    </section>
  );
}

function applyFilters(items, filters) {
  return items.filter((item) => {
    if (filters.search && !item.client.name.toLowerCase().includes(filters.search.toLowerCase())) return false;
    if (filters.accountManager !== 'all' && item.renewal.assignedUserId !== filters.accountManager) return false;
    if (filters.stage !== 'all' && item.stage !== filters.stage) return false;
    if (filters.clientType !== 'all' && item.client.clientType !== filters.clientType) return false;
    if (filters.priority !== 'all' && item.priority !== filters.priority) return false;
    if (filters.revenueRange === 'high' && item.estimatedRevenue <= 1000000) return false;
    if (filters.revenueRange === 'mid' && (item.estimatedRevenue < 250000 || item.estimatedRevenue > 1000000)) return false;
    if (filters.revenueRange === 'low' && item.estimatedRevenue >= 250000) return false;
    if (filters.daysRemaining === '30' && item.renewal.daysToExpiry > 30) return false;
    if (filters.daysRemaining === '60' && (item.renewal.daysToExpiry <= 30 || item.renewal.daysToExpiry > 60)) return false;
    if (filters.daysRemaining === '90' && (item.renewal.daysToExpiry <= 60 || item.renewal.daysToExpiry > 90)) return false;
    if (filters.readiness === 'ready' && item.renewal.readinessScore < 90) return false;
    if (filters.readiness === 'nearly' && (item.renewal.readinessScore < 78 || item.renewal.readinessScore >= 90)) return false;
    if (filters.readiness === 'attention' && item.renewal.readinessScore >= 78) return false;
    if (filters.savedView === 'mine' && item.renewal.assignedUserId !== 'USR-002') return false;
    if (filters.savedView === 'highRevenue' && item.estimatedRevenue <= 1000000) return false;
    if (filters.savedView === 'needsAttention' && item.priority !== 'High') return false;
    if (filters.savedView === 'readyForMarket' && item.renewal.readinessScore < 90) return false;
    if (filters.savedView === 'bindingThisWeek' && !(item.stage === 'Binding' && item.renewal.daysToExpiry <= 7)) return false;
    return true;
  });
}

function PriorityRenewals({ items }) {
  const priorityItems = items
    .filter((item) => item.priority === 'High' || item.renewal.daysToExpiry <= 45 || item.blockingIssue !== 'No blocking issue')
    .sort((a, b) => {
      const rank = { High: 3, Medium: 2, Low: 1 };
      return rank[b.priority] - rank[a.priority] || a.renewal.daysToExpiry - b.renewal.daysToExpiry;
    })
    .slice(0, 8);

  return (
    <section className="renewal-card">
      <SectionHeader
        title="Priority Renewals"
        text="Renewals requiring immediate attention, ownership, or client follow-up."
      />
      <div className="renewal-priority-list">
        {priorityItems.map((item) => (
          <PriorityItemCard
            key={item.renewal.id}
            item={buildPriorityItem(item)}
          />
        ))}
      </div>
    </section>
  );
}

function RenewalPipeline({ items }) {
  const totals = workflowStages.map((stage) => {
    const scoped = items.filter((item) => item.stage === stage);
    return {
      count: scoped.length,
      estimatedCommission: getSum(scoped.map((item) => ({ value: item.estimatedCommission })), 'value'),
      estimatedRevenue: getSum(scoped.map((item) => ({ value: item.estimatedRevenue })), 'value'),
      premium: getSum(scoped.map((item) => item.renewal), 'premiumAtRenewal'),
      stage,
    };
  });

  return (
    <section className="renewal-card">
      <SectionHeader
        title="Renewal Pipeline"
        text="Workflow view showing workload, premium, commission, and revenue by stage."
      />
      <div className="renewal-workflow-grid">
        {totals.map((stage) => (
          <article className="renewal-stage-card" key={stage.stage}>
            <h3>{stage.stage}</h3>
            <strong>{stage.count}</strong>
            <dl>
              <div><dt>Premium</dt><dd>{compactCurrency(stage.premium)}</dd></div>
              <div><dt>Commission</dt><dd>{compactCurrency(stage.estimatedCommission)}</dd></div>
              <div><dt>Revenue</dt><dd>{compactCurrency(stage.estimatedRevenue)}</dd></div>
            </dl>
          </article>
        ))}
      </div>
    </section>
  );
}

function RecentRenewalActivity({ items }) {
  const renewalClientIds = new Set(items.map((item) => item.client.id));
  const activities = simulationData.activities
    .filter((activity) => renewalClientIds.has(activity.clientId))
    .filter((activity) => ['Renewal Update', 'Placement Update', 'Document Update', 'Client Update', 'Submission Request'].includes(activity.activityType))
    .slice(0, 8);

  return (
    <section className="renewal-card">
      <SectionHeader title="Recent Renewal Activity" />
      <BusinessActivityTimeline
        activities={activities}
        getClientName={clientName}
        formatTime={(timestamp) => timeFormatter.format(new Date(timestamp))}
      />
    </section>
  );
}

export function RenewalWorkspace() {
  const [filters, setFilters] = useState({
    accountManager: 'all',
    clientType: 'all',
    daysRemaining: 'all',
    priority: 'all',
    readiness: 'all',
    revenueRange: 'all',
    savedView: 'all',
    search: '',
    stage: 'all',
  });

  const items = useMemo(() => simulationData.renewals.map(enrichRenewal), []);
  const filteredItems = useMemo(() => applyFilters(items, filters), [filters, items]);
  const accountManagers = simulationData.teamMembers.filter((member) => member.role === 'Account Manager');
  const clientTypes = Array.from(new Set(simulationData.clients.map((client) => client.clientType))).sort();

  return (
    <div className="renewal-workspace page-transition">
      <section className="renewal-hero">
        <div>
          <span>Operational Workspace</span>
          <h1>Renewal Workspace</h1>
          <p>Which renewals require attention, why, and what needs to happen next?</p>
        </div>
        <RevenueImpactLabel value={compactCurrency(getSum(filteredItems.map((item) => ({ value: item.estimatedRevenue })), 'value'))} label="Filtered renewal revenue" />
      </section>

      <RenewalSummary items={filteredItems} />
      <FilterBar filters={filters} setFilters={setFilters} accountManagers={accountManagers} clientTypes={clientTypes} />
      <PriorityRenewals items={filteredItems} />
      <RenewalPipeline items={filteredItems} />
      <RecentRenewalActivity items={filteredItems} />
    </div>
  );
}

function completionFromStatus(status) {
  if (!status) return 70;
  if (status === 'Complete' || status === 'Approved') return 100;
  if (status === 'Needs Review' || status === 'In Review' || status === 'Detailed Review') return 70;
  if (status === 'Needs Narrative') return 55;
  if (status === 'Missing Information' || status === 'Missing') return 35;
  if (status === 'Not Applicable') return 100;
  return 65;
}

function categoryOwner(role) {
  return simulationData.teamMembers.find((member) => member.role === role)?.name ?? role;
}

function buildInformationCategories(item) {
  const submission = item.submission;
  const documentsByType = new Map(item.documents.map((document) => [document.documentType, document]));

  return [
    {
      title: 'Aircraft',
      completion: completionFromStatus(submission?.aircraftScheduleStatus ?? documentsByType.get('Aircraft Schedule')?.status),
      missing: submission?.aircraftScheduleStatus === 'Complete' ? [] : ['Updated aircraft schedule'],
      owner: userName(item.renewal.assignedUserId),
      impact: 'Aircraft schedule is required to validate hull and liability exposure.',
    },
    {
      title: 'Pilot Information',
      completion: completionFromStatus(submission?.pilotRosterStatus ?? documentsByType.get('Instructor Roster')?.status),
      missing: ['Needs Review', 'Missing Information', 'Missing'].includes(submission?.pilotRosterStatus) ? ['Pilot roster update'] : [],
      owner: categoryOwner('Submission Specialist'),
      impact: 'Pilot information supports underwriting and carrier subjectivities.',
    },
    {
      title: 'Claims History',
      completion: completionFromStatus(submission?.claimsHistoryStatus),
      missing: submission?.claimsHistoryStatus === 'Complete' ? [] : ['Claims narrative'],
      owner: categoryOwner('Claims Coordinator'),
      impact: 'Claims history affects quote quality and reserve questions.',
    },
    {
      title: 'Safety Documentation',
      completion: completionFromStatus(submission?.safetyControlsStatus ?? documentsByType.get('Safety Controls Summary')?.status),
      missing: submission?.safetyControlsStatus === 'Complete' ? [] : ['Safety controls evidence'],
      owner: categoryOwner('Submission Specialist'),
      impact: 'Safety documentation helps defend renewal pricing.',
    },
    {
      title: 'Maintenance Documentation',
      completion: completionFromStatus(submission?.maintenanceRecordsStatus ?? documentsByType.get('Quality Manual')?.status),
      missing: submission?.maintenanceRecordsStatus === 'Complete' ? [] : ['Maintenance records'],
      owner: userName(item.renewal.assignedUserId),
      impact: 'Maintenance records are required before final market submission.',
    },
    {
      title: 'Contracts',
      completion: item.client.documentCompleteness,
      missing: item.client.documentCompleteness >= 90 ? [] : ['Updated contract schedule'],
      owner: userName(item.renewal.assignedUserId),
      impact: 'Contract language can affect additional insured and waiver terms.',
    },
    {
      title: 'Compliance',
      completion: item.compliance?.status === 'Overdue' ? 45 : item.compliance?.status === 'Open' ? 68 : item.client.complianceScore,
      missing: item.compliance ? [item.compliance.findingType] : [],
      owner: categoryOwner('Compliance Coordinator'),
      impact: item.compliance?.businessImpact ?? 'Compliance position supports clean carrier review.',
    },
    {
      title: 'Financial Information',
      completion: item.estimatedRevenue > 0 ? 92 : 50,
      missing: item.estimatedRevenue > 0 ? [] : ['Revenue estimate'],
      owner: userName(item.renewal.assignedUserId),
      impact: 'Financial information helps management prioritize account attention.',
    },
  ];
}

function RenewalHealth({ item }) {
  const documentCompletion = item.client.documentCompleteness;
  const complianceReadiness = item.compliance?.status === 'Overdue' ? 45 : item.client.complianceScore;
  const claimsReview = item.claims.some((claim) => claim.executiveReviewRequired) ? 64 : 94;
  const placementReadiness = item.negotiation?.quotesReceived ? 88 : item.renewal.readinessScore - 4;
  const responsiveness = item.client.clientHealthScore;
  const riskScore = Math.round((item.renewal.readinessScore + documentCompletion + complianceReadiness + claimsReview + placementReadiness + responsiveness) / 6);

  return (
    <section className="renewal-detail-card">
      <SectionHeader title="Renewal Health" text="Business readiness across client, placement, claims, and compliance factors." />
      <div className="renewal-health-grid">
        <ProgressBar label="Overall Readiness" value={item.renewal.readinessScore} />
        <ProgressBar label="Client Responsiveness" value={responsiveness} />
        <ProgressBar label="Document Completion" value={documentCompletion} />
        <ProgressBar label="Compliance Readiness" value={complianceReadiness} />
        <ProgressBar label="Claims Review Complete" value={claimsReview} />
        <ProgressBar label="Placement Readiness" value={placementReadiness} />
      </div>
      <div className={`renewal-risk-summary renewal-risk-summary--${priorityTone(priorityForRenewal(item.renewal))}`}>
        <strong>{readinessLabel(riskScore)}</strong>
        <span>Overall Risk</span>
      </div>
    </section>
  );
}

function RequiredInformation({ categories }) {
  const [openCategory, setOpenCategory] = useState(categories[0]?.title);

  return (
    <section className="renewal-detail-card">
      <SectionHeader title="Required Information" text="Business categories required to complete the renewal." />
      <div className="renewal-info-category-list">
        {categories.map((category) => {
          const open = openCategory === category.title;
          return (
            <article className={open ? 'renewal-info-category renewal-info-category--open' : 'renewal-info-category'} key={category.title}>
              <button type="button" onClick={() => setOpenCategory(open ? '' : category.title)}>
                <span>{category.title}</span>
                <strong>{category.completion}%</strong>
              </button>
              <i><b style={{ width: `${category.completion}%` }} /></i>
              {open ? (
                <div>
                  <p>{category.impact}</p>
                  <dl>
                    <div><dt>Missing Items</dt><dd>{category.missing.length ? category.missing.join(', ') : 'None'}</dd></div>
                    <div><dt>Owner</dt><dd>{category.owner}</dd></div>
                  </dl>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}

function RenewalTasks({ tasks }) {
  const [taskState, setTaskState] = useState(() => Object.fromEntries(tasks.map((task) => [task.id, { assignee: task.assignedUserId, comment: '', status: task.status }])));

  function updateTask(taskId, patch) {
    setTaskState((current) => ({ ...current, [taskId]: { ...current[taskId], ...patch } }));
  }

  return (
    <section className="renewal-detail-card">
      <SectionHeader title="Tasks" text="Local task actions for renewal coordination." />
      <div className="renewal-task-list">
        {tasks.map((task) => {
          const state = taskState[task.id] ?? { assignee: task.assignedUserId, status: task.status };
          return (
            <article className={state.status === 'Completed' ? 'renewal-task renewal-task--complete' : 'renewal-task'} key={task.id}>
              <div>
                <strong>{task.title}</strong>
                <span>{task.relatedModule}</span>
              </div>
              <TaskPriorityBadge priority={task.priority} />
              <div>
                <small>Owner</small>
                <select value={state.assignee} onChange={(event) => updateTask(task.id, { assignee: event.target.value })}>
                  {simulationData.teamMembers.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}
                </select>
              </div>
              <div>
                <small>Due Date</small>
                <span>{shortDate(task.dueDate)}</span>
              </div>
              <div>
                <small>Status</small>
                <span>{state.status}</span>
              </div>
              <p>{task.businessImpact}</p>
              <div className="renewal-task-actions">
                <button type="button" onClick={() => updateTask(task.id, { status: 'Completed' })}>Complete</button>
                <button type="button" onClick={() => updateTask(task.id, { status: 'Assigned' })}>Assign</button>
                <button type="button" onClick={() => updateTask(task.id, { status: 'Waiting' })}>Mark Waiting</button>
                <button type="button" onClick={() => updateTask(task.id, { comment: 'Comment added locally' })}>Comment</button>
              </div>
              {state.comment ? <em>{state.comment}</em> : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}

function RenewalTimeline({ item }) {
  const activities = simulationData.activities.filter((activity) => activity.clientId === item.client.id);
  const synthetic = [
    { id: `${item.renewal.id}-created`, activityType: 'Renewal opened', summary: `${item.client.name} renewal record created`, timestamp: '2026-07-01T09:00:00Z', importanceLevel: 'Medium', clientId: item.client.id },
    { id: `${item.renewal.id}-stage`, activityType: 'Stage updated', summary: `Renewal moved to ${item.stage}`, timestamp: '2026-07-06T11:20:00Z', importanceLevel: item.priority === 'High' ? 'High' : 'Medium', clientId: item.client.id },
  ];

  return (
    <section className="renewal-detail-card">
      <SectionHeader title="Timeline" text="Chronological renewal history." />
      <BusinessActivityTimeline
        activities={[...activities, ...synthetic].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))}
        getClientName={clientName}
        formatTime={(timestamp) => timeFormatter.format(new Date(timestamp))}
      />
    </section>
  );
}

function FinancialSummary({ item }) {
  const currentPremium = getSum(item.policies, 'premium') || item.renewal.premiumAtRenewal;
  const projectedPremium = item.negotiation?.bestQuote ?? Math.round(item.renewal.premiumAtRenewal * 1.03);
  const estimatedCommission = item.estimatedCommission;
  const revenueDifference = item.estimatedRevenue - item.renewal.revenueAtRisk;
  const savings = item.negotiation?.estimatedSavings ?? Math.max(0, currentPremium - projectedPremium);
  const expectedClose = new Date(`${item.renewal.expiryDate}T00:00:00Z`);
  expectedClose.setDate(expectedClose.getDate() - 7);

  return (
    <section className="renewal-detail-card">
      <SectionHeader title="Financial Summary" />
      <div className="renewal-financial-grid">
        <RevenueImpactLabel value={compactCurrency(currentPremium)} label="Current Premium" />
        <RevenueImpactLabel value={compactCurrency(projectedPremium)} label="Projected Premium" />
        <RevenueImpactLabel value={compactCurrency(estimatedCommission)} label="Estimated Commission" />
        <RevenueImpactLabel value={compactCurrency(revenueDifference)} label="Revenue Difference" />
        <RevenueImpactLabel value={compactCurrency(savings)} label="Savings Opportunity" />
        <RevenueImpactLabel value={shortDateFormatter.format(expectedClose)} label="Expected Closing Date" />
      </div>
    </section>
  );
}

function RecommendedActions({ item }) {
  const recommendations = [];
  if (item.blockingIssue !== 'No blocking issue') {
    recommendations.push({
      action: `Follow up for ${item.blockingIssue.toLowerCase()}.`,
      reason: 'The renewal cannot progress cleanly while this item remains open.',
    });
  }
  if (item.renewal.readinessScore >= 92) {
    recommendations.push({
      action: 'Move to Market Placement.',
      reason: 'Renewal readiness exceeds 92% and market-facing information is substantially complete.',
    });
  }
  if (item.estimatedRevenue > 180000) {
    recommendations.push({
      action: 'Escalate to Owner.',
      reason: 'Estimated annual revenue exceeds the management attention threshold.',
    });
  }
  if (!recommendations.length) {
    recommendations.push({
      action: 'Confirm readiness with account manager.',
      reason: 'The renewal is progressing, but final ownership and timing should be confirmed.',
    });
  }

  return (
    <section className="renewal-detail-card">
      <SectionHeader title="Recommended Actions" />
      <div className="renewal-recommendation-list">
        {recommendations.map((recommendation) => (
          <article key={recommendation.action}>
            <strong>Recommended Action</strong>
            <p>{recommendation.action}</p>
            <span>Reason</span>
            <em>{recommendation.reason}</em>
          </article>
        ))}
      </div>
    </section>
  );
}

function RelatedRecords({ item }) {
  const submission = simulationData.submissions.find((submissionItem) => submissionItem.clientId === item.client.id);
  const records = [
    ['Policies', item.policies.length, `/clients?clientId=${item.client.id}`],
    ['Submission', submission ? 1 : 0, submission ? `/submissions/${submission.id}` : '/submissions'],
    ['Claims', item.claims.length, item.claims[0] ? `/claims/${item.claims[0].id}` : '/claims'],
    ['Compliance', item.compliance ? 1 : 0, item.compliance ? `/compliance/${item.compliance.id}` : '/compliance'],
    ['Documents', item.documents.length, item.document ? `/documents/${item.document.id}` : '/documents'],
    ['Activities', simulationData.activities.filter((activity) => activity.clientId === item.client.id).length, `/clients?clientId=${item.client.id}`],
    ['Negotiations', item.negotiation ? 1 : 0, item.negotiation ? `/market-placement/${item.negotiation.id}` : '/market-placement'],
    ['Tasks', item.tasks.length, `/clients?clientId=${item.client.id}`],
  ];

  return (
    <section className="renewal-detail-card">
      <SectionHeader title="Related Records" text="Linked records from the shared JSON model." />
      <div className="renewal-related-grid">
        {records.map(([label, count, href]) => (
          <Link key={label} to={href}>
            <strong>{count}</strong>
            <span>{label}</span>
            <ArrowRight size={15} />
          </Link>
        ))}
      </div>
    </section>
  );
}

export function RenewalDetailWorkspace() {
  const { renewalId } = useParams();
  const renewal = simulationData.renewals.find((item) => item.id === renewalId) ?? simulationData.renewals[0];
  const item = enrichRenewal(renewal);
  const categories = buildInformationCategories(item);

  return (
    <div className="renewal-detail-workspace page-transition">
      <section className="renewal-detail-hero">
        <Link to="/renewals">
          <ArrowLeft size={16} />
          Renewal Workspace
        </Link>
        <div className="renewal-detail-hero__body">
          <div>
            <span>Renewal Detail Workspace</span>
            <h1>{item.client.name}</h1>
            <p>Every renewal is managed as a business project with clear owners, blockers, financial context, and next steps.</p>
          </div>
          <RenewalStatusBadge status={item.stage} />
        </div>
        <div className="renewal-detail-meta">
          <Meta label="Renewal Date" value={formatDate(item.renewal.expiryDate)} />
          <Meta label="Revenue" value={compactCurrency(item.estimatedRevenue)} />
          <Meta label="Premium" value={compactCurrency(item.renewal.premiumAtRenewal)} />
          <Meta label="Account Manager" value={userName(item.renewal.assignedUserId)} />
          <Meta label="Placement Lead" value={userName(item.client.assignedPlacementLeadId)} />
          <Meta label="Readiness" value={`${item.renewal.readinessScore}% / ${readinessLabel(item.renewal.readinessScore)}`} />
        </div>
      </section>

      <RenewalHealth item={item} />
      <section className="renewal-detail-two-column">
        <RequiredInformation categories={categories} />
        <FinancialSummary item={item} />
      </section>
      <RenewalTasks tasks={item.tasks} />
      <section className="renewal-detail-two-column renewal-detail-two-column--wide-right">
        <RecommendedActions item={item} />
        <RelatedRecords item={item} />
      </section>
      <RenewalTimeline item={item} />
    </div>
  );
}

function Meta({ label, value }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
