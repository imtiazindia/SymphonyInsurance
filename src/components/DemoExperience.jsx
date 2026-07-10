import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Circle,
  Eye,
  EyeOff,
  Highlighter,
  ListTree,
  MessageSquare,
  MousePointer2,
  Pause,
  Play,
  RotateCcw,
  Settings,
  Sparkles,
  Square,
  Timer,
  X,
} from 'lucide-react';

const DEMO_STATE_KEY = 'symphony:demo:state';
const DEMO_SETTINGS_KEY = 'symphony:demo:settings';
const DEMO_BOOKMARKS_KEY = 'symphony:demo:bookmarks';

const scenarioProfiles = {
  healthy: {
    label: 'Healthy Brokerage',
    summary: 'Balanced book, moderate ARI, controlled workloads, and strong renewal readiness.',
    kpis: ['Revenue stable', 'ARI moderate', 'Claims controlled', 'Workload balanced'],
  },
  growth: {
    label: 'High Growth',
    summary: 'Pipeline and new client activity are strong, with workload beginning to stretch.',
    kpis: ['Pipeline up', 'New clients up', 'Workload watch', 'Submission demand rising'],
  },
  hardening: {
    label: 'Market Hardening',
    summary: 'Carrier selectivity and external risk are increasing pressure on submissions and pricing.',
    kpis: ['ARI elevated', 'Premium pressure', 'More insurer questions', 'Document quality critical'],
  },
  claims: {
    label: 'Major Claims Event',
    summary: 'Large claims are affecting renewal strategy, pricing narrative, and client service priorities.',
    kpis: ['Claims exposure high', 'CEO review needed', 'Renewal impact', 'Client communication'],
  },
  compliance: {
    label: 'Compliance Concerns',
    summary: 'Compliance findings and document evidence are the main risk-reduction story.',
    kpis: ['Findings overdue', 'Evidence gaps', 'Risk advisory focus', 'Insurability impact'],
  },
  peak: {
    label: 'Renewal Peak Season',
    summary: 'Renewal volume, document readiness, and workload balancing become the central operating challenge.',
    kpis: ['Renewal queue high', 'Documents blocking', 'Team capacity watch', 'Revenue protection'],
  },
};

