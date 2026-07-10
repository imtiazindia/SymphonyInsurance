import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { simulationData } from '../data/demoData.js';

const moduleCopy = {
  Renewals: 'Renewal workflow placeholder ready for Phase 5.',
  Submissions: 'Submission workspace placeholder connected to the shared JSON model.',
  'Market Placement': 'Market placement placeholder for quote, negotiation, and insurer workflow.',
  Claims: 'Claims workspace placeholder for claim review and reserves.',
  Compliance: 'Compliance actions placeholder for findings and corrective action tracking.',
  Documents: 'Documents placeholder for client document follow-up.',
  Administration: 'Administration placeholder for configuration and team settings.',
};

function findClient(clientId) {
  return simulationData.clients.find((client) => client.id === clientId);
}

function findRecord(moduleName, id) {
  if (!id) return null;
  const dataMap = {
    Renewals: simulationData.renewals,
    Submissions: simulationData.submissions,
    'Market Placement': simulationData.negotiations,
    Claims: simulationData.claims,
    Compliance: simulationData.compliance,
    Documents: simulationData.documents,
  };
  return dataMap[moduleName]?.find((record) => record.id === id) ?? null;
}

export function ModulePlaceholderPage({ title, idParam }) {
  const params = useParams();
  const [searchParams] = useSearchParams();
  const recordId = params[idParam] ?? searchParams.get('id') ?? searchParams.get('renewalId') ?? searchParams.get('claimId') ?? searchParams.get('documentId') ?? searchParams.get('negotiationId') ?? searchParams.get('submissionId') ?? searchParams.get('complianceId');
  const record = findRecord(title, recordId);
  const client = findClient(record?.clientId ?? searchParams.get('clientId'));

  return (
    <div className="module-placeholder-page page-transition">
      <section className="module-placeholder-card">
        <Link className="module-placeholder-card__back" to="/">
          <ArrowLeft size={16} />
          Executive Overview
        </Link>
        <span>Phase 5 Ready</span>
        <h1>{recordId ? `${title} Detail` : title}</h1>
        <p>{moduleCopy[title] ?? 'Workspace placeholder connected to the shared JSON model.'}</p>
        <div className="module-placeholder-card__meta">
          {recordId ? <strong>Record: {recordId}</strong> : null}
          {client ? <Link to={`/clients?clientId=${client.id}`}>{client.name}</Link> : null}
        </div>
        <Link className="module-placeholder-card__action" to={client ? `/clients?clientId=${client.id}` : '/clients'}>
          Open related client workspace
          <ArrowRight size={16} />
        </Link>
      </section>
    </div>
  );
}
