import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, NavLink, Navigate, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Bell,
  BriefcaseBusiness,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  FileWarning,
  ShieldAlert,
  UserRoundCog,
  X,
} from 'lucide-react';
import { getRoleNavigation, isRouteInRoleExperience, roleExperiences } from '../config/roleExperiences.js';
import { useRoleExperience } from '../context/RoleContext.jsx';
import { simulationData } from '../data/demoData.js';
import { BusinessKpiCard, TaskPriorityBadge } from './BusinessComponents.jsx';

const clientById = new Map(simulationData.clients.map((client) => [client.id, client]));
const userById = new Map(simulationData.teamMembers.map((user) => [user.id, user]));

function clientName(clientId) {
  return clientById.get(clientId)?.name ?? 'Portfolio';
}

export function RoleExperienceCard({ role, active = false, compact = false, onSelect }) {
  const Icon = role.icon;
  return (
    <button
      type="button"
      className={`role-experience-card ${compact ? 'role-experience-card--compact' : ''} ${active ? 'role-experience-card--active' : ''}`}
      onClick={() => onSelect(role)}
      aria-label={`Open ${role.label} workspace. ${role.description}`}
      aria-current={active ? 'true' : undefined}
    >
      <span className="role-experience-card__icon"><Icon size={24} /></span>
      <span className="role-experience-card__copy">
        <strong>{role.label}</strong>
        <p>{role.description}</p>
      </span>
      {!compact ? (
        <span className="role-experience-card__focus">
          <small>Primary focus</small>
          {role.priorities.map((priority) => <span key={priority}><CheckCircle2 size={14} /> {priority}</span>)}
        </span>
      ) : null}
      <span className="role-experience-card__action">
        {active ? 'Current Workspace' : 'Open Workspace'}
        <ArrowRight size={16} />
      </span>
    </button>
  );
}

export function RoleAwareNavigation({ onNavigate }) {
  const { activeRole } = useRoleExperience();
  const navigation = getRoleNavigation(activeRole);
  const primary = navigation.filter((item) => item.group === 'primary');
  const secondary = navigation.filter((item) => item.group === 'secondary');

  function renderItem(item) {
    const Icon = item.icon;
    return (
      <NavLink
        key={`${item.group}-${item.key}`}
        to={item.path}
        onClick={onNavigate}
        className={({ isActive }) => `nav-item ${isActive ? 'nav-item--active' : ''}`}
      >
        <Icon size={20} strokeWidth={1.8} />
        <span>{item.label}</span>
      </NavLink>
    );
  }

  return (
    <nav className="navigation" aria-label="Role-aware primary navigation">
      {primary.map(renderItem)}
      {secondary.length ? <span className="navigation__divider">Additional Workspaces</span> : null}
      {secondary.map(renderItem)}
    </nav>
  );
}

