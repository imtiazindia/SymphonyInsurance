import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { RoleRouteGuard } from './components/RoleExperience.jsx';
import { useRoleExperience } from './context/RoleContext.jsx';
import { AccountManagerWorkspace } from './pages/AccountManagerWorkspace.jsx';
import { ClaimsWorkspace } from './pages/ClaimsWorkspace.jsx';
import { ClientWorkspacePage } from './pages/ClientWorkspacePage.jsx';
import { ComplianceRiskWorkspace } from './pages/ComplianceRiskWorkspace.jsx';
import { DocumentIntelligenceHub } from './pages/DocumentIntelligenceHub.jsx';
import { Shell } from './layout/Shell.jsx';
import { ExecutiveOverview } from './pages/ExecutiveOverview.jsx';
import { IBarResultsPage } from './pages/IBarResultsPage.jsx';
import { MarketPlacementWorkspace } from './pages/MarketPlacementWorkspace.jsx';
import { ModulePlaceholderPage } from './pages/ModulePlaceholderPage.jsx';
import { OperationsManagerWorkspace } from './pages/OperationsManagerWorkspace.jsx';
import { PlatformAdministrationWorkspace } from './pages/PlatformAdministrationWorkspace.jsx';
import { RenewalDetailWorkspace, RenewalWorkspace } from './pages/RenewalWorkspace.jsx';
import { ReportsAnalyticsWorkspace } from './pages/ReportsAnalyticsWorkspace.jsx';
import { SubmissionWorkspace } from './pages/SubmissionWorkspace.jsx';
import { RoleSelectionPage } from './pages/RoleSelectionPage.jsx';

const ExecutiveBriefingPage = lazy(() => import('./pages/ExecutiveBriefingPage.jsx').then((module) => ({ default: module.ExecutiveBriefingPage })));

export default function App() {
  const location = useLocation();
  const { activeRole, roleConfiguration } = useRoleExperience();

  if (location.pathname === '/select-role') return <RoleSelectionPage />;
  if (!activeRole) return <Navigate to="/select-role" replace state={{ from: location.pathname }} />;
  if (location.pathname === '/') return <Navigate to={roleConfiguration.homeRoute} replace />;

  return (
    <RoleRouteGuard>
      <Shell>
        <Suspense fallback={<div className="briefing-empty"><h1>Loading workspace</h1><p>Preparing the selected view.</p></div>}>
          <Routes>
          <Route path="/executive-overview" element={<ExecutiveOverview />} />
          <Route path="/operations" element={<OperationsManagerWorkspace />} />
          <Route path="/ibar" element={<IBarResultsPage />} />
          <Route path="/briefing/today" element={<ExecutiveBriefingPage />} />
          <Route path="/account-manager" element={<AccountManagerWorkspace />} />
          <Route path="/clients" element={<ClientWorkspacePage />} />
          <Route path="/clients/:clientId/*" element={<ClientWorkspacePage />} />
          <Route path="/renewals" element={<RenewalWorkspace />} />
          <Route path="/renewals/:renewalId" element={<RenewalDetailWorkspace />} />
          <Route path="/submissions" element={<SubmissionWorkspace />} />
          <Route path="/submissions/:submissionId" element={<SubmissionWorkspace />} />
          <Route path="/market-placement" element={<MarketPlacementWorkspace />} />
          <Route path="/market-placement/:negotiationId" element={<MarketPlacementWorkspace />} />
          <Route path="/claims" element={<ClaimsWorkspace />} />
          <Route path="/claims/:claimId" element={<ClaimsWorkspace />} />
          <Route path="/compliance" element={<ComplianceRiskWorkspace />} />
          <Route path="/compliance-risk" element={<ComplianceRiskWorkspace />} />
          <Route path="/documents" element={<DocumentIntelligenceHub />} />
          <Route path="/documents/:documentId" element={<DocumentIntelligenceHub />} />
          <Route path="/reports" element={<ReportsAnalyticsWorkspace />} />
          <Route path="/administration" element={<PlatformAdministrationWorkspace />} />
          <Route path="/compliance/:complianceId" element={<ModulePlaceholderPage title="Compliance" idParam="complianceId" />} />
          <Route path="/tasks" element={<ModulePlaceholderPage title="My Work / Team Work" />} />
          <Route path="/policies" element={<ModulePlaceholderPage title="Policies" />} />
          <Route path="/underwriter-questions" element={<ModulePlaceholderPage title="Underwriter Questions" />} />
          <Route path="/quote-comparison" element={<ModulePlaceholderPage title="Quote Comparison" />} />
          <Route path="/findings" element={<ModulePlaceholderPage title="Compliance Findings" />} />
          <Route path="/improvement-plans" element={<ModulePlaceholderPage title="Risk Improvement Plans" />} />
          <Route path="/aviation-risk-index" element={<ModulePlaceholderPage title="Aviation Risk Index" />} />
          <Route path="*" element={<Navigate to={roleConfiguration.homeRoute} replace />} />
          </Routes>
        </Suspense>
      </Shell>
    </RoleRouteGuard>
  );
}
