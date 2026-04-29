interface StatusBadgeProps {
  label: string
  tone?: 'success' | 'warning' | 'muted'
}

export default function StatusBadge({
  label,
  tone = 'muted',
}: StatusBadgeProps) {
  return <span className={`badge badge-${tone}`}>{label}</span>
}
