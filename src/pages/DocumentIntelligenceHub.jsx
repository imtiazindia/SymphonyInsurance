import { useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Download,
  Eye,
  FileClock,
  FileSearch,
  FileText,
  FolderOpen,
  MessageSquarePlus,
  Printer,
  Search,
  Send,
  ShieldCheck,
} from 'lucide-react';
import {
  BusinessActivityTimeline,
  BusinessKpiCard,
  ComplianceSeverityBadge,
  DocumentStatusBadge,
  RevenueImpactLabel,
} from '../components/BusinessComponents.jsx';
import { simulationData } from '../data/demoData.js';
import { getDocumentGapCount, getSum } from '../utils/businessCalculations.js';

const asOfDate = '2026-07-10';
const today = new Date(`${asOfDate}T00:00:00Z`);

const compactCurrencyFormatter = new Intl.NumberFormat('en-US', {
  currency: 'USD',
  maximumFractionDigits: 1,
  notation: 'compact',
  style: 'currency',
});

const dateFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
const timeFormatter = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', month: 'short', day: 'numeric' });

const clientById = new Map(simulationData.clients.map((client) => [client.id, client]));
const userById = new Map(simulationData.teamMembers.map((user) => [user.id, user]));

const savedViews = [
  ['all', 'All Documents'],
  ['renewal', 'Renewal Documents'],
  ['claims', 'Claims Documents'],
  ['compliance', 'Compliance Evidence'],
  ['expiring', 'Expiring This Month'],
  ['missing', 'Missing Documents'],
  ['recent', 'Recently Uploaded'],
  ['review', 'Awaiting Review'],
];

const documentCategories = [
  'Policies',
  'Aircraft Schedules',
  'Pilot Rosters',
  'Training Records',
  'Maintenance Programs',
  'Safety Manuals',
  'Emergency Response Plans',
  'Claims Documentation',
  'Audit Evidence',
  'Contracts',
  'Leases',
  'Certificates',
  'Financial Information',
  'Correspondence',
  'Marketing Submissions',
];

function compactCurrency(value) {
  return compactCurrencyFormatter.format(value || 0).replace('.0', '');
}

function formatDate(value) {
  if (!value) return 'Not uploaded';
  return dateFormatter.format(new Date(`${value}T00:00:00Z`));
}

function daysUntil(value) {
  if (!value) return 999;
  return Math.ceil((new Date(`${value}T00:00:00Z`) - today) / 86400000);
}

function userName(userId) {
  return userById.get(userId)?.name ?? 'Unassigned';
}

function getCategory(document) {
  const text = `${document.documentType} ${document.requiredFor}`.toLowerCase();
  if (text.includes('policy')) return 'Policies';
  if (text.includes('aircraft schedule')) return 'Aircraft Schedules';
  if (text.includes('pilot') || text.includes('instructor roster')) return 'Pilot Rosters';
  if (text.includes('training')) return 'Training Records';
  if (text.includes('maintenance')) return 'Maintenance Programs';
  if (text.includes('safety') || text.includes('quality manual')) return 'Safety Manuals';
  if (text.includes('emergency')) return 'Emergency Response Plans';
  if (text.includes('claim') || text.includes('loss')) return 'Claims Documentation';
  if (text.includes('audit') || text.includes('evidence')) return 'Audit Evidence';
  if (text.includes('contract')) return 'Contracts';
  if (text.includes('lease')) return 'Leases';
  if (text.includes('certificate') || text.includes('inspection')) return 'Certificates';
  if (text.includes('financial') || text.includes('statement')) return 'Financial Information';
  if (text.includes('submission')) return 'Marketing Submissions';
  return 'Correspondence';
}

function getWorkflow(document) {
  const requiredFor = document.requiredFor.toLowerCase();
  if (requiredFor.includes('claim')) return 'Claims';
  if (requiredFor.includes('compliance')) return 'Compliance';
  if (requiredFor.includes('market')) return 'Market Placement';
  if (requiredFor.includes('renewal')) return 'Renewal';
  return document.status === 'Missing' ? 'Submission' : 'Client Service';
}

function getOwner(document, client) {
  const workflow = getWorkflow(document);
  if (workflow === 'Compliance') return simulationData.teamMembers.find((user) => user.role === 'Compliance Coordinator')?.id ?? 'USR-008';
  if (workflow === 'Claims') return simulationData.teamMembers.find((user) => user.role === 'Claims Coordinator')?.id ?? 'USR-007';
  if (workflow === 'Market Placement') return client.assignedPlacementLeadId;
  if (document.status === 'Needs Review') return simulationData.teamMembers.find((user) => user.role === 'Document Specialist')?.id ?? 'USR-009';
  return client.assignedAccountManagerId;
}