const journeyData = [
  {
    id: 'brokerage',
    title: 'Running an Aviation Insurance Brokerage',
    outcome: 'One connected operating model from executive priorities through iBar.',
    steps: [
      {
        title: 'Executive Overview',
        route: '/',
        focus: 'Revenue at Risk, ARI, Business Performance, CEO priorities',
        purpose: 'Show how leadership starts the day with business health, revenue, pipeline, external risk, and priorities.',
        value: ['Visibility', 'Immediate awareness of brokerage health and external aviation conditions.', 'The CEO can focus on decisions instead of searching across spreadsheets.'],
        notes: ['Every morning the CEO immediately sees the health of the brokerage.', 'The dashboard focuses on business decisions rather than operational noise.', 'ARI gives immediate awareness of external market conditions.'],
        talkingPoints: ['Business health first', 'Revenue protection', 'External market awareness'],
        callout: 'The executive view turns operational data into management priorities.',
        estimate: 45,
      },
      {
        title: 'Open Client Portfolio',
        route: '/clients',
        focus: 'Client distribution, relationship health, commercial value',
        purpose: 'Move from business health into the client portfolio that drives the brokerage.',
        value: ['Fragmented client knowledge', 'Connected client portfolio with relationship, revenue, risk and activity context.', 'The team can prioritize high-value or at-risk relationships quickly.'],
        notes: ['The portfolio is not just a list of clients.', 'It shows relationship strength, value, and risk signals in one place.'],
        talkingPoints: ['Relationship management', 'Commercial value', 'Portfolio segmentation'],
        callout: 'Client visibility is the foundation for every renewal, claim, and advisory workflow.',
        estimate: 40,
      },
      {
        title: 'Open Client 360',
        route: '/clients/CLI-003',
        focus: 'Single source of truth for relationship, policies, fleet, pilots, claims, compliance and documents',
        purpose: 'Demonstrate a complete client record for a complex aviation account.',
        value: ['Client information scattered across systems', 'Client 360 joins policies, aircraft, pilots, claims, compliance, documents and activity.', 'Account teams can prepare confidently for client conversations.'],
        notes: ['Use Global Jet Solutions as the complex high-value client example.', 'This is where the brokerage understands the full relationship.'],
        talkingPoints: ['Single source of truth', 'Complex aviation context', 'Meeting readiness'],
        callout: 'A single client record helps the team discuss risk, service, and commercial value together.',
        estimate: 60,
      },
      {
        title: 'Open Renewal Workspace',
        route: '/renewals',
        focus: 'Upcoming renewals, revenue protection, missing items',
        purpose: 'Show how Symphony protects revenue before renewal deadlines become emergencies.',
        value: ['Renewals tracked manually', 'Central renewal workspace prioritizes readiness, deadlines, missing items and revenue at risk.', 'Improves renewal success and management visibility.'],
        notes: ['Renewal work is where revenue protection becomes operational.', 'Highlight revenue at risk and readiness.'],
        talkingPoints: ['Revenue protection', 'Deadline control', 'Missing document visibility'],
        callout: 'Renewal risk is visible early enough for the team to act.',
        estimate: 45,
      },
      {
        title: 'Submission Workspace',
        route: '/submissions',
        focus: 'Submission quality, document gaps, underwriter confidence',
        purpose: 'Explain how stronger submissions improve insurer confidence.',
        value: ['Weak submissions create market friction', 'Submission workspace tracks completeness, document gaps and underwriter concerns.', 'Better submissions can improve market response.'],
        notes: ['Quality submissions make placement easier.', 'The system shows what must be fixed before going to market.'],
        talkingPoints: ['Submission completeness', 'Insurer confidence', 'Document dependency'],
        callout: 'A clear submission story helps carriers respond faster and with better terms.',
        estimate: 40,
      },
      {
        title: 'Market Placement',
        route: '/market-placement',
        focus: 'Quote comparison, insurer negotiation, recommendation',
        purpose: 'Show how placement teams compare carrier response and make decisions.',
        value: ['Quote comparison lives in disconnected files', 'Market Placement consolidates insurer questions, quotes, savings and recommendations.', 'Leadership can see why a recommendation is being made.'],
        notes: ['This is where market strategy becomes a decision.', 'Show quote comparison and recommendation logic.'],
        talkingPoints: ['Carrier negotiation', 'Recommendation transparency', 'Savings visibility'],
        callout: 'The platform makes placement recommendations explainable.',
        estimate: 50,
      },
      {
        title: 'Claims Operations',
        route: '/claims',
        focus: 'Financial exposure, executive review, next actions',
        purpose: 'Demonstrate protection of client interests and renewal impact from claims.',
        value: ['Claims are managed away from renewal strategy', 'Claims workspace connects exposure, severity, reserves and next actions.', 'The team can understand claim impact before renewals are priced.'],
        notes: ['Claims are not isolated; they affect client service and renewal pricing.', 'Focus on executive review and financial exposure.'],
        talkingPoints: ['Client advocacy', 'Financial exposure', 'Renewal impact'],
        callout: 'This claim may influence renewal pricing and should be part of the account strategy.',
        estimate: 45,
      },
      {
        title: 'Compliance & Risk',
        route: '/compliance',
        focus: 'Corrective actions, risk advisory, insurability',
        purpose: 'Show how compliance work reduces future claims and improves insurability.',
        value: ['Compliance is treated as an afterthought', 'Risk advisory workspace connects findings, severity, corrective actions and business impact.', 'Clients receive guidance that can reduce future loss exposure.'],
        notes: ['Compliance is not paperwork; it is risk improvement.', 'Tie findings back to insurability and claims prevention.'],
        talkingPoints: ['Risk reduction', 'Corrective action', 'Insurability'],
        callout: 'Risk advisory turns compliance findings into practical client action.',
        estimate: 40,
      },
      {
        title: 'Document Intelligence',
        route: '/documents',
        focus: 'Document dependencies across renewal, submission, compliance and claims',
        purpose: 'Show how documents support every workflow.',
        value: ['Documents block workflows without visibility', 'Document hub shows status, expiry, relationships, evidence and business impact.', 'Teams know which document gaps affect revenue or risk.'],
        notes: ['Documents are operational dependencies, not filing cabinet items.', 'Show links to renewals, submissions and compliance.'],
        talkingPoints: ['Evidence readiness', 'Workflow dependency', 'Document risk'],
        callout: 'This renewal cannot proceed cleanly while required evidence remains outstanding.',
        estimate: 40,
      },
      {
        title: 'Reports',
        route: '/reports',
        focus: 'Business performance, forecast, executive decisions',
        purpose: 'Demonstrate executive intelligence and strategic outlook.',
        value: ['Executives need more than activity counts', 'Reports synthesize performance, portfolio, market, team, forecast and trends.', 'Leadership can make better decisions with one business picture.'],
        notes: ['Reports show the business, not just the system.', 'Focus on Business Health Index and forecast.'],
        talkingPoints: ['Performance', 'Forecast', 'Decision support'],
        callout: 'Reports turn operational workflows into executive decisions.',
        estimate: 45,
      },
      {
        title: 'iBar',
        route: '/',
        focus: 'Natural language orchestration across the platform',
        purpose: 'End with AI-assisted productivity and navigation.',
        value: ['Users hunt for answers across modules', 'iBar lets users ask business questions and navigate directly into workflows.', 'The platform becomes faster to use without hiding the underlying workspaces.'],
        notes: ['iBar is not a chatbot bolted on top; it is an operating layer over the business model.', 'Use a suggested query to show orchestration.'],
        talkingPoints: ['Natural language', 'Business questions', 'Workflow orchestration'],
        callout: 'Ask iBar what needs attention today, then open the relevant workflow.',
        estimate: 50,
        query: 'Prepare executive briefing',
      },
    ],
  },
  {
    id: 'client',
    title: 'Managing a Client Relationship',
    outcome: 'Relationship teams prepare, serve, and protect a high-value aviation client.',
    steps: [
      { title: 'Portfolio Signal', route: '/clients', focus: 'High value and retention risk', purpose: 'Find the client relationship that needs attention.', value: ['Hidden relationship risk', 'Portfolio scoring and relationship signals', 'Earlier action on at-risk clients'], notes: ['Start from the portfolio view and identify a priority client.'], talkingPoints: ['Portfolio triage', 'Relationship risk'], callout: 'The relationship story starts before a meeting is scheduled.', estimate: 35 },
      { title: 'Client 360', route: '/clients/CLI-003', focus: 'Full client record', purpose: 'Open the single source of truth.', value: ['Scattered client context', 'Unified client, policies, fleet, claims and documents', 'Better client conversations'], notes: ['Show how the client record becomes the meeting room.'], talkingPoints: ['Single source of truth', 'Meeting readiness'], callout: 'Everything about the account is connected here.', estimate: 55 },
      { title: 'Relationship Dependencies', route: '/documents', focus: 'Documents and service dependencies', purpose: 'Show what must be resolved to serve the client.', value: ['Service blockers unclear', 'Document and task visibility', 'Faster follow-up'], notes: ['Tie documents to renewals and submissions.'], talkingPoints: ['Document dependency', 'Follow-up clarity'], callout: 'Document gaps are business blockers.', estimate: 40 },
      { title: 'Client Outcome', route: '/reports', focus: 'Client value in business context', purpose: 'Close with executive understanding of relationship value.', value: ['Client value not visible to leadership', 'Reports expose revenue, risk and retention signals', 'Better management decisions'], notes: ['Show how one client fits the portfolio.'], talkingPoints: ['Revenue value', 'Retention focus'], callout: 'The client story rolls up to management visibility.', estimate: 35 },
    ],
  },
  {
    id: 'renewal',
    title: 'Renewal Lifecycle',
    outcome: 'Revenue is protected from early warning through placement recommendation.',
    steps: [
      { title: 'Revenue Warning', route: '/', focus: 'Revenue at risk', purpose: 'Start with executive renewal exposure.', value: ['Late renewal awareness', 'Executive revenue signal', 'Faster prioritization'], notes: ['Show that renewal risk appears at the top.'], talkingPoints: ['Revenue protection'], callout: 'Renewal risk is visible before it becomes urgent.', estimate: 30 },
      { title: 'Renewal Queue', route: '/renewals', focus: 'Readiness and missing items', purpose: 'Prioritize renewal work.', value: ['Manual renewal tracking', 'Readiness scoring and missing items', 'Improved renewal execution'], notes: ['Highlight readiness and missing items.'], talkingPoints: ['Readiness', 'Missing items'], callout: 'This is the operating cockpit for renewal work.', estimate: 45 },
      { title: 'Submission Quality', route: '/submissions', focus: 'Submission completeness', purpose: 'Prepare the market story.', value: ['Weak market submissions', 'Completeness and concerns tracked', 'Better insurer confidence'], notes: ['Show how submission readiness reduces market friction.'], talkingPoints: ['Market readiness'], callout: 'Submission quality shapes carrier response.', estimate: 40 },
      { title: 'Placement Decision', route: '/market-placement', focus: 'Quotes and recommendation', purpose: 'Make the market decision explainable.', value: ['Opaque quote decisions', 'Carrier comparison and recommendation', 'Better client advice'], notes: ['Show recommendation and quote comparison.'], talkingPoints: ['Quote comparison', 'Recommendation'], callout: 'The decision is supported by business evidence.', estimate: 45 },
    ],
  },
  {
    id: 'claims',
    title: 'Claims Coordination',
    outcome: 'Claim exposure is managed as part of client service and renewal strategy.',
    steps: [
      { title: 'Claims Signal', route: '/', focus: 'CEO attention and claim exposure', purpose: 'Show claims where leadership sees priority work.', value: ['Claims disconnected from leadership', 'Executive attention flags', 'Faster escalation'], notes: ['Start with management visibility.'], talkingPoints: ['Escalation', 'Visibility'], callout: 'Claims that matter are surfaced early.', estimate: 30 },
      { title: 'Claims Workspace', route: '/claims', focus: 'Severity, reserve, next action', purpose: 'Review financial exposure and response.', value: ['Claim details scattered', 'Financial and action view', 'Better client advocacy'], notes: ['Highlight reserve and next action.'], talkingPoints: ['Financial exposure', 'Next action'], callout: 'Every claim has a business next step.', estimate: 45 },
      { title: 'Client Context', route: '/clients/CLI-003', focus: 'Claim impact on the relationship', purpose: 'Connect claim work back to the client.', value: ['Claims isolated from relationship management', 'Client 360 relationship context', 'Better renewal narrative'], notes: ['Claims affect relationship and pricing.'], talkingPoints: ['Client impact'], callout: 'The claim becomes part of the account strategy.', estimate: 40 },
      { title: 'Reports Impact', route: '/reports', focus: 'Claims trend and forecast', purpose: 'Show management impact.', value: ['No claims management rollup', 'Reports expose trend and risk', 'Better executive decisions'], notes: ['Show claims in business performance.'], talkingPoints: ['Trend', 'Forecast'], callout: 'Claims exposure is visible in the executive story.', estimate: 35 },
    ],
  },
  {
    id: 'compliance',
    title: 'Compliance & Risk Advisory',
    outcome: 'Risk advisory improves insurability and reduces future loss exposure.',
    steps: [
      { title: 'Compliance View', route: '/compliance', focus: 'Findings and corrective actions', purpose: 'Start from open compliance work.', value: ['Findings tracked manually', 'Structured corrective action workflow', 'Clear client advisory'], notes: ['Position compliance as business risk reduction.'], talkingPoints: ['Findings', 'Corrective action'], callout: 'Compliance findings become client improvement plans.', estimate: 45 },
      { title: 'Document Evidence', route: '/documents', focus: 'Evidence and expiry', purpose: 'Show documentation support for compliance.', value: ['Evidence hard to locate', 'Document relationships and expiry tracking', 'Faster audit readiness'], notes: ['Documents are proof of risk controls.'], talkingPoints: ['Evidence', 'Audit readiness'], callout: 'Evidence gaps can block compliance closure.', estimate: 35 },
      { title: 'Client Advisory', route: '/clients/CLI-003', focus: 'Client health and advisory context', purpose: 'Connect compliance to client service.', value: ['Compliance separated from account strategy', 'Client 360 integrates findings', 'Better client guidance'], notes: ['Show how risk advisory fits the relationship.'], talkingPoints: ['Client service', 'Insurability'], callout: 'Risk improvement supports future market outcomes.', estimate: 40 },
      { title: 'Business Rule Transparency', route: '/administration', focus: 'Business rules and health checks', purpose: 'Show that rules are configurable and explainable.', value: ['Hard-coded opaque logic', 'Readable business rules and system health', 'Enterprise trust'], notes: ['Administration proves configurability.'], talkingPoints: ['Configurable rules', 'Transparency'], callout: 'The platform can evolve with the brokerage.', estimate: 45 },
    ],
  },
  {
    id: 'executive',
    title: 'Executive Decision Making',
    outcome: 'Leadership moves from signal to decision with traceable business context.',
    steps: [
      { title: 'Executive Overview', route: '/', focus: 'CEO attention and business health', purpose: 'Start with leadership focus.', value: ['No single leadership view', 'Executive signals and priorities', 'Faster decisions'], notes: ['Focus on management decisions.'], talkingPoints: ['CEO focus', 'Business health'], callout: 'The dashboard filters noise into decisions.', estimate: 40 },
      { title: 'Reports', route: '/reports', focus: 'Business Health Index and forecast', purpose: 'Move into strategic business analysis.', value: ['Reporting is backward-looking', 'Forecast, trend and decision support', 'Better planning'], notes: ['Show Business Health Index.'], talkingPoints: ['Forecast', 'Business performance'], callout: 'Reports explain what changed and what is likely next.', estimate: 45 },
      { title: 'Administration', route: '/administration', focus: 'Rules, workflows, and health', purpose: 'Show how the operating model is governed.', value: ['Software changes needed for business evolution', 'Configurable rules and reference data', 'Scalable operations'], notes: ['Show configuration without exposing technical internals.'], talkingPoints: ['Scalability', 'Governance'], callout: 'Configuration makes the platform adaptable.', estimate: 40 },
      { title: 'Executive Brief', route: '/reports', focus: 'Executive brief and outcomes', purpose: 'Close with executive summary.', value: ['Decisions not packaged cleanly', 'Executive brief and business outcomes', 'Clear leadership narrative'], notes: ['End with outcomes, not screens.'], talkingPoints: ['Outcomes', 'Decision support'], callout: 'The executive story is concise and traceable.', estimate: 35 },
    ],
  },
  {
    id: 'ibar',
    title: 'AI-powered Productivity using iBar',
    outcome: 'Natural language accelerates navigation and business questions.',
    steps: [
      { title: 'Ask for Priorities', route: '/', focus: 'iBar command surface', purpose: 'Use natural language to find attention items.', value: ['Users search through modules', 'iBar answers business questions', 'Faster prioritization'], notes: ['Click a suggested query.'], talkingPoints: ['Natural language', 'Priorities'], callout: 'iBar turns questions into workflow actions.', estimate: 35, query: 'What needs my attention today?' },
      { title: 'Client Meeting Brief', route: '/clients', focus: 'Client summary query', purpose: 'Prepare for a client meeting quickly.', value: ['Manual meeting prep', 'Client brief generated from connected data', 'More confident client conversations'], notes: ['Use a client-specific query.'], talkingPoints: ['Meeting prep'], callout: 'The assistant uses the same business model as the app.', estimate: 40, query: 'Prepare client meeting brief for Global Jet Solutions' },
      { title: 'Renewal Documents', route: '/renewals', focus: 'Missing renewal documents', purpose: 'Find blockers through a question.', value: ['Document blockers hidden', 'iBar finds renewal gaps', 'Faster follow-up'], notes: ['Ask about missing renewal documents.'], talkingPoints: ['Document gaps'], callout: 'Questions become actionable workflow results.', estimate: 35, query: 'Show missing renewal documents' },
      { title: 'Executive Briefing', route: '/reports', focus: 'Business analytics query', purpose: 'Use iBar for executive analysis.', value: ['Analytics buried in dashboards', 'iBar routes to business analytics', 'Faster executive preparation'], notes: ['Ask for executive briefing.'], talkingPoints: ['Executive analysis'], callout: 'AI accelerates work without replacing the workspaces.', estimate: 40, query: 'Prepare executive briefing' },
    ],
  },
];

