import { useEffect, useMemo, useState } from 'react'
import { AxiosError } from 'axios'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import * as coursesApi from '../../api/courses'
import * as essayApi from '../../api/essay'
import RichTextContent from '../../components/RichTextContent'
import RichTextEditor from '../../components/RichTextEditor'
import { isRichTextEmpty, sanitizeRichText } from '../../lib/richText'
import type { Course } from '../../types/courses'
import type { EssayQuestion } from '../../types/essay'

const getCourseId = (course: { _id?: string; id?: string }) =>
  course._id ?? course.id ?? ''

export default function AdminEssayQuestionsPage() {
  const queryClient = useQueryClient()
  const [selectedCourseId, setSelectedCourseId] = useState('')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState({
    title: '',
    question: '',
    description: '',
  })
  const [editState, setEditState] = useState<{
    questionId: string
    title: string
    question: string
    description: string
    isActive: boolean
  } | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{
    questionId: string
    title: string
  } | null>(null)
  const [toast, setToast] = useState<{
    message: string
    tone: 'success' | 'error'
  } | null>(null)

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 5000)
    return () => window.clearTimeout(timer)
  }, [toast])

  const { data: coursesData, isLoading: isCoursesLoading } = useQuery({
    queryKey: ['courses'],
    queryFn: coursesApi.listCourses,
  })

  const courses = coursesData?.data ?? []

  useEffect(() => {
    if (!selectedCourseId && courses.length) {
      setSelectedCourseId(getCourseId(courses[0] as Course))
    }
  }, [courses, selectedCourseId])

  const { data: questionsData, isLoading: isQuestionsLoading } = useQuery({
    queryKey: ['admin-essay-questions', { courseId: selectedCourseId }],
    queryFn: () => essayApi.adminListEssayQuestions(selectedCourseId),
    enabled: Boolean(selectedCourseId),
  })

  const questions = useMemo(() => questionsData?.data ?? [], [questionsData])

  const invalidateQuestions = async () => {
    await queryClient.invalidateQueries({
      queryKey: ['admin-essay-questions', { courseId: selectedCourseId }],
    })
  }

  const createMutation = useMutation({
    mutationFn: () =>
      essayApi.adminCreateEssayQuestion(selectedCourseId, {
        title: createForm.title.trim(),
        question: sanitizeRichText(createForm.question),
        description: isRichTextEmpty(createForm.description)
          ? undefined
          : sanitizeRichText(createForm.description),
      }),
    onSuccess: async () => {
      setCreateForm({ title: '', question: '', description: '' })
      setIsCreateOpen(false)
      await invalidateQuestions()
      setToast({ message: 'Question created successfully.', tone: 'success' })
    },
    onError: (error) => {
      const message =
        error instanceof AxiosError
          ? error.response?.data?.message ?? 'Failed to create question.'
          : 'Failed to create question.'
      setToast({ message, tone: 'error' })
    },
  })

  const updateMutation = useMutation({
    mutationFn: () => {
      if (!editState) {
        return Promise.reject(new Error('No question selected'))
      }
      return essayApi.adminUpdateEssayQuestion(
        selectedCourseId,
        editState.questionId,
        {
          title: editState.title.trim() || undefined,
          question: isRichTextEmpty(editState.question)
            ? undefined
            : sanitizeRichText(editState.question),
          description: isRichTextEmpty(editState.description)
            ? undefined
            : sanitizeRichText(editState.description),
        },
      )
    },
    onSuccess: async () => {
      setEditState(null)
      await invalidateQuestions()
      setToast({ message: 'Question updated successfully.', tone: 'success' })
    },
    onError: (error) => {
      const message =
        error instanceof AxiosError
          ? error.response?.data?.message ?? 'Failed to update question.'
          : 'Failed to update question.'
      setToast({ message, tone: 'error' })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (questionId: string) =>
      essayApi.adminDisableEssayQuestion(selectedCourseId, questionId),
    onSuccess: async () => {
      await invalidateQuestions()
      setToast({ message: 'Question deleted successfully.', tone: 'success' })
    },
    onError: (error) => {
      const message =
        error instanceof AxiosError
          ? error.response?.data?.message ?? 'Failed to delete question.'
          : 'Failed to delete question.'
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
            <h2>Essay questions</h2>
            <p className="muted">Create, edit, and disable questions by course.</p>
          </div>
          <button
            className="button primary"
            type="button"
            onClick={() => setIsCreateOpen(true)}
            disabled={!selectedCourseId}
          >
            Add question
          </button>
        </div>

        <label className="field">
          Course
          <select
            value={selectedCourseId}
            disabled={isCoursesLoading}
            onChange={(event) => setSelectedCourseId(event.target.value)}
          >
            {courses.map((course) => (
              <option key={getCourseId(course)} value={getCourseId(course)}>
                {course.title}
              </option>
            ))}
          </select>
        </label>

        <section className="grid" style={{ marginTop: 12 }}>
          <div className="card">
            <h3>Questions list</h3>
            {isQuestionsLoading ? (
              <p className="muted">Loading questions...</p>
            ) : questions.length ? (
              <div className="list">
                {questions.map((q: EssayQuestion) => (
                  <div key={q.id} className="list-row">
                    <div>
                      <p className="list-title">{q.title}</p>
                      <RichTextContent content={q.question ?? ''} />
                      {q.description ? (
                        <RichTextContent content={q.description} className="muted" />
                      ) : (
                        <p className="muted">No description</p>
                      )}
                    </div>
                    <div className="list-meta">
                      <span
                        className={`badge ${q.isActive ? 'badge-success' : 'badge-muted'}`}
                      >
                        {q.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <button
                        className="button ghost"
                        type="button"
                        onClick={() =>
                          setEditState({
                            questionId: q.id,
                            title: q.title ?? '',
                            question: q.question ?? '',
                            description: q.description ?? '',
                            isActive: Boolean(q.isActive),
                          })
                        }
                      >
                        Edit
                      </button>
                      <button
                        className="button danger"
                        type="button"
                        disabled={deleteMutation.isPending}
                        onClick={() =>
                          setDeleteTarget({
                            questionId: q.id,
                            title: q.title,
                          })
                        }
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="muted">No questions yet for this course.</p>
            )}
          </div>
        </section>
      </div>

      {isCreateOpen ? (
        <div className="modal-backdrop" role="presentation">
          <div className="modal" role="dialog" aria-modal="true">
            <div className="modal-header">
              <div>
                <p className="eyebrow">Add question</p>
                <h2>New essay question</h2>
              </div>
              <button
                className="button ghost"
                type="button"
                onClick={() => setIsCreateOpen(false)}
              >
                Close
              </button>
            </div>
            <form
              className="form"
              onSubmit={(event) => {
                event.preventDefault()
                if (!selectedCourseId) {
                  setToast({ message: 'Please select a course.', tone: 'error' })
                  return
                }
                if (!createForm.title.trim() || isRichTextEmpty(createForm.question)) {
                  setToast({
                    message: 'Title and question are required.',
                    tone: 'error',
                  })
                  return
                }
                createMutation.mutate()
              }}
            >
              <label className="field">
                Title
                <input
                  value={createForm.title}
                  onChange={(event) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      title: event.target.value,
                    }))
                  }
                  required
                />
              </label>
              <div className="field">
                <span>Question</span>
                <RichTextEditor
                  value={createForm.question}
                  onChange={(question) =>
                    setCreateForm((prev) => ({ ...prev, question }))
                  }
                  placeholder="Write the essay question..."
                  minHeight={140}
                />
              </div>
              <div className="field">
                <span>Description (optional)</span>
                <RichTextEditor
                  value={createForm.description}
                  onChange={(description) =>
                    setCreateForm((prev) => ({ ...prev, description }))
                  }
                  placeholder="Add an optional description..."
                  minHeight={120}
                />
              </div>
              <div className="modal-actions">
                <button className="button primary" type="submit">
                  {createMutation.isPending ? 'Adding...' : 'Add question'}
                </button>
                <button
                  className="button ghost"
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {editState ? (
        <div className="modal-backdrop" role="presentation">
          <div className="modal" role="dialog" aria-modal="true">
            <div className="modal-header">
              <div>
                <p className="eyebrow">Edit question</p>
                <h2>{editState.title || 'Question details'}</h2>
              </div>
              <button className="button ghost" type="button" onClick={() => setEditState(null)}>
                Close
              </button>
            </div>
            <form
              className="form"
              onSubmit={(event) => {
                event.preventDefault()
                if (!editState.title.trim() || isRichTextEmpty(editState.question)) {
                  setToast({
                    message: 'Title and question are required.',
                    tone: 'error',
                  })
                  return
                }
                updateMutation.mutate()
              }}
            >
              <label className="field">
                Title
                <input
                  value={editState.title}
                  onChange={(event) =>
                    setEditState((prev) => (prev ? { ...prev, title: event.target.value } : prev))
                  }
                />
              </label>
              <div className="field">
                <span>Question</span>
                <RichTextEditor
                  value={editState.question}
                  onChange={(question) =>
                    setEditState((prev) => (prev ? { ...prev, question } : prev))
                  }
                  placeholder="Write the essay question..."
                  minHeight={140}
                />
              </div>
              <div className="field">
                <span>Description (optional)</span>
                <RichTextEditor
                  value={editState.description}
                  onChange={(description) =>
                    setEditState((prev) => (prev ? { ...prev, description } : prev))
                  }
                  placeholder="Add an optional description..."
                  minHeight={120}
                />
              </div>
              <div className="modal-actions">
                <button className="button primary" type="submit">
                  {updateMutation.isPending ? 'Saving...' : 'Save changes'}
                </button>
                <button className="button ghost" type="button" onClick={() => setEditState(null)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {deleteTarget ? (
        <div className="modal-backdrop" role="presentation">
          <div className="modal" role="dialog" aria-modal="true">
            <div className="modal-header">
              <div>
                <p className="eyebrow">Confirm delete</p>
                <h2>Delete question?</h2>
              </div>
              <button
                className="button ghost"
                type="button"
                onClick={() => setDeleteTarget(null)}
              >
                Close
              </button>
            </div>
            <p className="muted">
              This will delete "{deleteTarget.title}". If the backend uses soft
              delete, it will be marked inactive.
            </p>
            <div className="modal-actions">
              <button
                className="button danger"
                type="button"
                onClick={() => {
                  deleteMutation.mutate(deleteTarget.questionId)
                  setDeleteTarget(null)
                }}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Confirm delete'}
              </button>
              <button
                className="button ghost"
                type="button"
                onClick={() => setDeleteTarget(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}

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
