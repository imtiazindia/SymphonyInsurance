import { useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BadgeDollarSign,
  BriefcaseBusiness,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  FileText,
  Gauge,
  MessageSquarePlus,
  Plane,
  Printer,
  Search,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import {
  BusinessActivityTimeline,
  BusinessKpiCard,
  ClientHealthBadge,
  ComplianceSeverityBadge,
  DocumentStatusBadge,
  RevenueImpactLabel,
  RenewalStatusBadge,
  TaskPriorityBadge,
} from '../components/BusinessComponents.jsx';
import { simulationData } from '../data/demoData.js';
import { getAriClientExposure, getAriTopFactors, getAriView } from '../utils/aviationRiskIndex.js';
import { getClaimsExposure, getDocumentGapCount, getSum } from '../utils/businessCalculations.js';

const asOfDate = '2026-07-10';
const today = new Date(`${asOfDate}T00:00:00Z`);
const ariView = getAriView('domestic');

const compactCurrencyFormatter = new Intl.NumberFormat('en-US', {
  currency: 'USD',
  maximumFractionDigits: 1,
  notation: 'compact',
  style: 'currency',
});

const dateFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
const shortDateFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });
const timeFormatter = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', month: 'short', day: 'numeric' });

const userById = new Map(simulationData.teamMembers.map((user) => [user.id, user]));
const clientById = new Map(simulationData.clients.map((client) => [client.id, client]));

const savedViews = [
  ['all', 'All Clients'],
  ['mine', 'My Clients'],
  ['highValue', 'High Value Clients'],
  ['renewalsDue', 'Renewals Due Soon'],
  ['attention', 'Clients Requiring Attention'],
  ['claims', 'Open Claims'],
  ['compliance', 'Compliance Concerns'],
  ['incomplete', 'Incomplete Submissions'],
  ['atRisk', 'At-Risk Relationships'],
];

const tabs = [
  ['overview', 'Overview'],
  ['relationship', 'Relationship'],
  ['operations', 'Operations'],
  ['coverage', 'Policies & Renewal'],
  ['claims', 'Claims'],
  ['risk', 'Risk'],
  ['documents', 'Documents'],
  ['activity', 'Activity'],
];

function compactCurrency(value) {
  return compactCurrencyFormatter.format(value || 0).replace('.0', '');
}

function formatDate(date) {
  if (!date) return 'Not scheduled';
  return dateFormatter.format(new Date(`${date}T00:00:00Z`));
}

function shortDate(date) {
  if (!date) return 'Not set';
  return shortDateFormatter.format(new Date(`${date}T00:00:00Z`));
}

function daysUntil(date) {
  if (!date) return 999;
  return Math.ceil((new Date(`${date}T00:00:00Z`) - today) / 86400000);
}

function userName(userId) {
  return userById.get(userId)?.name ?? 'Unassigned';
}

function getRiskRating(client, bundle) {
  const highClaims = bundle.claims.filter((claim) => claim.severity === 'High' || claim.executiveReviewRequired).length;
  const overdueCompliance = bundle.compliance.filter((item) => item.status === 'Overdue').length;
  const documentGaps = getDocumentGapCount(bundle.documents);
  const riskScore = (100 - client.clientHealthScore)
    + (100 - client.complianceScore) * 0.5
    + documentGaps * 4
    + highClaims * 12
    + overdueCompliance * 9
    + (client.retentionRisk === 'High' ? 15 : client.retentionRisk === 'Medium' ? 6 : 0);
  if (riskScore >= 62) return 'High';
  if (riskScore >= 42) return 'Elevated';
  if (riskScore >= 27) return 'Moderate';
  return 'Guarded';
}

function getReadinessLabel(score = 0) {
  if (score >= 88) return 'Ready';
  if (score >= 76) return 'On Track';
  if (score >= 62) return 'Needs Attention';
  return 'At Risk';
}

function getClientPolicies(clientId) {
  return simulationData.policies.filter((policy) => policy.clientId === clientId);
}

function getClientRenewals(clientId) {
  return simulationData.renewals.filter((renewal) => renewal.clientId === clientId);
}

function getClientClaims(clientId) {
  return simulationData.claims.filter((claim) => claim.clientId === clientId);
}

function getClientCompliance(clientId) {
  return simulationData.compliance.filter((item) => item.clientId === clientId);
}

function getClientDocuments(clientId) {
  return simulationData.documents.filter((document) => document.clientId === clientId);
}

function getClientTasks(clientId) {
  return simulationData.tasks.filter((task) => task.clientId === clientId);
}

function getClientActivities(clientId) {
  return simulationData.activities.filter((activity) => activity.clientId === clientId);
}

function getClientContacts(client) {
  const domain = client.name.toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 18) || 'client';
  const roles = [
    ['Executive Sponsor', 'Chief Executive Officer', 'Executive'],
    ['Aviation Director', 'Director of Aviation', 'Operations'],
    ['Chief Pilot', 'Chief Pilot', 'Flight Operations'],
    ['Maintenance Director', 'Director of Maintenance', 'Maintenance'],
    ['Finance Contact', 'Controller', 'Finance'],
  ];
  return roles.map(([name, title, role], index) => ({
    id: `${client.id}-contact-${index}`,
    name: `${name}`,
    title,
    role,
    email: `${role.toLowerCase().replace(/\s+/g, '.')}.${client.id.toLowerCase()}@${domain}.example`,
    phone: `(555) 01${index}-${client.id.slice(-3)}`,
    preference: index % 2 ? 'Email' : 'Phone and email',
    importance: index <= 1 ? 'Primary' : 'Supporting',
    lastContact: `2026-07-0${Math.min(index + 3, 9)}`,
  }));
}

function getClientAircraft(client, policies, claims) {
  const aircraftCount = Math.max(1, Math.min(5, Math.round(client.annualPremium / 9000000) || 1));
  const modelByType = client.clientType.includes('Airline')
    ? ['Boeing 737-800', 'Embraer E175', 'Airbus A220']
    : client.clientType.includes('Flight')
      ? ['Piper Archer', 'Cessna 172S', 'Diamond DA40']
      : client.clientType.includes('Helicopter')
        ? ['Airbus H125', 'Bell 407', 'Sikorsky S-76']
        : ['Gulfstream G550', 'Bombardier Challenger 350', 'Cessna Citation Latitude'];
  return Array.from({ length: aircraftCount }, (_, index) => {
    const policy = policies[index % Math.max(1, policies.length)];
    const claim = claims[index % Math.max(1, claims.length)];
    const tail = `N${client.id.slice(-3)}${index + 1}${client.name.replace(/[^A-Z]/g, '').slice(0, 1) || 'A'}`;
    return {
      id: `${client.id}-aircraft-${index + 1}`,
      manufacturer: modelByType[index % modelByType.length].split(' ')[0],
      model: modelByType[index % modelByType.length],
      year: 2017 + (index % 7),
      tailNumber: tail,
      serialNumber: `${client.id.replace('CLI-', 'SN')}-${880 + index}`,
      insuredValue: Math.round(client.annualPremium * (0.45 + index * 0.06)),
      usage: client.industrySegment,
      baseAirport: client.location.split(',')[0],
      ownershipType: index % 3 === 0 ? 'Owned' : index % 3 === 1 ? 'Leased' : 'Managed',
      status: index === 0 ? 'Active' : index % 4 === 0 ? 'Grounded for review' : 'Active',
      policyId: policy?.id,
      pilotApproval: index % 2 ? 'Named pilot approval required' : 'Approved pilot roster',
      maintenanceStatus: client.documentCompleteness < 75 ? 'Documentation review needed' : 'Current',
      recentClaim: Boolean(claim && index === 0),
    };
  });
}

