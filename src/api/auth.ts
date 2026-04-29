import api from './client'
import type { ApiResponse } from '../types/api'
import type { AuthUser, LoginPayload, LoginResponse } from '../types/auth'

export async function registerStudent(payload: {
  fullName: string
  email: string
  password: string
}) {
  const { data } = await api.post<ApiResponse<AuthUser>>(
    '/auth/register-student',
    payload,
  )
  return data
}

export async function login(payload: LoginPayload) {
  const { data } = await api.post<LoginResponse>('/auth/login', payload)
  return data
}

export async function forgotPassword(payload: { email: string }) {
  const { data } = await api.post<ApiResponse<{ token?: string }>>(
    '/auth/forgot-password',
    payload,
  )
  return data
}

export async function resetPassword(payload: {
  token: string
  newPassword: string
}) {
  const { data } = await api.post<ApiResponse<null>>(
    '/auth/reset-password',
    payload,
  )
  return data
}

export async function changePassword(payload: {
  currentPassword: string
  newPassword: string
}) {
  const { data } = await api.post<ApiResponse<null>>(
    '/auth/change-password',
    payload,
  )
  return data
}

export async function me() {
  const { data } = await api.get<ApiResponse<AuthUser>>('/auth/me')
  return data
}
