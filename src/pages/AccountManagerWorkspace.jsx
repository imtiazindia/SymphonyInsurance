import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  FileClock,
  FileText,
  MessageSquarePlus,
  RefreshCw,
  ShieldCheck,
  UserPlus,
  UsersRound,
} from 'lucide-react';
import {
  BusinessActivityTimeline,
  BusinessKpiCard,
  ClientHealthBadge,
  DocumentStatusBadge,
  PriorityItemCard,
  RenewalStatusBadge,
  RevenueImpactLabel,
} from '../components/BusinessComponents.jsx';
import { simulationData } from '../data/demoData.js';
import { getRenewalsDueSoon } from '../utils/businessCalculations.js';

const asOfDate = '2026-07-09';
const today = new Date(`${asOfDate}T00:00:00Z`);

const compactCurrencyFormatter = new Intl.NumberFormat('en-US', {
  currency: 'USD',
  maximumFractionDigits: 1,
  notation: 'compact',
  style: 'currency',
});

const dateFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });
const timeFormatter = new Intl.DateTimeFormat('en-US', {
  hour: 'numeric',
  minute: '2-digit',
  month: 'short',
  day: 'numeric',
});

const clientById = new Map(simulationData.clients.map((client) => [client.id, client]));
const userById = new Map(simulationData.teamMembers.map((user) => [user.id, user]));

function compactCurrency(value) {
  return compactCurrencyFormatter.format(value || 0).replace('.0', '');
}

function formatDate(date) {
  return dateFormatter.format(new Date(`${date}T00:00:00Z`));
}

function clientName(clientId) {
  return clientById.get(clientId)?.name ?? 'Unassigned client';
}

function roleOwner(role) {
  return simulationData.teamMembers.find((member) => member.role === role)?.name ?? role;
}

function dueSoon(date, days = 14) {
  const target = new Date(`${date}T00:00:00Z`);
  const distance = Math.ceil((target - today) / 86400000);
  return distance >= 0 && distance <= days;
}

function isPastDue(date) {
  return new Date(`${date}T00:00:00Z`) < today;
}

function priorityScore(priority) {
  return { Critical: 4, High: 3, Medium: 2, Low: 1 }[priority] ?? 1;
}

function SummaryCard({ icon: Icon, label, value, helper, tone = 'blue' }) {
  return (
    <BusinessKpiCard icon={Icon} label={label} value={value} helper={helper} tone={tone} className="am-summary-card" />
  );
}

function SectionHeader({ title, text, action }) {
  return (
    <div className="am-section-header">
      <div>
        <h2>{title}</h2>
        {text ? <p>{text}</p> : null}
      </div>
      {action}
    </div>
  );
}

