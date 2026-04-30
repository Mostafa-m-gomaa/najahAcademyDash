export interface EssayQuestion {
  id: string
  courseId: string
  title: string
  question: string
  description?: string
  isActive: boolean
  createdAt?: string
  updatedAt?: string
}

export interface EssayAnswerReview {
  id?: string
  notes: string
  createdAt?: string
  updatedAt?: string
  adminId?: string
}

export interface EssayAnswer {
  id: string
  courseId: string
  questionId: string
  studentId: string
  answerText: string
  reviews?: EssayAnswerReview[]
  isReviewed?: boolean
  createdAt?: string
  updatedAt?: string
  question?: {
    id: string
    title: string
  }
  student?: {
    id: string
    fullName: string
    email: string
  }
}

