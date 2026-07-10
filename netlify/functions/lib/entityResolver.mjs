function scoreTextMatch(query, value) {
  const haystack = String(value ?? '').toLowerCase();
  if (!haystack) return 0;
  if (haystack === query) return 1;
  if (haystack.includes(query)) return 0.82;
  const words = query.split(' ').filter((word) => word.length > 2);
  const hits = words.filter((word) => haystack.includes(word)).length;
  return words.length ? hits / words.length * 0.7 : 0;
}

function findById(collection, query, pattern) {
  const match = query.toUpperCase().match(pattern);
  if (!match) return null;
  return collection.find((item) => item.id === match[0]) ?? null;
}

export function resolveEntities(query, data, request = {}) {
  const normalized = query.toLowerCase();
  const entities = {
    client: null,
    claim: findById(data.claims, query, /CLM-\d{3}/),
    renewal: findById(data.renewals, query, /REN-\d{3}/),
    submission: findById(data.submissions, query, /SUB-\d{3}/),
    negotiation: findById(data.negotiations, query, /NEG-\d{3}/),
    user: null,
    view: normalized.includes('global') ? 'global' : normalized.includes('domestic') ? 'domestic' : null,
    filters: {},
  };

  const activeClient = request.activeClientId
    ? data.clients.find((client) => client.id === request.activeClientId)
    : null;

  const clientMatches = data.clients
    .map((client) => ({
      client,
      score: Math.max(
        scoreTextMatch(normalized, client.name),
        scoreTextMatch(normalized, client.clientType),
        scoreTextMatch(normalized, client.industrySegment),
      ),
    }))
    .filter((item) => item.score > 0.2)
    .sort((a, b) => b.score - a.score);

  entities.client = clientMatches[0]?.client ?? activeClient ?? null;
  entities.clientMatches = clientMatches.slice(0, 8).map((item) => ({ ...item.client, matchScore: item.score }));

  const userMatches = data.teamMembers
    .map((user) => ({ user, score: Math.max(scoreTextMatch(normalized, user.name), scoreTextMatch(normalized, user.role)) }))
    .filter((item) => item.score > 0.45)
    .sort((a, b) => b.score - a.score);
  entities.user = userMatches[0]?.user ?? null;

  const moneyMatch = normalized.match(/\$?\s?(\d+(?:\.\d+)?)\s?(m|million|k|thousand)?/);
  if (moneyMatch) {
    let amount = Number(moneyMatch[1]);
    if (moneyMatch[2]?.startsWith('m')) amount *= 1_000_000;
    if (moneyMatch[2]?.startsWith('k')) amount *= 1_000;
    entities.filters.amount = amount;
  }

  const daysMatch = normalized.match(/(\d+)\s?(days|day)/);
  if (daysMatch) {
    entities.filters.days = Number(daysMatch[1]);
  }

  const percentMatch = normalized.match(/(\d+)\s?%/);
  if (percentMatch) {
    entities.filters.percent = Number(percentMatch[1]);
  }

  if (normalized.includes('helicopter')) entities.filters.clientType = 'Helicopter';
  if (normalized.includes('charter')) entities.filters.clientType = 'Charter';
  if (normalized.includes('airport')) entities.filters.clientType = 'Airport';
  if (normalized.includes('fbo')) entities.filters.clientType = 'FBO';

  return entities;
}
