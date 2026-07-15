import { useMemo, useState } from 'react';
import {
  BellRing,
  Bot,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  Database,
  Gauge,
  Landmark,
  Plane,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  UsersRound,
} from 'lucide-react';
import { BusinessKpiCard, WorkloadIndicator } from '../components/BusinessComponents.jsx';
import { simulationData } from '../data/demoData.js';
import { aviationRiskIndex } from '../utils/aviationRiskIndex.js';
import { calculateRevenueAtRisk, getAverage, getClaimsExposure, getDocumentGapCount, getSum } from '../utils/businessCalculations.js';

const asOfDate = 'Jul 10, 2026';

const roleDefinitions = [
  {
    role: 'CEO',
    responsibilities: ['Executive priorities', 'Strategic decisions', 'Revenue risk oversight'],
    workspaces: ['Executive Overview', 'Reports', 'Administration'],
    kpis: ['Business Health Index', 'Revenue at Risk', 'Retention'],
    workload: 'Strategic review',
    reportsTo: 'Board',
    relationships: 'Guides account, placement, claims and compliance leads',
  },
  {
    role: 'Account Manager',
    responsibilities: ['Client relationship', 'Renewal coordination', 'Task follow-up'],
    workspaces: ['Account Manager', 'Client 360', 'Renewals', 'Documents'],
    kpis: ['Client health', 'Open tasks', 'Retention risk'],
    workload: 'High touch portfolio',
    reportsTo: 'CEO',
    relationships: 'Partners with placement, submission and document teams',
  },
  {
    role: 'Placement Lead',
    responsibilities: ['Market strategy', 'Insurer negotiation', 'Quote recommendation'],
    workspaces: ['Market Placement', 'Submissions', 'Reports'],
    kpis: ['Quote success', 'Savings', 'Market response'],
    workload: 'Placement pipeline',
    reportsTo: 'CEO',
    relationships: 'Works with account managers and submission specialists',
  },
  {
    role: 'Submission Specialist',
    responsibilities: ['Submission completeness', 'Document narrative', 'Underwriter questions'],
    workspaces: ['Submissions', 'Documents', 'Market Placement'],
    kpis: ['Completion percent', 'Document gaps', 'Ready for market'],
    workload: 'Submission queue',
    reportsTo: 'Placement Lead',
    relationships: 'Supports placement and account teams',
  },
  {
    role: 'Claims Coordinator',
    responsibilities: ['Claim follow-up', 'Reserve visibility', 'Executive escalation'],
    workspaces: ['Claims', 'Client 360', 'Reports'],
    kpis: ['Open claims', 'Severity', 'Executive review'],
    workload: 'Claim portfolio',
    reportsTo: 'CEO',
    relationships: 'Partners with account managers and compliance advisor',
  },
  {
    role: 'Compliance Advisor',
    responsibilities: ['Findings oversight', 'Corrective actions', 'Regulatory readiness'],
    workspaces: ['Compliance', 'Documents', 'Client 360'],
    kpis: ['Overdue findings', 'Compliance score', 'Closure rate'],
    workload: 'Compliance queue',
    reportsTo: 'CEO',
    relationships: 'Works with document specialist and account managers',
  },
  {
    role: 'Document Specialist',
    responsibilities: ['Document requests', 'Expiry monitoring', 'Evidence readiness'],
    workspaces: ['Documents', 'Renewals', 'Submissions'],
    kpis: ['Missing documents', 'Review queue', 'Expiry risk'],
    workload: 'Document operations',
    reportsTo: 'Submission Specialist',
    relationships: 'Supports every active workflow',
  },
  {
    role: 'Administrator',
    responsibilities: ['Configuration control', 'Reference data', 'Workflow settings'],
    workspaces: ['Administration', 'Reports'],
    kpis: ['System health', 'Rule coverage', 'Data integrity'],
    workload: 'Platform governance',
    reportsTo: 'CEO',
    relationships: 'Maintains enterprise operating model',
  },
];

