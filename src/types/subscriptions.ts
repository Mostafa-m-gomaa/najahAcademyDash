export interface CourseSubscription {
  id?: string
  _id?: string
  userId: string
  courseId: string
  status?: 'active' | 'inactive' | 'expired'
  source?: 'admin' | 'system'
  startDate: string
  endDate: string
  createdAt?: string
  updatedAt?: string
}

export type AdminSubscriptionStatus = 'active' | 'expired' | 'canceled'
export type AdminSubscriptionSource = 'admin' | 'payment'

export type AdminSubscriptionUser = {
  id?: string
  _id?: string
  fullName: string
  email: string
  role?: 'student' | 'admin' | 'teacher'
}

export type AdminSubscriptionPricingPlan = {
  id?: string
  _id?: string
  durationDays: number
  price: number
}

export type AdminSubscriptionCourse = {
  id?: string
  _id?: string
  title: string
  features?: string[]
  pricingPlans?: AdminSubscriptionPricingPlan[]
  imageUrl?: string
  isPublished?: boolean
}

export type AdminSubscriptionCreatedBy = {
  id?: string
  _id?: string
  fullName?: string
  email?: string
}

export type AdminCourseSubscription = {
  id?: string
  _id?: string
  status: AdminSubscriptionStatus
  source: AdminSubscriptionSource
  startDate: string
  endDate: string
  createdAt?: string
  paidAt?: string
  amount?: number
  paymentRef?: string
  durationDays?: number
  pricingPlanId?: string
  user?: AdminSubscriptionUser
  course?: AdminSubscriptionCourse
  createdBy?: AdminSubscriptionCreatedBy
}

export type Pagination = {
  page: number
  limit: number
  total: number
}
