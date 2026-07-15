import { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Bell, CheckCircle2, Menu, Sparkles, X } from 'lucide-react';
import { DemoExperience } from '../components/DemoExperience.jsx';
import { Drawer } from '../components/Drawer.jsx';
import { IBar } from '../components/IBar.jsx';
import { Modal } from '../components/Modal.jsx';
import {
  getRoleNotifications,
  RoleAwareNavigation,
  RoleAwareNotifications,
  RoleScopeNotice,
  RoleSwitcher,
} from '../components/RoleExperience.jsx';
import { SymphonyBrand } from '../components/SymphonyBrand.jsx';
import { UserAvatar } from '../components/UserAvatar.jsx';
import { getRoleNavigation } from '../config/roleExperiences.js';
import { useRoleExperience } from '../context/RoleContext.jsx';
import { simulationData } from '../data/demoData.js';
import {
  BRIEFING_EVENT,
  clearBriefingState,
  readBriefingData,
  readBriefingState,
  saveBriefingState,
} from '../utils/briefingSession.js';
import {
  aviationRiskIndex,
  formatAriChange,
  formatAriLastUpdated,
  getAriTone,
  getAriTopFactors,
  getAriTrendIcon,
  getAriTrendLabel,
} from '../utils/aviationRiskIndex.js';

function AviationRiskIndexCard({ onViewAnalysis }) {
  const [view, setView] = useState('global');
  const activeView = aviationRiskIndex[view];
  const topFactors = getAriTopFactors(activeView, 4);
  const tone = getAriTone(activeView.category);

  return (
    <aside className={`market-card ari-card ari-card--${tone}`} aria-label="Aviation Risk Index">
      <div className="ari-card__header">
        <h2>Aviation Risk Index</h2>
        <span>AI</span>
      </div>
      <div className="market-card__rule" />
      <div className="ari-toggle" aria-label="Aviation Risk Index view">
        {['global', 'domestic'].map((key) => (
          <button
            key={key}
            type="button"
            className={view === key ? 'ari-toggle__button ari-toggle__button--active' : 'ari-toggle__button'}
            onClick={() => setView(key)}
          >
            {aviationRiskIndex[key].label}
          </button>
        ))}
      </div>
      <div className="market-card__metric ari-card__metric">
        <strong>{activeView.score}</strong>
        <small>/ 100</small>
        <em>{activeView.category}</em>
      </div>
      <p className="ari-card__movement">{formatAriChange(activeView.change, activeView.changeWindow)}</p>
      <p className="ari-card__summary">{activeView.primaryDriverSummary}</p>
      <div className="ari-driver-list" aria-label={`${activeView.label} ARI primary drivers`}>
        {topFactors.map((factor) => (
          <div className="ari-driver" key={factor.id}>
            <span>{factor.label}</span>
            <strong>{factor.score}</strong>
            <em aria-label={getAriTrendLabel(factor.trend)}>{getAriTrendIcon(factor.trend)}{factor.change ? ` ${factor.change}` : ''}</em>
          </div>
        ))}
      </div>
      <div className="market-card__status ari-card__status">
        <span />
        ARI
        <small>{formatAriLastUpdated()}</small>
      </div>
      <button className="ari-card__action" type="button" onClick={() => onViewAnalysis(view)}>
        View Analysis
      </button>
    </aside>
  );
}

