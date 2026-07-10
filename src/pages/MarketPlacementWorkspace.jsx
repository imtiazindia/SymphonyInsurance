import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowRight,
  BadgeDollarSign,
  Building2,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  ClipboardList,
  Handshake,
  MessageSquareText,
  Search,
  Send,
  TrendingDown,
} from 'lucide-react';
import {
  BusinessActivityTimeline,
  BusinessKpiCard,
  RevenueImpactLabel,
  TaskPriorityBadge,
} from '../components/BusinessComponents.jsx';
import { simulationData } from '../data/demoData.js';
import { getAriView } from '../utils/aviationRiskIndex.js';
import { getSum } from '../utils/businessCalculations.js';

const dateFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
const shortDateFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });
const timeFormatter = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', month: 'short', day: 'numeric' });
const compactCurrencyFormatter = new Intl.NumberFormat('en-US', {
  currency: 'USD',
  maximumFractionDigits: 1,
  notation: 'compact',
  style: 'currency',
});

const clientsById = new Map(simulationData.clients.map((client) => [client.id, client]));
const usersById = new Map(simulationData.teamMembers.map((user) => [user.id, user]));

const marketStatuses = ['Submitted', 'Questions Raised', 'Quoted', 'Negotiating', 'Declined', 'Withdrawn', 'Recommended'];
const savedViews = [
  ['all', 'All Placements'],
  ['awaiting', 'Awaiting Response'],
  ['quoted', 'Quotes Received'],
  ['decision', 'Client Decision Needed'],
  ['highValue', 'High Value'],
  ['bind', 'Ready To Bind'],
];

function compactCurrency(value) {
  return compactCurrencyFormatter.format(value || 0).replace('.0', '');
}

function formatDate(date) {
  if (!date) return 'Not set';
  if (date instanceof Date) return dateFormatter.format(date);
  return dateFormatter.format(new Date(`${date}T00:00:00Z`));
}

function shortDate(date) {
  if (!date) return 'Not set';
  return shortDateFormatter.format(new Date(`${date}T00:00:00Z`));
}

function userName(userId) {
  return usersById.get(userId)?.name ?? 'Unassigned';
}

function clientName(clientId) {
  return clientsById.get(clientId)?.name ?? 'Unassigned client';
}

function placementLeadFor(client) {
  return usersById.get(client.assignedPlacementLeadId) ?? simulationData.teamMembers.find((member) => member.role === 'Placement Lead');
}

function statusTone(status) {
  if (['Declined', 'Withdrawn'].includes(status)) return 'red';
  if (['Questions Raised', 'Negotiating'].includes(status)) return 'amber';
  if (['Quoted', 'Recommended'].includes(status)) return 'green';
  return 'blue';
}

function priorityFor(bundle) {
  if (bundle.negotiation.decisionRequired || bundle.client.priorityLevel === 'Critical') return 'High';
  if (bundle.negotiation.pendingQuestions.length || bundle.negotiation.currentStatus === 'Negotiation') return 'Medium';
  return 'Low';
}

function expectedBindingDate(renewal) {
  const date = new Date(`${renewal?.expiryDate ?? renewal?.renewalDate ?? '2026-08-30'}T00:00:00Z`);
  date.setDate(date.getDate() - 7);
  return date;
}

