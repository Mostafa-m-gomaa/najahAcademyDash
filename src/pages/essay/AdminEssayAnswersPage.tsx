import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AxiosError } from 'axios'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import * as coursesApi from '../../api/courses'
import * as essayApi from '../../api/essay'
import * as studentsApi from '../../api/students'
import type { Course } from '../../types/courses'
import type { Student } from '../../types/students'

type ReviewedFilter = 'all' | 'true' | 'false'

const getCourseId = (course: { _id?: string; id?: string }) =>
  course._id ?? course.id ?? ''

const getStudentId = (student: { _id?: string; id?: string }) =>
  student._id ?? student.id ?? ''

export default function AdminEssayAnswersPage() {
  const [filters, setFilters] = useState<{
    courseId: string
    studentId: string
    reviewed: ReviewedFilter
  }>({ courseId: '', studentId: '', reviewed: 'all' })

  const { data: coursesData, isLoading: isCoursesLoading } = useQuery({
    queryKey: ['courses'],
    queryFn: coursesApi.listCourses,
  })

  const courses = coursesData?.data ?? []

  useEffect(() => {
    if (!filters.courseId && courses.length) {
      setFilters((prev) => ({
        ...prev,
        courseId: getCourseId(courses[0] as Course),
      }))
    }
  }, [courses, filters.courseId])

  const { data: studentsData, isLoading: isStudentsLoading } = useQuery({
    queryKey: ['students', { includeInactive: true }],
    queryFn: () => studentsApi.listStudents({ includeInactive: true }),
  })

  const students = useMemo(() => {
    const items = studentsData?.data ?? []
    return items
      .filter((student) => (student.role ?? 'student') === 'student')
      .sort((a, b) => (a.fullName ?? '').localeCompare(b.fullName ?? ''))
  }, [studentsData])

  const answersQueryParams = useMemo(() => {
    const reviewed =
      filters.reviewed === 'all' ? undefined : filters.reviewed === 'true'

    return {
      courseId: filters.courseId || undefined,
      studentId: filters.studentId || undefined,
      reviewed,
    }
  }, [filters])

  const { data: answersData, isLoading: isAnswersLoading, error } = useQuery({
    queryKey: ['admin-essay-answers', answersQueryParams],
    queryFn: () => essayApi.adminListEssayAnswers(answersQueryParams),
    enabled: Boolean(filters.courseId),
  })

  const answers = answersData?.data ?? []

  const errorMessage =
    error instanceof AxiosError
      ? error.response?.data?.message ?? 'Failed to load essay answers.'
      : error
        ? 'Failed to load essay answers.'
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
            <h2>Essay answers</h2>
            <p className="muted">Review student submissions and send feedback.</p>
          </div>
        </div>

        <div className="grid two-col">
          <label className="field">
            Course
            <select
              value={filters.courseId}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  courseId: event.target.value,
                }))
              }
              disabled={isCoursesLoading}
            >
              {courses.map((course) => (
                <option key={getCourseId(course)} value={getCourseId(course)}>
                  {course.title}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            Student
            <select
              value={filters.studentId}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, studentId: event.target.value }))
              }
              disabled={isStudentsLoading}
            >
              <option value="">All</option>
              {students.map((student: Student) => (
                <option key={getStudentId(student)} value={getStudentId(student)}>
                  {student.fullName} ({student.email})
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            Reviewed
            <select
              value={filters.reviewed}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  reviewed: event.target.value as ReviewedFilter,
                }))
              }
            >
              <option value="all">All</option>
              <option value="true">Reviewed</option>
              <option value="false">Not reviewed</option>
            </select>
          </label>
        </div>

        {errorMessage ? <p className="error-text">{errorMessage}</p> : null}

        {isAnswersLoading ? (
          <p className="muted">Loading answers...</p>
        ) : answers.length ? (
          <div className="list">
            {answers.map((answer) => {
              const reviewed = Boolean(answer.reviews?.length)
              const studentLabel =
                answer.student?.fullName ?? answer.studentId ?? 'Student'
              const questionLabel = answer.question?.title ?? answer.questionId
              return (
                <Link
                  key={answer.id}
                  className="list-row"
                  to={`/essay-answers/${answer.id}`}
                >
                  <div>
                    <p className="list-title">{studentLabel}</p>
                    <p className="muted">{questionLabel}</p>
                  </div>
                  <div className="list-meta">
                    <span className={`badge ${reviewed ? 'badge-success' : 'badge-muted'}`}>
                      {reviewed ? 'Reviewed' : 'Pending'}
                    </span>
                    <span className="muted">
                      {answer.updatedAt ? new Date(answer.updatedAt).toLocaleString() : ''}
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <p className="muted">No answers match the selected filters.</p>
        )}
      </div>
    </motion.div>
  )
}
