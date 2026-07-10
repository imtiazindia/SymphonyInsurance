const ROUTES = {
  client: (id) => `/clients/${encodeURIComponent(id)}`,
  renewal: (id) => `/renewals/${encodeURIComponent(id)}`,
  submission: (id) => `/submissions/${encodeURIComponent(id)}`,
  placement: (id) => `/market-placement/${encodeURIComponent(id)}`,
  claim: (id) => `/claims/${encodeURIComponent(id)}`,
  compliance: (id) => `/compliance/${encodeURIComponent(id)}`,
  document: (id) => `/documents/${encodeURIComponent(id)}`,
};

function money(value) {
  const number = Number(value) || 0;
  if (number >= 1_000_000) return `$${(number / 1_000_000).toFixed(number >= 10_000_000 ? 1 : 2)}M`;
  if (number >= 1_000) return `$${Math.round(number / 1_000)}K`;
  return `$${number.toLocaleString('en-US')}`;
}

function getClient(data, id) {
  return data.clients.find((client) => client.id === id);
}

function clientName(data, id) {
  return getClient(data, id)?.name ?? id;
}

function containsType(client, type) {
  if (!type) return true;
  const needle = type.toLowerCase();
  return `${client.clientType} ${client.industrySegment}`.toLowerCase().includes(needle);
}

function clientRecord(client, extras = {}) {
  return {
    id: client.id,
    type: 'client',
    title: client.name,
    subtitle: `${client.clientType} • ${client.location}`,
    status: client.retentionRisk,
    metrics: [
      { label: 'Health', value: `${client.clientHealthScore}` },
      { label: 'Revenue', value: money(client.estimatedRevenue) },
      { label: 'Open claims', value: String(client.openClaimsCount) },
    ],
    businessImpact: client.shortBusinessSummary,
    recommendedAction: client.retentionRisk === 'High' ? 'Review renewal, claims, and document gaps.' : 'Keep relationship and service plan on track.',
    navigation: { label: 'Open Client', route: ROUTES.client(client.id) },
    ...extras,
  };
}

function sum(records, field) {
  return records.reduce((total, item) => total + (Number(item[field]) || 0), 0);
}

function average(records, field) {
  return records.length ? sum(records, field) / records.length : 0;
}

function calculateRevenueAtRisk(data) {
  return data.renewals.reduce((total, renewal) => total + (Number(renewal.revenueAtRisk) || 0), 0);
}

function businessAnalyticsResults(data) {
  const totalPremium = sum(data.clients, 'annualPremium');
  const annualRevenue = sum(data.clients, 'estimatedRevenue');
  const revenueAtRisk = calculateRevenueAtRisk(data);
  const highRiskClients = data.clients.filter((client) => client.retentionRisk === 'High');
  const renewalReadiness = Math.round(average(data.renewals, 'readinessScore'));
  const submissionReadiness = Math.round(average(data.submissions, 'completionPercent'));
  const overloadedTeam = data.teamMembers.filter((member) => member.workloadScore >= 80);
  const overloadedPhrase = overloadedTeam.length === 1
    ? '1 team member is'
    : `${overloadedTeam.length} team members are`;
  const decisionRenewals = data.renewals.filter((renewal) => renewal.ownerAttentionRequired);
  const decisionClaims = data.claims.filter((claim) => claim.executiveReviewRequired);
  const topClients = data.clients
    .slice()
    .sort((a, b) => b.estimatedRevenue - a.estimatedRevenue)
    .slice(0, 6)
    .map((client) => clientRecord(client, {
      status: client.retentionRisk === 'High' ? 'Retention watch' : 'Top revenue',
      recommendedAction: client.retentionRisk === 'High'
        ? 'Use Reports to review renewal, claims, document and relationship signals.'
        : 'Use Reports to compare portfolio contribution and service momentum.',
    }));

  return {
    title: 'Reports & Business Analytics summary',
    summary: `${money(totalPremium)} managed premium, ${money(annualRevenue)} estimated annual revenue, and ${money(revenueAtRisk)} revenue at risk are visible in the executive analytics view.`,
    results: topClients,
    insights: [
      `${highRiskClients.length} clients are high retention risk and ${decisionRenewals.length} renewals need CEO attention.`,
      `Renewal readiness is ${renewalReadiness}% and submission readiness is ${submissionReadiness}%.`,
      `${decisionClaims.length} claims require executive review and ${overloadedPhrase} over capacity.`,
    ],
    actions: [
      { label: 'Open reports workspace', route: '/reports' },
      { label: 'Open executive overview', route: '/' },
      { label: 'Open client portfolio', route: '/clients' },
    ],
    warnings: [],
    dataScope: ['clients', 'renewals', 'submissions', 'claims', 'teamMembers', 'policies', 'negotiations'],
  };
}

