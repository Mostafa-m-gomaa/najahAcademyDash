import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../features/auth/AuthProvider'
import {
  getDictionaryLetters,
  getDictionaryWordsForLetter,
  addToFavorites,
  removeFromFavorites,
  getFavorites,
} from '../../api/dictionary'
import type { DictionaryWord, DictionaryLetter } from '../../types/dictionary'
import './StudentDictionaryPage.css'

export default function StudentDictionaryPage() {
  const { courseId } = useParams<{ courseId: string }>()
  const { token } = useAuth()
  const queryClient = useQueryClient()
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null)

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

  const { data: favoritesResponse } = useQuery({
    queryKey: ['favorites', courseId],
    queryFn: () => getFavorites(),
    enabled: Boolean(token),
  })

  const favoritesData: unknown = favoritesResponse?.data
  const favorites = Array.isArray(favoritesData) ? favoritesData : []
  const favoriteIds = new Set(
    favorites
      .map((fav): string | null => {
        if (!fav || typeof fav !== 'object') return null
        const obj = fav as Record<string, unknown>
        if (typeof obj.wordId === 'string') return obj.wordId
        if (typeof obj._id === 'string') return obj._id
        return null
      })
      .filter((id): id is string => Boolean(id))
  )

  const addToFavoritesMutation = useMutation({
    mutationFn: (wordId: string) => addToFavorites(courseId, wordId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] })
    },
  })

  const removeFromFavoritesMutation = useMutation({
    mutationFn: (wordId: string) => removeFromFavorites(courseId, wordId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] })
    },
  })

  const getTypeText = (type: 'verb' | 'noun' | 'adjective'): string => {
    const types: Record<string, string> = {
      verb: 'Verb',
      noun: 'Noun',
      adjective: 'Adjective',
    }
    return types[type] || ''
  }

  if (!courseId) {
    return <div>Course not found</div>
  }

  return (
    <div className="page student-dictionary-page">
      <div className="card page-header">
        <h1>Course Dictionary</h1>
      </div>

      <div className="dictionary-container">
        <div className="letters-section">
          <div className="section-header">
            <h2>Letters</h2>
          </div>
          {lettersLoading ? (
            <div className="loading">Loading...</div>
          ) : lettersError ? (
            <div className="error">Failed to load letters.</div>
          ) : letters.length > 0 ? (
            <div className="letters-grid">
              {letters.map((letter) => (
                <button
                  key={letter._id}
                  className={`letter-btn ${selectedLetter === letter.letter ? 'active' : ''}`}
                  onClick={() => setSelectedLetter(letter.letter)}
                >
                  {letter.letter}
                </button>
              ))}
            </div>
          ) : (
            <div className="empty-state">No letters.</div>
          )}
        </div>

        {selectedLetter && (
          <div className="words-section">
            <div className="section-header">
              <h2>Words for {selectedLetter}</h2>
            </div>
            {wordsLoading ? (
              <div className="loading">Loading...</div>
            ) : words.length > 0 ? (
              <div className="words-grid">
                {words.map((word) => (
                  <div key={word._id} className="word-card">
                    {word.verb && (
                      <div className="word-entry">
                        <div className="word-header">
                          <span className="word-type-badge verb">
                            {getTypeText('verb')}
                          </span>
                        </div>
                        <div className="word-arabic" dir="rtl">
                          {word.verb.arabic}
                        </div>
                        <div className="word-meaning">{word.verb.meaning}</div>
                      </div>
                    )}
                    {word.noun && (
                      <div className="word-entry">
                        <div className="word-header">
                          <span className="word-type-badge noun">
                            {getTypeText('noun')}
                          </span>
                        </div>
                        <div className="word-arabic" dir="rtl">
                          {word.noun.arabic}
                        </div>
                        <div className="word-meaning">{word.noun.meaning}</div>
                      </div>
                    )}
                    {word.adjective && (
                      <div className="word-entry">
                        <div className="word-header">
                          <span className="word-type-badge adjective">
                            {getTypeText('adjective')}
                          </span>
                        </div>
                        <div className="word-arabic" dir="rtl">
                          {word.adjective.arabic}
                        </div>
                        <div className="word-meaning">{word.adjective.meaning}</div>
                      </div>
                    )}
                    <button
                      className={`favorite-btn ${
                        favoriteIds.has(word._id) ? 'favorited' : ''
                      }`}
                      onClick={() => {
                        if (favoriteIds.has(word._id)) {
                          removeFromFavoritesMutation.mutate(word._id)
                        } else {
                          addToFavoritesMutation.mutate(word._id)
                        }
                      }}
                      disabled={
                        addToFavoritesMutation.isPending ||
                        removeFromFavoritesMutation.isPending
                      }
                      aria-label={
                        favoriteIds.has(word._id)
                          ? 'Remove from favorites'
                          : 'Add to favorites'
                      }
                    >
                      {favoriteIds.has(word._id) ? '★ Saved' : '☆ Save'}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">No words for this letter.</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
