export async function generateStructuredResponse({ query, route, entities, toolResults }) {
  const model = process.env.IBAR_PROVIDER === 'microlm' && process.env.IBAR_MICROLM_ENDPOINT
    ? 'server-side-microLM-adapter'
    : 'deterministic-fallback';

  const entityLabel = entities.client?.name
    ?? entities.claim?.id
    ?? entities.renewal?.id
    ?? entities.submission?.id
    ?? null;

  const summaryParts = [
    toolResults.summary,
    entityLabel ? `Primary entity: ${entityLabel}.` : '',
    toolResults.results.length ? `${toolResults.results.length} result${toolResults.results.length === 1 ? '' : 's'} returned.` : 'No records returned.',
  ].filter(Boolean);

  return {
    model,
    title: toolResults.title,
    summary: summaryParts.join(' '),
    statusLabel: route.intent === 'navigation' ? 'Navigation ready' : 'Business answer ready',
    suggestedQueries: buildSuggestedQueries(query, route.intent, entities),
  };
}

function buildSuggestedQueries(_query, intent, entities) {
  if (entities.client) {
    return [
      `Create a meeting brief for ${entities.client.name}`,
      `Show open claims for ${entities.client.name}`,
      `Compare quotes for ${entities.client.name}`,
    ];
  }

  const byIntent = {
    ceo_priorities: [
      'Which renewals have the most revenue at risk?',
      'High severity claims over $100,000',
      'Which account managers are overloaded?',
    ],
    renewal_search: [
      'Renewals due in the next 45 days',
      'Renewals with revenue at risk over $1M',
      'Which renewals have missing documents?',
    ],
    claim_search: [
      'Claims affecting upcoming renewals',
      'Open executive review claims',
      'Claims over $500,000 reserve',
    ],
    ari_impact: [
      'Which clients are affected by domestic ARI?',
      'Explain global aviation risk drivers',
      'What actions should we take for weather risk?',
    ],
  };

  return byIntent[intent] ?? [
    'Show CEO priorities',
    'Which submissions are not ready?',
    'Which placements are waiting on insurers?',
  ];
}