function AviationRiskAnalysis({ viewKey }) {
  const activeView = aviationRiskIndex[viewKey] ?? aviationRiskIndex.domestic;
  const tone = getAriTone(activeView.category);

  return (
    <div className="ari-analysis">
      <section className={`ari-analysis__overall ari-analysis__overall--${tone}`}>
        <div>
          <span>Overall Risk</span>
          <strong>{activeView.score} / 100</strong>
          <em>{activeView.category}</em>
        </div>
        <dl>
          <div><dt>Trend</dt><dd>{formatAriChange(activeView.change, activeView.changeWindow)}</dd></div>
          <div><dt>Confidence</dt><dd>{aviationRiskIndex.confidence}</dd></div>
          <div><dt>Last updated</dt><dd>{formatAriLastUpdated()}</dd></div>
        </dl>
      </section>

      <section className="ari-analysis__section">
        <h3>Executive Summary</h3>
        <p>{activeView.summary}</p>
      </section>

      <section className="ari-analysis__section">
        <h3>Key Contributors</h3>
        <div className="ari-contributor-list">
          {activeView.factors.map((factor) => (
            <article key={factor.id}>
              <div>
                <strong>{factor.label}</strong>
                <span>Score: {factor.score}</span>
                <em>{getAriTrendLabel(factor.trend)} {getAriTrendIcon(factor.trend)}{factor.change ? ` ${factor.change}` : ''}</em>
              </div>
              <p>{factor.reason}</p>
              <small>Expected duration: {factor.expectedDuration}</small>
            </article>
          ))}
        </div>
      </section>

      <section className="ari-analysis__section">
        <h3>Likely Business Impact</h3>
        <ul>
          {activeView.businessImpact.map((item) => <li key={item}>{item}</li>)}
        </ul>
      </section>

      <section className="ari-analysis__section">
        <h3>Affected Client Segments</h3>
        <div className="ari-chip-list">
          {activeView.affectedClientTypes.map((item) => <span key={item}>{item}</span>)}
        </div>
      </section>

      <section className="ari-analysis__section">
        <h3>Recommended Actions</h3>
        <ul>
          {activeView.recommendedActions.map((item) => <li key={item}>{item}</li>)}
        </ul>
      </section>

      <section className="ari-analysis__note">
        <p>{aviationRiskIndex.methodologyNote}</p>
      </section>
    </div>
  );
}

function ExternalRiskImpactCard({ onViewAnalysis }) {
  const [view, setView] = useState('domestic');
  const activeView = aviationRiskIndex[view];
  const tone = getAriTone(activeView.category);
  const topFactors = getAriTopFactors(activeView, 3);
  const executiveSignals = activeView.workspaceSignals.executive;

  return (
    <aside className={`market-card ari-card external-risk-card ari-card--${tone}`} aria-label="External Risk Impact">
      <div className="ari-card__header">
        <h2>External Risk Impact</h2>
        <span>AI</span>
      </div>
      <div className="market-card__rule" />
      <div className="ari-toggle" aria-label="External Risk Impact view">
        {['global', 'domestic'].map((key) => (
          <button
            key={key}
            type="button"
            className={view === key ? 'ari-toggle__button ari-toggle__button--active' : 'ari-toggle__button'}
            onClick={() => setView(key)}
          >
            {aviationRiskIndex[key].label}
          </button>
        ))}
      </div>
      <div className="external-risk-card__metric">
        <strong>{activeView.category}</strong>
        <span>{activeView.score} / 100 ARI</span>
      </div>
      <p className="ari-card__summary">{activeView.workspaceSignals.renewal}</p>
      <div className="external-risk-card__drivers" aria-label={`${activeView.label} external risk drivers`}>
        {topFactors.map((factor) => (
          <span key={factor.id}>{factor.label}</span>
        ))}
      </div>
      <div className="external-risk-card__text">
        <strong>Recommended Actions</strong>
        <ul>
          {activeView.recommendedActions.slice(0, 3).map((item) => <li key={item}>{item}</li>)}
        </ul>
      </div>
      <dl className="external-risk-card__impact">
        <div>
          <dt>Affected Clients</dt>
          <dd>{executiveSignals.affectedClients}</dd>
        </div>
        <div>
          <dt>Renewals</dt>
          <dd>{executiveSignals.renewalsForReview}</dd>
        </div>
      </dl>
      <div className="market-card__status ari-card__status">
        <span />
        External impact
        <small>{formatAriLastUpdated()}</small>
      </div>
      <button className="ari-card__action" type="button" onClick={() => onViewAnalysis(view)}>
        View Impact
      </button>
    </aside>
  );
}

