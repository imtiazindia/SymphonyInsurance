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
    value: '$312M',
    delta: '+12.4% vs LY',
    status: 'live',
    icon: Plane,
    accent: 'cyan',
    spark: [18, 24, 21, 28, 31, 38, 35, 44, 51, 55, 63, 71],
  },
  {
    label: 'Open Claims',
    value: '38',
    delta: 'Incurred $24.6M',
    status: 'monitored',
    icon: Bell,
    accent: 'blue',
    spark: [32, 35, 40, 37, 46, 44, 52, 49, 56, 61, 58, 64],
  },
  {
    label: 'Compliance',
    value: '92%',
    delta: '4 controls pending',
    status: 'on track',
    icon: BadgeCheck,
    accent: 'green',
    spark: [73, 76, 78, 82, 80, 84, 86, 88, 89, 90, 92, 92],
  },
  {
    label: 'Market Capacity',
    value: '$1.8B',
    delta: '+6 active carriers',
    status: 'expanding',
    icon: Landmark,
    accent: 'amber',
    spark: [38, 42, 46, 45, 51, 57, 62, 60, 68, 72, 77, 82],
  },
];

export const missionStatements = [
  { label: 'Renewals requiring action today', value: '6', tone: 'amber' },
  { label: 'Negotiations may reduce premium by $482K', value: '3', tone: 'green' },
  { label: 'Claims require executive review', value: '2', tone: 'red' },
  { label: 'Portfolio health across active fleets', value: '94%', tone: 'cyan' },
];

export const missionStatusSummary = [
  '3 renewals need action',
  '1 negotiation awaiting approval',
  '2 compliance items overdue',
];

export const intelligenceBriefing = {
  summary:
    'Market pressure is rising across hull and excess liability, but three carrier conversations can still protect margin before the renewal board closes today.',
  priorities: [
    'Approve Skylark deductible strategy before the Lloyd\'s syndicate window closes.',
    'Move AeroNorth pilot roster validation ahead of certificate release.',
    'Escalate HelioCargo reserve movement to executive claims review.',
  ],
  alerts: [
    { label: 'War risk appetite narrowed across APAC corridors', tone: 'amber' },
    { label: 'Two certificates expire inside 72 hours', tone: 'red' },
  ],
  actions: [
    'Open negotiation approval packet',
    'Request updated fleet utilization',
    'Prepare executive claims note',
  ],
};

export const renewalStages = [
  { label: 'Data Collection', count: 12, progress: 92, tone: 'green' },
  { label: 'Submission Prep', count: 8, progress: 74, tone: 'cyan' },
  { label: 'Marketed', count: 15, progress: 68, tone: 'blue' },
  { label: 'Quoted', count: 9, progress: 52, tone: 'amber' },
  { label: 'Negotiating', count: 6, progress: 46, tone: 'amber' },
  { label: 'Binding', count: 4, progress: 32, tone: 'green' },
  { label: 'At Risk', count: 3, progress: 18, tone: 'red' },
];

export const insurerStatusCards = [
  {
    market: "Lloyd's Syndicate 4412",
    account: 'Skylark Airlines',
    status: 'Deductible accepted',
    premium: '-$218K',
    appetite: 'Strong hull appetite',
    tone: 'green',
  },
  {
    market: 'AXA Aviation',
    account: 'AeroNorth Group',
    status: 'Awaiting executive approval',
    premium: '-$164K',
    appetite: 'Capacity held until 16:00',
    tone: 'amber',
  },
  {
    market: 'Swiss Re Corporate',
    account: 'HelioCargo',
    status: 'Reserve movement flagged',
    premium: '+$91K',
    appetite: 'Claims review required',
    tone: 'red',
  },
];

export const claimsReviewItems = [
  {
    claim: 'AOG engine incident',
    account: 'HelioCargo',
    severity: 'High',
    reserve: '$4.8M',
    review: 'Executive review',
    tone: 'red',
  },
  {
    claim: 'Ground handling liability',
    account: 'Skylark Airlines',
    severity: 'Medium',
    reserve: '$870K',
    review: 'Counsel response due',
    tone: 'amber',
  },
  {
    claim: 'Hangar storm damage',
    account: 'AeroNorth Group',
    severity: 'Low',
    reserve: '$310K',
    review: 'Monitor',
    tone: 'green',
  },
];

export const complianceMissions = [
  { label: 'Certificate expiry', due: '48h', status: '2 overdue', progress: 38, tone: 'red' },
  { label: 'Sanctions screening', due: 'Today', status: '1 pending', progress: 72, tone: 'amber' },
  { label: 'Policy wording', due: '3d', status: '5 in review', progress: 84, tone: 'cyan' },
  { label: 'KYC refresh', due: '7d', status: 'On track', progress: 96, tone: 'green' },
];

export const activities = [
  {
    time: '13:41',
    eventType: 'Carrier Update',
    account: 'AeroNorth',
    action: 'Carrier accepted revised deductible',
    status: 'Success',
    tone: 'green',
  },
  {
    time: '13:18',
    eventType: 'Fleet Data',
    account: 'Skylark Airlines',
    action: 'Pilot roster uploaded',
    status: 'Complete',
    tone: 'green',
  },
  {
    time: '12:51',
    eventType: 'Claims',
    account: 'HelioCargo',
    action: 'Claim reserve updated',
    status: 'Attention',
    tone: 'red',
  },
  {
    time: '12:34',
    eventType: 'Compliance',
    account: 'BlueOrbit',
    action: 'Certificate wording cleared',
    status: 'Ready',
    tone: 'cyan',
  },
  {
    time: '11:58',
    eventType: 'Renewal',
    account: 'Trisula Cargo',
    action: 'Binding checklist moved to legal',
    status: 'In Flight',
    tone: 'amber',
  },
];

export const timeline = [
  { label: 'Aviation renewal board', detail: 'Capacity model refreshed for APAC carriers', time: '08:15' },
  { label: 'Broker desk sync', detail: 'Priority negotiation queue updated', time: '09:20' },
  { label: 'Carrier signal', detail: 'Two markets reopened excess liability appetite', time: '11:45' },
];

export const workspaceRows = [
  ['AeroNorth Group', 'Fleet Renewal', 'High', 'Reviewing', '$42M'],
  ['HelioCargo', 'Claims', 'Medium', 'Action Needed', '$18M'],
  ['Skylark Airlines', 'Negotiation', 'Elevated', 'Live', '$77M'],
  ['BlueOrbit', 'Compliance', 'Low', 'On Track', '$12M'],
];