function buildPriorities({ assignedClientIds, selectedUserId, completedTaskIds, requestedDocumentIds, priorityOverrides }) {
  const priorities = [];

  simulationData.documents
    .filter((document) => assignedClientIds.has(document.clientId))
    .filter((document) => ['Missing', 'Needs Review', 'Expired'].includes(document.status))
    .forEach((document) => {
      priorities.push({
        id: `doc-${document.id}`,
        clientId: document.clientId,
        clientName: clientName(document.clientId),
        issue: `${document.documentType} ${document.status.toLowerCase()}`,
        dueDate: document.expiryDate,
        impact: document.businessImpact,
        workflow: 'Document Follow-Up',
        nextStep: requestedDocumentIds.has(document.id) ? 'Request sent' : 'Request document',
        priority: document.status === 'Missing' ? 'High' : 'Medium',
        sourceId: document.id,
        actionType: 'request-document',
        detailHref: `/documents/${document.id}`,
        detailLabel: 'Open document',
      });
    });

  simulationData.renewals
    .filter((renewal) => assignedClientIds.has(renewal.clientId) || renewal.assignedUserId === selectedUserId)
    .filter((renewal) => renewal.readinessScore < 82 || renewal.ownerAttentionRequired)
    .forEach((renewal) => {
      priorities.push({
        id: `renewal-${renewal.id}`,
        clientId: renewal.clientId,
        clientName: clientName(renewal.clientId),
        issue: `Renewal readiness is ${renewal.readinessScore}%`,
        dueDate: renewal.expiryDate,
        impact: renewal.priorityReason,
        workflow: 'Renewal Readiness',
        nextStep: renewal.missingItems.length ? `Clear ${renewal.missingItems[0]}` : 'Confirm readiness',
        priority: renewal.ownerAttentionRequired ? 'Critical' : 'High',
        sourceId: renewal.id,
        actionType: 'open-client',
        detailHref: `/renewals/${renewal.id}`,
        detailLabel: 'Open renewal',
      });
    });

  simulationData.tasks
    .filter((task) => assignedClientIds.has(task.clientId))
    .filter((task) => !completedTaskIds.has(task.id))
    .filter((task) => task.assignedUserId === selectedUserId || task.status === 'Overdue' || dueSoon(task.dueDate, 7))
    .forEach((task) => {
      priorities.push({
        id: `task-${task.id}`,
        clientId: task.clientId,
        clientName: clientName(task.clientId),
        issue: task.title,
        dueDate: task.dueDate,
        impact: task.businessImpact,
        workflow: task.relatedModule,
        nextStep: 'Mark complete',
        priority: task.status === 'Overdue' ? 'High' : task.priority,
        sourceId: task.id,
        actionType: 'complete-task',
        detailHref: `/clients?clientId=${task.clientId}`,
        detailLabel: 'Open client',
      });
    });

  simulationData.submissions
    .filter((submission) => assignedClientIds.has(submission.clientId))
    .filter((submission) => submission.status === 'In Review' || submission.completionPercent < 85)
    .forEach((submission) => {
      priorities.push({
        id: `submission-${submission.id}`,
        clientId: submission.clientId,
        clientName: clientName(submission.clientId),
        issue: `Submission is ${submission.completionPercent}% complete`,
        dueDate: clientById.get(submission.clientId)?.renewalDate ?? asOfDate,
        impact: submission.underwriterConcerns[0] ?? 'Improves quote readiness',
        workflow: 'Submission Review',
        nextStep: submission.nextAction,
        priority: submission.completionPercent < 75 ? 'High' : 'Medium',
        sourceId: submission.id,
        actionType: 'add-note',
        detailHref: `/submissions/${submission.id}`,
        detailLabel: 'Open submission',
      });
    });

  simulationData.claims
    .filter((claim) => assignedClientIds.has(claim.clientId))
    .filter((claim) => claim.status !== 'Closed')
    .forEach((claim) => {
      priorities.push({
        id: `claim-${claim.id}`,
        clientId: claim.clientId,
        clientName: clientName(claim.clientId),
        issue: `${claim.claimType} update needed`,
        dueDate: asOfDate,
        impact: `${compactCurrency(claim.reserveAmount)} reserve exposure`,
        workflow: 'Claims Review',
        nextStep: claim.nextAction,
        priority: claim.executiveReviewRequired ? 'High' : 'Medium',
        sourceId: claim.id,
        actionType: 'assign-follow-up',
        detailHref: `/claims/${claim.id}`,
        detailLabel: 'Open claim',
      });
    });

  simulationData.compliance
    .filter((item) => assignedClientIds.has(item.clientId))
    .filter((item) => item.status === 'Overdue' || dueSoon(item.dueDate, 10))
    .forEach((item) => {
      priorities.push({
        id: `compliance-${item.id}`,
        clientId: item.clientId,
        clientName: clientName(item.clientId),
        issue: `${item.findingType} action ${item.status.toLowerCase()}`,
        dueDate: item.dueDate,
        impact: item.businessImpact,
        workflow: 'Compliance Actions',
        nextStep: item.correctiveAction,
        priority: item.status === 'Overdue' || item.severity === 'High' ? 'High' : 'Medium',
        sourceId: item.id,
        actionType: 'change-priority',
        detailHref: `/compliance/${item.id}`,
        detailLabel: 'Open compliance item',
      });
    });

  simulationData.negotiations
    .filter((negotiation) => assignedClientIds.has(negotiation.clientId))
    .filter((negotiation) => negotiation.pendingQuestions.length || negotiation.decisionRequired)
    .forEach((negotiation) => {
      priorities.push({
        id: `placement-${negotiation.id}`,
        clientId: negotiation.clientId,
        clientName: clientName(negotiation.clientId),
        issue: `${negotiation.recommendedInsurer} needs client information`,
        dueDate: clientById.get(negotiation.clientId)?.renewalDate ?? asOfDate,
        impact: `${compactCurrency(negotiation.estimatedSavings)} potential savings`,
        workflow: 'Market Placement',
        nextStep: negotiation.pendingQuestions[0] ?? 'Confirm placement direction',
        priority: negotiation.decisionRequired ? 'High' : 'Medium',
        sourceId: negotiation.id,
        actionType: 'request-document',
        detailHref: `/market-placement/${negotiation.id}`,
        detailLabel: 'Open placement',
      });
    });

  return priorities
    .map((priority) => ({
      ...priority,
      priority: priorityOverrides[priority.id] ?? priority.priority,
    }))
    .sort((a, b) => priorityScore(b.priority) - priorityScore(a.priority) || new Date(`${a.dueDate}T00:00:00Z`) - new Date(`${b.dueDate}T00:00:00Z`))
    .slice(0, 9);
}

