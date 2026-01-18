export interface DiscoveryCategory {
  id: string;
  title: string;
  slug: string;
  description: string;
  icon_url?: string;
  theme_color_hex: string;
}

export interface DiscoveryBook {
  id: string;
  category_id: string;
  title: string;
  summary: string;
  cover_url: string;
  trailer_url?: string; // Video intro
  difficulty_level: number;
  species_code?: string;
  weight_text?: string;
  discovery_coords?: string;
  period_text?: string;
  diet_text?: string;
  audio_url?: string;
}

export interface DiscoveryHotspot {
  id: string;
  page_id: string;
  x_pos: number; // 0-100
  y_pos: number; // 0-100
  title: string;
  content: string;
}

export interface DiscoveryPage {
  id: string;
  book_id: string;
  page_number: number;
  title: string;
  content_text: string;
  image_url: string;
  video_url?: string;
  audio_url?: string;
  hotspots?: DiscoveryHotspot[];
}
