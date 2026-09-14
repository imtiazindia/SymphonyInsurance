import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  Building2,
  CheckCircle2,
  FileText,
  Headphones,
  MapPin,
  MessageSquareText,
  Plane,
  Plus,
  Send,
  ShieldCheck,
  Upload,
} from 'lucide-react';
import { DocumentStatusBadge, RenewalStatusBadge, TaskPriorityBadge } from '../components/BusinessComponents.jsx';
import { SectionHeader } from '../components/SectionHeader.jsx';
import { UserAvatar } from '../components/UserAvatar.jsx';
import { useRoleExperience } from '../context/RoleContext.jsx';
import { simulationData } from '../data/demoData.js';

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const shortDate = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
const dateTime = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

function formatDate(value) {
  return value ? shortDate.format(new Date(`${value}T12:00:00`)) : 'Not provided';
}

function statusTone(status = '') {
  const value = status.toLowerCase();
  if (value.includes('missing') || value.includes('required') || value.includes('waiting')) return 'red';
  if (value.includes('review') || value.includes('pending') || value.includes('progress') || value.includes('due')) return 'amber';
  if (value.includes('complete') || value.includes('covered') || value.includes('issued') || value.includes('approved') || value.includes('current')) return 'green';
  return 'blue';
}

function StatusPill({ status }) {
  return <span className={`client-status client-status--${statusTone(status)}`}>{status}</span>;
}

function clientClaimStatus(claim) {
  return claim.status === 'Executive Review' ? 'Under Review' : claim.status;
}

function clientClaimNextAction(claim) {
  return claim.nextAction.toLowerCase().includes('executive')
    ? 'Provide the requested instructor statement and maintenance release.'
    : claim.nextAction;
}

function PortalHero({ client, user, renewal }) {
  return (
    <section className="client-portal-hero client-portal-hero--simple">
      <div className="client-portal-hero__copy">
        <span>My Insurance</span>
        <h1>Welcome back, {user.name.split(' ')[0]}</h1>
        <p>{client.name}. Here is a clear view of what needs your attention.</p>
        <div className="client-portal-hero__meta">
          <span><Building2 size={15} /> Account MFA-2048</span>
          <span><MapPin size={15} /> {simulationData.locations.filter((item) => item.clientId === client.id).length} training locations</span>
          <span><Plane size={15} /> {simulationData.aircraft.filter((item) => item.clientId === client.id).length} scheduled aircraft</span>
        </div>
      </div>
      <div className="client-portal-hero__side">
        <div>
          <small>Next renewal</small>
          <strong>{formatDate(renewal.expiryDate)}</strong>
          <span>{renewal.readinessScore}% information ready</span>
        </div>
        <div className="client-renewal-meter" aria-label={`${renewal.readinessScore}% of renewal information ready`}>
          <i style={{ width: `${renewal.readinessScore}%` }} />
        </div>
        <Link className="client-panel-link" to="/client-portal/renewal">View renewal <ArrowRight size={15} /></Link>
      </div>
    </section>
  );
}

