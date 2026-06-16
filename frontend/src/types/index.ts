export interface User {
  id: string
  username: string
  email: string
  first_name: string
  last_name: string
  bio?: string
  avatar_url?: string
  profile_template?: string
  tagline?: string
  campus?: string | null
}

export interface ProfileUpdate {
  first_name?: string
  last_name?: string
  bio?: string
  avatar_url?: string
  profile_template?: string
  tagline?: string
}

export interface Campus {
  id: string
  logo_url?: string
  banner_url?: string
  name: string
  slug: string
  city?: string
  state?: string
  description?: string
  students_count: number
  created_at: string
}

export type PostType = 'text' | 'photo' | 'article' | 'feeling'

export interface Post {
  id: string
  author: string
  author_avatar?: string
  campus: string
  post_type: PostType
  title?: string
  content: string
  feeling?: string
  image_url?: string | null
  likes_count: number
  is_liked: boolean
  created_at: string
  updated_at: string
}

export interface Comment {
  id: string
  post: string
  author: string
  author_avatar?: string
  content: string
  created_at: string
  updated_at: string
}
