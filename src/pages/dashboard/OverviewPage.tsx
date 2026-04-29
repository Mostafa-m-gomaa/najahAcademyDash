import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import * as coursesApi from '../../api/courses'
import StatCard from '../../components/StatCard'
import { formatCurrency } from '../../lib/format'

export default function OverviewPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['courses'],
    queryFn: coursesApi.listCourses,
  })

  const courses = data?.data ?? []
  const publishedCount = courses.filter((course) => course.isPublished).length
  const totalRevenue = courses.reduce(
    (sum, course) => sum + (course.price ?? 0),
    0,
  )

  return (
    <motion.div
      className="page"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
    >
      <section className="grid stats">
        <StatCard label="Total courses" value={`${courses.length}`} />
        <StatCard label="Published" value={`${publishedCount}`} />
        <StatCard label="Total revenue" value={formatCurrency(totalRevenue)} />
      </section>

      <section className="grid two-col">
        <div className="card">
          <div className="card-header">
            <div>
              <h2>Courses overview</h2>
              <p className="muted">Live list from the backend.</p>
            </div>
            <Link className="button ghost" to="/courses">
              Manage courses
            </Link>
          </div>
          {isLoading ? (
            <p className="muted">Loading courses...</p>
          ) : courses.length ? (
            <div className="list">
              {courses.slice(0, 5).map((course) => (
                <div key={course._id} className="list-row">
                  <div>
                    <p className="list-title">{course.title}</p>
                    <p className="muted">{course.description ?? 'No summary'}</p>
                  </div>
                  <div className="list-meta">
                    <span className="badge badge-muted">
                      {course.isPublished ? 'Published' : 'Draft'}
                    </span>
                    <span className="price">{formatCurrency(course.price)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="muted">No courses yet. Create your first course.</p>
          )}
        </div>

        <div className="card accent">
          <h2>Operations focus</h2>
          <p className="muted">
            Use the admin tools to onboard users, publish courses, and
            structure topics with rich media uploads.
          </p>
          <div className="quick-actions">
            <Link className="button primary" to="/students">
              Review new students
            </Link>
            <Link className="button ghost" to="/courses">
              Create course
            </Link>
          </div>
          <div className="tag-list">
            <span className="tag">Auth</span>
            <span className="tag">Students</span>
            <span className="tag">Courses</span>
            <span className="tag">Topics</span>
            <span className="tag">Lectures</span>
          </div>
        </div>
      </section>
    </motion.div>
  )
}
