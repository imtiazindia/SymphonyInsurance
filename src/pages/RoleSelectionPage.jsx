import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { RoleExperienceCard } from '../components/RoleExperience.jsx';
import { SymphonyBrand } from '../components/SymphonyBrand.jsx';
import { roleExperiences } from '../config/roleExperiences.js';
import { useRoleExperience } from '../context/RoleContext.jsx';

export function RoleSelectionPage() {
  const navigate = useNavigate();
  const { activeRole, remembered, setActiveRole } = useRoleExperience();
  const [remember, setRemember] = useState(remembered);

  function openWorkspace(role) {
    setActiveRole(role.id, { remember });
    navigate(role.homeRoute);
  }

  return (
    <main className="role-selection-page">
      <header className="role-selection-page__header">
        <SymphonyBrand />
        <span className="role-selection-page__demo"><CheckCircle2 size={15} /> Demonstration workspace</span>
      </header>

      <section className="role-selection-page__intro">
        <span>SYMPHONY ONE</span>
        <h1>Select Workspace</h1>
        <p>Select a workspace to continue</p>
      </section>

      <section className="role-selection-grid" aria-label="Available workspaces">
        {roleExperiences.map((role) => (
          <RoleExperienceCard key={role.id} role={role} active={role.id === activeRole} onSelect={openWorkspace} />
        ))}
      </section>

      <footer className="role-selection-page__footer">
        <label>
          <input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} />
          <span>Remember this workspace on this device</span>
        </label>
        <p>Every workspace uses the same connected business records.</p>
      </footer>
    </main>
  );
}
