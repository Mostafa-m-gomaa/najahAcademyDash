import api from './client'
import type { ApiResponse } from '../types/api'
import type { Exam, ExamQuestion, QuestionGroup } from '../types/exams'

const toFormData = (payload: Record<string, unknown>) => {
  const form = new FormData()
  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null) return
    if (value instanceof File) {
      form.append(key, value)
      return
    }
    form.append(key, String(value))
  })
  return form
}

export async function listQuestionGroups(courseId: string) {
  const { data } = await api.get<ApiResponse<{ groups?: QuestionGroup[] }>>(
    `/courses/${courseId}/question-groups`,
  )
  return { ...data, data: data.data?.groups ?? [] }
}

export async function adminCreateQuestionGroup(payload: {
  courseId: string
  name: string
  description?: string
  groupImage?: File
}) {
  const { courseId, ...rest } = payload
  const form = toFormData(rest)
  const { data } = await api.post<ApiResponse<{ group?: QuestionGroup }>>(
    `/courses/${courseId}/question-groups`,
    form,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  )
  return { ...data, data: data.data?.group }
}

export async function adminUpdateQuestionGroup(payload: {
  courseId: string
  groupId: string
  name?: string
  description?: string
  groupImage?: File
}) {
  const { courseId, groupId, ...rest } = payload
  const form = toFormData(rest)
  const { data } = await api.patch<ApiResponse<{ group?: QuestionGroup }>>(
    `/courses/${courseId}/question-groups/${groupId}`,
    form,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  )
  return { ...data, data: data.data?.group }
}

export async function adminDeleteQuestionGroup(payload: {
  courseId: string
  groupId: string
}) {
  const { data } = await api.delete<ApiResponse<null>>(
    `/courses/${payload.courseId}/question-groups/${payload.groupId}`,
  )
  return data
}

export async function listGroupExams(courseId: string, groupId: string) {
  const { data } = await api.get<ApiResponse<{ exams?: Exam[] }>>(
    `/courses/${courseId}/question-groups/${groupId}/exams`,
  )
  return { ...data, data: data.data?.exams ?? [] }
}

export async function adminCreateExam(payload: {
  courseId: string
  groupId: string
  name: string
  description?: string
  examImage?: File
}) {
  const { courseId, groupId, ...rest } = payload
  const form = toFormData(rest)
  const { data } = await api.post<ApiResponse<{ exam?: Exam }>>(
    `/courses/${courseId}/question-groups/${groupId}/exams`,
    form,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  )
  return { ...data, data: data.data?.exam }
}

export async function adminUpdateExam(payload: {
  courseId: string
  groupId: string
  examId: string
  name?: string
  description?: string
  examImage?: File
}) {
  const { courseId, groupId, examId, ...rest } = payload
  const form = toFormData(rest)
  const { data } = await api.patch<ApiResponse<{ exam?: Exam }>>(
    `/courses/${courseId}/question-groups/${groupId}/exams/${examId}`,
    form,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  )
  return { ...data, data: data.data?.exam }
}

export async function adminDeleteExam(payload: {
  courseId: string
  groupId: string
  examId: string
}) {
  const { data } = await api.delete<ApiResponse<null>>(
    `/courses/${payload.courseId}/question-groups/${payload.groupId}/exams/${payload.examId}`,
  )
  return data
}

export async function adminListExamQuestions(courseId: string, examId: string) {
  const { data } = await api.get<
    ApiResponse<{ exam?: Exam; questions?: ExamQuestion[] }>
  >(`/courses/${courseId}/exams/${examId}/questions`)
  return {
    ...data,
    data: { exam: data.data?.exam, questions: data.data?.questions ?? [] },
  }
}

export async function adminCreateExamQuestion(
  courseId: string,
  examId: string,
  payload: {
    prompt: string
    options: string[]
    correctOptionIndex: number
    explanation?: string
  },
) {
  const { data } = await api.post<ApiResponse<{ question?: ExamQuestion }>>(
    `/courses/${courseId}/exams/${examId}/questions`,
    payload,
  )
  return { ...data, data: data.data?.question }
}

export async function adminUpdateExamQuestion(
  courseId: string,
  examId: string,
  questionId: string,
  payload: {
    prompt?: string
    options?: string[]
    correctOptionIndex?: number
    explanation?: string
  },
) {
  const { data } = await api.patch<ApiResponse<{ question?: ExamQuestion }>>(
    `/courses/${courseId}/exams/${examId}/questions/${questionId}`,
    payload,
  )
  return { ...data, data: data.data?.question }
}

export async function adminDeleteExamQuestion(
  courseId: string,
  examId: string,
  questionId: string,
) {
  const { data } = await api.delete<ApiResponse<null>>(
    `/courses/${courseId}/exams/${examId}/questions/${questionId}`,
  )
  return data
}