const demoQueries = [
  'Open Global Jet Solutions',
  'Show renewals due this month',
  'Prepare client meeting brief for Global Jet Solutions',
  'What needs my attention today?',
  'Show missing renewal documents',
  'Which claims affect renewals?',
  'Show overloaded account managers',
  'Prepare executive briefing',
];

const defaultSettings = {
  animationSpeed: 'Normal',
  highlightIntensity: 'Medium',
  autoAdvance: false,
  autoNavigate: true,
  showNotes: true,
  showBusinessValue: true,
  showTimer: true,
  showShortcuts: false,
};

function readStorage(key, fallback) {
  try {
    return JSON.parse(window.localStorage.getItem(key) ?? 'null') ?? fallback;
  } catch {
    return fallback;
  }
}

function writeStorage(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Demo settings are non-critical.
  }
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = String(seconds % 60).padStart(2, '0');
  return `${mins}:${secs}`;
}

function stepRoute(step) {
  return step.route || '/';
}

function DemoProgress({ current, total, elapsed, remaining, showTimer }) {
  return (
    <div className="demo-progress">
      <span>{current} of {total}</span>
      <i><b style={{ width: `${(current / total) * 100}%` }} /></i>
      {showTimer ? <em><Timer size={13} /> {formatTime(elapsed)} current / {Math.max(1, Math.ceil(remaining / 60))} min left</em> : null}
    </div>
  );
}