function adminConfigurationResults(data) {
  const insurers = [...new Set(data.policies.map((policy) => policy.insurer))].sort();
  const roles = [...new Set(data.teamMembers.map((member) => member.role))].sort();
  const claimManagers = data.teamMembers.filter((member) => /claim/i.test(member.role));
  const results = [
    {
      id: 'admin-users',
      type: 'configuration',
      title: 'Users and roles',
      subtitle: `${data.teamMembers.length} users across ${roles.length} active role types`,
      status: 'Configured',
      metrics: [
        { label: 'Users', value: String(data.teamMembers.length) },
        { label: 'Roles', value: String(roles.length) },
        { label: 'Claim owners', value: String(claimManagers.length) },
      ],
      businessImpact: claimManagers.length
        ? `Claims are managed by ${claimManagers.map((member) => member.name).join(', ')}.`
        : 'Claims management role is available for configuration.',
      recommendedAction: 'Open Administration to review role matrix and workload.',
      navigation: { label: 'Open Administration', route: '/administration' },
    },
    {
      id: 'admin-reference',
      type: 'configuration',
      title: 'Reference data',
      subtitle: `${insurers.length} configured insurers and ${new Set(data.policies.map((policy) => policy.policyType)).size} policy types`,
      status: 'Configured',
      metrics: [
        { label: 'Insurers', value: String(insurers.length) },
        { label: 'Policy types', value: String(new Set(data.policies.map((policy) => policy.policyType)).size) },
        { label: 'Document types', value: String(new Set(data.documents.map((document) => document.documentType)).size) },
      ],
      businessImpact: `Configured insurers include ${insurers.slice(0, 4).join(', ')}.`,
      recommendedAction: 'Use reference data to add, edit, deactivate, search, or filter values.',
      navigation: { label: 'Open Administration', route: '/administration' },
    },
    {
      id: 'admin-workflow',
      type: 'configuration',
      title: 'Workflow architecture',
      subtitle: 'Client -> Renewal -> Submission -> Market Placement -> Binding -> Claims -> Compliance',
      status: 'Configured',
      metrics: [
        { label: 'Workflow stages', value: '8' },
        { label: 'Rules', value: '7' },
        { label: 'Health checks', value: '12' },
      ],
      businessImpact: 'The platform exposes responsibility, documents, decision points, and outputs for every major workflow.',
      recommendedAction: 'Open workflow diagram in Administration.',
      navigation: { label: 'Open Administration', route: '/administration' },
    },
  ];

  return {
    title: 'Platform administration configuration',
    summary: `Administration is configured with ${data.teamMembers.length} users, ${roles.length} role types, ${insurers.length} insurers, workflow rules, iBar architecture, and system health checks.`,
    results,
    insights: [
      `Claims responsibility is assigned to ${claimManagers.map((member) => member.name).join(', ') || 'the Claims Coordinator role'}.`,
      `Configured insurers: ${insurers.slice(0, 5).join(', ')}${insurers.length > 5 ? ', and more' : ''}.`,
      'Business rules are shown in readable language; no prompts, secrets, or API keys are exposed.',
    ],
    actions: [
      { label: 'Open administration', route: '/administration' },
      { label: 'Open workflow diagram', route: '/administration#admin-workflow' },
      { label: 'Open AI configuration', route: '/administration#admin-ibar' },
    ],
    warnings: [],
    dataScope: ['teamMembers', 'policies', 'documents', 'tasks', 'aviationRiskIndex', 'businessRules'],
  };
}

function renewalRecord(renewal, data) {
  const client = getClient(data, renewal.clientId);
  return {
    id: renewal.id,
    type: 'renewal',
    title: client?.name ?? renewal.id,
    subtitle: `${renewal.currentStage} • expires in ${renewal.daysToExpiry} days`,
    status: renewal.ownerAttentionRequired ? 'CEO attention' : renewal.currentStage,
    metrics: [
      { label: 'Readiness', value: `${renewal.readinessScore}%` },
      { label: 'Revenue at risk', value: money(renewal.revenueAtRisk) },
      { label: 'Missing items', value: String(renewal.missingItems.length) },
    ],
    businessImpact: renewal.priorityReason,
    recommendedAction: renewal.missingItems.length ? `Resolve: ${renewal.missingItems.slice(0, 2).join(', ')}` : 'Review final market position.',
    navigation: { label: 'Open Renewal', route: ROUTES.renewal(renewal.id) },
  };
}

