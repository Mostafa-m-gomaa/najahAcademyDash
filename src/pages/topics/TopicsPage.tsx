import { useEffect, useState } from 'react'
import { AxiosError } from 'axios'
import { motion } from 'framer-motion'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as coursesApi from '../../api/courses'
import type { Course, Topic } from '../../types/courses'
import StatusBadge from '../../components/StatusBadge'

const getCourseId = (course: { _id?: string; id?: string }) =>
  course._id ?? course.id ?? ''

const getTopicId = (topic: { _id?: string; id?: string }) =>
  topic._id ?? topic.id ?? ''

const getLectureId = (lecture: { _id?: string; id?: string }) =>
  lecture._id ?? lecture.id ?? ''

const apiBaseUrl =
  (import.meta as { env?: { VITE_API_BASE_URL?: string } }).env
    ?.VITE_API_BASE_URL ?? 'http://localhost:5000/api/v1'
const apiOrigin = apiBaseUrl.replace(/\/api\/v1\/?$/, '')

const buildDownloadUrl = (value?: string) => {
  if (!value) return ''
  if (value.startsWith('http')) return value
  if (value.startsWith('/uploads')) return `${apiOrigin}${value}`
  return `${apiOrigin}/uploads/${value}`
}

export default function TopicsPage() {
  const queryClient = useQueryClient()
  const [selectedCourseId, setSelectedCourseId] = useState('')
  const [topicForm, setTopicForm] = useState({ title: '', description: '' })
  const [topicImage, setTopicImage] = useState<File | null>(null)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editForm, setEditForm] = useState({
    topicId: '',
    title: '',
    description: '',
  })
  const [editImage, setEditImage] = useState<File | null>(null)
  const [isDocsOpen, setIsDocsOpen] = useState(false)
  const [docsForm, setDocsForm] = useState({ topicId: '', title: '' })
  const [docsFile, setDocsFile] = useState<File | null>(null)
  const [isLectureOpen, setIsLectureOpen] = useState(false)
  const [lectureForm, setLectureForm] = useState({
    topicId: '',
    title: '',
    videoName: '',
    videoUrl: '',
  })
  const [toast, setToast] = useState<{
    message: string
    tone: 'success' | 'error'
  } | null>(null)
  const [openLecturesTopicId, setOpenLecturesTopicId] = useState('')
  const [isLecturesListOpen, setIsLecturesListOpen] = useState(false)
  const [openDocsTopicId, setOpenDocsTopicId] = useState('')
  const [isDocsListOpen, setIsDocsListOpen] = useState(false)
  const [lectureDeleteTarget, setLectureDeleteTarget] = useState<{
    topicId: string
    lectureId: string
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

  const {
    data: courseData,
    isLoading: isCourseLoading,
    isFetching: isCourseFetching,
  } = useQuery({
    queryKey: ['course', selectedCourseId],
    queryFn: () => coursesApi.getCourse(selectedCourseId),
    enabled: Boolean(selectedCourseId),
  })

  const course = courseData?.data as Course | undefined
  const topics: Topic[] = course?.topics ?? []

  const invalidateTopics = () => {
    queryClient.invalidateQueries({ queryKey: ['course', selectedCourseId] })
    queryClient.invalidateQueries({ queryKey: ['courses'] })
  }

  const addTopicMutation = useMutation({
    mutationFn: () =>
      coursesApi.addTopic(selectedCourseId, {
        title: topicForm.title,
        description: topicForm.description,
        topicImage,
      }),
    onSuccess: () => {
      setTopicForm({ title: '', description: '' })
      setTopicImage(null)
      invalidateTopics()
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
    mutationFn: () =>
      coursesApi.updateTopic(selectedCourseId, editForm.topicId, {
        title: editForm.title || undefined,
        description: editForm.description || undefined,
        topicImage: editImage ?? undefined,
      }),
    onSuccess: () => {
      setIsEditOpen(false)
      setEditImage(null)
      invalidateTopics()
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

  const updateDocsMutation = useMutation({
    mutationFn: () => {
      if (!docsFile) {
        return Promise.reject(new Error('Missing file'))
      }
      return coursesApi.addTopicDocument(selectedCourseId, docsForm.topicId, {
        title: docsForm.title,
        file: docsFile,
      })
    },
    onSuccess: () => {
      setIsDocsOpen(false)
      setDocsForm({ topicId: '', title: '' })
      setDocsFile(null)
      invalidateTopics()
      setToast({ message: 'Document uploaded successfully.', tone: 'success' })
    },
    onError: (error) => {
      const message =
        error instanceof AxiosError
          ? error.response?.data?.message ?? 'Failed to upload documents.'
          : 'Failed to upload documents.'
      setToast({ message, tone: 'error' })
    },
  })

  const deleteTopicMutation = useMutation({
    mutationFn: (topicId: string) =>
      coursesApi.deleteTopic(selectedCourseId, topicId),
    onSuccess: () => {
      invalidateTopics()
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

  const deleteLectureMutation = useMutation({
    mutationFn: (payload: { topicId: string; lectureId: string }) =>
      coursesApi.deleteLecture(
        selectedCourseId,
        payload.topicId,
        payload.lectureId,
      ),
    onSuccess: () => {
      invalidateTopics()
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

  const deleteDocumentMutation = useMutation({
    mutationFn: (payload: { topicId: string; documentId: string }) =>
      coursesApi.deleteTopicDocument(
        selectedCourseId,
        payload.topicId,
        payload.documentId,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['topic-docs', selectedCourseId, openDocsTopicId],
      })
      setToast({ message: 'Document deleted successfully.', tone: 'success' })
    },
    onError: (error) => {
      const message =
        error instanceof AxiosError
          ? error.response?.data?.message ?? 'Failed to delete document.'
          : 'Failed to delete document.'
      setToast({ message, tone: 'error' })
    },
  })

  const addLectureMutation = useMutation({
    mutationFn: () =>
      coursesApi.addLecture(selectedCourseId, lectureForm.topicId, {
        title: lectureForm.title,
        videoName: lectureForm.videoName,
        videoUrl: lectureForm.videoUrl,
      }),
    onSuccess: () => {
      setIsLectureOpen(false)
      setLectureForm({ topicId: '', title: '', videoName: '', videoUrl: '' })
      invalidateTopics()
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

  const openEdit = (topic: Topic) => {
    setEditForm({
      topicId: getTopicId(topic),
      title: topic.title ?? '',
      description: topic.description ?? '',
    })
    setEditImage(null)
    setIsEditOpen(true)
  }

  const openLectureModal = (topicId?: string) => {
    if (!topicId) {
      setToast({ message: 'Missing topic for this lecture.', tone: 'error' })
      return
    }
    setLectureForm({
      topicId: topicId ?? '',
      title: '',
      videoName: '',
      videoUrl: '',
    })
    setIsLectureOpen(true)
  }

  const openDocsModal = (topicId?: string) => {
    if (!topicId) {
      setToast({
        message: 'Missing topic for documents upload.',
        tone: 'error',
      })
      return
    }
    setDocsForm({ topicId: topicId ?? '', title: '' })
    setDocsFile(null)
    setIsDocsOpen(true)
  }

  const openLecturesModal = (topicId: string) => {
    setOpenLecturesTopicId(topicId)
    setIsLecturesListOpen(true)
  }

  const openDocsListModal = (topicId: string) => {
    setOpenDocsTopicId(topicId)
    setIsDocsListOpen(true)
  }

  const { data: docsData, isLoading: isDocsLoading } = useQuery({
    queryKey: ['topic-docs', selectedCourseId, openDocsTopicId],
    queryFn: () => coursesApi.getTopicDocuments(selectedCourseId, openDocsTopicId),
    enabled: Boolean(selectedCourseId && openDocsTopicId && isDocsListOpen),
  })

  const topicDocuments = docsData?.data ?? []

  return (
    <motion.div
      className="page"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
    >
      <section className="card">
        <div className="card-header">
          <div>
            <h2>Topics manager</h2>
            <p className="muted">
              Select a course to manage topics and lectures.
            </p>
          </div>
          <div className="form" style={{ minWidth: 220 }}>
            <label className="field">
              Course
              <select
                value={selectedCourseId}
                onChange={(event) => setSelectedCourseId(event.target.value)}
              >
                {courses.map((item) => (
                  <option key={getCourseId(item)} value={getCourseId(item)}>
                    {item.title}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
        {isCoursesLoading ? (
          <p className="muted">Loading courses...</p>
        ) : courses.length === 0 ? (
          <p className="muted">No courses available.</p>
        ) : null}
      </section>

      <section className="grid two-col">
        <div className="card">
          <div className="card-header">
            <div>
              <h3>Topics list</h3>
              <p className="muted">
                {course?.title ?? 'Select a course'}
              </p>
            </div>
            <div className="chip">
              {isCourseFetching ? 'Syncing...' : `${topics.length} topics`}
            </div>
          </div>
          {isCourseLoading ? (
            <p className="muted">Loading topics...</p>
          ) : topics.length ? (
            <div className="list">
              {topics.map((topic) => (
                <div key={getTopicId(topic)} className="list-row">
                  <div>
                    <p className="list-title">{topic.title}</p>
                    <p className="muted">
                      {topic.description ?? 'No description'}
                    </p>
                  </div>
                  <div className="list-meta">
                    <StatusBadge
                      label={`${topic.lectures?.length ?? 0} lectures`}
                      tone="muted"
                    />
                    <button
                      className="button ghost"
                      type="button"
                      onClick={() => openLecturesModal(getTopicId(topic))}
                    >
                      View lectures
                    </button>
                    <button
                      className="button ghost"
                      type="button"
                      onClick={() => openDocsListModal(getTopicId(topic))}
                    >
                      View documents
                    </button>
                    <button
                      className="button ghost"
                      type="button"
                      onClick={() => openEdit(topic)}
                    >
                      Edit
                    </button>
                    <button
                      className="button ghost"
                      type="button"
                      onClick={() => openDocsModal(getTopicId(topic))}
                    >
                      Upload docs
                    </button>
                    <button
                      className="button ghost"
                      type="button"
                      onClick={() => openLectureModal(getTopicId(topic))}
                    >
                      Add lecture
                    </button>
                    <button
                      className="button danger"
                      type="button"
                      onClick={() => {
                        const confirmed = window.confirm(
                          'Are you sure you want to delete this topic?',
                        )
                        if (confirmed) {
                          deleteTopicMutation.mutate(getTopicId(topic))
                        }
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="muted">No topics yet for this course.</p>
          )}
        </div>

        <div className="card">
          <h3>Add topic</h3>
          <form
            className="form"
            onSubmit={(event) => {
              event.preventDefault()
              if (!selectedCourseId) return
              addTopicMutation.mutate()
            }}
          >
            <label className="field">
              Title
              <input
                value={topicForm.title}
                onChange={(event) =>
                  setTopicForm((prev) => ({
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
                value={topicForm.description}
                onChange={(event) =>
                  setTopicForm((prev) => ({
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
            <button className="button primary" type="submit">
              {addTopicMutation.isPending ? 'Adding...' : 'Add topic'}
            </button>
          </form>
        </div>
      </section>

      {isEditOpen ? (
        <div className="modal-backdrop" role="presentation">
          <div className="modal" role="dialog" aria-modal="true">
            <div className="modal-header">
              <div>
                <p className="eyebrow">Edit topic</p>
                <h2>{editForm.title || 'Topic details'}</h2>
              </div>
              <button
                className="button ghost"
                type="button"
                onClick={() => setIsEditOpen(false)}
              >
                Close
              </button>
            </div>
            <form
              className="form"
              onSubmit={(event) => {
                event.preventDefault()
                updateTopicMutation.mutate()
              }}
            >
              <label className="field">
                Title
                <input
                  value={editForm.title}
                  onChange={(event) =>
                    setEditForm((prev) => ({
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
                  value={editForm.description}
                  onChange={(event) =>
                    setEditForm((prev) => ({
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
                    setEditImage(event.target.files?.[0] ?? null)
                  }
                />
              </label>
              <div className="modal-actions">
                <button className="button primary" type="submit">
                  {updateTopicMutation.isPending ? 'Saving...' : 'Save changes'}
                </button>
                <button
                  className="button ghost"
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {isLectureOpen ? (
        <div className="modal-backdrop" role="presentation">
          <div className="modal" role="dialog" aria-modal="true">
            <div className="modal-header">
              <div>
                <p className="eyebrow">Add lecture</p>
                <h2>New lecture</h2>
              </div>
              <button
                className="button ghost"
                type="button"
                onClick={() => setIsLectureOpen(false)}
              >
                Close
              </button>
            </div>
            <form
              className="form"
              onSubmit={(event) => {
                event.preventDefault()
                if (!lectureForm.topicId) {
                  setToast({
                    message: 'Missing topic for this lecture.',
                    tone: 'error',
                  })
                  return
                }
                addLectureMutation.mutate()
              }}
            >
              <label className="field">
                Title
                <input
                  value={lectureForm.title}
                  onChange={(event) =>
                    setLectureForm((prev) => ({
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
                  value={lectureForm.videoName}
                  onChange={(event) =>
                    setLectureForm((prev) => ({
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
                  value={lectureForm.videoUrl}
                  onChange={(event) =>
                    setLectureForm((prev) => ({
                      ...prev,
                      videoUrl: event.target.value,
                    }))
                  }
                  required
                />
              </label>
              <div className="modal-actions">
                <button className="button primary" type="submit">
                  {addLectureMutation.isPending ? 'Adding...' : 'Add lecture'}
                </button>
                <button
                  className="button ghost"
                  type="button"
                  onClick={() => setIsLectureOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {isDocsOpen ? (
        <div className="modal-backdrop" role="presentation">
          <div className="modal" role="dialog" aria-modal="true">
            <div className="modal-header">
              <div>
                <p className="eyebrow">Topic documents</p>
                <h2>Upload documents</h2>
              </div>
              <button
                className="button ghost"
                type="button"
                onClick={() => setIsDocsOpen(false)}
              >
                Close
              </button>
            </div>
            <form
              className="form"
              onSubmit={(event) => {
                event.preventDefault()
                if (!docsForm.topicId) {
                  setToast({
                    message: 'Missing topic for documents upload.',
                    tone: 'error',
                  })
                  return
                }
                if (!docsForm.title.trim()) {
                  setToast({
                    message: 'Please enter a document title.',
                    tone: 'error',
                  })
                  return
                }
                if (!docsFile) {
                  setToast({
                    message: 'Please choose a document file.',
                    tone: 'error',
                  })
                  return
                }
                updateDocsMutation.mutate()
              }}
            >
              <label className="field">
                Title
                <input
                  value={docsForm.title}
                  onChange={(event) =>
                    setDocsForm((prev) => ({
                      ...prev,
                      title: event.target.value,
                    }))
                  }
                  required
                />
              </label>
              <label className="field">
                Documents
                <input
                  type="file"
                  onChange={(event) =>
                    setDocsFile(event.target.files?.[0] ?? null)
                  }
                  required
                />
              </label>
              <div className="modal-actions">
                <button className="button primary" type="submit">
                  {updateDocsMutation.isPending ? 'Uploading...' : 'Upload'}
                </button>
                <button
                  className="button ghost"
                  type="button"
                  onClick={() => setIsDocsOpen(false)}
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
      {isLecturesListOpen ? (
        <div className="modal-backdrop" role="presentation">
          <div className="modal" role="dialog" aria-modal="true">
            <div className="modal-header">
              <div>
                <p className="eyebrow">Lectures</p>
                <h2>Topic lectures</h2>
              </div>
              <button
                className="button ghost"
                type="button"
                onClick={() => setIsLecturesListOpen(false)}
              >
                Close
              </button>
            </div>
            <div className="list">
              {topics
                .find((topic) => getTopicId(topic) === openLecturesTopicId)
                ?.lectures?.length ? (
                topics
                  .find((topic) => getTopicId(topic) === openLecturesTopicId)
                  ?.lectures?.map((lecture) => (
                    <div key={getLectureId(lecture)} className="list-row">
                      <div>
                        <p className="list-title">{lecture.title}</p>
                        <p className="muted">
                          {lecture.videoName ?? 'Video'}
                        </p>
                      </div>
                      <div className="list-meta">
                        {lecture.videoUrl ? (
                          <a
                            className="link"
                            href={lecture.videoUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Open video
                          </a>
                        ) : null}
                        <button
                          className="button danger"
                          type="button"
                          onClick={() =>
                            setLectureDeleteTarget({
                              topicId: openLecturesTopicId,
                              lectureId: getLectureId(lecture),
                            })
                          }
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
              ) : (
                <p className="muted">No lectures for this topic.</p>
              )}
            </div>
          </div>
        </div>
      ) : null}
      {isDocsListOpen ? (
        <div className="modal-backdrop" role="presentation">
          <div className="modal" role="dialog" aria-modal="true">
            <div className="modal-header">
              <div>
                <p className="eyebrow">Documents</p>
                <h2>Topic documents</h2>
              </div>
              <button
                className="button ghost"
                type="button"
                onClick={() => setIsDocsListOpen(false)}
              >
                Close
              </button>
            </div>
            {isDocsLoading ? (
              <p className="muted">Loading documents...</p>
            ) : topicDocuments.length ? (
              <div className="list">
                {topicDocuments.map((doc, index) => {
                  if (typeof doc === 'string') {
                    const url = buildDownloadUrl(doc)
                    return (
                      <div key={`${doc}-${index}`} className="list-row">
                        <p className="list-title">{doc}</p>
                        <div className="list-meta">
                          <button
                            className="button ghost"
                            type="button"
                            onClick={() => {
                              if (!url) {
                                setToast({
                                  message: 'Download link not available.',
                                  tone: 'error',
                                })
                                return
                              }
                              window.open(url, '_blank', 'noopener,noreferrer')
                            }}
                          >
                            Download
                          </button>
                        </div>
                      </div>
                    )
                  }
                  const title = doc.title ?? doc.fileName ?? 'Document'
                  const url = buildDownloadUrl(
                    doc.fileUrl ?? doc.url ?? doc.path ?? doc.fileName,
                  )
                  const documentId = doc._id ?? doc.id
                  return (
                    <div key={`${title}-${index}`} className="list-row">
                      <p className="list-title">{title}</p>
                      <div className="list-meta">
                        <button
                          className="button ghost"
                          type="button"
                          onClick={() => {
                            if (!url) {
                              setToast({
                                message: 'Download link not available.',
                                tone: 'error',
                              })
                              return
                            }
                            window.open(url, '_blank', 'noopener,noreferrer')
                          }}
                        >
                          Download
                        </button>
                        {documentId ? (
                          <button
                            className="button danger"
                            type="button"
                            onClick={() => {
                              deleteDocumentMutation.mutate({
                                topicId: openDocsTopicId,
                                documentId,
                              })
                            }}
                          >
                            Delete
                          </button>
                        ) : null}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="muted">No documents for this topic.</p>
            )}
          </div>
        </div>
      ) : null}
      {lectureDeleteTarget ? (
        <div className="modal-backdrop" role="presentation">
          <div className="modal" role="dialog" aria-modal="true">
            <div className="modal-header">
              <div>
                <p className="eyebrow">Confirm delete</p>
                <h2>Delete lecture?</h2>
              </div>
              <button
                className="button ghost"
                type="button"
                onClick={() => setLectureDeleteTarget(null)}
              >
                Close
              </button>
            </div>
            <p className="muted">
              This will permanently delete the lecture from the topic.
            </p>
            <div className="modal-actions">
              <button
                className="button danger"
                type="button"
                onClick={() => {
                  deleteLectureMutation.mutate(lectureDeleteTarget)
                  setLectureDeleteTarget(null)
                }}
              >
                Confirm delete
              </button>
              <button
                className="button ghost"
                type="button"
                onClick={() => setLectureDeleteTarget(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </motion.div>
  )
}
