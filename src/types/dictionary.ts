export interface WordContent {
  arabic: string
  meaning: string
}

export interface DictionaryWord {
  _id: string
  letter: string
  course: string
  verb?: WordContent
  noun?: WordContent
  adjective?: WordContent
  createdAt: string
}

export interface DictionaryLetter {
  _id: string
  letter: string
  course: string
  createdAt: string
}

export interface DictionaryFavorite {
  _id: string
  word: DictionaryWord
  addedAt: string
}

export interface UserDictionaryFavorites {
  _id: string
  user: string
  favorites: DictionaryFavorite[]
}

export interface DictionaryStats {
  totalLetters: number
  totalWords: number
  letterBreakdown: Array<{
    _id: string
    count: number
  }>
}

// Payload types
export interface AddLetterPayload {
  letter: string
}

export interface AddWordPayload {
  verb?: WordContent
  noun?: WordContent
  adjective?: WordContent
}

export interface UpdateWordPayload {
  verb?: WordContent
  noun?: WordContent
  adjective?: WordContent
}