function BusinessValueCard({ value }) {
  if (!value) return null;
  return (
    <article className="demo-business-value">
      <div><span>Problem</span><p>{value[0]}</p></div>
      <div><span>Capability</span><p>{value[1]}</p></div>
      <div><span>Business Benefit</span><p>{value[2]}</p></div>
    </article>
  );
}

function PresenterNotes({ notes, talkingPoints }) {
  return (
    <section className="demo-notes">
      <strong>Presenter Notes</strong>
      <ul>{notes.map((note) => <li key={note}>{note}</li>)}</ul>
      <div>
        {talkingPoints.map((point) => <span key={point}>{point}</span>)}
      </div>
    </section>
  );
}

function ScenarioSwitcher({ scenario, onScenario }) {
  const profile = scenarioProfiles[scenario];
  return (
    <section className="demo-scenario-switcher">
      <div>
        <span>Scenario</span>
        <strong>{profile.label}</strong>
        <p>{profile.summary}</p>
      </div>
      <select value={scenario} onChange={(event) => onScenario(event.target.value)} aria-label="Demo scenario">
        {Object.entries(scenarioProfiles).map(([key, item]) => <option key={key} value={key}>{item.label}</option>)}
      </select>
      <div className="demo-scenario-kpis">
        {profile.kpis.map((item) => <em key={item}>{item}</em>)}
      </div>
    </section>
  );
}