function getWorkflowStatus(document) {
  if (document.status === 'Missing') return 'Blocked';
  if (document.status === 'Expired') return 'Blocked';
  if (document.status === 'Needs Review') return 'Pending Review';
  if (daysUntil(document.expiryDate) <= 30) return 'At Risk';
  return 'Ready';
}

function getRecommendedAction(document) {
  if (document.status === 'Missing') return `Request updated ${document.documentType.toLowerCase()}.`;
  if (document.status === 'Needs Review') return 'Review evidence and approve or flag issues.';
  if (document.status === 'Expired') return 'Request replacement document immediately.';
  if (daysUntil(document.expiryDate) <= 30) return 'Confirm replacement timing before expiry.';
  return 'Keep document available for linked workflow.';
}

function getPotentialRevenueImpact(document, client, renewal) {
  const base = renewal?.revenueAtRisk ?? client.estimatedRevenue;
  if (document.status === 'Missing' || document.status === 'Expired') return Math.round(base * 0.42);
  if (document.status === 'Needs Review') return Math.round(base * 0.22);
  if (daysUntil(document.expiryDate) <= 30) return Math.round(base * 0.14);
  return Math.round(base * 0.04);
}

function getLinkedRecords(document) {
  const client = clientById.get(document.clientId);
  const policies = simulationData.policies.filter((item) => item.clientId === document.clientId);
  const renewal = simulationData.renewals.find((item) => item.clientId === document.clientId);
  const submission = simulationData.submissions.find((item) => item.clientId === document.clientId);
  const placement = simulationData.negotiations.find((item) => item.clientId === document.clientId);
  const claim = simulationData.claims.find((item) => item.clientId === document.clientId);
  const compliance = simulationData.compliance.find((item) => item.clientId === document.clientId);
  const tasks = simulationData.tasks.filter((item) => item.clientId === document.clientId);
  const activities = simulationData.activities.filter((item) => item.clientId === document.clientId || item.relatedModule === 'Documents');
  return { activities, claim, client, compliance, placement, policies, renewal, submission, tasks };
}

function getVersionHistory(document) {
  const uploadDate = document.uploadedDate ?? '2026-07-01';
  return [
    { version: '1.0', event: 'Requested', date: '2026-06-18', reviewer: userName('USR-009'), note: 'Initial support requirement created.' },
    { version: '1.1', event: document.uploadedDate ? 'Uploaded' : 'Reminder Sent', date: uploadDate, reviewer: userName('USR-009'), note: document.uploadedDate ? 'Client uploaded support file.' : 'Client reminder issued.' },
    { version: '1.2', event: document.status === 'Approved' ? 'Approved' : document.status === 'Needs Review' ? 'Pending Review' : 'Replacement Requested', date: asOfDate, reviewer: userName('USR-009'), note: document.status === 'Approved' ? 'Current version accepted.' : getRecommendedAction(document) },
  ];
}

function getRequestHistory(document, ownerId) {
  return [
    { id: `${document.id}-req`, activityType: 'Document Requested', summary: `${document.documentType} requested for ${document.requiredFor}.`, timestamp: '2026-06-18T09:30:00Z', importanceLevel: document.status === 'Missing' ? 'High' : 'Medium', userId: ownerId, clientId: document.clientId },
    { id: `${document.id}-reminder`, activityType: 'Reminder Sent', summary: document.status === 'Missing' ? 'Reminder sent to client contact.' : 'Review reminder sent internally.', timestamp: '2026-07-03T11:20:00Z', importanceLevel: 'Medium', userId: ownerId, clientId: document.clientId },
    { id: `${document.id}-current`, activityType: document.status === 'Approved' ? 'Evidence Approved' : document.status === 'Needs Review' ? 'Review Pending' : 'Replacement Requested', summary: getRecommendedAction(document), timestamp: '2026-07-09T14:10:00Z', importanceLevel: document.status === 'Missing' ? 'High' : 'Medium', userId: ownerId, clientId: document.clientId },
  ];
}

