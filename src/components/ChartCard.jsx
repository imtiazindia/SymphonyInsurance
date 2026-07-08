import { DataCard } from './DataCard.jsx';

export function ChartCard({ title, children, action, className = '' }) {
  return (
    <DataCard title={title} action={action} className={`chart-card ${className}`}>
      {children}
    </DataCard>
  );
}
