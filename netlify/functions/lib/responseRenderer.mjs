import { generateActionCardDetails, generateBriefing } from './briefingGenerator.mjs';
import { buildSmartPriorities } from './priorityEngine.mjs';

const CAPABILITY_BY_INTENT = {
  navigation: 'Navigation',
  ceo_priorities: 'Decision Support',
  smart_priorities: 'Decision Support',
  business_analytics: 'Executive Intelligence',
  executive_brief: 'Executive Intelligence',
  client_summary: 'Preparation',
  client_brief: 'Preparation',
  renewal_search: 'Analysis',
  renewal_brief: 'Preparation',
  claim_search: 'Analysis',
  claim_brief: 'Preparation',
  placement_search: 'Decision Support',
  placement_brief: 'Preparation',
  compliance_search: 'Analysis',
  compliance_brief: 'Preparation',
  document_search: 'Cross-Workspace Orchestration',
  team_workload: 'Analysis',
  workflow_orchestration: 'Cross-Workspace Orchestration',
  ari_impact: 'Executive Intelligence',
  executive_daily_briefing: 'Executive Intelligence',
};

function capabilityFamily(intent) {
  return CAPABILITY_BY_INTENT[intent] ?? 'Analysis';
}

function actionRoute(item) {
  return item.navigation?.route ?? '/ibar';
}

function resultToActionCard(item, data) {
  const details = generateActionCardDetails(item, data);
  return {
    id: `${item.type}-${item.id}`,
    type: item.type,
    title: item.title,
    subtitle: item.subtitle,
    issue: details.issue,
    businessImpact: item.businessImpact ?? details.reason,
    financialImpact: details.financialImpact,
    owner: details.owner,
    priority: details.priority,
    confidence: /high|ceo|executive|decision|overdue/i.test(`${item.status} ${item.businessImpact}`) ? 0.9 : 0.78,
    reason: details.reason,
    primaryAction: item.navigation ? { label: item.navigation.label, route: actionRoute(item) } : null,
    secondaryAction: { label: 'Open Related Workspace', route: workspaceRoute(item.type) },
    metrics: item.metrics ?? [],
  };
}

function workspaceRoute(type) {
  const routes = {
    client: '/clients',
    renewal: '/renewals',
    claim: '/claims',
    submission: '/submissions',
    placement: '/market-placement',
    compliance: '/compliance',
    document: '/documents',
    'team-member': '/account-manager',
    configuration: '/administration',
  };
  return routes[type] ?? '/';
}

function relatedWorkspacesFromResults(results, actions) {
  const workspaceMap = new Map();

  for (const item of results) {
    const route = workspaceRoute(item.type);
    workspaceMap.set(route, {
      label: routeLabel(route),
      route,
      reason: `${item.type} records support this answer.`,
    });
  }

  for (const action of actions ?? []) {
    if (!action.route) continue;
    const rootRoute = action.route.split('/').slice(0, 2).join('/') || '/';
    workspaceMap.set(rootRoute, {
      label: action.label,
      route: action.route,
      reason: 'Recommended next workspace.',
    });
  }

  return Array.from(workspaceMap.values()).slice(0, 6);
}

function routeLabel(route) {
  const labels = {
    '/': 'Executive Overview',
    '/clients': 'Client 360',
    '/renewals': 'Renewals',
    '/claims': 'Claims',
    '/documents': 'Documents',
    '/submissions': 'Submissions',
    '/market-placement': 'Market Placement',
    '/compliance': 'Compliance',
    '/reports': 'Reports',
    '/account-manager': 'Account Manager',
    '/administration': 'Administration',
  };
  return labels[route] ?? 'Workspace';
}

function buildBusinessAnswer({ route, toolResults, actionCards, smartPriorities }) {
  const topCard = actionCards[0];
  const primaryAction = topCard?.primaryAction?.label ?? toolResults.actions?.[0]?.label ?? 'Review the supporting records';

  return {
    headline: toolResults.title,
    answer: toolResults.summary,
    why: topCard?.reason ?? toolResults.insights?.[0] ?? 'This answer is grounded in the current Symphony business dataset.',
    businessImpact: topCard?.businessImpact ?? smartPriorities?.summary ?? 'Use the related workspace links to move from analysis into action.',
    financialImpact: topCard?.financialImpact ?? 'See action cards for quantified values.',
    primaryAction,
  };
}

function buildRecommendedActions(toolResults, actionCards) {
  const cardActions = actionCards
    .filter((card) => card.primaryAction)
    .slice(0, 4)
    .map((card) => ({
      label: card.primaryAction.label,
      route: card.primaryAction.route,
      why: card.businessImpact,
      priority: card.priority,
    }));

  const topActions = (toolResults.actions ?? []).map((action) => ({
    label: action.label,
    route: action.route,
    why: 'Recommended by the current business answer.',
    priority: action.direct ? 'Immediate' : 'Next',
  }));

  return [...cardActions, ...topActions]
    .filter((item, index, all) => item.route && all.findIndex((candidate) => candidate.label === item.label && candidate.route === item.route) === index)
    .slice(0, 6);
}

