import { validateIBarResponse } from './validation.mjs';

export function buildIBarResponse({ request, route, entities, toolResults, modelResult, startedAt }) {
  const durationMs = Date.now() - startedAt;
  const response = {
    requestId: request.requestId,
    status: 'ok',
    intent: route.intent,
    confidence: route.confidence,
    title: modelResult.title,
    summary: modelResult.summary,
    statusLine: {
      label: modelResult.statusLabel,
      steps: ['validated', 'classified', 'resolved entities', 'ran tools', 'composed response'],
      durationMs,
    },
    results: toolResults.results ?? [],
    insights: toolResults.insights ?? [],
    actions: toolResults.actions ?? [],
    suggestedQueries: modelResult.suggestedQueries ?? [],
    warnings: toolResults.warnings ?? [],
    meta: {
      model: modelResult.model,
      serverSide: true,
      requestSchemaVersion: '2026-07-ibar-v1',
      dataScope: toolResults.dataScope ?? [],
      appliedFilters: toolResults.appliedFilters ?? {},
      currentRoute: request.currentRoute,
      selectedRole: request.selectedRole,
      selectedUserId: request.selectedUserId,
      entityIds: {
        client: entities.client?.id ?? null,
        claim: entities.claim?.id ?? null,
        renewal: entities.renewal?.id ?? null,
        submission: entities.submission?.id ?? null,
        negotiation: entities.negotiation?.id ?? null,
      },
    },
  };

  return validateIBarResponse(response);
}