const businessSettings = [
  ['Business Name', 'Symphony One Insurance Brokers', 'Brand used across workspace headers'],
  ['Office Locations', 'Dallas, Seattle, Teterboro, Van Nuys, Miami', 'Used for regional reporting'],
  ['Business Calendar', 'US aviation brokerage calendar', 'Controls workflow date logic'],
  ['Working Days', 'Monday to Friday', 'Used for task and SLA calculations'],
  ['Public Holidays', 'Federal holidays plus market closure days', 'Configurable local calendar'],
  ['Default Currency', 'USD', 'Applied to premium and revenue displays'],
  ['Default Time Zone', 'Asia/Calcutta demo workspace', 'Shown for platform operations'],
  ['Fiscal Year', 'January to December', 'Used by reports and forecasts'],
  ['Renewal Warning Thresholds', '90 / 60 / 30 days', 'Controls renewal alert bands'],
  ['Revenue Thresholds', '$1M high value, $500K watch', 'Feeds CEO attention and reports'],
  ['Risk Thresholds', 'High risk below 72 client health', 'Used in Client 360 and Reports'],
  ['ARI Alert Thresholds', 'Moderate 50, Elevated 65, Severe 80', 'Controls aviation risk alerts'],
  ['Retention Targets', '92% target retention', 'Used for executive performance'],
  ['Workload Targets', '65-78% balanced workload', 'Used for team capacity indicators'],
  ['Commission Targets', '11% blended target', 'Used for revenue forecasting'],
];

const notificationRules = [
  ['Renewal Due', 'Notify Account Manager', 'Create task, show dashboard alert', '90/60/30 day threshold'],
  ['Submission Ready', 'Notify Placement Lead', 'Create reminder', 'Completion reaches 80%'],
  ['Claim Escalation', 'Notify CEO', 'Escalate and show executive alert', 'High severity or executive review'],
  ['Compliance Overdue', 'Notify Compliance Advisor', 'Create task and reminder', 'Due date has passed'],
  ['Document Expiry', 'Notify Document Specialist', 'Create task', '30 days before expiry'],
  ['ARI Change', 'Notify CEO', 'Show dashboard alert', 'ARI category changes'],
  ['High Revenue Client', 'Notify Account Manager', 'Show executive alert', 'Revenue over configured threshold'],
  ['Executive Alert', 'Notify CEO', 'Escalate', 'Combined revenue and risk rule'],
];

const workflows = [
  {
    name: 'Client',
    roles: ['Account Manager', 'CEO'],
    documents: ['Client profile', 'Exposure schedule', 'Service plan'],
    decisions: ['Relationship status', 'Retention priority'],
    outputs: ['Client 360 record', 'Service priorities'],
  },
  {
    name: 'Renewal',
    roles: ['Account Manager', 'Document Specialist'],
    documents: ['Loss runs', 'Aircraft schedule', 'Renewal questionnaire'],
    decisions: ['Readiness', 'Revenue at risk'],
    outputs: ['Renewal plan', 'Missing item list'],
  },
  {
    name: 'Submission',
    roles: ['Submission Specialist', 'Placement Lead'],
    documents: ['Submission pack', 'Safety narrative', 'Underwriter responses'],
    decisions: ['Ready for market', 'Narrative gaps'],
    outputs: ['Market-ready submission'],
  },
  {
    name: 'Market Placement',
    roles: ['Placement Lead', 'CEO'],
    documents: ['Quote comparison', 'Insurer questions', 'Recommendation'],
    decisions: ['Preferred insurer', 'Bind decision'],
    outputs: ['Placement recommendation', 'Savings estimate'],
  },
  {
    name: 'Binding',
    roles: ['Placement Lead', 'Account Manager'],
    documents: ['Binder', 'Invoice support', 'Policy documents'],
    decisions: ['Terms accepted', 'Subjectivities closed'],
    outputs: ['Bound coverage', 'Policy record'],
  },
  {
    name: 'Claims',
    roles: ['Claims Coordinator', 'Account Manager'],
    documents: ['Claim note', 'Adjuster update', 'Reserve review'],
    decisions: ['Executive escalation', 'Renewal impact'],
    outputs: ['Claim strategy', 'Client impact note'],
  },
  {
    name: 'Compliance',
    roles: ['Compliance Advisor', 'Document Specialist'],
    documents: ['Finding evidence', 'Corrective action', 'Audit trail'],
    decisions: ['Closure readiness', 'Risk severity'],
    outputs: ['Compliance status', 'Action plan'],
  },
  {
    name: 'Renewal',
    roles: ['Account Manager', 'CEO'],
    documents: ['Updated exposure', 'Claims narrative', 'Compliance status'],
    decisions: ['Retention strategy', 'Market approach'],
    outputs: ['Next cycle plan'],
  },
];

