import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AxiosError } from 'axios'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import * as essayApi from '../../api/essay'

export default function AdminEssayAnswerDetailsPage() {
  const { answerId = '' } = useParams()
  const queryClient = useQueryClient()
  const [notes, setNotes] = useState('')
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
    queryKey: ['admin-essay-answer', answerId],
    queryFn: () => essayApi.adminGetEssayAnswer(answerId),
    enabled: Boolean(answerId),
  })

  const answer = data?.data

  const reviews = useMemo(() => answer?.reviews ?? [], [answer])

  const errorMessage =
    error instanceof AxiosError
      ? error.response?.data?.message ?? 'Failed to load answer.'
      : error
        ? 'Failed to load answer.'
        : ''

  const reviewMutation = useMutation({
    mutationFn: (payload: { notes: string }) =>
      essayApi.adminAddEssayAnswerReview(answerId, payload),
    onSuccess: async () => {
      setNotes('')
      setToast({ message: 'Review sent successfully.', tone: 'success' })
      await queryClient.invalidateQueries({ queryKey: ['admin-essay-answer', answerId] })
      await queryClient.invalidateQueries({ queryKey: ['admin-essay-answers'] })
    },
    onError: (err) => {
      const message =
        err instanceof AxiosError
          ? err.response?.data?.message ?? 'Failed to send review.'
          : 'Failed to send review.'
      setToast({ message, tone: 'error' })
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
            <h2>Answer details</h2>
            <p className="muted">Read the submission and add feedback notes.</p>
          </div>
          <Link className="button ghost" to="/essay-answers">
            Back
          </Link>
        </div>

        {errorMessage ? <p className="error-text">{errorMessage}</p> : null}

        {isLoading ? (
          <p className="muted">Loading answer...</p>
        ) : answer ? (
          <>
            <section className="grid two-col">
              <div>
                <p className="eyebrow">Student</p>
                <p className="list-title">
                  {answer.student?.fullName ?? answer.studentId}
                </p>
                <p className="muted">{answer.student?.email ?? ''}</p>
              </div>
              <div>
                <p className="eyebrow">Question</p>
                <p className="list-title">
                  {answer.question?.title ?? answer.questionId}
                </p>
                <p className="muted">
                  {answer.updatedAt ? new Date(answer.updatedAt).toLocaleString() : ''}
                </p>
              </div>
            </section>

            <div className="card" style={{ marginTop: 16 }}>
              <h3>Student answer</h3>
              <p className="muted" style={{ whiteSpace: 'pre-wrap' }}>
                {answer.answerText || '—'}
              </p>
            </div>

            <div className="card" style={{ marginTop: 16 }}>
              <h3>Reviews</h3>
              {reviews.length ? (
                <div className="list">
                  {reviews.map((review, index) => (
                    <div key={`${review.id ?? index}`} className="list-row">
                      <div>
                        <p className="list-title">{review.notes}</p>
                        <p className="muted">
                          {review.createdAt
                            ? new Date(review.createdAt).toLocaleString()
                            : ''}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="muted">No reviews yet.</p>
              )}
            </div>

            <form
              className="form"
              style={{ marginTop: 16 }}
              onSubmit={(event) => {
                event.preventDefault()
                const trimmed = notes.trim()
                if (!trimmed) {
                  setToast({ message: 'Please enter notes.', tone: 'error' })
                  return
                }
                reviewMutation.mutate({ notes: trimmed })
              }}
            >
              <label className="field">
                Notes
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  rows={4}
                  placeholder="Write feedback for the student..."
                  required
                />
              </label>
              <button className="button primary" type="submit">
                {reviewMutation.isPending ? 'Sending...' : 'Send review'}
              </button>
            </form>
          </>
        ) : (
          <p className="muted">Answer not found.</p>
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