function enrichDocument(document) {
  const linked = getLinkedRecords(document);
  const client = linked.client ?? simulationData.clients[0];
  const category = getCategory(document);
  const workflow = getWorkflow(document);
  const ownerId = getOwner(document, client);
  const daysRemaining = daysUntil(document.expiryDate);
  const workflowStatus = getWorkflowStatus(document);
  const revenueImpact = getPotentialRevenueImpact(document, client, linked.renewal);
  const versionHistory = getVersionHistory(document);
  return {
    ...document,
    ...linked,
    category,
    currentVersion: versionHistory.at(-1)?.version ?? '1.0',
    daysRemaining,
    documentName: document.documentType,
    financialImpact: revenueImpact,
    lastUpdated: document.uploadedDate ?? '2026-07-09',
    owner: userById.get(ownerId),
    ownerId,
    pageCount: category === 'Policies' ? 18 : category === 'Claims Documentation' ? 7 : 4,
    recommendedAction: getRecommendedAction(document),
    requestHistory: getRequestHistory(document, ownerId),
    reviewDate: document.status === 'Approved' ? document.uploadedDate : null,
    reviewer: userById.get('USR-009'),
    size: category === 'Policies' ? '2.4 MB' : '840 KB',
    summary: `${document.documentType} is ${document.status.toLowerCase()} for ${client.name}. It is required for ${document.requiredFor} and ${workflowStatus.toLowerCase()} for the linked workflow.`,
    type: 'PDF',
    versionHistory,
    workflow,
    workflowStatus,
  };
}

function applyFilters(documents, filters) {
  const search = filters.search.trim().toLowerCase();
  return documents.filter((document) => {
    if (filters.savedView === 'renewal' && document.workflow !== 'Renewal') return false;
    if (filters.savedView === 'claims' && document.workflow !== 'Claims') return false;
    if (filters.savedView === 'compliance' && document.workflow !== 'Compliance') return false;
    if (filters.savedView === 'expiring' && document.daysRemaining > 31) return false;
    if (filters.savedView === 'missing' && document.status !== 'Missing') return false;
    if (filters.savedView === 'recent' && !document.uploadedDate) return false;
    if (filters.savedView === 'review' && document.status !== 'Needs Review') return false;
    if (filters.client !== 'all' && document.clientId !== filters.client) return false;
    if (filters.category !== 'all' && document.category !== filters.category) return false;
    if (filters.status !== 'all' && document.status !== filters.status) return false;
    if (filters.owner !== 'all' && document.ownerId !== filters.owner) return false;
    if (filters.expiry === '30' && document.daysRemaining > 30) return false;
    if (filters.expiry === 'expired' && document.daysRemaining >= 0) return false;
    if (filters.workflow !== 'all' && document.workflow !== filters.workflow) return false;
    if (search && !`${document.documentType} ${document.client?.name} ${document.category} ${document.status} ${document.requiredFor} ${document.id}`.toLowerCase().includes(search)) return false;
    return true;
  });
}

function SectionHeader({ title, text, action }) {
  return (
    <div className="document-section-header">
      <div>
        <h2>{title}</h2>
        {text ? <p>{text}</p> : null}
      </div>
      {action}
    </div>
  );
}

function DocumentSummary({ documents }) {
  const missing = documents.filter((document) => document.status === 'Missing');
  const pending = documents.filter((document) => document.status === 'Needs Review');
  const expiring = documents.filter((document) => document.daysRemaining >= 0 && document.daysRemaining <= 31);
  const expired = documents.filter((document) => document.daysRemaining < 0 || document.status === 'Expired');
  const blockers = documents.filter((document) => document.workflowStatus === 'Blocked' && ['Renewal', 'Submission', 'Market Placement'].includes(document.workflow));
  const claimsOutstanding = documents.filter((document) => document.workflow === 'Claims' && document.status !== 'Approved');
  const complianceOutstanding = documents.filter((document) => document.workflow === 'Compliance' && document.status !== 'Approved');
  const avgCompleteness = Math.round(documents.reduce((total, document) => total + (document.client?.documentCompleteness ?? 0), 0) / Math.max(1, documents.length));
  return (
    <section className="document-summary-grid" aria-label="Document Intelligence executive summary">
      <BusinessKpiCard icon={FileText} label="Total Documents" value={documents.length} helper="Shared document model" />
      <BusinessKpiCard icon={FileSearch} label="Pending Review" value={pending.length} helper="Needs Symphony review" tone="amber" />
      <BusinessKpiCard icon={AlertTriangle} label="Missing Documents" value={missing.length} helper="Waiting on client" tone="red" />
      <BusinessKpiCard icon={CalendarClock} label="Expiring Soon" value={expiring.length} helper="Within 31 days" tone="amber" />
      <BusinessKpiCard icon={FileClock} label="Expired Documents" value={expired.length} helper="Past expiry" tone="red" />
      <BusinessKpiCard icon={ShieldCheck} label="Renewal Blockers" value={blockers.length} helper="Blocking revenue workflows" tone="red" />
      <BusinessKpiCard icon={FolderOpen} label="Claims Outstanding" value={claimsOutstanding.length} helper="Claim support files" />
      <BusinessKpiCard icon={BadgeCheck} label="Compliance Evidence" value={complianceOutstanding.length} helper="Open evidence items" tone="amber" />
      <BusinessKpiCard icon={CheckCircle2} label="Avg Completeness" value={`${avgCompleteness}%`} helper="Client document health" tone="green" />
      <BusinessKpiCard icon={Send} label="Client Requests" value={missing.length + pending.length} helper="Waiting or under review" tone="amber" />
    </section>
  );
}

