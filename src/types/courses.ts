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

export interface CoursePricingPlan {
  id?: string
  _id?: string
  durationDays: number
  price: number
}

export interface Course {
  _id?: string
  id?: string
  title: string
  description?: string
  features?: string[]
  pricingPlans?: CoursePricingPlan[]
  isPublished?: boolean
  courseImage?: string
  topics?: Topic[]
}