function getClientPilots(client, aircraft, documents) {
  const rosterStatus = documents.some((document) => document.documentType.toLowerCase().includes('roster') && document.status !== 'Approved');
  return aircraft.slice(0, Math.max(2, Math.min(5, aircraft.length + 1))).map((aircraftItem, index) => ({
    id: `${client.id}-pilot-${index + 1}`,
    name: `Pilot ${index + 1}`,
    role: index === 0 ? 'Chief Pilot' : index === 1 ? 'Captain' : 'Relief Pilot',
    certificate: index === 0 ? 'ATP / Type Rated' : 'Commercial / Instrument',
    totalHours: 4200 + index * 850,
    modelHours: 260 + index * 110,
    recentHours: 48 - index * 5,
    trainingStatus: rosterStatus && index === 1 ? 'Records Missing' : index === 2 ? 'Due Soon' : 'Current',
    recurrentTrainingDate: `2026-0${8 + (index % 3)}-${12 + index}`,
    approvalStatus: rosterStatus && index === 1 ? 'Pending' : 'Approved',
    restrictions: index === 2 ? 'Day VFR restriction pending review' : 'None recorded',
    linkedAircraft: aircraftItem.tailNumber,
    documentationStatus: rosterStatus && index === 1 ? 'Missing records' : 'Complete',
  }));
}

function getClientFinancialSummary(client, bundle) {
  const policyPremium = getSum(bundle.policies, 'premium') || client.annualPremium;
  const commission = getSum(bundle.policies, 'estimatedCommission');
  const renewalRevenue = getSum(bundle.renewals, 'revenueAtRisk') || client.estimatedRevenue;
  const optimization = bundle.policies.filter((policy) => policy.optimizationOpportunity || policy.coverageConcern !== 'No material coverage concern');
  return {
    policyPremium,
    commission,
    renewalRevenue,
    revenueAtRisk: bundle.renewals[0]?.revenueAtRisk ?? Math.round(client.estimatedRevenue * 0.18),
    currentYearRevenue: client.estimatedRevenue,
    opportunity: optimization.length ? optimization[0].coverageConcern || optimization[0].optimizationOpportunity : 'No material coverage optimization currently flagged.',
    trend: client.clientHealthScore >= 82 ? 'Stable to improving' : 'Needs protection',
  };
}

function getClientPriorityItems(client, bundle, financial) {
  const priorities = [];
  const renewal = bundle.renewals[0];
  const submission = bundle.submissions[0];
  const placement = bundle.negotiations[0];
  if (renewal && renewal.daysToExpiry <= 45) {
    priorities.push({
      id: `renewal-${renewal.id}`,
      issue: `Renewal expires in ${renewal.daysToExpiry} days`,
      workflow: 'Renewal',
      impact: 'Renewal timing requires active account coordination.',
      financialImpact: compactCurrency(renewal.revenueAtRisk),
      owner: userName(renewal.assignedUserId),
      dueDate: renewal.expiryDate,
      nextStep: renewal.missingItems.length ? `Resolve ${renewal.missingItems[0]}` : 'Confirm renewal strategy',
      route: `/renewals/${renewal.id}`,
    });
  }
  if (submission && (submission.completionPercent < 86 || submission.documentGaps.length)) {
    priorities.push({
      id: `submission-${submission.id}`,
      issue: submission.documentGaps[0] ?? 'Submission not fully market ready',
      workflow: 'Submission',
      impact: 'Submission quality may affect quote timing and market confidence.',
      financialImpact: compactCurrency(Math.round(financial.revenueAtRisk * 0.35)),
      owner: userName(client.assignedAccountManagerId),
      dueDate: renewal?.expiryDate ?? client.renewalDate,
      nextStep: submission.nextAction,
      route: `/submissions/${submission.id}`,
    });
  }
  bundle.claims.filter((claim) => claim.executiveReviewRequired || claim.severity === 'High').slice(0, 2).forEach((claim) => {
    priorities.push({
      id: `claim-${claim.id}`,
      issue: `${claim.claimType} may affect renewal pricing`,
      workflow: 'Claims',
      impact: 'Open claim may influence insurer appetite and renewal terms.',
      financialImpact: compactCurrency(claim.reserveAmount),
      owner: 'Claims Coordinator',
      dueDate: asOfDate,
      nextStep: claim.nextAction,
      route: `/claims/${claim.id}`,
    });
  });
  bundle.compliance.filter((item) => item.status === 'Overdue' || item.severity === 'High').slice(0, 2).forEach((item) => {
    priorities.push({
      id: `compliance-${item.id}`,
      issue: item.findingType,
      workflow: 'Compliance',
      impact: item.businessImpact,
      financialImpact: compactCurrency(Math.round(financial.revenueAtRisk * 0.18)),
      owner: userName(item.assignedUserId),
      dueDate: item.dueDate,
      nextStep: item.correctiveAction,
      route: `/compliance/${item.id}`,
    });
  });
  if (placement?.decisionRequired) {
    priorities.push({
      id: `placement-${placement.id}`,
      issue: 'Placement decision awaiting client approval',
      workflow: 'Market Placement',
      impact: 'Decision timing may affect binding readiness.',
      financialImpact: compactCurrency(placement.estimatedSavings),
      owner: userName(client.assignedPlacementLeadId),
      dueDate: renewal?.expiryDate ?? client.renewalDate,
      nextStep: `Review recommended insurer: ${placement.recommendedInsurer}`,
      route: `/market-placement/${placement.id}`,
    });
  }
  bundle.documents.filter((document) => document.status !== 'Approved' || daysUntil(document.expiryDate) <= 30).slice(0, 2).forEach((document) => {
    priorities.push({
      id: `document-${document.id}`,
      issue: `${document.documentType} ${document.status.toLowerCase()}`,
      workflow: 'Documents',
      impact: document.businessImpact,
      financialImpact: compactCurrency(Math.round(financial.revenueAtRisk * 0.12)),
      owner: 'Document Specialist',
      dueDate: document.expiryDate,
      nextStep: document.status === 'Missing' ? 'Request document from client' : 'Review and approve evidence',
      route: `/documents/${document.id}`,
    });
  });
  return priorities.slice(0, 8);
}

