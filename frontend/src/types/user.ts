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
}

export interface ProfileUpdate {
  first_name?: string;
  last_name?: string;
  bio?: string;
  avatar_url?: string;
  profile_template?: string;
  tagline?: string;
}
