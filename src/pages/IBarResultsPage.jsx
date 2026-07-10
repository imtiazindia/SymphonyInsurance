import { useEffect, useMemo, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Clock3, Database, Sparkles, TriangleAlert } from 'lucide-react';

const LAST_RESULT_KEY = 'symphony:ibar:lastResult';

function readResult(requestId) {
  try {
    const keyed = requestId ? window.sessionStorage.getItem(`symphony:ibar:result:${requestId}`) : null;
    return JSON.parse(keyed ?? window.sessionStorage.getItem(LAST_RESULT_KEY) ?? 'null');
  } catch {
    return null;
  }
}

function getTone(status) {
  if (/ceo|executive|overdue|high|decision|attention|risk/i.test(status ?? '')) return 'urgent';
  if (/ready|stable|complete|low/i.test(status ?? '')) return 'good';
  return 'neutral';
}

export function IBarResultsPage() {
  const [params] = useSearchParams();
  const headingRef = useRef(null);
  const requestId = params.get('requestId');
  const result = useMemo(() => readResult(requestId), [requestId]);

  useEffect(() => {
    headingRef.current?.focus();
  }, [requestId]);

  if (!result) {
    return (
      <section className="ibar-results-page page-transition">
        <div className="ibar-empty-state">
          <Sparkles size={28} />
          <h1 tabIndex="-1" ref={headingRef}>Ask iBar from the top bar</h1>
          <p>Results appear here after iBar completes a secure server-side analysis.</p>
          <Link className="primary-action" to="/">Return to Executive Overview</Link>
        </div>
      </section>
    );
  }

  return (
    <section className="ibar-results-page page-transition">
      <header className="ibar-results-hero">
        <div>
          <span>iBar secure analysis</span>
          <h1 tabIndex="-1" ref={headingRef}>{result.title}</h1>
          <p>{result.summary}</p>
        </div>
        <aside>
          <strong>{Math.round((result.confidence ?? 0) * 100)}%</strong>
          <span>Confidence</span>
        </aside>
      </header>

      <div className="ibar-result-status">
        <div>
          {result.status === 'error' ? <TriangleAlert size={16} /> : <CheckCircle2 size={16} />}
          <strong>{result.statusLine?.label ?? 'Answer ready'}</strong>
          <span>{result.statusLine?.steps?.join(' / ')}</span>
        </div>
        <span><Clock3 size={14} />{result.statusLine?.durationMs ?? 0}ms</span>
      </div>

      {result.insights?.length > 0 && (
        <div className="ibar-insight-strip">
          {result.insights.map((insight) => (
            <article key={insight}>
              <Sparkles size={15} />
              <p>{insight}</p>
            </article>
          ))}
        </div>
      )}

      <div className="ibar-results-grid">
        {result.results?.map((item) => (
          <article className={`ibar-result-card ibar-result-card--${getTone(item.status)}`} key={`${item.type}-${item.id}`}>
            <div className="ibar-result-card__header">
              <div>
                <span>{item.type}</span>
                <h2>{item.title}</h2>
                <p>{item.subtitle}</p>
              </div>
              <em>{item.status}</em>
            </div>
            {item.metrics?.length > 0 && (
              <dl>
                {item.metrics.map((metric) => (
                  <div key={`${item.id}-${metric.label}`}>
                    <dt>{metric.label}</dt>
                    <dd>{metric.value}</dd>
                  </div>
                ))}
              </dl>
            )}
            <p>{item.businessImpact}</p>
            <footer>
              <span>{item.recommendedAction}</span>
              {item.navigation?.route && (
                <Link to={item.navigation.route}>
                  {item.navigation.label}
                  <ArrowRight size={14} />
                </Link>
              )}
            </footer>
          </article>
        ))}
      </div>

      <div className="ibar-results-footer">
        <section>
          <h2>Next Actions</h2>
          <div className="ibar-action-list">
            {result.actions?.map((action) => (
              <Link key={`${action.label}-${action.route}`} to={action.route ?? '/ibar'}>
                {action.label}
                <ArrowRight size={14} />
              </Link>
            ))}
          </div>
        </section>
        <section>
          <h2>Suggested Queries</h2>
          <div className="ibar-query-list">
            {result.suggestedQueries?.map((query) => <span key={query}>{query}</span>)}
          </div>
        </section>
        <section>
          <h2>Data Scope</h2>
          <div className="ibar-scope">
            <Database size={15} />
            <span>{result.meta?.dataScope?.join(', ') || result.meta?.model || 'deterministic-fallback'}</span>
          </div>
        </section>
      </div>
    </section>
  );
}
