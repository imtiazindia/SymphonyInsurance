export function LineChart({ series }) {
  const width = 700;
  const height = 250;
  const padding = 24;
  const allValues = series.flatMap((item) => item.values);
  const max = Math.max(...allValues);
  const min = Math.min(...allValues);

  const toPoints = (values) =>
    values
      .map((value, index) => {
        const x = padding + (index / (values.length - 1)) * (width - padding * 2);
        const y = height - padding - ((value - min) / (max - min || 1)) * (height - padding * 2);
        return `${x},${y}`;
      })
      .join(' ');

  return (
    <div className="line-chart">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Renewals pipeline chart">
        {[0, 1, 2, 3].map((line) => (
          <line
            key={line}
            x1={padding}
            x2={width - padding}
            y1={padding + line * 52}
            y2={padding + line * 52}
            className="chart-grid"
          />
        ))}
        {series.map((item) => (
          <polyline
            key={item.name}
            points={toPoints(item.values)}
            fill="none"
            stroke={item.color}
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
      </svg>
      <div className="chart-months">
        <span>Jan</span>
        <span>Feb</span>
        <span>Mar</span>
        <span>Apr</span>
        <span>May</span>
        <span>Jun</span>
      </div>
      <div className="chart-legend">
        {series.map((item) => (
          <span key={item.name}>
            <i style={{ backgroundColor: item.color }} />
            {item.name}
          </span>
        ))}
      </div>
    </div>
  );
}
