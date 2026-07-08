export function ComplianceRing({ value = 92 }) {
  const circumference = 2 * Math.PI * 42;
  const dash = (value / 100) * circumference;

  return (
    <div className="compliance-ring">
      <svg viewBox="0 0 120 120" role="img" aria-label={`${value}% compliance`}>
        <circle cx="60" cy="60" r="42" fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="10" />
        <circle
          cx="60"
          cy="60"
          r="42"
          fill="none"
          stroke="var(--green)"
          strokeWidth="10"
          strokeDasharray={`${dash} ${circumference - dash}`}
          strokeLinecap="round"
        />
        <text x="60" y="65" textAnchor="middle">{value}%</text>
      </svg>
    </div>
  );
}
