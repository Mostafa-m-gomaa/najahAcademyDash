import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../features/auth/AuthProvider'
import { getFavorites, removeFromFavorites } from '../../api/dictionary'
import './FavoritesPage.css'

type FavoriteItem = {
  _id?: string
  wordId?: string
  letter?: string
  verb?: { arabic: string; meaning: string }
  noun?: { arabic: string; meaning: string }
  adjective?: { arabic: string; meaning: string }
}

export default function FavoritesPage() {
  const navigate = useNavigate()
  const { token } = useAuth()
  const queryClient = useQueryClient()

  const {
    data: favoritesResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['favorites'],
    queryFn: () => getFavorites(),
    enabled: !!token,
  })

  const favoritesData: unknown = favoritesResponse?.data
  const favorites: FavoriteItem[] = Array.isArray(favoritesData)
    ? (favoritesData as FavoriteItem[])
    : []

  const removeFromFavoritesMutation = useMutation({
    mutationFn: (wordId: string) => removeFromFavorites('course-id', wordId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] })
    },
  })

  const groupedByLetter = favorites.reduce(
    (acc: Record<string, FavoriteItem[]>, fav) => {
      const letter = fav.letter || 'Other'
      if (!acc[letter]) acc[letter] = []
      acc[letter].push(fav)
      return acc
    },
    {}
  )

  const sortedLetters = Object.keys(groupedByLetter).sort()

  const getTypeText = (type: 'verb' | 'noun' | 'adjective'): string => {
    const types: Record<string, string> = {
      verb: 'Verb',
      noun: 'Noun',
      adjective: 'Adjective',
    }
    return types[type] || ''
  }

  return (
    <div className="page favorites-page">
      <div className="card page-header">
        <h1>Favorites</h1>
        <p className="subtitle">
          {favorites.length > 0
            ? `You have ${favorites.length} saved word${favorites.length === 1 ? '' : 's'}.`
            : "You haven't saved any words yet."}
        </p>
      </div>

      <div className="favorites-container">
        {isLoading ? (
          <div className="loading">Loading...</div>
        ) : error ? (
          <div className="error">Failed to load favorites.</div>
        ) : favorites.length === 0 ? (
          <div className="empty-state card">
            <div className="empty-icon">☆</div>
            <h2>No saved words</h2>
            <p>
              Start saving words from the dictionary to see them here.
            </p>
            <button className="btn-primary" onClick={() => navigate('/learn')}>
              Browse courses
            </button>
          </div>
        ) : (
          sortedLetters.map((letter) => (
            <div key={letter} className="letter-group">
              <div className="letter-header">
                <h2>{letter}</h2>
              </div>
              <div className="words-grid">
                {groupedByLetter[letter].map((favorite) => (
                  <div key={favorite.wordId || favorite._id} className="word-card">
                    {favorite.verb && (
                      <div className="word-entry">
                        <div className="word-header">
                          <span className="word-type-badge verb">
                            {getTypeText('verb')}
                          </span>
                        </div>
                        <div className="word-arabic" dir="rtl">
                          {favorite.verb.arabic}
                        </div>
                        <div className="word-meaning">{favorite.verb.meaning}</div>
                      </div>
                    )}
                    {favorite.noun && (
                      <div className="word-entry">
                        <div className="word-header">
                          <span className="word-type-badge noun">
                            {getTypeText('noun')}
                          </span>
                        </div>
                        <div className="word-arabic" dir="rtl">
                          {favorite.noun.arabic}
                        </div>
                        <div className="word-meaning">{favorite.noun.meaning}</div>
                      </div>
                    )}
                    {favorite.adjective && (
                      <div className="word-entry">
                        <div className="word-header">
                          <span className="word-type-badge adjective">
                            {getTypeText('adjective')}
                          </span>
                        </div>
                        <div className="word-arabic" dir="rtl">
                          {favorite.adjective.arabic}
                        </div>
                        <div className="word-meaning">{favorite.adjective.meaning}</div>
                      </div>
                    )}
                    <button
                      className="remove-btn"
                      onClick={() =>
                        removeFromFavoritesMutation.mutate(
                          favorite.wordId || favorite._id
                        )
                      }
                      disabled={removeFromFavoritesMutation.isPending}
                      aria-label="Remove from favorites"
                    >
                      ★ Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