function PersonalSummary({ summary }) {
  return (
    <section className="am-summary-grid" aria-label="Personal work summary">
      <SummaryCard icon={UsersRound} label="Assigned clients" value={summary.assignedClients} helper="Relationship portfolio" />
      <SummaryCard icon={ClipboardList} label="Open tasks" value={summary.openTasks} helper="Active service work" />
      <SummaryCard icon={CalendarClock} label="Overdue tasks" value={summary.overdueTasks} helper="Needs action today" tone="red" />
      <SummaryCard icon={RefreshCw} label="Renewals due soon" value={summary.renewalsDueSoon} helper="Next 60 days" tone="amber" />
      <SummaryCard icon={FileClock} label="Documents pending" value={summary.documentsPending} helper="Missing or needs review" tone="amber" />
      <SummaryCard icon={MessageSquarePlus} label="Follow-ups due" value={summary.followUpsDue} helper="Client meetings or callbacks" />
    </section>
  );
}

function TodayPriorities({ priorities, onAction, notesByPriority }) {
  return (
    <section className="am-card am-priorities-card">
      <SectionHeader
        title="Today's Priorities"
        text="Highest impact client work for this account manager."
      />
      <div className="am-priority-list">
        {priorities.map((priority) => (
          <PriorityItemCard
            key={priority.id}
            item={{ ...priority, dueLabel: formatDate(priority.dueDate) }}
            onAction={onAction}
            note={notesByPriority[priority.id]}
          />
        ))}
      </div>
    </section>
  );
}

function MyClientPortfolio({ clients, filter, setFilter }) {
  const filters = [
    ['all', 'All clients'],
    ['risk', 'At-risk clients'],
    ['renewals', 'Renewals due soon'],
    ['documents', 'Missing documents'],
    ['claims', 'Open claims'],
    ['overdue', 'Overdue tasks'],
  ];

  return (
    <section className="am-card am-portfolio-card">
      <SectionHeader title="My Client Portfolio" text="Relationship, service, renewal, and value view." />
      <div className="am-filter-row" aria-label="Client portfolio filters">
        {filters.map(([id, label]) => (
          <button key={id} type="button" className={filter === id ? 'am-filter am-filter--active' : 'am-filter'} onClick={() => setFilter(id)}>
            {label}
          </button>
        ))}
      </div>
      <div className="am-client-table">
        <div className="am-client-table__head">
          <span>Client</span>
          <span>Health</span>
          <span>Renewal</span>
          <span>Documents</span>
          <span>Tasks</span>
          <span>Claims</span>
          <span>Compliance</span>
          <span>Value</span>
        </div>
        {clients.map((client) => (
          <Link className="am-client-row" key={client.id} to={`/clients?clientId=${client.id}`}>
            <div>
              <strong>{client.name}</strong>
              <small>{client.relationshipStatus}</small>
            </div>
            <ClientHealthBadge score={client.clientHealthScore} />
            <span>{formatDate(client.renewalDate)}</span>
            <span>{client.documentCompleteness}%</span>
            <span>{client.openTasksCount}</span>
            <span>{client.openClaimsCount}</span>
            <span>{client.complianceScore}%</span>
            <RevenueImpactLabel value={compactCurrency(client.estimatedRevenue)} label="Revenue" />
          </Link>
        ))}
      </div>
    </section>
  );
}