function marketRowFor(insurer, index, bundle) {
  const { client, negotiation, renewal } = bundle;
  const submitted = new Date(`${renewal?.expiryDate ?? client.renewalDate}T00:00:00Z`);
  submitted.setDate(submitted.getDate() - (42 - index * 2));
  const responded = new Date(submitted);
  responded.setDate(responded.getDate() + 5 + index);
  const quoted = index < negotiation.quotesReceived;
  const recommended = insurer === negotiation.recommendedInsurer;
  const status = recommended ? 'Recommended' : quoted ? (negotiation.currentStatus === 'Negotiation' ? 'Negotiating' : 'Quoted') : index % 4 === 2 ? 'Questions Raised' : index % 5 === 3 ? 'Declined' : 'Submitted';
  const premium = quoted || recommended ? Math.round(negotiation.bestQuote * (1 + (index - 1) * 0.025)) : 0;
  const deductible = client.clientType.includes('School') ? 50000 + index * 10000 : 150000 + index * 25000;
  const limit = client.clientType.includes('Airport') ? 250000000 : client.annualPremium > 10000000 ? 750000000 : 100000000;

  return {
    deductible,
    exclusions: index % 2 ? 'War, noise, contractual liability as scheduled' : 'Standard aviation exclusions',
    financialRating: index % 3 === 0 ? 'A XV' : index % 3 === 1 ? 'A+ XV' : 'A XIII',
    insurer,
    keyConditions: recommended ? 'Broadest liability wording; acceptable hull deductible' : status === 'Questions Raised' ? 'Subject to pilot and loss details' : status === 'Declined' ? 'Insufficient appetite for exposure profile' : 'Subject to final underwriting review',
    limit,
    overallRecommendation: recommended ? 'Recommended' : quoted ? 'Comparable option' : 'Monitor response',
    pilotRestrictions: index % 2 ? 'Named pilots and recurrent training warranty' : 'Standard pilot approval wording',
    premium,
    recommendation: recommended ? 'Recommended' : quoted ? 'Consider' : 'No recommendation',
    responseDate: status === 'Submitted' ? '' : responded.toISOString().slice(0, 10),
    specialConditions: index % 2 ? 'Quarterly claims update required' : 'No unusual special conditions',
    status,
    submissionDate: submitted.toISOString().slice(0, 10),
    trainingRequirements: index % 2 ? 'Annual simulator or recurrent training evidence' : 'Standard recurrent training evidence',
  };
}

function buildBundle(negotiation) {
  const client = clientsById.get(negotiation.clientId);
  const renewal = simulationData.renewals.find((item) => item.id === negotiation.renewalId || item.clientId === negotiation.clientId);
  const submission = simulationData.submissions.find((item) => item.clientId === negotiation.clientId);
  const policies = simulationData.policies.filter((item) => item.clientId === negotiation.clientId);
  const claims = simulationData.claims.filter((item) => item.clientId === negotiation.clientId);
  const compliance = simulationData.compliance.filter((item) => item.clientId === negotiation.clientId);
  const documents = simulationData.documents.filter((item) => item.clientId === negotiation.clientId);
  const tasks = simulationData.tasks.filter((item) => item.clientId === negotiation.clientId);
  const activities = simulationData.activities.filter((item) => item.clientId === negotiation.clientId);
  const placementLead = placementLeadFor(client);
  const markets = negotiation.insurersApproached.map((insurer, index) => marketRowFor(insurer, index, { client, negotiation, renewal }));
  const recommended = markets.find((market) => market.insurer === negotiation.recommendedInsurer) ?? markets.find((market) => market.status === 'Recommended') ?? markets[0];

  return {
    activities,
    claims,
    client,
    compliance,
    documents,
    markets,
    negotiation,
    placementLead,
    policies,
    recommended,
    renewal,
    submission,
    tasks,
  };
}

function nextStepFor(bundle) {
  if (bundle.negotiation.decisionRequired) return 'Move to client review';
  if (bundle.negotiation.pendingQuestions.length) return 'Respond to underwriter';
  if (bundle.negotiation.quotesReceived >= 2 && bundle.negotiation.estimatedSavings > 0) return 'Update recommendation';
  if (bundle.negotiation.currentStatus === 'Negotiation') return 'Record phone discussion';
  return 'Request market response';
}

function enrichNegotiation(negotiation) {
  const bundle = buildBundle(negotiation);
  return {
    ...bundle,
    financialValue: bundle.client.estimatedRevenue,
    nextStep: nextStepFor(bundle),
    priority: priorityFor(bundle),
  };
}

function applyFilters(items, filters) {
  return items.filter((item) => {
    const { client, markets, negotiation, placementLead } = item;
    if (filters.search && !client.name.toLowerCase().includes(filters.search.toLowerCase())) return false;
    if (filters.placementLead !== 'all' && placementLead.id !== filters.placementLead) return false;
    if (filters.status !== 'all' && negotiation.currentStatus !== filters.status) return false;
    if (filters.client !== 'all' && client.id !== filters.client) return false;
    if (filters.insurer !== 'all' && !markets.some((market) => market.insurer === filters.insurer)) return false;
    if (filters.revenueRange === 'high' && client.estimatedRevenue < 1000000) return false;
    if (filters.revenueRange === 'mid' && (client.estimatedRevenue < 250000 || client.estimatedRevenue >= 1000000)) return false;
    if (filters.premiumRange === 'high' && negotiation.bestQuote < 10000000) return false;
    if (filters.premiumRange === 'mid' && (negotiation.bestQuote < 1000000 || negotiation.bestQuote >= 10000000)) return false;
    if (filters.savedView === 'awaiting' && !negotiation.pendingQuestions.length) return false;
    if (filters.savedView === 'quoted' && negotiation.quotesReceived === 0) return false;
    if (filters.savedView === 'decision' && !negotiation.decisionRequired) return false;
    if (filters.savedView === 'highValue' && client.estimatedRevenue < 1000000) return false;
    if (filters.savedView === 'bind' && !(negotiation.quotesReceived > 1 && !negotiation.pendingQuestions.length)) return false;
    return true;
  });
}