function HomeView({ client, renewal, claims, documents, requests, messages, team, accountManager, onQuickAction }) {
  const missingDocuments = documents.filter((item) => /Missing|Expired/.test(item.status));
  const openRequests = requests.filter((item) => item.status !== 'Complete');
  const actions = [
    ...missingDocuments.slice(0, 2).map((item) => ({ id: item.id, priority: 'High', title: item.documentType, detail: item.missingReason, action: 'Upload document', route: '/client-portal/documents' })),
    ...openRequests.filter((item) => item.status === 'Waiting on Client').map((item) => ({ id: item.id, priority: 'Medium', title: item.title, detail: item.lastUpdate, action: 'Provide information', route: '/client-portal/requests' })),
    ...claims.filter((item) => item.status !== 'Closed').slice(0, 1).map((item) => ({ id: item.id, priority: item.severity, title: item.claimType, detail: clientClaimNextAction(item), action: 'Open claim', route: '/client-portal/claims' })),
  ];
  const visibleActions = actions.slice(0, 3);
  const openClaims = claims.filter((item) => item.status !== 'Closed').length;

  return (
    <>
      <section className="client-home-summary" aria-label="Insurance summary">
        <div><AlertCircle size={19} /><span><strong>{actions.length}</strong> items need you</span></div>
        <div><FileText size={19} /><span><strong>{client.documentCompleteness}%</strong> documents ready</span></div>
        <div><MessageSquareText size={19} /><span><strong>{openRequests.length}</strong> open requests</span></div>
      </section>

      <section className="client-home-primary">
        <div className="client-panel client-panel--priority">
          <SectionHeader title="What Needs Your Attention" text="The most important items to keep your insurance work moving." action={actions.length > visibleActions.length ? <Link to="/client-portal/documents">View all</Link> : null} />
          <div className="client-action-list">
            {visibleActions.length ? visibleActions.map((item) => (
              <article key={item.id}>
                <TaskPriorityBadge priority={item.priority} />
                <div><strong>{item.title}</strong><p>{item.detail}</p></div>
                <Link to={item.route}>{item.action}<ArrowRight size={15} /></Link>
              </article>
            )) : <div className="client-positive-state"><CheckCircle2 size={20} /><div><strong>You are up to date</strong><p>No client actions are currently outstanding.</p></div></div>}
          </div>
        </div>

        <div className="client-panel">
          <SectionHeader title="Renewal Progress" text={`${renewal.readinessScore}% of requested information is complete.`} action={<RenewalStatusBadge status={renewal.currentStage} />} />
          <div className="client-renewal-meter"><i style={{ width: `${renewal.readinessScore}%` }} /></div>
          <dl className="client-home-renewal-facts">
            <div><dt>Days remaining</dt><dd>{renewal.daysToExpiry}</dd></div>
            <div><dt>Current step</dt><dd>{renewal.currentStage}</dd></div>
            <div><dt>Documents needed</dt><dd>{missingDocuments.length}</dd></div>
          </dl>
          <Link className="client-panel-link" to="/client-portal/renewal">Continue renewal <ArrowRight size={15} /></Link>
        </div>
      </section>

      <section className="client-home-secondary">
        <div className="client-panel">
          <SectionHeader title="Recent Updates" text="The latest messages from your Symphony team." action={<Link to="/client-portal/requests">View requests</Link>} />
          <div className="client-message-list">
            {messages.slice(0, 2).map((message) => {
              const sender = team.find((member) => member.id === message.senderUserId);
              return <article key={message.id}><UserAvatar initials={sender?.avatarInitials ?? 'SY'} tone="blue" /><div><strong>{message.subject}</strong><p>{message.summary}</p><small>{sender?.name ?? 'Symphony team'} / {dateTime.format(new Date(message.timestamp))}</small></div>{message.status === 'Unread' ? <span>New</span> : null}</article>;
            })}
          </div>
        </div>
        <aside className="client-panel client-home-help">
          <div className="client-home-help__person">
            <UserAvatar initials={accountManager.avatarInitials} tone="blue" />
            <div><small>Your account manager</small><strong>{accountManager.name}</strong><span>Here when you need assistance.</span></div>
          </div>
          <button type="button" onClick={() => onQuickAction('message')}><Send size={16} /> Send a message</button>
          <div className="client-home-quick-links" aria-label="Common client actions">
            <Link to="/client-portal/requests"><BadgeCheck size={18} /><span><strong>Request a certificate</strong><small>Start or track a service request</small></span><ArrowRight size={16} /></Link>
            <Link to="/client-portal/documents"><Upload size={18} /><span><strong>Upload a document</strong><small>Add renewal or policy information</small></span><ArrowRight size={16} /></Link>
            <Link to="/client-portal/claims"><Headphones size={18} /><span><strong>Claims</strong><small>{openClaims ? `${openClaims} open claim${openClaims === 1 ? '' : 's'}` : 'Report or review a claim'}</small></span><ArrowRight size={16} /></Link>
            <Link to="/client-portal/fleet"><Plane size={18} /><span><strong>Fleet and locations</strong><small>Review your insured operations</small></span><ArrowRight size={16} /></Link>
          </div>
        </aside>
      </section>
    </>
  );
}

