export interface User {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  bio: string;
  avatar_url: string;
  profile_template: string;
  tagline: string;
  campus: string | null;
  major?: string;
  headline?: string;
  followers_count?: number;
  following_count?: number;
  /** Whether the requesting user follows this user. */
  is_following?: boolean;
  /** Whether the requester and this user follow each other (can DM). */
  is_mutual?: boolean;
}

export interface ProfileUpdate {
  first_name?: string;
  last_name?: string;
  bio?: string;
  avatar_url?: string;
  profile_template?: string;
  tagline?: string;
}
