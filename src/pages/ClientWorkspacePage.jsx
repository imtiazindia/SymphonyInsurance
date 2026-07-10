import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, Building2 } from 'lucide-react';
import {
  ClientHealthBadge,
  ComplianceSeverityBadge,
  DocumentStatusBadge,
  RevenueImpactLabel,
  RenewalStatusBadge,
} from '../components/BusinessComponents.jsx';
import { simulationData } from '../data/demoData.js';
import { getAriClientExposure, getAriView } from '../utils/aviationRiskIndex.js';

const compactCurrencyFormatter = new Intl.NumberFormat('en-US', {
  currency: 'USD',
  maximumFractionDigits: 1,
  notation: 'compact',
  style: 'currency',
});

const dateFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

function compactCurrency(value) {
  return compactCurrencyFormatter.format(value || 0).replace('.0', '');
}

function formatDate(date) {
  return dateFormatter.format(new Date(`${date}T00:00:00Z`));
}

function userName(userId) {
  return simulationData.teamMembers.find((member) => member.id === userId)?.name ?? 'Unassigned';
}

function getClientBundle(clientId) {
  return {
    claims: simulationData.claims.filter((claim) => claim.clientId === clientId),
    compliance: simulationData.compliance.filter((item) => item.clientId === clientId),
    documents: simulationData.documents.filter((document) => document.clientId === clientId),
    negotiations: simulationData.negotiations.filter((negotiation) => negotiation.clientId === clientId),
    renewals: simulationData.renewals.filter((renewal) => renewal.clientId === clientId),
    submissions: simulationData.submissions.filter((submission) => submission.clientId === clientId),
    tasks: simulationData.tasks.filter((task) => task.clientId === clientId),
  };
}

function ClientAriExposure({ client }) {
  const ari = getAriView();
  const exposure = getAriClientExposure(client, ari);

  return (
    <section className="ari-workspace-card">
      <h2>Aviation Risk Index Exposure</h2>
      <p>{exposure.note}</p>
      <div className="ari-workspace-metrics">
        <div>
          <strong>{ari.score} / 100</strong>
          <span>{ari.category}</span>
        </div>
        <div>
          <strong>{exposure.level}</strong>
          <span>client exposure level</span>
        </div>
        <div>
          <strong>{exposure.drivers.length}</strong>
          <span>current ARI drivers</span>
        </div>
      </div>
      <div className="ari-chip-list">
        {exposure.drivers.map((driver) => <span key={driver}>{driver}</span>)}
      </div>
    </section>
  );
}