function RenewalView({ renewal, policies, documents, accountManager, onDocumentAction }) {
  const requirements = documents.filter((item) => /Renewal|Market|Pilot/.test(item.requiredFor));
  return (
    <>
      <section className="client-panel client-page-intro">
        <SectionHeader eyebrow="Renewal Center" title="Prepare Your Insurance Renewal" text="See what is complete, what Symphony is reviewing, and what your team still needs to provide." action={<RenewalStatusBadge status={renewal.currentStage} />} />
        <div className="client-renewal-summary">
          <div><small>Renewal date</small><strong>{formatDate(renewal.expiryDate)}</strong></div>
          <div><small>Readiness</small><strong>{renewal.readinessScore}%</strong></div>
          <div><small>Current stage</small><strong>{renewal.currentStage}</strong></div>
          <div><small>Account manager</small><strong>{accountManager.name}</strong></div>
        </div>
        <div className="client-renewal-meter"><i style={{ width: `${renewal.readinessScore}%` }} /></div>
      </section>

      <section className="client-panel">
        <SectionHeader title="Information Checklist" text="Items marked missing or under review may affect the renewal schedule." />
        <div className="client-document-list">
          {requirements.map((document) => (
            <article key={document.id}>
              <FileText size={19} />
              <div><strong>{document.documentType}</strong><p>{document.businessImpact}</p><small>{document.missingReason || `Uploaded ${formatDate(document.uploadedDate)}`}</small></div>
              <DocumentStatusBadge status={document.status} />
              {document.status === 'Missing' ? <button type="button" onClick={() => onDocumentAction(document.id, 'Received')}>Upload</button> : <Link to="/client-portal/documents">View</Link>}
            </article>
          ))}
        </div>
      </section>

      <section className="client-panel">
        <SectionHeader title="Current Coverage" text="Policy information supplied for renewal review. Brokerage-only revenue and market strategy are not shown." />
        <div className="client-table-wrap">
          <table className="client-table"><thead><tr><th>Coverage</th><th>Insurer</th><th>Limit</th><th>Deductible</th><th>Premium</th><th>Status</th></tr></thead><tbody>
            {policies.map((policy) => <tr key={policy.id}><td data-label="Coverage"><strong>{policy.policyType}</strong></td><td data-label="Insurer">{policy.insurer}</td><td data-label="Limit">{money.format(policy.limit)}</td><td data-label="Deductible">{money.format(policy.deductible)}</td><td data-label="Premium">{money.format(policy.premium)}</td><td data-label="Status"><StatusPill status={policy.status} /></td></tr>)}
          </tbody></table>
        </div>
      </section>
    </>
  );
}

function FleetView({ locations, aircraft, onAction }) {
  const [locationId, setLocationId] = useState('all');
  const filtered = locationId === 'all' ? aircraft : aircraft.filter((item) => item.locationId === locationId);
  const locationById = new Map(locations.map((item) => [item.id, item]));
  return (
    <>
      <section className="client-panel client-page-intro">
        <SectionHeader eyebrow="Fleet & Locations" title="Your Insured Operations" text="Keep aircraft and operating-location information accurate so coverage follows your business." action={<button type="button" onClick={() => onAction('Aircraft change request started')}><Plus size={15} /> Request aircraft change</button>} />
      </section>
      <section className="client-location-strip client-location-strip--large">
        {locations.map((location) => <article key={location.id}><div><MapPin size={18} /><strong>{location.airportCode}</strong></div><h3>{location.name}</h3><p>{location.operationType}</p><dl><div><dt>Annual hours</dt><dd>{location.annualFlightHours.toLocaleString()}</dd></div><div><dt>Aircraft</dt><dd>{location.aircraftCount}</dd></div><div><dt>Status</dt><dd>{location.status}</dd></div></dl></article>)}
      </section>
      <section className="client-panel">
        <SectionHeader title="Aircraft Schedule" text={`${filtered.length} aircraft shown. Request changes rather than editing bound policy records directly.`} action={<select value={locationId} onChange={(event) => setLocationId(event.target.value)} aria-label="Filter aircraft by location"><option value="all">All locations</option>{locations.map((item) => <option key={item.id} value={item.id}>{item.airportCode} / {item.city}</option>)}</select>} />
        <div className="client-table-wrap"><table className="client-table"><thead><tr><th>Tail Number</th><th>Aircraft</th><th>Location</th><th>Use</th><th>Hull Value</th><th>Coverage</th></tr></thead><tbody>
          {filtered.map((item) => <tr key={item.id}><td data-label="Tail Number"><strong>{item.tailNumber}</strong><small>{item.year}</small></td><td data-label="Aircraft">{item.makeModel}</td><td data-label="Location">{locationById.get(item.locationId)?.airportCode}</td><td data-label="Use">{item.use}</td><td data-label="Hull Value">{money.format(item.hullValue)}</td><td data-label="Coverage"><StatusPill status={item.coverageStatus} /></td></tr>)}
        </tbody></table></div>
      </section>
    </>
  );
}

