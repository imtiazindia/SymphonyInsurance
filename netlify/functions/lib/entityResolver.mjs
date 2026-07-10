const COMMAND_PREFIXES = [
  /^(open|go to|take me to|navigate to|show me|show|prepare|create|build)\s+/,
  /^(meeting brief|client meeting brief|briefing|brief|summary)\s+(for\s+)?/,
  /^(client|account)\s+/,
];

function normalizeSearchText(value) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function clientSearchText(query) {
  let text = normalizeSearchText(query);
  for (let index = 0; index < 4; index += 1) {
    const next = COMMAND_PREFIXES.reduce((current, pattern) => current.replace(pattern, ''), text).trim();
    if (next === text) break;
    text = next;
  }
  text = text
    .replace(/\b(for|about|regarding|client|account|workspace|please)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return text || normalizeSearchText(query);
}

function tokenSet(value) {
  return new Set(normalizeSearchText(value).split(' ').filter((word) => word.length > 2));
}

function scoreTextMatch(query, value) {
  const haystack = String(value ?? '').toLowerCase();
  if (!haystack) return 0;
  if (haystack === query) return 1;
  if (haystack.includes(query)) return 0.82;
  const words = query.split(' ').filter((word) => word.length > 2);
  const hits = words.filter((word) => haystack.includes(word)).length;
  return words.length ? hits / words.length * 0.7 : 0;
}

function scoreClientName(query, client) {
  const normalizedQuery = clientSearchText(query);
  const normalizedName = normalizeSearchText(client.name);
  const queryTokens = tokenSet(normalizedQuery);
  const nameTokens = tokenSet(normalizedName);
  const shared = [...queryTokens].filter((word) => nameTokens.has(word));
  const coverage = queryTokens.size ? shared.length / queryTokens.size : 0;
  const nameCoverage = nameTokens.size ? shared.length / nameTokens.size : 0;

  if (normalizedName === normalizedQuery) return { score: 1, kind: 'exact-name' };
  if (normalizedName.includes(normalizedQuery) && normalizedQuery.length >= 5) return { score: 0.94, kind: 'name-contains-query' };
  if (normalizedQuery.includes(normalizedName) && normalizedName.length >= 5) return { score: 0.9, kind: 'query-contains-name' };
  if (coverage >= 0.8 && nameCoverage >= 0.67) return { score: 0.84, kind: 'strong-token-name' };
  if (coverage >= 0.67 && nameCoverage >= 0.67 && shared.length >= 2) return { score: 0.72, kind: 'partial-token-name' };

  return { score: Math.max(scoreTextMatch(normalizedQuery, normalizedName), coverage * 0.58), kind: 'weak-name' };
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
  const startsAsExplicitNavigation = /^(open|go to|take me to|navigate to)\b/.test(normalized);
  const explicitForEntity = /\b(for|about|regarding)\s+[a-z0-9]/.test(normalized);

  const nameMatches = data.clients
    .map((client) => ({ client, ...scoreClientName(normalized, client) }))
    .filter((item) => item.score >= 0.62)
    .sort((a, b) => b.score - a.score);

  const broadClientMatches = data.clients
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

  const bestNameMatch = nameMatches[0];
  const contextClientRequested = Boolean(activeClient && (
    /\b(this|current|active|that)\s+(client|account)\b/.test(normalized)
    || /\b(they|them|their)\b/.test(normalized)
    || (!bestNameMatch && !startsAsExplicitNavigation && !explicitForEntity && request.currentRoute?.startsWith('/clients'))
  ));

  entities.client = contextClientRequested ? activeClient : bestNameMatch?.client ?? null;
  entities.clientMatch = bestNameMatch
    ? { id: bestNameMatch.client.id, score: bestNameMatch.score, kind: bestNameMatch.kind, query: clientSearchText(normalized) }
    : null;
  entities.unresolvedClientQuery = !bestNameMatch && /^(open|go to|take me to|navigate to|prepare|show me|show)\b/.test(normalized)
    ? clientSearchText(normalized)
    : null;
  entities.clientMatches = (nameMatches.length ? nameMatches : broadClientMatches)
    .slice(0, 8)
    .map((item) => ({ ...item.client, matchScore: item.score, matchKind: item.kind ?? 'broad-context' }));

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