function claimRecord(claim, data) {
  return {
    id: claim.id,
    type: 'claim',
    title: clientName(data, claim.clientId),
    subtitle: `${claim.claimType} • ${claim.daysOpen} days open`,
    status: claim.status,
    metrics: [
      { label: 'Severity', value: claim.severity },
      { label: 'Incurred', value: money(claim.incurredAmount) },
      { label: 'Reserve', value: money(claim.reserveAmount) },
    ],
    businessImpact: claim.executiveReviewRequired ? 'Executive review is already flagged.' : 'Monitor for underwriting narrative impact.',
    recommendedAction: claim.nextAction,
    navigation: { label: 'Open Claim', route: ROUTES.claim(claim.id) },
  };
}

function submissionRecord(submission, data) {
  return {
    id: submission.id,
    type: 'submission',
    title: clientName(data, submission.clientId),
    subtitle: `${submission.status} • ${submission.completionPercent}% complete`,
    status: submission.status,
    metrics: [
      { label: 'Completion', value: `${submission.completionPercent}%` },
      { label: 'Gaps', value: String(submission.documentGaps.length) },
      { label: 'Concerns', value: String(submission.underwriterConcerns.length) },
    ],
    businessImpact: submission.underwriterConcerns[0] ?? 'No material underwriter concern recorded.',
    recommendedAction: submission.nextAction,
    navigation: { label: 'Open Submission', route: ROUTES.submission(submission.id) },
  };
}

function placementRecord(negotiation, data) {
  return {
    id: negotiation.id,
    type: 'placement',
    title: clientName(data, negotiation.clientId),
    subtitle: `${negotiation.currentStatus} • ${negotiation.quotesReceived}/${negotiation.insurersApproached.length} quotes received`,
    status: negotiation.decisionRequired ? 'Decision required' : negotiation.currentStatus,
    metrics: [
      { label: 'Best quote', value: money(negotiation.bestQuote) },
      { label: 'Target', value: money(negotiation.targetPremium) },
      { label: 'Savings', value: money(negotiation.estimatedSavings) },
    ],
    businessImpact: negotiation.pendingQuestions[0] ?? 'Market placement is moving without a listed blocker.',
    recommendedAction: `Recommended insurer: ${negotiation.recommendedInsurer}`,
    navigation: { label: 'Open Placement', route: ROUTES.placement(negotiation.id) },
  };
}

function complianceRecord(item, data) {
  return {
    id: item.id,
    type: 'compliance',
    title: clientName(data, item.clientId),
    subtitle: `${item.findingType} • due ${item.dueDate}`,
    status: item.status,
    metrics: [
      { label: 'Severity', value: item.severity },
      { label: 'Status', value: item.status },
      { label: 'Assigned', value: item.assignedUserId },
    ],
    businessImpact: item.businessImpact,
    recommendedAction: item.correctiveAction,
    navigation: { label: 'Open Compliance', route: ROUTES.compliance(item.id) },
  };
}

function documentRecord(item, data) {
  return {
    id: item.id,
    type: 'document',
    title: clientName(data, item.clientId),
    subtitle: `${item.documentType ?? item.type ?? 'Document'} • ${item.status}`,
    status: item.status,
    metrics: [
      { label: 'Status', value: item.status },
      { label: 'Client', value: item.clientId },
    ],
    businessImpact: item.businessImpact ?? 'Document status may affect renewal or submission readiness.',
    recommendedAction: item.nextAction ?? 'Review and update the document record.',
    navigation: { label: 'Open Document', route: ROUTES.document(item.id) },
  };
}

function filterByClient(records, entities) {
  return entities.client ? records.filter((record) => record.clientId === entities.client.id) : records;
}

