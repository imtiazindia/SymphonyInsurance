import aviationRiskIndex from '../data/aviationRiskIndex.json';

export const activeAriViewKey = 'domestic';

export function getAriView(view = activeAriViewKey) {
  return aviationRiskIndex[view] ?? aviationRiskIndex[activeAriViewKey];
}

export function getAriTopFactors(view = getAriView(), limit = 4) {
  const primary = new Set(view.primaryDrivers);
  return view.factors
    .slice()
    .sort((a, b) => {
      const primaryScore = Number(primary.has(b.label)) - Number(primary.has(a.label));
      return primaryScore || b.score - a.score;
    })
    .slice(0, limit);
}

export function getAriTone(category = '') {
  return {
    Low: 'low',
    Guarded: 'guarded',
    Moderate: 'moderate',
    Elevated: 'elevated',
    Severe: 'severe',
  }[category] ?? 'guarded';
}

export function getAriTrendIcon(trend) {
  if (trend === 'up') return '↑';
  if (trend === 'down') return '↓';
  return '→';
}

export function getAriTrendLabel(trend) {
  if (trend === 'up') return 'Worsening';
  if (trend === 'down') return 'Improving';
  return 'Stable';
}

export function formatAriChange(change, windowLabel = 'since yesterday') {
  const direction = change > 0 ? '↑' : change < 0 ? '↓' : '→';
  const absolute = Math.abs(change);
  const label = absolute === 1 ? 'point' : 'points';
  if (absolute === 0) return `${direction} stable ${windowLabel}`;
  return `${direction} ${absolute} ${label} ${windowLabel}`;
}

export function formatAriLastUpdated(value = aviationRiskIndex.lastUpdated) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));
}

export function getAriClientExposure(client, view = getAriView()) {
  const text = `${client.clientType} ${client.industrySegment} ${client.shortBusinessSummary}`.toLowerCase();
  if (text.includes('charter') || text.includes('international') || text.includes('fleet')) {
    return {
      level: view.category,
      drivers: view.primaryDrivers.slice(0, 3),
      note: view.workspaceSignals.client,
    };
  }
  if (text.includes('flight') || text.includes('airport') || text.includes('fbo') || text.includes('helicopter')) {
    return {
      level: view.category,
      drivers: view.primaryDrivers.filter((driver) => driver !== 'Geopolitical').slice(0, 3),
      note: view.workspaceSignals.client,
    };
  }
  return {
    level: 'Guarded',
    drivers: view.primaryDrivers.slice(0, 2),
    note: 'Limited direct ARI exposure, but service teams should monitor weather, fuel, and documentation impacts.',
  };
}

export { aviationRiskIndex };
