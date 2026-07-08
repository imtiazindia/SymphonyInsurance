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
import aircraftJson from './aircraft.json';
import aiInsightsJson from './aiInsights.json';
import claimsJson from './claims.json';
import clientsJson from './clients.json';
import complianceJson from './compliance.json';
import documentsJson from './documents.json';
import marketConditionsJson from './marketConditions.json';
import negotiationsJson from './negotiations.json';
import pilotsJson from './pilots.json';
import policiesJson from './policies.json';
import renewalsJson from './renewals.json';
import submissionsJson from './submissions.json';
import teamMembersJson from './teamMembers.json';

const currencyFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 1,
  notation: 'compact',
  style: 'currency',
  currency: 'USD',
});

const numberFormatter = new Intl.NumberFormat('en-US');

const clientById = new Map(clientsJson.map((client) => [client.id, client]));

const totalPremium = clientsJson.reduce((sum, client) => sum + client.totalPremium, 0);
const openClaims = claimsJson.filter((claim) => claim.status !== 'Closed').length;
const incurredClaims = claimsJson.reduce((sum, claim) => sum + claim.incurredAmount, 0);
const overdueCompliance = complianceJson.filter((item) => item.status === 'Overdue').length;
const openCompliance = complianceJson.filter((item) => item.status !== 'Closed').length;
const averageCompliance = Math.round(
  clientsJson.reduce((sum, client) => sum + client.complianceScore, 0) / clientsJson.length,
);
const renewalActions = renewalsJson.filter((renewal) => renewal.actionRequiredToday).length;
const awaitingApproval = negotiationsJson.filter((item) => item.status.toLowerCase().includes('approval')).length;
const executiveClaims = claimsJson.filter((claim) => claim.status.toLowerCase().includes('executive')).length;
const recommendedNegotiations = negotiationsJson.filter((item) => item.recommendationFlag === 'Recommended').length;
const premiumOpportunity = negotiationsJson
  .filter((item) => item.recommendationFlag === 'Recommended')
  .reduce((sum, item) => {
    const renewal = renewalsJson.find((candidate) => candidate.id === item.renewalId);
    return sum + Math.max(0, (renewal?.targetPremium ?? item.premiumQuoted) - item.premiumQuoted);
  }, 0);

function compactCurrency(value) {
  return currencyFormatter.format(value).replace('.0', '');
}

function clientName(clientId) {
  return clientById.get(clientId)?.name ?? 'Unassigned account';
}

function shortClientName(clientId) {
  return clientName(clientId)
    .replace(' Airways', '')
    .replace(' Airlines', '')
    .replace(' Express', '')
    .replace(' Group', '');
}

function toneForStatus(status) {
  const normalized = status.toLowerCase();
  if (normalized.includes('attention') || normalized.includes('overdue') || normalized.includes('risk') || normalized.includes('executive')) {
    return 'red';
  }
  if (normalized.includes('awaiting') || normalized.includes('pending') || normalized.includes('review') || normalized.includes('flight')) {
    return 'amber';
  }
  if (normalized.includes('success') || normalized.includes('complete') || normalized.includes('ready') || normalized.includes('recommended')) {
    return 'green';
  }
  return 'cyan';
}

function toneForSeverity(severity) {
  if (severity === 'High') return 'red';
  if (severity === 'Medium') return 'amber';
  return 'green';
}

function renewalProgress(stage) {
  return {
    'Data Collection': 24,
    'Submission Prep': 42,
    Marketed: 58,
    Quoted: 70,
    Negotiating: 78,
    Binding: 92,
    'At Risk': 18,
  }[stage] ?? 35;
}

function dateLabel(date) {
  const due = new Date(`${date}T00:00:00Z`);
  const now = new Date('2026-07-08T00:00:00Z');
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
  aircraft: aircraftJson,
  aiInsights: aiInsightsJson,
  claims: claimsJson,
  clients: clientsJson,
  compliance: complianceJson,
  documents: documentsJson,
  marketConditions: marketConditionsJson,
  negotiations: negotiationsJson,
  pilots: pilotsJson,
  policies: policiesJson,
  renewals: renewalsJson,
  submissions: submissionsJson,
  teamMembers: teamMembersJson,
};

export const navItems = [
  { label: 'Command Center', path: '/', icon: RadioTower, tone: 'cyan' },
  { label: 'Clients', path: '/clients', icon: Building2, tone: 'blue' },
  { label: 'Renewals', path: '/renewals', icon: Gauge, tone: 'green' },
  { label: 'Submissions', path: '/submissions', icon: ClipboardCheck, tone: 'amber' },
  { label: 'Negotiations', path: '/negotiations', icon: MessagesSquare, tone: 'teal' },
  { label: 'Claims', path: '/claims', icon: Headphones, tone: 'red' },
  { label: 'Compliance', path: '/compliance', icon: ShieldCheck, tone: 'green' },
  { label: 'Documents', path: '/documents', icon: FileStack, tone: 'violet' },
  { label: 'AI Insights', path: '/ai-insights', icon: Bot, tone: 'cyan' },
  { label: 'Reports', path: '/reports', icon: BarChart3, tone: 'blue' },
  { label: 'Settings', path: '/settings', icon: Settings, tone: 'slate' },
];

export const roles = ['Executive', 'Broker Lead', 'Claims Ops', 'Compliance'];

