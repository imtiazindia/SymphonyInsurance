import { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Bell, CheckCircle2, ChevronDown, Menu, ShieldCheck, Sparkles, X } from 'lucide-react';
import { DemoExperience } from '../components/DemoExperience.jsx';
import { Drawer } from '../components/Drawer.jsx';
import { IBar } from '../components/IBar.jsx';
import { Modal } from '../components/Modal.jsx';
import { UserAvatar } from '../components/UserAvatar.jsx';
import { navItems } from '../data/demoData.js';
import {
  aviationRiskIndex,
  formatAriChange,
  formatAriLastUpdated,
  getAriTone,
  getAriTopFactors,
  getAriTrendIcon,
  getAriTrendLabel,
} from '../utils/aviationRiskIndex.js';

function Brand() {
  return (
    <div className="brand" aria-label="Symphony Aerospace Services Insurance Brokers">
      <span className="brand__mark" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
      <div className="brand__copy">
        <strong>SYMPHONY</strong>
        <span>AEROSPACE SERVICES</span>
        <em>INSURANCE BROKERS</em>
      </div>
    </div>
  );
}

function Navigation({ onNavigate }) {
  return (
    <nav className="navigation" aria-label="Primary navigation">
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            onClick={onNavigate}
            className={({ isActive }) => `nav-item ${isActive ? 'nav-item--active' : ''}`}
          >
            <Icon size={20} strokeWidth={1.8} />
            <span>{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}

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
    <aside className="market-card" aria-label="Market conditions">
      <h2>Market Conditions</h2>
      <div className="market-card__rule" />
      <p>Aviation Market Index</p>
      <div className="market-card__metric">
        <strong>97</strong>
        <span>-3 pts</span>
        <small>vs last 30 days</small>
      </div>
      <svg className="market-card__chart" viewBox="0 0 190 70" role="img" aria-label="Stable upward market trend">
        <path d="M3 56 C18 52 25 60 38 47 S60 42 75 32 S97 35 109 24 S130 29 142 17 S166 21 187 10" />
      </svg>
      <div className="market-card__status">
        <span />
        Stable
      </div>
      <time>As of Jul 9, 2026</time>
    </aside>
  );
}

function TopBar({ onMenu, onNotify, demoMode, onDemoMode }) {
  return (
    <header className="top-bar">
      <button className="icon-button menu-button" type="button" onClick={onMenu} aria-label="Open menu">
        <Menu size={21} />
      </button>

      <IBar />

      <div className="top-actions">
        <button className={demoMode ? 'demo-mode-toggle demo-mode-toggle--active' : 'demo-mode-toggle'} type="button" onClick={onDemoMode} aria-pressed={demoMode}>
          <Sparkles size={16} />
          <span>Demo Mode</span>
        </button>
        <button className="notification-button" type="button" onClick={onNotify} aria-label="Notifications">
          <Bell size={21} strokeWidth={1.75} />
          <span>3</span>
        </button>
        <div className="user-profile">
          <UserAvatar initials="AM" tone="blue" />
          <div>
            <strong>Alexandra Morgan</strong>
            <span>CEO</span>
          </div>
          <ChevronDown size={18} />
        </div>
      </div>
    </header>
  );
}

function BottomNavigation() {
  const primary = navItems.slice(0, 5);
  const location = useLocation();

  return (
    <nav className="bottom-nav" aria-label="Mobile navigation">
      {primary.map((item) => {
        const Icon = item.icon;
        const active = item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path);
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
  return (
    <footer className="app-footer" aria-label="Application status">
      <span>Version 14.0-demo</span>
      <span>Demo Dataset: Loaded</span>
      <span>Build Date: Jul 10, 2026</span>
      <span>Current Role: CEO</span>
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

export function Shell({ children }) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [ariAnalysisOpen, setAriAnalysisOpen] = useState(false);
  const [ariAnalysisView, setAriAnalysisView] = useState('global');
  const [demoMode, setDemoMode] = useState(false);
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
      d: ['/', 'Dashboard'],
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
  }, [navigate]);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Brand />
        <Navigation />
        <AviationRiskIndexCard onViewAnalysis={openAriAnalysis} />
        <ExternalRiskImpactCard onViewAnalysis={openAriAnalysis} />
        <MarketConditions />
      </aside>

      <div className="app-stage">
        <TopBar onMenu={() => setMenuOpen(true)} onNotify={() => setModalOpen(true)} demoMode={demoMode} onDemoMode={toggleDemoMode} />
        <main className="main-content">{children}</main>
        <AppFooter demoMode={demoMode} />
      </div>

      <DemoExperience enabled={demoMode} onEnabledChange={setDemoMode} />

      <BottomNavigation />

      <Drawer open={menuOpen} title="Navigation" onClose={() => setMenuOpen(false)}>
        <Navigation onNavigate={() => setMenuOpen(false)} />
      </Drawer>

      <Modal open={modalOpen} title="Priority Notifications" onClose={() => setModalOpen(false)}>
        <div className="notification-stack">
          <article>
            <ShieldCheck size={18} />
            <div>
              <strong>Claims follow-up required</strong>
              <p>Pacific Charters has an executive review item due May 18.</p>
            </div>
          </article>
          <article>
            <Bell size={18} />
            <div>
              <strong>Renewal due in 7 days</strong>
              <p>Coastal Air Transport requires underwriter feedback review.</p>
            </div>
          </article>
        </div>
      </Modal>

      <Modal open={ariAnalysisOpen} title="Aviation Risk Index Analysis" className="modal__panel--wide" onClose={() => setAriAnalysisOpen(false)}>
        <AviationRiskAnalysis viewKey={ariAnalysisView} />
      </Modal>

      <ShortcutOverlay open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
      <ToastCenter toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
