import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, CheckCircle2, Command, Loader2, Search, Sparkles, TriangleAlert } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { simulationData } from '../data/demoData.js';

const HISTORY_KEY = 'symphony:ibar:recent';
const CONTEXT_KEY = 'symphony:ibar:context';
const LAST_RESULT_KEY = 'symphony:ibar:lastResult';

const DEFAULT_SUGGESTIONS = [
  'Show CEO priorities',
  'Which renewals have the most revenue at risk?',
  'High severity claims over $100,000',
  'Which submissions are not ready?',
  'Which placements are waiting on insurers?',
];

function readJsonStorage(key, fallback) {
  try {
    return JSON.parse(window.localStorage.getItem(key) ?? window.sessionStorage.getItem(key) ?? 'null') ?? fallback;
  } catch {
    return fallback;
  }
}

function writeJsonStorage(storage, key, value) {
  try {
    storage.setItem(key, JSON.stringify(value));
  } catch {
    // Non-critical browser storage.
  }
}

function getContext() {
  try {
    return JSON.parse(window.sessionStorage.getItem(CONTEXT_KEY) ?? '[]').slice(0, 3);
  } catch {
    return [];
  }
}

function saveContext(entry) {
  const next = [entry, ...getContext()].slice(0, 4);
  writeJsonStorage(window.sessionStorage, CONTEXT_KEY, next);
}

