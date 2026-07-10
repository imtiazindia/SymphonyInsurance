function money(value) {
  const number = Number(value) || 0;
  if (number >= 1_000_000) return `$${(number / 1_000_000).toFixed(number >= 10_000_000 ? 1 : 2)}M`;
  if (number >= 1_000) return `$${Math.round(number / 1_000)}K`;
  return `$${number.toLocaleString('en-US')}`;
}

function clientName(data, id) {
  return data.clients.find((client) => client.id === id)?.name ?? id;
}

function ownerName(data, id) {
  return data.teamMembers.find((member) => member.id === id)?.name ?? id ?? 'Unassigned';
}

function total(records, field) {
  return records.reduce((sum, item) => sum + (Number(item[field]) || 0), 0);
}

function briefType(intent) {
  if (/client/.test(intent)) return 'Client Brief';
  if (/renewal/.test(intent)) return 'Renewal Brief';
  if (/claim/.test(intent)) return 'Claim Brief';
  if (/placement/.test(intent)) return 'Placement Brief';
  if (/compliance/.test(intent)) return 'Compliance Brief';
  if (/portfolio|business|executive/.test(intent)) return 'Executive Brief';
  return 'Business Brief';
}

function clientBrief(data, client) {
  const renewals = data.renewals.filter((item) => item.clientId === client.id);
  const claims = data.claims.filter((item) => item.clientId === client.id);
  const documents = data.documents.filter((item) => item.clientId === client.id);
  const compliance = data.compliance.filter((item) => item.clientId === client.id && item.status !== 'Closed');

  return {
    type: 'Client Brief',
    title: `${client.name} relationship brief`,
    overview: client.shortBusinessSummary,
    keyFacts: [
      `Estimated revenue: ${money(client.estimatedRevenue)}.`,
      `Client health: ${client.clientHealthScore}; retention risk: ${client.retentionRisk}.`,
      `${claims.length} open claims and ${documents.filter((item) => item.status !== 'Approved').length} document items need review.`,
    ],
    businessImpact: `This relationship contributes ${money(client.estimatedRevenue)} in estimated annual revenue and has ${client.documentCompleteness}% document completeness.`,
    currentRisks: [
      `Retention risk is ${client.retentionRisk}.`,
      compliance.length ? `${compliance.length} compliance finding(s) remain open.` : 'No open compliance finding is flagged in the demo dataset.',
      renewals.some((item) => item.ownerAttentionRequired) ? 'At least one renewal needs CEO attention.' : 'Renewals are not currently flagged for CEO attention.',
    ],
    recommendedActions: [
      'Open Client 360 before the next relationship discussion.',
      'Review renewal readiness and document gaps.',
      claims.length ? 'Prepare claim narrative for underwriters.' : 'Keep claims monitoring in the relationship plan.',
    ],
    nextDecisions: [
      'Confirm renewal strategy.',
      'Confirm owner for document follow-up.',
      'Decide whether leadership should join the client conversation.',
    ],
  };
}

function executiveBrief(data) {
  const revenueAtRisk = total(data.renewals, 'revenueAtRisk');
  const premium = total(data.clients, 'annualPremium');
  const annualRevenue = total(data.clients, 'estimatedRevenue');
  const attentionRenewals = data.renewals.filter((item) => item.ownerAttentionRequired);
  const executiveClaims = data.claims.filter((item) => item.executiveReviewRequired);
  const overloadedTeam = data.teamMembers.filter((item) => item.workloadScore >= 80);

  return {
    type: 'Executive Brief',
    title: 'Today’s executive briefing',
    overview: `${money(premium)} managed premium, ${money(annualRevenue)} estimated revenue, and ${money(revenueAtRisk)} revenue at risk are visible today.`,
    keyFacts: [
      `${attentionRenewals.length} renewals need CEO attention.`,
      `${executiveClaims.length} claims require executive review.`,
      `${overloadedTeam.length} team members are at or above workload threshold.`,
    ],
    businessImpact: 'Revenue protection depends on renewal readiness, document completeness, claim narrative control, and team capacity.',
    currentRisks: [
      'High-value renewals have open document or readiness signals.',
      'Executive review claims may affect renewal strategy.',
      'Team overload can delay client follow-up and placement response.',
    ],
    recommendedActions: [
      'Open My Priorities and handle the highest revenue item first.',
      'Review executive claims before renewal discussions.',
      'Use Reports to explain business health and revenue at risk.',
    ],
    nextDecisions: [
      'Which renewal should be escalated today?',
      'Which client conversation needs executive presence?',
      'Which team workload needs rebalancing?',
    ],
  };
}

export function generateBriefing({ route, entities, data, toolResults }) {
  if (!/brief|summary|analytics|priorit|decision|intelligence/.test(route.intent)) {
    return null;
  }

  if (/client/.test(route.intent) && entities.client) {
    return clientBrief(data, entities.client);
  }

  if (/renewal/.test(route.intent) && toolResults.results?.[0]) {
    return {
      type: 'Renewal Brief',
      title: 'Renewal briefing',
      overview: toolResults.summary,
      keyFacts: toolResults.insights ?? [],
      businessImpact: 'Renewal execution protects recurring revenue and carrier confidence.',
      currentRisks: ['Missing documents, low readiness, claim narrative gaps, and market timing can delay quote release.'],
      recommendedActions: toolResults.actions?.map((action) => action.label) ?? ['Open renewals workspace.'],
      nextDecisions: ['Confirm escalation owner.', 'Confirm document follow-up.', 'Confirm market release timing.'],
    };
  }

  if (/claim/.test(route.intent) && toolResults.results?.[0]) {
    return {
      type: 'Claim Brief',
      title: 'Claim summary',
      overview: toolResults.summary,
      keyFacts: toolResults.insights ?? [],
      businessImpact: 'Claims can affect client service, renewal narrative, reserve confidence, and insurer appetite.',
      currentRisks: ['Executive review claims need clear next actions and underwriter narrative control.'],
      recommendedActions: toolResults.actions?.map((action) => action.label) ?? ['Open claims workspace.'],
      nextDecisions: ['Confirm intervention owner.', 'Confirm claim narrative.', 'Confirm renewal impact.'],
    };
  }

  return {
    ...executiveBrief(data),
    type: briefType(route.intent),
    title: toolResults.title || 'Business briefing',
    overview: toolResults.summary || executiveBrief(data).overview,
  };
}

export function generateActionCardDetails(item, data) {
  const financialMetric = item.metrics?.find((metric) => /revenue|incurred|reserve|quote|premium|savings/i.test(metric.label));
  const ownerMetric = item.metrics?.find((metric) => /assigned|owner/i.test(metric.label));
  let owner = ownerMetric?.value ?? 'Business Owner';

  if (item.type === 'renewal') {
    const renewal = data.renewals.find((record) => record.id === item.id);
    owner = ownerName(data, renewal?.assignedUserId);
  }

  if (item.type === 'client') {
    const client = data.clients.find((record) => record.id === item.id);
    owner = ownerName(data, client?.assignedAccountManagerId);
  }

  return {
    issue: item.status ?? item.type,
    financialImpact: financialMetric?.value ?? 'Not quantified',
    owner,
    reason: item.businessImpact ?? 'Matched current business priority filters.',
    priority: /ceo|executive|high|overdue|decision|attention|risk/i.test(`${item.status} ${item.businessImpact}`) ? 'High' : 'Watch',
  };
}
