import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Bell, ChevronDown, Menu, Search, ShieldCheck } from 'lucide-react';
import { Drawer } from '../components/Drawer.jsx';
import { Modal } from '../components/Modal.jsx';
import { UserAvatar } from '../components/UserAvatar.jsx';
import { navItems } from '../data/demoData.js';

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

      <label className="global-search">
        <Search size={19} strokeWidth={1.8} />
        <input type="search" placeholder="Search clients, policies, submissions..." />
      </label>

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

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Brand />
        <Navigation />
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
    </div>
  );
}
