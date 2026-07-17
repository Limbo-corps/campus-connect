export interface Campus {
  id: string;
  logo_url?: string;
  banner_url?: string;
  name: string;
  slug: string;
  city?: string;
  state?: string;
  description?: string;
  students_count: number;
  created_at: string;
}
