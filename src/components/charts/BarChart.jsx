export function BarChart({ values }) {
  const max = Math.max(...values);

  return (
    <div className="bar-chart" role="img" aria-label="Claims monitor bar chart">
      {values.map((value, index) => (
        <span key={`${value}-${index}`} style={{ height: `${18 + (value / max) * 82}%` }} />
      ))}
    </div>
  );
}
