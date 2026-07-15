import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckSquare2,
  ClipboardX,
  FileClock,
  Gauge,
  RefreshCw,
  ShieldAlert,
  UsersRound,
} from 'lucide-react';
import {
  RoleAwareDashboardHeader,
  RolePriorityQueue,
  RoleQuickActions,
} from '../components/RoleExperience.jsx';
import { BusinessActivityTimeline, WorkloadIndicator } from '../components/BusinessComponents.jsx';
import { useRoleExperience } from '../context/RoleContext.jsx';
import { simulationData } from '../data/demoData.js';
import { getAverage } from '../utils/businessCalculations.js';

const asOfDate = '2026-07-10';
const dateFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });
const timeFormatter = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', month: 'short', day: 'numeric' });
const clientById = new Map(simulationData.clients.map((client) => [client.id, client]));
const userById = new Map(simulationData.teamMembers.map((user) => [user.id, user]));

function clientName(clientId) {
  return clientById.get(clientId)?.name ?? 'Portfolio';
}

function userName(userId) {
  return userById.get(userId)?.name ?? 'Unassigned';
}

function daysPast(date) {
  const value = Math.floor((new Date(`${asOfDate}T00:00:00Z`) - new Date(`${date}T00:00:00Z`)) / 86400000);
  return value > 0 ? `${value} days overdue` : `Due ${dateFormatter.format(new Date(`${date}T00:00:00Z`))}`;
}

function buildOperationalPriorities(completedIds) {
  const overdueTasks = simulationData.tasks
    .filter((task) => !completedIds.has(task.id) && (task.status === 'Overdue' || task.dueDate < asOfDate))
    .slice(0, 2)
    .map((task) => ({
      id: task.id,
      clientId: task.clientId,
      clientName: clientName(task.clientId),
      workflow: task.relatedModule,
      issue: task.title,
      age: daysPast(task.dueDate),
      owner: userName(task.assignedUserId),
      impact: task.businessImpact,
      priority: task.priority,
      recommendedAction: 'Confirm ownership and complete or reassign the work today.',
      route: task.relatedModule === 'Renewals' ? '/renewals' : task.relatedModule === 'Claims' ? '/claims' : '/tasks',
    }));

  const delayedRenewal = simulationData.renewals
    .filter((renewal) => renewal.readinessScore < 70 || renewal.ownerAttentionRequired)
    .sort((a, b) => a.readinessScore - b.readinessScore)[0];
  const blockedSubmission = simulationData.submissions
    .filter((submission) => submission.completionPercent < 80 || submission.documentGaps.length)
    .sort((a, b) => a.completionPercent - b.completionPercent)[0];
  const claim = simulationData.claims
    .filter((item) => item.status !== 'Closed')
    .sort((a, b) => Number(b.executiveReviewRequired) - Number(a.executiveReviewRequired) || b.daysOpen - a.daysOpen)[0];
  const compliance = simulationData.compliance
    .filter((item) => item.status === 'Overdue' || item.dueDate < asOfDate)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0];

  return [
    ...overdueTasks,
    delayedRenewal && {
      id: delayedRenewal.id,
      clientId: delayedRenewal.clientId,
      clientName: clientName(delayedRenewal.clientId),
      workflow: 'Renewals',
      issue: `${delayedRenewal.readinessScore}% readiness is delaying market progress.`,
      age: `${delayedRenewal.daysToExpiry} days to expiry`,
      owner: userName(delayedRenewal.assignedUserId),
      impact: delayedRenewal.priorityReason,
      priority: delayedRenewal.ownerAttentionRequired ? 'Critical' : 'High',
      recommendedAction: `Clear ${delayedRenewal.missingItems.slice(0, 2).join(' and ') || 'remaining blockers'}.`,
      route: `/renewals/${delayedRenewal.id}`,
    },
    blockedSubmission && {
      id: blockedSubmission.id,
      clientId: blockedSubmission.clientId,
      clientName: clientName(blockedSubmission.clientId),
      workflow: 'Submissions',
      issue: `Submission is ${blockedSubmission.completionPercent}% complete with ${blockedSubmission.documentGaps.length} document gaps.`,
      age: 'Market date at risk',
      owner: 'Submission Team',
      impact: blockedSubmission.nextAction,
      priority: blockedSubmission.completionPercent < 65 ? 'High' : 'Medium',
      recommendedAction: blockedSubmission.nextAction,
      route: `/submissions/${blockedSubmission.id}`,
    },
    claim && {
      id: claim.id,
      clientId: claim.clientId,
      clientName: clientName(claim.clientId),
      workflow: 'Claims',
      issue: `${claim.claimType} has remained open for ${claim.daysOpen} days.`,
      age: `${claim.daysOpen} days open`,
      owner: 'Claims Team',
      impact: claim.nextAction,
      priority: claim.severity,
      recommendedAction: 'Confirm the next carrier or client handoff today.',
      route: `/claims/${claim.id}`,
    },
    compliance && {
      id: compliance.id,
      clientId: compliance.clientId,
      clientName: clientName(compliance.clientId),
      workflow: 'Compliance & Risk',
      issue: `${compliance.findingType} is ${compliance.status.toLowerCase()}.`,
      age: daysPast(compliance.dueDate),
      owner: userName(compliance.assignedUserId),
      impact: compliance.businessImpact,
      priority: compliance.severity,
      recommendedAction: compliance.correctiveAction,
      route: '/compliance-risk',
    },
  ].filter(Boolean).slice(0, 7);
}

