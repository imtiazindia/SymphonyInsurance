import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Bell, Command, Menu, Search, Shield, Sparkles } from 'lucide-react';
import { Drawer } from '../components/Drawer.jsx';
import { Modal } from '../components/Modal.jsx';
import { UserAvatar } from '../components/UserAvatar.jsx';
import { missionStatusSummary, navItems, roles } from '../data/demoData.js';

function Brand() {
  return (
    <div className="brand">
      <span className="brand__mark">
        <Command size={21} />
      </span>
      <div>
        <strong>Symphony</strong>
        <span>Mission Control</span>
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
            <Icon size={17} />
            <span>{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}

function TopCommandBar({ activeRole, setActiveRole, onMenu, onNotify }) {
  return (
    <header className="top-command-bar">
      <button className="icon-button menu-button" type="button" onClick={onMenu} aria-label="Open menu">
        <Menu size={20} />
      </button>

      <label className="global-search">
        <Search size={18} />
        <input type="search" placeholder="Search clients, policies, aircraft, markets..." />
        <span>Ctrl K</span>
      </label>

      <div className="role-switcher" aria-label="User role switcher">
        {roles.map((role) => (
          <button
            key={role}
            type="button"
            className={role === activeRole ? 'role-switcher__item role-switcher__item--active' : 'role-switcher__item'}
            onClick={() => setActiveRole(role)}
          >
            {role}
          </button>
        ))}
      </div>

      <div className="command-actions">
        <div className="mission-status-pill" aria-label="Mission status stable">
          <span>
            <i />
            Mission Status: <strong>Stable</strong>
          </span>
          <small>{missionStatusSummary.join(' | ')}</small>
        </div>
        <span className="live-pill">
          <span />
          Live Data
        </span>
        <button className="icon-button" type="button" onClick={onNotify} aria-label="Notifications">
          <Bell size={18} />
          <i />
        </button>
        <UserAvatar initials="IS" tone="amber" />
      </div>
    </header>
  );
}

function BottomNavigation() {
  const primary = navItems.slice(0, 4);
  const location = useLocation();

  return (
    <nav className="bottom-nav" aria-label="Mobile navigation">
      {primary.map((item) => {
        const Icon = item.icon;
        const active = item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path);
        return (
          <NavLink key={item.path} to={item.path} className={active ? 'bottom-nav__item bottom-nav__item--active' : 'bottom-nav__item'}>
            <Icon size={18} />
            <span>{item.label.split(' ')[0]}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}

export function Shell({ children }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeRole, setActiveRole] = useState(roles[0]);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Brand />
        <Navigation />
        <div className="sidebar__intel">
          <Sparkles size={16} />
          <span>AI placement confidence</span>
          <strong>87%</strong>
        </div>
      </aside>

      <div className="mission-stage">
        <TopCommandBar
          activeRole={activeRole}
          setActiveRole={setActiveRole}
          onMenu={() => setMenuOpen(true)}
          onNotify={() => setModalOpen(true)}
        />
        <main className="main-content">{children}</main>
      </div>

      <BottomNavigation />

      <Drawer open={menuOpen} title="Mission Navigation" onClose={() => setMenuOpen(false)}>
        <Navigation onNavigate={() => setMenuOpen(false)} />
      </Drawer>

      <Modal open={modalOpen} title="Notification Center" onClose={() => setModalOpen(false)}>
        <div className="notification-stack">
          <article>
            <Shield size={18} />
            <div>
              <strong>Compliance packet ready</strong>
              <p>Skylark Airlines sanctions screening and KYC documents are ready for review.</p>
            </div>
          </article>
          <article>
            <Bell size={18} />
            <div>
              <strong>Market response received</strong>
              <p>Two carriers updated lead terms for aviation liability placement.</p>
            </div>
          </article>
        </div>
      </Modal>
    </div>
  );
}
