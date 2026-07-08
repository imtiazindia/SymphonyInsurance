export function DonutChart({ data }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  let offset = 25;

  return (
    <div className="donut-chart">
      <svg viewBox="0 0 120 120" role="img" aria-label="Submission status donut chart">
        <circle cx="60" cy="60" r="42" fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="18" />
        {data.map((item) => {
          const dash = (item.value / total) * 264;
          const segment = (
            <circle
              key={item.label}
              cx="60"
              cy="60"
              r="42"
              fill="none"
              stroke={item.color}
              strokeWidth="18"
              strokeDasharray={`${dash} ${264 - dash}`}
              strokeDashoffset={-offset}
              strokeLinecap="round"
            />
          );
          offset += dash;
          return segment;
        })}
        <text x="60" y="56" textAnchor="middle">72</text>
        <text x="60" y="73" textAnchor="middle">open</text>
      </svg>
      <div className="donut-chart__legend">
        {data.map((item) => (
          <span key={item.label}>
            <i style={{ backgroundColor: item.color }} />
            {item.label}
            <strong>{item.value}</strong>
          </span>
        ))}
      </div>
    </div>
  );
}
