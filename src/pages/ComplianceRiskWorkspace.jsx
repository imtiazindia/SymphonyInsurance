import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ClipboardCheck,
  FileCheck2,
  FileClock,
  FileText,
  Gauge,
  ListChecks,
  MessageSquarePlus,
  Plane,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  UserRoundCog,
  Wrench,
} from 'lucide-react';
import {
  BusinessActivityTimeline,
  BusinessKpiCard,
  ComplianceSeverityBadge,
  DocumentStatusBadge,
  RevenueImpactLabel,
} from '../components/BusinessComponents.jsx';
import { simulationData } from '../data/demoData.js';
import { RoleAwareDashboardHeader } from '../components/RoleExperience.jsx';
import { useRoleExperience } from '../context/RoleContext.jsx';
import { getAriClientExposure, getAriTopFactors, getAriView } from '../utils/aviationRiskIndex.js';
import { getAverage, getClaimsExposure, getDocumentGapCount, getSum } from '../utils/businessCalculations.js';

const asOfDate = '2026-07-10';
const today = new Date(`${asOfDate}T00:00:00Z`);
const ariView = getAriView('domestic');
const ariFactors = getAriTopFactors(ariView, 4);

const compactCurrencyFormatter = new Intl.NumberFormat('en-US', {
  currency: 'USD',
  maximumFractionDigits: 1,
  notation: 'compact',
  style: 'currency',
});

const dateFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
const timeFormatter = new Intl.DateTimeFormat('en-US', {
  hour: 'numeric',
  minute: '2-digit',
  month: 'short',
  day: 'numeric',
});

const clientById = new Map(simulationData.clients.map((client) => [client.id, client]));
const userById = new Map(simulationData.teamMembers.map((user) => [user.id, user]));
const complianceAdvisors = simulationData.teamMembers.filter((member) => member.role === 'Compliance Coordinator' || member.role === 'Account Manager');

const savedViews = [
  ['all', 'All Clients'],
  ['highRisk', 'High Risk'],
  ['renewal30', 'Renewals Within 30 Days'],
  ['training', 'Training Issues'],
  ['maintenance', 'Maintenance'],
  ['documents', 'Document Expiry'],
  ['ari', 'ARI Impacted'],
];

const riskCategories = [
  'Pilot Training',
  'Aircraft Maintenance',
  'Safety Management System',
  'Operational Procedures',
  'Documentation',
  'Regulatory Compliance',
  'Emergency Response',
  'Security',
  'Cyber',
  'Environmental',
];

const pipelineStages = [
  'Finding Identified',
  'Assigned',
  'Client Notified',
  'Corrective Action In Progress',
  'Evidence Submitted',
  'Internal Review',
  'Verified',
  'Closed',
];

function compactCurrency(value) {
  return compactCurrencyFormatter.format(value || 0).replace('.0', '');
}

function formatDate(value) {
  return dateFormatter.format(new Date(`${value}T00:00:00Z`));
}

function formatTime(value) {
  return timeFormatter.format(new Date(value));
}

