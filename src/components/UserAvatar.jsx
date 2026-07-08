export function UserAvatar({ initials = 'SM', tone = 'cyan' }) {
  return <span className={`user-avatar user-avatar--${tone}`}>{initials}</span>;
}
