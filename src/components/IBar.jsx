import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, CheckCircle2, Command, Loader2, Search, Sparkles, TriangleAlert } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

const HISTORY_KEY = 'symphony:ibar:recent';
const CONTEXT_KEY = 'symphony:ibar:context';
const LAST_RESULT_KEY = 'symphony:ibar:lastResult';

const DEFAULT_SUGGESTIONS = [
  'Show CEO priorities',
  'Which renewals have the most revenue at risk?',
  'High severity claims over $100,000',
  'Which submissions are not ready?',
  'Which placements are waiting on insurers?',
];

function readJsonStorage(key, fallback) {
  try {
    return JSON.parse(window.localStorage.getItem(key) ?? window.sessionStorage.getItem(key) ?? 'null') ?? fallback;
  } catch {
    return fallback;
  }
}

function writeJsonStorage(storage, key, value) {
  try {
    storage.setItem(key, JSON.stringify(value));
  } catch {
    // Non-critical browser storage.
  }
}

function getContext() {
  try {
    return JSON.parse(window.sessionStorage.getItem(CONTEXT_KEY) ?? '[]').slice(0, 3);
  } catch {
    return [];
  }
}

function saveContext(entry) {
  const next = [entry, ...getContext()].slice(0, 4);
  writeJsonStorage(window.sessionStorage, CONTEXT_KEY, next);
}

function createRequestId() {
  return `ibar-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function deriveActiveClientId(location) {
  const params = new URLSearchParams(location.search);
  const queryClientId = params.get('clientId');
  if (queryClientId) return queryClientId;
  const clientRouteMatch = location.pathname.match(/^\/clients\/([^/]+)/);
  return clientRouteMatch ? decodeURIComponent(clientRouteMatch[1]) : null;
}

export function IBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const abortRef = useRef(null);
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ tone: 'idle', text: 'Ready for business questions' });
  const [history, setHistory] = useState(() => readJsonStorage(HISTORY_KEY, []));

  const suggestions = useMemo(() => {
    const routeSuggestions = location.pathname.startsWith('/claims')
      ? ['Claims affecting upcoming renewals', 'Open executive review claims']
      : location.pathname.startsWith('/renewals')
        ? ['Renewals due in the next 45 days', 'Renewals with revenue at risk over $1M']
        : location.pathname.startsWith('/market-placement')
          ? ['Compare quotes for SkyHigh Airlines', 'Which placements need a decision?']
          : [];
    return [...history, ...routeSuggestions, ...DEFAULT_SUGGESTIONS]
      .filter(Boolean)
      .filter((item, index, all) => all.indexOf(item) === index)
      .slice(0, 7);
  }, [history, location.pathname]);

  useEffect(() => {
    function onKeyDown(event) {
      const editable = event.target instanceof HTMLElement
        && ['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName);
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        inputRef.current?.focus();
      }
      if (event.key === 'Escape' && focused && !editable) {
        setFocused(false);
        inputRef.current?.blur();
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [focused]);

  useEffect(() => {
    function onDemoSubmit(event) {
      const nextQuery = event.detail?.query;
      if (typeof nextQuery === 'string') {
        submit(nextQuery);
      }
    }

    window.addEventListener('symphony:ibar:submit', onDemoSubmit);
    return () => window.removeEventListener('symphony:ibar:submit', onDemoSubmit);
  });

  async function submit(nextQuery = query) {
    const normalized = nextQuery.replace(/\s+/g, ' ').trim();
    if (!normalized || loading) return;

    const requestId = createRequestId();
    const recent = [normalized, ...history.filter((item) => item !== normalized)].slice(0, 6);
    setHistory(recent);
    writeJsonStorage(window.localStorage, HISTORY_KEY, recent);
    setQuery(normalized);
    setFocused(false);
    setLoading(true);
    setStatus({ tone: 'loading', text: 'Understanding request...' });

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    try {
      const response = await fetch('/api/ibar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: normalized,
          currentRoute: `${location.pathname}${location.search}`,
          selectedRole: 'CEO',
          selectedUserId: 'USR-001',
          activeClientId: deriveActiveClientId(location),
          conversationContext: getContext(),
          requestId,
        }),
        signal: abortRef.current.signal,
      });

      const payload = await response.json();
      if (!response.ok && payload.status !== 'error') {
        throw new Error('iBar request failed');
      }

      saveContext({ query: normalized, intent: payload.intent, route: `${location.pathname}${location.search}` });

      const directAction = payload.actions?.find((action) => action.type === 'navigate' && action.direct && action.route);
      if (directAction && payload.confidence >= 0.88) {
        setStatus({ tone: 'success', text: directAction.label });
        navigate(directAction.route);
        return;
      }

      writeJsonStorage(window.sessionStorage, LAST_RESULT_KEY, payload);
      writeJsonStorage(window.sessionStorage, `symphony:ibar:result:${payload.requestId}`, payload);
      setStatus({
        tone: payload.status === 'error' ? 'warning' : 'success',
        text: payload.statusLine?.label ?? 'Answer ready',
      });
      navigate(`/ibar?requestId=${encodeURIComponent(payload.requestId)}`);
    } catch (error) {
      if (error.name === 'AbortError') return;
      setStatus({ tone: 'warning', text: 'iBar could not reach the secure analysis service' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="ibar-shell">
      <form className="ibar-form" onSubmit={(event) => { event.preventDefault(); submit(); }}>
        <div className="ibar-input-wrap">
          <Sparkles size={17} strokeWidth={1.9} aria-hidden="true" />
          <Search size={18} strokeWidth={1.8} aria-hidden="true" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            placeholder="Ask about clients, renewals, claims, placements or business performance..."
            onChange={(event) => setQuery(event.target.value)}
            onFocus={() => setFocused(true)}
            aria-label="iBar business search"
            autoComplete="off"
          />
          <span className="ibar-shortcut" aria-hidden="true">
            <Command size={12} />
            K
          </span>
          <button className="ibar-submit" type="submit" aria-label="Ask iBar" disabled={loading || !query.trim()}>
            {loading ? <Loader2 size={17} className="ibar-spin" /> : <ArrowRight size={17} />}
          </button>
        </div>
      </form>

      <div className={`ibar-status ibar-status--${status.tone}`} aria-live="polite">
        {status.tone === 'loading' ? <Loader2 size={13} className="ibar-spin" /> : status.tone === 'warning' ? <TriangleAlert size={13} /> : <CheckCircle2 size={13} />}
        <span>{status.text}</span>
      </div>

      {focused && suggestions.length > 0 && (
        <div className="ibar-suggestions" onMouseDown={(event) => event.preventDefault()}>
          {suggestions.map((item) => (
            <button key={item} type="button" onClick={() => submit(item)}>
              {item}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