function buildRelatedQuestions({ route, entities }) {
  if (entities.client) {
    return [
      `Prepare meeting brief for ${entities.client.name}`,
      `What claims does ${entities.client.name} have?`,
      `Which documents are blocking ${entities.client.name}?`,
      `Open highest priority renewal for ${entities.client.name}`,
    ];
  }

  const byIntent = {
    renewal_search: [
      'Which of these have missing documents?',
      'Which renewals have claims?',
      'Which generate the most revenue?',
      'Open highest priority renewal',
    ],
    claim_search: [
      'Which claims affect renewals?',
      'Prepare claim summary',
      'Which clients need immediate attention?',
      'Open executive review claims',
    ],
    document_search: [
      'Which documents are blocking revenue?',
      'Show missing renewal documents',
      'Which clients have poor document completeness?',
      'Open documents workspace',
    ],
    business_analytics: [
      'Where is revenue at risk?',
      'Summarize business health',
      'Prepare board briefing',
      'What changed since yesterday?',
    ],
    ceo_priorities: [
      'Prepare today’s executive briefing',
      'Which renewals should be escalated?',
      'Which claims require intervention?',
      'Which team members are overloaded?',
    ],
  };

  return byIntent[route.intent] ?? [
    'What should I focus on today?',
    'Prepare executive briefing',
    'Show clients impacted by current ARI',
    'Which documents are blocking revenue?',
  ];
}

function buildWorkflowPlan({ route, entities, actionCards }) {
  if (!entities.client && route.intent !== 'workflow_orchestration') return null;
  const clientRoute = entities.client ? `/clients/${encodeURIComponent(entities.client.id)}` : actionCards[0]?.primaryAction?.route;
  const steps = [
    { label: 'Open client context', route: clientRoute ?? '/clients', status: 'Ready' },
    { label: 'Review priority record', route: actionCards[0]?.primaryAction?.route ?? '/renewals', status: 'Ready' },
    { label: 'Check missing documents', route: '/documents', status: 'Ready' },
    { label: 'Prepare briefing', route: '/ibar', status: 'Available' },
    { label: 'Return to related workspace', route: actionCards[0]?.secondaryAction?.route ?? '/', status: 'Available' },
  ];
  return {
    title: entities.client ? `${entities.client.name} workflow orchestration` : 'Workflow orchestration',
    summary: 'iBar has prepared a controlled multi-step path across existing workspaces. The presenter remains in control of each step.',
    steps,
  };
}

