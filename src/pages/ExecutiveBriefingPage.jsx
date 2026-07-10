import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Clock3, FileText, Loader2, Printer, RefreshCw, Sparkles, X } from 'lucide-react';
import {
  clearBriefingState,
  readBriefingData,
  readBriefingState,
  saveBriefingData,
  saveBriefingState,
} from '../utils/briefingSession.js';

function pct(reviewedCount, total) {
  return total ? Math.round((reviewedCount / total) * 100) : 0;
}

function nowLabel() {
  return new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function useBriefing() {
  const [briefingRecord, setBriefingRecord] = useState(() => readBriefingData());
  const [reviewState, setReviewState] = useState(() => readBriefingState());

  function updateState(next) {
    setReviewState((current) => {
      const resolved = typeof next === 'function' ? next(current) : { ...current, ...next };
      saveBriefingState(resolved);
      return resolved;
    });
  }

  function updateBriefing(payload) {
    saveBriefingData(payload);
    setBriefingRecord(readBriefingData());
  }

  return { briefingRecord, reviewState, updateState, updateBriefing };
}

function BriefingSkeleton() {
  return (
    <section className="briefing-page page-transition">
      <div className="briefing-empty">
        <Loader2 className="ibar-spin" size={24} />
        <h1>Preparing executive briefing</h1>
        <p>Building the briefing from the current demonstration dataset.</p>
      </div>
    </section>
  );
}

export function ExecutiveBriefingPage() {
  const navigate = useNavigate();
  const headingRef = useRef(null);
  const { briefingRecord, reviewState, updateState, updateBriefing } = useBriefing();
  const [loading, setLoading] = useState(false);
  const [refreshNote, setRefreshNote] = useState('');
  const [attemptedLoad, setAttemptedLoad] = useState(false);
  const briefing = briefingRecord?.briefing;
  const payload = briefingRecord?.payload;
  const reviewedCount = Object.keys(reviewState.reviewed ?? {}).length;
  const total = briefing?.priorities?.length ?? 0;
  const nextPriority = briefing?.priorities?.find((priority) => !reviewState.reviewed?.[priority.recordId]);
  const complete = total > 0 && reviewedCount >= total;

  useEffect(() => {
    headingRef.current?.focus();
    if (reviewState.scrollTop) window.setTimeout(() => window.scrollTo({ top: reviewState.scrollTop, behavior: 'auto' }), 0);
  }, []);

  useEffect(() => {
    if (briefing) return;
    refreshBriefing(false);
  }, [briefing]);

  async function refreshBriefing(confirmReviewed = true) {
    if (confirmReviewed && reviewedCount > 0 && !window.confirm('Refresh the briefing from the current demonstration dataset? Reviewed state will be retained for this session.')) {
      return;
    }
    setLoading(true);
    setAttemptedLoad(true);
    setRefreshNote('');
    try {
      const response = await fetch('/api/ibar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: 'Prepare me for my day',
          currentRoute: '/briefing/today',
          selectedRole: 'CEO',
          selectedUserId: 'USR-001',
          currentDate: '2026-07-10',
          conversationContext: [],
        }),
      });
      const nextPayload = await response.json();
      if (!response.ok || !nextPayload.executiveDailyBriefing) throw new Error('Briefing refresh failed');
      updateBriefing(nextPayload);
      setRefreshNote('Updated from the current demonstration dataset.');
    } catch {
      setRefreshNote('Unable to refresh briefing locally. Use Netlify dev or the deployed site for server refresh.');
    } finally {
      setLoading(false);
    }
  }

  function startReview(priority = briefing?.priorities?.[0], index = 0) {
    if (!priority) return;
    updateState({ ...reviewState, active: true, currentIndex: index, scrollTop: window.scrollY });
    navigate(priority.primaryAction.route);
  }

  function markReviewed(priority) {
    updateState((current) => ({
      ...current,
      reviewed: {
        ...(current.reviewed ?? {}),
        [priority.recordId]: new Date().toISOString(),
      },
    }));
  }

  function exitBriefing() {
    clearBriefingState();
    navigate('/');
  }

  if (!briefing && loading) return <BriefingSkeleton />;

  if (!briefing) {
    return (
      <section className="briefing-page page-transition">
        <div className="briefing-empty">
          <Sparkles size={24} />
          <h1>Prepare your executive briefing from iBar</h1>
          <p>{attemptedLoad && refreshNote ? refreshNote : 'Press Ctrl/Cmd + K and ask: Prepare me for my day.'}</p>
          <Link className="primary-action" to="/">Return to Executive Overview</Link>
        </div>
      </section>
    );
  }

  return (
    <section className="briefing-page page-transition">
      <header className="briefing-hero">
        <div>
          <span>Executive Briefing</span>
          <h1 tabIndex="-1" ref={headingRef}>{briefing.title}</h1>
          <p>{briefing.openingSentence}</p>
        </div>
        <aside>
          <strong>{briefing.businessHealth.label}</strong>
          <span>{briefing.businessHealth.score} Business Health</span>
        </aside>
      </header>

      <section className="briefing-toolbar" aria-label="Briefing actions">
        <div>
          <span><Clock3 size={14} /> {briefing.currentDate}</span>
          <span>Role: {briefing.selectedRole}</span>
          <span>Last refreshed: {briefingRecord.savedAt ? new Date(briefingRecord.savedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : nowLabel()}</span>
        </div>
        <nav>
          <button type="button" onClick={() => refreshBriefing(true)} disabled={loading}>{loading ? <Loader2 className="ibar-spin" size={15} /> : <RefreshCw size={15} />} Refresh Briefing</button>
          <button
            type="button"
            onClick={() => {
              const priority = nextPriority ?? briefing.priorities[0];
              const index = Math.max(0, briefing.priorities.findIndex((item) => item.recordId === priority?.recordId));
              startReview(priority, index);
            }}
          >
            <Sparkles size={15} /> Start Review
          </button>
          <button type="button" onClick={() => window.print()}><Printer size={15} /> Print</button>
          <Link to="/">Return to Executive Overview</Link>
          <button type="button" onClick={exitBriefing}><X size={15} /> Exit Briefing</button>
        </nav>
      </section>

      {refreshNote ? <p className="briefing-refresh-note">{refreshNote}</p> : null}

      <section className="briefing-health-grid">
        <article><span>Business Health</span><strong>{briefing.businessHealth.label}</strong><p>{briefing.businessHealth.summary}</p></article>
        <article><span>Revenue At Risk</span><strong>{briefing.portfolio.revenueAtRisk}</strong><p>Validated from renewal records.</p></article>
        <article><span>Active Clients</span><strong>{briefing.portfolio.activeClients}</strong><p>Current demonstration portfolio.</p></article>
        <article><span>Retention</span><strong>{briefing.portfolio.retentionRate}</strong><p>Portfolio retention indicator.</p></article>
        <article><span>ARI</span><strong>{briefing.portfolio.ari.score}</strong><p>{briefing.portfolio.ari.category}, {briefing.portfolio.ari.change >= 0 ? '+' : ''}{briefing.portfolio.ari.change} change.</p></article>
        <article><span>Executive Priorities</span><strong>{briefing.priorityCount}</strong><p>Ranked for owner review.</p></article>
      </section>

      <section className="briefing-progress-card">
        <div>
          <span>Briefing Progress</span>
          <strong>{reviewedCount} of {total} priorities reviewed</strong>
          <i aria-hidden="true"><b style={{ width: `${pct(reviewedCount, total)}%` }} /></i>
        </div>
        {complete ? (
          <aside>
            <CheckCircle2 size={18} />
            <div>
              <strong>Executive Review Complete</strong>
              <p>{total} executive priorities have been reviewed. {briefing.standardWork.openTasks} standard operational tasks remain assigned to the team.</p>
            </div>
          </aside>
        ) : (
          <aside>
            <FileText size={18} />
            <div>
              <strong>Next Recommended Review</strong>
              <p>{nextPriority ? `${nextPriority.clientName} - ${nextPriority.title}` : 'All executive priorities have been reviewed.'}</p>
            </div>
          </aside>
        )}
      </section>

      <section className="briefing-priorities">
        <header>
          <span>Executive Priorities</span>
          <h2>What requires attention today</h2>
        </header>
        <div>
          {briefing.priorities.map((priority, index) => {
            const reviewedAt = reviewState.reviewed?.[priority.recordId];
            return (
              <article className={reviewedAt ? 'briefing-priority-card briefing-priority-card--reviewed' : 'briefing-priority-card'} key={priority.recordId}>
                <div className="briefing-priority-card__rank">Priority {priority.rank}</div>
                <header>
                  <div>
                    <span>{priority.type}</span>
                    <h3>{priority.clientName}</h3>
                    <p>{priority.title}</p>
                  </div>
                  {reviewedAt ? <em><CheckCircle2 size={14} /> Reviewed</em> : null}
                </header>
                <p>{priority.summary}</p>
                <dl>
                  <div><dt>Business Impact</dt><dd>{priority.businessImpact}</dd></div>
                  <div><dt>Financial Impact</dt><dd>{priority.financialImpact}</dd></div>
                  <div><dt>Owner</dt><dd>{priority.owner}</dd></div>
                  <div><dt>Due Date</dt><dd>{priority.dueDate}</dd></div>
                </dl>
                <section>
                  <strong>Recommended Action</strong>
                  <p>{priority.recommendedAction}</p>
                </section>
                <footer>
                  <button type="button" onClick={() => startReview(priority, index)}>
                    {priority.primaryAction.label}
                    <ArrowRight size={15} />
                  </button>
                  {priority.secondaryActions?.map((action) => <Link key={action.route} to={action.route}>{action.label}</Link>)}
                  <button type="button" onClick={() => markReviewed(priority)}>{reviewedAt ? 'Reviewed' : 'Mark Reviewed'}</button>
                </footer>
              </article>
            );
          })}
        </div>
      </section>

      <section className="briefing-support-grid">
        <article>
          <h2>Standard Work</h2>
          <dl>
            <div><dt>Open Tasks</dt><dd>{briefing.standardWork.openTasks}</dd></div>
            <div><dt>Due Today</dt><dd>{briefing.standardWork.dueToday}</dd></div>
            <div><dt>Overdue</dt><dd>{briefing.standardWork.overdue}</dd></div>
          </dl>
        </article>
        <article>
          <h2>Recommended Sequence</h2>
          <ol>{briefing.recommendedSequence.map((item) => <li key={item}>{item}</li>)}</ol>
        </article>
        <article>
          <h2>Suggested Follow-up Queries</h2>
          <div>{briefing.suggestedQueries.map((query) => <span key={query}>{query}</span>)}</div>
        </article>
      </section>

      {payload?.meta ? (
        <section className="briefing-source-note">
          <strong>Grounded Data</strong>
          <p>Built from {payload.meta.dataScope?.join(', ')}. No client, claim, renewal, or metric is generated outside the shared dataset.</p>
        </section>
      ) : null}
    </section>
  );
}
