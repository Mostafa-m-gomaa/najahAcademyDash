import api from './client'
import type { ApiResponse } from '../types/api'
import type { EssayAnswer, EssayQuestion } from '../types/essay'

export async function listCourseEssayQuestions(courseId: string) {
  const { data } = await api.get<ApiResponse<{ questions?: EssayQuestion[] }>>(
    `/courses/${courseId}/essay-questions`,
  )
  return { ...data, data: data.data?.questions ?? [] }
}

export async function adminListEssayQuestions(courseId: string) {
  const { data } = await api.get<ApiResponse<{ questions?: EssayQuestion[] }>>(
    `/admin/essay-questions`,
    { params: { courseId } },
  )
  return { ...data, data: data.data?.questions ?? [] }
}

export async function adminCreateEssayQuestion(
  courseId: string,
  payload: { title: string; question: string; description?: string },
) {
  const { data } = await api.post<ApiResponse<{ question?: EssayQuestion }>>(
    `/courses/${courseId}/essay-questions`,
    payload,
  )
  return { ...data, data: data.data?.question }
}

export async function adminUpdateEssayQuestion(
  courseId: string,
  questionId: string,
  payload: { title?: string; question?: string; description?: string },
) {
  const { data } = await api.patch<ApiResponse<{ question?: EssayQuestion }>>(
    `/courses/${courseId}/essay-questions/${questionId}`,
    payload,
  )
  return { ...data, data: data.data?.question }
}

export async function adminDisableEssayQuestion(
  courseId: string,
  questionId: string,
) {
  const { data } = await api.delete<ApiResponse<null>>(
    `/courses/${courseId}/essay-questions/${questionId}`,
  )
  return data
}

export async function upsertMyEssayAnswer(
  courseId: string,
  questionId: string,
  payload: { answerText: string },
) {
  const { data } = await api.post<ApiResponse<{ answer?: EssayAnswer }>>(
    `/courses/${courseId}/essay-questions/${questionId}/answer`,
    payload,
  )
  return { ...data, data: data.data?.answer }
}

export async function getMyEssayAnswer(courseId: string, questionId: string) {
  const { data } = await api.get<ApiResponse<{ answer: EssayAnswer | null }>>(
    `/courses/${courseId}/essay-questions/${questionId}/my-answer`,
  )
  return { ...data, data: data.data?.answer ?? null }
}

export async function adminListEssayAnswers(params?: {
  courseId?: string
  questionId?: string
  studentId?: string
  reviewed?: boolean
}) {
  const { data } = await api.get<ApiResponse<{ answers?: EssayAnswer[] }>>(
    `/admin/essay-answers`,
    { params },
  )
  return { ...data, data: data.data?.answers ?? [] }
}

export async function adminGetEssayAnswer(answerId: string) {
  const { data } = await api.get<ApiResponse<{ answer?: EssayAnswer }>>(
    `/admin/essay-answers/${answerId}`,
  )
  return { ...data, data: data.data?.answer }
}

export async function adminAddEssayAnswerReview(
  answerId: string,
  payload: { notes: string },
) {
  const { data } = await api.post<ApiResponse<{ answer?: EssayAnswer }>>(
    `/admin/essay-answers/${answerId}/reviews`,
    payload,
  )
  return { ...data, data: data.data?.answer }
}