function ExecutiveSummary({ items }) {
  const marketsApproached = getSum(items.map((item) => ({ value: item.markets.length })), 'value');
  const quotesReceived = getSum(items.map((item) => ({ value: item.negotiation.quotesReceived })), 'value');
  const awaiting = items.filter((item) => item.negotiation.pendingQuestions.length).length;
  const decisions = items.filter((item) => item.negotiation.decisionRequired).length;
  const premiumPlaced = getSum(items.map((item) => ({ value: item.negotiation.bestQuote })), 'value');
  const commission = getSum(items.map((item) => ({ value: getSum(item.policies, 'estimatedCommission') })), 'value');
  const savings = getSum(items.map((item) => ({ value: item.negotiation.estimatedSavings })), 'value');

  return (
    <section className="market-summary-grid" aria-label="Market placement summary">
      <BusinessKpiCard icon={Handshake} label="Placements In Progress" value={items.length} helper="Active market records" />
      <BusinessKpiCard icon={Send} label="Markets Approached" value={marketsApproached} helper="Carrier submissions" />
      <BusinessKpiCard icon={BadgeDollarSign} label="Quotes Received" value={quotesReceived} helper="Comparable options" tone="green" />
      <BusinessKpiCard icon={MessageSquareText} label="Awaiting Response" value={awaiting} helper="Questions or follow-up" tone="amber" />
      <BusinessKpiCard icon={ClipboardList} label="Client Decisions Pending" value={decisions} helper="Approval needed" tone="amber" />
      <BusinessKpiCard icon={CircleDollarSign} label="Estimated Premium Placed" value={compactCurrency(premiumPlaced)} helper="Best quoted premium" />
      <BusinessKpiCard icon={Building2} label="Estimated Commission" value={compactCurrency(commission)} helper="Linked policies" />
      <BusinessKpiCard icon={TrendingDown} label="Client Savings" value={compactCurrency(savings)} helper="Negotiated opportunity" tone="green" />
    </section>
  );
}

function FilterBar({ clients, filters, insurers, placementLeads, statuses, setFilters }) {
  function update(key, value) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  return (
    <section className="market-filter-card">
      <div className="market-saved-views">
        {savedViews.map(([id, label]) => (
          <button key={id} type="button" className={filters.savedView === id ? 'market-chip market-chip--active' : 'market-chip'} onClick={() => update('savedView', id)}>
            {label}
          </button>
        ))}
      </div>
      <div className="market-filter-grid">
        <label>
          <span>Search</span>
          <div className="market-search-input">
            <Search size={16} />
            <input value={filters.search} onChange={(event) => update('search', event.target.value)} placeholder="Client or market" />
          </div>
        </label>
        <Select label="Placement Lead" value={filters.placementLead} onChange={(value) => update('placementLead', value)} options={placementLeads.map((lead) => [lead.id, lead.name])} />
        <Select label="Market Status" value={filters.status} onChange={(value) => update('status', value)} options={statuses.map((status) => [status, status])} />
        <Select label="Client" value={filters.client} onChange={(value) => update('client', value)} options={clients.map((client) => [client.id, client.name])} />
        <Select label="Insurer" value={filters.insurer} onChange={(value) => update('insurer', value)} options={insurers.map((insurer) => [insurer, insurer])} />
        <Select label="Revenue Range" value={filters.revenueRange} onChange={(value) => update('revenueRange', value)} options={[['high', 'Over $1M'], ['mid', '$250K - $1M']]} />
        <Select label="Premium Range" value={filters.premiumRange} onChange={(value) => update('premiumRange', value)} options={[['high', 'Over $10M'], ['mid', '$1M - $10M']]} />
      </div>
    </section>
  );
}

