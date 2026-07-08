import { X } from 'lucide-react';

export function Drawer({ open, title, children, onClose }) {
  return (
    <div className={`drawer ${open ? 'drawer--open' : ''}`} aria-hidden={!open}>
      <button className="drawer__backdrop" onClick={onClose} aria-label="Close menu" />
      <aside className="drawer__panel" aria-label={title}>
        <div className="drawer__header">
          <strong>{title}</strong>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        {children}
      </aside>
    </div>
  );
}
