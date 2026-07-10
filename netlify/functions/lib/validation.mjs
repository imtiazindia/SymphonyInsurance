const MAX_BODY_BYTES = 12_000;
const MAX_QUERY_LENGTH = 320;
const MAX_CONTEXT_ITEMS = 4;

function createRequestId() {
  return `ibar-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export class IBarError extends Error {
  constructor(statusCode, message, code = 'IBAR_ERROR') {
    super(message);
    this.name = 'IBarError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

export function jsonResponse(statusCode, payload) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
    body: JSON.stringify(payload),
  };
}

export function parseIBarRequest(event) {
  if (event.httpMethod !== 'POST') {
    throw new IBarError(405, 'iBar accepts POST requests only.', 'METHOD_NOT_ALLOWED');
  }

  const contentType = event.headers?.['content-type'] ?? event.headers?.['Content-Type'] ?? '';
  if (!contentType.toLowerCase().includes('application/json')) {
    throw new IBarError(415, 'Use application/json when calling iBar.', 'UNSUPPORTED_MEDIA_TYPE');
  }

  const bodyText = event.body ?? '';
  const bodyBytes = Buffer.byteLength(bodyText, event.isBase64Encoded ? 'base64' : 'utf8');
  if (bodyBytes > MAX_BODY_BYTES) {
    throw new IBarError(413, 'The iBar request is too large.', 'BODY_TOO_LARGE');
  }

  let body;
  try {
    body = JSON.parse(event.isBase64Encoded ? Buffer.from(bodyText, 'base64').toString('utf8') : bodyText);
  } catch {
    throw new IBarError(400, 'The iBar request body must be valid JSON.', 'INVALID_JSON');
  }

  const query = normalizeWhitespace(String(body.query ?? ''));
  if (!query) {
    throw new IBarError(400, 'Ask iBar a question before submitting.', 'EMPTY_QUERY');
  }

  if (query.length > MAX_QUERY_LENGTH) {
    throw new IBarError(400, `Keep iBar questions under ${MAX_QUERY_LENGTH} characters.`, 'QUERY_TOO_LONG');
  }

  const conversationContext = Array.isArray(body.conversationContext)
    ? body.conversationContext.slice(0, MAX_CONTEXT_ITEMS).map((item) => ({
        query: normalizeWhitespace(String(item.query ?? '')).slice(0, MAX_QUERY_LENGTH),
        intent: normalizeWhitespace(String(item.intent ?? '')).slice(0, 80),
        route: normalizeWhitespace(String(item.route ?? '')).slice(0, 120),
      })).filter((item) => item.query)
    : [];

  return {
    query,
    requestId: normalizeWhitespace(String(body.requestId ?? '')) || createRequestId(),
    currentRoute: safeRoute(body.currentRoute),
    selectedRole: normalizeWhitespace(String(body.selectedRole ?? 'CEO')).slice(0, 80),
    selectedUserId: normalizeWhitespace(String(body.selectedUserId ?? 'USR-001')).slice(0, 40),
    activeClientId: normalizeWhitespace(String(body.activeClientId ?? '')).slice(0, 40) || null,
    currentDate: normalizeWhitespace(String(body.currentDate ?? '2026-07-10')).slice(0, 20),
    scenario: normalizeWhitespace(String(body.scenario ?? 'healthy')).slice(0, 40),
    conversationContext,
  };
}

export function normalizeWhitespace(value) {
  return value.replace(/\s+/g, ' ').trim();
}

export function safeRoute(value) {
  const route = normalizeWhitespace(String(value ?? '/'));
  if (!route.startsWith('/')) {
    return '/';
  }
  return route.slice(0, 180);
}

export function validateIBarResponse(response) {
  const required = ['requestId', 'status', 'intent', 'confidence', 'title', 'summary', 'results', 'actions', 'meta'];
  for (const field of required) {
    if (!(field in response)) {
      throw new IBarError(500, 'iBar produced an incomplete response.', 'INVALID_RESPONSE');
    }
  }

  return {
    ...response,
    status: ['ok', 'error', 'partial'].includes(response.status) ? response.status : 'partial',
    confidence: Math.max(0, Math.min(1, Number(response.confidence) || 0)),
    results: Array.isArray(response.results) ? response.results.slice(0, 12) : [],
    insights: Array.isArray(response.insights) ? response.insights.slice(0, 6) : [],
    actions: Array.isArray(response.actions) ? response.actions.slice(0, 6) : [],
    suggestedQueries: Array.isArray(response.suggestedQueries) ? response.suggestedQueries.slice(0, 6) : [],
    warnings: Array.isArray(response.warnings) ? response.warnings.slice(0, 4) : [],
  };
}

export function safeErrorPayload(error, requestId) {
  const isIBarError = error instanceof IBarError;
  return {
    requestId: requestId || createRequestId(),
    status: 'error',
    intent: 'error',
    confidence: 0,
    title: isIBarError ? 'iBar could not process that request' : 'iBar is temporarily unavailable',
    summary: isIBarError ? error.message : 'The request could not be completed safely. Please try a narrower question.',
    statusLine: {
      label: 'Unable to complete',
      steps: ['validated', 'stopped'],
      durationMs: 0,
    },
    results: [],
    insights: [],
    actions: [],
    suggestedQueries: [
      'Show CEO priorities',
      'Which renewals need attention?',
      'High severity claims over $100,000',
    ],
    warnings: [isIBarError ? error.code : 'SAFE_ERROR'],
    meta: {
      model: 'deterministic-fallback',
      serverSide: true,
      requestSchemaVersion: '2026-07-ibar-v1',
    },
  };
}