function PeopleView({ pilots, locations, onAction }) {
  const locationById = new Map(locations.map((item) => [item.id, item]));
  const dueCount = pilots.filter((item) => item.status !== 'Current').length;
  return (
    <>
      <section className="client-panel client-page-intro">
        <SectionHeader eyebrow="Pilots & Instructors" title="Instructor Qualification Roster" text="Maintain current experience and training information for the people operating your insured aircraft." action={<button type="button" onClick={() => onAction('Instructor update request started')}><Plus size={15} /> Add instructor</button>} />
        {dueCount ? <div className="client-inline-alert"><AlertCircle size={18} /><div><strong>{dueCount} records need review</strong><p>Update recurrent training or medical information before the roster is submitted.</p></div></div> : null}
      </section>
      <section className="client-panel">
        <div className="client-table-wrap"><table className="client-table"><thead><tr><th>Instructor</th><th>Location</th><th>Certificates</th><th>Total Hours</th><th>Recurrent Training</th><th>Status</th></tr></thead><tbody>
          {pilots.map((pilot) => <tr key={pilot.id}><td data-label="Instructor"><strong>{pilot.name}</strong><small>{pilot.role}</small></td><td data-label="Location">{locationById.get(pilot.locationId)?.airportCode}</td><td data-label="Certificates">{pilot.certificate}</td><td data-label="Total Hours">{pilot.totalHours.toLocaleString()}</td><td data-label="Recurrent Training">{formatDate(pilot.recurrentTrainingDate)}</td><td data-label="Status"><StatusPill status={pilot.status} /></td></tr>)}
        </tbody></table></div>
      </section>
    </>
  );
}

