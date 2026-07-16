export interface QuestionGroup {
  id: string
  courseId: string
  name: string
  description?: string
  imageUrl?: string
  createdAt?: string
  updatedAt?: string
}

export interface Exam {
  id: string
  courseId: string
  groupId: string
  name: string
  description?: string
  imageUrl?: string
  createdAt?: string
  updatedAt?: string
}

export interface ExamQuestionOption {
  id?: string
  text: string
}

export interface ExamQuestion {
  id: string
  prompt: string
  options: ExamQuestionOption[] | string[]
  correctOptionIndex: number
  timer?: number
  explanation?: string
}

