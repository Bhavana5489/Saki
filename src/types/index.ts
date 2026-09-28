export type TabType = 'home' | 'breathe' | 'dump' | 'quiet';

export type ViewType =
  | TabType
  | 'welcome'
  | 'companion'
  | 'companion_stay'
  | 'companion_action';

export type BreathingSpeed = 'gentle' | 'slow' | 'veryslow';

export type NatureSound = 'rain' | 'breeze' | 'forest';

export interface JournalSticker {
  id: string;
  type: string; // e.g. 'flower' | 'leaf' | 'star' | 'heart' | 'cloud' | 'sparkle' | 'coffee' | 'moon' | 'tape' | 'sprout'
  x: number; // percentage 0-100% across page
  y: number; // percentage 0-100% down page
  rotation: number; // -15 to +15 deg
  scale?: number; // scale factor between 0.6 and 2.5 (default 1.0)
}

export interface JournalPage {
  id: string;
  text: string;
  stickers: JournalSticker[];
}

export interface JournalEntry {
  id: string;
  pages: JournalPage[];
  createdAt: string;
  updatedAt: number;
}

// Backward compatibility with previous dump note structure
export interface DumpNote {
  id: string;
  content: string;
  createdAt: string;
}

export interface GroundingPrompt {
  id: string;
  text: string;
}

export type ThemeMode = 'light' | 'dusk';
