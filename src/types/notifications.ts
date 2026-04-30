export type NotificationType = 'essay_answer_reviewed' | (string & {})

export interface NotificationItem {
  id: string
  type: NotificationType
  title: string
  message: string
  data?: {
    courseId?: string
    questionId?: string
    answerId?: string
  } & Record<string, unknown>
  isRead: boolean
  createdAt?: string
}

