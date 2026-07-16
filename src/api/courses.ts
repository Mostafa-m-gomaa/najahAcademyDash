import api from './client'
import type { ApiResponse } from '../types/api'
import type { Course, Topic, Lecture } from '../types/courses'

export type CoursePricingPlanInput = {
  id?: string
  durationDays: number
  price: number
}

export interface CoursePayload {
  title: string
  description: string
  features: string[]
  pricingPlans: CoursePricingPlanInput[]
  isPublished?: boolean
  courseImage?: File | null
}

export interface CourseUpdatePayload {
  title?: string
  description?: string
  features?: string[]
  pricingPlans?: CoursePricingPlanInput[]
  isPublished?: boolean
  courseImage?: File | null
}

export interface TopicPayload {
  title: string
  description: string
  topicImage?: File | null
  topicDocuments?: File[]
}

export interface TopicUpdatePayload {
  title?: string
  description?: string
  topicImage?: File | null
  topicDocuments?: File[]
}

export interface LecturePayload {
  title: string
  videoName: string
  videoUrl: string
}

export interface LectureUpdatePayload {
  title?: string
  videoName?: string
  videoUrl?: string
}

const buildCourseForm = (payload: CoursePayload | CourseUpdatePayload) => {
  const form = new FormData()
  if (payload.title !== undefined) form.append('title', payload.title)
  if (payload.description !== undefined)
    form.append('description', payload.description)
  if (payload.features !== undefined)
    form.append('features', JSON.stringify(payload.features))
  if (payload.pricingPlans !== undefined)
    form.append('pricingPlans', JSON.stringify(payload.pricingPlans))
  if (payload.isPublished !== undefined)
    form.append('isPublished', String(payload.isPublished))
  if (payload.courseImage) form.append('courseImage', payload.courseImage)
  return form
}

const buildTopicForm = (payload: TopicPayload | TopicUpdatePayload) => {
  const form = new FormData()
  if (payload.title !== undefined) form.append('title', payload.title)
  if (payload.description !== undefined)
    form.append('description', payload.description)
  if (payload.topicImage) form.append('topicImage', payload.topicImage)
  if (payload.topicDocuments?.length) {
    payload.topicDocuments.forEach((file) =>
      form.append('topicDocuments', file),
    )
  }
  return form
}

export async function listCourses() {
  const { data } = await api.get<
    ApiResponse<Course[] | { courses?: Course[] }>
  >('/courses')
  const payload = data.data
  const courses = Array.isArray(payload) ? payload : payload?.courses ?? []
  return { ...data, data: courses }
}

export async function getCourse(
  courseId: string,
): Promise<ApiResponse<Course | undefined>> {
  const { data } = await api.get<ApiResponse<Course | { course?: Course }>>(
    `/courses/${courseId}`,
  )
  const payload = data.data
  const course = (payload as { course?: Course })?.course ?? payload ?? null
  return { ...data, data: course ?? undefined } as ApiResponse<Course | undefined>
}

export async function createCourse(payload: CoursePayload) {
  const form = buildCourseForm(payload)
  const { data } = await api.post<ApiResponse<Course>>('/courses', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

export async function updateCourse(courseId: string, payload: CourseUpdatePayload) {
  const form = buildCourseForm(payload)
  const { data } = await api.patch<ApiResponse<Course>>(
    `/courses/${courseId}`,
    form,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  )
  return data
}

export async function deleteCourse(courseId: string) {
  const { data } = await api.delete<ApiResponse<null>>(`/courses/${courseId}`)
  return data
}

export async function addTopic(courseId: string, payload: TopicPayload) {
  const form = buildTopicForm(payload)
  const { data } = await api.post<ApiResponse<Topic>>(
    `/courses/${courseId}/topics`,
    form,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  )
  return data
}

export async function updateTopic(
  courseId: string,
  topicId: string,
  payload: TopicUpdatePayload,
) {
  const form = buildTopicForm(payload)
  const { data } = await api.patch<ApiResponse<Topic>>(
    `/courses/${courseId}/topics/${topicId}`,
    form,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  )
  return data
}

export async function deleteTopic(courseId: string, topicId: string) {
  const { data } = await api.delete<ApiResponse<null>>(
    `/courses/${courseId}/topics/${topicId}`,
  )
  return data
}

export async function addLecture(
  courseId: string,
  topicId: string,
  payload: LecturePayload,
) {
  const { data } = await api.post<ApiResponse<Lecture>>(
    `/courses/${courseId}/topics/${topicId}/lectures`,
    payload,
  )
  return data
}

export async function updateLecture(
  courseId: string,
  topicId: string,
  lectureId: string,
  payload: LectureUpdatePayload,
) {
  const { data } = await api.patch<ApiResponse<Lecture>>(
    `/courses/${courseId}/topics/${topicId}/lectures/${lectureId}`,
    payload,
  )
  return data
}

export async function deleteLecture(
  courseId: string,
  topicId: string,
  lectureId: string,
) {
  const { data } = await api.delete<ApiResponse<null>>(
    `/courses/${courseId}/topics/${topicId}/lectures/${lectureId}`,
  )
  return data
}

export async function getTopicDocuments(courseId: string, topicId: string) {
  const { data } = await api.get<
    ApiResponse<
      | string[]
      | {
          documents?: Array<{
            _id?: string
            id?: string
            title?: string
            url?: string
            path?: string
            fileUrl?: string
            fileName?: string
          }>
        }
    >
  >(`/courses/${courseId}/topics/${topicId}/documents`)
  const payload = data.data
  if (Array.isArray(payload)) {
    return { ...data, data: payload }
  }
  return { ...data, data: payload?.documents ?? [] }
}

export async function addTopicDocument(
  courseId: string,
  topicId: string,
  payload: { title: string; file: File },
) {
  const form = new FormData()
  form.append('title', payload.title)
  form.append('topicDocument', payload.file)
  const { data } = await api.post<ApiResponse<{ documents: string[] }>>(
    `/courses/${courseId}/topics/${topicId}/documents`,
    form,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  )
  return data
}

export async function deleteTopicDocument(
  courseId: string,
  topicId: string,
  documentId: string,
) {
  const { data } = await api.delete<ApiResponse<null>>(
    `/courses/${courseId}/topics/${topicId}/documents/${documentId}`,
  )
  return data
}
