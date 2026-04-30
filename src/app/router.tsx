import { createBrowserRouter } from 'react-router-dom'
import RequireAuth from '../features/auth/RequireAuth'
import RequireRole from '../features/auth/RequireRole'
import DashboardLayout from '../layouts/DashboardLayout'
import LoginPage from '../pages/auth/LoginPage'
import OverviewPage from '../pages/dashboard/OverviewPage'
import UsersPage from '../pages/users/UsersPage'
import StudentsPage from '../pages/students/StudentsPage'
import CoursesPage from '../pages/courses/CoursesPage'
import CourseDetailsPage from '../pages/courses/CourseDetailsPage'
import TopicsPage from '../pages/topics/TopicsPage'
import AdminEssayQuestionsPage from '../pages/essay/AdminEssayQuestionsPage'
import AdminEssayAnswersPage from '../pages/essay/AdminEssayAnswersPage'
import AdminEssayAnswerDetailsPage from '../pages/essay/AdminEssayAnswerDetailsPage'
import StudentCoursesPage from '../pages/essay/StudentCoursesPage'
import StudentCourseEssayQuestionsPage from '../pages/essay/StudentCourseEssayQuestionsPage'
import StudentEssayQuestionPage from '../pages/essay/StudentEssayQuestionPage'
import NotificationsPage from '../pages/notifications/NotificationsPage'
import AdminExamsPage from '../pages/exams/AdminExamsPage'
import NotFoundPage from '../pages/NotFoundPage'

const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: (
      <RequireAuth>
        <DashboardLayout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <OverviewPage /> },
      { path: 'users', element: <UsersPage /> },
      { path: 'students', element: <StudentsPage /> },
      { path: 'courses', element: <CoursesPage /> },
      { path: 'courses/:courseId', element: <CourseDetailsPage /> },
      { path: 'topics', element: <TopicsPage /> },
      {
        path: 'exams',
        element: (
          <RequireRole roles={['admin']}>
            <AdminExamsPage />
          </RequireRole>
        ),
      },
      {
        path: 'essay-questions',
        element: (
          <RequireRole roles={['admin']}>
            <AdminEssayQuestionsPage />
          </RequireRole>
        ),
      },
      {
        path: 'essay-answers',
        element: (
          <RequireRole roles={['admin']}>
            <AdminEssayAnswersPage />
          </RequireRole>
        ),
      },
      {
        path: 'essay-answers/:answerId',
        element: (
          <RequireRole roles={['admin']}>
            <AdminEssayAnswerDetailsPage />
          </RequireRole>
        ),
      },
      {
        path: 'learn/courses',
        element: (
          <RequireRole roles={['student']}>
            <StudentCoursesPage />
          </RequireRole>
        ),
      },
      {
        path: 'learn/courses/:courseId/essay-questions',
        element: (
          <RequireRole roles={['student']}>
            <StudentCourseEssayQuestionsPage />
          </RequireRole>
        ),
      },
      {
        path: 'learn/courses/:courseId/essay-questions/:questionId',
        element: (
          <RequireRole roles={['student']}>
            <StudentEssayQuestionPage />
          </RequireRole>
        ),
      },
      { path: 'notifications', element: <NotificationsPage /> },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
])

export default router
