import { loadBusinessData } from './lib/dataLoader.mjs';
import { resolveEntities } from './lib/entityResolver.mjs';
import { classifyIntent } from './lib/intentRouter.mjs';
import { runBusinessTool } from './lib/businessTools.mjs';
import { generateStructuredResponse } from './lib/microLmAdapter.mjs';
import { buildIBarResponse } from './lib/responseBuilder.mjs';
import { enforceRateLimit } from './lib/rateLimit.mjs';
import { IBarError, jsonResponse, parseIBarRequest, safeErrorPayload } from './lib/validation.mjs';

export async function handler(event) {
  const startedAt = Date.now();
  let requestId;

  try {
    const limit = enforceRateLimit(event);
    if (limit.limited) {
      return {
        ...jsonResponse(429, safeErrorPayload(new IBarError(429, 'Too many iBar requests. Please wait a moment.', 'RATE_LIMITED'), requestId)),
        headers: {
          ...jsonResponse(429, {}).headers,
          'Retry-After': String(limit.retryAfterSeconds),
        },
      };
    }

    const request = parseIBarRequest(event);
    requestId = request.requestId;

    const data = await loadBusinessData();
    const entities = resolveEntities(request.query, data, request);
    const route = classifyIntent(request.query, entities);
    const toolResults = runBusinessTool({ route, entities, data, request });
    const modelResult = await generateStructuredResponse({ query: request.query, route, entities, toolResults });
    const response = buildIBarResponse({ request, route, entities, toolResults, modelResult, startedAt });

    console.info('ibar_request', {
      requestId: request.requestId,
      intent: route.intent,
      confidence: route.confidence,
      resultCount: response.results.length,
      durationMs: response.statusLine.durationMs,
    });

    return jsonResponse(200, response);
  } catch (error) {
    const payload = safeErrorPayload(error, requestId);
    payload.statusLine.durationMs = Date.now() - startedAt;
    console.warn('ibar_safe_error', {
      requestId: payload.requestId,
      code: error?.code ?? 'UNHANDLED',
      statusCode: error?.statusCode ?? 500,
    });
    return jsonResponse(error?.statusCode ?? 500, payload);
  }
}
