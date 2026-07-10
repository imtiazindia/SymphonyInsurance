import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  FileCheck2,
  Search,
  ShieldCheck,
} from 'lucide-react';
import {
  BusinessActivityTimeline,
  BusinessKpiCard,
  DocumentStatusBadge,
  RevenueImpactLabel,
} from '../components/BusinessComponents.jsx';
import { simulationData } from '../data/demoData.js';
import { getClaimsExposure, getSum } from '../utils/businessCalculations.js';

const dateFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
const timeFormatter = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', month: 'short', day: 'numeric' });
const compactCurrencyFormatter = new Intl.NumberFormat('en-US', {
  currency: 'USD',
  maximumFractionDigits: 1,
  notation: 'compact',
  style: 'currency',
});

const clientsById = new Map(simulationData.clients.map((client) => [client.id, client]));
const usersById = new Map(simulationData.teamMembers.map((user) => [user.id, user]));

const requiredDocuments = [
  { label: 'Aircraft Schedule', match: ['aircraft schedule'] },
  { label: 'Pilot Roster', match: ['pilot roster', 'instructor roster'] },
  { label: 'Loss Runs', match: ['loss runs', 'claims history'] },
  { label: 'Safety Manual', match: ['safety manual', 'safety controls'] },
  { label: 'Maintenance Program', match: ['maintenance program', 'quality manual'] },
  { label: 'Hangar Agreements', match: ['hangar', 'lease'] },
  { label: 'Emergency Response Plan', match: ['emergency response'] },
  { label: 'Prior Policies', match: ['prior policies', 'policy'] },
  { label: 'Certificates', match: ['certificate', 'certificates'] },
];

function compactCurrency(value) {
  return compactCurrencyFormatter.format(value || 0).replace('.0', '');
}

function formatDate(date) {
  if (!date) return 'Not set';
  if (date instanceof Date) return dateFormatter.format(date);
  return dateFormatter.format(new Date(`${date}T00:00:00Z`));
}

function clientName(clientId) {
  return clientsById.get(clientId)?.name ?? 'Unassigned client';
}

function userName(userId) {
  return usersById.get(userId)?.name ?? 'Unassigned';
}

function roleOwner(role) {
  return simulationData.teamMembers.find((member) => member.role === role)?.name ?? role;
}

function statusCompletion(status) {
  if (['Complete', 'Approved', 'Ready for Market', 'Not Applicable'].includes(status)) return 100;
  if (['Needs Review', 'In Review', 'Detailed Review'].includes(status)) return 72;
  if (['Needs Narrative', 'Data Request Pending'].includes(status)) return 58;
  if (['Missing', 'Missing Information'].includes(status)) return 34;
  return 64;
}

function readinessCategory(percent) {
  if (percent >= 90) return 'Ready for Market';
  if (percent >= 78) return 'Nearly Ready';
  return 'Not Ready';
}

function readinessTone(percent) {
  if (percent >= 90) return 'green';
  if (percent >= 78) return 'amber';
  return 'red';
}

function documentForLabel(documents, label) {
  const config = requiredDocuments.find((item) => item.label === label);
  return documents.find((document) => config?.match.some((term) => document.documentType.toLowerCase().includes(term)));
}

function getSubmissionBundle(submission) {
  const client = clientsById.get(submission.clientId);
  const renewal = simulationData.renewals.find((item) => item.clientId === submission.clientId);
  const policies = simulationData.policies.filter((item) => item.clientId === submission.clientId);
  const documents = simulationData.documents.filter((item) => item.clientId === submission.clientId);
  const claims = simulationData.claims.filter((item) => item.clientId === submission.clientId);
  const compliance = simulationData.compliance.filter((item) => item.clientId === submission.clientId);
  const tasks = simulationData.tasks.filter((item) => item.clientId === submission.clientId && ['Submissions', 'Renewals', 'Compliance'].includes(item.relatedModule));
  const activities = simulationData.activities.filter((item) => item.clientId === submission.clientId);

  return {
    activities,
    claims,
    client,
    compliance,
    documents,
    policies,
    renewal,
    submission,
    tasks,
  };
}