function createRequestId() {
  return `ibar-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function deriveActiveClientId(location) {
  const params = new URLSearchParams(location.search);
  const queryClientId = params.get('clientId');
  if (queryClientId) return queryClientId;
  const clientRouteMatch = location.pathname.match(/^\/clients\/([^/]+)/);
  return clientRouteMatch ? decodeURIComponent(clientRouteMatch[1]) : null;
}

function money(value) {
  const number = Number(value) || 0;
  if (number >= 1_000_000) return `$${(number / 1_000_000).toFixed(number >= 10_000_000 ? 1 : 2)}M`;
  if (number >= 1_000) return `$${Math.round(number / 1_000)}K`;
  return `$${number.toLocaleString('en-US')}`;
}

function clientRecord(client, extras = {}) {
  return {
    id: client.id,
    type: 'client',
    title: client.name,
    subtitle: `${client.clientType} - ${client.location}`,
    status: client.retentionRisk,
    metrics: [
      { label: 'Health', value: `${client.clientHealthScore}` },
      { label: 'Revenue', value: money(client.estimatedRevenue) },
      { label: 'Open claims', value: String(client.openClaimsCount) },
    ],
    businessImpact: client.shortBusinessSummary,
    recommendedAction: client.retentionRisk === 'High' ? 'Review renewal, claims, and document gaps.' : 'Keep relationship and service plan on track.',
    navigation: { label: 'Open Client', route: `/clients/${encodeURIComponent(client.id)}` },
    ...extras,
  };
}

function renewalRecord(renewal) {
  const client = simulationData.clients.find((item) => item.id === renewal.clientId);
  return {
    id: renewal.id,
    type: 'renewal',
    title: client?.name ?? renewal.id,
    subtitle: `${renewal.currentStage} - expires in ${renewal.daysToExpiry} days`,
    status: renewal.ownerAttentionRequired ? 'CEO attention' : renewal.currentStage,
    metrics: [
      { label: 'Readiness', value: `${renewal.readinessScore}%` },
      { label: 'Revenue at risk', value: money(renewal.revenueAtRisk) },
      { label: 'Missing items', value: String(renewal.missingItems.length) },
    ],
    businessImpact: renewal.priorityReason,
    recommendedAction: renewal.missingItems.length ? `Resolve: ${renewal.missingItems.slice(0, 2).join(', ')}` : 'Review final market position.',
    navigation: { label: 'Open Renewal', route: `/renewals/${encodeURIComponent(renewal.id)}` },
  };
}

function claimRecord(claim) {
  const client = simulationData.clients.find((item) => item.id === claim.clientId);
  return {
    id: claim.id,
    type: 'claim',
    title: client?.name ?? claim.id,
    subtitle: `${claim.claimType} - ${claim.daysOpen} days open`,
    status: claim.status,
    metrics: [
      { label: 'Severity', value: claim.severity },
      { label: 'Incurred', value: money(claim.incurredAmount) },
      { label: 'Reserve', value: money(claim.reserveAmount) },
    ],
    businessImpact: claim.executiveReviewRequired ? 'Executive review is already flagged.' : 'Monitor for underwriting narrative impact.',
    recommendedAction: claim.nextAction,
    navigation: { label: 'Open Claim', route: `/claims/${encodeURIComponent(claim.id)}` },
  };
}

function teamRecord(user) {
  return {
    id: user.id,
    type: 'team-member',
    title: user.name,
    subtitle: user.role,
    status: user.workloadScore >= 80 ? 'Over capacity' : 'Elevated workload',
    metrics: [
      { label: 'Workload', value: `${user.workloadScore}` },
      { label: 'Open tasks', value: String(user.openTasks) },
      { label: 'Overdue', value: String(user.overdueTasks) },
    ],
    businessImpact: `${user.assignedClients.length} assigned clients may need load balancing.`,
    recommendedAction: user.workloadScore >= 80 ? 'Rebalance priority tasks this week.' : 'Monitor capacity before assigning new work.',
    navigation: { label: 'Open Account Manager', route: '/account-manager' },
  };
}

function buildLocalIBarFallback(query, requestId, location) {
  const q = query.toLowerCase();
  const highValueClient = simulationData.clients.find((client) => /global jet solutions/i.test(client.name)) ?? simulationData.clients[0];
  const dueRenewals = simulationData.renewals
    .slice()
    .sort((a, b) => a.daysToExpiry - b.daysToExpiry)
    .slice(0, 6);
  const priorityRenewals = simulationData.renewals.filter((renewal) => renewal.ownerAttentionRequired).map(renewalRecord);
  const priorityClaims = simulationData.claims.filter((claim) => claim.executiveReviewRequired).map(claimRecord);
  const overloaded = simulationData.teamMembers.filter((user) => user.workloadScore >= 78).map(teamRecord);
  const annualRevenue = simulationData.clients.reduce((total, client) => total + client.estimatedRevenue, 0);
  const revenueAtRisk = simulationData.renewals.reduce((total, renewal) => total + renewal.revenueAtRisk, 0);

  let title = 'iBar local demo answer';
  let summary = 'The secure iBar service was not available, so Symphony prepared a local demo answer from the shared JSON model.';
  let results = [...priorityRenewals, ...priorityClaims, ...overloaded].slice(0, 8);
  let insights = [
    `${priorityRenewals.length} renewals need CEO attention.`,
    `${priorityClaims.length} claims require executive review.`,
    `${overloaded.length} team members have elevated workload.`,
  ];
  let actions = [{ label: 'Open executive overview', route: '/' }];
  let intent = 'local_demo_fallback';
  let dataScope = ['clients', 'renewals', 'claims', 'teamMembers'];

  if (/client meeting brief|global jet|open global|falcon/.test(q)) {
    const clientRenewals = simulationData.renewals.filter((item) => item.clientId === highValueClient.id).map(renewalRecord);
    const clientClaims = simulationData.claims.filter((item) => item.clientId === highValueClient.id).map(claimRecord);
    title = `${highValueClient.name} client brief`;
    summary = `${highValueClient.shortBusinessSummary} Local demo mode assembled the client context from the shared dataset.`;
    results = [clientRecord(highValueClient, { recommendedAction: 'Use this as the starting point for the client discussion.' }), ...clientRenewals, ...clientClaims].slice(0, 8);
    insights = [
      `Retention risk is ${highValueClient.retentionRisk.toLowerCase()} with a health score of ${highValueClient.clientHealthScore}.`,
      `${highValueClient.openClaimsCount} open claims and ${highValueClient.openTasksCount} open tasks are visible.`,
      `Document completeness is ${highValueClient.documentCompleteness}%.`,
    ];
    actions = [{ label: 'Open client workspace', route: `/clients/${highValueClient.id}` }];
    intent = 'client_summary';
    dataScope = ['clients', 'renewals', 'claims', 'documents'];
  } else if (/renewal|missing renewal documents|due this month/.test(q)) {
    title = 'Renewals and document blockers';
    summary = `${dueRenewals.length} upcoming renewals were found in the local demo dataset.`;
    results = dueRenewals.map(renewalRecord);
    insights = [
      `${dueRenewals.filter((renewal) => renewal.missingItems.length).length} upcoming renewals have missing items.`,
      `Highest revenue at risk: ${money(Math.max(...dueRenewals.map((renewal) => renewal.revenueAtRisk)))}.`,
    ];
    actions = [{ label: 'Open renewals workspace', route: '/renewals' }, { label: 'Open documents', route: '/documents' }];
    intent = 'renewal_search';
    dataScope = ['renewals', 'documents', 'clients'];
  } else if (/claim/.test(q)) {
    title = 'Claims affecting renewals';
    summary = `${priorityClaims.length} claims are flagged for executive review or renewal impact.`;
    results = priorityClaims;
    insights = [`Largest incurred claim: ${money(Math.max(...simulationData.claims.map((claim) => claim.incurredAmount)))}.`];
    actions = [{ label: 'Open claims workspace', route: '/claims' }, { label: 'Open renewals workspace', route: '/renewals' }];
    intent = 'claim_search';
    dataScope = ['claims', 'renewals', 'clients'];
  } else if (/overloaded|account managers|workload/.test(q)) {
    title = 'Team workload signals';
    summary = `${overloaded.length} team members have elevated workload in the demo dataset.`;
    results = overloaded;
    insights = [`Highest workload: ${overloaded[0]?.title ?? 'none'}.`];
    actions = [{ label: 'Open account manager workspace', route: '/account-manager' }];
    intent = 'team_workload';
    dataScope = ['teamMembers', 'tasks', 'clients'];
  } else if (/executive briefing|executive brief|business performance/.test(q)) {
    title = 'Executive briefing';
    summary = `${money(annualRevenue)} estimated annual revenue and ${money(revenueAtRisk)} revenue at risk are visible in the local demo view.`;
    results = simulationData.clients.slice().sort((a, b) => b.estimatedRevenue - a.estimatedRevenue).slice(0, 6).map(clientRecord);
    insights = [
      `${priorityRenewals.length} renewals need CEO attention.`,
      `${priorityClaims.length} claims require executive review.`,
      'Open Reports for forecast, business health, and decision support.',
    ];
    actions = [{ label: 'Open reports workspace', route: '/reports' }, { label: 'Open executive overview', route: '/' }];
    intent = 'business_analytics';
    dataScope = ['clients', 'renewals', 'claims', 'reports'];
  }

  return {
    requestId,
    status: 'ok',
    intent,
    confidence: 0.72,
    title,
    summary,
    statusLine: {
      label: 'Local demo answer ready',
      steps: ['captured demo query', 'used local fallback', 'composed response'],
      durationMs: 0,
    },
    results,
    insights,
    actions,
    suggestedQueries: [
      'Prepare client meeting brief for Global Jet Solutions',
      'Show renewals due this month',
      'Which claims affect renewals?',
    ],
    warnings: ['Local demo fallback used because the secure iBar service was unavailable.'],
    meta: {
      model: 'client-side-demo-fallback',
      serverSide: false,
      requestSchemaVersion: '2026-07-ibar-v1',
      dataScope,
      appliedFilters: {},
      currentRoute: `${location.pathname}${location.search}`,
      selectedRole: 'CEO',
      selectedUserId: 'USR-001',
      entityIds: { client: null, claim: null, renewal: null, submission: null, negotiation: null },
    },
  };
}

export function IBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const abortRef = useRef(null);
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ tone: 'idle', text: 'Ready for business questions' });
  const [history, setHistory] = useState(() => readJsonStorage(HISTORY_KEY, []));

  const suggestions = useMemo(() => {
    const routeSuggestions = location.pathname.startsWith('/claims')
      ? ['Claims affecting upcoming renewals', 'Open executive review claims']
      : location.pathname.startsWith('/renewals')
        ? ['Renewals due in the next 45 days', 'Renewals with revenue at risk over $1M']
        : location.pathname.startsWith('/market-placement')
          ? ['Compare quotes for SkyHigh Airlines', 'Which placements need a decision?']
          : [];
    return [...history, ...routeSuggestions, ...DEFAULT_SUGGESTIONS]
      .filter(Boolean)
      .filter((item, index, all) => all.indexOf(item) === index)
      .slice(0, 7);
  }, [history, location.pathname]);

  useEffect(() => {
    function onKeyDown(event) {
      const editable = event.target instanceof HTMLElement
        && ['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName);
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        inputRef.current?.focus();
      }
      if (event.key === 'Escape' && focused && !editable) {
        setFocused(false);
        inputRef.current?.blur();
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [focused]);

  useEffect(() => {
    function onDemoSubmit(event) {
      const nextQuery = event.detail?.query;
      if (typeof nextQuery === 'string') {
        submit(nextQuery);
      }
    }

    window.addEventListener('symphony:ibar:submit', onDemoSubmit);
    return () => window.removeEventListener('symphony:ibar:submit', onDemoSubmit);
  });

  async function submit(nextQuery = query) {
    const normalized = nextQuery.replace(/\s+/g, ' ').trim();
    if (!normalized || loading) return;

    const requestId = createRequestId();
    const recent = [normalized, ...history.filter((item) => item !== normalized)].slice(0, 6);
    setHistory(recent);
    writeJsonStorage(window.localStorage, HISTORY_KEY, recent);
    setQuery(normalized);
    setFocused(false);
    setLoading(true);
    setStatus({ tone: 'loading', text: 'Understanding request...' });

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    try {
      const response = await fetch('/api/ibar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: normalized,
          currentRoute: `${location.pathname}${location.search}`,
          selectedRole: 'CEO',
          selectedUserId: 'USR-001',
          activeClientId: deriveActiveClientId(location),
          conversationContext: getContext(),
          requestId,
        }),
        signal: abortRef.current.signal,
      });

      const payload = await response.json();
      if (!response.ok && payload.status !== 'error') {
        throw new Error('iBar request failed');
      }

      saveContext({ query: normalized, intent: payload.intent, route: `${location.pathname}${location.search}` });

      const directAction = payload.actions?.find((action) => action.type === 'navigate' && action.direct && action.route);
      if (directAction && payload.confidence >= 0.88) {
        setStatus({ tone: 'success', text: directAction.label });
        navigate(directAction.route);
        return;
      }

      writeJsonStorage(window.sessionStorage, LAST_RESULT_KEY, payload);
      writeJsonStorage(window.sessionStorage, `symphony:ibar:result:${payload.requestId}`, payload);
      setStatus({
        tone: payload.status === 'error' ? 'warning' : 'success',
        text: payload.statusLine?.label ?? 'Answer ready',
      });
      navigate(`/ibar?requestId=${encodeURIComponent(payload.requestId)}`);
    } catch (error) {
      if (error.name === 'AbortError') return;
      const fallback = buildLocalIBarFallback(normalized, requestId, location);
      writeJsonStorage(window.sessionStorage, LAST_RESULT_KEY, fallback);
      writeJsonStorage(window.sessionStorage, `symphony:ibar:result:${fallback.requestId}`, fallback);
      setStatus({ tone: 'success', text: fallback.statusLine.label });
      navigate(`/ibar?requestId=${encodeURIComponent(fallback.requestId)}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="ibar-shell">
      <form className="ibar-form" onSubmit={(event) => { event.preventDefault(); submit(); }}>
        <div className="ibar-input-wrap">
          <Sparkles size={17} strokeWidth={1.9} aria-hidden="true" />
          <Search size={18} strokeWidth={1.8} aria-hidden="true" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            placeholder="Ask about clients, renewals, claims, placements or business performance..."
            onChange={(event) => setQuery(event.target.value)}
            onFocus={() => setFocused(true)}
            aria-label="iBar business search"
            autoComplete="off"
          />
          <span className="ibar-shortcut" aria-hidden="true">
            <Command size={12} />
            K
          </span>
          <button className="ibar-submit" type="submit" aria-label="Ask iBar" disabled={loading || !query.trim()}>
            {loading ? <Loader2 size={17} className="ibar-spin" /> : <ArrowRight size={17} />}
          </button>
        </div>
      </form>

      <div className={`ibar-status ibar-status--${status.tone}`} aria-live="polite">
        {status.tone === 'loading' ? <Loader2 size={13} className="ibar-spin" /> : status.tone === 'warning' ? <TriangleAlert size={13} /> : <CheckCircle2 size={13} />}
        <span>{status.text}</span>
      </div>

      {focused && suggestions.length > 0 && (
        <div className="ibar-suggestions" onMouseDown={(event) => event.preventDefault()}>
          {suggestions.map((item) => (
            <button key={item} type="button" onClick={() => submit(item)}>
              {item}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