function JourneyNavigator({ journeys, activeJourneyId, onJourney, currentStep }) {
  return (
    <section className="demo-journey-navigator">
      <span>Jump To</span>
      <select value={activeJourneyId} onChange={(event) => onJourney(event.target.value)} aria-label="Select demo journey">
        {journeys.map((journey) => <option key={journey.id} value={journey.id}>{journey.title}</option>)}
      </select>
      <div className="demo-journey-timeline">
        {journeys.find((journey) => journey.id === activeJourneyId).steps.map((step, index) => (
          <button key={step.title} type="button" className={index === currentStep ? 'is-active' : ''} onClick={() => onJourney(activeJourneyId, index)}>
            {index + 1}
          </button>
        ))}
      </div>
    </section>
  );
}

function StepPanel({ journey, step, stepIndex, totalSteps, elapsed, remaining, settings, collapsed, onToggle, onQuery }) {
  if (collapsed) {
    return (
      <button className="demo-step-panel-tab" type="button" onClick={onToggle}>
        <ListTree size={16} />
        Step {stepIndex + 1}
      </button>
    );
  }

  return (
    <aside className="demo-step-panel">
      <header>
        <div>
          <span>{journey.title}</span>
          <h2>{step.title}</h2>
        </div>
        <button type="button" onClick={onToggle} aria-label="Collapse step panel"><X size={16} /></button>
      </header>
      <DemoProgress current={stepIndex + 1} total={totalSteps} elapsed={elapsed} remaining={remaining} showTimer={settings.showTimer} />
      <section>
        <strong>Purpose</strong>
        <p>{step.purpose}</p>
      </section>
      <section>
        <strong>Focus</strong>
        <p>{step.focus}</p>
      </section>
      {settings.showBusinessValue ? <BusinessValueCard value={step.value} /> : null}
      {settings.showNotes ? <PresenterNotes notes={step.notes} talkingPoints={step.talkingPoints} /> : null}
      <section>
        <strong>Suggested iBar Queries</strong>
        <div className="demo-query-list">
          {(step.query ? [step.query, ...demoQueries] : demoQueries).slice(0, 5).map((query) => (
            <button key={query} type="button" onClick={() => onQuery(query)}>{query}</button>
          ))}
        </div>
      </section>
      {settings.showShortcuts ? (
        <section className="demo-shortcuts">
          <strong>Shortcuts</strong>
          <p>N next, B previous, P pause, A audience, Esc exit, T toolbar, V notes.</p>
        </section>
      ) : null}
    </aside>
  );
}