function DocumentsView({ documents, onDocumentAction }) {
  const received = documents.filter((item) => /Approved|Received|Review/.test(item.status)).length;
  return (
    <>
      <section className="client-panel client-page-intro">
        <SectionHeader eyebrow="Documents" title="Your Insurance Document Library" text="Upload requested information and follow each item through Symphony review." action={<span className="client-readiness-label">{received} of {documents.length} received</span>} />
      </section>
      <section className="client-panel">
        <div className="client-document-list client-document-list--full">
          {documents.map((document) => (
            <article key={document.id}>
              <FileText size={20} />
              <div><strong>{document.documentType}</strong><p>Required for {document.requiredFor}</p><small>{document.missingReason || `Uploaded ${formatDate(document.uploadedDate)}`}</small></div>
              <DocumentStatusBadge status={document.status} />
              <div className="client-document-actions">
                {document.status === 'Missing' ? <button type="button" onClick={() => onDocumentAction(document.id, 'Received')}><Upload size={14} /> Mark received</button> : null}
                {document.status === 'Received' || document.status === 'Needs Review' ? <button type="button" onClick={() => onDocumentAction(document.id, 'Approved')}><CheckCircle2 size={14} /> Mark reviewed</button> : null}
                <button type="button" className="client-text-button" onClick={() => onDocumentAction(document.id, 'Needs Review')}>Flag issue</button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}

function RequestForm({ onSubmit }) {
  const [type, setType] = useState('Certificate of Insurance');
  const [title, setTitle] = useState('');
  function submit(event) {
    event.preventDefault();
    if (!title.trim()) return;
    onSubmit({ type, title: title.trim() });
    setTitle('');
  }
  return (
    <form className="client-request-form" onSubmit={submit}>
      <label><span>Request type</span><select value={type} onChange={(event) => setType(event.target.value)}><option>Certificate of Insurance</option><option>Aircraft Change</option><option>Pilot Update</option><option>Coverage Question</option><option>Policy Change</option></select></label>
      <label><span>What do you need?</span><input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Briefly describe your request" /></label>
      <button type="submit"><Send size={15} /> Submit request</button>
    </form>
  );
}

function RequestsView({ requests, certificates, locations, team, onSubmit }) {
  const locationById = new Map(locations.map((item) => [item.id, item]));
  const teamById = new Map(team.map((item) => [item.id, item]));
  return (
    <>
      <section className="client-panel client-page-intro"><SectionHeader eyebrow="Requests & Certificates" title="Ask Symphony for Service" text="Submit coverage, policy, aircraft, pilot and certificate requests and see who is handling them." /><RequestForm onSubmit={onSubmit} /></section>
      <section className="client-panel">
        <SectionHeader title="Service Requests" text="Your recent requests and current status." />
        <div className="client-request-list">{requests.map((item) => <article key={item.id}><div><strong>{item.title}</strong><p>{item.requestType} / Needed {formatDate(item.neededByDate)}</p><small>{item.lastUpdate}</small></div><div><StatusPill status={item.status} /><span>{teamById.get(item.assignedBrokerUserId)?.name ?? 'Symphony team'}</span></div></article>)}</div>
      </section>
      <section className="client-panel">
        <SectionHeader title="Certificate Requests" text="Proof-of-insurance requests for airports, landlords and business partners." />
        <div className="client-request-list">{certificates.map((item) => <article key={item.id}><div><strong>{item.certificateHolder}</strong><p>{item.coverageRequired}</p><small>{locationById.get(item.locationId)?.name} / Needed {formatDate(item.neededByDate)}</small></div><div><StatusPill status={item.status} /><span>{item.deliveryEmail}</span></div></article>)}</div>
      </section>
    </>
  );
}

function ClaimsView({ claims, policies, claimsCoordinator, onAction }) {
  const policyById = new Map(policies.map((item) => [item.id, item]));
  return (
    <>
      <section className="client-panel client-page-intro">
        <SectionHeader eyebrow="Claims" title="Report and Track Incidents" text="See current claim activity and send new incidents securely to your Symphony claims coordinator." action={<button type="button" onClick={() => onAction('New incident report started')}><Plus size={15} /> Report new incident</button>} />
        <div className="client-claims-contact"><UserAvatar initials={claimsCoordinator.avatarInitials} tone="blue" /><div><small>Your claims coordinator</small><strong>{claimsCoordinator.name}</strong><span>Available for reporting and carrier follow-up</span></div><button type="button" onClick={() => onAction('Message prepared for claims coordinator')}><Send size={15} /> Message</button></div>
      </section>
      <section className="client-panel">
        <SectionHeader title="Open Claims" text="Client-facing status and next steps. Internal reserve strategy is not displayed." />
        <div className="client-claim-list">
          {claims.map((claim) => <article key={claim.id}><div className="client-claim-list__icon"><Headphones size={21} /></div><div><span>{claim.id}</span><strong>{claim.claimType}</strong><p>Policy: {policyById.get(claim.policyId)?.policyType ?? claim.policyId} / Date of loss {formatDate(claim.dateOfLoss)}</p></div><dl><div><dt>Status</dt><dd><StatusPill status={clientClaimStatus(claim)} /></dd></div><div><dt>Reported exposure</dt><dd>{money.format(claim.incurredAmount)}</dd></div><div><dt>Next step</dt><dd>{clientClaimNextAction(claim)}</dd></div></dl></article>)}
        </div>
      </section>
      <section className="client-panel client-incident-guide"><div><ShieldCheck size={24} /><div><h2>When an incident occurs</h2><p>Protect people and property first, preserve records, avoid admitting liability, and notify Symphony promptly.</p></div></div><ol><li>Record the date, location and aircraft.</li><li>Upload photographs and statements.</li><li>Keep maintenance and training records available.</li></ol></section>
    </>
  );
}

export function ClientPortalWorkspace() {
  const { section = 'home' } = useParams();
  const navigate = useNavigate();
  const { activeUserId } = useRoleExperience();
  const user = simulationData.clientUsers.find((item) => item.id === activeUserId) ?? simulationData.clientUsers[0];
  const client = simulationData.clients.find((item) => item.id === user.clientId);
  const [documentOverrides, setDocumentOverrides] = useState({});
  const [requests, setRequests] = useState(() => simulationData.serviceRequests.filter((item) => item.clientId === client.id));

  const records = useMemo(() => {
    const byClient = (items) => items.filter((item) => item.clientId === client.id);
    return {
      aircraft: byClient(simulationData.aircraft),
      certificates: byClient(simulationData.certificateRequests),
      claims: byClient(simulationData.claims),
      documents: byClient(simulationData.documents).map((item) => ({ ...item, status: documentOverrides[item.id] ?? item.status })),
      locations: byClient(simulationData.locations),
      messages: byClient(simulationData.clientMessages),
      pilots: byClient(simulationData.pilots),
      policies: byClient(simulationData.policies),
      renewal: simulationData.renewals.find((item) => item.clientId === client.id),
    };
  }, [client.id, documentOverrides]);

  function announce(message) {
    window.dispatchEvent(new CustomEvent('symphony:toast', { detail: { title: 'Client portal updated', message, tone: 'success' } }));
  }

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [section]);

  function handleDocumentAction(documentId, status) {
    setDocumentOverrides((current) => ({ ...current, [documentId]: status }));
    announce(`Document status changed to ${status}. This change is stored for the current demo session only.`);
  }

  function handleQuickAction(action) {
    const routes = { certificate: '/client-portal/requests', incident: '/client-portal/claims', upload: '/client-portal/documents' };
    if (routes[action]) navigate(routes[action]);
    else announce(action === 'message' ? 'A secure message draft has been opened for your Symphony contact.' : action);
  }

  function addRequest({ type, title }) {
    const next = { id: `SR-LOCAL-${Date.now()}`, clientId: client.id, createdByUserId: user.id, requestType: type, title, submittedDate: '2026-07-10', neededByDate: '2026-07-17', status: 'Submitted', priority: 'Medium', assignedBrokerUserId: 'USR-004', lastUpdate: 'Request received by Symphony.' };
    setRequests((current) => [next, ...current]);
    announce(`${type} request submitted to your Symphony account team.`);
  }

  const team = simulationData.teamMembers;
  const accountManager = team.find((item) => item.id === client.assignedAccountManagerId) ?? team[0];
  const claimsCoordinator = team.find((item) => item.role === 'Claims Coordinator') ?? team[0];
  const viewProps = { ...records, client, user, requests, team, accountManager, claimsCoordinator, onDocumentAction: handleDocumentAction, onQuickAction: handleQuickAction, onAction: announce, onSubmit: addRequest };
  const views = {
    home: <HomeView {...viewProps} />,
    renewal: <RenewalView {...viewProps} />,
    fleet: <FleetView {...viewProps} />,
    people: <PeopleView {...viewProps} />,
    documents: <DocumentsView {...viewProps} />,
    requests: <RequestsView {...viewProps} />,
    claims: <ClaimsView {...viewProps} />,
  };

  return (
    <div className="client-portal page-transition">
      <PortalHero client={client} user={user} renewal={records.renewal} />
      {views[section] ?? views.home}
    </div>
  );
}
