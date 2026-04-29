export interface Lecture {
  _id: string
  title: string
  videoName?: string
  videoUrl?: string
}

export interface Topic {
  _id: string
  title: string
  description?: string
  topicImage?: string
  topicDocuments?: string[]
  lectures?: Lecture[]
}

export interface Course {
  _id: string
  title: string
  description?: string
  price: number
  isPublished?: boolean
  courseImage?: string
  topics?: Topic[]
}