export function RoleSwitcher() {
  const navigate = useNavigate();
  const triggerRef = useRef(null);
  const firstCardRef = useRef(null);
  const [open, setOpen] = useState(false);
  const { activeRole, roleConfiguration, setActiveRole } = useRoleExperience();

  useEffect(() => {
    if (!open) return undefined;
    const timer = window.setTimeout(() => firstCardRef.current?.focus(), 0);
    function onKeyDown(event) {
      if (event.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  function chooseRole(role) {
    setActiveRole(role.id);
    setOpen(false);
    navigate(role.homeRoute);
    window.setTimeout(() => document.querySelector('main h1')?.focus(), 0);
  }

  return (
    <>
      <button ref={triggerRef} className="role-switcher-trigger" type="button" onClick={() => setOpen(true)} aria-haspopup="dialog" aria-expanded={open}>
        <span>Current Workspace</span>
        <strong>{roleConfiguration?.label ?? 'Select Workspace'}</strong>
        <ChevronDown size={16} />
      </button>
      {open ? (
        <div className="role-switcher" role="dialog" aria-modal="true" aria-labelledby="role-switcher-title">
          <button className="role-switcher__backdrop" type="button" onClick={() => setOpen(false)} aria-label="Close workspace switcher" />
          <section className="role-switcher__panel">
            <header>
              <div>
                <span>Current Workspace</span>
                <h2 id="role-switcher-title">Switch Workspace</h2>
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close workspace switcher"><X size={18} /></button>
            </header>
            <div className="role-switcher__grid">
              {roleExperiences.map((role, index) => (
                <div ref={index === 0 ? firstCardRef : undefined} key={role.id} tabIndex="-1">
                  <RoleExperienceCard role={role} compact active={role.id === activeRole} onSelect={chooseRole} />
                </div>
              ))}
            </div>
            <footer>
              <span>Role selection changes presentation and priorities only. Shared business records remain unchanged.</span>
              <Link to="/select-role" onClick={() => setOpen(false)}>Open selection page</Link>
            </footer>
          </section>
        </div>
      ) : null}
    </>
  );
}

export function RoleRouteGuard({ children }) {
  const location = useLocation();
  const { activeRole } = useRoleExperience();
  if (!activeRole) return <Navigate to="/select-role" replace state={{ from: location.pathname }} />;
  return children;
}

export function RoleScopeNotice() {
  const location = useLocation();
  const { activeRole, demoMode, roleConfiguration } = useRoleExperience();
  if (!roleConfiguration || demoMode || isRouteInRoleExperience(activeRole, location.pathname)) return null;
  return (
    <aside className="role-scope-notice" aria-live="polite">
      <CircleAlert size={17} />
      <p>This shared workspace is outside the usual {roleConfiguration.shortLabel} experience.</p>
      <Link to={roleConfiguration.homeRoute}>Return to my workspace</Link>
    </aside>
  );
}

export function RoleAwareDashboardHeader({ eyebrow, title, question, metrics = [], actions = [], onAction }) {
  return (
    <section className="role-dashboard-header">
      <div className="role-dashboard-header__intro">
        <span>{eyebrow}</span>
        <h1 tabIndex="-1">{title}</h1>
        <p>{question}</p>
      </div>
      {actions.length ? (
        <nav className="role-dashboard-header__actions" aria-label={`${title} quick actions`}>
          {actions.slice(0, 4).map((action, index) => (
            <button type="button" key={action} onClick={() => onAction?.(action)} className={index === 0 ? 'primary-action' : ''}>
              {action}
            </button>
          ))}
        </nav>
      ) : null}
      {metrics.length ? <RoleKpiStrip items={metrics} /> : null}
    </section>
  );
}

export function RoleKpiStrip({ items }) {
  return (
    <section className="role-kpi-strip" aria-label="Workspace summary">
      {items.map((item) => <BusinessKpiCard key={item.label} {...item} />)}
    </section>
  );
}

export function RolePriorityQueue({ title = 'Priorities', text, items, onAction }) {
  return (
    <section className="role-priority-queue">
      <header>
        <div><h2>{title}</h2>{text ? <p>{text}</p> : null}</div>
        <span>{items.length} items</span>
      </header>
      <div>
        {items.length ? items.map((item) => (
          <article key={item.id}>
            <div className="role-priority-queue__lead">
              <TaskPriorityBadge priority={item.priority} />
              <div>
                <strong>{item.workflow}</strong>
                {item.clientId ? <Link to={`/clients/${item.clientId}`}>{item.clientName}</Link> : <span>{item.clientName}</span>}
                <p>{item.issue}</p>
              </div>
            </div>
            <dl>
              <div><dt>Age / Due</dt><dd>{item.age}</dd></div>
              <div><dt>Responsible</dt><dd>{item.owner}</dd></div>
              <div><dt>Business Impact</dt><dd>{item.impact}</dd></div>
            </dl>
            <footer>
              <span>{item.recommendedAction}</span>
              {item.route ? <Link to={item.route}>Open <ArrowRight size={14} /></Link> : null}
              {onAction ? <button type="button" onClick={() => onAction(item)}>Take Action</button> : null}
            </footer>
          </article>
        )) : <p className="role-empty-state">No items currently require action.</p>}
      </div>
    </section>
  );
}

export function RoleQuickActions({ actions, onAction, feedback }) {
  return (
    <section className="role-quick-actions">
      <header><h2>Quick Actions</h2><p>Simulated actions are retained for this browser session only.</p></header>
      <div>{actions.map((action) => <button type="button" key={action} onClick={() => onAction(action)}>{action}</button>)}</div>
      {feedback ? <p className="role-quick-actions__feedback" aria-live="polite">{feedback}</p> : null}
    </section>
  );
}

export function getRoleNotifications(roleId, activeUserId) {
  const openTasks = simulationData.tasks.filter((task) => task.status !== 'Complete');
  const assignedClientIds = new Set(userById.get(activeUserId)?.assignedClients ?? []);
  const notices = [];

  if (roleId === 'owner') {
    const renewal = simulationData.renewals.filter((item) => item.ownerAttentionRequired).sort((a, b) => b.revenueAtRisk - a.revenueAtRisk)[0];
    const claim = simulationData.claims.filter((item) => item.executiveReviewRequired).sort((a, b) => b.reserveAmount - a.reserveAmount)[0];
    const overloaded = simulationData.teamMembers.slice().sort((a, b) => b.workloadScore - a.workloadScore)[0];
    if (renewal) notices.push({ id: renewal.id, icon: BriefcaseBusiness, title: 'High-value renewal at risk', message: `${clientName(renewal.clientId)} has revenue at risk and requires attention.`, route: `/renewals/${renewal.id}`, tone: 'high' });
    if (claim) notices.push({ id: claim.id, icon: ShieldAlert, title: 'Major claim requires review', message: `${clientName(claim.clientId)} has an executive review flag.`, route: `/claims/${claim.id}`, tone: 'high' });
    if (overloaded) notices.push({ id: overloaded.id, icon: UserRoundCog, title: 'Team capacity concern', message: `${overloaded.name} is at ${overloaded.workloadScore}% workload.`, route: '/operations', tone: 'medium' });
  } else if (roleId === 'operations') {
    openTasks.filter((task) => task.status === 'Overdue').slice(0, 2).forEach((task) => notices.push({ id: task.id, icon: CalendarClock, title: 'Overdue operational work', message: `${clientName(task.clientId)}: ${task.title}`, route: '/tasks', tone: 'high' }));
    const blocked = simulationData.submissions.find((item) => item.completionPercent < 75);
    if (blocked) notices.push({ id: blocked.id, icon: FileWarning, title: 'Submission workflow blocked', message: `${clientName(blocked.clientId)} is ${blocked.completionPercent}% complete.`, route: `/submissions/${blocked.id}`, tone: 'medium' });
  } else if (roleId === 'account-manager') {
    const tasks = openTasks.filter((task) => task.assignedUserId === activeUserId || assignedClientIds.has(task.clientId));
    tasks.slice(0, 2).forEach((task) => notices.push({ id: task.id, icon: CalendarClock, title: task.status === 'Overdue' ? 'Client task overdue' : 'Client follow-up due', message: `${clientName(task.clientId)}: ${task.title}`, route: '/account-manager', tone: task.status === 'Overdue' ? 'high' : 'medium' }));
    const document = simulationData.documents.find((item) => assignedClientIds.has(item.clientId) && /Missing|Expired|Needs Review/.test(item.status));
    if (document) notices.push({ id: document.id, icon: FileWarning, title: 'Client document required', message: `${clientName(document.clientId)}: ${document.documentType}`, route: `/documents/${document.id}`, tone: 'medium' });
  } else if (roleId === 'placement') {
    simulationData.negotiations.filter((item) => item.decisionRequired || item.pendingQuestions.length).slice(0, 3).forEach((item) => notices.push({ id: item.id, icon: Bell, title: item.decisionRequired ? 'Placement decision required' : 'Underwriter question outstanding', message: `${clientName(item.clientId)}: ${item.recommendedInsurer}`, route: `/market-placement/${item.id}`, tone: item.decisionRequired ? 'high' : 'medium' }));
  } else if (roleId === 'claims') {
    simulationData.claims.filter((item) => item.status !== 'Closed').slice(0, 3).forEach((item) => notices.push({ id: item.id, icon: ShieldAlert, title: item.executiveReviewRequired ? 'Claim intervention required' : 'Claim update due', message: `${clientName(item.clientId)}: ${item.nextAction}`, route: `/claims/${item.id}`, tone: item.severity === 'High' ? 'high' : 'medium' }));
  } else if (roleId === 'compliance') {
    simulationData.compliance.filter((item) => item.status !== 'Closed').slice(0, 3).forEach((item) => notices.push({ id: item.id, icon: ShieldAlert, title: item.status === 'Overdue' ? 'Corrective action overdue' : 'Risk action due', message: `${clientName(item.clientId)}: ${item.findingType}`, route: '/compliance-risk', tone: item.severity === 'High' ? 'high' : 'medium' }));
  }

  return notices.slice(0, 4);
}

export function RoleAwareNotifications({ onNavigate }) {
  const { activeRole, activeUserId, roleConfiguration } = useRoleExperience();
  const notices = useMemo(() => getRoleNotifications(activeRole, activeUserId), [activeRole, activeUserId]);
  return (
    <div className="notification-stack role-notification-stack">
      <header><span>{roleConfiguration?.shortLabel} priorities</span><strong>{notices.length} notifications</strong></header>
      {notices.length ? notices.map((notice) => {
        const Icon = notice.icon;
        return (
          <Link to={notice.route} key={notice.id} onClick={onNavigate}>
            <Icon size={18} />
            <div><strong>{notice.title}</strong><p>{notice.message}</p></div>
            <span className={`notification-tone notification-tone--${notice.tone}`}>{notice.tone === 'high' ? 'Priority' : 'Review'}</span>
          </Link>
        );
      }) : <p className="role-empty-state">No role-priority notifications are currently open.</p>}
    </div>
  );
}

export function RoleAwareIBarSuggestions({ onSelect }) {
  const { roleConfiguration } = useRoleExperience();
  return (
    <div className="role-ibar-suggestions">
      {roleConfiguration?.iBarSuggestions.map((suggestion) => <button type="button" key={suggestion} onClick={() => onSelect(suggestion)}>{suggestion}</button>)}
    </div>
  );
}

export function RoleBriefingHeader() {
  const { roleConfiguration } = useRoleExperience();
  return (
    <header className="role-briefing-header">
      <span>{roleConfiguration?.shortLabel} Workspace</span>
      <h1>{roleConfiguration?.briefingName}</h1>
      <p>{roleConfiguration?.primaryQuestion}</p>
    </header>
  );
}
