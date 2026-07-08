export function LoadingState({ label = 'Synchronizing market telemetry' }) {
  return (
    <div className="loading-state" aria-live="polite">
      <span className="loading-state__ring" />
      <span>{label}</span>
    </div>
  );
}
