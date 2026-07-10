import { useEffect, useMemo, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, BriefcaseBusiness, CheckCircle2, Clock3, Database, FileText, GitBranch, Sparkles, TriangleAlert } from 'lucide-react';

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

function fallbackActionCards(result) {
  return (result.results ?? []).map((item) => {
    const financialMetric = item.metrics?.find((metric) => /revenue|incurred|reserve|quote|premium|savings/i.test(metric.label));
    return {
      id: `${item.type}-${item.id}`,
      type: item.type,
      title: item.title,
      subtitle: item.subtitle,
      issue: item.status,
      businessImpact: item.businessImpact,
      financialImpact: financialMetric?.value ?? 'Not quantified',
      owner: item.metrics?.find((metric) => /assigned|owner/i.test(metric.label))?.value ?? 'Business Owner',
      priority: getTone(item.status) === 'urgent' ? 'High' : 'Watch',
      confidence: result.confidence ?? 0.72,
      reason: item.businessImpact,
      primaryAction: item.navigation ? { label: item.navigation.label, route: item.navigation.route } : null,
      secondaryAction: null,
      metrics: item.metrics ?? [],
    };
  });
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

  const actionCards = result.actionCards?.length ? result.actionCards : fallbackActionCards(result);
  const businessAnswer = result.businessAnswer ?? {
    headline: result.title,
    answer: result.summary,
    why: result.insights?.[0] ?? 'Matched available Symphony data.',
    businessImpact: actionCards[0]?.businessImpact ?? result.summary,
    financialImpact: actionCards[0]?.financialImpact ?? 'See supporting records.',
    primaryAction: result.actions?.[0]?.label ?? 'Review supporting records',
  };
  const recommendedActions = result.recommendedActions?.length
    ? result.recommendedActions
    : result.actions?.map((action) => ({ ...action, why: 'Recommended next step.', priority: action.direct ? 'Immediate' : 'Next' })) ?? [];
  const relatedQuestions = result.relatedQuestions?.length ? result.relatedQuestions : result.suggestedQueries ?? [];
  const relatedWorkspaces = result.relatedWorkspaces?.length
    ? result.relatedWorkspaces
    : result.actions?.filter((action) => action.route).map((action) => ({ label: action.label, route: action.route, reason: 'Recommended next workspace.' })) ?? [];

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

      <section className="ibar-business-answer">
        <div>
          <span>Business Answer</span>
          <h2>{businessAnswer.headline}</h2>
          <p>{businessAnswer.answer}</p>
        </div>
        <dl>
          <div><dt>Why</dt><dd>{businessAnswer.why}</dd></div>
          <div><dt>Business Impact</dt><dd>{businessAnswer.businessImpact}</dd></div>
          <div><dt>Financial Impact</dt><dd>{businessAnswer.financialImpact}</dd></div>
          <div><dt>Primary Action</dt><dd>{businessAnswer.primaryAction}</dd></div>
        </dl>
      </section>

      {result.briefing ? (
        <section className="ibar-briefing-panel">
          <header>
            <FileText size={18} />
            <div>
              <span>{result.briefing.type}</span>
              <h2>{result.briefing.title}</h2>
            </div>
          </header>
          <p>{result.briefing.overview}</p>
          <div>
            <article><strong>Key Facts</strong>{result.briefing.keyFacts?.map((item) => <span key={item}>{item}</span>)}</article>
            <article><strong>Current Risks</strong>{result.briefing.currentRisks?.map((item) => <span key={item}>{item}</span>)}</article>
            <article><strong>Next Decisions</strong>{result.briefing.nextDecisions?.map((item) => <span key={item}>{item}</span>)}</article>
          </div>
        </section>
      ) : null}

      {result.smartPriorities ? (
        <section className="ibar-priority-panel">
          <header>
            <BriefcaseBusiness size={18} />
            <div>
              <span>Smart Priorities</span>
              <h2>{result.smartPriorities.title}</h2>
              <p>{result.smartPriorities.summary}</p>
            </div>
          </header>
          <div>
            {result.smartPriorities.categories?.map((category) => (
              <article key={category.label}>
                <strong>{category.count}</strong>
                <span>{category.label}</span>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {result.workflowPlan ? (
        <section className="ibar-workflow-panel">
          <header>
            <GitBranch size={18} />
            <div>
              <span>Workflow Orchestration</span>
              <h2>{result.workflowPlan.title}</h2>
              <p>{result.workflowPlan.summary}</p>
            </div>
          </header>
          <div>
            {result.workflowPlan.steps?.map((step, index) => (
              <Link key={`${step.label}-${index}`} to={step.route ?? '/ibar'}>
                <em>{index + 1}</em>
                <span>{step.label}</span>
                <small>{step.status}</small>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <header className="ibar-section-heading">
        <span>Action Cards</span>
        <h2>Recommended operating actions</h2>
      </header>

      <div className="ibar-results-grid">
        {actionCards.map((item) => (
          <article className={`ibar-result-card ibar-result-card--${getTone(`${item.priority} ${item.issue}`)}`} key={item.id}>
            <div className="ibar-result-card__header">
              <div>
                <span>{item.type}</span>
                <h2>{item.title}</h2>
                <p>{item.subtitle}</p>
              </div>
              <em>{item.priority}</em>
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
            <div className="ibar-action-card-detail">
              <span><strong>Issue</strong>{item.issue}</span>
              <span><strong>Owner</strong>{item.owner}</span>
              <span><strong>Financial Impact</strong>{item.financialImpact}</span>
              <span><strong>Confidence</strong>{Math.round((item.confidence ?? result.confidence ?? 0) * 100)}%</span>
            </div>
            <p>{item.businessImpact}</p>
            <footer>
              <span>{item.reason}</span>
              {item.primaryAction?.route && (
                <Link to={item.primaryAction.route}>
                  {item.primaryAction.label}
                  <ArrowRight size={14} />
                </Link>
              )}
            </footer>
          </article>
        ))}
      </div>

      {result.businessImpact ? (
        <section className="ibar-impact-panel">
          <h2>Business Impact</h2>
          <div>
            <article><span>Impact</span><strong>{result.businessImpact.summary}</strong></article>
            <article><span>Financial</span><strong>{result.businessImpact.financialImpact}</strong></article>
            <article><span>Owner</span><strong>{result.businessImpact.owner}</strong></article>
            <article><span>Priority</span><strong>{result.businessImpact.priority}</strong></article>
          </div>
        </section>
      ) : null}

      <div className="ibar-results-footer">
        <section>
          <h2>Recommended Actions</h2>
          <div className="ibar-action-list">
            {recommendedActions.map((action) => (
              <Link key={`${action.label}-${action.route}`} to={action.route ?? '/ibar'}>
                <span>{action.label}<small>{action.why}</small></span>
                <ArrowRight size={14} />
              </Link>
            ))}
          </div>
        </section>
        <section>
          <h2>Related Workspaces</h2>
          <div className="ibar-workspace-list">
            {relatedWorkspaces.map((workspace) => (
              <Link key={`${workspace.label}-${workspace.route}`} to={workspace.route ?? '/ibar'}>
                <strong>{workspace.label}</strong>
                <span>{workspace.reason}</span>
              </Link>
            ))}
          </div>
        </section>
        <section>
          <h2>Suggested Questions</h2>
          <div className="ibar-query-list">
            {relatedQuestions.map((query) => <span key={query}>{query}</span>)}
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

      {result.reasoningSummary ? (
        <section className="ibar-reasoning-note">
          <strong>Grounding</strong>
          <p>{result.reasoningSummary.reason}</p>
          <span>Data sources used: {result.reasoningSummary.dataSourcesUsed?.join(', ') || result.meta?.dataScope?.join(', ') || 'Symphony demo data'}</span>
        </section>
      ) : null}
    </section>
  );
}
