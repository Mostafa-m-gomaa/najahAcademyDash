import { motion } from 'framer-motion'

interface StatCardProps {
  label: string
  value: string
  trend?: string
}

export default function StatCard({ label, value, trend }: StatCardProps) {
  return (
    <motion.div
      className="card stat"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <p className="stat-label">{label}</p>
      <div className="stat-value">{value}</div>
      {trend ? <p className="stat-trend">{trend}</p> : null}
    </motion.div>
  )
}