function getClientAdvisorySummary(client, bundle, financial, ariImpact, riskRating) {
  const primaryConcern = bundle.documents.find((document) => document.status !== 'Approved')?.documentType
    ?? bundle.claims.find((claim) => claim.severity === 'High')?.claimType
    ?? bundle.compliance.find((item) => item.status !== 'Closed')?.findingType
    ?? 'Relationship monitoring';
  const renewal = bundle.renewals[0];
  return {
    overallPosition: client.relationshipStatus === 'Needs Attention' ? 'Needs Attention' : 'Relationship Healthy',
    renewalPosition: renewal ? getReadinessLabel(renewal.readinessScore) : 'Not scheduled',
    primaryConcern,
    financialExposure: compactCurrency(financial.revenueAtRisk),
    recommendedPriority: primaryConcern === 'Relationship monitoring'
      ? 'Maintain service cadence and prepare renewal strategy.'
      : `Resolve ${primaryConcern.toLowerCase()} and hold a renewal strategy review.`,
    ariExposure: ariImpact.level,
    riskRating,
  };
}

function getClientTimeline(client, bundle) {
  const taskEvents = bundle.tasks.slice(0, 6).map((task, index) => ({
    id: `timeline-${task.id}`,
    clientId: client.id,
    userId: task.assignedUserId,
    timestamp: `2026-07-${String(9 - (index % 5)).padStart(2, '0')}T10:${index}5:00Z`,
    activityType: task.category,
    summary: task.title,
    relatedModule: task.relatedModule,
    importanceLevel: task.priority === 'Critical' ? 'High' : task.priority,
    route: task.relatedModule === 'Renewals' ? '/renewals' : task.relatedModule === 'Claims' ? '/claims' : '/account-manager',
  }));
  const documentEvents = bundle.documents.slice(0, 4).map((document, index) => ({
    id: `timeline-${document.id}`,
    clientId: client.id,
    userId: 'USR-009',
    timestamp: `2026-07-${String(8 - index).padStart(2, '0')}T12:${index}0:00Z`,
    activityType: 'Document Update',
    summary: `${document.documentType} is ${document.status.toLowerCase()}`,
    relatedModule: 'Documents',
    importanceLevel: document.status === 'Missing' ? 'High' : 'Medium',
    route: `/documents/${document.id}`,
  }));
  return [...bundle.activities, ...taskEvents, ...documentEvents]
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

function getClient360(clientId) {
  const client = clientById.get(clientId) ?? simulationData.clients[0];
  const bundle = {
    activities: getClientActivities(client.id),
    claims: getClientClaims(client.id),
    compliance: getClientCompliance(client.id),
    documents: getClientDocuments(client.id),
    negotiations: simulationData.negotiations.filter((negotiation) => negotiation.clientId === client.id),
    policies: getClientPolicies(client.id),
    renewals: getClientRenewals(client.id),
    submissions: simulationData.submissions.filter((submission) => submission.clientId === client.id),
    tasks: getClientTasks(client.id),
  };
  const aircraft = getClientAircraft(client, bundle.policies, bundle.claims);
  const pilots = getClientPilots(client, aircraft, bundle.documents);
  const contacts = getClientContacts(client);
  const financial = getClientFinancialSummary(client, bundle);
  const ariImpact = getAriClientExposure(client, ariView);
  const riskRating = getRiskRating(client, bundle);
  const advisory = getClientAdvisorySummary(client, bundle, financial, ariImpact, riskRating);
  return {
    client,
    ...bundle,
    accountManager: userById.get(client.assignedAccountManagerId),
    aircraft,
    pilots,
    contacts,
    financial,
    ariImpact,
    riskRating,
    advisory,
    priorities: getClientPriorityItems(client, bundle, financial),
    timeline: getClientTimeline(client, bundle),
  };
}

function getPortfolioRows() {
  return simulationData.clients.map((client) => {
    const record = getClient360(client.id);
    return {
      ...record,
      currentRenewal: record.renewals[0],
      currentSubmission: record.submissions[0],
      openClaims: record.claims.filter((claim) => claim.status !== 'Closed').length,
      complianceStatus: record.compliance.some((item) => item.status === 'Overdue') ? 'Overdue' : record.compliance.some((item) => item.status === 'Open') ? 'Open' : 'Clear',
    };
  });
}

function applyPortfolioFilters(rows, filters) {
  const search = filters.search.trim().toLowerCase();
  return rows.filter((row) => {
    const client = row.client;
    if (filters.savedView === 'mine' && client.assignedAccountManagerId !== 'USR-002') return false;
    if (filters.savedView === 'highValue' && client.annualPremium < 10000000) return false;
    if (filters.savedView === 'renewalsDue' && (!row.currentRenewal || row.currentRenewal.daysToExpiry > 45)) return false;
    if (filters.savedView === 'attention' && !['High', 'Critical'].includes(client.priorityLevel) && row.riskRating !== 'High') return false;
    if (filters.savedView === 'claims' && row.openClaims === 0) return false;
    if (filters.savedView === 'compliance' && row.complianceStatus === 'Clear') return false;
    if (filters.savedView === 'incomplete' && (!row.currentSubmission || row.currentSubmission.completionPercent >= 85)) return false;
    if (filters.savedView === 'atRisk' && client.retentionRisk !== 'High') return false;
    if (filters.accountManager !== 'all' && client.assignedAccountManagerId !== filters.accountManager) return false;
    if (filters.clientType !== 'all' && client.clientType !== filters.clientType) return false;
    if (filters.relationshipHealth !== 'all' && client.relationshipStatus !== filters.relationshipHealth) return false;
    if (filters.renewalWindow === '30' && daysUntil(client.renewalDate) > 30) return false;
    if (filters.renewalWindow === '60' && daysUntil(client.renewalDate) > 60) return false;
    if (filters.riskLevel !== 'all' && row.riskRating !== filters.riskLevel) return false;
    if (filters.claims === 'open' && row.openClaims === 0) return false;
    if (filters.documents === 'incomplete' && client.documentCompleteness >= 85) return false;
    if (filters.compliance !== 'all' && row.complianceStatus !== filters.compliance) return false;
    if (filters.premium === 'high' && client.annualPremium < 10000000) return false;
    if (filters.premium === 'mid' && (client.annualPremium < 3000000 || client.annualPremium >= 10000000)) return false;
    if (filters.revenue === 'high' && client.estimatedRevenue < 1000000) return false;
    if (filters.revenue === 'mid' && (client.estimatedRevenue < 300000 || client.estimatedRevenue >= 1000000)) return false;
    if (search) {
      const searchable = [
        client.name,
        client.clientType,
        client.location,
        row.aircraft.map((aircraft) => aircraft.tailNumber).join(' '),
        row.contacts.map((contact) => contact.name).join(' '),
        row.policies.map((policy) => policy.id).join(' '),
        row.claims.map((claim) => claim.id).join(' '),
      ].join(' ').toLowerCase();
      if (!searchable.includes(search)) return false;
    }
    return true;
  });
}

function toneForRisk(risk) {
  if (risk === 'High') return 'red';
  if (risk === 'Elevated') return 'amber';
  if (risk === 'Moderate') return 'blue';
  return 'green';
}

function ClientPortfolioPage() {
  const [filters, setFilters] = useState({
    accountManager: 'all',
    claims: 'all',
    clientType: 'all',
    compliance: 'all',
    documents: 'all',
    premium: 'all',
    relationshipHealth: 'all',
    renewalWindow: 'all',
    revenue: 'all',
    riskLevel: 'all',
    savedView: 'all',
    search: '',
  });
  const rows = useMemo(getPortfolioRows, []);
  const filteredRows = useMemo(() => applyPortfolioFilters(rows, filters), [rows, filters]);
  const accountManagers = simulationData.teamMembers.filter((member) => member.role === 'Account Manager');
  const clientTypes = Array.from(new Set(simulationData.clients.map((client) => client.clientType))).sort();
  const relationshipStatuses = Array.from(new Set(simulationData.clients.map((client) => client.relationshipStatus))).sort();

  function update(key, value) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  return (
    <div className="client360-page page-transition">
      <section className="client360-portfolio-hero">
        <div>
          <span>Client Portfolio</span>
          <h1>Client 360</h1>
          <p>Find any client, understand the relationship context, and open the authoritative connected view.</p>
        </div>
        <RevenueImpactLabel value={compactCurrency(getSum(simulationData.clients, 'estimatedRevenue'))} label="Portfolio revenue" />
      </section>

      <section className="client360-filter-card">
        <label><span>Saved View</span><select value={filters.savedView} onChange={(event) => update('savedView', event.target.value)}>{savedViews.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label><span>Account Manager</span><select value={filters.accountManager} onChange={(event) => update('accountManager', event.target.value)}><option value="all">All Managers</option>{accountManagers.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}</select></label>
        <label><span>Client Type</span><select value={filters.clientType} onChange={(event) => update('clientType', event.target.value)}><option value="all">All Types</option>{clientTypes.map((type) => <option key={type} value={type}>{type}</option>)}</select></label>
        <label><span>Relationship</span><select value={filters.relationshipHealth} onChange={(event) => update('relationshipHealth', event.target.value)}><option value="all">Any Status</option>{relationshipStatuses.map((status) => <option key={status} value={status}>{status}</option>)}</select></label>
        <label><span>Renewal Window</span><select value={filters.renewalWindow} onChange={(event) => update('renewalWindow', event.target.value)}><option value="all">Any Date</option><option value="30">Within 30 Days</option><option value="60">Within 60 Days</option></select></label>
        <label><span>Risk Level</span><select value={filters.riskLevel} onChange={(event) => update('riskLevel', event.target.value)}><option value="all">All Risk</option>{['High', 'Elevated', 'Moderate', 'Guarded'].map((risk) => <option key={risk} value={risk}>{risk}</option>)}</select></label>
        <label><span>Open Claims</span><select value={filters.claims} onChange={(event) => update('claims', event.target.value)}><option value="all">Any</option><option value="open">Has Open Claims</option></select></label>
        <label><span>Documents</span><select value={filters.documents} onChange={(event) => update('documents', event.target.value)}><option value="all">Any</option><option value="incomplete">Incomplete</option></select></label>
        <label><span>Compliance</span><select value={filters.compliance} onChange={(event) => update('compliance', event.target.value)}><option value="all">Any</option><option value="Overdue">Overdue</option><option value="Open">Open</option><option value="Clear">Clear</option></select></label>
        <label><span>Premium</span><select value={filters.premium} onChange={(event) => update('premium', event.target.value)}><option value="all">Any Premium</option><option value="high">High Value</option><option value="mid">Mid-Market</option></select></label>
        <label><span>Revenue</span><select value={filters.revenue} onChange={(event) => update('revenue', event.target.value)}><option value="all">Any Revenue</option><option value="high">High Revenue</option><option value="mid">Mid Revenue</option></select></label>
        <label className="client360-filter-card__search"><span>Search</span><div><Search size={16} /><input value={filters.search} onChange={(event) => update('search', event.target.value)} placeholder="Client, tail, contact, policy, claim..." /></div></label>
      </section>

      <section className="client360-portfolio-table">
        <div className="client360-portfolio-table__head">
          <span>Client</span><span>Account Manager</span><span>Premium</span><span>Revenue</span><span>Health</span><span>Renewal</span><span>Risk</span><span>Claims</span><span>Documents</span><span>Priority</span>
        </div>
        {filteredRows.map((row) => (
          <Link className="client360-row" key={row.client.id} to={`/clients/${row.client.id}`}>
            <div><strong>{row.client.name}</strong><small>{row.client.clientType} / {row.client.location}</small></div>
            <span>{userName(row.client.assignedAccountManagerId)}</span>
            <span>{compactCurrency(row.client.annualPremium)}</span>
            <span>{compactCurrency(row.client.estimatedRevenue)}</span>
            <ClientHealthBadge score={row.client.clientHealthScore} />
            <span>{shortDate(row.client.renewalDate)}</span>
            <em className={`client360-risk client360-risk--${toneForRisk(row.riskRating)}`}>{row.riskRating}</em>
            <span>{row.openClaims}</span>
            <span>{row.client.documentCompleteness}%</span>
            <strong>{row.client.priorityLevel}</strong>
          </Link>
        ))}
      </section>
    </div>
  );
}

function MetricLink({ label, value, helper, href, icon: Icon }) {
  return (
    <a className="client360-summary-metric" href={href}>
      {Icon ? <Icon size={18} /> : null}
      <span>{label}</span>
      <strong>{value}</strong>
      {helper ? <small>{helper}</small> : null}
    </a>
  );
}

function ProgressLine({ label, value }) {
  return (
    <div className="client360-progress-line">
      <div><span>{label}</span><strong>{value}%</strong></div>
      <i><b style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></i>
    </div>
  );
}

function ClientHeader({ record, onAction, onBrief }) {
  const { client } = record;
  const latestActivity = record.timeline[0];
  return (
    <section className="client360-header">
      <div className="client360-breadcrumbs">
        <Link to="/clients">Clients</Link>
        <ArrowRight size={14} />
        <span>{client.name}</span>
      </div>
      <div className="client360-header__main">
        <div>
          <span>{client.clientType} / {client.location}</span>
          <h1>{client.name}</h1>
          <p>{client.shortBusinessSummary}</p>
        </div>
        <RevenueImpactLabel value={compactCurrency(client.estimatedRevenue)} label="Estimated annual revenue" />
      </div>
      <div className="client360-header__meta">
        <div><span>Relationship</span><strong>{client.relationshipStatus}</strong></div>
        <div><span>Client Health</span><strong>{client.clientHealthScore}</strong></div>
        <div><span>Risk Rating</span><strong>{record.riskRating}</strong></div>
        <div><span>Annual Premium</span><strong>{compactCurrency(client.annualPremium)}</strong></div>
        <div><span>Next Renewal</span><strong>{shortDate(client.renewalDate)}</strong></div>
        <div><span>Account Manager</span><strong>{userName(client.assignedAccountManagerId)}</strong></div>
        <div><span>Placement Lead</span><strong>{userName(client.assignedPlacementLeadId)}</strong></div>
        <div><span>Primary Contact</span><strong>{record.contacts[0]?.name ?? 'Not available'}</strong></div>
        <div><span>Last Interaction</span><strong>{latestActivity ? shortDateFormatter.format(new Date(latestActivity.timestamp)) : 'No activity'}</strong></div>
      </div>
      <div className="client360-actions">
        {['Add Note', 'Create Task', 'Request Document'].map((action) => <button key={action} type="button" onClick={() => onAction(action)}>{action}</button>)}
        {record.renewals[0] ? <Link to={`/renewals/${record.renewals[0].id}`}>Open Current Renewal</Link> : null}
        <button type="button" onClick={onBrief}>Prepare Client Brief</button>
        <a href="#activity">View Activity</a>
        <button type="button" onClick={() => onAction('More Actions')}>More Actions</button>
      </div>
    </section>
  );
}

function ClientSummaryStrip({ record }) {
  const openExposure = getClaimsExposure(record.claims).reserveAmount;
  const renewal = record.renewals[0];
  return (
    <section className="client360-summary-strip">
      <MetricLink icon={BadgeDollarSign} label="Annual Premium" value={compactCurrency(record.client.annualPremium)} helper="Managed premium" href="#financial" />
      <MetricLink icon={BriefcaseBusiness} label="Estimated Revenue" value={compactCurrency(record.client.estimatedRevenue)} helper="Annual revenue" href="#financial" />
      <MetricLink icon={CalendarClock} label="Renewal Status" value={renewal?.currentStage ?? 'Not scheduled'} helper={renewal ? `${renewal.daysToExpiry} days remaining` : 'No active renewal'} href="#coverage" />
      <MetricLink icon={AlertTriangle} label="Open Claims Exposure" value={compactCurrency(openExposure)} helper={`${record.claims.length} claim records`} href="#claims" />
      <MetricLink icon={ShieldCheck} label="Compliance Health" value={`${record.client.complianceScore}%`} helper={record.riskRating} href="#risk" />
      <MetricLink icon={FileText} label="Document Completeness" value={`${record.client.documentCompleteness}%`} helper={`${getDocumentGapCount(record.documents)} gaps`} href="#documents" />
      <MetricLink icon={Gauge} label="Client Health" value={record.client.clientHealthScore} helper={record.client.retentionRisk} href="#relationship" />
    </section>
  );
}

function AdvisorySummary({ record }) {
  const summary = record.advisory;
  return (
    <section className="client360-advisory-card">
      <h2>Client Advisory Summary</h2>
      <dl>
        <div><dt>Overall Position</dt><dd>{summary.overallPosition}</dd></div>
        <div><dt>Renewal Position</dt><dd>{summary.renewalPosition}</dd></div>
        <div><dt>Primary Concern</dt><dd>{summary.primaryConcern}</dd></div>
        <div><dt>Financial Exposure</dt><dd>{summary.financialExposure}</dd></div>
        <div><dt>Recommended Priority</dt><dd>{summary.recommendedPriority}</dd></div>
      </dl>
    </section>
  );
}

function ClientPriorities({ priorities }) {
  return (
    <section className="client360-card" id="priorities">
      <SectionTitle title="Client Priorities" text="Only items requiring action are shown here." />
      <div className="client360-priority-list">
        {priorities.length ? priorities.map((item) => (
          <article key={item.id}>
            <div>
              <strong>{item.issue}</strong>
              <span>{item.workflow} / due {formatDate(item.dueDate)}</span>
            </div>
            <p>{item.impact}</p>
            <dl>
              <div><dt>Financial Impact</dt><dd>{item.financialImpact}</dd></div>
              <div><dt>Responsible</dt><dd>{item.owner}</dd></div>
              <div><dt>Next Step</dt><dd>{item.nextStep}</dd></div>
            </dl>
            <Link to={item.route}>Open workflow <ArrowRight size={14} /></Link>
          </article>
        )) : <EmptyMessage text="No immediate priority items are recorded for this client." />}
      </div>
    </section>
  );
}

function SectionTitle({ title, text, action }) {
  return (
    <header className="client360-section-title">
      <div>
        <h2>{title}</h2>
        {text ? <p>{text}</p> : null}
      </div>
      {action}
    </header>
  );
}

function EmptyMessage({ text }) {
  return <p className="client360-empty">{text}</p>;
}

function RelationshipSection({ record }) {
  const years = Math.max(1, Number(record.client.id.slice(-2)) % 9 + 2);
  return (
    <section className="client360-card" id="relationship">
      <SectionTitle title="Relationship Overview" text="Commercial relationship context focused on service quality and renewal protection." />
      <p className="client360-narrative">{record.client.name} has been a Symphony client for {years} years and represents a {record.client.retentionRisk.toLowerCase()} retention risk relationship. {record.advisory.primaryConcern !== 'Relationship monitoring' ? `The current priority is ${record.advisory.primaryConcern.toLowerCase()}.` : 'The account is currently serviceable with a normal monitoring cadence.'}</p>
      <div className="client360-two-column">
        <div className="client360-detail-grid">
          <Detail label="Relationship Start" value={`${2026 - years}`} />
          <Detail label="Years as Client" value={years} />
          <Detail label="Relationship Status" value={record.client.relationshipStatus} />
          <Detail label="Retention Risk" value={record.client.retentionRisk} />
          <Detail label="Satisfaction Indicator" value={record.client.clientHealthScore >= 80 ? 'Positive' : 'Watch'} />
          <Detail label="Communication Preference" value="Email with scheduled strategy calls" />
          <Detail label="Last Contact" value={record.timeline[0] ? shortDateFormatter.format(new Date(record.timeline[0].timestamp)) : 'No activity'} />
          <Detail label="Next Follow-Up" value={shortDate(record.client.renewalDate)} />
        </div>
        <div className="client360-contact-grid">
          {record.contacts.map((contact) => (
            <article key={contact.id}>
              <strong>{contact.name}</strong>
              <span>{contact.title}</span>
              <p>{contact.role} / {contact.preference}</p>
              <small>{contact.email}</small>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Detail({ label, value }) {
  return <div><dt>{label}</dt><dd>{value}</dd></div>;
}

function OperationsSection({ record }) {
  const [aircraftFilter, setAircraftFilter] = useState('all');
  const [selectedAircraft, setSelectedAircraft] = useState(record.aircraft[0]?.id ?? '');
  const selected = record.aircraft.find((aircraft) => aircraft.id === selectedAircraft);
  const filteredAircraft = record.aircraft.filter((aircraft) => {
    if (aircraftFilter === 'active') return aircraft.status === 'Active';
    if (aircraftFilter === 'grounded') return aircraft.status !== 'Active';
    if (aircraftFilter === 'leased') return aircraft.ownershipType === 'Leased';
    if (aircraftFilter === 'highValue') return aircraft.insuredValue > record.client.annualPremium * 0.5;
    if (aircraftFilter === 'claim') return aircraft.recentClaim;
    return true;
  });
  return (
    <section className="client360-card" id="operations">
      <SectionTitle title="Business Profile, Fleet & Pilots" text="Operational context used to understand insurability and underwriting questions." />
      <div className="client360-detail-grid client360-detail-grid--wide">
        <Detail label="Client Type" value={record.client.clientType} />
        <Detail label="Legal Entities" value={`${record.client.name} Holdings`} />
        <Detail label="Operating Locations" value={record.client.location} />
        <Detail label="Regulatory Category" value={record.client.industrySegment} />
        <Detail label="Geographic Exposure" value={record.client.clientType.includes('Airline') || record.client.clientType.includes('Charter') ? 'Domestic and selective international' : 'Primarily domestic'} />
        <Detail label="Fleet Size" value={record.aircraft.length} />
        <Detail label="Pilots" value={record.pilots.length} />
        <Detail label="Safety Program" value={record.client.complianceScore >= 90 ? 'Mature' : 'Needs review'} />
      </div>
      <div className="client360-filter-tabs">
        {['all', 'active', 'grounded', 'leased', 'highValue', 'claim'].map((filter) => (
          <button key={filter} className={aircraftFilter === filter ? 'client360-filter-tabs__active' : ''} type="button" onClick={() => setAircraftFilter(filter)}>{filter}</button>
        ))}
      </div>
      <div className="client360-record-table client360-record-table--aircraft">
        <div><span>Aircraft</span><span>Tail</span><span>Value</span><span>Usage</span><span>Status</span><span>Policy</span></div>
        {filteredAircraft.map((aircraft) => (
          <button key={aircraft.id} type="button" onClick={() => setSelectedAircraft(aircraft.id)}>
            <strong>{aircraft.year} {aircraft.model}</strong><span>{aircraft.tailNumber}</span><span>{compactCurrency(aircraft.insuredValue)}</span><span>{aircraft.usage}</span><span>{aircraft.status}</span><span>{aircraft.policyId ?? 'Unlinked'}</span>
          </button>
        ))}
      </div>
      {selected ? (
        <aside className="client360-drawer-card">
          <strong>{selected.tailNumber} Detail</strong>
          <p>{selected.model} based in {selected.baseAirport}. Pilot approval: {selected.pilotApproval}. Maintenance status: {selected.maintenanceStatus}.</p>
          <div className="client360-chip-list">
            <span>{selected.ownershipType}</span>
            <span>{selected.recentClaim ? 'Claim involved' : 'No recent claim'}</span>
            <span>{selected.serialNumber}</span>
          </div>
        </aside>
      ) : null}
      <div className="client360-record-table client360-record-table--pilots">
        <div><span>Pilot</span><span>Role</span><span>Total Hours</span><span>Model Hours</span><span>Training</span><span>Approval</span></div>
        {record.pilots.map((pilot) => (
          <article key={pilot.id}>
            <strong>{pilot.name}</strong><span>{pilot.role}</span><span>{pilot.totalHours}</span><span>{pilot.modelHours}</span><span>{pilot.trainingStatus}</span><span>{pilot.approvalStatus}</span>
          </article>
        ))}
      </div>
    </section>
  );
}

function CoverageSection({ record }) {
  const renewal = record.renewals[0];
  const submission = record.submissions[0];
  const placement = record.negotiations[0];
  return (
    <section className="client360-card" id="coverage">
      <SectionTitle title="Policies, Renewals, Submission & Market Placement" text="Summary only. Dedicated workspaces remain the operational source for workflow execution." />
      <p className="client360-narrative">Core coverage is represented by {record.policies.length} active policy records. {record.financial.opportunity}</p>
      <div className="client360-record-table">
        <div><span>Policy Type</span><span>Carrier</span><span>Effective</span><span>Expiry</span><span>Premium</span><span>Limit</span><span>Status</span></div>
        {record.policies.map((policy) => (
          <article key={policy.id}>
            <strong>{policy.policyType}</strong><span>{policy.insurer}</span><span>{shortDate(policy.effectiveDate)}</span><span>{shortDate(policy.expiryDate)}</span><span>{compactCurrency(policy.premium)}</span><span>{compactCurrency(policy.limit)}</span><span>{policy.status}</span>
          </article>
        ))}
      </div>
      <div className="client360-linked-grid">
        <SummaryCard title="Current Renewal" route={renewal ? `/renewals/${renewal.id}` : '/renewals'} action="Open Renewal">
          {renewal ? <><RenewalStatusBadge status={renewal.currentStage} /><p>{renewal.daysToExpiry} days remaining / {renewal.readinessScore}% readiness / {compactCurrency(renewal.revenueAtRisk)} revenue at risk</p></> : <EmptyMessage text="No active renewal is currently scheduled." />}
        </SummaryCard>
        <SummaryCard title="Submission" route={submission ? `/submissions/${submission.id}` : '/submissions'} action="Open Submission">
          {submission ? <p>{submission.completionPercent}% complete / {submission.status}. Concerns: {submission.underwriterConcerns.slice(0, 2).join('; ')}</p> : <EmptyMessage text="No submission record is currently available." />}
        </SummaryCard>
        <SummaryCard title="Market Placement" route={placement ? `/market-placement/${placement.id}` : '/market-placement'} action="Open Placement">
          {placement ? <p>{placement.quotesReceived}/{placement.insurersApproached.length} quotes received. Best quote {compactCurrency(placement.bestQuote)}. Recommended: {placement.recommendedInsurer}.</p> : <EmptyMessage text="No active placement record is available." />}
        </SummaryCard>
      </div>
    </section>
  );
}

function SummaryCard({ title, route, action, children }) {
  return (
    <article className="client360-summary-card">
      <h3>{title}</h3>
      <div>{children}</div>
      <Link to={route}>{action}<ArrowRight size={14} /></Link>
    </article>
  );
}

function ClaimsSection({ record }) {
  const exposure = getClaimsExposure(record.claims);
  return (
    <section className="client360-card" id="claims">
      <SectionTitle title="Claims" text="Open and historical claim context that may affect renewal pricing, retention and market appetite." action={<Link className="client360-section-link" to="/claims">Open Claims Operations</Link>} />
      <div className="client360-kpi-row">
        <BusinessKpiCard label="Claim Records" value={record.claims.length} helper="Open and recent" icon={ClipboardList} />
        <BusinessKpiCard label="Open Exposure" value={compactCurrency(exposure.reserveAmount)} helper="Reserve amount" tone="red" icon={AlertTriangle} />
        <BusinessKpiCard label="Executive Review" value={exposure.requiringReview} helper="May affect renewal" tone="amber" icon={ShieldCheck} />
      </div>
      <div className="client360-record-table">
        <div><span>Claim</span><span>Type</span><span>Severity</span><span>Status</span><span>Incurred</span><span>Days Open</span><span>Next Step</span></div>
        {record.claims.length ? record.claims.map((claim) => (
          <article key={claim.id}>
            <Link to={`/claims/${claim.id}`}>{claim.id}</Link><span>{claim.claimType}</span><span>{claim.severity}</span><span>{claim.status}</span><span>{compactCurrency(claim.incurredAmount)}</span><span>{claim.daysOpen}</span><span>{claim.nextAction}</span>
          </article>
        )) : <EmptyMessage text="No open claims are recorded for this client." />}
      </div>
    </section>
  );
}

function RiskSection({ record }) {
  const topRisks = [
    ...record.compliance.filter((item) => item.status !== 'Closed').map((item) => ({ id: item.id, label: item.findingType, severity: item.severity, action: item.correctiveAction, impact: item.businessImpact })),
    ...record.documents.filter((item) => item.status !== 'Approved').map((item) => ({ id: item.id, label: item.documentType, severity: item.status === 'Missing' ? 'High' : 'Medium', action: 'Request or review document evidence.', impact: item.businessImpact })),
  ].slice(0, 3);
  const factors = getAriTopFactors(ariView, 3);
  return (
    <section className="client360-card" id="risk">
      <SectionTitle title="Compliance, Risk & ARI Impact" text="Client-specific operational risk and current external aviation risk conditions." action={<Link className="client360-section-link" to="/compliance">Open Risk Advisory</Link>} />
      <div className="client360-risk-grid">
        <ProgressLine label="Compliance Health" value={record.client.complianceScore} />
        <ProgressLine label="Document Completeness" value={record.client.documentCompleteness} />
        <ProgressLine label="Client Health" value={record.client.clientHealthScore} />
      </div>
      <div className="client360-linked-grid">
        <article className="client360-summary-card">
          <h3>Top Risks</h3>
          {topRisks.length ? topRisks.map((risk) => (
            <div key={risk.id} className="client360-risk-item">
              <ComplianceSeverityBadge severity={risk.severity} />
              <strong>{risk.label}</strong>
              <p>{risk.impact}</p>
              <small>{risk.action}</small>
            </div>
          )) : <EmptyMessage text="No open findings are recorded for this client." />}
        </article>
        <article className="client360-summary-card">
          <h3>Aviation Risk Index Impact</h3>
          <p>Current ARI category: {ariView.category}. Client exposure level: {record.ariImpact.level}.</p>
          <div className="client360-chip-list">
            {record.ariImpact.drivers.map((driver) => <span key={driver}>{driver}</span>)}
            {factors.map((factor) => <span key={factor.id}>{factor.label}</span>)}
          </div>
          <p>{record.ariImpact.note}</p>
          <strong>{ariView.recommendedActions[0]}</strong>
        </article>
      </div>
    </section>
  );
}

function DocumentsTasksSection({ record, taskStatus, setTaskStatus, documentStatus, setDocumentStatus, onAction }) {
  return (
    <section className="client360-card" id="documents">
      <SectionTitle title="Documents, Tasks & Collaboration" text="Client-specific documents and local task actions for the current session." action={<Link className="client360-section-link" to={`/documents?clientId=${record.client.id}`}>View Documents</Link>} />
      <div className="client360-document-summary">
        <BusinessKpiCard label="Total Documents" value={record.documents.length} helper="Client records" icon={FileText} />
        <BusinessKpiCard label="Complete" value={record.documents.filter((item) => (documentStatus[item.id] ?? item.status) === 'Approved').length} helper="Approved" tone="green" icon={CheckCircle2} />
        <BusinessKpiCard label="Missing" value={record.documents.filter((item) => (documentStatus[item.id] ?? item.status) === 'Missing').length} helper="Needs client response" tone="red" icon={AlertTriangle} />
        <BusinessKpiCard label="Pending Review" value={record.documents.filter((item) => (documentStatus[item.id] ?? item.status).includes('Review')).length} helper="Internal review" tone="amber" icon={CalendarClock} />
      </div>
      <div className="client360-record-table">
        <div><span>Document</span><span>Status</span><span>Expires</span><span>Required For</span><span>Business Impact</span><span>Action</span></div>
        {record.documents.map((document) => (
          <article key={document.id}>
            <strong>{document.documentType}</strong><DocumentStatusBadge status={documentStatus[document.id] ?? document.status} /><span>{shortDate(document.expiryDate)}</span><span>{document.requiredFor}</span><span>{document.businessImpact}</span>
            <button type="button" onClick={() => setDocumentStatus((current) => ({ ...current, [document.id]: 'Approved' }))}>Mark Reviewed</button>
          </article>
        ))}
      </div>
      <div className="client360-record-table">
        <div><span>Task</span><span>Responsible</span><span>Priority</span><span>Due</span><span>Status</span><span>Workflow</span><span>Action</span></div>
        {record.tasks.map((task) => (
          <article key={task.id}>
            <strong>{task.title}</strong><span>{userName(task.assignedUserId)}</span><TaskPriorityBadge priority={task.priority} /><span>{shortDate(task.dueDate)}</span><span>{taskStatus[task.id] ?? task.status}</span><span>{task.relatedModule}</span>
            <button type="button" onClick={() => setTaskStatus((current) => ({ ...current, [task.id]: 'Completed' }))}>Complete</button>
          </article>
        ))}
      </div>
      <div className="client360-actions client360-actions--inline">
        {['Create Follow-Up', 'Assign', 'Mark Waiting', 'Change Priority'].map((action) => <button key={action} type="button" onClick={() => onAction(action)}>{action}</button>)}
      </div>
    </section>
  );
}

function FinancialSection({ record }) {
  return (
    <section className="client360-card" id="financial">
      <SectionTitle title="Financial Relationship" text="Executive view of the commercial relationship and revenue protected by active servicing." />
      <div className="client360-financial-grid">
        <Detail label="Total Managed Premium" value={compactCurrency(record.financial.policyPremium)} />
        <Detail label="Estimated Annual Revenue" value={compactCurrency(record.financial.currentYearRevenue)} />
        <Detail label="Current-Year Revenue" value={compactCurrency(record.financial.currentYearRevenue)} />
        <Detail label="Renewal Revenue Pipeline" value={compactCurrency(record.financial.renewalRevenue)} />
        <Detail label="Revenue At Risk" value={compactCurrency(record.financial.revenueAtRisk)} />
        <Detail label="Commission" value={compactCurrency(record.financial.commission)} />
        <Detail label="Outstanding Opportunity" value={record.financial.opportunity} />
        <Detail label="Year-over-Year Trend" value={record.financial.trend} />
      </div>
    </section>
  );
}

function ActivitySection({ record, timelineFilter, setTimelineFilter }) {
  const types = ['all', ...Array.from(new Set(record.timeline.map((item) => item.relatedModule)))];
  const timeline = timelineFilter === 'all' ? record.timeline : record.timeline.filter((item) => item.relatedModule === timelineFilter);
  return (
    <section className="client360-card" id="activity">
      <SectionTitle title="Complete Client Timeline" text="Unified activity across communications, documents, tasks, renewal, claims, compliance and placement." />
      <div className="client360-filter-tabs">
        {types.map((type) => <button key={type} className={timelineFilter === type ? 'client360-filter-tabs__active' : ''} type="button" onClick={() => setTimelineFilter(type)}>{type}</button>)}
      </div>
      <BusinessActivityTimeline activities={timeline.slice(0, 14)} getClientName={(clientId) => clientById.get(clientId)?.name ?? record.client.name} formatTime={(timestamp) => timeFormatter.format(new Date(timestamp))} />
    </section>
  );
}

function RelatedWorkspaceLinks({ record }) {
  const renewal = record.renewals[0];
  const submission = record.submissions[0];
  const placement = record.negotiations[0];
  const claim = record.claims[0];
  return (
    <section className="client360-card">
      <SectionTitle title="Related Workspaces" text="Move from Client 360 into the operational workspace requiring action." />
      <div className="client360-related-links">
        <Link to="/">Executive Overview</Link>
        <Link to="/account-manager">Account Manager</Link>
        <Link to={renewal ? `/renewals/${renewal.id}` : '/renewals'}>Renewal Workspace</Link>
        <Link to={submission ? `/submissions/${submission.id}` : '/submissions'}>Submission Workspace</Link>
        <Link to={placement ? `/market-placement/${placement.id}` : '/market-placement'}>Market Placement</Link>
        <Link to={claim ? `/claims/${claim.id}` : '/claims'}>Claims Operations</Link>
        <Link to="/compliance">Compliance & Risk Advisory</Link>
        <Link to={`/documents?clientId=${record.client.id}`}>Documents</Link>
        <Link to="/reports">Reports</Link>
        <Link to="/ibar">iBar Results</Link>
      </div>
    </section>
  );
}

function ClientBriefPanel({ record, onClose }) {
  return (
    <div className="client360-brief-backdrop">
      <section className="client360-brief-panel">
        <header>
          <div>
            <span>Client Meeting Brief</span>
            <h2>{record.client.name}</h2>
          </div>
          <div>
            <button type="button" onClick={() => window.print()}><Printer size={16} /> Print</button>
            <button type="button" onClick={onClose}>Close</button>
          </div>
        </header>
        <div className="client360-brief-grid">
          <BriefSection title="Meeting Objective" text={`Align on renewal readiness, open priorities and the actions needed to protect ${compactCurrency(record.financial.revenueAtRisk)} of revenue exposure.`} />
          <BriefSection title="Current Business Position" text={`${record.client.relationshipStatus} relationship with ${compactCurrency(record.client.annualPremium)} managed premium and ${compactCurrency(record.client.estimatedRevenue)} estimated annual revenue.`} />
          <BriefSection title="Key Issues" text={record.priorities.map((item) => item.issue).slice(0, 4).join('; ') || 'No immediate issues recorded.'} />
          <BriefSection title="Decisions Required" text={record.negotiations[0]?.decisionRequired ? `Review ${record.negotiations[0].recommendedInsurer} placement recommendation.` : 'No immediate placement decision recorded.'} />
          <BriefSection title="Recommended Discussion Points" text={`Discuss ${record.advisory.primaryConcern}, claims posture, ARI exposure (${record.ariImpact.level}), and missing documents.`} />
          <BriefSection title="Follow-Up Actions" text={record.priorities.map((item) => item.nextStep).slice(0, 4).join('; ') || record.advisory.recommendedPriority} />
        </div>
      </section>
    </div>
  );
}

function BriefSection({ title, text }) {
  return <article><h3>{title}</h3><p>{text}</p></article>;
}

export function ClientWorkspacePage() {
  const { clientId } = useParams();
  const [searchParams] = useSearchParams();
  const queryClientId = searchParams.get('clientId');
  const selectedClientId = clientId ?? queryClientId;
  const [activeTab, setActiveTab] = useState('overview');
  const [briefOpen, setBriefOpen] = useState(false);
  const [timelineFilter, setTimelineFilter] = useState('all');
  const [actionLog, setActionLog] = useState([]);
  const [taskStatus, setTaskStatus] = useState({});
  const [documentStatus, setDocumentStatus] = useState({});

  const record = useMemo(() => selectedClientId ? getClient360(selectedClientId) : null, [selectedClientId]);

  function handleAction(action) {
    if (!record) return;
    setActionLog((current) => [`${action} simulated for ${record.client.name}`, ...current].slice(0, 5));
  }

  if (!selectedClientId) {
    return <ClientPortfolioPage />;
  }

  if (!record?.client) {
    return (
      <section className="client360-page page-transition">
        <div className="client360-card">
          <Link to="/clients"><ArrowLeft size={16} /> Back to Clients</Link>
          <h1>Client not found</h1>
          <p>The requested client is not available in the current demonstration dataset.</p>
        </div>
      </section>
    );
  }

  return (
    <div className="client360-page page-transition">
      <ClientHeader record={record} onAction={handleAction} onBrief={() => setBriefOpen(true)} />
      <ClientSummaryStrip record={record} />

      <nav className="client360-tabs" aria-label="Client 360 sections">
        {tabs.map(([key, label]) => (
          <button key={key} className={activeTab === key ? 'client360-tabs__active' : ''} type="button" onClick={() => setActiveTab(key)}>
            {label}
          </button>
        ))}
      </nav>

      {activeTab === 'overview' ? (
        <>
          <AdvisorySummary record={record} />
          <ClientPriorities priorities={record.priorities} />
          <RelatedWorkspaceLinks record={record} />
        </>
      ) : null}
      {activeTab === 'relationship' ? <RelationshipSection record={record} /> : null}
      {activeTab === 'operations' ? <OperationsSection record={record} /> : null}
      {activeTab === 'coverage' ? <><CoverageSection record={record} /><FinancialSection record={record} /></> : null}
      {activeTab === 'claims' ? <ClaimsSection record={record} /> : null}
      {activeTab === 'risk' ? <RiskSection record={record} /> : null}
      {activeTab === 'documents' ? <DocumentsTasksSection record={record} taskStatus={taskStatus} setTaskStatus={setTaskStatus} documentStatus={documentStatus} setDocumentStatus={setDocumentStatus} onAction={handleAction} /> : null}
      {activeTab === 'activity' ? <ActivitySection record={record} timelineFilter={timelineFilter} setTimelineFilter={setTimelineFilter} /> : null}

      {actionLog.length ? (
        <section className="client360-action-log">
          {actionLog.map((entry) => <span key={entry}>{entry}</span>)}
        </section>
      ) : null}

      {briefOpen ? <ClientBriefPanel record={record} onClose={() => setBriefOpen(false)} /> : null}
    </div>
  );
}
