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
    label: 'Total Pipeline',
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

export const renewalSeries = [
  { name: 'Fleet Other', color: '#1d9bf0', values: [10, 17, 22, 19, 30, 27, 41, 35, 52, 66, 61, 74, 80] },
  { name: 'Excess', color: '#20d3a2', values: [8, 12, 16, 18, 20, 25, 31, 34, 39, 46, 52, 57, 64] },
  { name: 'Hull', color: '#ff6b4a', values: [9, 14, 15, 21, 24, 31, 36, 40, 47, 52, 61, 66, 68] },
  { name: 'Casualty', color: '#a26cf8', values: [5, 9, 11, 15, 18, 21, 25, 28, 34, 38, 42, 47, 51] },
];

export const submissionStatus = [
  { label: 'New', value: 28, color: '#1d9bf0' },
  { label: 'Quote Pending', value: 22, color: '#f7c948' },
  { label: 'Info Requested', value: 14, color: '#ff6b4a' },
  { label: 'Review', value: 8, color: '#a26cf8' },
];

export const negotiations = [
  ['Skylark Airlines', 'Hull & Liability', "Lloyd's / AXA", 'In Negotiation', '+12%'],
  ['Aviance Solutions', 'Aviation Liability', 'Chubb / AIG', 'In Negotiation', '+8%'],
  ['Trisula Cargo', 'Hull & Liability', "Lloyd's / Allianz", 'In Negotiation', '+19%'],
  ['Global Wings', 'War & AP', 'Beazley / Swiss Re', 'Quoted', '+6%'],
];

export const claimsBars = [22, 35, 44, 31, 28, 18, 26, 39, 51, 34, 27, 42, 58, 47, 61, 72, 45, 36];

export const complianceControls = [
  ['KYC / Due Diligence', '98%'],
  ['Sanctions Screening', '96%'],
  ['Policy Wording', '90%'],
  ['Certificates', '88%'],
  ['Training', '87%'],
];

export const activities = [
  { name: 'New submission received', detail: 'HNI Operations', time: '10m ago', avatar: 'AK', tone: 'cyan' },
  { name: 'Market update published', detail: 'Hull & Liability', time: '25m ago', avatar: 'MR', tone: 'green' },
  { name: 'Claim resolved', detail: 'Fuselage surge', time: '1h ago', avatar: 'LS', tone: 'red' },
  { name: 'Policy bound', detail: 'AirCrest', time: '2h ago', avatar: 'JT', tone: 'amber' },
];

export const insights = [
  'Market hardening expected to create a 10.2% profitability gap for Hull & Liability and War coverage.',
  '3 accounts have optimization opportunities above $500K.',
  'Claims severity is trending down across regional cargo fleets.',
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