function buildReadinessCards(bundle) {
  const { client, claims, compliance, documents, policies, submission } = bundle;
  const claimExposure = getClaimsExposure(claims);
  const lossRunDoc = documentForLabel(documents, 'Loss Runs');
  const aircraftDoc = documentForLabel(documents, 'Aircraft Schedule');
  const safetyDoc = documentForLabel(documents, 'Safety Manual');
  const maintenanceDoc = documentForLabel(documents, 'Maintenance Program');

  return [
    {
      title: 'Aircraft Schedule',
      status: submission.aircraftScheduleStatus,
      completion: statusCompletion(submission.aircraftScheduleStatus),
      missingItems: submission.aircraftScheduleStatus === 'Complete' ? [] : ['Current aircraft schedule'],
      impact: 'Confirms insured aircraft, hull values, utilization, and key exposure assumptions.',
      owner: userName(client.assignedAccountManagerId),
      nextAction: aircraftDoc?.status === 'Needs Review' ? 'Review aircraft values' : 'Request updated aircraft schedule',
    },
    {
      title: 'Pilot Roster',
      status: submission.pilotRosterStatus,
      completion: statusCompletion(submission.pilotRosterStatus),
      missingItems: ['Complete', 'Not Applicable'].includes(submission.pilotRosterStatus) ? [] : ['Pilot roster and recurrent training evidence'],
      impact: 'Helps underwriters assess experience, training discipline, and pilot qualification controls.',
      owner: roleOwner('Submission Specialist'),
      nextAction: 'Validate pilot roster and training dates',
    },
    {
      title: 'Claims History',
      status: submission.claimsHistoryStatus,
      completion: Math.min(100, statusCompletion(submission.claimsHistoryStatus) + (claimExposure.requiringReview ? -8 : 0)),
      missingItems: submission.claimsHistoryStatus === 'Complete' ? [] : ['Loss narrative and current reserve position'],
      impact: 'Clean claim context improves underwriting confidence and avoids avoidable pricing load.',
      owner: roleOwner('Claims Coordinator'),
      nextAction: claimExposure.requiringReview ? 'Escalate open claim before submitting' : 'Attach final loss narrative',
    },
    {
      title: 'Safety Controls',
      status: submission.safetyControlsStatus,
      completion: statusCompletion(submission.safetyControlsStatus),
      missingItems: submission.safetyControlsStatus === 'Complete' ? [] : ['Safety controls evidence'],
      impact: 'Positions the client around discipline, risk management, and loss prevention.',
      owner: roleOwner('Submission Specialist'),
      nextAction: safetyDoc?.status === 'Needs Review' ? 'Review safety manual' : 'Confirm safety controls summary',
    },
    {
      title: 'Maintenance Records',
      status: submission.maintenanceRecordsStatus,
      completion: statusCompletion(submission.maintenanceRecordsStatus),
      missingItems: submission.maintenanceRecordsStatus === 'Complete' ? [] : ['Maintenance program revision'],
      impact: 'Supports airworthiness, reliability, and underwriter comfort with operational controls.',
      owner: roleOwner('Document Specialist'),
      nextAction: maintenanceDoc?.status === 'Needs Review' ? 'Review maintenance program' : 'Request updated maintenance program',
    },
    {
      title: 'Contracts / Leases',
      status: client.documentCompleteness >= 88 ? 'Complete' : 'Needs Review',
      completion: client.documentCompleteness,
      missingItems: client.documentCompleteness >= 88 ? [] : ['Contract schedule or lease summary'],
      impact: 'Clarifies indemnity terms, additional insured obligations, and contractual exposures.',
      owner: userName(client.assignedAccountManagerId),
      nextAction: 'Confirm contract and lease obligations',
    },
    {
      title: 'Compliance Items',
      status: compliance.some((item) => item.status === 'Overdue') ? 'Open' : 'Complete',
      completion: compliance.some((item) => item.status === 'Overdue') ? 48 : client.complianceScore,
      missingItems: compliance.filter((item) => item.status !== 'Closed').map((item) => item.findingType),
      impact: compliance[0]?.businessImpact ?? 'Compliance posture is ready for underwriting review.',
      owner: roleOwner('Compliance Coordinator'),
      nextAction: compliance.find((item) => item.status !== 'Closed')?.correctiveAction ?? 'Confirm compliance packet',
    },
    {
      title: 'Financial / Premium History',
      status: policies.length ? 'Complete' : 'Needs Review',
      completion: policies.length ? 94 : 60,
      missingItems: policies.length ? [] : ['Expiring premium summary'],
      impact: 'Gives markets clean premium context and supports renewal pricing discipline.',
      owner: userName(client.assignedPlacementLeadId),
      nextAction: 'Validate expiring premium and commission summary',
    },
  ];
}

