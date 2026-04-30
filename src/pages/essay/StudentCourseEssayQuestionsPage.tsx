import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import * as coursesApi from '../../api/courses'
import * as essayApi from '../../api/essay'

export default function StudentCourseEssayQuestionsPage() {
  const { courseId = '' } = useParams()

  const { data: courseData, isLoading: isCourseLoading } = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => coursesApi.getCourse(courseId),
    enabled: Boolean(courseId),
  })

  const { data: questionsData, isLoading: isQuestionsLoading } = useQuery({
    queryKey: ['essay-questions', courseId],
    queryFn: () => essayApi.listCourseEssayQuestions(courseId),
    enabled: Boolean(courseId),
  })

  const course = courseData?.data
  const questions = questionsData?.data ?? []
  const activeQuestions = questions.filter((q) => q.isActive !== false)

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
            <p className="muted">{course?.title ?? 'Course'}</p>
          </div>
        </div>

        {isCourseLoading || isQuestionsLoading ? (
          <p className="muted">Loading questions...</p>
        ) : activeQuestions.length ? (
          <div className="list">
            {activeQuestions.map((question) => (
              <Link
                key={question.id}
                className="list-row"
                to={`/learn/courses/${courseId}/essay-questions/${question.id}`}
              >
                <div>
                  <p className="list-title">{question.title}</p>
                  <p className="muted">{question.description ?? 'Open question'}</p>
                </div>
                <div className="list-meta">
                  <span className="badge badge-muted">Answer</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="muted">No essay questions for this course yet.</p>
        )}
      </div>
    </motion.div>
  )
}

