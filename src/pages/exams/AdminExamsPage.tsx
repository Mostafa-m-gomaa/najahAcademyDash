import { useEffect, useRef, useState } from 'react'
import { AxiosError } from 'axios'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import * as coursesApi from '../../api/courses'
import * as examsApi from '../../api/exams'
import RichTextContent from '../../components/RichTextContent'
import RichTextEditor, {
  type RichTextEditorHandle,
} from '../../components/RichTextEditor'
import {
  isRichTextEmpty,
  normalizePromptHtmlForEditor,
  sanitizeRichText,
  serializePromptHtmlForSave,
} from '../../lib/richText'
import type { Course } from '../../types/courses'
import type { Exam, ExamQuestion, QuestionGroup } from '../../types/exams'

const getCourseId = (course: { _id?: string; id?: string }) =>
  course._id ?? course.id ?? ''

const apiBaseUrl =
  (import.meta as { env?: { VITE_API_BASE_URL?: string } }).env
    ?.VITE_API_BASE_URL ?? 'http://localhost:5000/api/v1'
const apiOrigin = apiBaseUrl.replace(/\/api\/v1\/?$/, '')

const buildImageUrl = (value?: string) => {
  if (!value) return ''
  if (value.startsWith('http')) return value
  if (value.startsWith('/uploads')) return `${apiOrigin}${value}`
  return `${apiOrigin}/uploads/${value}`
}

const parseOptionalTimer = (value: string): number | null | undefined => {
  const trimmed = value.trim()
  if (!trimmed) return undefined
  const parsed = Number(trimmed)
  if (!Number.isInteger(parsed) || parsed <= 0) return null
  return parsed
}

type Toast = { message: string; tone: 'success' | 'error' }