function buildChecklist(bundle) {
  return requiredDocuments.map((item) => {
    const document = documentForLabel(bundle.documents, item.label);
    return {
      id: document?.id ?? `${bundle.submission.id}-${item.label}`,
      businessImpact: document?.businessImpact ?? 'Required to complete the insurer-facing submission package',
      documentType: item.label,
      expiryDate: document?.expiryDate,
      missingReason: document?.missingReason || 'Not yet uploaded to the workspace',
      status: document?.status ?? 'Missing',
      uploadedDate: document?.uploadedDate,
    };
  });
}

function buildConsiderations(bundle) {
  const considerations = [];
  const { claims, client, compliance, documents, submission } = bundle;

  if (submission.pilotRosterStatus !== 'Complete' && submission.pilotRosterStatus !== 'Not Applicable') {
    considerations.push(['Incomplete pilot data', 'Carrier questions are likely until the roster and training dates are validated.', 'amber']);
  }
  if (client.clientType.includes('School') || client.clientType.includes('Flight')) {
    considerations.push(['Training operation exposure', 'Position instructor oversight, recurrent training, and student supervision standards clearly.', 'blue']);
  }
  if (submission.maintenanceRecordsStatus !== 'Complete') {
    considerations.push(['Maintenance revision open', 'Maintenance records should be reviewed before releasing the package.', 'amber']);
  }
  const openCompliance = compliance.find((item) => item.status !== 'Closed');
  if (openCompliance) {
    considerations.push(['Open compliance finding', `${openCompliance.findingType} may create subjectivities if unresolved.`, openCompliance.severity === 'High' ? 'red' : 'amber']);
  }
  const openClaim = claims.find((claim) => claim.executiveReviewRequired || claim.status === 'Executive Review');
  if (openClaim) {
    considerations.push(['Unresolved claim', `${openClaim.claimType} requires concise loss narrative and reserve context.`, 'red']);
  }
  if (submission.safetyControlsStatus === 'Complete') {
    considerations.push(['Strong safety program', 'Use the safety controls summary as a positive differentiator in market outreach.', 'green']);
  }
  if (claims.length === 0 || submission.claimsHistoryStatus === 'Complete') {
    considerations.push(['Clean loss history context', 'Loss history is sufficiently organized for insurer review.', 'green']);
  }
  if (documents.some((document) => document.status === 'Missing')) {
    considerations.push(['Document gap remains', 'The package should call out any exclusions if released before all files are received.', 'amber']);
  }

  return considerations.slice(0, 8).map(([title, detail, tone]) => ({ detail, title, tone }));
}

function buildRecommendations(bundle, readinessCards) {
  const recommendations = [];
  const { claims, compliance, submission } = bundle;

  if (submission.maintenanceRecordsStatus !== 'Complete') {
    recommendations.push('Request updated maintenance program');
  }
  if (submission.safetyControlsStatus !== 'Complete') {
    recommendations.push('Proceed to market after safety manual review');
  }
  if (claims.some((claim) => claim.executiveReviewRequired)) {
    recommendations.push('Escalate open claim before submitting');
  }
  if (submission.safetyControlsStatus === 'Complete') {
    recommendations.push('Highlight strong recurrent training program');
  }
  if (compliance.some((item) => item.status === 'Overdue')) {
    recommendations.push('Close overdue compliance item before sending to insurers');
  }
  if (readinessCards.every((card) => card.completion >= 80)) {
    recommendations.push('Prepare final insurer distribution list');
  }

  return Array.from(new Set(recommendations)).slice(0, 5);
}

function SubmissionSelector({ submissions, activeId }) {
  const [query, setQuery] = useState('');
  const visible = submissions
    .map((submission) => ({ submission, client: clientsById.get(submission.clientId) }))
    .filter((item) => item.client?.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <aside className="submission-selector">
      <div className="submission-selector__search">
        <Search size={16} />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search submissions" />
      </div>
      <div className="submission-selector__list">
        {visible.map(({ client, submission }) => (
          <Link key={submission.id} to={`/submissions/${submission.id}`} className={submission.id === activeId ? 'submission-selector__item submission-selector__item--active' : 'submission-selector__item'}>
            <strong>{client.name}</strong>
            <span>{submission.completionPercent}% / {readinessCategory(submission.completionPercent)}</span>
          </Link>
        ))}
      </div>
    </aside>
  );
}

