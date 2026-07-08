const toneMap = {
  Low: 'green',
  Medium: 'amber',
  Elevated: 'red',
  High: 'red',
};

export function RiskBadge({ level }) {
  const tone = toneMap[level] || 'blue';
  return <span className={`risk-badge risk-badge--${tone}`}>{level}</span>;
}
