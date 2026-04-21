export type OvenStatus = "HOT" | "LOW" | "OUT"

export interface SocialPost {
  id: string
  platform: "instagram" | "facebook" | "twitter"
  image: string
  caption: string
  likes: number
  comments: number
  timestamp: string
}

export interface Competitor {
  name: string
  ranking: number
}

export interface Review {
  id: string
  author: string
  rating: number
  text: string
  timestamp: string
  aiResponse: string
}

export interface SuggestedPost {
  optimized_post: string
  surgical_reason: string
}

export interface BusinessData {
  name: string
  logo: string
  url: string
  postcode: string
  socialPosts: SocialPost[]
  competitors: Competitor[]
  reviews: Review[]
  suggestedPost: SuggestedPost
}