function WorkflowBottlenecks() {
  const stages = [
    { label: 'Renewals delayed', value: simulationData.renewals.filter((item) => item.readinessScore < 70).length, owner: 'Account Management', tone: 'red' },
    { label: 'Submissions blocked', value: simulationData.submissions.filter((item) => item.completionPercent < 80).length, owner: 'Submission Team', tone: 'amber' },
    { label: 'Claims awaiting action', value: simulationData.claims.filter((item) => item.status !== 'Closed').length, owner: 'Claims Team', tone: 'blue' },
    { label: 'Compliance overdue', value: simulationData.compliance.filter((item) => item.status === 'Overdue').length, owner: 'Risk Advisory', tone: 'red' },
    { label: 'Documents outstanding', value: simulationData.documents.filter((item) => /Missing|Expired|Needs Review/.test(item.status)).length, owner: 'Document Team', tone: 'amber' },
  ];
  const max = Math.max(...stages.map((stage) => stage.value), 1);
  return (
    <section className="operations-card">
      <header><h2>Workflow Bottlenecks</h2><p>Open work concentrated by workflow and responsible team.</p></header>
      <div className="operations-bottlenecks">
        {stages.map((stage) => (
          <article key={stage.label}>
            <div><strong>{stage.label}</strong><span>{stage.owner}</span></div>
            <i><b className={`tone-${stage.tone}`} style={{ width: `${Math.max(12, (stage.value / max) * 100)}%` }} /></i>
            <em>{stage.value}</em>
          </article>
        ))}
      </div>
    </section>
  );
}

function TeamCapacity() {
  const members = simulationData.teamMembers.filter((member) => member.role !== 'CEO').sort((a, b) => b.workloadScore - a.workloadScore);
  return (
    <section className="operations-card">
      <header><h2>Team Workload</h2><p>Capacity view ranked by workload and overdue commitments.</p></header>
      <div className="operations-team-list">
        {members.map((member) => (
          <article key={member.id}>
            <div><strong>{member.name}</strong><span>{member.role}</span></div>
            <WorkloadIndicator score={member.workloadScore} />
            <small>{member.overdueTasks} overdue</small>
          </article>
        ))}
      </div>
    </section>
  );
}

export function OperationsManagerWorkspace() {
  const { roleConfiguration } = useRoleExperience();
  const [completedIds, setCompletedIds] = useState(() => new Set());
  const [feedback, setFeedback] = useState('');
  const priorities = useMemo(() => buildOperationalPriorities(completedIds), [completedIds]);
  const openTasks = simulationData.tasks.filter((task) => task.status !== 'Complete' && !completedIds.has(task.id));
  const overdue = openTasks.filter((task) => task.status === 'Overdue' || task.dueDate < asOfDate);
  const metrics = [
    { label: 'Open Operational Work', value: openTasks.length, helper: 'Across active workflows', icon: CheckSquare2 },
    { label: 'Overdue Tasks', value: overdue.length, helper: 'Requires owner confirmation', icon: AlertTriangle, tone: 'red' },
    { label: 'Renewals Delayed', value: simulationData.renewals.filter((item) => item.readinessScore < 70).length, helper: 'Readiness below 70%', icon: RefreshCw, tone: 'amber' },
    { label: 'Submissions Blocked', value: simulationData.submissions.filter((item) => item.completionPercent < 80).length, helper: 'Not yet market-ready', icon: ClipboardX, tone: 'amber' },
    { label: 'Claims Awaiting Action', value: simulationData.claims.filter((item) => item.status !== 'Closed').length, helper: 'Open claim files', icon: ShieldAlert },
    { label: 'Documents Outstanding', value: simulationData.documents.filter((item) => /Missing|Expired|Needs Review/.test(item.status)).length, helper: 'Across current workflows', icon: FileClock },
    { label: 'Team Utilization', value: `${getAverage(simulationData.teamMembers.filter((item) => item.role !== 'CEO'), 'workloadScore')}%`, helper: 'Average workload score', icon: Gauge, tone: 'green' },
    { label: 'Overloaded People', value: simulationData.teamMembers.filter((item) => item.workloadScore >= 80).length, helper: 'At or above 80%', icon: UsersRound, tone: 'red' },
  ];

  function takeAction(item) {
    setCompletedIds((current) => new Set(current).add(item.id));
    setFeedback(`${item.workflow} item for ${item.clientName} was reassigned for follow-up in this session.`);
  }

  function quickAction(action) {
    setFeedback(`${action} opened as a simulated operations action.`);
  }

  return (
    <div className="operations-workspace page-transition">
      <RoleAwareDashboardHeader
        eyebrow="Operations Manager Workspace"
        title="Operations Overview"
        question={roleConfiguration.primaryQuestion}
        metrics={metrics}
        actions={['Prepare Operations Brief', 'Review Bottlenecks', 'Reassign Work']}
        onAction={quickAction}
      />

      <RolePriorityQueue
        title="Operational Attention Required"
        text="Overdue work, delayed handoffs and cross-team blockers ranked by business impact."
        items={priorities}
        onAction={takeAction}
      />

      <section className="operations-two-column">
        <WorkflowBottlenecks />
        <TeamCapacity />
      </section>

      <section className="operations-card">
        <header><h2>Recent Operational Activity</h2><p>Meaningful workflow movement across the shared business dataset.</p></header>
        <BusinessActivityTimeline
          activities={simulationData.activities.slice(0, 8)}
          getClientName={clientName}
          formatTime={(timestamp) => timeFormatter.format(new Date(timestamp))}
        />
      </section>

      <RoleQuickActions actions={roleConfiguration.quickActions} onAction={quickAction} feedback={feedback} />
    </div>
  );
}
