import {
  BadgeCheck,
  BarChart3,
  Bell,
  BriefcaseBusiness,
  Building2,
  ClipboardCheck,
  FileStack,
  Home,
  Headphones,
  Landmark,
  RefreshCw,
  Plane,
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
  getSum,
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
const claimsExposure = getClaimsExposure(claimsJson);
const averageCompliance = getAverage(clientsJson, 'complianceScore');

function compactCurrency(value) {
  return currencyFormatter.format(value).replace('.0', '');
}

function clientName(clientId) {
  return clientById.get(clientId)?.name ?? 'Unassigned account';
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
  { label: 'Executive Overview', mobileLabel: 'Overview', path: '/', icon: Home, tone: 'blue' },
  { label: 'Account Manager Workspace', mobileLabel: 'Manager', path: '/account-manager', icon: BriefcaseBusiness, tone: 'cyan' },
  { label: 'Clients', path: '/clients', icon: Building2, tone: 'blue' },
  { label: 'Renewals', path: '/renewals', icon: RefreshCw, tone: 'green' },
  { label: 'Submissions', path: '/submissions', icon: ClipboardCheck, tone: 'amber' },
  { label: 'Market Placement', mobileLabel: 'Placement', path: '/market-placement', icon: Plane, tone: 'teal' },
  { label: 'Claims', path: '/claims', icon: Headphones, tone: 'red' },
  { label: 'Compliance', path: '/compliance', icon: ShieldCheck, tone: 'green' },
  { label: 'Documents', path: '/documents', icon: FileStack, tone: 'violet' },
  { label: 'Reports', path: '/reports', icon: BarChart3, tone: 'blue' },
  { label: 'Administration', mobileLabel: 'Admin', path: '/administration', icon: Settings, tone: 'slate' },
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

export const renewalStages = ['Data Collection', 'Submission Ready', 'Marketed', 'Negotiation', 'Binding', 'At Risk'].map((stage) => ({
  label: stage,
  count: renewalsJson.filter((renewal) => renewal.currentStage === stage).length,
  progress: stage === 'At Risk' ? 22 : stage === 'Binding' ? 92 : stage === 'Negotiation' ? 74 : stage === 'Marketed' ? 62 : stage === 'Submission Ready' ? 48 : 30,
  tone: stage === 'At Risk' ? 'red' : stage === 'Binding' ? 'green' : stage === 'Negotiation' ? 'amber' : 'cyan',
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
