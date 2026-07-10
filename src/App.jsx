import { Route, Routes } from 'react-router-dom';
import { AccountManagerWorkspace } from './pages/AccountManagerWorkspace.jsx';
import { ClaimsWorkspace } from './pages/ClaimsWorkspace.jsx';
import { ClientWorkspacePage } from './pages/ClientWorkspacePage.jsx';
import { ComplianceRiskWorkspace } from './pages/ComplianceRiskWorkspace.jsx';
import { Shell } from './layout/Shell.jsx';
import { ExecutiveOverview } from './pages/ExecutiveOverview.jsx';
import { IBarResultsPage } from './pages/IBarResultsPage.jsx';
import { MarketPlacementWorkspace } from './pages/MarketPlacementWorkspace.jsx';
import { ModulePlaceholderPage } from './pages/ModulePlaceholderPage.jsx';
import { RenewalDetailWorkspace, RenewalWorkspace } from './pages/RenewalWorkspace.jsx';
import { SubmissionWorkspace } from './pages/SubmissionWorkspace.jsx';
import { WorkspacePage } from './pages/WorkspacePage.jsx';
import { navItems } from './data/demoData.js';

export default function App() {
  return (
    <Shell>
      <Routes>
        <Route path="/" element={<ExecutiveOverview />} />
        <Route path="/ibar" element={<IBarResultsPage />} />
        <Route path="/account-manager" element={<AccountManagerWorkspace />} />
        <Route path="/clients" element={<ClientWorkspacePage />} />
        <Route path="/renewals" element={<RenewalWorkspace />} />
        <Route path="/renewals/:renewalId" element={<RenewalDetailWorkspace />} />
        <Route path="/submissions" element={<SubmissionWorkspace />} />
        <Route path="/submissions/:submissionId" element={<SubmissionWorkspace />} />
        <Route path="/market-placement" element={<MarketPlacementWorkspace />} />
        <Route path="/market-placement/:negotiationId" element={<MarketPlacementWorkspace />} />
        <Route path="/claims" element={<ClaimsWorkspace />} />
        <Route path="/claims/:claimId" element={<ClaimsWorkspace />} />
        <Route path="/compliance" element={<ComplianceRiskWorkspace />} />
        <Route path="/documents/:documentId" element={<ModulePlaceholderPage title="Documents" idParam="documentId" />} />
        <Route path="/compliance/:complianceId" element={<ModulePlaceholderPage title="Compliance" idParam="complianceId" />} />
        {navItems
          .filter((item) => !['/', '/account-manager', '/clients', '/renewals', '/submissions', '/market-placement', '/claims', '/compliance'].includes(item.path))
          .map((item) => (
            <Route
              key={item.path}
              path={item.path}
              element={
                ['Renewals', 'Submissions', 'Market Placement', 'Claims', 'Compliance', 'Documents', 'Administration'].includes(item.label)
                  ? <ModulePlaceholderPage title={item.label} />
                  : <WorkspacePage title={item.label} tone={item.tone} />
              }
            />
          ))}
      </Routes>
    </Shell>
  );
}