function daysUntil(value) {
  return Math.ceil((new Date(`${value}T00:00:00Z`) - today) / 86400000);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function userName(userId) {
  return userById.get(userId)?.name ?? 'Unassigned';
}

function getAdvisor(client, findings) {
  const assignedFinding = findings.find((finding) => finding.assignedUserId);
  return userById.get(assignedFinding?.assignedUserId) ?? userById.get(client.assignedAccountManagerId) ?? complianceAdvisors[0];
}

function getCategory(finding) {
  const text = `${finding.findingType} ${finding.correctiveAction} ${finding.documentType ?? ''}`.toLowerCase();
  if (text.includes('training') || text.includes('pilot') || text.includes('instructor')) return 'Pilot Training';
  if (text.includes('maintenance') || text.includes('aircraft schedule')) return 'Aircraft Maintenance';
  if (text.includes('quality') || text.includes('safety')) return 'Safety Management System';
  if (text.includes('operational')) return 'Operational Procedures';
  if (text.includes('document') || text.includes('loss') || text.includes('certificate') || text.includes('manual')) return 'Documentation';
  if (text.includes('facility') || text.includes('regulatory') || text.includes('certificate')) return 'Regulatory Compliance';
  if (text.includes('emergency')) return 'Emergency Response';
  if (text.includes('security')) return 'Security';
  if (text.includes('cyber')) return 'Cyber';
  if (text.includes('environment')) return 'Environmental';
  return 'Operational Procedures';
}

function severityScore(severity) {
  return { High: 18, Medium: 10, Low: 5 }[severity] ?? 7;
}

function ratingFromRiskScore(score) {
  if (score >= 74) return 'High';
  if (score >= 58) return 'Elevated';
  if (score >= 42) return 'Moderate';
  return 'Guarded';
}

function ratingTone(rating) {
  return {
    High: 'red',
    Elevated: 'amber',
    Moderate: 'blue',
    Guarded: 'green',
    Low: 'green',
  }[rating] ?? 'blue';
}

function getHighestSeverity(findings) {
  if (findings.some((finding) => finding.severity === 'High')) return 'High';
  if (findings.some((finding) => finding.severity === 'Medium')) return 'Medium';
  if (findings.length) return 'Low';
  return 'Low';
}

function buildDocumentFinding(document) {
  return {
    id: `DOC-FINDING-${document.id}`,
    sourceId: document.id,
    clientId: document.clientId,
    findingType: `${document.documentType} ${document.status}`,
    severity: document.status === 'Missing' ? 'High' : 'Medium',
    dueDate: document.expiryDate,
    status: document.status === 'Missing' ? 'Overdue' : 'Open',
    assignedUserId: 'USR-009',
    businessImpact: document.businessImpact,
    correctiveAction: document.status === 'Missing' ? 'Request missing evidence from client' : 'Review evidence and confirm acceptance',
    evidenceRequired: document.documentType,
    origin: 'Document Hub',
  };
}

function getBusinessImpact(finding, client, renewal) {
  if (finding.status === 'Overdue') {
    return `${finding.findingType} is overdue and may increase underwriter scrutiny for ${client.name}.`;
  }
  if (renewal?.daysToExpiry <= 45) {
    return `${finding.findingType} should be resolved before renewal marketing to protect submission quality.`;
  }
  return finding.businessImpact || 'May create underwriting follow-up if unresolved.';
}

function getRecommendedAction(finding) {
  if (finding.correctiveAction) return finding.correctiveAction;
  if (finding.status === 'Overdue') return 'Escalate with the client and confirm evidence timing.';
  return 'Assign an advisor and request supporting evidence.';
}

function getFindingStage(finding) {
  if (finding.status === 'Closed') return 'Closed';
  if (finding.status === 'Overdue') return 'Corrective Action In Progress';
  if (finding.status === 'In Progress') return 'Corrective Action In Progress';
  if (finding.origin === 'Document Hub' && finding.status === 'Open') return 'Evidence Submitted';
  if (finding.status === 'Open') return 'Assigned';
  return 'Finding Identified';
}

function enrichFinding(finding, client, renewal) {
  const category = getCategory(finding);
  const dueIn = daysUntil(finding.dueDate);
  return {
    ...finding,
    advisor: userById.get(finding.assignedUserId),
    businessImpact: getBusinessImpact(finding, client, renewal),
    category,
    dueIn,
    evidenceRequired: finding.evidenceRequired ?? `${category} evidence`,
    financialImpact: compactCurrency(Math.round((renewal?.revenueAtRisk ?? client.estimatedRevenue) * (finding.severity === 'High' ? 0.16 : finding.severity === 'Medium' ? 0.09 : 0.04))),
    recommendedAction: getRecommendedAction(finding),
    renewalImpact: dueIn <= 30 || finding.severity === 'High' ? 'High' : dueIn <= 60 ? 'Moderate' : 'Low',
    stage: getFindingStage(finding),
  };
}

function buildCategoryAssessments(clientRisk) {
  const byCategory = new Map(clientRisk.findings.map((finding) => [finding.category, []]));
  clientRisk.findings.forEach((finding) => {
    byCategory.set(finding.category, [...(byCategory.get(finding.category) ?? []), finding]);
  });

  return riskCategories.map((category, index) => {
    const findings = byCategory.get(category) ?? [];
    const maxSeverity = getHighestSeverity(findings);
    const base = clientRisk.complianceHealth - findings.length * 6 - (maxSeverity === 'High' ? 10 : maxSeverity === 'Medium' ? 5 : 0) + (index % 3) * 2;
    return {
      category,
      currentScore: clamp(Math.round(base), 48, 98),
      findingCount: findings.length,
      severity: findings.length ? maxSeverity : 'Low',
      businessImpact: findings[0]?.businessImpact ?? 'No material advisory concern currently recorded.',
      advisor: findings[0]?.advisor?.name ?? clientRisk.advisor.name,
      nextReviewDate: findings[0]?.dueDate ?? clientRisk.renewal?.expiryDate ?? clientRisk.client.renewalDate,
    };
  });
}

function buildImprovementPlan(clientRisk) {
  const coreFindings = clientRisk.findings.slice().sort((a, b) => {
    return severityScore(b.severity) - severityScore(a.severity) || a.dueIn - b.dueIn;
  });

  const plan = coreFindings.slice(0, 3).map((finding, index) => ({
    priority: index + 1,
    title: finding.findingType,
    category: finding.category,
    businessBenefit: index === 0
      ? 'Improves submission quality and reduces underwriter concerns.'
      : index === 1
        ? 'Improves operational profile and insurer confidence.'
        : 'Strengthens safety governance and client relationship quality.',
    estimatedImpact: finding.renewalImpact === 'High' ? 'Lower renewal risk.' : 'Supports more competitive market placement.',
    action: finding.recommendedAction,
  }));

  if (plan.length < 3) {
    plan.push({
      priority: plan.length + 1,
      title: 'Review risk narrative before market approach',
      category: 'Safety Management System',
      businessBenefit: 'Helps Symphony position the client as proactive and controlled.',
      estimatedImpact: 'Protects renewal confidence.',
      action: 'Prepare an advisory summary for the account team.',
    });
  }

  return plan;
}

function buildClientRisk(client) {
  const renewal = simulationData.renewals.find((item) => item.clientId === client.id);
  const submission = simulationData.submissions.find((item) => item.clientId === client.id);
  const placement = simulationData.negotiations.find((item) => item.clientId === client.id);
  const policies = simulationData.policies.filter((item) => item.clientId === client.id);
  const claims = simulationData.claims.filter((item) => item.clientId === client.id);
  const tasks = simulationData.tasks.filter((item) => item.clientId === client.id);
  const activities = simulationData.activities.filter((item) => item.clientId === client.id || item.relatedModule === 'Compliance');
  const documents = simulationData.documents.filter((item) => item.clientId === client.id);
  const documentFindings = documents
    .filter((document) => ['Missing', 'Needs Review', 'Expired'].includes(document.status))
    .map(buildDocumentFinding);
  const findings = [...simulationData.compliance.filter((item) => item.clientId === client.id), ...documentFindings]
    .filter((finding) => finding.status !== 'Closed')
    .map((finding) => enrichFinding(finding, client, renewal))
    .sort((a, b) => severityScore(b.severity) - severityScore(a.severity) || a.dueIn - b.dueIn);
  const advisor = getAdvisor(client, findings);
  const ariExposure = getAriClientExposure(client, ariView);
  const claimsExposure = getClaimsExposure(claims);
  const highClaims = claims.filter((claim) => claim.severity === 'High' || claim.executiveReviewRequired).length;
  const openTasks = tasks.filter((task) => task.status !== 'Completed');
  const overdueTasks = openTasks.filter((task) => task.status === 'Overdue');
  const upcomingDocs = documents.filter((document) => daysUntil(document.expiryDate) <= 45 && daysUntil(document.expiryDate) >= 0);
  const complianceHealth = clamp(client.complianceScore - findings.length * 2 - overdueTasks.length * 3, 45, 99);
  const operationalRisk = clamp(100 - complianceHealth + findings.reduce((total, finding) => total + severityScore(finding.severity), 0) + highClaims * 8, 15, 100);
  const renewalReadiness = submission?.completionPercent ?? renewal?.readinessScore ?? client.documentCompleteness;
  const businessRisk = clamp(
    operationalRisk
      + (client.retentionRisk === 'High' ? 14 : client.retentionRisk === 'Medium' ? 7 : 0)
      + (renewal?.daysToExpiry <= 45 ? 8 : 0)
      + (ariExposure.level === 'Moderate' ? 6 : 3),
    18,
    100,
  );
  const riskScore = clamp(Math.round((operationalRisk + businessRisk + (100 - renewalReadiness) + highClaims * 6) / 2.6), 18, 100);
  const rating = ratingFromRiskScore(riskScore);
  const revenueExposure = Math.round((renewal?.revenueAtRisk ?? client.estimatedRevenue) * (rating === 'High' ? 0.28 : rating === 'Elevated' ? 0.18 : rating === 'Moderate' ? 0.1 : 0.04));
  const highestFinding = findings[0];
  const impactedByAri = ariExposure.level === ariView.category || ariExposure.drivers.length >= 3;

  const clientRisk = {
    activities,
    advisor,
    ariExposure,
    businessRisk,
    claims,
    claimsExposure,
    client,
    complianceHealth,
    documents,
    findings,
    highestFinding,
    impactedByAri,
    openTasks,
    operationalRisk,
    placement,
    policies,
    rating,
    renewal,
    renewalImpact: highestFinding?.renewalImpact ?? (renewal?.daysToExpiry <= 45 ? 'Moderate' : 'Low'),
    renewalReadiness,
    revenueExposure,
    riskScore,
    submission,
    tasks,
    upcomingDocs,
  };

  return {
    ...clientRisk,
    categories: buildCategoryAssessments(clientRisk),
    improvementPlan: buildImprovementPlan(clientRisk),
  };
}

function applyFilters(items, filters) {
  const search = filters.search.trim().toLowerCase();
  return items.filter((item) => {
    if (filters.savedView === 'highRisk' && !['High', 'Elevated'].includes(item.rating)) return false;
    if (filters.savedView === 'renewal30' && (!item.renewal || item.renewal.daysToExpiry > 30)) return false;
    if (filters.savedView === 'training' && !item.findings.some((finding) => finding.category === 'Pilot Training')) return false;
    if (filters.savedView === 'maintenance' && !item.findings.some((finding) => finding.category === 'Aircraft Maintenance')) return false;
    if (filters.savedView === 'documents' && !item.findings.some((finding) => finding.category === 'Documentation')) return false;
    if (filters.savedView === 'ari' && !item.impactedByAri) return false;
    if (filters.client !== 'all' && item.client.id !== filters.client) return false;
    if (filters.riskLevel !== 'all' && item.rating !== filters.riskLevel) return false;
    if (filters.complianceStatus !== 'all' && !item.findings.some((finding) => finding.status === filters.complianceStatus)) return false;
    if (filters.findingType !== 'all' && !item.findings.some((finding) => finding.category === filters.findingType)) return false;
    if (filters.advisor !== 'all' && item.advisor.id !== filters.advisor) return false;
    if (filters.renewalWindow === '30' && (!item.renewal || item.renewal.daysToExpiry > 30)) return false;
    if (filters.renewalWindow === '60' && (!item.renewal || item.renewal.daysToExpiry > 60)) return false;
    if (filters.aircraftType !== 'all' && !`${item.client.clientType} ${item.client.industrySegment}`.toLowerCase().includes(filters.aircraftType.toLowerCase())) return false;
    if (search && !`${item.client.name} ${item.client.clientType} ${item.findings.map((finding) => finding.findingType).join(' ')} ${item.advisor.name}`.toLowerCase().includes(search)) return false;
    return true;
  });
}

function SectionHeader({ title, text, action }) {
  return (
    <div className="compliance-section-header">
      <div>
        <h2>{title}</h2>
        {text ? <p>{text}</p> : null}
      </div>
      {action}
    </div>
  );
}

function RiskPill({ rating }) {
  return <span className={`compliance-risk-pill compliance-risk-pill--${ratingTone(rating)}`}>{rating}</span>;
}

function ProgressLine({ label, value, tone = 'blue' }) {
  return (
    <div className="compliance-progress-line">
      <div>
        <span>{label}</span>
        <strong>{value}%</strong>
      </div>
      <i><b className={`compliance-progress-line__bar compliance-progress-line__bar--${tone}`} style={{ width: `${clamp(value, 0, 100)}%` }} /></i>
    </div>
  );
}

function ComplianceSummary({ items }) {
  const averageHealth = Math.round(getAverage(items.map((item) => ({ value: item.complianceHealth })), 'value'));
  const averageRisk = Math.round(getAverage(items.map((item) => ({ value: item.riskScore })), 'value'));
  const highRisk = items.filter((item) => ['High', 'Elevated'].includes(item.rating)).length;
  const openFindings = getSum(items.map((item) => ({ value: item.findings.length })), 'value');
  const overdueActions = items.reduce((total, item) => total + item.findings.filter((finding) => finding.status === 'Overdue' || finding.dueIn < 0).length, 0);
  const upcomingDocumentExpiries = items.reduce((total, item) => total + item.upcomingDocs.length, 0);
  const trainingItems = items.reduce((total, item) => total + item.findings.filter((finding) => finding.category === 'Pilot Training').length, 0);
  const maintenanceFindings = items.reduce((total, item) => total + item.findings.filter((finding) => finding.category === 'Aircraft Maintenance').length, 0);
  const ariImpacted = items.filter((item) => item.impactedByAri).length;
  const optimisation = simulationData.policies.filter((policy) => policy.optimizationOpportunity || policy.coverageConcern !== 'No material coverage concern').length;

  return (
    <section className="compliance-summary-grid" aria-label="Compliance and risk advisory executive summary">
      <BusinessKpiCard icon={ShieldCheck} label="Overall Compliance Health" value={`${averageHealth}%`} helper="Portfolio advisory health" tone="green" />
      <BusinessKpiCard icon={Gauge} label="Average Client Risk Score" value={averageRisk} helper="Composite operational score" tone="amber" />
      <BusinessKpiCard icon={ShieldAlert} label="High Risk Clients" value={highRisk} helper="High or elevated rating" tone="red" />
      <BusinessKpiCard icon={ClipboardCheck} label="Open Compliance Findings" value={openFindings} helper="Findings and document gaps" />
      <BusinessKpiCard icon={CalendarClock} label="Overdue Actions" value={overdueActions} helper="Past due advisory items" tone="red" />
      <BusinessKpiCard icon={FileClock} label="Upcoming Document Expiries" value={upcomingDocumentExpiries} helper="Within 45 days" tone="amber" />
      <BusinessKpiCard icon={BadgeCheck} label="Training Items Due" value={trainingItems} helper="Pilot and instructor evidence" />
      <BusinessKpiCard icon={Wrench} label="Maintenance Findings" value={maintenanceFindings} helper="Programme or records review" tone="amber" />
      <BusinessKpiCard icon={Plane} label="Clients Impacted by ARI" value={ariImpacted} helper={`${ariView.category} domestic index`} />
      <BusinessKpiCard icon={TrendingUp} label="Policy Optimisation Opportunities" value={optimisation} helper="Coverage concerns to review" tone="green" />
    </section>
  );
}

function FilterBar({ clients, filters, advisors, setFilters }) {
  function update(key, value) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  return (
    <section className="compliance-filter-card" aria-label="Compliance and risk advisory filters">
      <label>
        <span>Saved View</span>
        <select value={filters.savedView} onChange={(event) => update('savedView', event.target.value)}>
          {savedViews.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </label>
      <label>
        <span>Client</span>
        <select value={filters.client} onChange={(event) => update('client', event.target.value)}>
          <option value="all">All Clients</option>
          {clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
        </select>
      </label>
      <label>
        <span>Risk Level</span>
        <select value={filters.riskLevel} onChange={(event) => update('riskLevel', event.target.value)}>
          <option value="all">All Levels</option>
          {['High', 'Elevated', 'Moderate', 'Guarded'].map((rating) => <option key={rating} value={rating}>{rating}</option>)}
        </select>
      </label>
      <label>
        <span>Compliance Status</span>
        <select value={filters.complianceStatus} onChange={(event) => update('complianceStatus', event.target.value)}>
          <option value="all">Any Status</option>
          {['Overdue', 'Open', 'In Progress', 'Needs Review'].map((status) => <option key={status} value={status}>{status}</option>)}
        </select>
      </label>
      <label>
        <span>Finding Type</span>
        <select value={filters.findingType} onChange={(event) => update('findingType', event.target.value)}>
          <option value="all">Any Type</option>
          {riskCategories.map((category) => <option key={category} value={category}>{category}</option>)}
        </select>
      </label>
      <label>
        <span>Assigned Advisor</span>
        <select value={filters.advisor} onChange={(event) => update('advisor', event.target.value)}>
          <option value="all">All Advisors</option>
          {advisors.map((advisor) => <option key={advisor.id} value={advisor.id}>{advisor.name}</option>)}
        </select>
      </label>
      <label>
        <span>Renewal Window</span>
        <select value={filters.renewalWindow} onChange={(event) => update('renewalWindow', event.target.value)}>
          <option value="all">Any Renewal</option>
          <option value="30">Within 30 Days</option>
          <option value="60">Within 60 Days</option>
        </select>
      </label>
      <label>
        <span>Aircraft Type</span>
        <select value={filters.aircraftType} onChange={(event) => update('aircraftType', event.target.value)}>
          <option value="all">Any Operation</option>
          <option value="airline">Airline</option>
          <option value="charter">Charter</option>
          <option value="helicopter">Helicopter</option>
          <option value="flight">Flight School</option>
          <option value="airport">Airport</option>
        </select>
      </label>
      <label className="compliance-filter-card__search">
        <span>Search</span>
        <div>
          <Search size={16} />
          <input value={filters.search} onChange={(event) => update('search', event.target.value)} placeholder="Client, advisor, finding..." />
        </div>
      </label>
    </section>
  );
}

function AttentionQueue({ items, selectedClientId, onSelect }) {
  return (
    <section className="compliance-attention-grid" aria-label="Clients requiring attention">
      {items.map((item) => (
        <button
          key={item.client.id}
          type="button"
          className={selectedClientId === item.client.id ? 'compliance-client-card compliance-client-card--active' : 'compliance-client-card'}
          onClick={() => onSelect(item.client.id)}
        >
          <div className="compliance-client-card__top">
            <div>
              <span>{item.client.clientType}</span>
              <strong>{item.client.name}</strong>
              <small>{item.client.location}</small>
            </div>
            <RiskPill rating={item.rating} />
          </div>
          <dl>
            <div><dt>Compliance</dt><dd>{item.complianceHealth}%</dd></div>
            <div><dt>Open Findings</dt><dd>{item.findings.length}</dd></div>
            <div><dt>Highest Severity</dt><dd>{item.highestFinding?.severity ?? 'Low'}</dd></div>
            <div><dt>Renewal Impact</dt><dd>{item.renewalImpact}</dd></div>
          </dl>
          <p>{item.highestFinding?.businessImpact ?? 'No material advisory concern currently recorded.'}</p>
          <footer>
            <RevenueImpactLabel value={compactCurrency(item.revenueExposure)} label="Revenue exposure" />
            <span>{item.advisor.name}</span>
          </footer>
          <em>{item.highestFinding?.recommendedAction ?? 'Maintain monitoring cadence.'}</em>
        </button>
      ))}
    </section>
  );
}

function Pipeline({ findings }) {
  const items = pipelineStages.map((stage) => {
    const stageFindings = findings.filter((finding) => finding.stage === stage || (stage === 'Finding Identified' && finding.stage !== 'Closed'));
    const averageAge = stageFindings.length ? Math.round(getAverage(stageFindings.map((finding) => ({ value: Math.abs(finding.dueIn) + 8 })), 'value')) : 0;
    return {
      stage,
      count: stageFindings.length,
      averageAge,
      highPriority: stageFindings.filter((finding) => finding.severity === 'High').length,
      blocked: stageFindings.filter((finding) => finding.status === 'Overdue').length,
      overdue: stageFindings.filter((finding) => finding.dueIn < 0).length,
    };
  });

  return (
    <section className="compliance-pipeline-grid" aria-label="Compliance and risk pipeline">
      {items.map((item) => (
        <article key={item.stage}>
          <span>{item.stage}</span>
          <strong>{item.count}</strong>
          <dl>
            <div><dt>Avg age</dt><dd>{item.averageAge}d</dd></div>
            <div><dt>High</dt><dd>{item.highPriority}</dd></div>
            <div><dt>Blocked</dt><dd>{item.blocked}</dd></div>
            <div><dt>Overdue</dt><dd>{item.overdue}</dd></div>
          </dl>
        </article>
      ))}
    </section>
  );
}

function AdvisorySummary({ item }) {
  return (
    <aside className="compliance-advisory-summary" aria-label="Client advisory summary">
      <h3>Client Advisory Summary</h3>
      <dl>
        <div><dt>Overall Position</dt><dd>{item.rating} Risk</dd></div>
        <div><dt>Renewal Readiness</dt><dd>{item.renewalReadiness}%</dd></div>
        <div><dt>ARI Exposure</dt><dd>{item.ariExposure.level}</dd></div>
        <div><dt>Claims Exposure</dt><dd>{item.claimsExposure.requiringReview ? 'Elevated' : 'Low'}</dd></div>
        <div><dt>Primary Concern</dt><dd>{item.highestFinding?.category ?? 'Monitoring'}</dd></div>
        <div><dt>Priority Recommendation</dt><dd>{item.highestFinding?.recommendedAction ?? 'Continue advisory monitoring.'}</dd></div>
      </dl>
    </aside>
  );
}

function RiskCategories({ categories }) {
  return (
    <div className="compliance-category-grid">
      {categories.map((category) => (
        <article key={category.category}>
          <header>
            <strong>{category.category}</strong>
            <ComplianceSeverityBadge severity={category.severity} />
          </header>
          <ProgressLine label="Current Score" value={category.currentScore} tone={category.currentScore >= 82 ? 'green' : category.currentScore >= 70 ? 'blue' : category.currentScore >= 58 ? 'amber' : 'red'} />
          <dl>
            <div><dt>Findings</dt><dd>{category.findingCount}</dd></div>
            <div><dt>Advisor</dt><dd>{category.advisor}</dd></div>
            <div><dt>Next Review</dt><dd>{formatDate(category.nextReviewDate)}</dd></div>
          </dl>
          <p>{category.businessImpact}</p>
        </article>
      ))}
    </div>
  );
}

function FindingsList({ findings, expandedFindingIds, onToggle }) {
  return (
    <div className="compliance-finding-list">
      {findings.map((finding) => {
        const expanded = expandedFindingIds.has(finding.id);
        return (
          <article key={finding.id} className={expanded ? 'compliance-finding compliance-finding--expanded' : 'compliance-finding'}>
            <button type="button" onClick={() => onToggle(finding.id)}>
              <div>
                <ComplianceSeverityBadge severity={finding.severity} />
                <strong>{finding.findingType}</strong>
                <span>{finding.status} - due {formatDate(finding.dueDate)}</span>
              </div>
              {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
            {expanded && (
              <div className="compliance-finding__detail">
                <dl>
                  <div><dt>Assigned Person</dt><dd>{finding.advisor?.name ?? userName(finding.assignedUserId)}</dd></div>
                  <div><dt>Category</dt><dd>{finding.category}</dd></div>
                  <div><dt>Renewal Impact</dt><dd>{finding.renewalImpact}</dd></div>
                  <div><dt>Financial Impact</dt><dd>{finding.financialImpact}</dd></div>
                </dl>
                <div className="compliance-business-impact">
                  <article><span>Why it matters</span><p>{finding.businessImpact}</p></article>
                  <article><span>Claims impact</span><p>{finding.severity === 'High' ? 'Weak controls may increase loss frequency or severity.' : 'Current signal is manageable with timely evidence.'}</p></article>
                  <article><span>Client relationship impact</span><p>Clear advisory follow-up reinforces Symphony's proactive risk role.</p></article>
                  <article><span>Evidence required</span><p>{finding.evidenceRequired}</p></article>
                  <article><span>Recommended action</span><p>{finding.recommendedAction}</p></article>
                </div>
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}

function ImprovementPlan({ plan }) {
  return (
    <div className="compliance-plan-list">
      {plan.map((item) => (
        <article key={`${item.priority}-${item.title}`}>
          <span>Priority {item.priority}</span>
          <h3>{item.title}</h3>
          <p>{item.category}</p>
          <dl>
            <div><dt>Business Benefit</dt><dd>{item.businessBenefit}</dd></div>
            <div><dt>Estimated Impact</dt><dd>{item.estimatedImpact}</dd></div>
          </dl>
          <em>{item.action}</em>
        </article>
      ))}
    </div>
  );
}

function AriImpact({ item }) {
  return (
    <section className="compliance-ari-panel">
      <div>
        <span>Current Aviation Risk Index</span>
        <strong>{ariView.score} / 100</strong>
        <em>{ariView.category}</em>
      </div>
      <article>
        <h3>Relevant Risk Drivers</h3>
        <div className="compliance-chip-list">
          {item.ariExposure.drivers.map((driver) => <span key={driver}>{driver}</span>)}
          {ariFactors.map((factor) => <span key={factor.id}>{factor.label} {factor.score}</span>)}
        </div>
        <p>{item.ariExposure.note}</p>
        <p>{ariView.workspaceSignals.compliance ?? 'Current ARI conditions may increase underwriting scrutiny for weather, fuel, documentation, and contingency controls.'}</p>
        <strong>{ariView.recommendedActions[0]}</strong>
      </article>
    </section>
  );
}

function RelatedRecords({ item }) {
  const records = [
    ['Client', item.client.name, `/clients?clientId=${item.client.id}`],
    ['Policies', `${item.policies.length} active records`, `/clients?clientId=${item.client.id}`],
    ['Renewal', item.renewal ? `${item.renewal.currentStage} - ${item.renewal.daysToExpiry} days` : 'No active renewal', item.renewal ? `/renewals/${item.renewal.id}` : '/renewals'],
    ['Submission', item.submission ? `${item.submission.completionPercent}% complete` : 'No active submission', item.submission ? `/submissions/${item.submission.id}` : '/submissions'],
    ['Market Placement', item.placement ? `${item.placement.currentStatus} - ${item.placement.quotesReceived} quotes` : 'No active placement', item.placement ? `/market-placement/${item.placement.id}` : '/market-placement'],
    ['Claims', `${item.claims.length} claim records`, '/claims'],
    ['Tasks', `${item.openTasks.length} open tasks`, '/account-manager'],
    ['Documents', `${getDocumentGapCount(item.documents)} gaps`, '/documents'],
    ['Activities', `${item.activities.length} recent items`, '/clients'],
  ];

  return (
    <div className="compliance-related-grid">
      {records.map(([label, value, route]) => (
        <Link key={label} to={route}>
          <span>{label}</span>
          <strong>{value}</strong>
          <ArrowRight size={15} />
        </Link>
      ))}
    </div>
  );
}

function QuickActions({ onAction }) {
  const actions = [
    ['Assign Advisor', UserRoundCog],
    ['Request Evidence', FileText],
    ['Add Note', MessageSquarePlus],
    ['Approve Evidence', CheckCircle2],
    ['Escalate Finding', AlertTriangle],
    ['Close Finding', FileCheck2],
    ['Create Improvement Plan', Target],
    ['Schedule Client Review', CalendarClock],
  ];

  return (
    <div className="compliance-quick-actions">
      {actions.map(([label, Icon]) => (
        <button key={label} type="button" onClick={() => onAction(label)}>
          <Icon size={16} />
          {label}
        </button>
      ))}
    </div>
  );
}

function ClientRiskDetail({ item, expandedFindingIds, onToggleFinding, onAction, actionLog }) {
  return (
    <section className="compliance-detail">
      <header className="compliance-detail-hero">
        <div>
          <span>Client Risk Detail</span>
          <h2>{item.client.name}</h2>
          <p>{item.client.shortBusinessSummary}</p>
        </div>
        <RiskPill rating={item.rating} />
      </header>

      <div className="compliance-detail-meta">
        <div><span>Compliance Health</span><strong>{item.complianceHealth}%</strong></div>
        <div><span>Renewal Date</span><strong>{formatDate(item.client.renewalDate)}</strong></div>
        <div><span>ARI Exposure</span><strong>{item.ariExposure.level}</strong></div>
        <div><span>Revenue Value</span><strong>{compactCurrency(item.client.estimatedRevenue)}</strong></div>
        <div><span>Assigned Advisor</span><strong>{item.advisor.name}</strong></div>
      </div>

      <div className="compliance-detail-layout">
        <div className="compliance-detail-main">
          <section className="compliance-panel">
            <SectionHeader title="Overall Risk Assessment" text="A combined view of operational, insurance, claims, renewal and ARI risk signals." />
            <div className="compliance-assessment-grid">
              <ProgressLine label="Compliance Score" value={item.complianceHealth} tone={item.complianceHealth >= 82 ? 'green' : item.complianceHealth >= 70 ? 'blue' : 'amber'} />
              <ProgressLine label="ARI Impact" value={ariView.score} tone="amber" />
              <ProgressLine label="Operational Risk" value={item.operationalRisk} tone={item.operationalRisk >= 72 ? 'red' : 'amber'} />
              <ProgressLine label="Claims Trend" value={clamp(item.claimsExposure.requiringReview * 28 + item.claims.length * 8, 8, 100)} tone={item.claimsExposure.requiringReview ? 'red' : 'green'} />
              <ProgressLine label="Renewal Readiness" value={item.renewalReadiness} tone={item.renewalReadiness >= 84 ? 'green' : 'blue'} />
              <ProgressLine label="Business Risk" value={item.businessRisk} tone={item.businessRisk >= 70 ? 'red' : 'amber'} />
            </div>
          </section>

          <section className="compliance-panel">
            <SectionHeader title="Risk Categories" text="Grouped advisory signals across operational and insurance control areas." />
            <RiskCategories categories={item.categories} />
          </section>

          <section className="compliance-panel">
            <SectionHeader title="Open Findings" text="Expandable findings with business impact, evidence needs and recommended action." />
            <FindingsList findings={item.findings} expandedFindingIds={expandedFindingIds} onToggle={onToggleFinding} />
          </section>

          <section className="compliance-panel">
            <SectionHeader title="Risk Improvement Plan" text="Advisory priorities designed to improve insurability and renewal outcomes." />
            <ImprovementPlan plan={item.improvementPlan} />
          </section>

          <section className="compliance-panel">
            <SectionHeader title="ARI Impact" text="Current Aviation Risk Index signals applied to this client profile." />
            <AriImpact item={item} />
          </section>

          <section className="compliance-panel">
            <SectionHeader title="Related Records" text="Connected client, placement, renewal, claim, task and document records from the shared model." />
            <RelatedRecords item={item} />
          </section>

          <section className="compliance-panel">
            <SectionHeader title="Recent Activity" text="Timeline of client and compliance signals." />
            <BusinessActivityTimeline activities={item.activities.slice(0, 6)} getClientName={(clientId) => clientById.get(clientId)?.name ?? 'Portfolio'} formatTime={formatTime} />
          </section>
        </div>

        <aside className="compliance-detail-side">
          <AdvisorySummary item={item} />
          <section className="compliance-insight-card">
            <h3>Insights</h3>
            <ul>
              <li>{item.highestFinding?.category ?? 'Compliance'} should be addressed before renewal marketing.</li>
              <li>Recent ARI signals suggest weather and documentation narratives should be refreshed.</li>
              <li>{item.claimsExposure.requiringReview ? 'Open claims may influence insurer appetite.' : 'Claims exposure is not the primary concern today.'}</li>
            </ul>
          </section>
          <section className="compliance-insight-card">
            <h3>Quick Actions</h3>
            <QuickActions onAction={onAction} />
          </section>
          <section className="compliance-insight-card">
            <h3>Action Log</h3>
            <div className="compliance-action-log">
              {actionLog.map((entry) => <span key={entry}>{entry}</span>)}
            </div>
          </section>
        </aside>
      </div>
    </section>
  );
}

export function ComplianceRiskWorkspace() {
  const { activeUserId, roleConfiguration } = useRoleExperience();
  const activeUserIsAdvisor = simulationData.teamMembers.some((member) => member.id === activeUserId && member.role === 'Compliance Coordinator');
  const [filters, setFilters] = useState({
    advisor: activeUserIsAdvisor ? activeUserId : 'all',
    aircraftType: 'all',
    client: 'all',
    complianceStatus: 'all',
    findingType: 'all',
    renewalWindow: 'all',
    riskLevel: 'all',
    savedView: 'all',
    search: '',
  });
  const [selectedClientId, setSelectedClientId] = useState('CLI-003');
  const [expandedFindingIds, setExpandedFindingIds] = useState(() => new Set(['CMP-002']));
  const [actionLog, setActionLog] = useState(['No simulated advisory action taken yet.']);

  const clientRisks = useMemo(() => simulationData.clients.map(buildClientRisk).sort((a, b) => b.riskScore - a.riskScore), []);
  const filteredRisks = useMemo(() => applyFilters(clientRisks, filters), [clientRisks, filters]);
  const selectedItem = clientRisks.find((item) => item.client.id === selectedClientId) ?? filteredRisks[0] ?? clientRisks[0];
  const allFindings = clientRisks.flatMap((item) => item.findings);
  const advisors = Array.from(new Map(clientRisks.map((item) => [item.advisor.id, item.advisor])).values());
  const portfolioPlans = clientRisks.slice(0, 3).flatMap((item) => item.improvementPlan.slice(0, 1).map((plan) => ({ ...plan, clientName: item.client.name })));

  function toggleFinding(findingId) {
    setExpandedFindingIds((current) => {
      const next = new Set(current);
      if (next.has(findingId)) next.delete(findingId);
      else next.add(findingId);
      return next;
    });
  }

  function handleAction(action) {
    setActionLog((current) => [`${action} simulated for ${selectedItem.client.name}`, ...current.filter((item) => item !== 'No simulated advisory action taken yet.')].slice(0, 5));
  }

  return (
    <div className="compliance-workspace page-transition">
      <RoleAwareDashboardHeader
        eyebrow="Compliance & Risk Advisor Workspace"
        title="Compliance & Risk"
        question={roleConfiguration.primaryQuestion}
        actions={roleConfiguration.quickActions}
        onAction={handleAction}
      />
      <section className="compliance-ari-context">
        <div><span>Domestic Aviation Risk Index</span><strong>{ariView.score} / 100</strong><em>{ariView.category}</em></div>
        <p>{ariView.workspaceSignals.compliance}</p>
      </section>

      <ComplianceSummary items={clientRisks} />

      <FilterBar clients={simulationData.clients} filters={filters} advisors={advisors} setFilters={setFilters} />

      <section className="compliance-section">
        <SectionHeader
          title="Clients Requiring Attention"
          text="Operational work queue ranked by risk, renewal impact, revenue exposure and unresolved evidence needs."
          action={<span className="compliance-count">{filteredRisks.length} clients</span>}
        />
        <AttentionQueue items={filteredRisks.slice(0, 9)} selectedClientId={selectedItem.client.id} onSelect={setSelectedClientId} />
      </section>

      <section className="compliance-section">
        <SectionHeader title="Compliance & Risk Pipeline" text="Lifecycle view of advisory findings from identification through verification and closure." />
        <Pipeline findings={allFindings} />
      </section>

      <section className="compliance-section">
        <SectionHeader title="Risk Improvement Plans" text="Portfolio-level plan previews showing how Symphony improves insurability rather than only tracking deficiencies." />
        <div className="compliance-portfolio-plan-grid">
          {portfolioPlans.map((plan) => (
            <article key={`${plan.clientName}-${plan.title}`}>
              <span>{plan.clientName}</span>
              <h3>{plan.title}</h3>
              <p>{plan.businessBenefit}</p>
              <em>{plan.estimatedImpact}</em>
            </article>
          ))}
        </div>
      </section>

      <ClientRiskDetail
        item={selectedItem}
        expandedFindingIds={expandedFindingIds}
        onToggleFinding={toggleFinding}
        onAction={handleAction}
        actionLog={actionLog}
      />
    </div>
  );
}
