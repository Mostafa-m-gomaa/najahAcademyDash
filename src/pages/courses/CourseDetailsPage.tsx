import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AxiosError } from 'axios'
import * as coursesApi from '../../api/courses'
import * as essayApi from '../../api/essay'
import StatusBadge from '../../components/StatusBadge'
import { formatCurrency } from '../../lib/format'
import type { EssayQuestion } from '../../types/essay'

export default function CourseDetailsPage() {
  const queryClient = useQueryClient()
  const { courseId = '' } = useParams()
  const [topicCreate, setTopicCreate] = useState({
    title: '',
    description: '',
  })
  const [topicImage, setTopicImage] = useState<File | null>(null)
  const [topicDocs, setTopicDocs] = useState<File[]>([])
  const [topicUpdate, setTopicUpdate] = useState({
    topicId: '',
    title: '',
    description: '',
  })
  const [topicUpdateImage, setTopicUpdateImage] = useState<File | null>(null)
  const [topicUpdateDocs, setTopicUpdateDocs] = useState<File[]>([])
  const [topicDeleteId, setTopicDeleteId] = useState('')
  const [lectureCreate, setLectureCreate] = useState({
    topicId: '',
    title: '',
    videoName: '',
    videoUrl: '',
  })
  const [lectureUpdate, setLectureUpdate] = useState({
    topicId: '',
    lectureId: '',
    title: '',
    videoName: '',
    videoUrl: '',
  })
  const [lectureDelete, setLectureDelete] = useState({
    topicId: '',
    lectureId: '',
  })
  const [essayCreate, setEssayCreate] = useState({
    title: '',
    question: '',
    description: '',
  })
  const [essayEdit, setEssayEdit] = useState<{
    questionId: string
    title: string
    question: string
    description: string
    isActive: boolean
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

  const { data, isLoading } = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => coursesApi.getCourse(courseId),
    enabled: Boolean(courseId),
  })

  const course = data?.data
  const topics = course?.topics ?? []

  const { data: essayQuestionsData, isLoading: isEssayLoading } = useQuery({
    queryKey: ['admin-essay-questions', courseId],
    queryFn: () => essayApi.adminListEssayQuestions(courseId),
    enabled: Boolean(courseId),
  })

  const essayQuestions = essayQuestionsData?.data ?? []

  const lectures = useMemo(
    () =>
      topics.flatMap((topic) =>
        (topic.lectures ?? []).map((lecture) => ({
          ...lecture,
          topicId: topic._id,
          topicTitle: topic.title,
        })),
      ),
    [topics],
  )

  const invalidateCourse = () => {
    queryClient.invalidateQueries({ queryKey: ['course', courseId] })
    queryClient.invalidateQueries({ queryKey: ['courses'] })
  }

  const invalidateEssay = () => {
    queryClient.invalidateQueries({
      queryKey: ['admin-essay-questions', courseId],
    })
  }

  const addTopicMutation = useMutation({
    mutationFn: (payload: typeof topicCreate) =>
      coursesApi.addTopic(courseId, {
        ...payload,
        topicImage,
        topicDocuments: topicDocs,
      }),
    onSuccess: () => {
      invalidateCourse()
      setToast({ message: 'Topic added successfully.', tone: 'success' })
    },
    onError: (error) => {
      const message =
        error instanceof AxiosError
          ? error.response?.data?.message ?? 'Failed to add topic.'
          : 'Failed to add topic.'
      setToast({ message, tone: 'error' })
    },
  })

  const updateTopicMutation = useMutation({
    mutationFn: (payload: typeof topicUpdate) =>
      coursesApi.updateTopic(courseId, payload.topicId, {
        title: payload.title || undefined,
        description: payload.description || undefined,
        topicImage: topicUpdateImage ?? undefined,
        topicDocuments: topicUpdateDocs,
      }),
    onSuccess: () => {
      invalidateCourse()
      setToast({ message: 'Topic updated successfully.', tone: 'success' })
    },
    onError: (error) => {
      const message =
        error instanceof AxiosError
          ? error.response?.data?.message ?? 'Failed to update topic.'
          : 'Failed to update topic.'
      setToast({ message, tone: 'error' })
    },
  })

  const deleteTopicMutation = useMutation({
    mutationFn: (topicId: string) => coursesApi.deleteTopic(courseId, topicId),
    onSuccess: () => {
      invalidateCourse()
      setToast({ message: 'Topic deleted successfully.', tone: 'success' })
    },
    onError: (error) => {
      const message =
        error instanceof AxiosError
          ? error.response?.data?.message ?? 'Failed to delete topic.'
          : 'Failed to delete topic.'
      setToast({ message, tone: 'error' })
    },
  })

  const addLectureMutation = useMutation({
    mutationFn: (payload: typeof lectureCreate) =>
      coursesApi.addLecture(courseId, payload.topicId, {
        title: payload.title,
        videoName: payload.videoName,
        videoUrl: payload.videoUrl,
      }),
    onSuccess: () => {
      invalidateCourse()
      setToast({ message: 'Lecture added successfully.', tone: 'success' })
    },
    onError: (error) => {
      const message =
        error instanceof AxiosError
          ? error.response?.data?.message ?? 'Failed to add lecture.'
          : 'Failed to add lecture.'
      setToast({ message, tone: 'error' })
    },
  })

  const updateLectureMutation = useMutation({
    mutationFn: (payload: typeof lectureUpdate) =>
      coursesApi.updateLecture(courseId, payload.topicId, payload.lectureId, {
        title: payload.title || undefined,
        videoName: payload.videoName || undefined,
        videoUrl: payload.videoUrl || undefined,
      }),
    onSuccess: () => {
      invalidateCourse()
      setToast({ message: 'Lecture updated successfully.', tone: 'success' })
    },
    onError: (error) => {
      const message =
        error instanceof AxiosError
          ? error.response?.data?.message ?? 'Failed to update lecture.'
          : 'Failed to update lecture.'
      setToast({ message, tone: 'error' })
    },
  })

  const deleteLectureMutation = useMutation({
    mutationFn: (payload: typeof lectureDelete) =>
      coursesApi.deleteLecture(courseId, payload.topicId, payload.lectureId),
    onSuccess: () => {
      invalidateCourse()
      setToast({ message: 'Lecture deleted successfully.', tone: 'success' })
    },
    onError: (error) => {
      const message =
        error instanceof AxiosError
          ? error.response?.data?.message ?? 'Failed to delete lecture.'
          : 'Failed to delete lecture.'
      setToast({ message, tone: 'error' })
    },
  })

  const createEssayMutation = useMutation({
    mutationFn: () =>
      essayApi.adminCreateEssayQuestion(courseId, {
        title: essayCreate.title.trim(),
        question: essayCreate.question.trim(),
        description: essayCreate.description.trim() || undefined,
      }),
    onSuccess: () => {
      setEssayCreate({ title: '', question: '', description: '' })
      invalidateEssay()
      setToast({
        message: 'Essay question created successfully.',
        tone: 'success',
      })
    },
    onError: (error) => {
      const message =
        error instanceof AxiosError
          ? error.response?.data?.message ??
            'Failed to create essay question.'
          : 'Failed to create essay question.'
      setToast({ message, tone: 'error' })
    },
  })

  const updateEssayMutation = useMutation({
    mutationFn: () => {
      if (!essayEdit) {
        return Promise.reject(new Error('No question selected'))
      }
      return essayApi.adminUpdateEssayQuestion(courseId, essayEdit.questionId, {
        title: essayEdit.title.trim() || undefined,
        question: essayEdit.question.trim() || undefined,
        description: essayEdit.description.trim() || undefined,
      })
    },
    onSuccess: () => {
      setEssayEdit(null)
      invalidateEssay()
      setToast({
        message: 'Essay question updated successfully.',
        tone: 'success',
      })
    },
    onError: (error) => {
      const message =
        error instanceof AxiosError
          ? error.response?.data?.message ??
            'Failed to update essay question.'
          : 'Failed to update essay question.'
      setToast({ message, tone: 'error' })
    },
  })

  const disableEssayMutation = useMutation({
    mutationFn: (questionId: string) =>
      essayApi.adminDisableEssayQuestion(courseId, questionId),
    onSuccess: () => {
      invalidateEssay()
      setToast({
        message: 'Essay question disabled successfully.',
        tone: 'success',
      })
    },
    onError: (error) => {
      const message =
        error instanceof AxiosError
          ? error.response?.data?.message ??
            'Failed to disable essay question.'
          : 'Failed to disable essay question.'
      setToast({ message, tone: 'error' })
    },
  })

  if (!courseId) {
    return (
      <div className="page">
        <p className="muted">Course ID missing.</p>
      </div>
    )
  }

  return (
    <motion.div
      className="page"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
    >
      <div className="page-header">
        <div>
          <Link className="link" to="/courses">
            ← Back to courses
          </Link>
          <h2>{course?.title ?? 'Course details'}</h2>
          <p className="muted">{course?.description ?? 'No summary'}</p>
        </div>
        <div className="pill-group">
          <StatusBadge
            label={course?.isPublished ? 'Published' : 'Draft'}
            tone={course?.isPublished ? 'success' : 'muted'}
          />
          <span className="price">
            {course ? formatCurrency(course.price) : '--'}
          </span>
        </div>
      </div>

      {isLoading ? (
        <p className="muted">Loading course...</p>
      ) : (
        <section className="grid two-col">
          <div className="card">
            <h3>Topics</h3>
            {topics.length ? (
              <div className="list">
                {topics.map((topic) => (
                  <div key={topic._id} className="list-row">
                    <div>
                      <p className="list-title">{topic.title}</p>
                      <p className="muted">{topic.description ?? 'No details'}</p>
                    </div>
                    <div className="list-meta">
                      <span className="badge badge-muted">
                        {topic.lectures?.length ?? 0} lectures
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="muted">No topics yet.</p>
            )}
          </div>

          <div className="card">
            <h3>Lectures</h3>
            {lectures.length ? (
              <div className="list">
                {lectures.map((lecture) => (
                  <div key={lecture._id} className="list-row">
                    <div>
                      <p className="list-title">{lecture.title}</p>
                      <p className="muted">{lecture.topicTitle}</p>
                    </div>
                    <div className="list-meta">
                      <span className="badge badge-muted">{lecture.videoName}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="muted">No lectures yet.</p>
            )}
          </div>
        </section>
      )}

      <section className="grid three-col">
        <div className="card">
          <h3>Add topic</h3>
          <form
            className="form"
            onSubmit={(event) => {
              event.preventDefault()
              addTopicMutation.mutate(topicCreate)
            }}
          >
            <label className="field">
              Title
              <input
                value={topicCreate.title}
                onChange={(event) =>
                  setTopicCreate((prev) => ({
                    ...prev,
                    title: event.target.value,
                  }))
                }
                required
              />
            </label>
            <label className="field">
              Description
              <textarea
                value={topicCreate.description}
                onChange={(event) =>
                  setTopicCreate((prev) => ({
                    ...prev,
                    description: event.target.value,
                  }))
                }
                rows={3}
                required
              />
            </label>
            <label className="field">
              Topic image
              <input
                type="file"
                accept="image/*"
                onChange={(event) =>
                  setTopicImage(event.target.files?.[0] ?? null)
                }
              />
            </label>
            <label className="field">
              Topic documents
              <input
                type="file"
                multiple
                onChange={(event) =>
                  setTopicDocs(Array.from(event.target.files ?? []))
                }
              />
            </label>
            <button className="button primary" type="submit">
              {addTopicMutation.isPending ? 'Adding...' : 'Add topic'}
            </button>
          </form>
        </div>

        <div className="card">
          <h3>Update or delete topic</h3>
          <form
            className="form"
            onSubmit={(event) => {
              event.preventDefault()
              updateTopicMutation.mutate(topicUpdate)
            }}
          >
            <label className="field">
              Topic ID
              <input
                value={topicUpdate.topicId}
                onChange={(event) =>
                  setTopicUpdate((prev) => ({
                    ...prev,
                    topicId: event.target.value,
                  }))
                }
                required
              />
            </label>
            <label className="field">
              Title
              <input
                value={topicUpdate.title}
                onChange={(event) =>
                  setTopicUpdate((prev) => ({
                    ...prev,
                    title: event.target.value,
                  }))
                }
              />
            </label>
            <label className="field">
              Description
              <textarea
                value={topicUpdate.description}
                onChange={(event) =>
                  setTopicUpdate((prev) => ({
                    ...prev,
                    description: event.target.value,
                  }))
                }
                rows={3}
              />
            </label>
            <label className="field">
              Topic image
              <input
                type="file"
                accept="image/*"
                onChange={(event) =>
                  setTopicUpdateImage(event.target.files?.[0] ?? null)
                }
              />
            </label>
            <label className="field">
              Topic documents
              <input
                type="file"
                multiple
                onChange={(event) =>
                  setTopicUpdateDocs(Array.from(event.target.files ?? []))
                }
              />
            </label>
            <button className="button ghost" type="submit">
              {updateTopicMutation.isPending ? 'Updating...' : 'Update topic'}
            </button>
          </form>
          <form
            className="form"
            onSubmit={(event) => {
              event.preventDefault()
              deleteTopicMutation.mutate(topicDeleteId)
            }}
          >
            <label className="field">
              Topic ID
              <input
                value={topicDeleteId}
                onChange={(event) => setTopicDeleteId(event.target.value)}
                required
              />
            </label>
            <button className="button danger" type="submit">
              {deleteTopicMutation.isPending ? 'Deleting...' : 'Delete topic'}
            </button>
          </form>
        </div>

        <div className="card">
          <h3>Lecture actions</h3>
          <form
            className="form"
            onSubmit={(event) => {
              event.preventDefault()
              addLectureMutation.mutate(lectureCreate)
            }}
          >
            <label className="field">
              Topic ID
              <input
                value={lectureCreate.topicId}
                onChange={(event) =>
                  setLectureCreate((prev) => ({
                    ...prev,
                    topicId: event.target.value,
                  }))
                }
                required
              />
            </label>
            <label className="field">
              Title
              <input
                value={lectureCreate.title}
                onChange={(event) =>
                  setLectureCreate((prev) => ({
                    ...prev,
                    title: event.target.value,
                  }))
                }
                required
              />
            </label>
            <label className="field">
              Video name
              <input
                value={lectureCreate.videoName}
                onChange={(event) =>
                  setLectureCreate((prev) => ({
                    ...prev,
                    videoName: event.target.value,
                  }))
                }
                required
              />
            </label>
            <label className="field">
              Video URL
              <input
                value={lectureCreate.videoUrl}
                onChange={(event) =>
                  setLectureCreate((prev) => ({
                    ...prev,
                    videoUrl: event.target.value,
                  }))
                }
                required
              />
            </label>
            <button className="button primary" type="submit">
              {addLectureMutation.isPending ? 'Adding...' : 'Add lecture'}
            </button>
          </form>

          <form
            className="form"
            onSubmit={(event) => {
              event.preventDefault()
              updateLectureMutation.mutate(lectureUpdate)
            }}
          >
            <label className="field">
              Topic ID
              <input
                value={lectureUpdate.topicId}
                onChange={(event) =>
                  setLectureUpdate((prev) => ({
                    ...prev,
                    topicId: event.target.value,
                  }))
                }
                required
              />
            </label>
            <label className="field">
              Lecture ID
              <input
                value={lectureUpdate.lectureId}
                onChange={(event) =>
                  setLectureUpdate((prev) => ({
                    ...prev,
                    lectureId: event.target.value,
                  }))
                }
                required
              />
            </label>
            <label className="field">
              Title
              <input
                value={lectureUpdate.title}
                onChange={(event) =>
                  setLectureUpdate((prev) => ({
                    ...prev,
                    title: event.target.value,
                  }))
                }
              />
            </label>
            <label className="field">
              Video name
              <input
                value={lectureUpdate.videoName}
                onChange={(event) =>
                  setLectureUpdate((prev) => ({
                    ...prev,
                    videoName: event.target.value,
                  }))
                }
              />
            </label>
            <label className="field">
              Video URL
              <input
                value={lectureUpdate.videoUrl}
                onChange={(event) =>
                  setLectureUpdate((prev) => ({
                    ...prev,
                    videoUrl: event.target.value,
                  }))
                }
              />
            </label>
            <button className="button ghost" type="submit">
              {updateLectureMutation.isPending ? 'Updating...' : 'Update lecture'}
            </button>
          </form>

          <form
            className="form"
            onSubmit={(event) => {
              event.preventDefault()
              deleteLectureMutation.mutate(lectureDelete)
            }}
          >
            <label className="field">
              Topic ID
              <input
                value={lectureDelete.topicId}
                onChange={(event) =>
                  setLectureDelete((prev) => ({
                    ...prev,
                    topicId: event.target.value,
                  }))
                }
                required
              />
            </label>
            <label className="field">
              Lecture ID
              <input
                value={lectureDelete.lectureId}
                onChange={(event) =>
                  setLectureDelete((prev) => ({
                    ...prev,
                    lectureId: event.target.value,
                  }))
                }
                required
              />
            </label>
            <button className="button danger" type="submit">
              {deleteLectureMutation.isPending ? 'Deleting...' : 'Delete lecture'}
            </button>
          </form>
        </div>
      </section>

      <section className="grid two-col" style={{ marginTop: 16 }}>
        <div className="card">
          <div className="card-header">
            <div>
              <h3>Essay questions</h3>
              <p className="muted">Manage questions for this course.</p>
            </div>
          </div>

          {isEssayLoading ? (
            <p className="muted">Loading essay questions...</p>
          ) : essayQuestions.length ? (
            <div className="list">
              {essayQuestions.map((q: EssayQuestion) => (
                <div key={q.id} className="list-row">
                  <div>
                    <p className="list-title">{q.title}</p>
                    <p className="muted">{q.description ?? 'No description'}</p>
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
                      onClick={() => {
                        setEssayEdit({
                          questionId: q.id,
                          title: q.title ?? '',
                          question: q.question ?? '',
                          description: q.description ?? '',
                          isActive: Boolean(q.isActive),
                        })
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className="button danger"
                      type="button"
                      disabled={!q.isActive || disableEssayMutation.isPending}
                      onClick={() => disableEssayMutation.mutate(q.id)}
                    >
                      {disableEssayMutation.isPending
                        ? 'Disabling...'
                        : 'Disable'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="muted">No essay questions for this course yet.</p>
          )}
        </div>

        <div className="card accent">
          <h3>Add essay question</h3>
          <form
            className="form"
            onSubmit={(event) => {
              event.preventDefault()
              if (!essayCreate.title.trim() || !essayCreate.question.trim()) {
                setToast({
                  message: 'Title and question are required.',
                  tone: 'error',
                })
                return
              }
              createEssayMutation.mutate()
            }}
          >
            <label className="field">
              Title
              <input
                value={essayCreate.title}
                onChange={(event) =>
                  setEssayCreate((prev) => ({
                    ...prev,
                    title: event.target.value,
                  }))
                }
                required
              />
            </label>
            <label className="field">
              Question
              <textarea
                value={essayCreate.question}
                onChange={(event) =>
                  setEssayCreate((prev) => ({
                    ...prev,
                    question: event.target.value,
                  }))
                }
                rows={4}
                required
              />
            </label>
            <label className="field">
              Description (optional)
              <textarea
                value={essayCreate.description}
                onChange={(event) =>
                  setEssayCreate((prev) => ({
                    ...prev,
                    description: event.target.value,
                  }))
                }
                rows={3}
              />
            </label>
            <button className="button primary" type="submit">
              {createEssayMutation.isPending ? 'Adding...' : 'Add question'}
            </button>
          </form>
        </div>
      </section>

      {essayEdit ? (
        <div className="modal-backdrop" role="presentation">
          <div className="modal" role="dialog" aria-modal="true">
            <div className="modal-header">
              <div>
                <p className="eyebrow">Edit essay question</p>
                <h2>{essayEdit.title || 'Question details'}</h2>
              </div>
              <button
                className="button ghost"
                type="button"
                onClick={() => setEssayEdit(null)}
              >
                Close
              </button>
            </div>
            <form
              className="form"
              onSubmit={(event) => {
                event.preventDefault()
                updateEssayMutation.mutate()
              }}
            >
              <label className="field">
                Title
                <input
                  value={essayEdit.title}
                  onChange={(event) =>
                    setEssayEdit((prev) =>
                      prev ? { ...prev, title: event.target.value } : prev,
                    )
                  }
                />
              </label>
              <label className="field">
                Question
                <textarea
                  value={essayEdit.question}
                  onChange={(event) =>
                    setEssayEdit((prev) =>
                      prev ? { ...prev, question: event.target.value } : prev,
                    )
                  }
                  rows={4}
                />
              </label>
              <label className="field">
                Description
                <textarea
                  value={essayEdit.description}
                  onChange={(event) =>
                    setEssayEdit((prev) =>
                      prev
                        ? { ...prev, description: event.target.value }
                        : prev,
                    )
                  }
                  rows={3}
                />
              </label>
              <div className="modal-actions">
                <button className="button primary" type="submit">
                  {updateEssayMutation.isPending ? 'Saving...' : 'Save changes'}
                </button>
                <button
                  className="button ghost"
                  type="button"
                  onClick={() => setEssayEdit(null)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {toast ? (
        <div className={`toast ${toast.tone}`} role="status">
          <span>{toast.message}</span>
          <button
            className="button ghost"
            type="button"
            onClick={() => setToast(null)}
          >
            Dismiss
          </button>
        </div>
      ) : null}
    </motion.div>
  )
}
