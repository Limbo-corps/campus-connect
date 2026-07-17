export type PostType = "text" | "photo" | "article" | "feeling";

export interface Post {
  id: string;
  author: string;
  author_avatar?: string;
  campus: string;
  post_type: PostType;
  title?: string;
  content: string;
  feeling?: string;
  image_url?: string | null;
  likes_count: number;
  is_liked: boolean;
  created_at: string;
  updated_at: string;
}