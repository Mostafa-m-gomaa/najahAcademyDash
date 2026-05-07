import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import * as coursesApi from '../../api/courses'
import type { Course } from '../../types/courses'
import './AdminDictionaryHomePage.css'

const getCourseId = (course: { _id?: string; id?: string }) =>
  course._id ?? course.id ?? ''

export default function AdminDictionaryHomePage() {
  const { data, isLoading } = useQuery({
    queryKey: ['courses'],
    queryFn: coursesApi.listCourses,
  })

  const courses = data?.data ?? [] as Course[]

  return (
    <div className="page admin-dictionary-home">
      <div className="card">
        <div className="card-header">
          <div>
            <h2>Dictionary Management</h2>
            <p className="muted">Manage dictionaries per course.</p>
          </div>
        </div>

        {isLoading ? (
          <p className="muted">Loading courses...</p>
        ) : courses.length ? (
          <div className="list">
            {courses.map((course: Course) => (
              <div key={getCourseId(course)} className="list-row">
                <div>
                  <p className="list-title">{course.title}</p>
                  <p className="muted">{course.description ?? 'No description'}</p>
                </div>
                <div className="list-meta">
                  <Link
                    className="badge badge-primary"
                    to={`/courses/${getCourseId(course)}/dictionary`}
                  >
                    Manage Dictionary
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="muted">No courses available.</p>
        )}
      </div>
    </div>
  )
}