function PriorityPlacements({ items }) {
  const priorityItems = items
    .filter((item) => item.priority !== 'Low' || item.negotiation.estimatedSavings > 0)
    .sort((a, b) => b.client.estimatedRevenue - a.client.estimatedRevenue)
    .slice(0, 6);

  return (
    <section className="market-card">
      <SectionHeader title="Priority Placements" text="Opportunities requiring senior broker action, client approval, or underwriter follow-up." />
      <div className="market-priority-list">
        {priorityItems.map((item) => (
          <article className="market-priority-card" key={item.negotiation.id}>
            <div className="market-priority-card__main">
              <TaskPriorityBadge priority={item.priority} />
              <div>
                <Link to={`/clients?clientId=${item.client.id}`}>{item.client.name}</Link>
                <p>{item.negotiation.pendingQuestions[0] ?? `Best option from ${item.negotiation.recommendedInsurer}`}</p>
              </div>
            </div>
            <dl>
              <Metric label="Renewal Date" value={shortDate(item.renewal?.expiryDate ?? item.client.renewalDate)} />
              <Metric label="Current Stage" value={item.negotiation.currentStatus} />
              <Metric label="Markets Contacted" value={item.markets.length} />
              <Metric label="Quotes Received" value={item.negotiation.quotesReceived} />
              <Metric label="Best Premium" value={compactCurrency(item.negotiation.bestQuote)} />
              <Metric label="Estimated Savings" value={compactCurrency(item.negotiation.estimatedSavings)} />
              <Metric label="Financial Value" value={compactCurrency(item.financialValue)} />
              <Metric label="Placement Lead" value={item.placementLead.name} />
            </dl>
            <div className="market-priority-card__actions">
              <span>{item.nextStep}</span>
              <Link to={`/market-placement/${item.negotiation.id}`}>Open placement <ArrowRight size={15} /></Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function MarketActivity({ items }) {
  const ids = new Set(items.map((item) => item.client.id));
  const source = simulationData.activities.filter((activity) => ids.has(activity.clientId));
  const synthetic = items.slice(0, 5).map((item, index) => ({
    id: `market-${item.negotiation.id}-${index}`,
    activityType: index % 2 ? 'Underwriter Question' : 'Quote Received',
    clientId: item.client.id,
    importanceLevel: item.negotiation.decisionRequired ? 'High' : 'Medium',
    summary: index % 2 ? `${item.negotiation.recommendedInsurer} requested updated support information` : `Quote received from ${item.negotiation.recommendedInsurer}`,
    timestamp: `2026-07-09T${14 - index}:1${index}:00Z`,
  }));

  return (
    <section className="market-card">
      <SectionHeader title="Market Activity" text="Recent placement movement across insurers, clients, and broker actions." />
      <BusinessActivityTimeline
        activities={[...synthetic, ...source].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 10)}
        getClientName={clientName}
        formatTime={(timestamp) => timeFormatter.format(new Date(timestamp))}
      />
    </section>
  );
}

function MarketExternalRiskSignal() {
  const ari = getAriView();

  return (
    <section className="ari-workspace-card">
      <h2>External Market Signal</h2>
      <p>{ari.workspaceSignals.marketPlacement}</p>
      <ul className="ari-workspace-list">
        {ari.businessImpact.slice(0, 3).map((item) => <li key={item}>{item}</li>)}
      </ul>
    </section>
  );
}

export function MarketPlacementWorkspace() {
  const { negotiationId } = useParams();
  const [filters, setFilters] = useState({
    client: 'all',
    insurer: 'all',
    placementLead: 'all',
    premiumRange: 'all',
    revenueRange: 'all',
    savedView: negotiationId ? 'all' : 'decision',
    search: '',
    status: 'all',
  });
  const [actionLog, setActionLog] = useState([]);
  const enriched = useMemo(() => simulationData.negotiations.map(enrichNegotiation), []);
  const filtered = useMemo(() => applyFilters(enriched, filters), [enriched, filters]);
  const activeItem = useMemo(
    () => enriched.find((item) => item.negotiation.id === negotiationId) ?? filtered[0] ?? enriched[0],
    [enriched, filtered, negotiationId],
  );
  const insurers = Array.from(new Set(enriched.flatMap((item) => item.markets.map((market) => market.insurer)))).sort();
  const placementLeads = simulationData.teamMembers.filter((member) => member.role === 'Placement Lead');
  const statuses = Array.from(new Set(enriched.map((item) => item.negotiation.currentStatus))).sort();

  function addAction(action) {
    setActionLog((current) => [{ id: `${Date.now()}-${action}`, action, time: 'Just now' }, ...current].slice(0, 4));
  }

  return (
    <div className="market-workspace page-transition">
      <section className="market-hero">
        <div>
          <span>Market Placement Workspace</span>
          <h1>{activeItem.client.name}</h1>
          <p>Where is this renewal in the insurance market, what decisions need to be made, and which placement option delivers the best outcome?</p>
        </div>
        <RevenueImpactLabel value={compactCurrency(activeItem.negotiation.estimatedSavings)} label="Estimated client savings" />
      </section>

      <ExecutiveSummary items={filtered} />
      <FilterBar
        clients={simulationData.clients}
        filters={filters}
        insurers={insurers}
        placementLeads={placementLeads}
        setFilters={setFilters}
        statuses={statuses}
      />
      <MarketExternalRiskSignal />
      <PriorityPlacements items={filtered} />
      <MarketActivity items={filtered} />
      <PlacementDetail item={activeItem} actionLog={actionLog} onAction={addAction} />
    </div>
  );
}

function PlacementDetail({ actionLog, item, onAction }) {
  const [expandedMarket, setExpandedMarket] = useState(item.recommended.insurer);
  const questions = buildQuestions(item);
  const history = buildHistory(item);

  return (
    <section className="market-detail-stack" id="placement-detail">
      <section className="market-detail-hero">
        <div>
          <span>Placement Detail</span>
          <h2>{item.client.name}</h2>
          <p>Broker-led placement strategy, market response, comparison, and recommendation.</p>
        </div>
        <StatusBadge status={item.negotiation.currentStatus} />
      </section>

      <div className="market-detail-meta">
        <Meta label="Renewal" value={formatDate(item.renewal?.expiryDate ?? item.client.renewalDate)} />
        <Meta label="Placement Lead" value={item.placementLead.name} />
        <Meta label="Target Premium" value={compactCurrency(item.negotiation.targetPremium)} />
        <Meta label="Current Best Premium" value={compactCurrency(item.negotiation.bestQuote)} />
        <Meta label="Potential Savings" value={compactCurrency(item.negotiation.estimatedSavings)} />
        <Meta label="Recommended Market" value={item.negotiation.recommendedInsurer} />
      </div>

      <QuickActions actionLog={actionLog} onAction={onAction} />
      <MarketsApproached expandedMarket={expandedMarket} item={item} setExpandedMarket={setExpandedMarket} />
      <QuoteComparison item={item} />
      <section className="market-two-column">
        <UnderwriterQuestions questions={questions} />
        <NegotiationHistory history={history} />
      </section>
      <section className="market-two-column market-two-column--recommendation">
        <PlacementRecommendation item={item} />
        <FinancialSummary item={item} />
      </section>
      <RelatedRecords item={item} />
    </section>
  );
}

function QuickActions({ actionLog, onAction }) {
  const actions = [
    'Respond to Underwriter',
    'Record Phone Discussion',
    'Request Client Information',
    'Update Recommendation',
    'Mark Quote Received',
    'Recommend Placement',
    'Move To Client Review',
    'Ready To Bind',
  ];

  return (
    <section className="market-card">
      <SectionHeader title="Quick Actions" text="Simulated workflow actions for presentation only." />
      <div className="market-quick-actions">
        {actions.map((action) => <button key={action} type="button" onClick={() => onAction(action)}>{action}</button>)}
      </div>
      {actionLog.length ? (
        <div className="market-action-log">
          {actionLog.map((entry) => <span key={entry.id}>{entry.time}: {entry.action}</span>)}
        </div>
      ) : null}
    </section>
  );
}

function MarketsApproached({ expandedMarket, item, setExpandedMarket }) {
  return (
    <section className="market-card">
      <SectionHeader title="Markets Approached" text="Carrier-by-carrier response, pricing, conditions, and recommendation position." />
      <div className="market-table">
        <div className="market-table__head">
          <span>Insurer</span><span>Submission Date</span><span>Status</span><span>Premium</span><span>Limit</span><span>Deductible</span><span>Conditions</span><span>Response</span><span>Recommendation</span>
        </div>
        {item.markets.map((market) => {
          const open = expandedMarket === market.insurer;
          return (
            <article className={open ? 'market-table-row market-table-row--open' : 'market-table-row'} key={market.insurer}>
              <button type="button" onClick={() => setExpandedMarket(open ? '' : market.insurer)}>
                <strong>{market.insurer}</strong>
              </button>
              <span>{shortDate(market.submissionDate)}</span>
              <StatusBadge status={market.status} />
              <span>{market.premium ? compactCurrency(market.premium) : 'Pending'}</span>
              <span>{compactCurrency(market.limit)}</span>
              <span>{compactCurrency(market.deductible)}</span>
              <span>{market.keyConditions}</span>
              <span>{market.responseDate ? shortDate(market.responseDate) : 'Awaiting'}</span>
              <span>{market.recommendation}</span>
              {open ? (
                <dl>
                  <Metric label="Key Exclusions" value={market.exclusions} />
                  <Metric label="Special Conditions" value={market.specialConditions} />
                  <Metric label="Training Requirements" value={market.trainingRequirements} />
                  <Metric label="Pilot Restrictions" value={market.pilotRestrictions} />
                </dl>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}

function QuoteComparison({ item }) {
  const quoted = item.markets.filter((market) => market.premium).slice(0, 3);
  const rows = [
    ['Premium', (market) => compactCurrency(market.premium)],
    ['Hull Value', () => compactCurrency(item.client.annualPremium * 0.64)],
    ['Liability Limit', (market) => compactCurrency(market.limit)],
    ['Deductible', (market) => compactCurrency(market.deductible)],
    ['Key Exclusions', (market) => market.exclusions],
    ['Special Conditions', (market) => market.specialConditions],
    ['Training Requirements', (market) => market.trainingRequirements],
    ['Pilot Restrictions', (market) => market.pilotRestrictions],
    ['Financial Rating', (market) => market.financialRating],
    ['Overall Recommendation', (market) => market.overallRecommendation],
  ];

  return (
    <section className="market-card">
      <SectionHeader title="Quote Comparison" text="Side-by-side terms comparison with differences surfaced clearly." />
      <div className="quote-comparison">
        <div className="quote-comparison__head">
          <span>Compare</span>
          {quoted.map((market) => <strong key={market.insurer}>{market.insurer}</strong>)}
        </div>
        {rows.map(([label, getValue]) => (
          <div className="quote-comparison__row" key={label}>
            <span>{label}</span>
            {quoted.map((market) => (
              <p className={market.insurer === item.negotiation.recommendedInsurer ? 'quote-comparison__recommended' : ''} key={market.insurer}>
                {getValue(market)}
              </p>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}

function buildQuestions(item) {
  return item.negotiation.pendingQuestions.map((question, index) => ({
    assignedOwner: index % 2 ? userName(item.client.assignedAccountManagerId) : item.placementLead.name,
    businessImpact: index % 2 ? 'Market response will be delayed until client data is received.' : 'Quote cannot proceed without underwriting clarification.',
    dueDate: `2026-07-${12 + index}`,
    insurer: item.markets[index % item.markets.length]?.insurer ?? item.negotiation.recommendedInsurer,
    question,
    status: index % 2 ? 'Waiting for Client' : 'Open',
  }));
}

function UnderwriterQuestions({ questions }) {
  return (
    <section className="market-card">
      <SectionHeader title="Underwriter Questions" />
      <div className="market-question-list">
        {questions.length ? questions.map((question) => (
          <article key={`${question.insurer}-${question.question}`}>
            <div>
              <strong>{question.insurer}</strong>
              <StatusBadge status={question.status} />
            </div>
            <p>{question.question}</p>
            <dl>
              <Metric label="Owner" value={question.assignedOwner} />
              <Metric label="Due Date" value={shortDate(question.dueDate)} />
              <Metric label="Business Impact" value={question.businessImpact} />
            </dl>
          </article>
        )) : <p className="market-empty-text">No outstanding underwriter questions.</p>}
      </div>
    </section>
  );
}

function buildHistory(item) {
  const base = [
    ['Quote received', `${item.negotiation.recommendedInsurer} provided best current terms`],
    ['Phone discussion', `${item.placementLead.name} reviewed deductible alternatives`],
    ['Terms revised', 'Carrier broadened liability wording subject to final file review'],
    ['Premium reduced', `${compactCurrency(item.negotiation.estimatedSavings)} savings opportunity documented`],
    ['Client consulted', 'Account team prepared recommendation for decision-maker review'],
    ['Recommendation updated', `${item.negotiation.recommendedInsurer} remains recommended market`],
  ];
  return base.map(([title, detail], index) => ({
    detail,
    id: `${item.negotiation.id}-${title}`,
    time: `Jul ${7 + Math.floor(index / 2)}, ${index % 2 ? '2:15 PM' : '10:42 AM'}`,
    title,
  }));
}

function NegotiationHistory({ history }) {
  return (
    <section className="market-card">
      <SectionHeader title="Negotiation History" />
      <div className="market-history">
        {history.map((event) => (
          <article key={event.id}>
            <span />
            <time>{event.time}</time>
            <div>
              <strong>{event.title}</strong>
              <p>{event.detail}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function PlacementRecommendation({ item }) {
  const reason = item.negotiation.estimatedSavings > 0
    ? 'Best balance of premium, deductible, underwriting appetite, and acceptable liability wording.'
    : 'Most credible market based on aviation appetite, responsiveness, and breadth of proposed terms.';
  const businessRisk = item.recommended.deductible > 200000 ? 'Higher hull deductible should be explained to the client before approval.' : 'No unusual business risk beyond final subjectivities.';

  return (
    <section className="market-recommendation-card">
      <SectionHeader title="Placement Recommendation" text="Broker recommendation written for client and executive review." />
      <div className="market-recommendation-body">
        <span>Recommended Placement</span>
        <h3>{item.negotiation.recommendedInsurer}</h3>
        <p>{reason}</p>
        <dl>
          <Metric label="Client Savings" value={compactCurrency(item.negotiation.estimatedSavings)} />
          <Metric label="Business Risks" value={businessRisk} />
          <Metric label="Recommendation Status" value={item.negotiation.decisionRequired ? 'Ready for Client Review' : 'Broker Review In Progress'} />
        </dl>
      </div>
    </section>
  );
}

function FinancialSummary({ item }) {
  const commission = getSum(item.policies, 'estimatedCommission');
  const revenueImpact = item.client.estimatedRevenue;
  return (
    <section className="market-card">
      <SectionHeader title="Financial Summary" />
      <div className="market-financial-grid">
        <RevenueImpactLabel value={compactCurrency(item.negotiation.targetPremium)} label="Initial Target Premium" />
        <RevenueImpactLabel value={compactCurrency(item.negotiation.bestQuote)} label="Current Best Premium" />
        <RevenueImpactLabel value={compactCurrency(commission)} label="Expected Commission" />
        <RevenueImpactLabel value={compactCurrency(item.negotiation.estimatedSavings)} label="Savings Achieved" />
        <RevenueImpactLabel value={compactCurrency(revenueImpact)} label="Revenue Impact" />
        <RevenueImpactLabel value={formatDate(expectedBindingDate(item.renewal))} label="Expected Binding Date" />
      </div>
    </section>
  );
}

function RelatedRecords({ item }) {
  const records = [
    ['Renewal', item.renewal ? 1 : 0, item.renewal ? `/renewals/${item.renewal.id}` : '/renewals'],
    ['Submission', item.submission ? 1 : 0, item.submission ? `/submissions/${item.submission.id}` : '/submissions'],
    ['Client', 1, `/clients?clientId=${item.client.id}`],
    ['Policies', item.policies.length, `/clients?clientId=${item.client.id}`],
    ['Claims', item.claims.length, item.claims[0] ? `/claims/${item.claims[0].id}` : '/claims'],
    ['Compliance', item.compliance.length, item.compliance[0] ? `/compliance/${item.compliance[0].id}` : '/compliance'],
    ['Documents', item.documents.length, item.documents[0] ? `/documents/${item.documents[0].id}` : '/documents'],
    ['Tasks', item.tasks.length, `/clients?clientId=${item.client.id}`],
  ];

  return (
    <section className="market-card">
      <SectionHeader title="Related Records" text="Everything references the same JSON-backed business model." />
      <div className="market-related-grid">
        {records.map(([label, count, href]) => (
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

function Select({ label, onChange, options, value }) {
  return (
    <label>
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="all">All</option>
        {options.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
      </select>
    </label>
  );
}

function SectionHeader({ text, title }) {
  return (
    <div className="market-section-header">
      <div>
        <h2>{title}</h2>
        {text ? <p>{text}</p> : null}
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  return <span className={`business-badge business-badge--${statusTone(status)}`}>{status}</span>;
}

function Metric({ label, value }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function Meta({ label, value }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
