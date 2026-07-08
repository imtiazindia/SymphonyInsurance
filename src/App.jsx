import { Route, Routes } from 'react-router-dom';
import { Shell } from './layout/Shell.jsx';
import { CommandCenter } from './pages/CommandCenter.jsx';
import { WorkspacePage } from './pages/WorkspacePage.jsx';
import { navItems } from './data/demoData.js';

export default function App() {
  return (
    <Shell>
      <Routes>
        <Route path="/" element={<CommandCenter />} />
        {navItems
          .filter((item) => item.path !== '/')
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
