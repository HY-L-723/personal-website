export type ThemePreference = 'light' | 'dark' | 'system';

export interface SiteSettings {
  siteName: string;
  nickname: string;
  tagline: string;
  role: string;
  bio: string;
  location: string;
  email: string;
  interests: string[];
  heroQuote: string;
  heroQuoteAuthor: string;
  avatar: string;
  heroBackground: string;
  contentBackground: string;
}

export interface Post {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  coverImage: string;
  category: string;
  tags: string[];
  publishedAt: string;
  updatedAt: string;
  readingMinutes: number;
  pinned: boolean;
  published: boolean;
}

export interface Moment {
  id: string;
  content: string;
  images: string[];
  createdAt: string;
  likes: number;
}

export interface Photo {
  id: string;
  title: string;
  description: string;
  image: string;
  takenAt: string;
}

export interface Album {
  id: string;
  name: string;
  description: string;
  coverImage: string;
  photos: Photo[];
}

export interface FriendLink {
  id: string;
  name: string;
  description: string;
  url: string;
  avatar: string;
  approved: boolean;
  createdAt: string;
}

export interface ChangelogEntry {
  id: string;
  date: string;
  changes: string[];
}

export interface GuestbookReply {
  id: string;
  author: string;
  content: string;
  createdAt: string;
}

export interface GuestbookEntry {
  id: string;
  author: string;
  location: string;
  content: string;
  createdAt: string;
  pinned: boolean;
  replies: GuestbookReply[];
}

export interface VisitDay {
  date: string;
  visitors: number;
  views: number;
}

export interface SiteData {
  version: 1;
  settings: SiteSettings;
  posts: Post[];
  moments: Moment[];
  albums: Album[];
  friendLinks: FriendLink[];
  changelog: ChangelogEntry[];
  guestbook: GuestbookEntry[];
  visits: VisitDay[];
}
