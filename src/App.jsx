import { Route, Routes } from 'react-router-dom';
import { AccountManagerWorkspace } from './pages/AccountManagerWorkspace.jsx';
import { Shell } from './layout/Shell.jsx';
import { ExecutiveOverview } from './pages/ExecutiveOverview.jsx';
import { WorkspacePage } from './pages/WorkspacePage.jsx';
import { navItems } from './data/demoData.js';

export default function App() {
  return (
    <Shell>
      <Routes>
        <Route path="/" element={<ExecutiveOverview />} />
        <Route path="/account-manager" element={<AccountManagerWorkspace />} />
        {navItems
          .filter((item) => !['/', '/account-manager'].includes(item.path))
          .map((item) => (
            <Route
              key={item.path}
              path={item.path}
              element={<WorkspacePage title={item.label} tone={item.tone} />}
            />
          ))}
      </Routes>
    </Shell>
  );
}
