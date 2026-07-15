export function SymphonyBrand({ compact = false }) {
  return (
    <div className={compact ? 'brand brand--compact' : 'brand'} aria-label="Symphony Aerospace Services Insurance Brokers">
      <span className="brand__mark" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
      <div className="brand__copy">
        <strong>SYMPHONY</strong>
        <span>AEROSPACE SERVICES</span>
        <em>INSURANCE BROKERS</em>
      </div>
    </div>
  );
}
