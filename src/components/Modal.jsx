import { X } from 'lucide-react';

export function Modal({ open, title, children, onClose }) {
  if (!open) return null;

  return (
    <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <button className="modal__backdrop" onClick={onClose} aria-label="Close modal" />
      <section className="modal__panel">
        <div className="modal__header">
          <h2 id="modal-title">{title}</h2>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}