export const metrics = [
  {
    label: 'Fleet Pipeline',
    value: compactCurrency(totalPremium),
    delta: `${clientsJson.length} active aviation accounts`,
    status: 'live',
    icon: Plane,
    accent: 'cyan',
    spark: [18, 24, 21, 28, 31, 38, 35, 44, 51, 55, 63, 71],
  },
  {
    label: 'Open Claims',
    value: numberFormatter.format(openClaims),
    delta: `Incurred ${compactCurrency(incurredClaims)}`,
    status: 'monitored',
    icon: Bell,
    accent: 'blue',
    spark: [32, 35, 40, 37, 46, 44, 52, 49, 56, 61, 58, 64],
  },
  {
    label: 'Compliance',
    value: `${averageCompliance}%`,
    delta: `${openCompliance} controls pending`,
    status: overdueCompliance ? 'attention' : 'on track',
    icon: BadgeCheck,
    accent: overdueCompliance ? 'amber' : 'green',
    spark: [73, 76, 78, 82, 80, 84, 86, 88, 89, 90, averageCompliance, averageCompliance],
  },
  {
    label: 'Market Capacity',
    value: compactCurrency(marketConditionsJson.capacity.hullAndLiability),
    delta: marketConditionsJson.overallMarketStatus,
    status: 'market',
    icon: Landmark,
    accent: 'amber',
    spark: [38, 42, 46, 45, 51, 57, 62, 60, 68, 72, 77, 82],
  },
];

export const missionStatements = [
  { label: 'Renewals requiring action today', value: String(renewalActions), tone: 'amber' },
  {
    label: `Negotiations may reduce premium by ${compactCurrency(premiumOpportunity || 482000)}`,
    value: String(recommendedNegotiations),
    tone: 'green',
  },
  { label: 'Claims require executive review', value: String(executiveClaims), tone: executiveClaims ? 'red' : 'green' },
  { label: 'Portfolio compliance health', value: `${averageCompliance}%`, tone: 'cyan' },
];

export const missionStatusSummary = [
  `${renewalActions} renewals need action`,
  `${awaitingApproval} negotiation awaiting approval`,
  `${overdueCompliance} compliance item overdue`,
];

export const intelligenceBriefing = {
  summary: aiInsightsJson.executiveBriefing,
  priorities: [
    aiInsightsJson.policyOptimizationSuggestions[0].suggestion,
    aiInsightsJson.submissionGaps[0].nextBestAction,
    aiInsightsJson.claimsWarnings[0].warning,
  ],
  alerts: aiInsightsJson.renewalRisks.slice(0, 2).map((risk) => ({
    label: `${shortClientName(risk.clientId)}: ${risk.summary}`,
    tone: toneForSeverity(risk.severity),
  })),
  actions: aiInsightsJson.submissionGaps.slice(0, 3).map((gap) => gap.nextBestAction),
};

export const renewalStages = ['Data Collection', 'Submission Prep', 'Marketed', 'Quoted', 'Negotiating', 'Binding', 'At Risk'].map(
  (stage) => ({
    label: stage,
    count: renewalsJson.filter((renewal) => renewal.stage === stage).length,
    progress: renewalProgress(stage),
    tone: stage === 'At Risk' ? 'red' : stage === 'Binding' ? 'green' : stage === 'Negotiating' || stage === 'Quoted' ? 'amber' : 'cyan',
  }),
);

export const insurerStatusCards = negotiationsJson.slice(0, 3).map((negotiation) => {
  const renewal = renewalsJson.find((item) => item.id === negotiation.renewalId);
  const premiumDelta = renewal ? renewal.targetPremium - negotiation.premiumQuoted : 0;
  return {
    market: negotiation.insurerName,
    account: shortClientName(negotiation.clientId),
    status: negotiation.status,
    premium: premiumDelta < 0 ? `+${compactCurrency(Math.abs(premiumDelta))}` : `-${compactCurrency(Math.abs(premiumDelta))}`,
    appetite: negotiation.underwriterQuestions[0] ?? negotiation.subjectivities[0],
    tone: toneForStatus(negotiation.recommendationFlag),
  };
});

export const claimsReviewItems = claimsJson
  .slice()
  .sort((a, b) => b.reserve - a.reserve)
  .slice(0, 3)
  .map((claim) => ({
    claim: claim.claimType,
    account: shortClientName(claim.clientId),
    severity: claim.severity,
    reserve: compactCurrency(claim.reserve),
    review: claim.status,
    tone: toneForSeverity(claim.severity),
  }));

export const complianceMissions = complianceJson.slice(0, 4).map((item) => ({
  label: item.auditFinding.split(' ').slice(0, 4).join(' '),
  due: dateLabel(item.dueDate),
  status: item.status,
  progress: item.status === 'Overdue' ? 28 : item.status === 'Open' ? 58 : 78,
  tone: item.status === 'Overdue' ? 'red' : toneForSeverity(item.severity),
}));

export const activities = activitiesJson.slice(0, 5).map((activity) => ({
  time: timeLabel(activity.timestamp),
  eventType: activity.eventType,
  account: shortClientName(activity.clientId),
  action: activity.action,
  status: activity.status,
  tone: toneForStatus(activity.status),
}));

export const timeline = activitiesJson.slice(5, 8).map((activity) => ({
  label: activity.eventType,
  detail: `${clientName(activity.clientId)} - ${activity.action}`,
  time: timeLabel(activity.timestamp),
}));

export const workspaceRows = clientsJson
  .slice()
  .sort((a, b) => b.riskScore - a.riskScore)
  .slice(0, 6)
  .map((client) => [
    client.name,
    client.type,
    client.riskScore >= 75 ? 'High' : client.riskScore >= 62 ? 'Medium' : 'Low',
    client.renewalStatus,
    compactCurrency(client.totalPremium),
  ]);
