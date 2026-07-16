import { useEffect, useState, type Dispatch, type SetStateAction } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AxiosError } from 'axios'
import * as coursesApi from '../../api/courses'
import type { CoursePricingPlanInput } from '../../api/courses'
import StatusBadge from '../../components/StatusBadge'
import {
  formatCurrency,
  getCourseStartingPrice,
} from '../../lib/format'
import type { Course, CoursePricingPlan } from '../../types/courses'

type FeatureRow = { key: string; value: string }
type PlanRow = {
  key: string
  id?: string
  durationDays: string
  price: string
}

const newKey = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

const emptyFeature = (): FeatureRow => ({ key: newKey(), value: '' })
const emptyPlan = (): PlanRow => ({
  key: newKey(),
  durationDays: '',
  price: '',
})

const toFeatureRows = (features?: string[]): FeatureRow[] =>
  features?.length
    ? features.map((value) => ({ key: newKey(), value }))
    : [emptyFeature()]

const toPlanRows = (plans?: CoursePricingPlan[]): PlanRow[] =>
  plans?.length
    ? plans.map((plan) => ({
        key: newKey(),
        id: plan.id ?? plan._id,
        durationDays: String(plan.durationDays ?? ''),
        price: String(plan.price ?? ''),
      }))
    : [emptyPlan()]

const validatePricingPlans = (
  rows: PlanRow[],
): { ok: true; plans: CoursePricingPlanInput[] } | { ok: false; message: string } => {
  const filled = rows.filter(
    (row) => row.durationDays.trim() !== '' || row.price.trim() !== '',
  )

  if (!filled.length) {
    return { ok: false, message: 'Add at least one pricing plan.' }
  }

  const plans: CoursePricingPlanInput[] = []
  const seenDays = new Set<number>()

  for (const row of filled) {
    const durationDays = Number(row.durationDays)
    const price = Number(row.price)

    if (!Number.isFinite(durationDays) || durationDays <= 0) {
      return {
        ok: false,
        message: 'Each plan needs durationDays greater than 0.',
      }
    }
    if (!Number.isFinite(price) || price < 0) {
      return { ok: false, message: 'Each plan needs price of 0 or more.' }
    }
    if (seenDays.has(durationDays)) {
      return {
        ok: false,
        message: 'durationDays must be unique across pricing plans.',
      }
    }

    seenDays.add(durationDays)
    plans.push({
      ...(row.id ? { id: row.id } : {}),
      durationDays,
      price,
    })
  }

  return { ok: true, plans }
}

const normalizeFeatures = (rows: FeatureRow[]) =>
  rows.map((row) => row.value.trim()).filter(Boolean)

