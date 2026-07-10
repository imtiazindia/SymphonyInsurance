import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Bell, ChevronDown, Menu, ShieldCheck } from 'lucide-react';
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

function TopBar({ onMenu, onNotify }) {
  return (
    <header className="top-bar">
      <button className="icon-button menu-button" type="button" onClick={onMenu} aria-label="Open menu">
        <Menu size={21} />
      </button>

      <IBar />

      <div className="top-actions">
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

export function Shell({ children }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [ariAnalysisOpen, setAriAnalysisOpen] = useState(false);
  const [ariAnalysisView, setAriAnalysisView] = useState('global');

  function openAriAnalysis(view) {
    setAriAnalysisView(view);
    setAriAnalysisOpen(true);
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Brand />
        <Navigation />
        <AviationRiskIndexCard onViewAnalysis={openAriAnalysis} />
        <MarketConditions />
      </aside>

      <div className="app-stage">
        <TopBar onMenu={() => setMenuOpen(true)} onNotify={() => setModalOpen(true)} />
        <main className="main-content">{children}</main>
      </div>

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
    </div>
  );
}