function FilterBar({ documents, filters, setFilters }) {
  const clients = simulationData.clients;
  const statuses = Array.from(new Set(documents.map((document) => document.status))).sort();
  const owners = Array.from(new Map(documents.map((document) => [document.ownerId, document.owner])).values()).filter(Boolean);
  const workflows = Array.from(new Set(documents.map((document) => document.workflow))).sort();
  function update(key, value) {
    setFilters((current) => ({ ...current, [key]: value }));
  }
  return (
    <section className="document-filter-card" aria-label="Document filters">
      <label><span>Saved View</span><select value={filters.savedView} onChange={(event) => update('savedView', event.target.value)}>{savedViews.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <label><span>Client</span><select value={filters.client} onChange={(event) => update('client', event.target.value)}><option value="all">All Clients</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}</select></label>
      <label><span>Category</span><select value={filters.category} onChange={(event) => update('category', event.target.value)}><option value="all">All Categories</option>{documentCategories.map((category) => <option key={category} value={category}>{category}</option>)}</select></label>
      <label><span>Status</span><select value={filters.status} onChange={(event) => update('status', event.target.value)}><option value="all">Any Status</option>{statuses.map((status) => <option key={status} value={status}>{status}</option>)}</select></label>
      <label><span>Owner</span><select value={filters.owner} onChange={(event) => update('owner', event.target.value)}><option value="all">All Owners</option>{owners.map((owner) => <option key={owner.id} value={owner.id}>{owner.name}</option>)}</select></label>
      <label><span>Expiry</span><select value={filters.expiry} onChange={(event) => update('expiry', event.target.value)}><option value="all">Any Expiry</option><option value="30">Within 30 Days</option><option value="expired">Expired</option></select></label>
      <label><span>Workflow</span><select value={filters.workflow} onChange={(event) => update('workflow', event.target.value)}><option value="all">All Workflows</option>{workflows.map((workflow) => <option key={workflow} value={workflow}>{workflow}</option>)}</select></label>
      <label className="document-filter-card__search"><span>Search</span><div><Search size={16} /><input value={filters.search} onChange={(event) => update('search', event.target.value)} placeholder="Document, client, category..." /></div></label>
    </section>
  );
}

function AttentionQueue({ documents, selectedId, onSelect }) {
  const attention = documents
    .filter((document) => document.status !== 'Approved' || document.workflowStatus !== 'Ready')
    .sort((a, b) => b.financialImpact - a.financialImpact || a.daysRemaining - b.daysRemaining)
    .slice(0, 9);
  return (
    <section className="document-attention-grid">
      {attention.map((document) => (
        <button key={document.id} type="button" className={selectedId === document.id ? 'document-attention-card document-attention-card--active' : 'document-attention-card'} onClick={() => onSelect(document.id)}>
          <div>
            <span>{document.category}</span>
            <strong>{document.documentName}</strong>
            <small>{document.client?.name}</small>
          </div>
          <DocumentStatusBadge status={document.status} />
          <dl>
            <div><dt>Owner</dt><dd>{document.owner?.name ?? 'Unassigned'}</dd></div>
            <div><dt>Required For</dt><dd>{document.requiredFor}</dd></div>
            <div><dt>Expiry</dt><dd>{formatDate(document.expiryDate)}</dd></div>
          </dl>
          <p>{document.businessImpact}</p>
          <RevenueImpactLabel value={compactCurrency(document.financialImpact)} label="Revenue at risk" />
          <em>{document.recommendedAction}</em>
        </button>
      ))}
    </section>
  );
}