export default function CoursesPage() {
  const queryClient = useQueryClient()
  const [createForm, setCreateForm] = useState({
    title: '',
    description: '',
    isPublished: false,
  })
  const [createFeatures, setCreateFeatures] = useState<FeatureRow[]>([
    emptyFeature(),
  ])
  const [createPlans, setCreatePlans] = useState<PlanRow[]>([emptyPlan()])
  const [createImage, setCreateImage] = useState<File | null>(null)
  const [editForm, setEditForm] = useState({
    courseId: '',
    title: '',
    description: '',
    isPublished: false,
  })
  const [editFeatures, setEditFeatures] = useState<FeatureRow[]>([
    emptyFeature(),
  ])
  const [editPlans, setEditPlans] = useState<PlanRow[]>([emptyPlan()])
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
      setCreateForm({ title: '', description: '', isPublished: false })
      setCreateFeatures([emptyFeature()])
      setCreatePlans([emptyPlan()])
      setCreateImage(null)
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
    mutationFn: ({
      courseId,
      title,
      description,
      isPublished,
      features,
      pricingPlans,
    }: {
      courseId: string
      title: string
      description: string
      isPublished: boolean
      features: string[]
      pricingPlans: CoursePricingPlanInput[]
    }) =>
      coursesApi.updateCourse(courseId, {
        title: title || undefined,
        description: description || undefined,
        features,
        pricingPlans,
        isPublished,
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

  const openEditModal = (course: Course) => {
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
      isPublished: Boolean(course.isPublished),
    })
    setEditFeatures(toFeatureRows(course.features))
    setEditPlans(toPlanRows(course.pricingPlans))
    setEditImage(null)
    setIsEditOpen(true)
  }

  const renderFeaturesEditor = (
    rows: FeatureRow[],
    setRows: Dispatch<SetStateAction<FeatureRow[]>>,
  ) => (
    <div className="field">
      <span>Features</span>
      <div className="stack" style={{ gap: 8 }}>
        {rows.map((row, index) => (
          <div key={row.key} style={{ display: 'flex', gap: 8 }}>
            <input
              value={row.value}
              placeholder="e.g. Recorded lectures"
              onChange={(event) =>
                setRows((prev) =>
                  prev.map((item, i) =>
                    i === index ? { ...item, value: event.target.value } : item,
                  ),
                )
              }
            />
            <button
              className="button ghost"
              type="button"
              onClick={() =>
                setRows((prev) =>
                  prev.length <= 1
                    ? [emptyFeature()]
                    : prev.filter((_, i) => i !== index),
                )
              }
            >
              Remove
            </button>
          </div>
        ))}
        <button
          className="button ghost"
          type="button"
          onClick={() => setRows((prev) => [...prev, emptyFeature()])}
        >
          Add feature
        </button>
      </div>
    </div>
  )

  const renderPlansEditor = (
    rows: PlanRow[],
    setRows: Dispatch<SetStateAction<PlanRow[]>>,
  ) => (
    <div className="field">
      <span>Pricing plans</span>
      <div className="stack" style={{ gap: 8 }}>
        {rows.map((row, index) => (
          <div
            key={row.key}
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr auto',
              gap: 8,
              alignItems: 'center',
            }}
          >
            <input
              type="number"
              min={1}
              step={1}
              placeholder="Duration (days)"
              value={row.durationDays}
              onChange={(event) =>
                setRows((prev) =>
                  prev.map((item, i) =>
                    i === index
                      ? { ...item, durationDays: event.target.value }
                      : item,
                  ),
                )
              }
              required={index === 0}
            />
            <input
              type="number"
              min={0}
              step={1}
              placeholder="Price (₪)"
              value={row.price}
              onChange={(event) =>
                setRows((prev) =>
                  prev.map((item, i) =>
                    i === index
                      ? { ...item, price: event.target.value }
                      : item,
                  ),
                )
              }
              required={index === 0}
            />
            <button
              className="button ghost"
              type="button"
              onClick={() =>
                setRows((prev) =>
                  prev.length <= 1
                    ? [emptyPlan()]
                    : prev.filter((_, i) => i !== index),
                )
              }
            >
              Remove
            </button>
          </div>
        ))}
        <button
          className="button ghost"
          type="button"
          onClick={() => setRows((prev) => [...prev, emptyPlan()])}
        >
          Add plan
        </button>
      </div>
    </div>
  )

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
              {courses.map((course) => {
                const startingPrice = getCourseStartingPrice(
                  course.pricingPlans,
                )
                const planCount = course.pricingPlans?.length ?? 0
                return (
                  <div key={getCourseId(course)} className="list-row">
                    <div>
                      <p className="list-title">{course.title}</p>
                      <p className="muted">
                        {course.description ?? 'No summary'}
                      </p>
                      {course.features?.length ? (
                        <ul className="muted" style={{ margin: '6px 0 0', paddingInlineStart: 18 }}>
                          {course.features.slice(0, 3).map((feature) => (
                            <li key={feature}>{feature}</li>
                          ))}
                          {course.features.length > 3 ? (
                            <li>+{course.features.length - 3} more</li>
                          ) : null}
                        </ul>
                      ) : null}
                      <Link
                        className="link"
                        to={`/courses/${getCourseId(course)}`}
                      >
                        View details
                      </Link>
                    </div>
                    <div className="list-meta">
                      <StatusBadge
                        label={course.isPublished ? 'Published' : 'Draft'}
                        tone={course.isPublished ? 'success' : 'muted'}
                      />
                      <span className="price">
                        {startingPrice != null
                          ? `From ${formatCurrency(startingPrice)}`
                          : 'No plans'}
                      </span>
                      <span className="muted">
                        {planCount
                          ? `${planCount} plan${planCount === 1 ? '' : 's'}`
                          : ''}
                      </span>
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
                )
              })}
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
                const validated = validatePricingPlans(createPlans)
                if (!validated.ok) {
                  setToast({ message: validated.message, tone: 'error' })
                  return
                }
                createMutation.mutate({
                  title: createForm.title,
                  description: createForm.description,
                  features: normalizeFeatures(createFeatures),
                  pricingPlans: validated.plans,
                  isPublished: createForm.isPublished,
                  ...(createImage ? { courseImage: createImage } : {}),
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
              {renderFeaturesEditor(createFeatures, setCreateFeatures)}
              {renderPlansEditor(createPlans, setCreatePlans)}
              <label className="field">
                Course image (optional)
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
                const validated = validatePricingPlans(editPlans)
                if (!validated.ok) {
                  setToast({ message: validated.message, tone: 'error' })
                  return
                }
                updateMutation.mutate({
                  ...editForm,
                  features: normalizeFeatures(editFeatures),
                  pricingPlans: validated.plans,
                })
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
              {renderFeaturesEditor(editFeatures, setEditFeatures)}
              {renderPlansEditor(editPlans, setEditPlans)}
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
