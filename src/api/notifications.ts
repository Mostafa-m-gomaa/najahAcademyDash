import api from './client'
import type { ApiResponse } from '../types/api'
import type { NotificationItem } from '../types/notifications'

export async function listNotifications() {
  const { data } = await api.get<
    ApiResponse<{ notifications?: NotificationItem[] }>
  >('/notifications')
  return { ...data, data: data.data?.notifications ?? [] }
}

export async function markNotificationRead(notificationId: string) {
  const { data } = await api.patch<
    ApiResponse<{ notification?: NotificationItem }>
  >(`/notifications/${notificationId}/read`)
  return { ...data, data: data.data?.notification }
}