function MarketConditions() {
  return (
    <aside className="sidebar-market-card" aria-label="Market conditions">
      <h2>Market Conditions</h2>
      <div className="sidebar-market-card__rule" />
      <p>Aviation Market Index</p>
      <div className="sidebar-market-card__metric">
        <strong>97</strong>
        <span>-3 pts</span>
        <small>vs last 30 days</small>
      </div>
      <svg className="sidebar-market-card__chart" viewBox="0 0 190 70" role="img" aria-label="Stable upward market trend">
        <path d="M3 56 C18 52 25 60 38 47 S60 42 75 32 S97 35 109 24 S130 29 142 17 S166 21 187 10" />
      </svg>
      <div className="sidebar-market-card__status">
        <span />
        Stable
      </div>
      <time>As of Jul 9, 2026</time>
    </aside>
  );
}

function TopBar({ onMenu, onNotify, demoMode, onDemoMode, notificationCount }) {
  const { activeUserId, roleConfiguration } = useRoleExperience();
  const user = simulationData.teamMembers.find((member) => member.id === activeUserId) ?? simulationData.teamMembers[0];
  return (
    <header className="top-bar">
      <button className="icon-button menu-button" type="button" onClick={onMenu} aria-label="Open menu">
        <Menu size={21} />
      </button>

      <IBar />

      <div className="top-actions">
        <RoleSwitcher />
        <button className={demoMode ? 'demo-mode-toggle demo-mode-toggle--active' : 'demo-mode-toggle'} type="button" onClick={onDemoMode} aria-pressed={demoMode}>
          <Sparkles size={16} />
          <span>Demo Mode</span>
        </button>
        <button className="notification-button" type="button" onClick={onNotify} aria-label="Notifications">
          <Bell size={21} strokeWidth={1.75} />
          <span>{notificationCount}</span>
        </button>
        <div className="user-profile">
          <UserAvatar initials={user.avatarInitials} tone="blue" />
          <div>
            <strong>{user.name}</strong>
            <span>{roleConfiguration?.label}</span>
          </div>
        </div>
      </div>
    </header>
  );
}