export function renderOperatingResponse({ request, route, entities, data, toolResults }) {
  if (toolResults.executiveDailyBriefing) {
    const briefing = toolResults.executiveDailyBriefing;
    const actionCards = briefing.priorities.map((priority) => ({
      id: `${priority.type}-${priority.recordId}`,
      type: priority.type,
      title: priority.clientName,
      subtitle: priority.title,
      issue: priority.summary,
      businessImpact: priority.businessImpact,
      financialImpact: priority.financialImpact,
      owner: priority.owner,
      priority: `Priority ${priority.rank}`,
      confidence: route.confidence,
      reason: priority.recommendedAction,
      primaryAction: priority.primaryAction,
      secondaryAction: priority.secondaryActions?.[0] ?? null,
      metrics: [
        { label: 'Financial impact', value: priority.financialImpact },
        { label: 'Owner', value: priority.owner },
        { label: 'Due', value: priority.dueDate },
      ],
    }));

    return {
      version: 'iBar-v2-executive-briefing',
      capabilityFamily: 'Executive Intelligence',
      businessAnswer: {
        headline: briefing.title,
        answer: briefing.openingSentence,
        why: briefing.businessHealth.summary,
        businessImpact: `${briefing.priorityCount} executive priorities require review.`,
        financialImpact: briefing.portfolio.revenueAtRisk,
        primaryAction: 'Open Executive Briefing',
      },
      actionCards,
      businessImpact: {
        summary: briefing.businessHealth.summary,
        financialImpact: briefing.portfolio.revenueAtRisk,
        owner: request.selectedRole ?? 'CEO',
        priority: briefing.businessHealth.label,
        confidence: route.confidence,
      },
      recommendedActions: briefing.priorities.map((priority) => ({
        label: priority.primaryAction.label,
        route: priority.primaryAction.route,
        why: priority.businessImpact,
        priority: `Priority ${priority.rank}`,
      })),
      supportingRecords: toolResults.results ?? [],
      relatedWorkspaces: [
        { label: 'Executive Briefing', route: '/briefing/today', reason: 'Review the full daily briefing.' },
        { label: 'Renewals', route: '/renewals', reason: 'Review renewal readiness and blockers.' },
        { label: 'Claims', route: '/claims', reason: 'Review claim exposure and next action.' },
        { label: 'Compliance', route: '/compliance', reason: 'Review corrective actions.' },
      ],
      relatedQuestions: briefing.suggestedQueries,
      reasoningSummary: {
        reason: 'Built from deterministic business tools and the current Symphony demonstration dataset.',
        priority: briefing.businessHealth.label,
        confidence: route.confidence,
        dataSourcesUsed: briefing.sourceSummary.dataSourcesUsed,
      },
      briefing: null,
      workflowPlan: null,
      smartPriorities: null,
      commandPalette: {
        recentCommands: request.conversationContext?.map((item) => item.query).slice(0, 4) ?? [],
        suggestedCommands: briefing.suggestedQueries,
        popularCommands: ['Open the first priority', 'What remains?', 'Show missing documents', 'Prepare client meeting brief'],
        contextCommands: ['Return to my briefing', 'Move to the next priority', 'Mark reviewed'],
        roleCommands: roleCommands(request.selectedRole),
        keyboardShortcuts: ['Ctrl/Cmd + K', '/', '?', 'Esc'],
      },
    };
  }

  const actionCards = (toolResults.results ?? []).map((item) => resultToActionCard(item, data));
  const smartPriorities = /priorit|decision|ceo/.test(route.intent) ? buildSmartPriorities(data) : null;
  const briefing = generateBriefing({ route, entities, data, toolResults });
  const relatedQuestions = buildRelatedQuestions({ route, entities });
  const relatedWorkspaces = relatedWorkspacesFromResults(toolResults.results ?? [], toolResults.actions ?? []);
  const workflowPlan = buildWorkflowPlan({ route, entities, actionCards });

  return {
    version: 'iBar-v2-operating-layer',
    capabilityFamily: capabilityFamily(route.intent),
    businessAnswer: buildBusinessAnswer({ route, toolResults, actionCards, smartPriorities }),
    actionCards,
    businessImpact: {
      summary: actionCards[0]?.businessImpact ?? toolResults.summary,
      financialImpact: actionCards[0]?.financialImpact ?? 'See supporting records.',
      owner: actionCards[0]?.owner ?? request.selectedRole ?? 'CEO',
      priority: actionCards[0]?.priority ?? 'Watch',
      confidence: route.confidence,
    },
    recommendedActions: buildRecommendedActions(toolResults, actionCards),
    supportingRecords: (toolResults.results ?? []).slice(0, 8),
    relatedWorkspaces,
    relatedQuestions,
    reasoningSummary: {
      reason: actionCards[0]?.reason ?? toolResults.insights?.[0] ?? 'Matched current business context and deterministic tool output.',
      priority: actionCards[0]?.priority ?? 'Watch',
      confidence: route.confidence,
      dataSourcesUsed: toolResults.dataScope ?? [],
    },
    briefing,
    workflowPlan,
    smartPriorities,
    commandPalette: {
      recentCommands: request.conversationContext?.map((item) => item.query).slice(0, 4) ?? [],
      suggestedCommands: relatedQuestions.slice(0, 4),
      popularCommands: [
        'What should I focus on today?',
        'Prepare executive briefing',
        'Which renewals have the most revenue at risk?',
        'Which documents are blocking revenue?',
      ],
      contextCommands: contextCommands(request.currentRoute),
      roleCommands: roleCommands(request.selectedRole),
      keyboardShortcuts: ['Ctrl/Cmd + K', '/', '?', 'G then C', 'G then R', 'Esc'],
    },
  };
}

function contextCommands(route) {
  if (route?.startsWith('/clients')) return ['What should happen next?', 'Prepare client relationship summary', 'Show open claims for this client'];
  if (route?.startsWith('/claims')) return ['What concerns me?', 'Which claims affect renewals?', 'Prepare claim summary'];
  if (route?.startsWith('/reports')) return ['Explain revenue at risk', 'Summarize business health', 'Prepare board briefing'];
  if (route?.startsWith('/documents')) return ['Which documents block revenue?', 'Show missing renewal documents', 'Open highest priority renewal'];
  return ['Show today’s priorities', 'Prepare executive briefing', 'Open Client 360'];
}

function roleCommands(role) {
  if (/account/i.test(role ?? '')) return ['Which renewals need me?', 'Which clients need follow-up?', 'Prepare portfolio summary'];
  if (/claim/i.test(role ?? '')) return ['What requires intervention?', 'Prepare claim summary', 'Which claims affect renewals?'];
  if (/placement/i.test(role ?? '')) return ['Which quotes arrived today?', 'Which placements need a decision?', 'Prepare placement recommendation'];
  if (/compliance/i.test(role ?? '')) return ['What clients need review?', 'Prepare compliance review', 'Show overdue findings'];
  return ['What should I focus on today?', 'Prepare board briefing', 'Show strategic priorities'];
}
