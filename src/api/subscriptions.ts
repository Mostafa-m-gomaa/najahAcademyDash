import api from './client'
import type { ApiResponse } from '../types/api'
import type {
  AdminCourseSubscription,
  AdminSubscriptionSource,
  AdminSubscriptionStatus,
  CourseSubscription,
  Pagination,
} from '../types/subscriptions'

export type CreateCourseSubscriptionPayload = {
  userId: string
  courseId: string
  startDate: string
  endDate: string
}

export async function createCourseSubscription(
  payload: CreateCourseSubscriptionPayload,
) {
  const { data } = await api.post<
    ApiResponse<{ subscription: CourseSubscription }>
  >('/admin/course-subscriptions', payload)
  return data
}

export async function listCourseSubscriptions(params?: {
  userId?: string
  courseId?: string
  status?: AdminSubscriptionStatus
  source?: AdminSubscriptionSource
  page?: number
  limit?: number
}) {
  const { data } = await api.get<
    ApiResponse<{
      pagination?: Pagination
      subscriptions?: AdminCourseSubscription[]
    }>
  >('/admin/course-subscriptions', { params })
  const payload = data.data
  const subscriptions = (payload?.subscriptions ?? []).filter(
    (sub): sub is AdminCourseSubscription => Boolean(sub),
  )
  return {
    ...data,
    data: {
      pagination: payload?.pagination,
      subscriptions,
    },
  }
}
