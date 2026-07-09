import {
  BadgeCheck,
  BarChart3,
  Bell,
  Bot,
  Building2,
  ClipboardCheck,
  FileStack,
  Gauge,
  Headphones,
  Landmark,
  MessagesSquare,
  Plane,
  RadioTower,
  Settings,
  ShieldCheck,
} from 'lucide-react';
import activitiesJson from './activities.json';
import businessMetricsJson from './businessMetrics.json';
import claimsJson from './claims.json';
import clientsJson from './clients.json';
import complianceJson from './compliance.json';
import documentsJson from './documents.json';
import negotiationsJson from './negotiations.json';
import policiesJson from './policies.json';
import renewalsJson from './renewals.json';
import submissionsJson from './submissions.json';
import tasksJson from './tasks.json';
import teamMembersJson from './teamMembers.json';
import {
  calculateRevenueAtRisk,
  getAverage,
  getClaimsExposure,
  getComplianceRiskLevel,
  getDocumentGapCount,
  getHighPriorityClients,
  getOverdueTasks,
  getRenewalsDueSoon,
  getSum,
  getTeamWorkload,
} from '../utils/businessCalculations.js';

const currencyFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 1,
  notation: 'compact',
  style: 'currency',
  currency: 'USD',
});

const numberFormatter = new Intl.NumberFormat('en-US');
const clientById = new Map(clientsJson.map((client) => [client.id, client]));

const totalPremium = getSum(clientsJson, 'annualPremium');
const estimatedRevenue = getSum(clientsJson, 'estimatedRevenue');
const revenueAtRisk = calculateRevenueAtRisk(renewalsJson, clientsJson);
const renewalsDue30 = getRenewalsDueSoon(renewalsJson, 30);
const highPriorityClients = getHighPriorityClients(clientsJson);
const overdueTasks = getOverdueTasks(tasksJson);
const claimsExposure = getClaimsExposure(claimsJson);
const averageCompliance = getAverage(clientsJson, 'complianceScore');
const averageClientHealth = getAverage(clientsJson, 'clientHealthScore');
const documentCompletionRate = getAverage(clientsJson, 'documentCompleteness');
const teamWorkload = getTeamWorkload(teamMembersJson, tasksJson);
const savingsOpportunity = getSum(negotiationsJson, 'estimatedSavings');

function compactCurrency(value) {
  return currencyFormatter.format(value).replace('.0', '');
}

function clientName(clientId) {
  return clientById.get(clientId)?.name ?? 'Unassigned account';
}

function shortClientName(clientId) {
  return clientName(clientId)
    .replace(' Airlines', '')
    .replace(' Transport', '')
    .replace(' Services', '')
    .replace(' Solutions', '');
}

function toneForStatus(status) {
  const normalized = status.toLowerCase();
  if (normalized.includes('risk') || normalized.includes('critical') || normalized.includes('overdue') || normalized.includes('attention')) {
    return 'red';
  }
  if (normalized.includes('review') || normalized.includes('pending') || normalized.includes('open') || normalized.includes('negotiation')) {
    return 'amber';
  }
  if (normalized.includes('ready') || normalized.includes('complete') || normalized.includes('approved') || normalized.includes('strong')) {
    return 'green';
  }
  return 'cyan';
}

function toneForSeverity(severity) {
  if (severity === 'High' || severity === 'Critical') return 'red';
  if (severity === 'Medium' || severity === 'Elevated') return 'amber';
  return 'green';
}

function dateLabel(date) {
  const due = new Date(`${date}T00:00:00Z`);
  const now = new Date('2026-07-09T00:00:00Z');
  const days = Math.ceil((due - now) / 86400000);
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  return `${days}d`;
}

function timeLabel(timestamp) {
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    hour12: false,
    minute: '2-digit',
    timeZone: 'UTC',
  }).format(new Date(timestamp));
}

export const simulationData = {
  activities: activitiesJson,
  businessMetrics: businessMetricsJson,
  claims: claimsJson,
  clients: clientsJson,
  compliance: complianceJson,
  documents: documentsJson,
  negotiations: negotiationsJson,
  policies: policiesJson,
  renewals: renewalsJson,
  submissions: submissionsJson,
  tasks: tasksJson,
  teamMembers: teamMembersJson,
};

export const navItems = [
  { label: 'Dashboard', path: '/', icon: RadioTower, tone: 'cyan' },
  { label: 'Clients', path: '/clients', icon: Building2, tone: 'blue' },
  { label: 'Renewals', path: '/renewals', icon: Gauge, tone: 'green' },
  { label: 'Submissions', path: '/submissions', icon: ClipboardCheck, tone: 'amber' },
  { label: 'Placements', path: '/negotiations', icon: MessagesSquare, tone: 'teal' },
  { label: 'Claims', path: '/claims', icon: Headphones, tone: 'red' },
  { label: 'Compliance', path: '/compliance', icon: ShieldCheck, tone: 'green' },
  { label: 'Documents', path: '/documents', icon: FileStack, tone: 'violet' },
  { label: 'Insights', path: '/ai-insights', icon: Bot, tone: 'cyan' },
  { label: 'Reports', path: '/reports', icon: BarChart3, tone: 'blue' },
  { label: 'Settings', path: '/settings', icon: Settings, tone: 'slate' },
];

export const roles = ['Executive', 'Account Manager', 'Placement Lead', 'Claims', 'Compliance'];