function SubmissionSummary({ bundle, readinessCards }) {
  const { client, renewal, submission } = bundle;
  const specialist = simulationData.teamMembers.find((member) => member.role === 'Submission Specialist' && member.assignedClients.includes(client.id))
    ?? simulationData.teamMembers.find((member) => member.role === 'Submission Specialist');
  const targetDate = new Date(`${renewal?.expiryDate ?? client.renewalDate}T00:00:00Z`);
  targetDate.setDate(targetDate.getDate() - 30);
  const readyCount = readinessCards.filter((card) => card.completion >= 90).length;

  return (
    <section className="submission-summary-grid">
      <BusinessKpiCard icon={BriefcaseBusiness} label="Client" value={client.name} helper={client.clientType} />
      <BusinessKpiCard icon={CalendarDays} label="Target Market Date" value={formatDate(targetDate)} helper={`Renewal linked: ${renewal?.id ?? 'None'}`} />
      <BusinessKpiCard icon={ClipboardCheck} label="Completion" value={`${submission.completionPercent}%`} helper={readinessCategory(submission.completionPercent)} tone={readinessTone(submission.completionPercent)} />
      <BusinessKpiCard icon={BadgeCheck} label="Current Status" value={submission.status} helper="Submission workflow" />
      <BusinessKpiCard icon={FileCheck2} label="Ready Sections" value={`${readyCount} / ${readinessCards.length}`} helper="Insurer package components" tone={readyCount >= 6 ? 'green' : 'amber'} />
      <BusinessKpiCard icon={ShieldCheck} label="Submission Specialist" value={specialist?.name ?? 'Unassigned'} helper={`Account Manager: ${userName(client.assignedAccountManagerId)}`} />
    </section>
  );
}

function SubmissionReadiness({ cards }) {
  return (
    <section className="submission-card">
      <SectionHeader title="Submission Readiness" text="Core underwriting inputs required to release a clean insurer-ready package." />
      <div className="submission-readiness-grid">
        {cards.map((card) => (
          <article className="submission-readiness-card" key={card.title}>
            <div>
              <strong>{card.title}</strong>
              <DocumentStatusBadge status={card.status} />
            </div>
            <ProgressBar value={card.completion} />
            <dl>
              <div><dt>Missing Items</dt><dd>{card.missingItems.length ? card.missingItems.join(', ') : 'None'}</dd></div>
              <div><dt>Business Impact</dt><dd>{card.impact}</dd></div>
              <div><dt>Owner</dt><dd>{card.owner}</dd></div>
              <div><dt>Next Action</dt><dd>{card.nextAction}</dd></div>
            </dl>
          </article>
        ))}
      </div>
    </section>
  );
}

function RiskStory({ bundle }) {
  const { claims, client, compliance, policies, submission } = bundle;
  const premium = getSum(policies, 'premium') || client.annualPremium;
  const policyTypes = policies.map((policy) => policy.policyType).slice(0, 4).join(', ');
  const claimExposure = getClaimsExposure(claims);
  const strengths = [
    client.complianceScore >= 90 ? 'strong compliance posture' : 'active compliance ownership',
    submission.safetyControlsStatus === 'Complete' ? 'documented safety controls' : 'improving safety documentation',
    client.relationshipStatus === 'Strong' ? 'stable relationship history' : 'clear account leadership',
  ];
  const concerns = submission.underwriterConcerns.length
    ? submission.underwriterConcerns
    : ['No material underwriting concerns currently flagged'];

  return (
    <section className="submission-story-card">
      <SectionHeader
        title="Insurer-Facing Risk Story"
        text="Broker-prepared narrative that converts client information into a clear underwriting position."
      />
      <div className="submission-story-layout">
        <article>
          <span>Client Overview</span>
          <p>{client.name} is a {client.industrySegment.toLowerCase()} based in {client.location}. {client.shortBusinessSummary}</p>
        </article>
        <article>
          <span>Operations Summary</span>
          <p>The account generates {compactCurrency(premium)} in annual premium across {policies.length || 1} active coverage lines, with primary exposure concentrated in {policyTypes || 'aviation liability and related operational coverages'}.</p>
        </article>
        <article>
          <span>Fleet Summary</span>
          <p>The fleet exposure should be positioned through the current aircraft schedule, hull values, utilization profile, and any contract or lease obligations that influence insured operations.</p>
        </article>
        <article>
          <span>Pilot Quality</span>
          <p>Pilot data is currently marked as {submission.pilotRosterStatus.toLowerCase()}. The final package should emphasize qualifications, recurrent training, and supervision standards before market release.</p>
        </article>
        <article>
          <span>Safety Controls</span>
          <p>Safety controls are {submission.safetyControlsStatus.toLowerCase()}, supported by compliance scoring at {client.complianceScore}% and document completeness at {client.documentCompleteness}%.</p>
        </article>
        <article>
          <span>Claims History</span>
          <p>{claimExposure.count ? `${claimExposure.count} claim records are in scope, with ${compactCurrency(claimExposure.incurredAmount)} incurred and ${compactCurrency(claimExposure.reserveAmount)} reserved.` : 'No open claim record is attached to this submission.'}</p>
        </article>
        <article>
          <span>Risk Strengths</span>
          <p>{strengths.join(', ')}.</p>
        </article>
        <article>
          <span>Underwriting Concerns</span>
          <p>{concerns.join('; ')}{compliance.some((item) => item.status !== 'Closed') ? '; compliance follow-up should be closed or explained.' : '.'}</p>
        </article>
        <article className="submission-story-layout__wide">
          <span>Recommended Positioning</span>
          <p>Present the account as a professionally managed aviation risk with transparent open items, a concise loss narrative, and a focused request for terms that reward operational controls rather than pricing uncertainty.</p>
        </article>
      </div>
    </section>
  );
}

