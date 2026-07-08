export function SectionHeader({ eyebrow, title, text, action }) {
  return (
    <header className="section-header">
      <div>
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h1>{title}</h1>
        {text ? <p>{text}</p> : null}
      </div>
      {action ? <div className="section-header__action">{action}</div> : null}
    </header>
  );
}
