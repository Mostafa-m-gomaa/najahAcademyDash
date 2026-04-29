import { createBrowserRouter } from 'react-router-dom'
import RequireAuth from '../features/auth/RequireAuth'
import DashboardLayout from '../layouts/DashboardLayout'
import LoginPage from '../pages/auth/LoginPage'
import OverviewPage from '../pages/dashboard/OverviewPage'
import UsersPage from '../pages/users/UsersPage'
import StudentsPage from '../pages/students/StudentsPage'
import CoursesPage from '../pages/courses/CoursesPage'
import CourseDetailsPage from '../pages/courses/CourseDetailsPage'
import TopicsPage from '../pages/topics/TopicsPage'
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
    ],
  },
  { path: '*', element: <NotFoundPage /> },
])

export default router
