import api from './client'
import type { ApiResponse } from '../types/api'
import type {
  DictionaryWord,
  DictionaryLetter,
  UserDictionaryFavorites,
  DictionaryStats,
  AddLetterPayload,
  AddWordPayload,
  UpdateWordPayload,
} from '../types/dictionary'

// Admin: Add a letter to dictionary
export async function addDictionaryLetter(
  courseId: string,
  payload: AddLetterPayload,
) {
  const { data } = await api.post<ApiResponse<{ letter: DictionaryLetter }>>(
    `/courses/${courseId}/dictionary/letters`,
    payload,
  )
  return data
}

// Admin: Add a word to a letter
export async function addDictionaryWord(
  courseId: string,
  letter: string,
  payload: AddWordPayload,
) {
  const { data } = await api.post<ApiResponse<{ word: DictionaryWord }>>(
    `/courses/${courseId}/dictionary/letters/${letter}/words`,
    payload,
  )
  return data
}

// Admin: Update a word
export async function updateDictionaryWord(
  courseId: string,
  wordId: string,
  payload: UpdateWordPayload,
) {
  const { data } = await api.patch<ApiResponse<{ word: DictionaryWord }>>(
    `/courses/${courseId}/dictionary/words/${wordId}`,
    payload,
  )
  return data
}

// Admin: Delete a word
export async function deleteDictionaryWord(
  courseId: string,
  wordId: string,
) {
  const { data } = await api.delete<ApiResponse<null>>(
    `/courses/${courseId}/dictionary/words/${wordId}`,
  )
  return data
}

// Admin: Delete a letter and all its words
export async function deleteDictionaryLetter(
  courseId: string,
  letter: string,
) {
  const { data } = await api.delete<ApiResponse<null>>(
    `/courses/${courseId}/dictionary/letters/${letter}`,
  )
  return data
}

// Admin: Get dictionary statistics
export async function getDictionaryStats(courseId: string) {
  const { data } = await api.get<ApiResponse<{ stats: DictionaryStats }>>(
    `/courses/${courseId}/dictionary/stats`,
  )
  return data
}

// Student: Get all letters for a course
export async function getDictionaryLetters(courseId: string) {
  const { data } = await api.get<
    ApiResponse<{ letters: DictionaryLetter[] }>
  >(`/courses/${courseId}/dictionary/letters`)
  const letters = Array.isArray(data.data) ? data.data : data.data?.letters ?? []
  return { ...data, data: letters }
}

// Student: Get words for a specific letter
export async function getDictionaryWordsForLetter(
  courseId: string,
  letter: string,
) {
  const { data } = await api.get<
    ApiResponse<{ words: DictionaryWord[]; count?: number }>
  >(`/courses/${courseId}/dictionary/letters/${letter}/words`)
  const words = Array.isArray(data.data) ? data.data : data.data?.words ?? []
  return { ...data, data: words }
}

// Student: Get word details
export async function getDictionaryWord(courseId: string, wordId: string) {
  const { data } = await api.get<ApiResponse<{ word: DictionaryWord }>>(
    `/courses/${courseId}/dictionary/words/${wordId}`,
  )
  return data
}

// Favorites: Add word to favorites
export async function addToFavorites(_courseId: string, wordId: string) {
  const { data } = await api.post<ApiResponse<{ favorites: UserDictionaryFavorites }>>(
    `/dictionary/favorites/${wordId}`,
  )
  return data
}

// Favorites: Remove word from favorites
export async function removeFromFavorites(_courseId: string, wordId: string) {
  const { data } = await api.delete<ApiResponse<{ favorites: UserDictionaryFavorites }>>(
    `/dictionary/favorites/${wordId}`,
  )
  return data
}

// Favorites: Get all favorites
export async function getFavorites() {
  const { data } = await api.get<
    ApiResponse<UserDictionaryFavorites[]>
  >('/dictionary/favorites')
  const favorites = Array.isArray(data.data) ? data.data : []
  return { ...data, data: favorites }
}

// Favorites: Get favorites for a specific course
export async function getCourseFavorites(courseId: string) {
  const { data } = await api.get<ApiResponse<{ favorites: UserDictionaryFavorites }>>(
    `/courses/${courseId}/dictionary/my-favorites`,
  )
  return data
}
