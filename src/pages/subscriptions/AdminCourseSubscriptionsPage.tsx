import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import * as subscriptionsApi from '../../api/subscriptions'
import StatusBadge from '../../components/StatusBadge'
import { formatCurrency, formatDurationDays } from '../../lib/format'
import type { AdminCourseSubscription } from '../../types/subscriptions'

const emptySubscriptions: AdminCourseSubscription[] = []

const getEntityId = (entity: { id?: string; _id?: string }) =>
  entity.id ?? entity._id ?? ''

const getSubscriptionKey = (sub: AdminCourseSubscription) =>
  getEntityId(sub) ||
  `${getEntityId(sub.user ?? {})}-${getEntityId(sub.course ?? {})}-${sub.startDate}-${sub.endDate}`

const getUserLabel = (sub: AdminCourseSubscription) =>
  sub.user?.fullName?.trim() ||
  sub.user?.email?.trim() ||
  'Unknown user'

const getCourseLabel = (sub: AdminCourseSubscription) =>
  sub.course?.title?.trim() || 'Unknown course'

const resolveDurationDays = (sub: AdminCourseSubscription) => {
  if (typeof sub.durationDays === 'number') return sub.durationDays
  const planId = sub.pricingPlanId
  if (!planId || !sub.course?.pricingPlans?.length) return null
  const plan = sub.course.pricingPlans.find(
    (item) => (item.id ?? item._id) === planId,
  )
  return plan?.durationDays ?? null
}

const formatDate = (value?: string) => {
  if (!value) return '—'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return '—'
  return parsed.toLocaleDateString()
}

const formatDateTime = (value?: string) => {
  if (!value) return '—'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return '—'
  return parsed.toLocaleString()
}

const statusTone = (status: AdminCourseSubscription['status']) => {
  switch (status) {
    case 'active':
      return 'success'
    case 'expired':
    case 'canceled':
    default:
      return 'warning'
  }
}

export default function AdminCourseSubscriptionsPage() {
  const [page, setPage] = useState(1)
  const limit = 50

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['admin-course-subscriptions', { page, limit }],
    queryFn: () => subscriptionsApi.listCourseSubscriptions({ page, limit }),
  })

  const payload = data?.data
  const subscriptions = payload?.subscriptions ?? emptySubscriptions
  const pagination = payload?.pagination

  const totalPages = useMemo(() => {
    const total = pagination?.total
    if (!total) return 1
    return Math.max(1, Math.ceil(total / limit))
  }, [pagination?.total])

  return (
    <motion.div
      className="page"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
    >
      <div className="card">
        <div className="card-header">
          <div>
            <h2>Course subscriptions</h2>
            <p className="muted">
              View student subscriptions with status, payment, and date range.
            </p>
          </div>
          <div className="toggle-group">
            <div className="muted">
              Page {page}
              {pagination?.total ? ` of ${totalPages}` : ''}{' '}
              {isFetching ? '(updating...)' : ''}
            </div>
          </div>
        </div>

        {isLoading ? (
          <p className="muted">Loading subscriptions...</p>
        ) : subscriptions.length ? (
          <div className="list">
            {subscriptions.map((sub) => {
              const durationDays = resolveDurationDays(sub)
              return (
              <div key={getSubscriptionKey(sub)} className="list-row">
                <div>
                  <p className="list-title">
                    {getUserLabel(sub)} · {getCourseLabel(sub)}
                  </p>
                  <p className="muted">
                    {sub.user?.email ?? '—'} · Ends: {formatDate(sub.endDate)}
                  </p>
                  <p className="muted">
                    Duration:{' '}
                    {durationDays != null
                      ? formatDurationDays(durationDays)
                      : '—'}
                    {' · '}
                    Plan ID: {sub.pricingPlanId || '—'}
                  </p>
                  <p className="muted">
                    Amount:{' '}
                    {typeof sub.amount === 'number'
                      ? formatCurrency(sub.amount)
                      : '—'}
                    {sub.paymentRef ? ` · Ref: ${sub.paymentRef}` : ''}
                  </p>
                  <p className="muted">
                    Start: {formatDate(sub.startDate)} · Created:{' '}
                    {formatDateTime(sub.createdAt)}
                    {sub.paidAt ? ` · Paid: ${formatDateTime(sub.paidAt)}` : ''}
                  </p>
                  <p className="muted">
                    Created by:{' '}
                    {sub.createdBy?.fullName || sub.createdBy?.email
                      ? `${sub.createdBy?.fullName ?? ''}${sub.createdBy?.email ? ` (${sub.createdBy.email})` : ''}`
                      : '—'}
                  </p>
                </div>
                <div className="list-meta">
                  <StatusBadge label={sub.status} tone={statusTone(sub.status)} />
                  <StatusBadge
                    label={sub.source}
                    tone={sub.source === 'payment' ? 'success' : 'muted'}
                  />
                </div>
              </div>
              )
            })}
          </div>
        ) : (
          <p className="muted">No subscriptions found.</p>
        )}

        <div className="toggle-group">
          <button
            className="button ghost"
            type="button"
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={page <= 1}
          >
            Previous
          </button>
          <button
            className="button ghost"
            type="button"
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={page >= totalPages}
          >
            Next
          </button>
        </div>
      </div>
    </motion.div>
  )
}
