import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AxiosError } from 'axios'
import * as coursesApi from '../../api/courses'
import { formatCurrency } from '../../lib/format'
import StatusBadge from '../../components/StatusBadge'

export default function CoursesPage() {
  const queryClient = useQueryClient()
  const [createForm, setCreateForm] = useState({
    title: '',
    description: '',
    price: '',
    isPublished: false,
  })
  const [createImage, setCreateImage] = useState<File | null>(null)
  const [editForm, setEditForm] = useState<{
    courseId: string
    title: string
    description: string
    price: string
    isPublished: boolean
  }>({
    courseId: '',
    title: '',
    description: '',
    price: '',
    isPublished: false,
  })
  const [editImage, setEditImage] = useState<File | null>(null)
  const [isEditOpen, setIsEditOpen] = useState(false)
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
    queryKey: ['courses'],
    queryFn: coursesApi.listCourses,
  })

  const courses = data?.data ?? []

  const createMutation = useMutation({
    mutationFn: coursesApi.createCourse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] })
      setToast({ message: 'Course created successfully.', tone: 'success' })
    },
    onError: (error) => {
      const message =
        error instanceof AxiosError
          ? error.response?.data?.message ?? 'Failed to create course.'
          : 'Failed to create course.'
      setToast({ message, tone: 'error' })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ courseId, ...payload }: typeof editForm) =>
      coursesApi.updateCourse(courseId, {
        title: payload.title || undefined,
        description: payload.description || undefined,
        price: payload.price ? Number(payload.price) : undefined,
        isPublished: payload.isPublished,
        courseImage: editImage ?? undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] })
      setIsEditOpen(false)
      setEditImage(null)
      setToast({ message: 'Course updated successfully.', tone: 'success' })
    },
    onError: (error) => {
      const message =
        error instanceof AxiosError
          ? error.response?.data?.message ?? 'Failed to update course.'
          : 'Failed to update course.'
      setToast({ message, tone: 'error' })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (courseId: string) => coursesApi.deleteCourse(courseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] })
      setToast({ message: 'Course deleted successfully.', tone: 'success' })
    },
    onError: (error) => {
      const message =
        error instanceof AxiosError
          ? error.response?.data?.message ?? 'Failed to delete course.'
          : 'Failed to delete course.'
      setToast({ message, tone: 'error' })
    },
  })

  const getCourseId = (course: { _id?: string; id?: string }) =>
    course._id ?? course.id ?? ''

  const openEditModal = (course: {
    _id?: string
    id?: string
    title: string
    description?: string
    price: number
    isPublished?: boolean
  }) => {
    const courseId = getCourseId(course)
    if (!courseId) {
      setToast({
        message: 'Course ID is missing. Cannot edit this course.',
        tone: 'error',
      })
      return
    }
    setEditForm({
      courseId,
      title: course.title ?? '',
      description: course.description ?? '',
      price: String(course.price ?? ''),
      isPublished: Boolean(course.isPublished),
    })
    setEditImage(null)
    setIsEditOpen(true)
  }

  return (
    <motion.div
      className="page"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
    >
      <section className="grid two-col">
        <div className="card">
          <div className="card-header">
            <div>
              <h2>Course catalog</h2>
              <p className="muted">Publish and organize learning paths.</p>
            </div>
          </div>
          {isLoading ? (
            <p className="muted">Loading courses...</p>
          ) : courses.length ? (
            <div className="list">
              {courses.map((course) => (
                <div
                  key={getCourseId(course)}
                  className="list-row"
                >
                  <div>
                    <p className="list-title">{course.title}</p>
                    <p className="muted">{course.description ?? 'No summary'}</p>
                    <Link
                      className="link"
                      to={`/courses/${course._id}`}
                    >
                      View details
                    </Link>
                  </div>
                  <div className="list-meta">
                    <StatusBadge
                      label={course.isPublished ? 'Published' : 'Draft'}
                      tone={course.isPublished ? 'success' : 'muted'}
                    />
                    <span className="price">{formatCurrency(course.price)}</span>
                    <button
                      className="button ghost"
                      type="button"
                      onClick={() => openEditModal(course)}
                    >
                      Edit
                    </button>
                    <button
                      className="button danger"
                      type="button"
                      onClick={() => {
                        const courseId = getCourseId(course)
                        if (!courseId) {
                          setToast({
                            message:
                              'Course ID is missing. Cannot delete this course.',
                            tone: 'error',
                          })
                          return
                        }
                        const confirmed = window.confirm(
                          'Are you sure you want to delete this course?',
                        )
                        if (confirmed) {
                          deleteMutation.mutate(courseId)
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
            <p className="muted">No courses found.</p>
          )}
        </div>

        <div className="stack">
          <div className="card">
            <h3>Create course</h3>
            <form
              className="form"
              onSubmit={(event) => {
                event.preventDefault()
                createMutation.mutate({
                  title: createForm.title,
                  description: createForm.description,
                  price: Number(createForm.price),
                  isPublished: createForm.isPublished,
                  courseImage: createImage,
                })
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
              <label className="field">
                Description
                <textarea
                  value={createForm.description}
                  onChange={(event) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      description: event.target.value,
                    }))
                  }
                  rows={3}
                  required
                />
              </label>
              <label className="field">
                Price
                <input
                  type="number"
                  value={createForm.price}
                  onChange={(event) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      price: event.target.value,
                    }))
                  }
                  required
                />
              </label>
              <label className="field">
                Course image
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) =>
                    setCreateImage(event.target.files?.[0] ?? null)
                  }
                />
              </label>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={createForm.isPublished}
                  onChange={(event) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      isPublished: event.target.checked,
                    }))
                  }
                />
                Publish now
              </label>
              <button className="button primary" type="submit">
                {createMutation.isPending ? 'Creating...' : 'Create'}
              </button>
            </form>
          </div>
        </div>
      </section>

      {isEditOpen ? (
        <div className="modal-backdrop" role="presentation">
          <div className="modal" role="dialog" aria-modal="true">
            <div className="modal-header">
              <div>
                <p className="eyebrow">Edit course</p>
                <h2>{editForm.title || 'Course details'}</h2>
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
                updateMutation.mutate(editForm)
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
                Price
                <input
                  type="number"
                  value={editForm.price}
                  onChange={(event) =>
                    setEditForm((prev) => ({
                      ...prev,
                      price: event.target.value,
                    }))
                  }
                  required
                />
              </label>
              <label className="field">
                Course image
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) =>
                    setEditImage(event.target.files?.[0] ?? null)
                  }
                />
              </label>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={editForm.isPublished}
                  onChange={(event) =>
                    setEditForm((prev) => ({
                      ...prev,
                      isPublished: event.target.checked,
                    }))
                  }
                />
                Published
              </label>
              <div className="modal-actions">
                <button className="button primary" type="submit">
                  {updateMutation.isPending ? 'Saving...' : 'Save changes'}
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