function CategoryGrid({ documents, selectedCategory, onSelect }) {
  return (
    <section className="document-category-grid">
      {documentCategories.map((category) => {
        const scoped = documents.filter((document) => document.category === category);
        const missing = scoped.filter((document) => document.status === 'Missing').length;
        const pending = scoped.filter((document) => document.status === 'Needs Review').length;
        const approved = scoped.filter((document) => document.status === 'Approved').length;
        return (
          <button key={category} type="button" className={selectedCategory === category ? 'document-category-card document-category-card--active' : 'document-category-card'} onClick={() => onSelect(category)}>
            <strong>{category}</strong>
            <span>{scoped.length} documents</span>
            <dl>
              <div><dt>Approved</dt><dd>{approved}</dd></div>
              <div><dt>Missing</dt><dd>{missing}</dd></div>
              <div><dt>Review</dt><dd>{pending}</dd></div>
            </dl>
          </button>
        );
      })}
    </section>
  );
}

function DocumentRelationships({ document }) {
  const relationships = [
    ['Client', document.client?.name, `/clients/${document.clientId}`],
    ['Policy', document.policies[0]?.policyType ?? 'No linked policy', `/clients/${document.clientId}`],
    ['Renewal', document.renewal ? `${document.renewal.currentStage} / ${document.renewal.daysToExpiry} days` : 'No active renewal', document.renewal ? `/renewals/${document.renewal.id}` : '/renewals'],
    ['Submission', document.submission ? `${document.submission.completionPercent}% complete` : 'No submission', document.submission ? `/submissions/${document.submission.id}` : '/submissions'],
    ['Placement', document.placement ? document.placement.currentStatus : 'No placement', document.placement ? `/market-placement/${document.placement.id}` : '/market-placement'],
    ['Claim', document.claim ? `${document.claim.id} / ${document.claim.status}` : 'No claim', document.claim ? `/claims/${document.claim.id}` : '/claims'],
    ['Compliance', document.compliance ? `${document.compliance.findingType} / ${document.compliance.status}` : 'No finding', document.compliance ? `/compliance/${document.compliance.id}` : '/compliance'],
    ['Tasks', `${document.tasks.length} tasks`, `/clients/${document.clientId}`],
    ['Activities', `${document.activities.length} activities`, `/clients/${document.clientId}`],
  ];
  return (
    <div className="document-relationship-grid">
      {relationships.map(([label, value, route]) => (
        <Link key={label} to={route}>
          <span>{label}</span>
          <strong>{value}</strong>
          <ArrowRight size={14} />
        </Link>
      ))}
    </div>
  );
}

function VersionHistory({ document }) {
  return (
    <div className="document-version-list">
      {document.versionHistory.map((item) => (
        <article key={`${document.id}-${item.version}`}>
          <strong>Version {item.version}</strong>
          <span>{item.event}</span>
          <p>{item.note}</p>
          <small>{formatDate(item.date)} / {item.reviewer}</small>
        </article>
      ))}
    </div>
  );
}

function ReviewStatus({ document, localStatus }) {
  const statuses = ['Uploaded', 'Pending Review', 'Reviewed', 'Approved', 'Superseded', 'Expired', 'Rejected'];
  const active = localStatus ?? (document.status === 'Approved' ? 'Approved' : document.status === 'Needs Review' ? 'Pending Review' : document.status === 'Missing' ? 'Uploaded' : document.status);
  return (
    <div className="document-review-status">
      {statuses.map((status) => (
        <span key={status} className={active === status ? 'document-review-status__active' : ''}>{status}</span>
      ))}
    </div>
  );
}

function ExpiryIndicator({ document }) {
  const urgent = document.daysRemaining < 0 || document.daysRemaining <= 30;
  return (
    <section className={`document-expiry-card ${urgent ? 'document-expiry-card--urgent' : ''}`}>
      <span>Expiry Monitoring</span>
      <strong>{document.daysRemaining < 0 ? 'Expired' : `${document.daysRemaining} days remaining`}</strong>
      <p>{urgent ? `${document.documentName} requires action before the linked workflow proceeds.` : 'Expiry does not currently block the linked workflow.'}</p>
      <dl>
        <div><dt>Renewal Impact</dt><dd>{document.workflow === 'Renewal' || document.workflow === 'Market Placement' ? 'High' : 'Moderate'}</dd></div>
        <div><dt>Compliance Impact</dt><dd>{document.workflow === 'Compliance' ? 'High' : 'Low'}</dd></div>
        <div><dt>Priority</dt><dd>{document.workflowStatus}</dd></div>
      </dl>
    </section>
  );
}

