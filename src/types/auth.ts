export type UserRole = 'student' | 'admin' | 'teacher'

export interface AuthUser {
  _id: string
  fullName: string
  email: string
  role?: UserRole
}

export interface LoginPayload {
  email: string
  password: string
}

export interface LoginResponse {
  token?: string
  data?: {
    token?: string
    user?: AuthUser
  }
  user?: AuthUser
}
