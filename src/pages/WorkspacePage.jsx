import { ArrowUpRight, DatabaseZap, Plus } from 'lucide-react';
import { EmptyState } from '../components/EmptyState.jsx';
import { LoadingState } from '../components/LoadingState.jsx';
import { MetricCard } from '../components/MetricCard.jsx';
import { ResponsiveTable } from '../components/ResponsiveTable.jsx';
import { SectionHeader } from '../components/SectionHeader.jsx';
import { DataCard } from '../components/DataCard.jsx';
import { metrics, workspaceRows } from '../data/demoData.js';

export function WorkspacePage({ title, tone = 'cyan' }) {
  const pageMetrics = metrics.slice(0, 3).map((metric, index) => ({
    ...metric,
    label: index === 0 ? `${title} Pipeline` : metric.label,
    accent: index === 0 ? tone : metric.accent,
  }));

  return (
    <div className="workspace-page">
      <SectionHeader
        eyebrow="Business Workspace"
        title={title}
        text="A polished placeholder workspace for the local JSON business model, ready for role-based brokerage workflows."
        action={
          <button className="primary-button" type="button">
            <Plus size={17} />
            New item
          </button>
        }
      />

      <section className="metric-grid metric-grid--compact">
        {pageMetrics.map((metric) => (
          <MetricCard key={`${title}-${metric.label}`} metric={metric} />
        ))}
      </section>

      <section className="workspace-grid">
        <DataCard
          title={`${title} Portfolio Board`}
          className="workspace-grid__main"
          action={
            <button className="ghost-button" type="button" aria-label="Open board">
              <ArrowUpRight size={16} />
            </button>
          }
        >
          <ResponsiveTable
            columns={['Account', 'Type', 'Risk', 'Status', 'Exposure']}
            rows={workspaceRows}
          />
        </DataCard>

        <DataCard title="Phase 2 Data Dock">
          <LoadingState label="Standing by for JSON feeds" />
          <EmptyState
            title="Ready for static data"
            text="Connect local JSON files here in the next phase without introducing backend services."
          />
          <div className="data-dock">
            <DatabaseZap size={18} />
            <span>Front-end-only PoC</span>
          </div>
        </DataCard>
      </section>
    </div>
  );
}
