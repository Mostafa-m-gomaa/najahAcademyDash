import { useEffect, useMemo, useState } from 'react'
import { AxiosError } from 'axios'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import * as studentsApi from '../../api/students'
import StatusBadge from '../../components/StatusBadge'
import type { Student } from '../../types/students'

const roleOptions = ['all', 'student'] as const

type RoleFilter = (typeof roleOptions)[number]

type EditState = {
  studentId: string
  fullName: string
  email: string
  isActive: boolean
  isReviewed: boolean
  newPassword: string
}

const getUserId = (user: { _id?: string; id?: string }) =>
  user._id ?? user.id ?? ''

export default function UsersPage() {
  const queryClient = useQueryClient()
  const [onlyNew, setOnlyNew] = useState(false)
  const [includeInactive, setIncludeInactive] = useState(false)
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all')
  const [createForm, setCreateForm] = useState({
    fullName: '',
    email: '',
    password: '',
  })
  const [editState, setEditState] = useState<EditState | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null)
  const [toast, setToast] = useState<{
    message: string
    tone: 'success' | 'error'
  } | null>(null)
  const [passwordTarget, setPasswordTarget] = useState<Student | null>(null)
  const [newPassword, setNewPassword] = useState('')

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 5000)
    return () => window.clearTimeout(timer)
  }, [toast])

  const { data, isLoading } = useQuery({
    queryKey: ['users', { onlyNew, includeInactive }],
    queryFn: () => studentsApi.listStudents({ onlyNew, includeInactive }),
  })

  const users = data?.data ?? []

  const filteredUsers = useMemo(() => {
    const students = users.filter((user) => user.role === 'student')
    if (roleFilter === 'all') return students
    return students
  }, [users, roleFilter])

  const createMutation = useMutation({
    mutationFn: studentsApi.createStudent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setToast({ message: 'Student created successfully.', tone: 'success' })
    },
    onError: (error) => {
      const message =
        error instanceof AxiosError
          ? error.response?.data?.message ?? 'Failed to create user.'
          : 'Failed to create user.'
      setToast({ message, tone: 'error' })
    },
  })

  const statusMutation = useMutation({
    mutationFn: ({ studentId, isActive }: { studentId: string; isActive: boolean }) =>
      studentsApi.updateStudentStatus(studentId, { isActive }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setToast({
        message: variables.isActive
          ? 'Student activated successfully.'
          : 'Student deactivated successfully.',
        tone: 'success',
      })
    },
    onError: (error) => {
      const message =
        error instanceof AxiosError
          ? error.response?.data?.message ?? 'Failed to update status.'
          : 'Failed to update status.'
      setToast({ message, tone: 'error' })
    },
  })

  const reviewMutation = useMutation({
    mutationFn: (studentId: string) => studentsApi.reviewStudent(studentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setToast({ message: 'Student reviewed successfully.', tone: 'success' })
    },
    onError: (error) => {
      const message =
        error instanceof AxiosError
          ? error.response?.data?.message ?? 'Failed to review student.'
          : 'Failed to review student.'
      setToast({ message, tone: 'error' })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (studentId: string) => studentsApi.deleteStudent(studentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setToast({ message: 'Student deleted successfully.', tone: 'success' })
    },
    onError: (error) => {
      const message =
        error instanceof AxiosError
          ? error.response?.data?.message ?? 'Failed to delete student.'
          : 'Failed to delete student.'
      setToast({ message, tone: 'error' })
    },
  })

  const passwordMutation = useMutation({
    mutationFn: ({ userId, newPassword }: { userId: string; newPassword: string }) =>
      studentsApi.updateUserPassword(userId, { newPassword }),
    onSuccess: () => {
      setPasswordTarget(null)
      setNewPassword('')
      setToast({ message: 'Password updated successfully.', tone: 'success' })
    },
    onError: (error) => {
      const message =
        error instanceof AxiosError
          ? error.response?.data?.message ?? 'Failed to update password.'
          : 'Failed to update password.'
      setToast({ message, tone: 'error' })
    },
  })

  return (
    <motion.div
      className="page"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
    >
      <section className="grid two-col">
        <div className="card">
          <div className="card-header">
            <div>
              <h2>Students</h2>
              <p className="muted">Manage student activation and reviews.</p>
            </div>
            <div className="toggle-group">
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={onlyNew}
                  onChange={(event) => setOnlyNew(event.target.checked)}
                />
                Only new
              </label>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={includeInactive}
                  onChange={(event) => setIncludeInactive(event.target.checked)}
                />
                Include inactive
              </label>
              <label className="field">
                Role
                <select
                  value={roleFilter}
                  onChange={(event) =>
                    setRoleFilter(event.target.value as RoleFilter)
                  }
                >
                  {roleOptions.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
          {isLoading ? (
            <p className="muted">Loading users...</p>
          ) : filteredUsers.length ? (
            <div className="list">
              {filteredUsers.map((user) => (
                <div key={getUserId(user)} className="list-row">
                  <div>
                    <p className="list-title">{user.fullName}</p>
                    <p className="muted">{user.email}</p>
                  </div>
                  <div className="list-meta">
                    <StatusBadge label="student" tone="muted" />
                    <StatusBadge
                      label={user.isActive ? 'Active' : 'Inactive'}
                      tone={user.isActive ? 'success' : 'warning'}
                    />
                    <StatusBadge
                      label={
                        user.adminReviewStatus === 'reviewed' ||
                        user.isReviewed
                          ? 'Reviewed'
                          : 'New'
                      }
                      tone={
                        user.adminReviewStatus === 'reviewed' ||
                        user.isReviewed
                          ? 'muted'
                          : 'warning'
                      }
                    />
                    <button
                      className="button ghost"
                      type="button"
                      onClick={() =>
                        statusMutation.mutate({
                          studentId: getUserId(user),
                          isActive: !user.isActive,
                        })
                      }
                    >
                      {user.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      className="button ghost"
                      type="button"
                      onClick={() =>
                        setEditState({
                          studentId: getUserId(user),
                          fullName: user.fullName,
                          email: user.email,
                          isActive: Boolean(user.isActive),
                          isReviewed:
                            user.adminReviewStatus === 'reviewed' ||
                            Boolean(user.isReviewed),
                          newPassword: '',
                        })
                      }
                    >
                      Update
                    </button>
                    <button
                      className="button ghost"
                      type="button"
                      onClick={() => {
                        setPasswordTarget(user)
                        setNewPassword('')
                      }}
                    >
                      Change password
                    </button>
                    <button
                      className="button danger"
                      type="button"
                      onClick={() => setDeleteTarget(user)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="muted">No users found.</p>
          )}
        </div>

        <div className="stack">
          <div className="card">
            <h3>Create student</h3>
            <form
              className="form"
              onSubmit={(event) => {
                event.preventDefault()
                createMutation.mutate({ ...createForm, role: 'student' })
              }}
            >
              <label className="field">
                Full name
                <input
                  value={createForm.fullName}
                  onChange={(event) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      fullName: event.target.value,
                    }))
                  }
                  required
                />
              </label>
              <label className="field">
                Email
                <input
                  type="email"
                  value={createForm.email}
                  onChange={(event) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      email: event.target.value,
                    }))
                  }
                  required
                />
              </label>
              <label className="field">
                Password
                <input
                  type="password"
                  value={createForm.password}
                  onChange={(event) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      password: event.target.value,
                    }))
                  }
                  required
                />
              </label>
              <button className="button primary" type="submit">
                {createMutation.isPending ? 'Creating...' : 'Create'}
              </button>
            </form>
          </div>
        </div>
      </section>

      {editState ? (
        <div className="modal-backdrop" role="presentation">
          <div className="modal" role="dialog" aria-modal="true">
            <div className="modal-header">
              <div>
                <p className="eyebrow">Update user</p>
                <h2>{editState.fullName}</h2>
              </div>
              <button
                className="button ghost"
                type="button"
                onClick={() => setEditState(null)}
              >
                Close
              </button>
            </div>
            <div className="form">
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={editState.isActive}
                  onChange={(event) =>
                    setEditState((prev) =>
                      prev
                        ? { ...prev, isActive: event.target.checked }
                        : prev,
                    )
                  }
                />
                Active
              </label>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={editState.isReviewed}
                  onChange={(event) =>
                    setEditState((prev) =>
                      prev
                        ? { ...prev, isReviewed: event.target.checked }
                        : prev,
                    )
                  }
                />
                Reviewed
              </label>
              <label className="field">
                New password
                <input
                  type="password"
                  value={editState.newPassword}
                  onChange={(event) =>
                    setEditState((prev) =>
                      prev
                        ? { ...prev, newPassword: event.target.value }
                        : prev,
                    )
                  }
                  placeholder="Leave blank to keep"
                />
              </label>
              <div className="modal-actions">
                <button
                  className="button primary"
                  type="button"
                  onClick={() => {
                    statusMutation.mutate({
                      studentId: editState.studentId,
                      isActive: editState.isActive,
                    })
                    if (editState.isReviewed) {
                      reviewMutation.mutate(editState.studentId)
                    }
                    if (editState.newPassword.trim()) {
                      studentsApi.updateUserPassword(editState.studentId, {
                        newPassword: editState.newPassword.trim(),
                      })
                    }
                    setEditState(null)
                  }}
                >
                  Save changes
                </button>
                <button
                  className="button ghost"
                  type="button"
                  onClick={() => setEditState(null)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {passwordTarget ? (
        <div className="modal-backdrop" role="presentation">
          <div className="modal" role="dialog" aria-modal="true">
            <div className="modal-header">
              <div>
                <p className="eyebrow">Change password</p>
                <h2>{passwordTarget.fullName}</h2>
              </div>
              <button
                className="button ghost"
                type="button"
                onClick={() => setPasswordTarget(null)}
              >
                Close
              </button>
            </div>
            <form
              className="form"
              onSubmit={(event) => {
                event.preventDefault()
                const trimmed = newPassword.trim()
                if (!trimmed) {
                  setToast({
                    message: 'Please enter a new password.',
                    tone: 'error',
                  })
                  return
                }
                passwordMutation.mutate({
                  userId: getUserId(passwordTarget),
                  newPassword: trimmed,
                })
              }}
            >
              <label className="field">
                New password
                <input
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  required
                />
              </label>
              <div className="modal-actions">
                <button className="button primary" type="submit">
                  {passwordMutation.isPending ? 'Saving...' : 'Save password'}
                </button>
                <button
                  className="button ghost"
                  type="button"
                  onClick={() => setPasswordTarget(null)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {deleteTarget ? (
        <div className="modal-backdrop" role="presentation">
          <div className="modal" role="dialog" aria-modal="true">
            <div className="modal-header">
              <div>
                <p className="eyebrow">Confirm delete</p>
                <h2>Delete user?</h2>
              </div>
              <button
                className="button ghost"
                type="button"
                onClick={() => setDeleteTarget(null)}
              >
                Close
              </button>
            </div>
            <p className="muted">
              This will permanently delete {deleteTarget.fullName}.
            </p>
            <div className="modal-actions">
              <button
                className="button danger"
                type="button"
                onClick={() => {
                  deleteMutation.mutate(getUserId(deleteTarget))
                  setDeleteTarget(null)
                }}
              >
                Confirm delete
              </button>
              <button
                className="button ghost"
                type="button"
                onClick={() => setDeleteTarget(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {toast ? (
        <div className={`toast ${toast.tone}`} role="status">
          <span>{toast.message}</span>
          <button
            className="button ghost"
            type="button"
            onClick={() => setToast(null)}
          >
            Dismiss
          </button>
        </div>
      ) : null}
    </motion.div>
  )
}