function PreviewPanel({ document, onAction }) {
  return (
    <section className="document-preview-card">
      <div className="document-preview-card__thumb">
        <FileText size={42} />
        <span>{document.type}</span>
      </div>
      <dl>
        <div><dt>Pages</dt><dd>{document.pageCount}</dd></div>
        <div><dt>Size</dt><dd>{document.size}</dd></div>
        <div><dt>Owner</dt><dd>{document.owner?.name ?? 'Unassigned'}</dd></div>
        <div><dt>Version</dt><dd>{document.currentVersion}</dd></div>
      </dl>
      <p>{document.summary}</p>
      <div className="document-preview-actions">
        {[
          ['Open', Eye],
          ['Download', Download],
          ['Print', Printer],
          ['Preview', FileSearch],
        ].map(([label, Icon]) => (
          <button key={label} type="button" onClick={() => onAction(label)}>
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>
    </section>
  );
}

function RequestCentre({ documents, onAction }) {
  const requests = documents
    .filter((document) => document.status === 'Missing' || document.status === 'Needs Review')
    .slice(0, 8);
  return (
    <section className="document-card">
      <SectionHeader title="Document Request Centre" text="Outstanding requests waiting on clients or internal review." />
      <div className="document-request-list">
        {requests.map((document, index) => (
          <article key={`request-${document.id}`}>
            <div>
              <strong>{document.documentName}</strong>
              <span>{document.client?.name} / requested by {document.owner?.name}</span>
            </div>
            <p>{document.businessImpact}</p>
            <dl>
              <div><dt>Required For</dt><dd>{document.requiredFor}</dd></div>
              <div><dt>Due Date</dt><dd>{formatDate(document.expiryDate)}</dd></div>
              <div><dt>Status</dt><dd>{document.status}</dd></div>
              <div><dt>Reminders</dt><dd>{index % 3}</dd></div>
            </dl>
            <div>
              {['Send Reminder', 'Cancel', 'Mark Received'].map((action) => (
                <button key={action} type="button" onClick={() => onAction(`${action}: ${document.documentName}`)}>{action}</button>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function WorkflowView({ documents }) {
  return (
    <section className="document-card">
      <SectionHeader title="Business Workflow View" text="How document readiness connects to operational workflows and revenue impact." />
      <div className="document-workflow-list">
        {documents.filter((document) => document.workflowStatus !== 'Ready').slice(0, 8).map((document) => (
          <article key={`workflow-${document.id}`}>
            <strong>{document.documentName}</strong>
            <ArrowRight size={16} />
            <span>{document.workflow}</span>
            <ArrowRight size={16} />
            <em>{document.workflowStatus}</em>
            <ArrowRight size={16} />
            <p>{compactCurrency(document.financialImpact)} revenue at risk</p>
            <ArrowRight size={16} />
            <small>{document.recommendedAction}</small>
          </article>
        ))}
      </div>
    </section>
  );
}

function ClientCompleteness({ documents }) {
  const rows = simulationData.clients.map((client) => {
    const scoped = documents.filter((document) => document.clientId === client.id);
    return {
      client,
      required: scoped.length,
      outstanding: scoped.filter((document) => document.status !== 'Approved').length,
      risk: scoped.some((document) => document.status === 'Missing') || client.documentCompleteness < 75 ? 'High' : scoped.some((document) => document.status === 'Needs Review') ? 'Elevated' : 'Guarded',
    };
  }).sort((a, b) => a.client.documentCompleteness - b.client.documentCompleteness).slice(0, 8);
  return (
    <section className="document-card">
      <SectionHeader title="Client Document Completeness" text="Clients with document gaps that may affect workflows." />
      <div className="document-client-completeness">
        {rows.map((row) => (
          <Link key={row.client.id} to={`/clients/${row.client.id}`}>
            <strong>{row.client.name}</strong>
            <span>{row.client.documentCompleteness}% complete</span>
            <em>{row.outstanding}/{row.required} outstanding</em>
            <small>{row.risk} business risk</small>
          </Link>
        ))}
      </div>
    </section>
  );
}

function RecentDocumentActivity({ documents }) {
  const activities = documents.slice(0, 8).map((document, index) => ({
    id: `doc-activity-${document.id}`,
    clientId: document.clientId,
    userId: document.ownerId,
    timestamp: `2026-07-09T${14 - index}:2${index}:00Z`,
    activityType: document.status === 'Approved' ? 'Review Completed' : document.status === 'Needs Review' ? 'Review Pending' : 'Reminder Sent',
    summary: `${document.documentName}: ${document.recommendedAction}`,
    relatedModule: 'Documents',
    importanceLevel: document.workflowStatus === 'Blocked' ? 'High' : 'Medium',
  }));
  return (
    <section className="document-card">
      <SectionHeader title="Recent Document Activity" text="Recent uploads, reminders, reviews, expiry alerts and evidence approvals." />
      <BusinessActivityTimeline activities={activities} getClientName={(clientId) => clientById.get(clientId)?.name ?? 'Client'} formatTime={(timestamp) => timeFormatter.format(new Date(timestamp))} />
    </section>
  );
}

function DocumentDetail({ document, localReviewStatus, onAction, setLocalReviewStatus }) {
  const relationships = document;
  return (
    <section className="document-detail-stack" id="document-detail">
      <header className="document-detail-hero">
        <div>
          <span>Document Detail</span>
          <h2>{document.documentName}</h2>
          <p>{document.client?.name} / {document.category} / {document.workflow}</p>
        </div>
        <DocumentStatusBadge status={document.status} />
      </header>

      <div className="document-detail-meta">
        <div><span>Owner</span><strong>{document.owner?.name ?? 'Unassigned'}</strong></div>
        <div><span>Last Updated</span><strong>{formatDate(document.lastUpdated)}</strong></div>
        <div><span>Expiry Date</span><strong>{formatDate(document.expiryDate)}</strong></div>
        <div><span>Linked Workflow</span><strong>{document.workflow}</strong></div>
        <div><span>Version</span><strong>{document.currentVersion}</strong></div>
      </div>

      <section className="document-card">
        <SectionHeader title="Document Overview" text="Document metadata and linked workflow context." />
        <div className="document-overview-grid">
          <div><dt>Document Type</dt><dd>{document.documentType}</dd></div>
          <div><dt>Status</dt><dd>{document.status}</dd></div>
          <div><dt>Upload Date</dt><dd>{formatDate(document.uploadedDate)}</dd></div>
          <div><dt>Review Date</dt><dd>{formatDate(document.reviewDate)}</dd></div>
          <div><dt>Required For</dt><dd>{document.requiredFor}</dd></div>
          <div><dt>Linked Client</dt><dd>{document.client?.name}</dd></div>
          <div><dt>Renewal</dt><dd>{relationships.renewal?.id ?? 'Not linked'}</dd></div>
          <div><dt>Submission</dt><dd>{relationships.submission?.id ?? 'Not linked'}</dd></div>
          <div><dt>Compliance</dt><dd>{relationships.compliance?.id ?? 'Not linked'}</dd></div>
        </div>
      </section>

      <section className="document-detail-layout">
        <div className="document-detail-main">
          <section className="document-card document-business-impact-card">
            <SectionHeader title="Business Impact" text="Why this document matters to the business workflow." />
            <p>{document.businessImpact}</p>
            <dl>
              <div><dt>Workflow Depends On</dt><dd>{document.workflow}</dd></div>
              <div><dt>Financial Impact</dt><dd>{compactCurrency(document.financialImpact)}</dd></div>
              <div><dt>Operational Impact</dt><dd>{document.workflowStatus}</dd></div>
              <div><dt>Responsible Owner</dt><dd>{document.owner?.name ?? 'Unassigned'}</dd></div>
              <div><dt>Recommended Action</dt><dd>{document.recommendedAction}</dd></div>
            </dl>
          </section>

          <section className="document-card">
            <SectionHeader title="Document Relationships" text="Linked objects from the shared JSON business model." />
            <DocumentRelationships document={document} />
          </section>

          <section className="document-card">
            <SectionHeader title="Version History" text="Simulated version metadata only. No document diffing." />
            <VersionHistory document={document} />
          </section>

          <section className="document-card">
            <SectionHeader title="Request History" text="Document request, reminder, upload and review timeline." />
            <BusinessActivityTimeline activities={document.requestHistory} getClientName={(clientId) => clientById.get(clientId)?.name ?? 'Client'} formatTime={(timestamp) => timeFormatter.format(new Date(timestamp))} />
          </section>
        </div>

        <aside className="document-detail-side">
          <PreviewPanel document={document} onAction={onAction} />
          <section className="document-card">
            <SectionHeader title="Review Status" />
            <ReviewStatus document={document} localStatus={localReviewStatus} />
            <div className="document-quick-actions">
              {['Mark Reviewed', 'Approve', 'Reject', 'Flag Issue', 'Assign Reviewer', 'Create Task', 'Link To Workflow'].map((action) => (
                <button
                  key={action}
                  type="button"
                  onClick={() => {
                    if (action === 'Approve') setLocalReviewStatus('Approved');
                    else if (action === 'Reject') setLocalReviewStatus('Rejected');
                    else if (action === 'Mark Reviewed') setLocalReviewStatus('Reviewed');
                    onAction(action);
                  }}
                >
                  {action}
                </button>
              ))}
            </div>
          </section>
          <ExpiryIndicator document={document} />
          <section className="document-card">
            <SectionHeader title="Document Summary" />
            <p className="document-detail-summary">{document.summary}</p>
            <strong className="document-detail-issue">{document.status === 'Approved' ? 'Outstanding Issue: none recorded.' : `Outstanding Issue: ${document.recommendedAction}`}</strong>
          </section>
          <section className="document-card">
            <SectionHeader title="Related Workspaces" />
            <div className="document-related-links">
              <Link to={document.renewal ? `/renewals/${document.renewal.id}` : '/renewals'}>Renewal</Link>
              <Link to={document.submission ? `/submissions/${document.submission.id}` : '/submissions'}>Submission</Link>
              <Link to={document.placement ? `/market-placement/${document.placement.id}` : '/market-placement'}>Market Placement</Link>
              <Link to={document.claim ? `/claims/${document.claim.id}` : '/claims'}>Claims</Link>
              <Link to={document.compliance ? `/compliance/${document.compliance.id}` : '/compliance'}>Compliance</Link>
              <Link to={`/clients/${document.clientId}`}>Client 360</Link>
              <Link to="/">Executive Overview</Link>
            </div>
          </section>
        </aside>
      </section>
    </section>
  );
}

export function DocumentIntelligenceHub() {
  const { documentId } = useParams();
  const [searchParams] = useSearchParams();
  const initialClientId = searchParams.get('clientId') ?? 'all';
  const [filters, setFilters] = useState({
    category: 'all',
    client: initialClientId,
    expiry: 'all',
    owner: 'all',
    savedView: 'all',
    search: '',
    status: 'all',
    workflow: 'all',
  });
  const [selectedDocumentId, setSelectedDocumentId] = useState(documentId ?? searchParams.get('documentId') ?? searchParams.get('id') ?? '');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [localReviewStatus, setLocalReviewStatus] = useState('');
  const [actionLog, setActionLog] = useState([]);

  const documents = useMemo(() => simulationData.documents.map(enrichDocument), []);
  const filteredDocuments = useMemo(() => {
    const nextFilters = selectedCategory !== 'all' ? { ...filters, category: selectedCategory } : filters;
    return applyFilters(documents, nextFilters);
  }, [documents, filters, selectedCategory]);
  const selectedDocument = documents.find((document) => document.id === (documentId ?? selectedDocumentId)) ?? filteredDocuments[0] ?? documents[0];

  function handleAction(action) {
    setActionLog((current) => [`${action} simulated for ${selectedDocument.documentName}`, ...current].slice(0, 5));
  }

  return (
    <div className="document-workspace page-transition">
      <section className="document-hero">
        <div>
          <span>Document Intelligence Hub</span>
          <h1>Understand what documents exist, what is missing, and what business work is blocked.</h1>
          <p>Central document intelligence for renewals, submissions, market placement, claims, compliance and Client 360.</p>
        </div>
        <RevenueImpactLabel value={compactCurrency(getSum(filteredDocuments.map((document) => ({ value: document.financialImpact })), 'value'))} label="Visible revenue impact" />
      </section>

      <DocumentSummary documents={documents} />
      <FilterBar documents={documents} filters={filters} setFilters={setFilters} />

      <section className="document-section">
        <SectionHeader title="Documents Requiring Attention" text="Primary operational queue ranked by workflow impact, status and revenue exposure." action={<span className="document-count">{filteredDocuments.length} documents</span>} />
        <AttentionQueue documents={filteredDocuments} selectedId={selectedDocument.id} onSelect={setSelectedDocumentId} />
      </section>

      <section className="document-section">
        <SectionHeader title="Document Categories" text="Document health by business category. Select a category to filter the queue." />
        <CategoryGrid documents={documents} selectedCategory={selectedCategory} onSelect={(category) => setSelectedCategory((current) => current === category ? 'all' : category)} />
      </section>

      <DocumentDetail document={selectedDocument} localReviewStatus={localReviewStatus} onAction={handleAction} setLocalReviewStatus={setLocalReviewStatus} />

      <section className="document-grid-two">
        <RequestCentre documents={filteredDocuments} onAction={handleAction} />
        <WorkflowView documents={filteredDocuments} />
      </section>

      <section className="document-grid-two">
        <ClientCompleteness documents={documents} />
        <RecentDocumentActivity documents={filteredDocuments} />
      </section>

      {actionLog.length ? (
        <section className="document-action-log">
          {actionLog.map((entry) => <span key={entry}>{entry}</span>)}
        </section>
      ) : null}
    </div>
  );
}
