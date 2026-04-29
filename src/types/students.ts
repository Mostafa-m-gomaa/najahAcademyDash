export interface Student {
  id?: string
  _id: string
  fullName: string
  email: string
  role?: 'student' | 'admin' | 'teacher'
  isActive?: boolean
  isReviewed?: boolean
  adminReviewStatus?: 'reviewed' | 'new'
  createdAt?: string
}
