import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AxiosError } from 'axios'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import * as essayApi from '../../api/essay'

export default function StudentEssayQuestionPage() {
  const { courseId = '', questionId = '' } = useParams()
  const queryClient = useQueryClient()

  const [answerText, setAnswerText] = useState('')
  const [toast, setToast] = useState<{
    message: string
    tone: 'success' | 'error'
  } | null>(null)

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 5000)
    return () => window.clearTimeout(timer)
  }, [toast])

  const { data: questionsData, isLoading: isQuestionsLoading } = useQuery({
    queryKey: ['essay-questions', courseId],
    queryFn: () => essayApi.listCourseEssayQuestions(courseId),
    enabled: Boolean(courseId),
  })

  const question = useMemo(
    () => (questionsData?.data ?? []).find((q) => q.id === questionId),
    [questionsData, questionId],
  )

  const {
    data: myAnswerData,
    isLoading: isMyAnswerLoading,
    error: myAnswerError,
  } = useQuery({
    queryKey: ['my-essay-answer', { courseId, questionId }],
    queryFn: () => essayApi.getMyEssayAnswer(courseId, questionId),
    enabled: Boolean(courseId && questionId),
  })

  const myAnswer = myAnswerData?.data

  useEffect(() => {
    if (myAnswer?.answerText !== undefined) {
      setAnswerText(myAnswer.answerText ?? '')
    }
  }, [myAnswer?.answerText])

  const submitMutation = useMutation({
    mutationFn: (payload: { answerText: string }) =>
      essayApi.upsertMyEssayAnswer(courseId, questionId, payload),
    onSuccess: async () => {
      setToast({ message: 'Answer saved successfully.', tone: 'success' })
      await queryClient.invalidateQueries({
        queryKey: ['my-essay-answer', { courseId, questionId }],
      })
    },
    onError: (err) => {
      const message =
        err instanceof AxiosError
          ? err.response?.data?.message ?? 'Failed to save answer.'
          : 'Failed to save answer.'
      setToast({ message, tone: 'error' })
    },
  })

  const myAnswerErrorMessage =
    myAnswerError instanceof AxiosError
      ? myAnswerError.response?.data?.message ?? 'Failed to load your answer.'
      : myAnswerError
        ? 'Failed to load your answer.'
        : ''

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
            <h2>{question?.title ?? 'Essay question'}</h2>
            <p className="muted">Submit your answer and read admin feedback.</p>
          </div>
          <Link
            className="button ghost"
            to={`/learn/courses/${courseId}/essay-questions`}
          >
            Back
          </Link>
        </div>

        {isQuestionsLoading ? (
          <p className="muted">Loading question...</p>
        ) : question ? (
          <div className="card accent">
            <p className="eyebrow">Question</p>
            <p style={{ whiteSpace: 'pre-wrap' }}>{question.question}</p>
            {question.description ? (
              <p className="muted" style={{ whiteSpace: 'pre-wrap' }}>
                {question.description}
              </p>
            ) : null}
          </div>
        ) : (
          <p className="muted">Question not found.</p>
        )}

        {myAnswerErrorMessage ? <p className="error-text">{myAnswerErrorMessage}</p> : null}

        <form
          className="form"
          style={{ marginTop: 16 }}
          onSubmit={(event) => {
            event.preventDefault()
            const trimmed = answerText.trim()
            if (!trimmed) {
              setToast({ message: 'Please write an answer.', tone: 'error' })
              return
            }
            submitMutation.mutate({ answerText: trimmed })
          }}
        >
          <label className="field">
            Your answer
            <textarea
              value={answerText}
              onChange={(event) => setAnswerText(event.target.value)}
              rows={8}
              placeholder="Write your answer..."
              disabled={isMyAnswerLoading}
              required
            />
          </label>
          <button className="button primary" type="submit">
            {submitMutation.isPending ? 'Saving...' : 'Save answer'}
          </button>
        </form>

        <div className="card" style={{ marginTop: 16 }}>
          <h3>Admin reviews</h3>
          {myAnswer?.reviews?.length ? (
            <div className="list">
              {myAnswer.reviews.map((review, index) => (
                <div key={`${review.id ?? index}`} className="list-row">
                  <div>
                    <p className="list-title">{review.notes}</p>
                    <p className="muted">
                      {review.createdAt ? new Date(review.createdAt).toLocaleString() : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="muted">No reviews yet.</p>
          )}
        </div>
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