function DemoToolbar({
  active,
  paused,
  audienceView,
  collapsed,
  onStart,
  onPrev,
  onNext,
  onPause,
  onAudience,
  onReset,
  onExit,
  onCollapse,
  onBookmark,
  onSettings,
  onAnnotation,
}) {
  if (audienceView) return null;
  return (
    <div className={`demo-toolbar ${collapsed ? 'demo-toolbar--collapsed' : ''}`}>
      {collapsed ? (
        <button type="button" onClick={onCollapse} aria-label="Expand demo toolbar"><Sparkles size={17} /> Demo</button>
      ) : (
        <>
          <button type="button" onClick={onStart}><Play size={15} /> {active ? 'Restart Story' : 'Start Story'}</button>
          <button type="button" onClick={onPrev}><ChevronLeft size={15} /> Previous</button>
          <button type="button" onClick={onNext}>Next <ChevronRight size={15} /></button>
          <button type="button" onClick={onPause}>{paused ? <Play size={15} /> : <Pause size={15} />} {paused ? 'Resume' : 'Pause'}</button>
          <button type="button" onClick={onAudience}><Eye size={15} /> Audience View</button>
          <button type="button" onClick={onBookmark}><Bookmark size={15} /> Bookmark</button>
          <div className="demo-annotation-group">
            <button type="button" onClick={() => onAnnotation('pointer')} aria-label="Pointer annotation"><MousePointer2 size={15} /></button>
            <button type="button" onClick={() => onAnnotation('highlight')} aria-label="Highlight annotation"><Highlighter size={15} /></button>
            <button type="button" onClick={() => onAnnotation('circle')} aria-label="Circle annotation"><Circle size={15} /></button>
            <button type="button" onClick={() => onAnnotation('underline')} aria-label="Underline annotation"><Square size={15} /></button>
          </div>
          <button type="button" onClick={onReset}><RotateCcw size={15} /> Reset Demo</button>
          <button type="button" onClick={onSettings}><Settings size={15} /> Settings</button>
          <button type="button" onClick={onCollapse}><EyeOff size={15} /> Collapse</button>
          <button type="button" onClick={onExit}><X size={15} /> Exit Demo</button>
        </>
      )}
    </div>
  );
}

function SmartCallout({ step, audienceView }) {
  if (!step?.callout) return null;
  return (
    <aside className={`demo-smart-callout ${audienceView ? 'demo-smart-callout--audience' : ''}`}>
      <Sparkles size={16} />
      <p>{step.callout}</p>
    </aside>
  );
}

function HighlightOverlay({ step, settings, annotation }) {
  const intensity = settings.highlightIntensity.toLowerCase();
  return (
    <div className={`demo-highlight-overlay demo-highlight-overlay--${intensity}`} aria-hidden="true">
      <div className="demo-spotlight">
        <span>{step.focus}</span>
      </div>
      {annotation ? <div className={`demo-annotation demo-annotation--${annotation}`} /> : null}
    </div>
  );
}

function DemoSettings({ settings, onSettings, onClose }) {
  function update(key, value) {
    onSettings({ ...settings, [key]: value });
  }
  return (
    <aside className="demo-settings-panel">
      <header>
        <div>
          <span>Demo Settings</span>
          <h2>Presenter Preferences</h2>
        </div>
        <button type="button" onClick={onClose}><X size={16} /></button>
      </header>
      <label><span>Animation Speed</span><select value={settings.animationSpeed} onChange={(event) => update('animationSpeed', event.target.value)}><option>Slow</option><option>Normal</option><option>Fast</option></select></label>
      <label><span>Highlight Intensity</span><select value={settings.highlightIntensity} onChange={(event) => update('highlightIntensity', event.target.value)}><option>Low</option><option>Medium</option><option>High</option></select></label>
      {[
        ['autoAdvance', 'Auto Advance'],
        ['autoNavigate', 'Auto Navigation'],
        ['showNotes', 'Show Notes'],
        ['showBusinessValue', 'Show Business Value'],
        ['showTimer', 'Show Timer'],
        ['showShortcuts', 'Show Keyboard Shortcuts'],
      ].map(([key, label]) => (
        <label key={key} className="demo-toggle-row">
          <span>{label}</span>
          <input type="checkbox" checked={settings[key]} onChange={(event) => update(key, event.target.checked)} />
        </label>
      ))}
    </aside>
  );
}

