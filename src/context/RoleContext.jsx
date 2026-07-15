import { createContext, useContext, useMemo, useState } from 'react';
import { getRoleConfiguration } from '../config/roleExperiences.js';

const SESSION_KEY = 'symphony:role-experience';
const REMEMBER_KEY = 'symphony:remembered-role-experience';
const ROLE_CHANGE_EVENT = 'symphony:role:changed';

const RoleContext = createContext(null);

function readStoredRole() {
  try {
    const sessionRole = JSON.parse(window.sessionStorage.getItem(SESSION_KEY) ?? 'null');
    if (sessionRole?.activeRole && getRoleConfiguration(sessionRole.activeRole)) return sessionRole;
    const remembered = JSON.parse(window.localStorage.getItem(REMEMBER_KEY) ?? 'null');
    if (remembered?.activeRole && getRoleConfiguration(remembered.activeRole)) return remembered;
  } catch {
    // Role selection is optional demonstration state.
  }
  return null;
}

function writeRole(record, remember) {
  try {
    window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(record));
    if (remember) window.localStorage.setItem(REMEMBER_KEY, JSON.stringify(record));
    else window.localStorage.removeItem(REMEMBER_KEY);
  } catch {
    // The application remains usable when browser storage is unavailable.
  }
}

function clearRoleSpecificSession() {
  try {
    window.sessionStorage.removeItem('symphony:briefing:today');
    window.sessionStorage.removeItem('symphony:briefing:review');
    window.sessionStorage.removeItem('symphony:ibar:context');
  } catch {
    // Session cleanup is non-critical.
  }
}

export function RoleContextProvider({ children }) {
  const [roleState, setRoleState] = useState(readStoredRole);
  const [demoMode, setDemoMode] = useState(false);
  const activeRole = roleState?.activeRole ?? null;
  const activeUserId = roleState?.activeUserId ?? null;
  const roleConfiguration = getRoleConfiguration(activeRole);

  function setActiveRole(roleId, options = {}) {
    const configuration = getRoleConfiguration(roleId);
    if (!configuration) return null;
    const next = {
      activeRole: configuration.id,
      activeUserId: options.activeUserId ?? configuration.activeUserId,
      remember: Boolean(options.remember),
      selectedAt: new Date().toISOString(),
    };
    clearRoleSpecificSession();
    writeRole(next, next.remember);
    setRoleState(next);
    window.dispatchEvent(new CustomEvent(ROLE_CHANGE_EVENT, { detail: next }));
    return configuration;
  }

  function setActiveUserId(activeUserId) {
    if (!roleConfiguration) return;
    setRoleState((current) => {
      const next = { ...current, activeUserId };
      writeRole(next, Boolean(next.remember));
      return next;
    });
  }

  function clearActiveRole() {
    try {
      window.sessionStorage.removeItem(SESSION_KEY);
      window.localStorage.removeItem(REMEMBER_KEY);
    } catch {
      // Storage cleanup is non-critical.
    }
    clearRoleSpecificSession();
    setRoleState(null);
  }

  const value = useMemo(() => ({
    activeRole,
    activeUserId,
    clearActiveRole,
    demoMode,
    getRoleConfiguration,
    remembered: Boolean(roleState?.remember),
    roleConfiguration,
    setActiveRole,
    setActiveUserId,
    setDemoMode,
  }), [activeRole, activeUserId, demoMode, roleConfiguration, roleState?.remember]);

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRoleExperience() {
  const context = useContext(RoleContext);
  if (!context) throw new Error('useRoleExperience must be used within RoleContextProvider');
  return context;
}

export { ROLE_CHANGE_EVENT };
