import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import * as coursesApi from '../../api/courses'
import type { Course } from '../../types/courses'

const getCourseId = (course: { _id?: string; id?: string }) =>
  course._id ?? course.id ?? ''

export default function StudentCoursesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['courses'],
    queryFn: coursesApi.listCourses,
  })

  const courses = data?.data ?? []

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
            <h2>My courses</h2>
            <p className="muted">Pick a course to answer essay questions.</p>
          </div>
        </div>

        {isLoading ? (
          <p className="muted">Loading courses...</p>
        ) : courses.length ? (
          <div className="list">
            {courses.map((course: Course) => (
              <Link
                key={getCourseId(course)}
                className="list-row"
                to={`/learn/courses/${getCourseId(course)}/essay-questions`}
              >
                <div>
                  <p className="list-title">{course.title}</p>
                  <p className="muted">{course.description ?? 'Open course'}</p>
                </div>
                <div className="list-meta">
                  <span className="badge badge-muted">Essay</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="muted">No courses available.</p>
        )}
      </div>
    </motion.div>
  )
}

