import { useEffect, useMemo, useState } from 'react'
import { AxiosError } from 'axios'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import * as studentsApi from '../../api/students'
import StatusBadge from '../../components/StatusBadge'
import type { Student } from '../../types/students'

const roleOptions = ['all', 'admin', 'teacher'] as const

type RoleFilter = (typeof roleOptions)[number]

type EditState = {
  studentId: string
  fullName: string
  email: string
  role: 'admin' | 'teacher'
  isActive: boolean
  isReviewed: boolean
}

const getUserId = (user: { _id?: string; id?: string }) =>
  user._id ?? user.id ?? ''

export default function UsersPage() {
  const queryClient = useQueryClient()
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all')
  const [createForm, setCreateForm] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'admin' as 'admin' | 'teacher',
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
    queryKey: ['users', { roleFilter }],
    queryFn: async () => {
      if (roleFilter !== 'all') {
        return studentsApi.listUsers({ role: roleFilter })
      }

      const [admins, teachers] = await Promise.all([
        studentsApi.listUsers({ role: 'admin' }),
        studentsApi.listUsers({ role: 'teacher' }),
      ])

      return {
        ...admins,
        data: [...(admins.data ?? []), ...(teachers.data ?? [])],
      }
    },
  })

  const users = Array.isArray(data?.data) ? data?.data ?? [] : []

  const filteredUsers = useMemo(() => {
    const base = users.filter(
      (user) => user.role === 'admin' || user.role === 'teacher',
    )
    if (roleFilter === 'all') return base
    return base.filter((user) => user.role === roleFilter)
  }, [users, roleFilter])

  const createMutation = useMutation({
    mutationFn: studentsApi.createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setToast({ message: 'User created successfully.', tone: 'success' })
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
          ? 'User activated successfully.'
          : 'User deactivated successfully.',
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

  const deleteMutation = useMutation({
    mutationFn: (studentId: string) => studentsApi.deleteStudent(studentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setToast({ message: 'User deleted successfully.', tone: 'success' })
    },
    onError: (error) => {
      const message =
        error instanceof AxiosError
          ? error.response?.data?.message ?? 'Failed to delete user.'
          : 'Failed to delete user.'
      setToast({ message, tone: 'error' })
    },
  })

  const updateUserMutation = useMutation({
    mutationFn: (payload: {
      userId: string
      fullName: string
      email: string
      role: 'admin' | 'teacher'
      isActive: boolean
      isReviewed: boolean
    }) =>
      studentsApi.updateUser(payload.userId, {
        fullName: payload.fullName,
        email: payload.email,
        role: payload.role,
        isActive: payload.isActive,
        adminReviewStatus: payload.isReviewed ? 'reviewed' : 'pending',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setEditState(null)
      setToast({ message: 'User updated successfully.', tone: 'success' })
    },
    onError: (error) => {
      const message =
        error instanceof AxiosError
          ? error.response?.data?.message ?? 'Failed to update user.'
          : 'Failed to update user.'
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
              <h2>Admins & Teachers</h2>
              <p className="muted">Manage platform staff accounts.</p>
            </div>
            <div className="toggle-group">
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
                    <StatusBadge label={user.role ?? 'staff'} tone="muted" />
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
                          role: (user.role ?? 'admin') as 'admin' | 'teacher',
                          isActive: Boolean(user.isActive),
                          isReviewed:
                            user.adminReviewStatus === 'reviewed' ||
                            Boolean(user.isReviewed),
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
            <h3>Create user</h3>
            <form
              className="form"
              onSubmit={(event) => {
                event.preventDefault()
                createMutation.mutate(createForm)
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
              <label className="field">
                Role
                <select
                  value={createForm.role ?? 'admin'}
                  onChange={(event) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      role: event.target.value as 'admin' | 'teacher',
                    }))
                  }
                >
                  <option value="admin">admin</option>
                  <option value="teacher">teacher</option>
                </select>
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
              <label className="field">
                Full name
                <input
                  value={editState.fullName}
                  onChange={(event) =>
                    setEditState((prev) =>
                      prev ? { ...prev, fullName: event.target.value } : prev,
                    )
                  }
                  required
                />
              </label>
              <label className="field">
                Email
                <input
                  type="email"
                  value={editState.email}
                  onChange={(event) =>
                    setEditState((prev) =>
                      prev ? { ...prev, email: event.target.value } : prev,
                    )
                  }
                  required
                />
              </label>
              <label className="field">
                Role
                <select
                  value={editState.role}
                  onChange={(event) =>
                    setEditState((prev) =>
                      prev
                        ? {
                            ...prev,
                            role: event.target.value as 'admin' | 'teacher',
                          }
                        : prev,
                    )
                  }
                >
                  <option value="admin">admin</option>
                  <option value="teacher">teacher</option>
                </select>
              </label>
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
              <div className="modal-actions">
                <button
                  className="button primary"
                  type="button"
                  onClick={() => {
                    updateUserMutation.mutate({
                      userId: editState.studentId,
                      fullName: editState.fullName,
                      email: editState.email,
                      role: editState.role,
                      isActive: editState.isActive,
                      isReviewed: editState.isReviewed,
                    })
                  }}
                >
                  {updateUserMutation.isPending
                    ? 'Saving...'
                    : 'Save changes'}
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
