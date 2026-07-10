export const BRIEFING_DATA_KEY = 'symphony:briefing:today';
export const BRIEFING_STATE_KEY = 'symphony:briefing:review';
export const BRIEFING_EVENT = 'symphony:briefing:update';

function readJson(key, fallback = null) {
  try {
    return JSON.parse(window.sessionStorage.getItem(key) ?? 'null') ?? fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  try {
    window.sessionStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new CustomEvent(BRIEFING_EVENT));
  } catch {
    // Session-only briefing state is non-critical.
  }
}

export function readBriefingData() {
  return readJson(BRIEFING_DATA_KEY);
}

export function saveBriefingData(payload) {
  if (!payload?.executiveDailyBriefing) return;
  writeJson(BRIEFING_DATA_KEY, {
    requestId: payload.requestId,
    savedAt: new Date().toISOString(),
    payload,
    briefing: payload.executiveDailyBriefing,
  });
}

export function readBriefingState() {
  return readJson(BRIEFING_STATE_KEY, {
    active: false,
    currentIndex: 0,
    reviewed: {},
    scrollTop: 0,
  });
}

export function saveBriefingState(nextState) {
  writeJson(BRIEFING_STATE_KEY, {
    active: false,
    currentIndex: 0,
    reviewed: {},
    scrollTop: 0,
    ...nextState,
  });
}

export function clearBriefingState() {
  try {
    window.sessionStorage.removeItem(BRIEFING_STATE_KEY);
    window.dispatchEvent(new CustomEvent(BRIEFING_EVENT));
  } catch {
    // Session-only briefing state is non-critical.
  }
}