function buildClientSummary(client, data) {
  const renewals = data.renewals.filter((item) => item.clientId === client.id);
  const submissions = data.submissions.filter((item) => item.clientId === client.id);
  const claims = data.claims.filter((item) => item.clientId === client.id);
  const placements = data.negotiations.filter((item) => item.clientId === client.id);
  const compliance = data.compliance.filter((item) => item.clientId === client.id && item.status !== 'Closed');
  return [
    clientRecord(client, {
      recommendedAction: 'Use this as the starting point for the client discussion.',
    }),
    ...renewals.slice(0, 2).map((item) => renewalRecord(item, data)),
    ...submissions.slice(0, 2).map((item) => submissionRecord(item, data)),
    ...claims.slice(0, 2).map((item) => claimRecord(item, data)),
    ...placements.slice(0, 1).map((item) => placementRecord(item, data)),
    ...compliance.slice(0, 1).map((item) => complianceRecord(item, data)),
  ];
}

function ariResults(data, entities) {
  const viewKey = entities.view ?? 'domestic';
  const view = data.aviationRiskIndex[viewKey];
  const affected = data.clients
    .filter((client) => view.affectedClientTypes.some((type) => client.clientType.includes(type.replace(/s$/, '')) || client.industrySegment.toLowerCase().includes(type.toLowerCase().replace(/s$/, ''))))
    .slice(0, 6)
    .map((client) => clientRecord(client, {
      status: `${view.label} ARI exposure`,
      recommendedAction: view.recommendedActions[0],
    }));

  return {
    title: `${view.label} Aviation Risk Index: ${view.score}/100`,
    summary: view.summary,
    results: affected,
    insights: [
      view.primaryDriverSummary,
      `${view.workspaceSignals.executive.affectedClients} executive clients and ${view.workspaceSignals.executive.renewalsForReview} renewals are flagged for review.`,
      `Confidence: ${data.aviationRiskIndex.confidence}.`,
    ],
    actions: view.recommendedActions.slice(0, 4).map((label) => ({ label, route: '/renewals' })),
    warnings: ['Decision-support indicator only; use professional judgment.'],
    dataScope: [`ARI ${view.label}`, 'clients', 'renewals'],
  };
}

