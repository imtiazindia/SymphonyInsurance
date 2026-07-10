import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, CheckCircle2, Command, Loader2, Search, Sparkles, TriangleAlert, X } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { simulationData } from '../data/demoData.js';
import { saveBriefingData, saveBriefingState } from '../utils/briefingSession.js';

const HISTORY_KEY = 'symphony:ibar:recent';
const CONTEXT_KEY = 'symphony:ibar:context';
const LAST_RESULT_KEY = 'symphony:ibar:lastResult';

const DEFAULT_SUGGESTIONS = [
  'Prepare me for my day',
  'What should I focus on today?',
  'Prepare today’s executive briefing',
  'Which renewals have the most revenue at risk?',
  'Which documents are blocking revenue?',
  'Prepare meeting brief for Global Jet Solutions',
  'Show clients impacted by current ARI',
  'Which claims require intervention?',
  'Prepare board briefing',
];

const POPULAR_COMMANDS = [
  'Open Client 360',
  'Show reports',
  'Open Compliance',
  'Prepare placement recommendation',
  'Compare current workload across teams',
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

function simpleRecord({ id, type, title, subtitle, status, metrics = [], businessImpact, recommendedAction, route, label }) {
  return {
    id,
    type,
    title,
    subtitle,
    status,
    metrics,
    businessImpact,
    recommendedAction,
    navigation: route ? { label: label ?? 'Open Workspace', route } : undefined,
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
  } else if (/business health index|what changed|clients drive the most revenue|most revenue/.test(q)) {
    const topClients = simulationData.clients.slice().sort((a, b) => b.estimatedRevenue - a.estimatedRevenue).slice(0, 6);
    title = /business health index/.test(q) ? 'Business Health Index explained' : 'Business performance signals';
    summary = /business health index/.test(q)
      ? 'Business Health Index blends retention, renewal readiness, submission readiness, revenue risk, claims exposure, compliance, workload, and ARI drag.'
      : `${topClients[0]?.name ?? 'The top client'} leads the revenue portfolio; local demo mode prepared the top revenue view.`;
    results = topClients.map(clientRecord);
    insights = [
      `${money(annualRevenue)} estimated annual revenue is represented in the client portfolio.`,
      `${money(revenueAtRisk)} revenue is currently at risk across renewals.`,
      'Open Reports for trend analysis, forecast, and the executive brief.',
    ];
    actions = [{ label: 'Open reports workspace', route: '/reports' }];
    intent = 'business_analytics';
    dataScope = ['clients', 'renewals', 'claims', 'reports'];
  } else if (/submission|not ready/.test(q)) {
    const submissions = simulationData.submissions
      .filter((item) => item.status !== 'Ready for Market' || item.completionPercent < 85 || item.documentGaps.length)
      .slice(0, 8);
    title = 'Submissions not fully ready';
    summary = `${submissions.length} submissions have readiness, status, or document signals in the local demo dataset.`;
    results = submissions.map((submission) => simpleRecord({
      id: submission.id,
      type: 'submission',
      title: simulationData.clients.find((client) => client.id === submission.clientId)?.name ?? submission.id,
      subtitle: `${submission.status} - ${submission.completionPercent}% complete`,
      status: submission.status,
      metrics: [
        { label: 'Completion', value: `${submission.completionPercent}%` },
        { label: 'Gaps', value: String(submission.documentGaps.length) },
        { label: 'Concerns', value: String(submission.underwriterConcerns.length) },
      ],
      businessImpact: submission.underwriterConcerns[0] ?? 'Submission should be reviewed before market release.',
      recommendedAction: submission.nextAction,
      route: `/submissions/${submission.id}`,
      label: 'Open Submission',
    }));
    insights = [`Lowest completion: ${Math.min(...submissions.map((item) => item.completionPercent))}%.`];
    actions = [{ label: 'Open submissions workspace', route: '/submissions' }];
    intent = 'submission_search';
    dataScope = ['submissions', 'documents', 'clients'];
  } else if (/placement|quote|insurer/.test(q)) {
    const placements = simulationData.negotiations.filter((item) => item.currentStatus !== 'Bound' || item.decisionRequired || item.pendingQuestions.length).slice(0, 8);
    title = /configured insurers/.test(q) ? 'Configured insurer view' : 'Market placement signals';
    summary = /configured insurers/.test(q)
      ? `${new Set(simulationData.policies.map((policy) => policy.insurer)).size} insurers are configured in the local demo data.`
      : `${placements.length} placements have active status, pending questions, or decision signals.`;
    results = placements.map((placement) => simpleRecord({
      id: placement.id,
      type: 'placement',
      title: simulationData.clients.find((client) => client.id === placement.clientId)?.name ?? placement.id,
      subtitle: `${placement.currentStatus} - ${placement.quotesReceived}/${placement.insurersApproached.length} quotes`,
      status: placement.decisionRequired ? 'Decision required' : placement.currentStatus,
      metrics: [
        { label: 'Best quote', value: money(placement.bestQuote) },
        { label: 'Target', value: money(placement.targetPremium) },
        { label: 'Savings', value: money(placement.estimatedSavings) },
      ],
      businessImpact: placement.pendingQuestions[0] ?? 'Placement is moving without a listed blocker.',
      recommendedAction: `Recommended insurer: ${placement.recommendedInsurer}`,
      route: `/market-placement/${placement.id}`,
      label: 'Open Placement',
    }));
    insights = [`Configured insurers include ${Array.from(new Set(simulationData.policies.map((policy) => policy.insurer))).slice(0, 4).join(', ')}.`];
    actions = [{ label: 'Open market placement', route: '/market-placement' }];
    intent = 'placement_search';
    dataScope = ['negotiations', 'policies', 'clients'];
  } else if (/compliance/.test(q)) {
    const complianceItems = simulationData.compliance.filter((item) => item.status === 'Overdue' || item.severity === 'High').slice(0, 8);
    title = 'Compliance items requiring action';
    summary = `${complianceItems.length} compliance findings are overdue or high severity.`;
    results = complianceItems.map((item) => simpleRecord({
      id: item.id,
      type: 'compliance',
      title: simulationData.clients.find((client) => client.id === item.clientId)?.name ?? item.id,
      subtitle: `${item.findingType} - due ${item.dueDate}`,
      status: item.status,
      metrics: [
        { label: 'Severity', value: item.severity },
        { label: 'Status', value: item.status },
        { label: 'Assigned', value: item.assignedUserId },
      ],
      businessImpact: item.businessImpact,
      recommendedAction: item.correctiveAction,
      route: `/compliance/${item.id}`,
      label: 'Open Compliance',
    }));
    insights = [`${complianceItems.filter((item) => item.status === 'Overdue').length} findings are overdue.`];
    actions = [{ label: 'Open compliance workspace', route: '/compliance' }];
    intent = 'compliance_search';
    dataScope = ['compliance', 'clients', 'documents'];
  } else if (/document gaps|document/.test(q)) {
    const documents = simulationData.documents.filter((item) => /missing|needs|expired|pending/i.test(item.status ?? '') || /missing|gap/i.test(item.businessImpact ?? '')).slice(0, 8);
    title = 'Client document gaps';
    summary = `${documents.length} documents may need review or follow-up.`;
    results = documents.map((document) => simpleRecord({
      id: document.id,
      type: 'document',
      title: simulationData.clients.find((client) => client.id === document.clientId)?.name ?? document.id,
      subtitle: `${document.documentType} - ${document.status}`,
      status: document.status,
      metrics: [
        { label: 'Required for', value: document.requiredFor },
        { label: 'Expiry', value: document.expiryDate },
      ],
      businessImpact: document.businessImpact,
      recommendedAction: document.missingReason || 'Review and update the document record.',
      route: `/documents/${document.id}`,
      label: 'Open Document',
    }));
    insights = [`${new Set(documents.map((item) => item.clientId)).size} clients have document signals.`];
    actions = [{ label: 'Open documents workspace', route: '/documents' }];
    intent = 'document_search';
    dataScope = ['documents', 'clients', 'renewals'];
  } else if (/aviation risk|ari|risk impact/.test(q)) {
    const ari = simulationData.aviationRiskIndex?.domestic;
    title = `Domestic Aviation Risk Index: ${ari?.score ?? 0}/100`;
    summary = ari?.summary ?? 'Aviation risk index data is available in the shared model.';
    results = simulationData.clients.slice(0, 6).map((client) => clientRecord(client, {
      status: `${ari?.category ?? 'ARI'} exposure`,
      recommendedAction: ari?.recommendedActions?.[0] ?? 'Review exposed aviation accounts.',
    }));
    insights = [
      ari?.primaryDriverSummary ?? 'Primary aviation risk drivers are available.',
      `${ari?.workspaceSignals?.executive?.affectedClients ?? 0} executive clients are affected in the configured signal.`,
    ];
    actions = [{ label: 'Open executive overview', route: '/' }, { label: 'Open reports workspace', route: '/reports' }];
    intent = 'ari_impact';
    dataScope = ['aviationRiskIndex', 'clients', 'renewals'];
  } else if (/workflow architecture|who manages claims|configured insurers|ai configuration|open ai configuration/.test(q)) {
    const claimManagers = simulationData.teamMembers.filter((member) => /claim/i.test(member.role));
    title = 'Platform administration configuration';
    summary = 'Administration shows users, roles, workflow architecture, configured insurers, iBar configuration, business rules, and system health.';
    results = [
      simpleRecord({
        id: 'admin-workflow',
        type: 'configuration',
        title: 'Workflow architecture',
        subtitle: 'Client -> Renewal -> Submission -> Market Placement -> Binding -> Claims -> Compliance',
        status: 'Configured',
        metrics: [{ label: 'Stages', value: '8' }, { label: 'Rules', value: '7' }],
        businessImpact: 'The platform exposes responsibility, documents, decision points, and outputs for every major workflow.',
        recommendedAction: 'Open workflow diagram in Administration.',
        route: '/administration#admin-workflow',
        label: 'Open Workflow',
      }),
      simpleRecord({
        id: 'admin-claims',
        type: 'configuration',
        title: 'Claims responsibility',
        subtitle: claimManagers.map((member) => member.name).join(', ') || 'Claims Coordinator role',
        status: 'Configured',
        metrics: [{ label: 'Claim owners', value: String(claimManagers.length) }],
        businessImpact: 'Claims responsibility is visible in the role and workload model.',
        recommendedAction: 'Review role matrix and workload.',
        route: '/administration#admin-users',
        label: 'Open Users',
      }),
    ];
    insights = [`Configured insurers include ${Array.from(new Set(simulationData.policies.map((policy) => policy.insurer))).slice(0, 5).join(', ')}.`];
    actions = [{ label: 'Open administration', route: '/administration' }, { label: 'Open AI configuration', route: '/administration#admin-ibar' }];
    intent = 'admin_configuration';
    dataScope = ['teamMembers', 'policies', 'workflows', 'businessRules'];
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

  const suggestionGroups = useMemo(() => {
    const contextCommands = location.pathname.startsWith('/claims')
      ? ['What concerns me?', 'Claims affecting upcoming renewals', 'Prepare claim summary']
      : location.pathname.startsWith('/renewals')
        ? ['What should happen next?', 'Renewals due in the next 45 days', 'Renewals with revenue at risk over $1M']
        : location.pathname.startsWith('/market-placement')
          ? ['Which quotes arrived today?', 'Compare quotes for SkyHigh Airlines', 'Which placements need a decision?']
          : location.pathname.startsWith('/documents')
            ? ['Which documents are blocking revenue?', 'Show missing renewal documents', 'Open highest priority renewal']
            : location.pathname.startsWith('/clients')
              ? ['What should happen next?', 'Prepare client relationship summary', 'Show open claims for this client']
              : ['Prepare me for my day', 'Show today’s priorities', 'Prepare executive briefing', 'Open Global Jet Solutions'];

    const groups = [
      { label: 'Recent Commands', items: history.slice(0, 4) },
      { label: 'Context Commands', items: contextCommands },
      { label: 'Suggested Commands', items: DEFAULT_SUGGESTIONS },
      { label: 'Popular Commands', items: POPULAR_COMMANDS },
      { label: 'Keyboard Shortcuts', items: ['Ctrl/Cmd + K focuses iBar', '/ focuses search', '? shows shortcuts'], passive: true },
    ];

    return groups
      .map((group) => ({
        ...group,
        items: group.items
          .filter(Boolean)
          .filter((item, index, all) => all.indexOf(item) === index)
          .slice(0, group.label === 'Suggested Commands' ? 5 : 4),
      }))
      .filter((group) => group.items.length);
  }, [history, location.pathname]);

  useEffect(() => {
    function onKeyDown(event) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        inputRef.current?.focus();
      }
      if (event.key === 'Escape' && focused) {
        setFocused(false);
        inputRef.current?.blur();
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [focused]);

  useEffect(() => {
    function onFocusRequest() {
      inputRef.current?.focus();
      setFocused(true);
    }

    window.addEventListener('symphony:ibar:focus', onFocusRequest);
    return () => window.removeEventListener('symphony:ibar:focus', onFocusRequest);
  }, []);

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
      if (payload.intent === 'executive_daily_briefing' && payload.executiveDailyBriefing) {
        saveBriefingData(payload);
        saveBriefingState({ active: false, currentIndex: 0, reviewed: {}, scrollTop: 0 });
        setStatus({ tone: 'success', text: 'Executive briefing ready' });
        window.dispatchEvent(new CustomEvent('symphony:toast', {
          detail: {
            title: 'Executive briefing ready',
            message: payload.executiveDailyBriefing.openingSentence,
            tone: 'success',
          },
        }));
        navigate(`/briefing/today?requestId=${encodeURIComponent(payload.requestId)}`);
        return;
      }
      setStatus({
        tone: payload.status === 'error' ? 'warning' : 'success',
        text: payload.statusLine?.label ?? 'Answer ready',
      });
      window.dispatchEvent(new CustomEvent('symphony:toast', {
        detail: {
          title: 'iBar answer ready',
          message: payload.title ?? normalized,
          tone: payload.status === 'error' ? 'warning' : 'success',
        },
      }));
      navigate(`/ibar?requestId=${encodeURIComponent(payload.requestId)}`);
    } catch (error) {
      if (error.name === 'AbortError') return;
      const fallback = buildLocalIBarFallback(normalized, requestId, location);
      writeJsonStorage(window.sessionStorage, LAST_RESULT_KEY, fallback);
      writeJsonStorage(window.sessionStorage, `symphony:ibar:result:${fallback.requestId}`, fallback);
      setStatus({ tone: 'success', text: fallback.statusLine.label });
      window.dispatchEvent(new CustomEvent('symphony:toast', {
        detail: {
          title: 'iBar demo answer ready',
          message: fallback.title,
          tone: 'success',
        },
      }));
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
          {query ? (
            <button
              className="ibar-clear"
              type="button"
              onClick={() => {
                setQuery('');
                setFocused(true);
                inputRef.current?.focus();
              }}
              aria-label="Clear iBar query"
            >
              <X size={14} />
            </button>
          ) : null}
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

      {focused && suggestionGroups.length > 0 && (
        <div className="ibar-suggestions" onMouseDown={(event) => event.preventDefault()}>
          {suggestionGroups.map((group) => (
            <section key={group.label}>
              <strong>{group.label}</strong>
              {group.items.map((item) => (
                group.passive ? <span key={item}>{item}</span> : (
                  <button key={item} type="button" onClick={() => submit(item)}>
                    {item}
                  </button>
                )
              ))}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
