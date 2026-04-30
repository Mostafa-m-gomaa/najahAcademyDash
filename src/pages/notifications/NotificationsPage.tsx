import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AxiosError } from 'axios'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import * as notificationsApi from '../../api/notifications'
import type { NotificationItem } from '../../types/notifications'

const buildNotificationHref = (notification: NotificationItem) => {
  if (notification.type === 'essay_answer_reviewed') {
    const courseId = notification.data?.courseId as string | undefined
    const questionId = notification.data?.questionId as string | undefined
    if (courseId && questionId) {
      return `/learn/courses/${courseId}/essay-questions/${questionId}`
    }
  }
  return ''
}

export default function NotificationsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [toast, setToast] = useState<{
    message: string
    tone: 'success' | 'error'
  } | null>(null)

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 5000)
    return () => window.clearTimeout(timer)
  }, [toast])

  const { data, isLoading, error } = useQuery({
    queryKey: ['notifications'],
    queryFn: notificationsApi.listNotifications,
  })

  const notifications = useMemo(() => data?.data ?? [], [data])

  const errorMessage =
    error instanceof AxiosError
      ? error.response?.data?.message ?? 'Failed to load notifications.'
      : error
        ? 'Failed to load notifications.'
        : ''

  const markReadMutation = useMutation({
    mutationFn: (notificationId: string) =>
      notificationsApi.markNotificationRead(notificationId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
    onError: () => {
      setToast({ message: 'Failed to mark notification as read.', tone: 'error' })
    },
  })

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
            <h2>Notifications</h2>
            <p className="muted">Updates and review feedback.</p>
          </div>
          <Link className="button ghost" to="/">
            Home
          </Link>
        </div>

        {errorMessage ? <p className="error-text">{errorMessage}</p> : null}

        {isLoading ? (
          <p className="muted">Loading notifications...</p>
        ) : notifications.length ? (
          <div className="list">
            {notifications.map((notification) => {
              const href = buildNotificationHref(notification)
              return (
                <button
                  key={notification.id}
                  type="button"
                  className="list-row"
                  style={{ textAlign: 'left', width: '100%' }}
                  onClick={async () => {
                    if (!notification.isRead) {
                      markReadMutation.mutate(notification.id)
                    }
                    if (href) {
                      navigate(href)
                    }
                  }}
                >
                  <div>
                    <p className="list-title">
                      {notification.title}{' '}
                      {!notification.isRead ? (
                        <span className="badge badge-muted">New</span>
                      ) : null}
                    </p>
                    <p className="muted">{notification.message}</p>
                  </div>
                  <div className="list-meta">
                    <span className="muted">
                      {notification.createdAt
                        ? new Date(notification.createdAt).toLocaleString()
                        : ''}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        ) : (
          <p className="muted">No notifications yet.</p>
        )}
      </div>

      {toast ? (
        <div className={`toast ${toast.tone}`} role="status">
          <span>{toast.message}</span>
          <button className="button ghost" type="button" onClick={() => setToast(null)}>
            Dismiss
          </button>
        </div>
      ) : null}
    </motion.div>
  )
}

