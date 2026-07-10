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
- `lib/microLmAdapter.mjs` is the server-only model adapter boundary.
- `lib/responseBuilder.mjs` validates the final structured response contract.

## Model Adapter

The current implementation returns `meta.model = "deterministic-fallback"` unless `IBAR_PROVIDER=microlm` and `IBAR_MICROLM_ENDPOINT` are configured. A future microLM implementation should live inside `microLmAdapter.mjs` and must return structured JSON only.

## Response Contract

The function returns structured fields: `requestId`, `status`, `intent`, `confidence`, `title`, `summary`, `statusLine`, `results`, `insights`, `actions`, `suggestedQueries`, `warnings`, and `meta`.