const dataDictionary = [
  ['Clients', 'Master relationship record', 'Policies, renewals, claims, documents, tasks', 'Client 360', 'Client 360'],
  ['Policies', 'Coverage and premium record', 'Clients, claims, insurers', 'Market Placement, Reports', 'Market Placement'],
  ['Renewals', 'Renewal pipeline and readiness', 'Clients, submissions, documents', 'Executive Overview, Reports', 'Renewals'],
  ['Submissions', 'Market-ready submission status', 'Clients, documents, negotiations', 'Market Placement', 'Submissions'],
  ['Placements', 'Insurer negotiation and quotes', 'Clients, policies, renewals', 'Reports', 'Market Placement'],
  ['Claims', 'Claim severity and financial exposure', 'Clients, policies, renewals', 'Executive Overview, Client 360', 'Claims'],
  ['Compliance', 'Findings and corrective actions', 'Clients, documents, activities', 'Reports', 'Compliance'],
  ['Documents', 'Evidence, expiry and review queue', 'Clients, renewals, submissions', 'Renewals, Compliance', 'Documents'],
  ['Tasks', 'Operational follow-up items', 'Users, clients, modules', 'Account Manager', 'Account Manager'],
  ['Activities', 'Business event timeline', 'Users, clients, modules', 'Executive Overview', 'Client 360'],
  ['ARI', 'Aviation external risk signal', 'Clients, renewals, submissions', 'Executive Overview, Reports', 'Executive Overview'],
  ['Business Metrics', 'Derived executive measures', 'All workspaces', 'Reports', 'Reports'],
];

const businessRules = [
  ['Renewal Ready', 'A renewal is ready when required documents are present, readiness is high, and no major missing item blocks market action.', 'Renewals, Submissions, Documents'],
  ['Submission Complete', 'Submission completion combines document gaps, underwriter questions, status, and completion percentage.', 'Submissions, Market Placement'],
  ['Client Health', 'Client health reflects relationship status, open claims, document completeness, compliance score, and retention risk.', 'Client 360, Reports'],
  ['ARI Severity', 'ARI severity uses the simulated aviation risk score and category thresholds for global or domestic views.', 'Executive Overview, Reports'],
  ['Compliance Health', 'Compliance health improves as overdue findings close and high severity findings are resolved.', 'Compliance, Reports'],
  ['Revenue At Risk', 'Revenue at risk is derived from renewal records and priority accounts where retention or readiness risk exists.', 'Executive Overview, Reports'],
  ['Business Health Index', 'Business Health Index blends retention, renewal readiness, submission readiness, revenue risk, claims exposure, compliance, workload, and ARI drag.', 'Reports'],
];

const architectureFlow = ['Executive Overview', 'Client 360', 'Renewals', 'Submission', 'Market Placement', 'Claims', 'Compliance', 'Documents', 'Reports', 'Administration', 'iBar'];

function unique(values) {
  return Array.from(new Set(values.filter(Boolean))).sort();
}