function CompletionSummary({ onRestart, onExit }) {
  const outcomes = ['Improved Visibility', 'Reduced Operational Risk', 'Faster Renewals', 'Better Client Service', 'Improved Collaboration', 'Greater Decision Support', 'Scalable Operations', 'AI-assisted Productivity'];
  return (
    <section className="demo-completion">
      <span>Platform Summary</span>
      <h2>One Connected Platform for Modern Aviation Insurance Brokerages</h2>
      <p>Symphony connects executive visibility, client management, renewal operations, submissions, market placement, claims, compliance, documents, reports, administration and iBar into one operating model.</p>
      <div>{outcomes.map((item) => <strong key={item}>{item}</strong>)}</div>
      <footer>
        <button type="button" onClick={onRestart}>Restart Journey</button>
        <button type="button" onClick={onExit}>Exit Demo</button>
      </footer>
    </section>
  );
}

export function DemoExperience({ enabled, onEnabledChange }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [state, setState] = useState(() => readStorage(DEMO_STATE_KEY, {
    active: false,
    journeyId: 'brokerage',
    stepIndex: 0,
    paused: false,
    audienceView: false,
    toolbarCollapsed: false,
    panelCollapsed: false,
    scenario: 'healthy',
  }));
  const [settings, setSettings] = useState(() => ({ ...defaultSettings, ...readStorage(DEMO_SETTINGS_KEY, {}) }));
  const [bookmarks, setBookmarks] = useState(() => readStorage(DEMO_BOOKMARKS_KEY, []));
  const [elapsed, setElapsed] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [annotation, setAnnotation] = useState(null);
  const [complete, setComplete] = useState(false);

  const journey = useMemo(() => journeyData.find((item) => item.id === state.journeyId) ?? journeyData[0], [state.journeyId]);
  const step = journey.steps[state.stepIndex] ?? journey.steps[0];
  const totalSteps = journey.steps.length;
  const remaining = journey.steps.slice(state.stepIndex + 1).reduce((total, item) => total + item.estimate, 0);

  useEffect(() => {
    writeStorage(DEMO_SETTINGS_KEY, settings);
  }, [settings]);

  useEffect(() => {
    writeStorage(DEMO_BOOKMARKS_KEY, bookmarks);
  }, [bookmarks]);

  useEffect(() => {
    writeStorage(DEMO_STATE_KEY, state);
    document.body.classList.toggle('demo-mode-active', enabled);
    document.body.classList.toggle('demo-audience-view', enabled && state.audienceView);
    document.body.dataset.demoScenario = state.scenario;
    return () => {
      document.body.classList.remove('demo-mode-active', 'demo-audience-view');
      delete document.body.dataset.demoScenario;
    };
  }, [enabled, state]);

  useEffect(() => {
    if (!enabled || !state.active || state.paused) return undefined;
    const timer = window.setInterval(() => setElapsed((current) => current + 1), 1000);
    return () => window.clearInterval(timer);
  }, [enabled, state.active, state.paused, state.stepIndex]);

  useEffect(() => {
    setElapsed(0);
  }, [state.stepIndex, state.journeyId]);

  useEffect(() => {
    if (!enabled || !state.active || !settings.autoAdvance || state.paused) return undefined;
    const delay = Math.max(12, step.estimate) * 1000;
    const timer = window.setTimeout(() => goNext(), delay);
    return () => window.clearTimeout(timer);
  }, [enabled, settings.autoAdvance, state.active, state.paused, state.stepIndex, state.journeyId]);

  useEffect(() => {
    function onKeyDown(event) {
      if (!enabled) return;
      const editable = event.target instanceof HTMLElement && ['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName);
      if (editable) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        exitDemo();
      } else if (event.key.toLowerCase() === 'n' || event.key === 'ArrowRight') {
        event.preventDefault();
        goNext();
      } else if (event.key.toLowerCase() === 'b' || event.key === 'ArrowLeft') {
        event.preventDefault();
        goPrevious();
      } else if (event.key.toLowerCase() === 'p') {
        event.preventDefault();
        setState((current) => ({ ...current, paused: !current.paused }));
      } else if (event.key.toLowerCase() === 'a') {
        event.preventDefault();
        setState((current) => ({ ...current, audienceView: !current.audienceView }));
      } else if (event.key.toLowerCase() === 'v') {
        event.preventDefault();
        setSettings((current) => ({ ...current, showNotes: !current.showNotes }));
      } else if (event.key.toLowerCase() === 't') {
        event.preventDefault();
        setState((current) => ({ ...current, toolbarCollapsed: !current.toolbarCollapsed }));
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [enabled, state.stepIndex, state.journeyId, settings.showNotes]);

  useEffect(() => {
    if (!enabled || !state.active || !settings.autoNavigate) return;
    const target = stepRoute(step);
    if (target !== location.pathname) navigate(target);
  }, [enabled, state.active, settings.autoNavigate, step, location.pathname, navigate]);

  function patchState(next) {
    setState((current) => ({ ...current, ...next }));
  }

  function startStory() {
    setComplete(false);
    patchState({ active: true, stepIndex: 0, paused: false, audienceView: false });
    if (settings.autoNavigate) navigate(stepRoute(journey.steps[0]));
  }

  function goPrevious() {
    setComplete(false);
    patchState({ active: true, stepIndex: Math.max(0, state.stepIndex - 1), paused: false });
  }

  function goNext() {
    setComplete(false);
    if (state.stepIndex >= journey.steps.length - 1) {
      setComplete(true);
      patchState({ active: false, paused: false });
      return;
    }
    patchState({ active: true, stepIndex: state.stepIndex + 1, paused: false });
  }

  function resetDemo() {
    setComplete(false);
    setElapsed(0);
    setAnnotation(null);
    patchState({ active: false, stepIndex: 0, paused: false, audienceView: false, toolbarCollapsed: false, panelCollapsed: false });
  }

  function exitDemo() {
    setComplete(false);
    setAnnotation(null);
    onEnabledChange(false);
    patchState({ active: false, paused: false, audienceView: false });
  }

  function changeJourney(journeyId, nextStep = 0) {
    const nextJourney = journeyData.find((item) => item.id === journeyId) ?? journeyData[0];
    setComplete(false);
    patchState({ journeyId, stepIndex: nextStep, active: true, paused: false });
    if (settings.autoNavigate) navigate(stepRoute(nextJourney.steps[nextStep]));
  }

  function addBookmark() {
    const bookmark = {
      id: `bookmark-${Date.now()}`,
      label: step.title,
      journey: journey.title,
      route: stepRoute(step),
      stepIndex: state.stepIndex,
    };
    setBookmarks((current) => [bookmark, ...current].slice(0, 6));
  }

  function runQuery(query) {
    patchState({ active: false, paused: true });
    window.setTimeout(() => {
      window.dispatchEvent(new CustomEvent('symphony:ibar:submit', { detail: { query } }));
    }, 0);
  }

  function addAnnotation(type) {
    setAnnotation(type);
    window.setTimeout(() => setAnnotation(null), 4500);
  }

  if (!enabled) {
    return null;
  }

  if (state.audienceView) {
    return (
      <>
        <button className="demo-audience-return" type="button" onClick={() => patchState({ audienceView: false })}>
          Presenter View
        </button>
      </>
    );
  }

  return (
    <>
      <DemoToolbar
        active={state.active}
        paused={state.paused}
        audienceView={state.audienceView}
        collapsed={state.toolbarCollapsed}
        onStart={startStory}
        onPrev={goPrevious}
        onNext={goNext}
        onPause={() => patchState({ paused: !state.paused })}
        onAudience={() => patchState({ audienceView: true })}
        onReset={resetDemo}
        onExit={exitDemo}
        onCollapse={() => patchState({ toolbarCollapsed: !state.toolbarCollapsed })}
        onBookmark={addBookmark}
        onSettings={() => setSettingsOpen(true)}
        onAnnotation={addAnnotation}
      />

      {state.active ? <HighlightOverlay step={step} settings={settings} annotation={annotation} /> : null}
      {state.active ? <SmartCallout step={step} audienceView={state.audienceView} /> : null}

      <StepPanel
        journey={journey}
        step={step}
        stepIndex={state.stepIndex}
        totalSteps={totalSteps}
        elapsed={elapsed}
        remaining={remaining}
        settings={settings}
        collapsed={state.panelCollapsed}
        onToggle={() => patchState({ panelCollapsed: !state.panelCollapsed })}
        onQuery={runQuery}
      />

      <div className="demo-control-stack">
        <JourneyNavigator journeys={journeyData} activeJourneyId={state.journeyId} onJourney={changeJourney} currentStep={state.stepIndex} />
        <ScenarioSwitcher scenario={state.scenario} onScenario={(scenario) => patchState({ scenario })} />
        <section className="demo-bookmarks">
          <header><span>Bookmarks</span><button type="button" onClick={addBookmark}>Return here later</button></header>
          {bookmarks.length ? bookmarks.map((bookmark) => (
            <button key={bookmark.id} type="button" onClick={() => { navigate(bookmark.route); changeJourney(state.journeyId, bookmark.stepIndex); }}>
              <Bookmark size={13} /> {bookmark.label}
            </button>
          )) : <p>Executive KPI, Major Claim, High Value Client, Renewal Example, and iBar Demo bookmarks appear here.</p>}
        </section>
        <section className="demo-question-mode">
          <MessageSquare size={15} />
          <div>
            <strong>Question Mode</strong>
            <p>Pause the story, answer naturally, then resume from this step.</p>
          </div>
          <button type="button" onClick={() => patchState({ paused: true })}>Pause Story</button>
        </section>
      </div>

      {settingsOpen ? <DemoSettings settings={settings} onSettings={setSettings} onClose={() => setSettingsOpen(false)} /> : null}
      {complete ? <CompletionSummary onRestart={startStory} onExit={exitDemo} /> : null}
    </>
  );
}