export const metrics = [
  {
    label: 'Premium Managed',
    value: compactCurrency(totalPremium),
    delta: `${clientsJson.length} active clients`,
    status: 'portfolio',
    icon: Plane,
    accent: 'cyan',
    spark: [44, 48, 52, 57, 55, 60, 64, 67, 70, 74, 77, 82],
  },
  {
    label: 'Open Claims',
    value: numberFormatter.format(claimsExposure.count),
    delta: `${compactCurrency(claimsExposure.incurredAmount)} incurred`,
    status: 'active',
    icon: Bell,
    accent: 'blue',
    spark: [24, 28, 26, 32, 35, 31, 38, 42, 40, 44, 46, 48],
  },
  {
    label: 'Compliance',
    value: `${averageCompliance}%`,
    delta: `${getComplianceRiskLevel(complianceJson)} risk level`,
    status: averageCompliance >= 92 ? 'compliant' : 'review',
    icon: BadgeCheck,
    accent: averageCompliance >= 92 ? 'green' : 'amber',
    spark: [82, 84, 85, 87, 88, 89, 90, 91, 91, 92, averageCompliance, averageCompliance],
  },
  {
    label: 'Annual Revenue',
    value: compactCurrency(estimatedRevenue),
    delta: `${compactCurrency(revenueAtRisk)} at risk`,
    status: 'forecast',
    icon: Landmark,
    accent: 'amber',
    spark: [36, 41, 45, 48, 50, 56, 61, 63, 66, 70, 74, 79],
  },
];

export const missionStatements = [
  { label: 'Renewals due in 30 days', value: String(renewalsDue30.length), tone: 'amber' },
  { label: `Negotiation savings opportunity ${compactCurrency(savingsOpportunity)}`, value: String(negotiationsJson.length), tone: 'green' },
  { label: 'Claims requiring review', value: String(claimsExposure.requiringReview), tone: claimsExposure.requiringReview ? 'red' : 'green' },
  { label: 'Average client health', value: `${averageClientHealth}%`, tone: 'cyan' },
];

export const missionStatusSummary = [
  `${highPriorityClients.length} priority clients`,
  `${overdueTasks.length} overdue tasks`,
  `${documentCompletionRate}% document completion`,
];

export const intelligenceBriefing = {
  summary:
    'Portfolio performance is stable, with near-term attention needed on renewal readiness, documentation gaps and a small set of high-value placements.',
  priorities: [
    `Review ${compactCurrency(revenueAtRisk)} of revenue at risk across priority renewals.`,
    `Resolve ${overdueTasks.length} overdue client tasks before the next renewal meeting.`,
    `Improve document completeness for ${documentsJson.filter((document) => document.status === 'Missing').length} missing files.`,
  ],
  alerts: highPriorityClients.slice(0, 2).map((client) => ({
    label: `${client.name}: ${client.retentionRisk} retention risk, ${client.openTasksCount} open tasks`,
    tone: toneForSeverity(client.priorityLevel),
  })),
  actions: tasksJson
    .filter((task) => task.status !== 'Completed')
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, 3)
    .map((task) => task.title),
};

export const renewalStages = ['Data Collection', 'Submission Ready', 'Marketed', 'Negotiation', 'Binding', 'At Risk'].map((stage) => ({
  label: stage,
  count: renewalsJson.filter((renewal) => renewal.currentStage === stage).length,
  progress: stage === 'At Risk' ? 22 : stage === 'Binding' ? 92 : stage === 'Negotiation' ? 74 : stage === 'Marketed' ? 62 : stage === 'Submission Ready' ? 48 : 30,
  tone: stage === 'At Risk' ? 'red' : stage === 'Binding' ? 'green' : stage === 'Negotiation' ? 'amber' : 'cyan',
}));

export const insurerStatusCards = negotiationsJson.slice(0, 3).map((negotiation) => ({
  market: negotiation.recommendedInsurer,
  account: shortClientName(negotiation.clientId),
  status: negotiation.currentStatus,
  premium: compactCurrency(negotiation.estimatedSavings),
  appetite: negotiation.pendingQuestions[0],
  tone: negotiation.decisionRequired ? 'amber' : 'green',
}));

export const claimsReviewItems = claimsJson
  .slice()
  .sort((a, b) => b.reserveAmount - a.reserveAmount)
  .slice(0, 3)
  .map((claim) => ({
    claim: claim.claimType,
    account: shortClientName(claim.clientId),
    severity: claim.severity,
    reserve: compactCurrency(claim.reserveAmount),
    review: claim.status,
    tone: toneForSeverity(claim.severity),
  }));

export const complianceMissions = complianceJson.slice(0, 4).map((item) => ({
  label: item.findingType,
  due: dateLabel(item.dueDate),
  status: item.status,
  progress: item.status === 'Overdue' ? 28 : item.status === 'Open' ? 58 : 78,
  tone: item.status === 'Overdue' ? 'red' : toneForSeverity(item.severity),
}));

export const activities = activitiesJson.slice(0, 5).map((activity) => ({
  time: timeLabel(activity.timestamp),
  eventType: activity.activityType,
  account: shortClientName(activity.clientId),
  action: activity.summary,
  status: activity.importanceLevel,
  tone: toneForStatus(activity.importanceLevel),
}));

export const timeline = activitiesJson.slice(5, 8).map((activity) => ({
  label: activity.activityType,
  detail: `${clientName(activity.clientId)} - ${activity.summary}`,
  time: timeLabel(activity.timestamp),
}));

export const workspaceRows = clientsJson
  .slice()
  .sort((a, b) => b.clientHealthScore - a.clientHealthScore)
  .slice(0, 6)
  .map((client) => [
    client.name,
    client.clientType,
    client.retentionRisk,
    client.relationshipStatus,
    compactCurrency(client.annualPremium),
  ]);