export default function AdminExamsPage() {
  const queryClient = useQueryClient()
  const [selectedCourseId, setSelectedCourseId] = useState('')
  const [selectedGroupId, setSelectedGroupId] = useState('')
  const [selectedExamId, setSelectedExamId] = useState('')

  const [toast, setToast] = useState<Toast | null>(null)
  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 5000)
    return () => window.clearTimeout(timer)
  }, [toast])

  const { data: coursesData, isLoading: isCoursesLoading } = useQuery({
    queryKey: ['courses'],
    queryFn: coursesApi.listCourses,
  })

  const courses = coursesData?.data ?? []

  useEffect(() => {
    if (!selectedCourseId && courses.length) {
      setSelectedCourseId(getCourseId(courses[0] as Course))
    }
  }, [courses, selectedCourseId])

  const {
    data: groupsData,
    isLoading: isGroupsLoading,
    error: groupsError,
  } = useQuery({
    queryKey: ['question-groups', { courseId: selectedCourseId }],
    queryFn: () => examsApi.listQuestionGroups(selectedCourseId),
    enabled: Boolean(selectedCourseId),
  })

  const groups = groupsData?.data ?? []

  useEffect(() => {
    if (!selectedGroupId && groups.length) {
      setSelectedGroupId(groups[0].id)
    }
    if (selectedGroupId && groups.length && !groups.some((g) => g.id === selectedGroupId)) {
      setSelectedGroupId(groups[0]?.id ?? '')
    }
  }, [groups, selectedGroupId])

  const {
    data: examsData,
    isLoading: isExamsLoading,
    error: examsError,
  } = useQuery({
    queryKey: ['group-exams', { courseId: selectedCourseId, groupId: selectedGroupId }],
    queryFn: () => examsApi.listGroupExams(selectedCourseId, selectedGroupId),
    enabled: Boolean(selectedCourseId && selectedGroupId),
  })

  const exams = examsData?.data ?? []

  useEffect(() => {
    if (!selectedExamId && exams.length) {
      setSelectedExamId(exams[0].id)
    }
    if (selectedExamId && exams.length && !exams.some((e) => e.id === selectedExamId)) {
      setSelectedExamId(exams[0]?.id ?? '')
    }
  }, [exams, selectedExamId])

  const {
    data: questionsData,
    isLoading: isQuestionsLoading,
    error: questionsError,
  } = useQuery({
    queryKey: ['exam-questions', { courseId: selectedCourseId, examId: selectedExamId }],
    queryFn: () => examsApi.adminListExamQuestions(selectedCourseId, selectedExamId),
    enabled: Boolean(selectedCourseId && selectedExamId),
  })

  const questions = questionsData?.data?.questions ?? []

  const groupsErrorMessage =
    groupsError instanceof AxiosError
      ? groupsError.response?.data?.message ?? 'Failed to load groups.'
      : groupsError
        ? 'Failed to load groups.'
        : ''

  const examsErrorMessage =
    examsError instanceof AxiosError
      ? examsError.response?.data?.message ?? 'Failed to load exams.'
      : examsError
        ? 'Failed to load exams.'
        : ''

  const questionsErrorMessage =
    questionsError instanceof AxiosError
      ? questionsError.response?.data?.message ?? 'Failed to load questions.'
      : questionsError
        ? 'Failed to load questions.'
        : ''

  const invalidateGroups = async () => {
    await queryClient.invalidateQueries({
      queryKey: ['question-groups', { courseId: selectedCourseId }],
    })
  }
  const invalidateExams = async () => {
    await queryClient.invalidateQueries({
      queryKey: ['group-exams', { courseId: selectedCourseId, groupId: selectedGroupId }],
    })
  }
  const invalidateQuestions = async () => {
    await queryClient.invalidateQueries({
      queryKey: ['exam-questions', { courseId: selectedCourseId, examId: selectedExamId }],
    })
  }

  // Group modals/state
  const [isGroupCreateOpen, setIsGroupCreateOpen] = useState(false)
  const [groupCreate, setGroupCreate] = useState({
    name: '',
    description: '',
  })
  const [groupImage, setGroupImage] = useState<File | null>(null)
  const [groupEdit, setGroupEdit] = useState<(QuestionGroup & { imageFile?: File | null }) | null>(
    null,
  )
  const [groupDelete, setGroupDelete] = useState<QuestionGroup | null>(null)

  const groupCreateMutation = useMutation({
    mutationFn: () => {
      return examsApi.adminCreateQuestionGroup({
        courseId: selectedCourseId,
        name: groupCreate.name.trim(),
        description: groupCreate.description.trim() || undefined,
        groupImage: groupImage ?? undefined,
      })
    },
    onSuccess: async () => {
      setIsGroupCreateOpen(false)
      setGroupCreate({ name: '', description: '' })
      setGroupImage(null)
      await invalidateGroups()
      setToast({ message: 'Group created successfully.', tone: 'success' })
    },
    onError: (error) => {
      const message =
        error instanceof AxiosError
          ? error.response?.data?.message ?? 'Failed to create group.'
          : 'Failed to create group.'
      setToast({ message, tone: 'error' })
    },
  })

  const groupUpdateMutation = useMutation({
    mutationFn: () => {
      if (!groupEdit) return Promise.reject(new Error('No group selected'))
      return examsApi.adminUpdateQuestionGroup({
        courseId: selectedCourseId,
        groupId: groupEdit.id,
        name: groupEdit.name.trim() || undefined,
        description: groupEdit.description?.trim() || undefined,
        groupImage: groupEdit.imageFile ?? undefined,
      })
    },
    onSuccess: async () => {
      setGroupEdit(null)
      await invalidateGroups()
      setToast({ message: 'Group updated successfully.', tone: 'success' })
    },
    onError: () => setToast({ message: 'Failed to update group.', tone: 'error' }),
  })

  const groupDeleteMutation = useMutation({
    mutationFn: (groupId: string) =>
      examsApi.adminDeleteQuestionGroup({ courseId: selectedCourseId, groupId }),
    onSuccess: async (_, groupId) => {
      setGroupDelete(null)
      if (selectedGroupId === groupId) {
        setSelectedGroupId('')
        setSelectedExamId('')
      }
      await invalidateGroups()
      setToast({ message: 'Group deleted successfully.', tone: 'success' })
    },
    onError: () => setToast({ message: 'Failed to delete group.', tone: 'error' }),
  })

  // Exam modals/state
  const [isExamCreateOpen, setIsExamCreateOpen] = useState(false)
  const [examTargetGroupId, setExamTargetGroupId] = useState('')
  const [examCreate, setExamCreate] = useState({ name: '', description: '' })
  const [examImage, setExamImage] = useState<File | null>(null)
  const [examEdit, setExamEdit] = useState<(Exam & { imageFile?: File | null }) | null>(null)
  const [examDelete, setExamDelete] = useState<Exam | null>(null)

  useEffect(() => {
    if (!examTargetGroupId && selectedGroupId) {
      setExamTargetGroupId(selectedGroupId)
    }
  }, [examTargetGroupId, selectedGroupId])

  const examCreateMutation = useMutation({
    mutationFn: () => {
      return examsApi.adminCreateExam({
        courseId: selectedCourseId,
        groupId: examTargetGroupId,
        name: examCreate.name.trim(),
        description: examCreate.description.trim() || undefined,
        examImage: examImage ?? undefined,
      })
    },
    onSuccess: async () => {
      setIsExamCreateOpen(false)
      setExamCreate({ name: '', description: '' })
      setExamImage(null)
      await invalidateExams()
      setToast({ message: 'Exam created successfully.', tone: 'success' })
    },
    onError: () => setToast({ message: 'Failed to create exam.', tone: 'error' }),
  })

  const examUpdateMutation = useMutation({
    mutationFn: () => {
      if (!examEdit) return Promise.reject(new Error('No exam selected'))
      return examsApi.adminUpdateExam({
        courseId: selectedCourseId,
        groupId: selectedGroupId,
        examId: examEdit.id,
        name: examEdit.name.trim() || undefined,
        description: examEdit.description?.trim() || undefined,
        examImage: examEdit.imageFile ?? undefined,
      })
    },
    onSuccess: async () => {
      setExamEdit(null)
      await invalidateExams()
      setToast({ message: 'Exam updated successfully.', tone: 'success' })
    },
    onError: () => setToast({ message: 'Failed to update exam.', tone: 'error' }),
  })

  const examDeleteMutation = useMutation({
    mutationFn: (examId: string) =>
      examsApi.adminDeleteExam({
        courseId: selectedCourseId,
        groupId: selectedGroupId,
        examId,
      }),
    onSuccess: async (_, examId) => {
      setExamDelete(null)
      if (selectedExamId === examId) {
        setSelectedExamId('')
      }
      await invalidateExams()
      setToast({ message: 'Exam deleted successfully.', tone: 'success' })
    },
    onError: () => setToast({ message: 'Failed to delete exam.', tone: 'error' }),
  })

  // Question modals/state
  const [isQuestionCreateOpen, setIsQuestionCreateOpen] = useState(false)
  const [questionTargetGroupId, setQuestionTargetGroupId] = useState('')
  const [questionTargetExamId, setQuestionTargetExamId] = useState('')
  const [questionCreate, setQuestionCreate] = useState<{
    prompt: string
    options: string[]
    correctOptionIndex: number
    timer: string
    explanation: string
  }>({
    prompt: '',
    options: ['', ''],
    correctOptionIndex: 0,
    timer: '',
    explanation: '',
  })
  const [questionEdit, setQuestionEdit] = useState<{
    id: string
    prompt: string
    options: string[]
    correctOptionIndex: number
    timer: string
    explanation: string
  } | null>(null)
  const [questionDelete, setQuestionDelete] = useState<ExamQuestion | null>(null)
  const createPromptEditorRef = useRef<RichTextEditorHandle>(null)
  const editPromptEditorRef = useRef<RichTextEditorHandle>(null)

  useEffect(() => {
    if (!questionTargetGroupId && selectedGroupId) {
      setQuestionTargetGroupId(selectedGroupId)
    }
  }, [questionTargetGroupId, selectedGroupId])

  useEffect(() => {
    if (!questionTargetExamId && selectedExamId) {
      setQuestionTargetExamId(selectedExamId)
    }
  }, [questionTargetExamId, selectedExamId])

  const { data: questionTargetExamsData, isLoading: isQuestionTargetExamsLoading } = useQuery({
    queryKey: [
      'group-exams',
      { courseId: selectedCourseId, groupId: questionTargetGroupId, scope: 'question-modal' },
    ],
    queryFn: () => examsApi.listGroupExams(selectedCourseId, questionTargetGroupId),
    enabled: Boolean(selectedCourseId && questionTargetGroupId),
  })

  const questionTargetExams = questionTargetExamsData?.data ?? []

  useEffect(() => {
    if (!questionTargetExamId && questionTargetExams.length) {
      setQuestionTargetExamId(questionTargetExams[0].id)
    }
  }, [questionTargetExams, questionTargetExamId])

  const normalizeOptions = (value: ExamQuestion['options']) =>
    (value as Array<{ text?: string } | string>).map((item) =>
      typeof item === 'string' ? item : item.text ?? '',
    )

  const validateQuestion = (payload: {
    options: string[]
    correctOptionIndex: number
  }) => {
    const options = payload.options.map((o) => o.trim()).filter(Boolean)
    if (options.length < 2) return 'Options must be at least 2.'
    if (
      payload.correctOptionIndex < 0 ||
      payload.correctOptionIndex >= options.length
    ) {
      return 'Correct option index is out of range.'
    }
    return ''
  }

  const questionCreateMutation = useMutation({
    mutationFn: async () => {
      const options = questionCreate.options.map((o) => o.trim()).filter(Boolean)
      const error = validateQuestion({
        options,
        correctOptionIndex: questionCreate.correctOptionIndex,
      })
      if (error) return Promise.reject(new Error(error))
      if (!questionTargetExamId) {
        return Promise.reject(new Error('Please select an exam.'))
      }
      const timer = parseOptionalTimer(questionCreate.timer)
      if (timer === null) {
        return Promise.reject(
          new Error('Timer must be a positive whole number of seconds.'),
        )
      }
      const rawPromptHtml =
        createPromptEditorRef.current?.getHtmlForSave() ?? questionCreate.prompt
      const promptHtml = sanitizeRichText(serializePromptHtmlForSave(rawPromptHtml))
      console.log('[exam-question] payload.prompt', promptHtml)
      console.log('[exam-question] hasBr', /<br\s*\/?>/i.test(promptHtml))
      return examsApi.adminCreateExamQuestion(selectedCourseId, questionTargetExamId, {
        prompt: promptHtml,
        options,
        correctOptionIndex: questionCreate.correctOptionIndex,
        ...(timer !== undefined ? { timer } : {}),
        explanation: isRichTextEmpty(questionCreate.explanation)
          ? undefined
          : sanitizeRichText(questionCreate.explanation),
      })
    },
    onSuccess: async (response) => {
      console.log(
        '[exam-question] prompt after save',
        response?.data?.prompt ?? response,
      )
      setIsQuestionCreateOpen(false)
      setQuestionCreate({
        prompt: '',
        options: ['', ''],
        correctOptionIndex: 0,
        timer: '',
        explanation: '',
      })
      if (questionTargetExamId === selectedExamId) {
        await invalidateQuestions()
      }
      setToast({ message: 'Question added successfully.', tone: 'success' })
    },
    onError: (err) =>
      setToast({
        message:
          err instanceof Error ? err.message : 'Failed to add question.',
        tone: 'error',
      }),
  })

  const questionUpdateMutation = useMutation({
    mutationFn: async () => {
      if (!questionEdit) return Promise.reject(new Error('No question selected'))
      const options = questionEdit.options.map((o) => o.trim()).filter(Boolean)
      const error = validateQuestion({
        options,
        correctOptionIndex: questionEdit.correctOptionIndex,
      })
      if (error) return Promise.reject(new Error(error))
      const timer = parseOptionalTimer(questionEdit.timer)
      if (timer === null) {
        return Promise.reject(
          new Error('Timer must be a positive whole number of seconds.'),
        )
      }
      const rawPromptHtml =
        editPromptEditorRef.current?.getHtmlForSave() ?? questionEdit.prompt
      const promptHtml = sanitizeRichText(serializePromptHtmlForSave(rawPromptHtml))
      console.log('[exam-question] payload.prompt', promptHtml)
      console.log('[exam-question] hasBr', /<br\s*\/?>/i.test(promptHtml))
      return examsApi.adminUpdateExamQuestion(
        selectedCourseId,
        selectedExamId,
        questionEdit.id,
        {
          prompt: promptHtml || undefined,
          options,
          correctOptionIndex: questionEdit.correctOptionIndex,
          ...(timer !== undefined ? { timer } : {}),
          explanation: isRichTextEmpty(questionEdit.explanation)
            ? undefined
            : sanitizeRichText(questionEdit.explanation),
        },
      )
    },
    onSuccess: async (response) => {
      console.log(
        '[exam-question] prompt after save',
        response?.data?.prompt ?? response,
      )
      setQuestionEdit(null)
      await invalidateQuestions()
      setToast({ message: 'Question updated successfully.', tone: 'success' })
    },
    onError: (err) =>
      setToast({
        message:
          err instanceof Error ? err.message : 'Failed to update question.',
        tone: 'error',
      }),
  })

  const questionDeleteMutation = useMutation({
    mutationFn: (questionId: string) =>
      examsApi.adminDeleteExamQuestion(selectedCourseId, selectedExamId, questionId),
    onSuccess: async () => {
      setQuestionDelete(null)
      await invalidateQuestions()
      setToast({ message: 'Question deleted successfully.', tone: 'success' })
    },
    onError: () => setToast({ message: 'Failed to delete question.', tone: 'error' }),
  })

  return (
    <motion.div
      className="page"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
    >
      <div className="card">
        <div className="card-header">
          <div>
            <h2>Exams</h2>
            <p className="muted">Manage question groups, exams, and MCQ questions.</p>
          </div>
        </div>

        <label className="field">
          Course
          <select
            value={selectedCourseId}
            disabled={isCoursesLoading}
            onChange={(event) => {
              setSelectedCourseId(event.target.value)
              setSelectedGroupId('')
              setSelectedExamId('')
            }}
          >
            {courses.map((course) => (
              <option key={getCourseId(course)} value={getCourseId(course)}>
                {course.title}
              </option>
            ))}
          </select>
        </label>

        <section className="grid three-col" style={{ marginTop: 12 }}>
          <div className="card">
            <div className="card-header">
              <div>
                <h3>Groups</h3>
                <p className="muted">Question groups inside the course.</p>
              </div>
              <button
                className="button primary"
                type="button"
                onClick={() => setIsGroupCreateOpen(true)}
                disabled={!selectedCourseId}
              >
                Add
              </button>
            </div>

            {groupsErrorMessage ? <p className="error-text">{groupsErrorMessage}</p> : null}

            {isGroupsLoading ? (
              <p className="muted">Loading groups...</p>
            ) : groups.length ? (
              <div className="list">
                {groups.map((group) => (
                  <button
                    key={group.id}
                    type="button"
                    className="list-row"
                    style={{
                      textAlign: 'left',
                      width: '100%',
                      cursor: 'pointer',
                      border:
                        group.id === selectedGroupId
                          ? '1px solid var(--accent)'
                          : undefined,
                      background:
                        group.id === selectedGroupId
                          ? 'var(--accent-soft)'
                          : undefined,
                    }}
                    onClick={() => {
                      setSelectedGroupId(group.id)
                      setSelectedExamId('')
                    }}
                  >
                    <div>
                      <p className="list-title">{group.name}</p>
                      <p className="muted">{group.description ?? 'No description'}</p>
                    </div>
                    <div className="list-meta">
                      <button
                        className="button ghost"
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation()
                          setGroupEdit({ ...group, imageFile: null })
                        }}
                      >
                        Edit
                      </button>
                      <button
                        className="button danger"
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation()
                          setGroupDelete(group)
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <p className="muted">No groups yet.</p>
            )}
          </div>

          <div className="card">
            <div className="card-header">
              <div>
                <h3>Exams</h3>
                <p className="muted">Exams inside the selected group.</p>
              </div>
              <button
                className="button primary"
                type="button"
                onClick={() => {
                  setExamTargetGroupId(selectedGroupId || groups[0]?.id || '')
                  setIsExamCreateOpen(true)
                }}
                disabled={!groups.length}
              >
                Add
              </button>
            </div>

            {examsErrorMessage ? <p className="error-text">{examsErrorMessage}</p> : null}

            {isExamsLoading ? (
              <p className="muted">Loading exams...</p>
            ) : exams.length ? (
              <div className="list">
                {exams.map((exam) => (
                  <button
                    key={exam.id}
                    type="button"
                    className="list-row"
                    style={{
                      textAlign: 'left',
                      width: '100%',
                      cursor: 'pointer',
                      border:
                        exam.id === selectedExamId
                          ? '1px solid var(--accent)'
                          : undefined,
                      background:
                        exam.id === selectedExamId
                          ? 'var(--accent-soft)'
                          : undefined,
                    }}
                    onClick={() => setSelectedExamId(exam.id)}
                  >
                    <div>
                      <p className="list-title">{exam.name}</p>
                      <p className="muted">{exam.description ?? 'No description'}</p>
                    </div>
                    <div className="list-meta">
                      <button
                        className="button ghost"
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation()
                          setExamEdit({ ...exam, imageFile: null })
                        }}
                      >
                        Edit
                      </button>
                      <button
                        className="button danger"
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation()
                          setExamDelete(exam)
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <p className="muted">Pick a group to view its exams.</p>
            )}
          </div>

          <div className="card">
            <div className="card-header">
              <div>
                <h3>Questions</h3>
                <p className="muted">MCQ questions inside the selected exam.</p>
              </div>
              <button
                className="button primary"
                type="button"
                onClick={() => {
                  setQuestionTargetGroupId(selectedGroupId || groups[0]?.id || '')
                  setQuestionTargetExamId(selectedExamId || exams[0]?.id || '')
                  setIsQuestionCreateOpen(true)
                }}
                disabled={!exams.length}
              >
                Add
              </button>
            </div>

            {questionsErrorMessage ? (
              <p className="error-text">{questionsErrorMessage}</p>
            ) : null}

            {isQuestionsLoading ? (
              <p className="muted">Loading questions...</p>
            ) : questions.length ? (
              <div className="list">
                {questions.map((question, index) => (
                  <div key={question.id} className="list-row">
                    <div>
                      <span className="list-title">{index + 1}.</span>
                      <RichTextContent
                        content={question.prompt}
                        className="question-content"
                      />
                      <p className="muted">
                        Correct:{' '}
                        {normalizeOptions(question.options)[question.correctOptionIndex] ??
                          '—'}
                      </p>
                      <p className="muted">
                        Timer:{' '}
                        {typeof question.timer === 'number' ? `${question.timer}s` : '—'}
                      </p>
                    </div>
                    <div className="list-meta">
                      <button
                        className="button ghost"
                        type="button"
                        onClick={() =>
                          setQuestionEdit({
                            id: question.id,
                            prompt: normalizePromptHtmlForEditor(question.prompt ?? ''),
                            options: normalizeOptions(question.options),
                            correctOptionIndex: question.correctOptionIndex ?? 0,
                            timer:
                              question.timer != null ? String(question.timer) : '',
                            explanation: question.explanation ?? '',
                          })
                        }
                      >
                        Edit
                      </button>
                      <button
                        className="button danger"
                        type="button"
                        onClick={() => setQuestionDelete(question)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="muted">Pick an exam to manage its questions.</p>
            )}
          </div>
        </section>
      </div>

      {/* Group create */}
      {isGroupCreateOpen ? (
        <div className="modal-backdrop" role="presentation">
          <div className="modal" role="dialog" aria-modal="true">
            <div className="modal-header">
              <div>
                <p className="eyebrow">Add group</p>
                <h2>New question group</h2>
              </div>
              <button className="button ghost" type="button" onClick={() => setIsGroupCreateOpen(false)}>
                Close
              </button>
            </div>
            <form
              className="form"
              onSubmit={(event) => {
                event.preventDefault()
                if (!groupCreate.name.trim()) {
                  setToast({ message: 'Group name is required.', tone: 'error' })
                  return
                }
                groupCreateMutation.mutate()
              }}
            >
              <label className="field">
                Name
                <input
                  value={groupCreate.name}
                  onChange={(event) => setGroupCreate((p) => ({ ...p, name: event.target.value }))}
                  required
                />
              </label>
              <label className="field">
                Description
                <textarea
                  value={groupCreate.description}
                  onChange={(event) => setGroupCreate((p) => ({ ...p, description: event.target.value }))}
                  rows={3}
                />
              </label>
              <label className="field">
                Group image (optional)
                <input type="file" accept="image/*" onChange={(event) => setGroupImage(event.target.files?.[0] ?? null)} />
              </label>
              <div className="modal-actions">
                <button className="button primary" type="submit">
                  {groupCreateMutation.isPending ? 'Adding...' : 'Add group'}
                </button>
                <button className="button ghost" type="button" onClick={() => setIsGroupCreateOpen(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* Group edit */}
      {groupEdit ? (
        <div className="modal-backdrop" role="presentation">
          <div className="modal" role="dialog" aria-modal="true">
            <div className="modal-header">
              <div>
                <p className="eyebrow">Edit group</p>
                <h2>{groupEdit.name}</h2>
              </div>
              <button className="button ghost" type="button" onClick={() => setGroupEdit(null)}>
                Close
              </button>
            </div>
            {groupEdit.imageUrl ? (
              <img
                alt="Group"
                src={buildImageUrl(groupEdit.imageUrl)}
                style={{ width: '100%', borderRadius: 16, marginBottom: 12 }}
              />
            ) : null}
            <form
              className="form"
              onSubmit={(event) => {
                event.preventDefault()
                if (!groupEdit.name.trim()) {
                  setToast({ message: 'Group name is required.', tone: 'error' })
                  return
                }
                groupUpdateMutation.mutate()
              }}
            >
              <label className="field">
                Name
                <input
                  value={groupEdit.name}
                  onChange={(event) =>
                    setGroupEdit((prev) => (prev ? { ...prev, name: event.target.value } : prev))
                  }
                />
              </label>
              <label className="field">
                Description
                <textarea
                  value={groupEdit.description ?? ''}
                  onChange={(event) =>
                    setGroupEdit((prev) =>
                      prev ? { ...prev, description: event.target.value } : prev,
                    )
                  }
                  rows={3}
                />
              </label>
              <label className="field">
                Replace image (optional)
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) =>
                    setGroupEdit((prev) =>
                      prev ? { ...prev, imageFile: event.target.files?.[0] ?? null } : prev,
                    )
                  }
                />
              </label>
              <div className="modal-actions">
                <button className="button primary" type="submit">
                  {groupUpdateMutation.isPending ? 'Saving...' : 'Save changes'}
                </button>
                <button className="button ghost" type="button" onClick={() => setGroupEdit(null)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* Group delete */}
      {groupDelete ? (
        <div className="modal-backdrop" role="presentation">
          <div className="modal" role="dialog" aria-modal="true">
            <div className="modal-header">
              <div>
                <p className="eyebrow">Confirm delete</p>
                <h2>Delete group?</h2>
              </div>
              <button className="button ghost" type="button" onClick={() => setGroupDelete(null)}>
                Close
              </button>
            </div>
            <p className="muted">
              This will permanently delete the group and cascade delete exams, questions, and attempts inside it.
            </p>
            <div className="modal-actions">
              <button
                className="button danger"
                type="button"
                onClick={() => groupDeleteMutation.mutate(groupDelete.id)}
                disabled={groupDeleteMutation.isPending}
              >
                {groupDeleteMutation.isPending ? 'Deleting...' : 'Confirm delete'}
              </button>
              <button className="button ghost" type="button" onClick={() => setGroupDelete(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Exam create */}
      {isExamCreateOpen ? (
        <div className="modal-backdrop" role="presentation">
          <div className="modal" role="dialog" aria-modal="true">
            <div className="modal-header">
              <div>
                <p className="eyebrow">Add exam</p>
                <h2>New exam</h2>
              </div>
              <button className="button ghost" type="button" onClick={() => setIsExamCreateOpen(false)}>
                Close
              </button>
            </div>
            <form
              className="form"
              onSubmit={(event) => {
                event.preventDefault()
                if (!examTargetGroupId) {
                  setToast({ message: 'Please select a group.', tone: 'error' })
                  return
                }
                if (!examCreate.name.trim()) {
                  setToast({ message: 'Exam name is required.', tone: 'error' })
                  return
                }
                examCreateMutation.mutate()
              }}
            >
              <label className="field">
                Group
                <select
                  value={examTargetGroupId}
                  onChange={(event) => setExamTargetGroupId(event.target.value)}
                  disabled={!groups.length}
                  required
                >
                  {groups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                Name
                <input
                  value={examCreate.name}
                  onChange={(event) => setExamCreate((p) => ({ ...p, name: event.target.value }))}
                  required
                />
              </label>
              <label className="field">
                Description
                <textarea
                  value={examCreate.description}
                  onChange={(event) => setExamCreate((p) => ({ ...p, description: event.target.value }))}
                  rows={3}
                />
              </label>
              <label className="field">
                Exam image (optional)
                <input type="file" accept="image/*" onChange={(event) => setExamImage(event.target.files?.[0] ?? null)} />
              </label>
              <div className="modal-actions">
                <button className="button primary" type="submit">
                  {examCreateMutation.isPending ? 'Adding...' : 'Add exam'}
                </button>
                <button className="button ghost" type="button" onClick={() => setIsExamCreateOpen(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* Exam edit */}
      {examEdit ? (
        <div className="modal-backdrop" role="presentation">
          <div className="modal" role="dialog" aria-modal="true">
            <div className="modal-header">
              <div>
                <p className="eyebrow">Edit exam</p>
                <h2>{examEdit.name}</h2>
              </div>
              <button className="button ghost" type="button" onClick={() => setExamEdit(null)}>
                Close
              </button>
            </div>
            {examEdit.imageUrl ? (
              <img
                alt="Exam"
                src={buildImageUrl(examEdit.imageUrl)}
                style={{ width: '100%', borderRadius: 16, marginBottom: 12 }}
              />
            ) : null}
            <form
              className="form"
              onSubmit={(event) => {
                event.preventDefault()
                if (!examEdit.name.trim()) {
                  setToast({ message: 'Exam name is required.', tone: 'error' })
                  return
                }
                examUpdateMutation.mutate()
              }}
            >
              <label className="field">
                Name
                <input
                  value={examEdit.name}
                  onChange={(event) =>
                    setExamEdit((prev) => (prev ? { ...prev, name: event.target.value } : prev))
                  }
                />
              </label>
              <label className="field">
                Description
                <textarea
                  value={examEdit.description ?? ''}
                  onChange={(event) =>
                    setExamEdit((prev) =>
                      prev ? { ...prev, description: event.target.value } : prev,
                    )
                  }
                  rows={3}
                />
              </label>
              <label className="field">
                Replace image (optional)
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) =>
                    setExamEdit((prev) =>
                      prev ? { ...prev, imageFile: event.target.files?.[0] ?? null } : prev,
                    )
                  }
                />
              </label>
              <div className="modal-actions">
                <button className="button primary" type="submit">
                  {examUpdateMutation.isPending ? 'Saving...' : 'Save changes'}
                </button>
                <button className="button ghost" type="button" onClick={() => setExamEdit(null)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* Exam delete */}
      {examDelete ? (
        <div className="modal-backdrop" role="presentation">
          <div className="modal" role="dialog" aria-modal="true">
            <div className="modal-header">
              <div>
                <p className="eyebrow">Confirm delete</p>
                <h2>Delete exam?</h2>
              </div>
              <button className="button ghost" type="button" onClick={() => setExamDelete(null)}>
                Close
              </button>
            </div>
            <p className="muted">
              This will permanently delete the exam and cascade delete its questions and attempts.
            </p>
            <div className="modal-actions">
              <button
                className="button danger"
                type="button"
                onClick={() => examDeleteMutation.mutate(examDelete.id)}
                disabled={examDeleteMutation.isPending}
              >
                {examDeleteMutation.isPending ? 'Deleting...' : 'Confirm delete'}
              </button>
              <button className="button ghost" type="button" onClick={() => setExamDelete(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Question create */}
      {isQuestionCreateOpen ? (
        <div className="modal-backdrop" role="presentation">
          <div className="modal modal-wide" role="dialog" aria-modal="true">
            <div className="modal-header">
              <div>
                <p className="eyebrow">Add question</p>
                <h2>New MCQ question</h2>
              </div>
              <button className="button ghost" type="button" onClick={() => setIsQuestionCreateOpen(false)}>
                Close
              </button>
            </div>
            <form
              className="form"
              onSubmit={(event) => {
                event.preventDefault()
                if (!questionTargetGroupId) {
                  setToast({ message: 'Please select a group.', tone: 'error' })
                  return
                }
                if (!questionTargetExamId) {
                  setToast({ message: 'Please select an exam.', tone: 'error' })
                  return
                }
                if (isRichTextEmpty(questionCreate.prompt)) {
                  setToast({ message: 'Prompt is required.', tone: 'error' })
                  return
                }
                questionCreateMutation.mutate()
              }}
            >
              <label className="field">
                Group
                <select
                  value={questionTargetGroupId}
                  onChange={(event) => {
                    setQuestionTargetGroupId(event.target.value)
                    setQuestionTargetExamId('')
                  }}
                  disabled={!groups.length}
                  required
                >
                  {groups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                Exam
                <select
                  value={questionTargetExamId}
                  onChange={(event) => setQuestionTargetExamId(event.target.value)}
                  disabled={!questionTargetGroupId || isQuestionTargetExamsLoading}
                  required
                >
                  <option value="">Select exam</option>
                  {questionTargetExams.map((exam) => (
                    <option key={exam.id} value={exam.id}>
                      {exam.name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="field field--richtext">
                <span>Prompt</span>
                <RichTextEditor
                  ref={createPromptEditorRef}
                  value={questionCreate.prompt}
                  onChange={(prompt) => setQuestionCreate((p) => ({ ...p, prompt }))}
                  placeholder="اكتب نص السؤال هنا..."
                  minHeight={160}
                />
              </div>
              <div className="card">
                <h3>Options</h3>
                {questionCreate.options.map((opt, idx) => (
                  <label key={idx} className="field">
                    Option {idx + 1}
                    <div className="option-input-row">
                      <input
                        className="input-rtl"
                        value={opt}
                        onChange={(event) =>
                          setQuestionCreate((p) => {
                            const next = [...p.options]
                            next[idx] = event.target.value
                            const trimmed = next.map((x) => x.trim()).filter(Boolean)
                            const nextCorrect =
                              p.correctOptionIndex >= trimmed.length
                                ? Math.max(0, trimmed.length - 1)
                                : p.correctOptionIndex
                            return { ...p, options: next, correctOptionIndex: nextCorrect }
                          })
                        }
                        required={idx < 2}
                      />
                      <button
                        className="button ghost"
                        type="button"
                        onClick={() =>
                          setQuestionCreate((p) => {
                            if (p.options.length <= 2) return p
                            const next = p.options.filter((_, i) => i !== idx)
                            const nextCorrect =
                              p.correctOptionIndex === idx
                                ? 0
                                : p.correctOptionIndex > idx
                                  ? p.correctOptionIndex - 1
                                  : p.correctOptionIndex
                            return { ...p, options: next, correctOptionIndex: nextCorrect }
                          })
                        }
                        disabled={questionCreate.options.length <= 2}
                      >
                        Remove
                      </button>
                    </div>
                  </label>
                ))}
                <button
                  className="button ghost"
                  type="button"
                  onClick={() =>
                    setQuestionCreate((p) => ({ ...p, options: [...p.options, ''] }))
                  }
                >
                  + Add option
                </button>
              </div>
              <label className="field">
                Correct option
                <select
                  value={questionCreate.correctOptionIndex}
                  onChange={(event) =>
                    setQuestionCreate((p) => ({
                      ...p,
                      correctOptionIndex: Number(event.target.value),
                    }))
                  }
                >
                  {questionCreate.options
                    .map((o) => o.trim())
                    .filter(Boolean)
                    .map((text, idx) => (
                      <option key={idx} value={idx}>
                        {idx + 1}. {text}
                      </option>
                    ))}
                </select>
              </label>
              <label className="field">
                Timer (seconds, optional)
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={questionCreate.timer}
                  onChange={(event) =>
                    setQuestionCreate((p) => ({ ...p, timer: event.target.value }))
                  }
                  placeholder="e.g. 60"
                />
              </label>
              <div className="field field--richtext">
                <span>Explanation (optional)</span>
                <RichTextEditor
                  value={questionCreate.explanation}
                  onChange={(explanation) =>
                    setQuestionCreate((p) => ({ ...p, explanation }))
                  }
                  placeholder="أضف شرحًا اختياريًا..."
                  minHeight={140}
                />
              </div>
              <div className="modal-actions">
                <button className="button primary" type="submit">
                  {questionCreateMutation.isPending ? 'Adding...' : 'Add question'}
                </button>
                <button className="button ghost" type="button" onClick={() => setIsQuestionCreateOpen(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* Question edit */}
      {questionEdit ? (
        <div className="modal-backdrop" role="presentation">
          <div className="modal modal-wide" role="dialog" aria-modal="true">
            <div className="modal-header">
              <div>
                <p className="eyebrow">Edit question</p>
                <h2>MCQ question</h2>
              </div>
              <button className="button ghost" type="button" onClick={() => setQuestionEdit(null)}>
                Close
              </button>
            </div>
            <form
              className="form"
              onSubmit={(event) => {
                event.preventDefault()
                if (isRichTextEmpty(questionEdit.prompt)) {
                  setToast({ message: 'Prompt is required.', tone: 'error' })
                  return
                }
                questionUpdateMutation.mutate()
              }}
            >
              <div className="field field--richtext">
                <span>Prompt</span>
                <RichTextEditor
                  ref={editPromptEditorRef}
                  value={questionEdit.prompt}
                  onChange={(prompt) =>
                    setQuestionEdit((p) => (p ? { ...p, prompt } : p))
                  }
                  placeholder="اكتب نص السؤال هنا..."
                  minHeight={160}
                />
              </div>
              <div className="card">
                <h3>Options</h3>
                {questionEdit.options.map((opt, idx) => (
                  <label key={idx} className="field">
                    Option {idx + 1}
                    <div className="option-input-row">
                      <input
                        className="input-rtl"
                        value={opt}
                        onChange={(event) =>
                          setQuestionEdit((p) => {
                            if (!p) return p
                            const next = [...p.options]
                            next[idx] = event.target.value
                            const trimmed = next.map((x) => x.trim()).filter(Boolean)
                            const nextCorrect =
                              p.correctOptionIndex >= trimmed.length
                                ? Math.max(0, trimmed.length - 1)
                                : p.correctOptionIndex
                            return { ...p, options: next, correctOptionIndex: nextCorrect }
                          })
                        }
                        required={idx < 2}
                      />
                      <button
                        className="button ghost"
                        type="button"
                        onClick={() =>
                          setQuestionEdit((p) => {
                            if (!p) return p
                            if (p.options.length <= 2) return p
                            const next = p.options.filter((_, i) => i !== idx)
                            const nextCorrect =
                              p.correctOptionIndex === idx
                                ? 0
                                : p.correctOptionIndex > idx
                                  ? p.correctOptionIndex - 1
                                  : p.correctOptionIndex
                            return { ...p, options: next, correctOptionIndex: nextCorrect }
                          })
                        }
                        disabled={questionEdit.options.length <= 2}
                      >
                        Remove
                      </button>
                    </div>
                  </label>
                ))}
                <button
                  className="button ghost"
                  type="button"
                  onClick={() =>
                    setQuestionEdit((p) => (p ? { ...p, options: [...p.options, ''] } : p))
                  }
                >
                  + Add option
                </button>
              </div>
              <label className="field">
                Correct option
                <select
                  value={questionEdit.correctOptionIndex}
                  onChange={(event) =>
                    setQuestionEdit((p) =>
                      p ? { ...p, correctOptionIndex: Number(event.target.value) } : p,
                    )
                  }
                >
                  {questionEdit.options
                    .map((o) => o.trim())
                    .filter(Boolean)
                    .map((text, idx) => (
                      <option key={idx} value={idx}>
                        {idx + 1}. {text}
                      </option>
                    ))}
                </select>
              </label>
              <label className="field">
                Timer (seconds, optional)
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={questionEdit.timer}
                  onChange={(event) =>
                    setQuestionEdit((p) => (p ? { ...p, timer: event.target.value } : p))
                  }
                  placeholder="e.g. 60"
                />
              </label>
              <div className="field field--richtext">
                <span>Explanation (optional)</span>
                <RichTextEditor
                  value={questionEdit.explanation}
                  onChange={(explanation) =>
                    setQuestionEdit((p) => (p ? { ...p, explanation } : p))
                  }
                  placeholder="أضف شرحًا اختياريًا..."
                  minHeight={140}
                />
              </div>
              <div className="modal-actions">
                <button className="button primary" type="submit">
                  {questionUpdateMutation.isPending ? 'Saving...' : 'Save changes'}
                </button>
                <button className="button ghost" type="button" onClick={() => setQuestionEdit(null)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* Question delete */}
      {questionDelete ? (
        <div className="modal-backdrop" role="presentation">
          <div className="modal" role="dialog" aria-modal="true">
            <div className="modal-header">
              <div>
                <p className="eyebrow">Confirm delete</p>
                <h2>Delete question?</h2>
              </div>
              <button className="button ghost" type="button" onClick={() => setQuestionDelete(null)}>
                Close
              </button>
            </div>
            <p className="muted">This will permanently delete the question.</p>
            <div className="modal-actions">
              <button
                className="button danger"
                type="button"
                onClick={() => questionDeleteMutation.mutate(questionDelete.id)}
                disabled={questionDeleteMutation.isPending}
              >
                {questionDeleteMutation.isPending ? 'Deleting...' : 'Confirm delete'}
              </button>
              <button className="button ghost" type="button" onClick={() => setQuestionDelete(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {toast ? (
        <div className={`toast ${toast.tone}`} role="status">
          <span>{toast.message}</span>
          <button className="button ghost" type="button" onClick={() => setToast(null)}>
            Dismiss
          </button>
        </div>
      ) : null}
    </motion.div>
  )
}
