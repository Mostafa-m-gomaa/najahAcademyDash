import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../features/auth/AuthProvider'
import {
  addDictionaryLetter,
  addDictionaryWord,
  getDictionaryLetters,
  getDictionaryWordsForLetter,
  updateDictionaryWord,
  deleteDictionaryWord,
  deleteDictionaryLetter,
} from '../../api/dictionary'
import type { DictionaryWord, DictionaryLetter } from '../../types/dictionary'
import './AdminDictionaryPage.css'

export default function AdminDictionaryPage() {
  const { courseId } = useParams<{ courseId: string }>()
  const { token } = useAuth()
  const queryClient = useQueryClient()
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null)
  const [newLetter, setNewLetter] = useState('')
  const [isWordModalOpen, setIsWordModalOpen] = useState(false)
  const [isDeleteLetterModalOpen, setIsDeleteLetterModalOpen] = useState(false)
  const [deleteLetterTarget, setDeleteLetterTarget] = useState<string | null>(null)
  const [deleteLetterError, setDeleteLetterError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    verb: { arabic: '', meaning: '' },
    noun: { arabic: '', meaning: '' },
    adjective: { arabic: '', meaning: '' },
  })
  const [editingWordId, setEditingWordId] = useState<string | null>(null)

  const hasCourseId = Boolean(courseId)

  const {
    data: lettersResponse,
    isLoading: lettersLoading,
    error: lettersError,
  } = useQuery({
    queryKey: ['dictionaryLetters', courseId],
    queryFn: () => getDictionaryLetters(courseId!),
    enabled: Boolean(token) && hasCourseId,
  })
  const letters: DictionaryLetter[] = Array.isArray(lettersResponse?.data)
    ? lettersResponse.data
    : []

  const {
    data: wordsResponse,
    isLoading: wordsLoading,
  } = useQuery({
    queryKey: ['dictionaryWords', courseId, selectedLetter],
    queryFn: () => getDictionaryWordsForLetter(courseId!, selectedLetter!),
    enabled: hasCourseId && Boolean(selectedLetter),
  })
  const words: DictionaryWord[] = Array.isArray(wordsResponse?.data)
    ? wordsResponse.data
    : []

  const addLetterMutation = useMutation({
    mutationFn: () => {
      if (!courseId) throw new Error('Course not found')
      return addDictionaryLetter(courseId, { letter: newLetter })
    },
    onSuccess: (result) => {
      setNewLetter('')
      if (!courseId) return

      const addedLetter = result?.data?.letter
      if (addedLetter) {
        const queryKey = ['dictionaryLetters', courseId]
        queryClient.setQueryData(queryKey, (old: unknown) => {
          if (!old || typeof old !== 'object') {
            return { success: true, data: [addedLetter] }
          }

          const oldObj = old as { data?: unknown }
          const current = oldObj.data
          if (!Array.isArray(current)) {
            return { ...(old as Record<string, unknown>), data: [addedLetter] }
          }

          const exists = current.some((l: unknown) => {
            if (!l || typeof l !== 'object') return false
            const obj = l as Record<string, unknown>
            return obj.letter === addedLetter.letter
          })
          if (exists) return old

          return { ...(old as Record<string, unknown>), data: [...current, addedLetter] }
        })
      }

      queryClient.invalidateQueries({ queryKey: ['dictionaryLetters', courseId] })
    },
  })

  const addWordMutation = useMutation({
    mutationFn: () => {
      if (!courseId) throw new Error('Course not found')
      if (editingWordId) {
        return updateDictionaryWord(courseId, editingWordId, formData)
      }
      if (!selectedLetter) throw new Error('No letter selected')
      return addDictionaryWord(courseId, selectedLetter, formData)
    },
    onSuccess: () => {
      setFormData({
        verb: { arabic: '', meaning: '' },
        noun: { arabic: '', meaning: '' },
        adjective: { arabic: '', meaning: '' },
      })
      setEditingWordId(null)
      setIsWordModalOpen(false)
      if (!courseId) return
      queryClient.invalidateQueries({
        queryKey: ['dictionaryWords', courseId, selectedLetter],
      })
    },
  })

  const deleteWordMutation = useMutation({
    mutationFn: (wordId: string) => {
      if (!courseId) throw new Error('Course not found')
      return deleteDictionaryWord(courseId, wordId)
    },
    onSuccess: () => {
      if (!courseId) return
      queryClient.invalidateQueries({
        queryKey: ['dictionaryWords', courseId, selectedLetter],
      })
    },
  })

  const deleteLetterMutation = useMutation({
    mutationFn: (letter: string) => {
      if (!courseId) throw new Error('Course not found')
      return deleteDictionaryLetter(courseId, letter)
    },
    onMutate: async (letter: string) => {
      if (!courseId) return
      setDeleteLetterError(null)

      const queryKey = ['dictionaryLetters', courseId]
      await queryClient.cancelQueries({ queryKey })

      const previous = queryClient.getQueryData(queryKey)
      queryClient.setQueryData(queryKey, (old) => {
        if (!old || typeof old !== 'object') return old
        const oldObj = old as { data?: unknown }
        const current = oldObj.data
        if (!Array.isArray(current)) return old
        const filtered = current.filter((l: unknown) => {
          if (!l || typeof l !== 'object') return true
          const obj = l as Record<string, unknown>
          return obj.letter !== letter
        })
        return { ...(old as Record<string, unknown>), data: filtered }
      })

      if (selectedLetter === letter) {
        setSelectedLetter(null)
      }

      return { previous }
    },
    onSuccess: () => {
      setSelectedLetter(null)
      setIsDeleteLetterModalOpen(false)
      setDeleteLetterTarget(null)
      setDeleteLetterError(null)
      if (!courseId) return
      queryClient.invalidateQueries({ queryKey: ['dictionaryLetters', courseId] })
    },
    onError: (_error, _letter, context) => {
      setDeleteLetterError('Failed to delete letter. Please try again.')
      if (!courseId) return
      const queryKey = ['dictionaryLetters', courseId]
      if (context && typeof context === 'object' && 'previous' in context) {
        queryClient.setQueryData(queryKey, (context as { previous?: unknown }).previous)
      }
    },
    onSettled: () => {
      if (!courseId) return
      queryClient.invalidateQueries({ queryKey: ['dictionaryLetters', courseId] })
    },
  })

  const handleAddLetter = (e: React.FormEvent) => {
    e.preventDefault()
    if (courseId && newLetter.trim()) {
      addLetterMutation.mutate()
    }
  }

  const handleAddWord = (e: React.FormEvent) => {
    e.preventDefault()
    const hasContent =
      (formData.verb.arabic && formData.verb.meaning) ||
      (formData.noun.arabic && formData.noun.meaning) ||
      (formData.adjective.arabic && formData.adjective.meaning)

    if (courseId && hasContent) {
      addWordMutation.mutate()
    }
  }

  const handleEditWord = (word: DictionaryWord) => {
    setFormData({
      verb: word.verb || { arabic: '', meaning: '' },
      noun: word.noun || { arabic: '', meaning: '' },
      adjective: word.adjective || { arabic: '', meaning: '' },
    })
    setEditingWordId(word._id)
    setIsWordModalOpen(true)
  }

  const handleOpenAddWord = () => {
    if (!selectedLetter) return
    setEditingWordId(null)
    setFormData({
      verb: { arabic: '', meaning: '' },
      noun: { arabic: '', meaning: '' },
      adjective: { arabic: '', meaning: '' },
    })
    setIsWordModalOpen(true)
  }

  const handleCloseWordModal = () => {
    setIsWordModalOpen(false)
    setEditingWordId(null)
    setFormData({
      verb: { arabic: '', meaning: '' },
      noun: { arabic: '', meaning: '' },
      adjective: { arabic: '', meaning: '' },
    })
  }

  const handleOpenDeleteLetter = (letter: string) => {
    setDeleteLetterTarget(letter)
    setDeleteLetterError(null)
    setIsDeleteLetterModalOpen(true)
  }

  const handleCloseDeleteLetter = () => {
    if (deleteLetterMutation.isPending) return
    setIsDeleteLetterModalOpen(false)
    setDeleteLetterTarget(null)
    setDeleteLetterError(null)
  }

  if (!courseId) {
    return <div>Course not found</div>
  }

  return (
    <div className="page">
      <div className="card admin-dictionary-page">
        <h1>Dictionary Management</h1>
        <div className="dictionary-container">
          <div className="letters-section">
            <div className="section-head">
              <div>
                <h2>Letters</h2>
                <p className="muted">Select a letter to manage its words.</p>
              </div>
              <form onSubmit={handleAddLetter} className="add-letter-form">
                <input
                  type="text"
                  value={newLetter}
                  onChange={(e) => setNewLetter(e.target.value.toUpperCase())}
                  placeholder="Add a new letter"
                  maxLength={1}
                />
                <button type="submit" disabled={addLetterMutation.isPending}>
                  {addLetterMutation.isPending ? 'Working...' : 'Add'}
                </button>
              </form>
            </div>

            <div className="letters-scroll" aria-label="Dictionary letters">
              {lettersLoading ? (
                <p className="muted">Loading...</p>
              ) : lettersError ? (
                <p className="error">Failed to load letters.</p>
              ) : letters.length > 0 ? (
                <div className="letters-list">
                  {letters.map((letter) => (
                    <div
                      key={letter._id}
                      className={`letter-item ${selectedLetter === letter.letter ? 'active' : ''}`}
                    >
                      <button
                        onClick={() => setSelectedLetter(letter.letter)}
                        className="letter-button"
                        aria-pressed={selectedLetter === letter.letter}
                      >
                        {letter.letter}
                      </button>
                      <button
                        onClick={() => {
                          handleOpenDeleteLetter(letter.letter)
                        }}
                        className="delete-btn"
                        disabled={deleteLetterMutation.isPending}
                        title="Delete letter"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="muted">No letters.</p>
              )}
            </div>
          </div>

          <div className="words-section">
            <div className="section-head">
              <div>
                <h2>{selectedLetter ? `Words for ${selectedLetter}` : 'Words'}</h2>
                <p className="muted">
                  {selectedLetter
                    ? 'Add, edit, or delete words for the selected letter.'
                    : 'Select a letter to view its words.'}
                </p>
              </div>
              <button
                type="button"
                className="btn-primary"
                onClick={handleOpenAddWord}
                disabled={!selectedLetter}
              >
                Add word
              </button>
            </div>

            {!selectedLetter ? (
              <p className="empty-message">Select a letter.</p>
            ) : wordsLoading ? (
              <p className="muted">Loading...</p>
            ) : words.length ? (
              <div className="words-grid">
                {words.map((word) => (
                  <div key={word._id} className="word-card">
                    {word.verb && (
                      <div className="word-item">
                        <strong>Verb:</strong>
                        <span className="arabic-text">{word.verb.arabic}</span>
                        <span className="meaning">{word.verb.meaning}</span>
                      </div>
                    )}
                    {word.noun && (
                      <div className="word-item">
                        <strong>Noun:</strong>
                        <span className="arabic-text">{word.noun.arabic}</span>
                        <span className="meaning">{word.noun.meaning}</span>
                      </div>
                    )}
                    {word.adjective && (
                      <div className="word-item">
                        <strong>Adjective:</strong>
                        <span className="arabic-text">{word.adjective.arabic}</span>
                        <span className="meaning">{word.adjective.meaning}</span>
                      </div>
                    )}
                    <div className="word-actions">
                      <button onClick={() => handleEditWord(word)} className="edit-btn">
                        Edit
                      </button>
                      <button
                        onClick={() => deleteWordMutation.mutate(word._id)}
                        className="delete-btn"
                        disabled={deleteWordMutation.isPending}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty-message">No words.</p>
            )}
          </div>
        </div>

        {isWordModalOpen && (
          <div
            className="modal-overlay"
            role="dialog"
            aria-modal="true"
            aria-label={editingWordId ? 'Edit word' : 'Add word'}
            onClick={handleCloseWordModal}
          >
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <div>
                  <h2>{editingWordId ? 'Edit word' : 'Add word'}</h2>
                  <p className="muted">
                    {selectedLetter ? `Letter: ${selectedLetter}` : ''}
                  </p>
                </div>
                <button
                  type="button"
                  className="modal-close"
                  onClick={handleCloseWordModal}
                  aria-label="Close"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleAddWord} className="add-word-form modal-body">
                <div className="form-group">
                  <h3>Verb</h3>
                  <input
                    type="text"
                    value={formData.verb.arabic}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        verb: { ...formData.verb, arabic: e.target.value },
                      })
                    }
                    placeholder="Arabic text"
                    dir="rtl"
                  />
                  <input
                    type="text"
                    value={formData.verb.meaning}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        verb: { ...formData.verb, meaning: e.target.value },
                      })
                    }
                    placeholder="Meaning"
                  />
                </div>

                <div className="form-group">
                  <h3>Noun</h3>
                  <input
                    type="text"
                    value={formData.noun.arabic}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        noun: { ...formData.noun, arabic: e.target.value },
                      })
                    }
                    placeholder="Arabic text"
                    dir="rtl"
                  />
                  <input
                    type="text"
                    value={formData.noun.meaning}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        noun: { ...formData.noun, meaning: e.target.value },
                      })
                    }
                    placeholder="Meaning"
                  />
                </div>

                <div className="form-group">
                  <h3>Adjective</h3>
                  <input
                    type="text"
                    value={formData.adjective.arabic}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        adjective: { ...formData.adjective, arabic: e.target.value },
                      })
                    }
                    placeholder="Arabic text"
                    dir="rtl"
                  />
                  <input
                    type="text"
                    value={formData.adjective.meaning}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        adjective: { ...formData.adjective, meaning: e.target.value },
                      })
                    }
                    placeholder="Meaning"
                  />
                </div>

                <div className="button-group">
                  <button type="submit" disabled={addWordMutation.isPending}>
                    {addWordMutation.isPending
                      ? 'Working...'
                      : editingWordId
                        ? 'Update'
                        : 'Add'}
                  </button>
                  <button
                    type="button"
                    className="cancel-btn"
                    onClick={handleCloseWordModal}
                    disabled={addWordMutation.isPending}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {isDeleteLetterModalOpen && deleteLetterTarget && (
          <div
            className="modal-overlay"
            role="dialog"
            aria-modal="true"
            aria-label="Confirm delete letter"
            onClick={handleCloseDeleteLetter}
          >
            <div className="modal modal-sm" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <div>
                  <h2>Delete letter</h2>
                  <p className="muted">
                    Are you sure you want to delete letter <strong>{deleteLetterTarget}</strong>?
                    This will delete all words under it.
                  </p>
                </div>
                <button
                  type="button"
                  className="modal-close"
                  onClick={handleCloseDeleteLetter}
                  aria-label="Close"
                  disabled={deleteLetterMutation.isPending}
                >
                  ×
                </button>
              </div>

              <div className="modal-body">
                {deleteLetterError && <p className="error">{deleteLetterError}</p>}

                <div className="button-group">
                  <button
                    type="button"
                    onClick={() => deleteLetterMutation.mutate(deleteLetterTarget)}
                    disabled={deleteLetterMutation.isPending}
                  >
                    {deleteLetterMutation.isPending ? 'Deleting...' : 'Delete'}
                  </button>
                  <button
                    type="button"
                    className="cancel-btn"
                    onClick={handleCloseDeleteLetter}
                    disabled={deleteLetterMutation.isPending}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