function BottomNavigation() {
  const { activeRole } = useRoleExperience();
  const primary = getRoleNavigation(activeRole).filter((item) => item.group === 'primary').slice(0, 5);
  const location = useLocation();

  return (
    <nav className="bottom-nav" aria-label="Mobile navigation">
      {primary.map((item) => {
        const Icon = item.icon;
        const active = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
        return (
          <NavLink key={item.path} to={item.path} className={active ? 'bottom-nav__item bottom-nav__item--active' : 'bottom-nav__item'}>
            <Icon size={19} />
            <span>{item.mobileLabel ?? item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}

function AppFooter({ demoMode }) {
  const { roleConfiguration } = useRoleExperience();
  return (
    <footer className="app-footer" aria-label="Application status">
      <span>Version 14.0-demo</span>
      <span>Demo Dataset: Loaded</span>
      <span>Build Date: Jul 10, 2026</span>
      <span>Current Workspace: {roleConfiguration?.label}</span>
      <span>Demo Mode: {demoMode ? 'On' : 'Off'}</span>
    </footer>
  );
}

function ToastCenter({ toasts, onDismiss }) {
  return (
    <div className="toast-stack" aria-live="polite" aria-label="System notifications">
      {toasts.map((toast) => (
        <article className={`toast toast--${toast.tone ?? 'info'}`} key={toast.id}>
          <CheckCircle2 size={16} />
          <div>
            <strong>{toast.title}</strong>
            {toast.message ? <p>{toast.message}</p> : null}
          </div>
          <button type="button" onClick={() => onDismiss(toast.id)} aria-label="Dismiss notification">
            <X size={14} />
          </button>
        </article>
      ))}
    </div>
  );
}

function ShortcutOverlay({ open, onClose }) {
  if (!open) return null;
  const shortcuts = [
    ['Ctrl/Cmd + K', 'Focus iBar'],
    ['/', 'Focus iBar search'],
    ['Esc', 'Close panels'],
    ['G then D', 'Dashboard'],
    ['G then C', 'Clients'],
    ['G then R', 'Renewals'],
    ['G then K', 'Claims'],
    ['G then O', 'Documents'],
    ['G then P', 'Reports'],
    ['G then A', 'Administration'],
    ['?', 'Show shortcuts'],
  ];
  return (
    <div className="shortcut-overlay" role="dialog" aria-modal="true" aria-label="Keyboard shortcuts">
      <button className="shortcut-overlay__backdrop" type="button" onClick={onClose} aria-label="Close keyboard shortcuts" />
      <section className="shortcut-overlay__panel">
        <header>
          <div>
            <span>Keyboard Productivity</span>
            <h2>Shortcuts</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close shortcuts"><X size={16} /></button>
        </header>
        <div>
          {shortcuts.map(([keys, action]) => (
            <article key={keys}>
              <kbd>{keys}</kbd>
              <span>{action}</span>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function BriefingContinuationBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { roleConfiguration } = useRoleExperience();
  const [briefingRecord, setBriefingRecord] = useState(() => readBriefingData());
  const [reviewState, setReviewState] = useState(() => readBriefingState());
  const briefing = briefingRecord?.briefing;
  const active = reviewState.active && briefing?.priorities?.length && !location.pathname.startsWith('/briefing');
  const currentIndex = Math.max(0, Math.min(reviewState.currentIndex ?? 0, (briefing?.priorities?.length ?? 1) - 1));
  const priority = briefing?.priorities?.[currentIndex];
  const reviewed = priority ? Boolean(reviewState.reviewed?.[priority.recordId]) : false;

  useEffect(() => {
    function refresh() {
      setBriefingRecord(readBriefingData());
      setReviewState(readBriefingState());
    }

    window.addEventListener(BRIEFING_EVENT, refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener(BRIEFING_EVENT, refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  if (!active || !priority) return null;

  function update(next) {
    const resolved = { ...reviewState, ...next };
    setReviewState(resolved);
    saveBriefingState(resolved);
  }

  function markReviewed() {
    update({
      reviewed: {
        ...(reviewState.reviewed ?? {}),
        [priority.recordId]: new Date().toISOString(),
      },
    });
  }

  function goToIndex(index) {
    const safeIndex = Math.max(0, Math.min(index, briefing.priorities.length - 1));
    const nextPriority = briefing.priorities[safeIndex];
    update({ currentIndex: safeIndex, active: true });
    navigate(nextPriority.primaryAction.route);
  }

  function exit() {
    clearBriefingState();
    setReviewState(readBriefingState());
  }

  return (
    <>
      <aside className="briefing-workspace-callout" aria-label="Briefing workspace highlight">
        <Sparkles size={15} />
        <p><strong>{priority.highlightTarget?.replaceAll('-', ' ')}</strong> {priority.recommendedAction}</p>
      </aside>
      <aside className="briefing-continuation-bar" aria-label="Executive briefing review controls">
        <div>
          <span>{roleConfiguration?.briefingName} · Priority {currentIndex + 1} of {briefing.priorities.length}</span>
          <strong>{priority.clientName} {priority.type}</strong>
          <small>{reviewed ? 'Reviewed in this session' : priority.title}</small>
        </div>
        <nav>
          <button type="button" onClick={() => navigate('/briefing/today')}>Back to Briefing</button>
          <button type="button" onClick={markReviewed}>{reviewed ? 'Reviewed' : 'Mark Reviewed'}</button>
          <button type="button" onClick={() => goToIndex(currentIndex - 1)} disabled={currentIndex === 0}>Previous</button>
          <button type="button" onClick={() => goToIndex(currentIndex + 1)} disabled={currentIndex >= briefing.priorities.length - 1}>Next</button>
          <button type="button" onClick={exit}>Exit</button>
        </nav>
      </aside>
    </>
  );
}

export function Shell({ children }) {
  const navigate = useNavigate();
  const { activeRole, activeUserId, demoMode, roleConfiguration, setDemoMode } = useRoleExperience();
  const [menuOpen, setMenuOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [ariAnalysisOpen, setAriAnalysisOpen] = useState(false);
  const [ariAnalysisView, setAriAnalysisView] = useState('global');
  const [toasts, setToasts] = useState([]);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  function pushToast(title, message, tone = 'info') {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((current) => [{ id, title, message, tone }, ...current].slice(0, 4));
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 4200);
  }

  function openAriAnalysis(view) {
    setAriAnalysisView(view);
    setAriAnalysisOpen(true);
  }

  function dismissToast(id) {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }

  function toggleDemoMode() {
    setDemoMode((value) => {
      const next = !value;
      pushToast(next ? 'Demo Mode enabled' : 'Demo Mode disabled', next ? 'Presenter tools are available.' : 'Standard application view restored.');
      return next;
    });
  }

  useEffect(() => {
    function onToast(event) {
      pushToast(event.detail?.title ?? 'Action completed', event.detail?.message ?? '', event.detail?.tone ?? 'info');
    }

    window.addEventListener('symphony:toast', onToast);
    return () => window.removeEventListener('symphony:toast', onToast);
  }, []);

  useEffect(() => {
    let awaitingGo = false;
    let timer;
    const routes = {
      d: [roleConfiguration.homeRoute, roleConfiguration.shortLabel],
      c: ['/clients', 'Clients'],
      r: ['/renewals', 'Renewals'],
      k: ['/claims', 'Claims'],
      o: ['/documents', 'Documents'],
      p: ['/reports', 'Reports'],
      a: ['/administration', 'Administration'],
    };

    function isEditable(target) {
      return target instanceof HTMLElement && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
    }

    function onKeyDown(event) {
      if (isEditable(event.target)) return;
      const key = event.key.toLowerCase();

      if (event.key === '?') {
        event.preventDefault();
        setShortcutsOpen(true);
        return;
      }

      if (event.key === '/') {
        event.preventDefault();
        window.dispatchEvent(new CustomEvent('symphony:ibar:focus'));
        pushToast('iBar focused', 'Ask a business question or navigate by intent.');
        return;
      }

      if (event.key === 'Escape') {
        setMenuOpen(false);
        setModalOpen(false);
        setAriAnalysisOpen(false);
        setShortcutsOpen(false);
        return;
      }

      if (awaitingGo && routes[key]) {
        event.preventDefault();
        const [route, label] = routes[key];
        awaitingGo = false;
        window.clearTimeout(timer);
        navigate(route);
        pushToast('Navigation completed', `Opened ${label}.`);
        return;
      }

      if (key === 'g') {
        awaitingGo = true;
        window.clearTimeout(timer);
        timer = window.setTimeout(() => { awaitingGo = false; }, 1400);
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.clearTimeout(timer);
    };
  }, [navigate, roleConfiguration]);

  const notificationCount = getRoleNotifications(activeRole, activeUserId).length;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <SymphonyBrand />
        <RoleAwareNavigation />
        {roleConfiguration.sidebarInsights.includes('ari') ? <AviationRiskIndexCard onViewAnalysis={openAriAnalysis} /> : null}
        {roleConfiguration.sidebarInsights.includes('ari') && activeRole === 'owner' ? <ExternalRiskImpactCard onViewAnalysis={openAriAnalysis} /> : null}
        {roleConfiguration.sidebarInsights.includes('market') ? <MarketConditions /> : null}
      </aside>

      <div className="app-stage">
        <TopBar onMenu={() => setMenuOpen(true)} onNotify={() => setModalOpen(true)} demoMode={demoMode} onDemoMode={toggleDemoMode} notificationCount={notificationCount} />
        <RoleScopeNotice />
        <main className="main-content">{children}</main>
        <AppFooter demoMode={demoMode} />
      </div>

      <DemoExperience enabled={demoMode} onEnabledChange={setDemoMode} />

      <BottomNavigation />

      <Drawer open={menuOpen} title="Navigation" onClose={() => setMenuOpen(false)}>
        <RoleAwareNavigation onNavigate={() => setMenuOpen(false)} />
      </Drawer>

      <Modal open={modalOpen} title="Priority Notifications" onClose={() => setModalOpen(false)}>
        <RoleAwareNotifications onNavigate={() => setModalOpen(false)} />
      </Modal>

      <Modal open={ariAnalysisOpen} title="Aviation Risk Index Analysis" className="modal__panel--wide" onClose={() => setAriAnalysisOpen(false)}>
        <AviationRiskAnalysis viewKey={ariAnalysisView} />
      </Modal>

      <ShortcutOverlay open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
      <BriefingContinuationBar />
      <ToastCenter toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
