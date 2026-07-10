# iBar Server-Side Architecture

iBar is the compact natural-language business interface in the top bar. The browser sends a small JSON request to `/api/ibar`, which Netlify redirects to `/.netlify/functions/ibar`.

The Netlify Function owns all intent routing, entity resolution, business data access, response shaping, and the `microLmAdapter` boundary. No model prompt, model config, server data loader, or secret is sent to the browser.

## Local Startup

Use Netlify local dev when testing iBar end to end:

```bash
npm install
npm run dev:netlify
```

`npm run dev` still runs the Vite app, but it does not provide Netlify Functions.

## Server Modules

- `netlify/functions/ibar.mjs` validates POST requests and orchestrates the pipeline.
- `lib/validation.mjs` enforces method, content type, body size, query length, and safe error responses.
- `lib/rateLimit.mjs` provides a basic in-memory per-IP limit for the proof of concept.
- `lib/dataLoader.mjs` reads the shared JSON data in `src/data`.
- `lib/intentRouter.mjs` classifies navigation, search, analysis, summary, and cross-workspace questions.
- `lib/entityResolver.mjs` resolves clients, records, filters, money thresholds, days, and ARI view.
- `lib/businessTools.mjs` answers with deterministic business records from the authoritative JSON data.
- `lib/priorityEngine.mjs` ranks "My Priorities" across revenue risk, blocked documents, claims, compliance, and team capacity.
- `lib/briefingGenerator.mjs` creates reusable executive, client, renewal, and claim-style briefing sections.
- `lib/responseRenderer.mjs` converts deterministic tool output into the iBar v2 operating-layer contract: Action Cards, business answer, impact, related workspaces, workflow steps, and command palette metadata.
- `lib/microLmAdapter.mjs` is the server-only model adapter boundary.
- `lib/responseBuilder.mjs` validates the final structured response contract.

## Model Adapter

The current implementation returns `meta.model = "deterministic-fallback"` unless `IBAR_PROVIDER=microlm` and `IBAR_MICROLM_ENDPOINT` are configured. A future microLM implementation should live inside `microLmAdapter.mjs` and must return structured JSON only.

## Response Contract

The function returns the original structured fields: `requestId`, `status`, `intent`, `confidence`, `title`, `summary`, `statusLine`, `results`, `insights`, `actions`, `suggestedQueries`, `warnings`, and `meta`.

iBar v2 adds operating-layer fields while preserving backward compatibility:

- `businessAnswer`
- `actionCards`
- `businessImpact`
- `recommendedActions`
- `supportingRecords`
- `relatedWorkspaces`
- `relatedQuestions`
- `reasoningSummary`
- `briefing`
- `workflowPlan`
- `smartPriorities`
- `commandPalette`

These fields must stay grounded in deterministic business tools and the shared JSON model. The UI should render them as operating actions, not chat bubbles.

## Executive Daily Briefing

Phase 15.5 adds the deterministic `executive_daily_briefing` intent for commands such as `Prepare me for my day`, `Start my day`, `Give me today's briefing`, and `Show today's priorities`.

The Netlify function builds the briefing through `lib/executiveDailyBriefing.mjs`. The React route `/briefing/today` renders the premium briefing experience and stores review progress in session storage only:

- `symphony:briefing:today`
- `symphony:briefing:review`

Review state marks priorities as reviewed for the session; it does not mutate business records or claim that underlying issues are resolved.