function formatDate(timestamp) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(timestamp));
}

function PlatformMetric({ icon: Icon, label, value, helper, tone = 'blue' }) {
  return <BusinessKpiCard icon={Icon} label={label} value={value} helper={helper} tone={tone} />;
}

function ConfigurationCard({ title, eyebrow, children, action, id }) {
  return (
    <section className="admin-card" id={id}>
      <header className="admin-section-header">
        <div>
          {eyebrow ? <span>{eyebrow}</span> : null}
          <h2>{title}</h2>
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}

function HealthIndicator({ status }) {
  const tone = status === 'Action' ? 'red' : status === 'Watch' ? 'amber' : 'green';
  return <span className={`admin-health-pill admin-health-pill--${tone}`}>{status}</span>;
}

function SystemHealthCard({ label, status, detail }) {
  return (
    <article className="admin-health-card">
      <div>
        <strong>{label}</strong>
        <p>{detail}</p>
      </div>
      <HealthIndicator status={status} />
    </article>
  );
}

function ReferenceTable({ title, rows, search }) {
  const filtered = rows.filter((row) => `${row.name} ${row.category} ${row.status}`.toLowerCase().includes(search.toLowerCase()));
  return (
    <article className="admin-reference-table">
      <header>
        <strong>{title}</strong>
        <span>{filtered.length} active values</span>
      </header>
      {filtered.slice(0, 5).map((row) => (
        <div key={`${title}-${row.name}`}>
          <span>{row.name}</span>
          <em>{row.category}</em>
          <HealthIndicator status={row.status} />
        </div>
      ))}
    </article>
  );
}

function RoleMatrix() {
  return (
    <div className="admin-role-matrix">
      {roleDefinitions.map((role) => (
        <article key={role.role}>
          <header>
            <strong>{role.role}</strong>
            <span>Reports to {role.reportsTo}</span>
          </header>
          <p>{role.relationships}</p>
          <dl>
            <div><dt>Responsibilities</dt><dd>{role.responsibilities.join(', ')}</dd></div>
            <div><dt>Workspaces</dt><dd>{role.workspaces.join(', ')}</dd></div>
            <div><dt>Primary KPIs</dt><dd>{role.kpis.join(', ')}</dd></div>
            <div><dt>Workload</dt><dd>{role.workload}</dd></div>
          </dl>
        </article>
      ))}
    </div>
  );
}

function WorkflowDiagram({ selected, onSelect }) {
  return (
    <div className="admin-workflow-diagram">
      <div className="admin-workflow-rail">
        {workflows.map((step, index) => (
          <button key={`${step.name}-${index}`} type="button" className={selected === index ? 'is-active' : ''} onClick={() => onSelect(index)}>
            <span>{index + 1}</span>
            {step.name}
            {index < workflows.length - 1 ? <ChevronRight size={16} /> : null}
          </button>
        ))}
      </div>
      <article className="admin-workflow-detail">
        <span>Workflow Step</span>
        <h3>{workflows[selected].name}</h3>
        <dl>
          <div><dt>Responsible Roles</dt><dd>{workflows[selected].roles.join(', ')}</dd></div>
          <div><dt>Supporting Documents</dt><dd>{workflows[selected].documents.join(', ')}</dd></div>
          <div><dt>Decision Points</dt><dd>{workflows[selected].decisions.join(', ')}</dd></div>
          <div><dt>Business Outputs</dt><dd>{workflows[selected].outputs.join(', ')}</dd></div>
        </dl>
      </article>
    </div>
  );
}

function BusinessRuleCard({ rule }) {
  return (
    <article className="admin-rule-card">
      <strong>{rule[0]}</strong>
      <p>{rule[1]}</p>
      <span>Used by: {rule[2]}</span>
    </article>
  );
}

function AuditTimeline({ entries }) {
  return (
    <div className="admin-audit-timeline">
      {entries.map((entry) => (
        <article key={entry.id}>
          <CircleDot size={15} />
          <time>{entry.time}</time>
          <div>
            <strong>{entry.title}</strong>
            <p>{entry.detail}</p>
          </div>
        </article>
      ))}
    </div>
  );
}

function ArchitectureDiagram() {
  return (
    <div className="admin-architecture-flow">
      {architectureFlow.map((item, index) => (
        <div key={item}>
          <span>{item}</span>
          {index < architectureFlow.length - 1 ? <ChevronRight size={16} /> : null}
        </div>
      ))}
    </div>
  );
}

function UserManagement({ onAction }) {
  const departments = {
    CEO: 'Executive',
    'Account Manager': 'Client Service',
    'Placement Lead': 'Market Placement',
    'Submission Specialist': 'Submission Operations',
    'Claims Coordinator': 'Claims',
    'Compliance Coordinator': 'Compliance',
    'Document Specialist': 'Document Operations',
  };
  return (
    <ConfigurationCard
      id="admin-users"
      title="User & Team Management"
      eyebrow="People"
      action={<button type="button" onClick={() => onAction('Create User')}>Create User</button>}
    >
      <div className="admin-user-table">
        <div><span>Name</span><span>Role</span><span>Department</span><span>Clients</span><span>Tasks</span><span>Workload</span><span>Status</span><span>Last Activity</span></div>
        {simulationData.teamMembers.map((user, index) => (
          <article key={user.id}>
            <strong>{user.name}</strong>
            <span>{user.role}</span>
            <span>{departments[user.role] ?? 'Operations'}</span>
            <span>{user.assignedClients.length}</span>
            <span>{user.openTasks} open / {user.overdueTasks} overdue</span>
            <WorkloadIndicator score={user.workloadScore} />
            <HealthIndicator status={user.workloadScore >= 82 ? 'Watch' : 'Healthy'} />
            <span>{formatDate(simulationData.activities[index % simulationData.activities.length].timestamp)}</span>
            <footer>
              {['Deactivate User', 'Assign Role', 'Reset Password', 'Assign Clients', 'Assign Team', 'View Workload', 'Open User Profile'].map((label) => (
                <button key={label} type="button" onClick={() => onAction(`${label}: ${user.name}`)}>{label}</button>
              ))}
            </footer>
          </article>
        ))}
      </div>
    </ConfigurationCard>
  );
}

export function PlatformAdministrationWorkspace() {
  const [search, setSearch] = useState('');
  const [selectedWorkflow, setSelectedWorkflow] = useState(0);
  const [actionLog, setActionLog] = useState(['System Configuration Saved', 'Notification Rule Updated', 'ARI Threshold Changed']);

  const referenceGroups = useMemo(() => {
    const rows = (items, category = 'Configured') => items.map((name) => ({ name, category, status: 'Healthy' }));
    return [
      { title: 'Insurers', rows: rows(unique(simulationData.policies.map((policy) => policy.insurer)), 'Market') },
      { title: 'Policy Types', rows: rows(unique(simulationData.policies.map((policy) => policy.policyType)), 'Coverage') },
      { title: 'Aircraft Types', rows: rows(['Commercial jet', 'Regional aircraft', 'Business jet', 'Helicopter', 'Cargo aircraft', 'Training aircraft'], 'Aviation') },
      { title: 'Aircraft Manufacturers', rows: rows(['Airbus', 'Boeing', 'Bombardier', 'Cessna', 'Embraer', 'Gulfstream'], 'Aviation') },
      { title: 'Client Types', rows: rows(unique(simulationData.clients.map((client) => client.clientType)), 'Client') },
      { title: 'Claim Types', rows: rows(unique(simulationData.claims.map((claim) => claim.claimType)), 'Claims') },
      { title: 'Document Types', rows: rows(unique(simulationData.documents.map((document) => document.documentType)), 'Documents') },
      { title: 'Risk Categories', rows: rows(['Revenue', 'Retention', 'Claims', 'Compliance', 'ARI', 'Document'], 'Risk') },
      { title: 'Compliance Categories', rows: rows(unique(simulationData.compliance.map((item) => item.findingType)), 'Compliance') },
      { title: 'Workflow Stages', rows: rows(['Client', 'Renewal', 'Submission', 'Market Placement', 'Binding', 'Claims', 'Compliance'], 'Workflow') },
      { title: 'ARI Categories', rows: rows(['Low', 'Moderate', 'Elevated', 'Severe'], 'External Risk') },
      { title: 'Task Categories', rows: rows(unique(simulationData.tasks.map((task) => task.category)), 'Operations') },
    ];
  }, []);

  const systemHealth = useMemo(() => {
    const documentGaps = getDocumentGapCount(simulationData.documents);
    const claimsExposure = getClaimsExposure(simulationData.claims);
    const brokenClientLinks = [
      ...simulationData.renewals,
      ...simulationData.claims,
      ...simulationData.documents,
      ...simulationData.tasks,
    ].filter((record) => !simulationData.clients.some((client) => client.id === record.clientId)).length;
    return [
      ['JSON Integrity', 'Healthy', `${Object.keys(simulationData).length} data domains loaded`],
      ['Business Rules', 'Healthy', `${businessRules.length} transparent rules configured`],
      ['Broken Links', brokenClientLinks ? 'Action' : 'Healthy', `${brokenClientLinks} orphaned client references`],
      ['Navigation', 'Healthy', '11 primary workspaces registered'],
      ['Cross References', 'Healthy', 'Client, policy, task and activity references are aligned'],
      ['Client Consistency', 'Healthy', `${simulationData.clients.length} client records configured`],
      ['Renewal Consistency', 'Healthy', `${simulationData.renewals.length} renewal records configured`],
      ['Claim Consistency', claimsExposure.requiringReview > 4 ? 'Watch' : 'Healthy', `${claimsExposure.requiringReview} claims require executive review`],
      ['Document Relationships', documentGaps > 4 ? 'Watch' : 'Healthy', `${documentGaps} document gaps or review items`],
      ['ARI Status', aviationRiskIndex.domestic.category === 'Moderate' ? 'Healthy' : 'Watch', `${aviationRiskIndex.domestic.score}/100 domestic ARI`],
      ['iBar Status', 'Healthy', 'Server-side deterministic fallback active'],
      ['System Health', 'Healthy', 'Demo platform ready for presentation'],
    ];
  }, []);

  const auditEntries = actionLog.map((title, index) => ({
    id: `${title}-${index}`,
    time: index === 0 ? 'Now' : `${index + 1}h ago`,
    title,
    detail: 'Simulated configuration activity recorded for demo visibility.',
  }));

  function handleAction(label) {
    setActionLog((current) => [label, ...current].slice(0, 8));
  }

  const platformVersion = '12.0-demo';
  const configuredInsurers = unique(simulationData.policies.map((policy) => policy.insurer)).length;
  const policyTypes = unique(simulationData.policies.map((policy) => policy.policyType)).length;
  const revenueAtRisk = calculateRevenueAtRisk(simulationData.renewals, simulationData.clients);
  const healthScore = Math.round(
    getAverage(simulationData.clients, 'clientHealthScore') * 0.28 +
    getAverage(simulationData.renewals, 'readinessScore') * 0.22 +
    getAverage(simulationData.submissions, 'completionPercent') * 0.18 +
    (100 - Math.min(100, (revenueAtRisk / Math.max(1, getSum(simulationData.clients, 'estimatedRevenue'))) * 100)) * 0.18 +
    (100 - aviationRiskIndex.domestic.score) * 0.14,
  );

  return (
    <div className="admin-workspace page-transition">
      <section className="admin-hero">
        <div>
          <span>Platform Administration & Business Configuration</span>
          <h1>Operational Configuration Centre</h1>
          <p>Configure users, roles, business rules, reference data, workflows, iBar architecture and platform health without changing software.</p>
        </div>
        <div className="admin-hero-status">
          <strong>{healthScore}</strong>
          <span>System Health</span>
        </div>
      </section>

      <nav className="admin-jump-nav" aria-label="Administration sections">
        {['Overview', 'Users', 'Roles', 'Settings', 'Reference', 'Rules', 'iBar', 'Health', 'Workflow', 'Dictionary'].map((item) => <a key={item} href={`#admin-${item.toLowerCase()}`}>{item}</a>)}
      </nav>

      <section id="admin-overview" className="admin-metric-grid">
        <PlatformMetric icon={UsersRound} label="Users" value={simulationData.teamMembers.length} helper="Simulated platform users" />
        <PlatformMetric icon={ShieldCheck} label="Active Roles" value={roleDefinitions.length} helper="Business responsibilities" />
        <PlatformMetric icon={SlidersHorizontal} label="Business Rules" value={businessRules.length} helper="Transparent derived logic" />
        <PlatformMetric icon={Landmark} label="Configured Insurers" value={configuredInsurers} helper={`${policyTypes} policy types`} />
        <PlatformMetric icon={Plane} label="Aircraft Types" value={6} helper="Aviation reference library" />
        <PlatformMetric icon={BellRing} label="Notification Rules" value={notificationRules.length} helper="Workflow alert rules" tone="amber" />
        <PlatformMetric icon={Gauge} label="ARI Configuration" value={aviationRiskIndex.domestic.category} helper={`${aviationRiskIndex.domestic.score}/100 domestic`} tone="amber" />
        <PlatformMetric icon={Bot} label="iBar Status" value="Online" helper="Fallback and routing ready" tone="green" />
        <PlatformMetric icon={Database} label="Platform Version" value={platformVersion} helper={`Updated ${asOfDate}`} />
        <PlatformMetric icon={CheckCircle2} label="Demo Dataset" value="Loaded" helper={`${simulationData.clients.length} clients, ${simulationData.policies.length} policies`} tone="green" />
      </section>

      <UserManagement onAction={handleAction} />

      <ConfigurationCard id="admin-roles" title="Roles & Responsibilities" eyebrow="Governance">
        <div className="admin-hierarchy">
          <span>Board</span><ChevronRight size={16} /><span>CEO</span><ChevronRight size={16} /><span>Account, Placement, Claims, Compliance, Documents</span><ChevronRight size={16} /><span>Configured Workflows</span>
        </div>
        <RoleMatrix />
      </ConfigurationCard>

      <ConfigurationCard id="admin-settings" title="Business Configuration" eyebrow="Settings" action={<button type="button" onClick={() => handleAction('Business Rule Changed')}>Save Configuration</button>}>
        <div className="admin-settings-grid">
          {businessSettings.map(([label, value, helper]) => (
            <article key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
              <p>{helper}</p>
            </article>
          ))}
        </div>
      </ConfigurationCard>

      <ConfigurationCard
        id="admin-reference"
        title="Reference Data"
        eyebrow="Configurable Lists"
        action={<div className="admin-search"><Search size={15} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search reference data" /></div>}
      >
        <div className="admin-reference-actions">
          {['Add', 'Edit', 'Deactivate', 'Filter'].map((label) => <button key={label} type="button" onClick={() => handleAction(`Reference Data ${label}`)}>{label}</button>)}
        </div>
        <div className="admin-reference-grid">
          {referenceGroups.map((group) => <ReferenceTable key={group.title} title={group.title} rows={group.rows} search={search} />)}
        </div>
      </ConfigurationCard>

      <ConfigurationCard id="admin-rules" title="Notification & Workflow Rules" eyebrow="Automation Configuration">
        <div className="admin-rule-table">
          <div><span>Rule</span><span>Audience</span><span>Behavior</span><span>Trigger</span><span>Status</span></div>
          {notificationRules.map(([rule, audience, behavior, trigger]) => (
            <article key={rule}>
              <strong>{rule}</strong><span>{audience}</span><span>{behavior}</span><span>{trigger}</span><HealthIndicator status="Healthy" />
            </article>
          ))}
        </div>
      </ConfigurationCard>

      <ConfigurationCard id="admin-ibar" title="AI & iBar Configuration" eyebrow="Architecture Only" action={<button type="button" onClick={() => handleAction('Test Query')}>Test Query</button>}>
        <div className="admin-ibar-grid">
          {[
            ['Status', 'Online', 'Server function responds with structured business answers'],
            ['Current Provider', 'Deterministic fallback', 'microLM adapter ready when configured'],
            ['Model Name', 'server-side-microLM-adapter', 'No prompts, secrets or API keys exposed'],
            ['Fallback Mode', 'Enabled', 'Ensures demo responses stay available'],
            ['Intent Library', '11 intent groups', 'Navigation, clients, renewals, claims, reports and administration'],
            ['Registered Workspaces', '11', 'Executive through Administration'],
            ['Registered Business Tools', '9', 'Search, summaries, ARI, reports and configuration'],
            ['Registered Entity Types', 'Client, claim, renewal, submission', 'Resolved from shared JSON model'],
            ['Context Memory', 'Local session only', 'No persistent backend storage'],
            ['Recent Queries', 'Show business rules; Open AI configuration', 'Displayed for demo transparency'],
            ['Server Status', 'Healthy', 'Netlify function architecture'],
          ].map(([label, value, helper]) => (
            <article key={label}><span>{label}</span><strong>{value}</strong><p>{helper}</p></article>
          ))}
        </div>
        <div className="admin-reference-actions">
          {['Refresh Intents', 'Rebuild Index', 'Enable Logging', 'Disable Logging', 'Clear Cache'].map((label) => <button key={label} type="button" onClick={() => handleAction(label)}>{label}</button>)}
        </div>
      </ConfigurationCard>

      <ConfigurationCard id="admin-health" title="System Health" eyebrow="Operational Readiness">
        <div className="admin-health-grid">
          {systemHealth.map(([label, status, detail]) => <SystemHealthCard key={label} label={label} status={status} detail={detail} />)}
        </div>
      </ConfigurationCard>

      <ConfigurationCard id="admin-workflow" title="Workflow Designer" eyebrow="Visualizer">
        <WorkflowDiagram selected={selectedWorkflow} onSelect={setSelectedWorkflow} />
      </ConfigurationCard>

      <ConfigurationCard id="admin-dictionary" title="Data Dictionary" eyebrow="Platform Entities">
        <div className="admin-dictionary-table">
          <div><span>Entity</span><span>Purpose</span><span>Relationships</span><span>Used By</span><span>Primary Workspace</span></div>
          {dataDictionary.map(([entity, purpose, relationships, usedBy, workspace]) => (
            <article key={entity}><strong>{entity}</strong><span>{purpose}</span><span>{relationships}</span><span>{usedBy}</span><em>{workspace}</em></article>
          ))}
        </div>
      </ConfigurationCard>

      <ConfigurationCard title="Business Rules" eyebrow="Metric Transparency">
        <div className="admin-business-rule-grid">
          {businessRules.map((rule) => <BusinessRuleCard key={rule[0]} rule={rule} />)}
        </div>
      </ConfigurationCard>

      <div className="admin-two-column">
        <ConfigurationCard title="Platform Architecture" eyebrow="Demo Mode">
          <ArchitectureDiagram />
        </ConfigurationCard>
        <ConfigurationCard title="Audit Log" eyebrow="Simulated Activity">
          <AuditTimeline entries={auditEntries} />
        </ConfigurationCard>
      </div>
    </div>
  );
}
