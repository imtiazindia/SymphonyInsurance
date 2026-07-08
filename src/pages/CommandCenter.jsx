import { ArrowUpRight, BrainCircuit, ChevronRight, PlaneTakeoff } from 'lucide-react';
import { ActivityFeedItem } from '../components/ActivityFeedItem.jsx';
import { ChartCard } from '../components/ChartCard.jsx';
import { DataCard } from '../components/DataCard.jsx';
import { MetricCard } from '../components/MetricCard.jsx';
import { ResponsiveTable } from '../components/ResponsiveTable.jsx';
import { SectionHeader } from '../components/SectionHeader.jsx';
import { TimelineItem } from '../components/TimelineItem.jsx';
import { BarChart } from '../components/charts/BarChart.jsx';
import { ComplianceRing } from '../components/charts/ComplianceRing.jsx';
import { DonutChart } from '../components/charts/DonutChart.jsx';
import { LineChart } from '../components/charts/LineChart.jsx';
import { RiskMap } from '../components/charts/RiskMap.jsx';
import {
  activities,
  claimsBars,
  complianceControls,
  insights,
  metrics,
  negotiations,
  renewalSeries,
  submissionStatus,
  timeline,
} from '../data/demoData.js';

export function CommandCenter() {
  return (
    <div className="command-center">
      <SectionHeader
        eyebrow="Global Overview"
        title="Aviation insurance command center"
        text="Live executive view of renewals, risk concentration, market movement, claims and compliance posture."
        action={
          <button className="primary-button" type="button">
            <PlaneTakeoff size={17} />
            Launch review
          </button>
        }
      />

      <section className="metric-grid" aria-label="Executive metrics">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} metric={metric} />
        ))}
      </section>

      <section className="dashboard-grid">
        <ChartCard title="Renewals Pipeline" className="span-5">
          <LineChart series={renewalSeries} />
        </ChartCard>

        <ChartCard title="Risk Heatmap" className="span-4">
          <RiskMap />
        </ChartCard>

        <ChartCard title="Claims Monitor" className="span-3">
          <div className="claims-summary">
            <div>
              <span>Open Claims</span>
              <strong>38</strong>
              <small>Incurred $24.6M</small>
            </div>
            <div>
              <span>Frequency</span>
              <strong>28</strong>
            </div>
            <div>
              <span>Severity</span>
              <strong>$879K</strong>
            </div>
          </div>
          <BarChart values={claimsBars} />
        </ChartCard>

        <ChartCard title="Submissions Overview" className="span-3">
          <p className="kpi-large">72</p>
          <span className="muted-label">In progress</span>
          <DonutChart data={submissionStatus} />
        </ChartCard>

        <DataCard title="Market Negotiations" className="span-5">
          <ResponsiveTable
            columns={['Account', 'Line', 'Market', 'Status', 'Indicative Change']}
            rows={negotiations}
          />
        </DataCard>

        <DataCard
          title="AI Insights"
          className="span-2"
          action={
            <button className="ghost-button" type="button" aria-label="Open AI insights">
              <ArrowUpRight size={16} />
            </button>
          }
        >
          <ul className="insight-list">
            {insights.map((insight) => (
              <li key={insight}>
                <BrainCircuit size={15} />
                <span>{insight}</span>
              </li>
            ))}
          </ul>
          <button className="secondary-button" type="button">
            View all insights
            <ChevronRight size={15} />
          </button>
        </DataCard>

        <DataCard title="Compliance Tracker" className="span-2">
          <div className="compliance-layout">
            <ComplianceRing value={92} />
            <div className="control-list">
              {complianceControls.map(([label, value]) => (
                <span key={label}>
                  <i />
                  {label}
                  <strong>{value}</strong>
                </span>
              ))}
            </div>
          </div>
        </DataCard>

        <DataCard title="Activity Feed" className="span-2">
          <ul className="activity-list">
            {activities.map((item) => (
              <ActivityFeedItem key={`${item.name}-${item.time}`} item={item} />
            ))}
          </ul>
          <button className="link-button" type="button">View all activity</button>
        </DataCard>

        <DataCard title="Mission Timeline" className="span-4">
          <ol className="timeline-list">
            {timeline.map((item, index) => (
              <TimelineItem key={item.label} item={item} index={index} />
            ))}
          </ol>
        </DataCard>
      </section>
    </div>
  );
}
