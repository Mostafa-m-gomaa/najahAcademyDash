import api from './client'
import type { ApiResponse } from '../types/api'
import type { Student } from '../types/students'

export async function listStudents(params?: {
  onlyNew?: boolean
  includeInactive?: boolean
}) {
  const { data } = await api.get<
    ApiResponse<Student[] | { students?: Student[] }>
  >('/admin/students', {
    params,
  })
  const payload = data.data
  const students = Array.isArray(payload) ? payload : payload?.students ?? []
  return { ...data, data: students }
}

export async function listUsers(params?: { role?: 'admin' | 'teacher' }) {
  const { data } = await api.get<ApiResponse<Student[] | { users?: Student[] }>>(
    '/admin/users',
    { params },
  )
  const payload = data.data
  const users = Array.isArray(payload) ? payload : payload?.users ?? []
  return { ...data, data: users }
}

export async function getStudent(studentId: string) {
  const { data } = await api.get<ApiResponse<Student>>(
    `/admin/students/${studentId}`,
  )
  return data
}

export async function createStudent(payload: {
  fullName: string
  email: string
  password: string
  role?: 'student' | 'admin' | 'teacher'
}) {
  const { data } = await api.post<ApiResponse<Student>>(
    '/admin/students',
    payload,
  )
  return data
}

export async function createUser(payload: {
  fullName: string
  email: string
  password: string
  role: 'admin' | 'teacher'
}) {
  const { data } = await api.post<ApiResponse<Student>>('/admin/users', payload)
  return data
}

export async function updateUser(
  userId: string,
  payload: {
    fullName?: string
    email?: string
    role?: 'admin' | 'teacher'
    isActive?: boolean
    adminReviewStatus?: 'reviewed' | 'pending'
  },
) {
  const { data } = await api.patch<ApiResponse<{ user: Student }>>(
    `/admin/users/${userId}`,
    payload,
  )
  return data
}

export async function updateStudentStatus(studentId: string, payload: {
  isActive: boolean
}) {
  const { data } = await api.patch<ApiResponse<Student>>(
    `/admin/students/${studentId}/status`,
    payload,
  )
  return data
}

export async function reviewStudent(studentId: string) {
  const { data } = await api.patch<ApiResponse<Student>>(
    `/admin/students/${studentId}/review`,
  )
  return data
}

export async function deleteStudent(studentId: string) {
  const { data } = await api.delete<ApiResponse<null>>(
    `/admin/students/${studentId}`,
  )
  return data
}

export async function updateUserPassword(
  userId: string,
  payload: { newPassword: string },
) {
  const { data } = await api.patch<ApiResponse<null>>(
    `/admin/users/${userId}/password`,
    payload,
  )
  return data
}