function DocumentChecklist({ documents }) {
  const [documentState, setDocumentState] = useState(() => Object.fromEntries(documents.map((document) => [document.id, { note: '', status: document.status }])));

  function updateDocument(documentId, patch) {
    setDocumentState((current) => ({ ...current, [documentId]: { ...current[documentId], ...patch } }));
  }

  return (
    <section className="submission-card">
      <SectionHeader title="Document Checklist" text="Local package actions for receipt, review, issue flags, and notes." />
      <div className="submission-document-list">
        {documents.map((document) => {
          const state = documentState[document.id] ?? { status: document.status, note: '' };
          return (
            <article className="submission-document-row" key={document.id}>
              <div>
                <strong>{document.documentType}</strong>
                <span>{document.uploadedDate ? `Uploaded ${formatDate(document.uploadedDate)}` : document.missingReason}</span>
              </div>
              <DocumentStatusBadge status={state.status} />
              <p>{document.businessImpact}</p>
              <div className="submission-document-actions">
                <button type="button" onClick={() => updateDocument(document.id, { status: 'Received' })}>Mark received</button>
                <button type="button" onClick={() => updateDocument(document.id, { status: 'Reviewed' })}>Mark reviewed</button>
                <button type="button" onClick={() => updateDocument(document.id, { status: 'Issue Flagged' })}>Flag issue</button>
                <button type="button" onClick={() => updateDocument(document.id, { note: 'Note added locally' })}>Add note</button>
              </div>
              {state.note ? <em>{state.note}</em> : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}

function UnderwriterConsiderations({ considerations }) {
  return (
    <section className="submission-card">
      <SectionHeader title="Underwriter Considerations" />
      <div className="submission-consideration-list">
        {considerations.map((item) => (
          <article className={`submission-consideration submission-consideration--${item.tone}`} key={item.title}>
            <strong>{item.title}</strong>
            <p>{item.detail}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function RecommendedActions({ actions }) {
  return (
    <section className="submission-card">
      <SectionHeader title="Recommended Actions" />
      <div className="submission-action-list">
        {actions.map((action) => (
          <article key={action}>
            <CheckCircle2 size={17} />
            <p>{action}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function SubmissionPreview({ bundle, checklist, readinessCards }) {
  const included = checklist.filter((document) => ['Approved', 'Reviewed', 'Received'].includes(document.status));
  const outstanding = checklist.filter((document) => ['Missing', 'Needs Review', 'Issue Flagged'].includes(document.status));
  const ready = bundle.submission.completionPercent >= 90 && outstanding.length <= 1;

  return (
    <section className="submission-preview-card">
      <SectionHeader title="Submission Package Preview" text="What the insurer-facing package would contain today." />
      <div className="submission-preview-grid">
        <PreviewBlock label="Cover Summary" value={`${bundle.client.name} / ${bundle.client.clientType}`} />
        <PreviewBlock label="Key Facts" value={`${compactCurrency(bundle.client.annualPremium)} premium / ${bundle.client.location}`} />
        <PreviewBlock label="Documents Included" value={`${included.length} of ${checklist.length}`} />
        <PreviewBlock label="Outstanding Exclusions" value={outstanding.length ? outstanding.map((item) => item.documentType).slice(0, 3).join(', ') : 'None'} />
        <PreviewBlock label="Ready-to-Send Status" value={ready ? 'Ready for market release' : readinessCategory(bundle.submission.completionPercent)} tone={ready ? 'green' : 'amber'} />
        <PreviewBlock label="Strongest Position" value={readinessCards.find((card) => card.completion >= 95)?.title ?? 'Safety controls'} />
      </div>
    </section>
  );
}

function LinkedRecords({ bundle }) {
  const links = [
    ['Client Profile', `/clients?clientId=${bundle.client.id}`, 1],
    ['Renewal', bundle.renewal ? `/renewals/${bundle.renewal.id}` : '/renewals', bundle.renewal ? 1 : 0],
    ['Policies', `/clients?clientId=${bundle.client.id}`, bundle.policies.length],
    ['Claims', bundle.claims[0] ? `/claims/${bundle.claims[0].id}` : '/claims', bundle.claims.length],
    ['Compliance Items', bundle.compliance[0] ? `/compliance/${bundle.compliance[0].id}` : '/compliance', bundle.compliance.length],
    ['Documents', bundle.documents[0] ? `/documents/${bundle.documents[0].id}` : '/documents', bundle.documents.length],
    ['Tasks', `/clients?clientId=${bundle.client.id}`, bundle.tasks.length],
  ];

  return (
    <section className="submission-card">
      <SectionHeader title="Linked Records" text="Connected records from the shared JSON model." />
      <div className="submission-linked-grid">
        {links.map(([label, href, count]) => (
          <Link key={label} to={href}>
            <strong>{count}</strong>
            <span>{label}</span>
            <ArrowRight size={15} />
          </Link>
        ))}
      </div>
    </section>
  );
}

function RelatedActivity({ activities }) {
  return (
    <section className="submission-card">
      <SectionHeader title="Activity Timeline" />
      <BusinessActivityTimeline
        activities={activities.slice(0, 8)}
        getClientName={clientName}
        formatTime={(timestamp) => timeFormatter.format(new Date(timestamp))}
      />
    </section>
  );
}

export function SubmissionWorkspace() {
  const { submissionId } = useParams();
  const activeSubmission = simulationData.submissions.find((submission) => submission.id === submissionId) ?? simulationData.submissions[0];
  const bundle = useMemo(() => getSubmissionBundle(activeSubmission), [activeSubmission]);
  const readinessCards = useMemo(() => buildReadinessCards(bundle), [bundle]);
  const checklist = useMemo(() => buildChecklist(bundle), [bundle]);
  const considerations = useMemo(() => buildConsiderations(bundle), [bundle]);
  const recommendations = useMemo(() => buildRecommendations(bundle, readinessCards), [bundle, readinessCards]);

  return (
    <div className="submission-workspace page-transition">
      <section className="submission-hero">
        <div>
          <span>Submission Workspace</span>
          <h1>{bundle.client.name}</h1>
          <p>Is this submission ready for insurers, and what still needs work?</p>
        </div>
        <RevenueImpactLabel value={readinessCategory(bundle.submission.completionPercent)} label={`${bundle.submission.completionPercent}% complete`} />
      </section>

      <div className="submission-layout">
        <SubmissionSelector submissions={simulationData.submissions} activeId={activeSubmission.id} />
        <main className="submission-detail-stack">
          <SubmissionSummary bundle={bundle} readinessCards={readinessCards} />
          <SubmissionReadiness cards={readinessCards} />
          <RiskStory bundle={bundle} />
          <section className="submission-two-column">
            <DocumentChecklist documents={checklist} />
            <div className="submission-side-stack">
              <UnderwriterConsiderations considerations={considerations} />
              <RecommendedActions actions={recommendations} />
            </div>
          </section>
          <SubmissionPreview bundle={bundle} checklist={checklist} readinessCards={readinessCards} />
          <section className="submission-two-column submission-two-column--records">
            <LinkedRecords bundle={bundle} />
            <RelatedActivity activities={bundle.activities} />
          </section>
        </main>
      </div>
    </div>
  );
}

function SectionHeader({ title, text }) {
  return (
    <div className="submission-section-header">
      <div>
        <h2>{title}</h2>
        {text ? <p>{text}</p> : null}
      </div>
    </div>
  );
}

function ProgressBar({ value }) {
  return (
    <div className="submission-progress">
      <i><b style={{ width: `${Math.max(6, value)}%` }} /></i>
      <strong>{value}%</strong>
    </div>
  );
}

function PreviewBlock({ label, value, tone = 'blue' }) {
  return (
    <article className={`submission-preview-block submission-preview-block--${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}
