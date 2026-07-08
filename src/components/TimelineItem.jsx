export function TimelineItem({ item, index }) {
  return (
    <li className="timeline-item">
      <span className="timeline-item__rail">
        <span>{index + 1}</span>
      </span>
      <div>
        <strong>{item.label}</strong>
        <p>{item.detail}</p>
      </div>
      <time>{item.time}</time>
    </li>
  );
}
