const NAVIGATION_TARGETS = [
  { route: '/', label: 'Executive Overview', patterns: [/executive overview/, /dashboard/, /home/] },
  { route: '/account-manager', label: 'Account Manager', patterns: [/account manager/, /am workspace/] },
  { route: '/clients', label: 'Clients', patterns: [/clients?/, /client workspace/] },
  { route: '/renewals', label: 'Renewals', patterns: [/renewals?/] },
  { route: '/submissions', label: 'Submissions', patterns: [/submissions?/] },
  { route: '/market-placement', label: 'Market Placement', patterns: [/market placement/, /placements?/, /quotes?/] },
  { route: '/claims', label: 'Claims', patterns: [/claims?/] },
  { route: '/compliance', label: 'Compliance', patterns: [/compliance/] },
  { route: '/documents', label: 'Documents', patterns: [/documents?/] },
  { route: '/reports', label: 'Reports', patterns: [/reports?/, /analytics/, /business intelligence/, /executive intelligence/] },
  { route: '/administration', label: 'Administration', patterns: [/administration/, /admin/, /configuration/, /settings/] },
];

export function classifyIntent(query, entities) {
  const q = query.toLowerCase();
  const navTarget = NAVIGATION_TARGETS.find((target) => target.patterns.some((pattern) => pattern.test(q)));
  const startsAsNavigation = /^(open|go to|take me to|navigate to|show me)\b/.test(q);
  const strongClientMatch = entities.client && (
    (entities.clientMatch?.score ?? 0) >= 0.72
    || /\b(this|current|active|that)\s+(client|account)\b/.test(q)
  );

  if (startsAsNavigation && strongClientMatch) {
    return {
      intent: 'navigation',
      confidence: 0.94,
      target: { route: `/clients/${encodeURIComponent(entities.client.id)}`, label: entities.client.name },
      direct: true,
      filters: entities.filters,
    };
  }

  if (startsAsNavigation && entities.unresolvedClientQuery) {
    return {
      intent: 'unresolved_entity',
      confidence: 0.44,
      unresolvedEntity: entities.unresolvedClientQuery,
      filters: entities.filters,
    };
  }

  if (startsAsNavigation && navTarget) {
    return {
      intent: 'navigation',
      confidence: 0.93,
      target: navTarget,
      direct: true,
      filters: entities.filters,
    };
  }

  if (/my priorities|today'?s priorities|smart priorities|what should i focus on today|focus today|strategic priorities/.test(q)) {
    return { intent: 'smart_priorities', confidence: 0.9, filters: entities.filters };
  }

  if (/then|after that|followed by|orchestrate|workflow|multi-step|multi step/.test(q)) {
    return { intent: 'workflow_orchestration', confidence: 0.84, filters: entities.filters };
  }

  if (/prepare|brief|briefing|board briefing|meeting brief|summary/.test(q)) {
    if (/board|executive/.test(q)) return { intent: 'executive_brief', confidence: 0.9, filters: entities.filters };
    if (/portfolio/.test(q)) return { intent: 'portfolio_brief', confidence: 0.86, filters: entities.filters };
    if (entities.client) return { intent: 'client_brief', confidence: 0.9, filters: entities.filters };
    if (/renewal/.test(q)) return { intent: 'renewal_brief', confidence: 0.86, filters: entities.filters };
    if (/claim/.test(q)) return { intent: 'claim_brief', confidence: 0.86, filters: entities.filters };
    if (/placement|quote|market/.test(q)) return { intent: 'placement_brief', confidence: 0.84, filters: entities.filters };
    if (/compliance/.test(q)) return { intent: 'compliance_brief', confidence: 0.84, filters: entities.filters };
    return { intent: 'executive_brief', confidence: 0.88, filters: entities.filters };
  }

  if (/what should|what requires|should be escalated|requires executive approval|requires intervention|need immediate attention|do next|next action|next best/.test(q)) {
    return { intent: 'decision_support', confidence: 0.86, filters: entities.filters };
  }

  if (/meeting brief|brief me|client summary|summary for|overview for|summarize .*client|summarise .*client/.test(q) && entities.client) {
    return { intent: 'client_summary', confidence: 0.87, filters: entities.filters };
  }

  if (/business performance|business health|business analytics|reports?|executive brief|executive briefing|executive intelligence|what changed|trend analysis|forecast|strategic outlook|insurer performance|portfolio intelligence|market intelligence/.test(q)) {
    return { intent: 'business_analytics', confidence: 0.85, filters: entities.filters };
  }

  if (/administration|admin|configuration|settings|business rules|workflow architecture|workflow diagram|configured insurers|reference data|ai configuration|ibar configuration|platform health|system health|who manages|roles and responsibilities|data dictionary/.test(q)) {
    return { intent: 'admin_configuration', confidence: 0.84, filters: entities.filters };
  }

  if (/owner|ceo|priority|attention|required|focus today|next best/.test(q)) {
    return { intent: 'ceo_priorities', confidence: 0.86, filters: entities.filters };
  }

  if (/\brisk index\b|\bari\b|\baviation risk\b|\bthreat\b|\bweather\b|\bgeopolitical\b|\benergy\b|\bfuel\b/.test(q)) {
    return { intent: 'ari_impact', confidence: 0.86, filters: entities.filters };
  }

  if (/document|missing|upload|certificate|evidence|loss run|roster|awaiting review|pending review|blocking/.test(q)) {
    return { intent: 'document_search', confidence: 0.82, filters: entities.filters };
  }

  if (/renewal|expir|revenue at risk/.test(q)) {
    return { intent: 'renewal_search', confidence: 0.84, filters: { days: 60, ...entities.filters } };
  }

  if (/claim|severity|reserve|incurred|loss/.test(q)) {
    return { intent: 'claim_search', confidence: 0.84, filters: { amount: 100000, ...entities.filters } };
  }

  if (/submission|not ready|ready for market|document gap|underwriter concern/.test(q)) {
    return { intent: 'submission_search', confidence: 0.82, filters: { percent: 80, ...entities.filters } };
  }

  if (/placement|quote|insurer|market response|awaiting/.test(q)) {
    return { intent: 'placement_search', confidence: 0.82, filters: entities.filters };
  }

  if (/compliance|overdue|finding|corrective/.test(q)) {
    return { intent: 'compliance_search', confidence: 0.8, filters: entities.filters };
  }

  if (/workload|overloaded|capacity|team/.test(q)) {
    return { intent: 'team_workload', confidence: 0.78, filters: entities.filters };
  }

  if (entities.clientMatches.length) {
    return { intent: 'entity_search', confidence: 0.74, filters: entities.filters };
  }

  if (navTarget) {
    return {
      intent: 'workspace_summary',
      confidence: 0.66,
      target: navTarget,
      direct: false,
      filters: entities.filters,
    };
  }

  return { intent: 'cross_workspace_question', confidence: 0.56, filters: entities.filters };
}