export function ClientWorkspacePage() {
  const [searchParams] = useSearchParams();
  const selectedClientId = searchParams.get('clientId') ?? simulationData.clients[0]?.id;
  const selectedClient = simulationData.clients.find((client) => client.id === selectedClientId) ?? simulationData.clients[0];
  const bundle = getClientBundle(selectedClient.id);
  const primaryRenewal = bundle.renewals[0];
  const primaryDocument = bundle.documents.find((document) => document.status !== 'Approved') ?? bundle.documents[0];
  const primaryCompliance = bundle.compliance[0];

  return (
    <div className="client-workspace-page page-transition">
      <section className="client-workspace-hero">
        <div>
          <span>Client Workspace</span>
          <h1>{selectedClient.name}</h1>
          <p>{selectedClient.shortBusinessSummary}</p>
        </div>
        <RevenueImpactLabel value={compactCurrency(selectedClient.estimatedRevenue)} label="Estimated annual revenue" />
      </section>

      <section className="client-workspace-layout">
        <aside className="client-list-card">
          <h2>Clients</h2>
          {simulationData.clients.slice(0, 12).map((client) => (
            <Link key={client.id} className={client.id === selectedClient.id ? 'client-list-item client-list-item--active' : 'client-list-item'} to={`/clients?clientId=${client.id}`}>
              <Building2 size={16} />
              <span>{client.name}</span>
            </Link>
          ))}
        </aside>

        <div className="client-detail-stack">
          <section className="client-detail-card">
            <h2>Business Profile</h2>
            <div className="client-profile-grid">
              <ProfileMetric label="Annual Premium" value={compactCurrency(selectedClient.annualPremium)} />
              <ProfileMetric label="Renewal Date" value={formatDate(selectedClient.renewalDate)} />
              <ProfileMetric label="Open Tasks" value={selectedClient.openTasksCount} />
              <ProfileMetric label="Open Claims" value={selectedClient.openClaimsCount} />
              <ProfileMetric label="Document Completion" value={`${selectedClient.documentCompleteness}%`} />
              <ProfileMetric label="Compliance Score" value={`${selectedClient.complianceScore}%`} />
            </div>
            <div className="client-team-row">
              <div>
                <span>Account Manager</span>
                <strong>{userName(selectedClient.assignedAccountManagerId)}</strong>
              </div>
              <div>
                <span>Placement Lead</span>
                <strong>{userName(selectedClient.assignedPlacementLeadId)}</strong>
              </div>
              <ClientHealthBadge score={selectedClient.clientHealthScore} />
            </div>
          </section>

          <ClientAriExposure client={selectedClient} />

          <section className="client-detail-grid">
            <LinkedRecord title="Renewal" href={primaryRenewal ? `/renewals/${primaryRenewal.id}` : '/renewals'} action="Open renewal">
              {primaryRenewal ? (
                <>
                  <RenewalStatusBadge status={primaryRenewal.currentStage} />
                  <p>{primaryRenewal.daysToExpiry} days to expiry / {primaryRenewal.readinessScore}% readiness</p>
                </>
              ) : <p>No active renewal record.</p>}
            </LinkedRecord>
            <LinkedRecord title="Submission" href={bundle.submissions[0] ? `/submissions/${bundle.submissions[0].id}` : '/submissions'} action="Open submission">
              {bundle.submissions[0] ? <p>{bundle.submissions[0].completionPercent}% complete / {bundle.submissions[0].status}</p> : <p>No submission record.</p>}
            </LinkedRecord>
            <LinkedRecord title="Claims" href={bundle.claims[0] ? `/claims/${bundle.claims[0].id}` : '/claims'} action="Open claims">
              <p>{bundle.claims.length} open or recent claim records</p>
            </LinkedRecord>
            <LinkedRecord title="Documents" href={primaryDocument ? `/documents/${primaryDocument.id}` : '/documents'} action="Open documents">
              {primaryDocument ? (
                <>
                  <DocumentStatusBadge status={primaryDocument.status} />
                  <p>{primaryDocument.documentType} / expires {formatDate(primaryDocument.expiryDate)}</p>
                </>
              ) : <p>No document record.</p>}
            </LinkedRecord>
            <LinkedRecord title="Compliance" href={primaryCompliance ? `/compliance/${primaryCompliance.id}` : '/compliance'} action="Open compliance">
              {primaryCompliance ? (
                <>
                  <ComplianceSeverityBadge severity={primaryCompliance.severity} />
                  <p>{primaryCompliance.findingType} / {primaryCompliance.status}</p>
                </>
              ) : <p>No compliance record.</p>}
            </LinkedRecord>
            <LinkedRecord title="Market Placement" href={bundle.negotiations[0] ? `/market-placement/${bundle.negotiations[0].id}` : '/market-placement'} action="Open placement">
              {bundle.negotiations[0] ? <p>{bundle.negotiations[0].recommendedInsurer} / {bundle.negotiations[0].currentStatus}</p> : <p>No active placement record.</p>}
            </LinkedRecord>
          </section>
        </div>
      </section>
    </div>
  );
}

function ProfileMetric({ label, value }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function LinkedRecord({ title, href, action, children }) {
  return (
    <article className="client-linked-record">
      <h3>{title}</h3>
      <div>{children}</div>
      <Link to={href}>
        {action}
        <ArrowRight size={15} />
      </Link>
    </article>
  );
}
