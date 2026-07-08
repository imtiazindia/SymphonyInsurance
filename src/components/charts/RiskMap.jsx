const regions = [
  { x: 82, y: 72, w: 112, h: 48, tone: 'red' },
  { x: 204, y: 108, w: 68, h: 88, tone: 'amber' },
  { x: 346, y: 88, w: 110, h: 52, tone: 'amber' },
  { x: 472, y: 80, w: 146, h: 62, tone: 'red' },
  { x: 512, y: 154, w: 78, h: 56, tone: 'amber' },
  { x: 628, y: 154, w: 56, h: 78, tone: 'red' },
];

export function RiskMap() {
  return (
    <div className="risk-map" role="img" aria-label="Global risk heatmap">
      <svg viewBox="0 0 760 290">
        <path className="map-land" d="M79 90l46-26 66 12 20 36-31 31-70-1-42-20zM211 159l39-18 34 24-8 54-42 34-31-42zM321 101l50-26 78 19 30 41-42 34-83-7-48-26zM496 85l91-28 81 32 34 58-54 32-128-11-63-44zM496 163l70-8 48 31-24 44-72 3-42-31zM641 171l39 9 27 49-20 37-52-9-18-43z" />
        {regions.map((region) => (
          <ellipse
            key={`${region.x}-${region.y}`}
            cx={region.x}
            cy={region.y}
            rx={region.w / 2}
            ry={region.h / 2}
            className={`risk-map__hotspot risk-map__hotspot--${region.tone}`}
          />
        ))}
        <path className="map-outline" d="M79 90l46-26 66 12 20 36-31 31-70-1-42-20zM211 159l39-18 34 24-8 54-42 34-31-42zM321 101l50-26 78 19 30 41-42 34-83-7-48-26zM496 85l91-28 81 32 34 58-54 32-128-11-63-44zM496 163l70-8 48 31-24 44-72 3-42-31zM641 171l39 9 27 49-20 37-52-9-18-43z" />
      </svg>
      <div className="risk-map__scale">
        <span>Low</span>
        <i />
        <span>High</span>
      </div>
    </div>
  );
}