function RenewalReadiness({ renewals }) {
  return (
    <section className="am-card">
      <SectionHeader title="Renewal Readiness" />
      <div className="am-renewal-list">
        {renewals.map((renewal) => (
          <article className="am-renewal-item" key={renewal.id}>
            <div>
              <strong>{clientName(renewal.clientId)}</strong>
              <span>{renewal.daysToExpiry} days to expiry</span>
            </div>
            <RenewalStatusBadge status={renewal.currentStage} />
            <div className="am-readiness-meter">
              <i><b style={{ width: `${renewal.readinessScore}%` }} /></i>
              <em>{renewal.readinessScore}%</em>
            </div>
            <p>{renewal.missingItems.length ? renewal.missingItems.join(', ') : 'No missing items'}</p>
            <Link to={`/clients?clientId=${renewal.clientId}`}>Open</Link>
          </article>
        ))}
      </div>
    </section>
  );
}

function DocumentFollowUp({ documents, requestedDocumentIds, onRequest }) {
  return (
    <section className="am-card">
      <SectionHeader title="Document Follow-Up" />
      <div className="am-document-list">
        {documents.map((document) => (
          <article className="am-document-item" key={document.id}>
            <div>
              <strong>{document.documentType}</strong>
              <span>{clientName(document.clientId)} / {document.requiredFor}</span>
            </div>
            <DocumentStatusBadge status={document.status} />
            <p>{document.businessImpact}</p>
            <button type="button" onClick={() => onRequest(document.id)}>
              {requestedDocumentIds.has(document.id) ? 'Requested' : 'Request upload'}
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}

function InternalCollaboration({ items }) {
  return (
    <section className="am-card">
      <SectionHeader title="Internal Collaboration" text="Where internal teams are waiting on account input." />
      <div className="am-collaboration-list">
        {items.map((item) => (
          <article key={item.id}>
            <div>
              <strong>{item.teamMember}</strong>
              <span>{item.clientName}</span>
            </div>
            <p>{item.request}</p>
            <em>{item.workflow}</em>
          </article>
        ))}
      </div>
    </section>
  );
}

function RecentClientActivity({ activities }) {
  return (
    <section className="am-card">
      <SectionHeader title="Client Activity" />
      <BusinessActivityTimeline
        activities={activities}
        getClientName={clientName}
        formatTime={(timestamp) => timeFormatter.format(new Date(timestamp))}
      />
    </section>
  );
}

function QuickActions({ selectedClient, onQuickAction, feedback }) {
  const actions = [
    ['complete', CheckCircle2, 'mark task complete'],
    ['note', MessageSquarePlus, 'add note'],
    ['document', FileText, 'request document'],
    ['follow-up', UserPlus, 'assign follow-up'],
    ['priority', ShieldCheck, 'change priority'],
  ];

  return (
    <section className="am-card am-quick-actions">
      <SectionHeader title="Quick Actions" text={selectedClient ? `Selected client: ${selectedClient.name}` : 'Select a client from the portfolio.'} />
      <div className="am-quick-grid">
        {actions.map(([id, Icon, label]) => (
          <button key={id} type="button" onClick={() => onQuickAction(id)}>
            <Icon size={18} />
            {label}
          </button>
        ))}
        <Link to={selectedClient ? `/clients?clientId=${selectedClient.id}` : '/clients'}>
          <ArrowRight size={18} />
          open client workspace
        </Link>
      </div>
      {feedback ? <p className="am-action-feedback">{feedback}</p> : null}
    </section>
  );
}

function buildCollaborationItems(assignedClientIds) {
  const items = [];

  simulationData.submissions
    .filter((submission) => assignedClientIds.has(submission.clientId))
    .filter((submission) => submission.pilotRosterStatus !== 'Complete' || submission.claimsHistoryStatus !== 'Complete')
    .slice(0, 4)
    .forEach((submission) => {
      if (submission.pilotRosterStatus !== 'Complete') {
        items.push({
          id: `pilot-${submission.id}`,
          clientName: clientName(submission.clientId),
          teamMember: roleOwner('Placement Lead'),
          request: 'Needs updated pilot roster before carrier follow-up.',
          workflow: 'Market Placement',
        });
      }
      if (submission.claimsHistoryStatus !== 'Complete') {
        items.push({
          id: `claims-history-${submission.id}`,
          clientName: clientName(submission.clientId),
          teamMember: roleOwner('Submission Specialist'),
          request: 'Needs claims history narrative for underwriting review.',
          workflow: 'Submission Review',
        });
      }
    });

  simulationData.claims
    .filter((claim) => assignedClientIds.has(claim.clientId))
    .filter((claim) => claim.status !== 'Closed')
    .slice(0, 2)
    .forEach((claim) => {
      items.push({
        id: `claim-statement-${claim.id}`,
        clientName: clientName(claim.clientId),
        teamMember: roleOwner('Claims Coordinator'),
        request: 'Needs client statement or update for claim file.',
        workflow: 'Claims Review',
      });
    });

  simulationData.compliance
    .filter((item) => assignedClientIds.has(item.clientId))
    .filter((item) => item.status !== 'Closed')
    .slice(0, 2)
    .forEach((item) => {
      items.push({
        id: `compliance-${item.id}`,
        clientName: clientName(item.clientId),
        teamMember: roleOwner('Compliance Coordinator'),
        request: 'Needs corrective action confirmation from client.',
        workflow: 'Compliance Actions',
      });
    });

  return items.slice(0, 6);
}

export function AccountManagerWorkspace() {
  const accountManagers = simulationData.teamMembers.filter((member) => member.role === 'Account Manager');
  const [selectedManagerId, setSelectedManagerId] = useState(accountManagers[0]?.id ?? '');
  const [portfolioFilter, setPortfolioFilter] = useState('all');
  const [completedTaskIds, setCompletedTaskIds] = useState(() => new Set());
  const [requestedDocumentIds, setRequestedDocumentIds] = useState(() => new Set());
  const [priorityOverrides, setPriorityOverrides] = useState({});
  const [notesByPriority, setNotesByPriority] = useState({});
  const [feedback, setFeedback] = useState('');

  const selectedManager = accountManagers.find((manager) => manager.id === selectedManagerId) ?? accountManagers[0];

  const data = useMemo(() => {
    const assignedClients = simulationData.clients.filter((client) => client.assignedAccountManagerId === selectedManager.id || selectedManager.assignedClients.includes(client.id));
    const assignedClientIds = new Set(assignedClients.map((client) => client.id));
    const activeTasks = simulationData.tasks.filter((task) => assignedClientIds.has(task.clientId) && !completedTaskIds.has(task.id));
    const assignedTasks = activeTasks.filter((task) => task.assignedUserId === selectedManager.id || selectedManager.assignedClients.includes(task.clientId));
    const overdueTasks = assignedTasks.filter((task) => task.status === 'Overdue' || isPastDue(task.dueDate));
    const renewals = simulationData.renewals
      .filter((renewal) => assignedClientIds.has(renewal.clientId) || renewal.assignedUserId === selectedManager.id)
      .sort((a, b) => a.daysToExpiry - b.daysToExpiry);
    const documents = simulationData.documents
      .filter((document) => assignedClientIds.has(document.clientId))
      .filter((document) => ['Missing', 'Needs Review', 'Expired'].includes(document.status) || dueSoon(document.expiryDate, 45))
      .sort((a, b) => new Date(`${a.expiryDate}T00:00:00Z`) - new Date(`${b.expiryDate}T00:00:00Z`));
    const claims = simulationData.claims.filter((claim) => assignedClientIds.has(claim.clientId) && claim.status !== 'Closed');
    const priorities = buildPriorities({ assignedClientIds, selectedUserId: selectedManager.id, completedTaskIds, requestedDocumentIds, priorityOverrides });
    const collaboration = buildCollaborationItems(assignedClientIds);
    const activities = simulationData.activities
      .filter((activity) => assignedClientIds.has(activity.clientId))
      .slice(0, 6);

    const filteredClients = assignedClients.filter((client) => {
      if (portfolioFilter === 'risk') return client.retentionRisk === 'High' || client.clientHealthScore < 72;
      if (portfolioFilter === 'renewals') return renewals.some((renewal) => renewal.clientId === client.id && renewal.daysToExpiry <= 60);
      if (portfolioFilter === 'documents') return documents.some((document) => document.clientId === client.id && ['Missing', 'Needs Review', 'Expired'].includes(document.status));
      if (portfolioFilter === 'claims') return client.openClaimsCount > 0 || claims.some((claim) => claim.clientId === client.id);
      if (portfolioFilter === 'overdue') return overdueTasks.some((task) => task.clientId === client.id);
      return true;
    });

    return {
      activities,
      assignedClientIds,
      assignedClients,
      claims,
      collaboration,
      documents,
      filteredClients,
      overdueTasks,
      priorities,
      renewals,
      summary: {
        assignedClients: assignedClients.length,
        documentsPending: documents.filter((document) => ['Missing', 'Needs Review', 'Expired'].includes(document.status)).length,
        followUpsDue: assignedTasks.filter((task) => dueSoon(task.dueDate, 7) || task.category === 'Client').length,
        openTasks: assignedTasks.length,
        overdueTasks: overdueTasks.length,
        renewalsDueSoon: getRenewalsDueSoon(renewals, 60).length,
      },
    };
  }, [completedTaskIds, portfolioFilter, priorityOverrides, requestedDocumentIds, selectedManager]);

  const selectedClient = data.priorities[0] ? clientById.get(data.priorities[0].clientId) : data.assignedClients[0];

  function handlePriorityAction(priority) {
    if (priority.actionType === 'complete-task') {
      setCompletedTaskIds((current) => new Set(current).add(priority.sourceId));
      setFeedback(`${priority.clientName}: task marked complete locally.`);
      return;
    }
    if (priority.actionType === 'request-document') {
      setRequestedDocumentIds((current) => new Set(current).add(priority.sourceId));
      setFeedback(`${priority.clientName}: document request queued locally.`);
      return;
    }
    if (priority.actionType === 'change-priority') {
      setPriorityOverrides((current) => ({ ...current, [priority.id]: priority.priority === 'High' ? 'Medium' : 'High' }));
      setFeedback(`${priority.clientName}: priority changed locally.`);
      return;
    }
    if (priority.actionType === 'assign-follow-up') {
      setFeedback(`${priority.clientName}: follow-up assigned locally.`);
      return;
    }
    setNotesByPriority((current) => ({ ...current, [priority.id]: 'Note added: account manager reviewed next step.' }));
    setFeedback(`${priority.clientName}: note added locally.`);
  }

  function handleQuickAction(action) {
    if (!selectedClient) return;
    if (action === 'complete' && data.priorities[0]?.sourceId) {
      setCompletedTaskIds((current) => new Set(current).add(data.priorities[0].sourceId));
      setFeedback(`${selectedClient.name}: top priority marked complete locally.`);
      return;
    }
    if (action === 'document') {
      const document = data.documents.find((item) => item.clientId === selectedClient.id);
      if (document) setRequestedDocumentIds((current) => new Set(current).add(document.id));
      setFeedback(`${selectedClient.name}: document request prepared.`);
      return;
    }
    if (action === 'priority' && data.priorities[0]) {
      setPriorityOverrides((current) => ({ ...current, [data.priorities[0].id]: 'High' }));
      setFeedback(`${selectedClient.name}: priority set to high.`);
      return;
    }
    setFeedback(`${selectedClient.name}: ${action.replace('-', ' ')} recorded locally.`);
  }

  return (
    <div className="account-manager-workspace page-transition">
      <section className="am-hero">
        <div>
          <span>Client Relationships</span>
          <h1>Account Manager</h1>
          <p>Which clients and tasks need my attention today?</p>
        </div>
        <label>
          <span>Account Manager</span>
          <select value={selectedManager.id} onChange={(event) => setSelectedManagerId(event.target.value)}>
            {accountManagers.map((manager) => (
              <option key={manager.id} value={manager.id}>{manager.name}</option>
            ))}
          </select>
        </label>
      </section>

      <PersonalSummary summary={data.summary} />
      <TodayPriorities priorities={data.priorities} onAction={handlePriorityAction} notesByPriority={notesByPriority} />
      <MyClientPortfolio clients={data.filteredClients} filter={portfolioFilter} setFilter={setPortfolioFilter} />

      <section className="am-two-column">
        <RenewalReadiness renewals={data.renewals.slice(0, 6)} />
        <DocumentFollowUp documents={data.documents.slice(0, 6)} requestedDocumentIds={requestedDocumentIds} onRequest={(id) => {
          setRequestedDocumentIds((current) => new Set(current).add(id));
          setFeedback('Document request queued locally.');
        }} />
      </section>

      <section className="am-two-column am-two-column--narrow-right">
        <InternalCollaboration items={data.collaboration} />
        <QuickActions selectedClient={selectedClient} onQuickAction={handleQuickAction} feedback={feedback} />
      </section>

      <RecentClientActivity activities={data.activities} />
    </div>
  );
}