export function runBusinessTool({ route, entities, data, request }) {
  const filters = { ...route.filters };
  let title = 'iBar Results';
  let summary = 'Here is the best available view from Symphony data.';
  let results = [];
  let insights = [];
  let actions = [];
  let warnings = [];
  let dataScope = [];

  if (route.intent === 'navigation' && route.target) {
    return {
      title: `Open ${route.target.label}`,
      summary: `iBar found a direct navigation match for ${route.target.label}.`,
      results: [],
      insights: [],
      actions: [{ label: `Open ${route.target.label}`, route: route.target.route, type: 'navigate', direct: true }],
      warnings: [],
      dataScope: ['navigation'],
      appliedFilters: filters,
    };
  }

  switch (route.intent) {
    case 'unresolved_entity': {
      results = entities.clientMatches.slice(0, 4).map((item) => clientRecord(item, {
        status: 'Possible match',
        businessImpact: `iBar did not find an exact client named "${route.unresolvedEntity}". This is a possible nearby client, not an automatic match.`,
        recommendedAction: 'Open only if this is the intended client; otherwise search the client portfolio.',
      }));
      title = `No exact client found`;
      summary = `iBar could not find a client named "${route.unresolvedEntity}" in the Symphony dataset.`;
      insights = [
        'Direct navigation is paused because the client name did not match a known account strongly enough.',
        results.length ? 'Possible matches are shown for review.' : 'No nearby client matches were found.',
      ];
      actions = [{ label: 'Open client portfolio', route: '/clients' }];
      warnings = ['No direct client navigation was performed.'];
      dataScope = ['clients'];
      break;
    }

    case 'client_summary':
    case 'client_brief': {
      const client = entities.client;
      title = client ? `${client.name} client brief` : 'Client brief';
      summary = client ? client.shortBusinessSummary : 'No exact client was identified.';
      results = client ? buildClientSummary(client, data) : entities.clientMatches.map((item) => clientRecord(item));
      insights = client
        ? [
            `Retention risk is ${client.retentionRisk.toLowerCase()} with a health score of ${client.clientHealthScore}.`,
            `${client.openClaimsCount} open claims and ${client.openTasksCount} open tasks are visible.`,
            `Document completeness is ${client.documentCompleteness}%.`,
          ]
        : ['Ask for a specific client name to build a meeting brief.'];
      actions = client ? [{ label: 'Open client workspace', route: ROUTES.client(client.id) }] : [{ label: 'Open clients', route: '/clients' }];
      dataScope = ['clients', 'renewals', 'submissions', 'claims', 'placements', 'compliance'];
      break;
    }

    case 'renewal_search':
    case 'renewal_brief': {
      const days = filters.days ?? 60;
      results = filterByClient(data.renewals, entities)
        .filter((item) => item.daysToExpiry <= days || item.ownerAttentionRequired || item.revenueAtRisk >= (filters.amount ?? Infinity))
        .sort((a, b) => Number(b.ownerAttentionRequired) - Number(a.ownerAttentionRequired) || b.revenueAtRisk - a.revenueAtRisk)
        .map((item) => renewalRecord(item, data));
      title = `Renewals needing attention`;
      summary = `${results.length} renewal records matched the current priority filters.`;
      insights = [
        `${results.filter((item) => item.status === 'CEO attention').length} renewals are marked for CEO attention.`,
        `Highest revenue at risk: ${results[0]?.metrics.find((metric) => metric.label === 'Revenue at risk')?.value ?? 'none'}.`,
      ];
      actions = [{ label: 'Open renewals workspace', route: '/renewals' }];
      dataScope = ['renewals', 'clients'];
      break;
    }

    case 'claim_search':
    case 'claim_brief': {
      const threshold = filters.amount ?? 100000;
      results = filterByClient(data.claims, entities)
        .filter((item) => item.severity === 'High' || item.incurredAmount >= threshold || item.executiveReviewRequired)
        .sort((a, b) => b.incurredAmount - a.incurredAmount)
        .map((item) => claimRecord(item, data));
      title = `Claims requiring review`;
      summary = `${results.length} claims match severity, incurred, or executive review signals.`;
      insights = [
        `${results.filter((item) => item.status === 'Executive Review').length} claims are already in executive review.`,
        `Largest incurred value: ${results[0]?.metrics.find((metric) => metric.label === 'Incurred')?.value ?? 'none'}.`,
      ];
      actions = [{ label: 'Open claims workspace', route: '/claims' }];
      dataScope = ['claims', 'clients', 'policies'];
      break;
    }

    case 'submission_search': {
      const percent = filters.percent ?? 80;
      results = filterByClient(data.submissions, entities)
        .filter((item) => item.completionPercent < percent || item.status !== 'Ready for Market' || item.documentGaps.length)
        .sort((a, b) => a.completionPercent - b.completionPercent)
        .map((item) => submissionRecord(item, data));
      title = 'Submissions not fully market-ready';
      summary = `${results.length} submissions have completion gaps, document gaps, or review status.`;
      insights = [
        `${results.filter((item) => item.status !== 'Ready for Market').length} submissions are not marked Ready for Market.`,
        `Lowest completion: ${results[0]?.metrics.find((metric) => metric.label === 'Completion')?.value ?? 'none'}.`,
      ];
      actions = [{ label: 'Open submissions workspace', route: '/submissions' }];
      dataScope = ['submissions', 'clients'];
      break;
    }

    case 'placement_search':
    case 'placement_brief': {
      results = filterByClient(data.negotiations, entities)
        .filter((item) => item.currentStatus !== 'Bound' || item.decisionRequired || item.pendingQuestions.length)
        .sort((a, b) => Number(b.decisionRequired) - Number(a.decisionRequired) || b.estimatedSavings - a.estimatedSavings)
        .map((item) => placementRecord(item, data));
      title = entities.client ? `${entities.client.name} placement view` : 'Market placement signals';
      summary = `${results.length} placements have active status, pending questions, or a decision signal.`;
      insights = [
        `${results.filter((item) => item.status === 'Decision required').length} placements require a decision.`,
        `Best savings visible: ${results[0]?.metrics.find((metric) => metric.label === 'Savings')?.value ?? 'none'}.`,
      ];
      actions = [{ label: 'Open market placement', route: '/market-placement' }];
      dataScope = ['negotiations', 'renewals', 'clients'];
      break;
    }

    case 'compliance_search':
    case 'compliance_brief': {
      results = filterByClient(data.compliance, entities)
        .filter((item) => item.status === 'Overdue' || item.severity === 'High')
        .map((item) => complianceRecord(item, data));
      title = 'Compliance items requiring action';
      summary = `${results.length} findings are overdue or high severity.`;
      insights = [`${results.filter((item) => item.status === 'Overdue').length} items are overdue.`];
      actions = [{ label: 'Open compliance', route: '/compliance' }];
      dataScope = ['compliance', 'clients'];
      break;
    }

    case 'document_search': {
      results = filterByClient(data.documents, entities)
        .filter((item) => /missing|needs|expired|pending/i.test(item.status ?? '') || /missing|gap/i.test(item.businessImpact ?? ''))
        .map((item) => documentRecord(item, data));
      title = 'Document gaps';
      summary = `${results.length} document records may need attention.`;
      insights = [`${new Set(results.map((item) => item.title)).size} clients have document signals.`];
      actions = [{ label: 'Open documents', route: '/documents' }];
      dataScope = ['documents', 'clients'];
      break;
    }

    case 'team_workload': {
      results = data.teamMembers
        .filter((user) => user.workloadScore >= 75 || user.overdueTasks > 2)
        .sort((a, b) => b.workloadScore - a.workloadScore)
        .map((user) => ({
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
        }));
      title = 'Team workload signals';
      summary = `${results.length} team members have elevated workload or overdue tasks.`;
      insights = [`Highest workload: ${results[0]?.title ?? 'none'}.`];
      actions = [{ label: 'Open account manager workspace', route: '/account-manager' }];
      dataScope = ['teamMembers', 'tasks', 'clients'];
      break;
    }

    case 'ari_impact': {
      return {
        ...ariResults(data, entities),
        appliedFilters: filters,
      };
    }

    case 'business_analytics':
    case 'executive_brief':
    case 'portfolio_brief': {
      const analytics = businessAnalyticsResults(data);
      title = analytics.title;
      summary = analytics.summary;
      results = analytics.results;
      insights = analytics.insights;
      actions = analytics.actions;
      warnings = analytics.warnings;
      dataScope = analytics.dataScope;
      break;
    }

    case 'admin_configuration': {
      const admin = adminConfigurationResults(data);
      title = admin.title;
      summary = admin.summary;
      results = admin.results;
      insights = admin.insights;
      actions = admin.actions;
      warnings = admin.warnings;
      dataScope = admin.dataScope;
      break;
    }

    case 'entity_search': {
      results = entities.clientMatches.map((item) => clientRecord(item));
      title = 'Client matches';
      summary = `${results.length} client records matched your query.`;
      insights = ['Ask for a meeting brief to include renewals, claims, submissions, and placement status.'];
      actions = [{ label: 'Open clients', route: '/clients' }];
      dataScope = ['clients'];
      break;
    }

    case 'smart_priorities':
    case 'decision_support':
    case 'workflow_orchestration':
    case 'ceo_priorities':
    default: {
      const priorityRenewals = data.renewals.filter((item) => item.ownerAttentionRequired).map((item) => renewalRecord(item, data));
      const priorityClaims = data.claims.filter((item) => item.executiveReviewRequired).map((item) => claimRecord(item, data));
      const overloaded = data.teamMembers
        .filter((item) => item.workloadScore >= 80)
        .map((user) => ({
          id: user.id,
          type: 'team-member',
          title: user.name,
          subtitle: user.role,
          status: 'Over capacity',
          metrics: [
            { label: 'Workload', value: `${user.workloadScore}` },
            { label: 'Open tasks', value: String(user.openTasks) },
          ],
          businessImpact: `${user.overdueTasks} overdue tasks may affect service velocity.`,
          recommendedAction: 'Review task allocation and client follow-ups.',
          navigation: { label: 'Open Account Manager', route: '/account-manager' },
        }));
      results = [...priorityRenewals, ...priorityClaims, ...overloaded].slice(0, 12);
      title = route.intent === 'smart_priorities' ? 'My Priorities' : 'CEO attention required';
      summary = `${results.length} cross-workspace items are most likely to need action.`;
      insights = [
        `${priorityRenewals.length} renewals are flagged for CEO attention.`,
        `${priorityClaims.length} claims require executive review.`,
        `${overloaded.length} account managers are at or above workload threshold.`,
      ];
      actions = [
        { label: 'Open executive overview', route: '/' },
        { label: 'Open renewals', route: '/renewals' },
        { label: 'Open claims', route: '/claims' },
      ];
      dataScope = ['renewals', 'claims', 'teamMembers'];
      break;
    }
  }

  if (!results.length) {
    warnings.push('No exact records matched; showing the closest available business context.');
  }

  return {
    title,
    summary,
    results: results.slice(0, 12),
    insights,
    actions,
    warnings,
    dataScope,
    appliedFilters: filters,
    requestContext: {
      currentRoute: request.currentRoute,
      selectedRole: request.selectedRole,
    },
  };
}
