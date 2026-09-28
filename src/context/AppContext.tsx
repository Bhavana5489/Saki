import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { ViewType, TabType, ThemeMode, JournalEntry, DumpNote, NatureSound } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { useSound } from '../hooks/useSound';
import { App as CapApp } from '@capacitor/app';

interface AppContextType {
  currentView: ViewType;
  activeTab: TabType;
  theme: ThemeMode;
  savedJournals: JournalEntry[];
  activeDraftJournal: JournalEntry;
  activeEditingId: string | null;
  isReducedMotion: boolean;
  overrideReducedMotion: boolean;
  isMuted: boolean;
  ambientSound: NatureSound;
  hasSeenWelcome: boolean;
  isSafetyOpen: boolean;

  setCurrentView: (view: ViewType) => void;
  setActiveTab: (tab: TabType) => void;
  setActiveDraftJournal: React.Dispatch<React.SetStateAction<JournalEntry>>;
  setActiveEditingId: (id: string | null) => void;
  setTheme: (theme: ThemeMode | ((prev: ThemeMode) => ThemeMode)) => void;
  setOverrideReducedMotion: (val: boolean | ((prev: boolean) => boolean)) => void;
  toggleMute: () => void;
  selectAmbientSound: (sound: NatureSound) => void;
  playChime: (freq?: number) => void;
  playWinCheer: () => void;
  playSliceSound: (intensity?: number) => void;
  playPaddleHit: (intensity?: number) => void;
  playTableBounce: (pitch?: number) => void;
  playFloorBounce: (pitch?: number) => void;
  playStroopCorrect: (streakCount?: number) => void;
  playStroopMistake: () => void;
  playNoticeFound: (noteIdx?: number) => void;
  dismissWelcome: () => void;
  saveJournalEntry: (entry: JournalEntry) => void;
  deleteJournalEntry: (id: string) => void;
  clearAllJournals: () => void;
  loadJournalForEditing: (entry: JournalEntry) => void;
  startNewJournalDraft: () => void;
  setIsSafetyOpen: (open: boolean) => void;
  navigateTab: (tab: TabType) => void;
  handleBack: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const createDefaultDraft = (): JournalEntry => ({
  id: 'draft_' + Date.now(),
  pages: [
    {
      id: 'page_' + Date.now(),
      text: '',
      stickers: []
    }
  ],
  createdAt: new Date().toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric'
  }),
  updatedAt: Date.now()
});

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hasSeenWelcome, setHasSeenWelcome] = useLocalStorage<boolean>('still_has_seen_welcome', false);
  const [currentView, setCurrentView] = useState<ViewType>(() => (hasSeenWelcome ? 'home' : 'welcome'));
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [theme, setTheme] = useLocalStorage<ThemeMode>('still_theme', 'light');

  // Saved journals in localStorage
  const [savedJournals, setSavedJournals] = useLocalStorage<JournalEntry[]>('still_saved_journals_v2', []);

  // Backward compatibility check for previous simple dump notes
  const [legacyDumps] = useLocalStorage<DumpNote[]>('still_saved_dumps', []);

  // Active working journal draft in memory
  const [activeDraftJournal, setActiveDraftJournal] = useState<JournalEntry>(createDefaultDraft);
  const [activeEditingId, setActiveEditingId] = useState<string | null>(null);

  const [isSafetyOpen, setIsSafetyOpen] = useState<boolean>(false);

  const currentViewRef = useRef(currentView);
  const isSafetyOpenRef = useRef(isSafetyOpen);

  useEffect(() => {
    currentViewRef.current = currentView;
  }, [currentView]);

  useEffect(() => {
    isSafetyOpenRef.current = isSafetyOpen;
  }, [isSafetyOpen]);

  // Migration from legacy dump notes to structured journal entries if any exist
  useEffect(() => {
    if (legacyDumps && legacyDumps.length > 0 && savedJournals.length === 0) {
      const migrated: JournalEntry[] = legacyDumps.map((dump) => ({
        id: dump.id,
        createdAt: dump.createdAt,
        updatedAt: parseInt(dump.id, 10) || Date.now(),
        pages: [
          {
            id: 'page_' + dump.id,
            text: dump.content,
            stickers: []
          }
        ]
      }));
      setSavedJournals(migrated);
    }
  }, [legacyDumps, savedJournals.length, setSavedJournals]);

  const { isReducedMotion, overrideReducedMotion, setOverrideReducedMotion } = useReducedMotion();
  const {
    isMuted,
    ambientSound,
    selectAmbientSound,
    toggleMute,
    playChime,
    playWinCheer,
    playSliceSound,
    playPaddleHit,
    playTableBounce,
    playFloorBounce,
    playStroopCorrect,
    playStroopMistake,
    playNoticeFound
  } = useSound();

  // Apply theme to document element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Apply reduced-motion class to root
  useEffect(() => {
    if (isReducedMotion) {
      document.documentElement.classList.add('reduced-motion-active');
    } else {
      document.documentElement.classList.remove('reduced-motion-active');
    }
  }, [isReducedMotion]);

  const dismissWelcome = useCallback(() => {
    setHasSeenWelcome(true);
    setCurrentView('home');
    setActiveTab('home');
  }, [setHasSeenWelcome]);

  const navigateTab = useCallback(
    (tab: TabType) => {
      setActiveTab(tab);
      setCurrentView(tab);
    },
    []
  );

  const handleBack = useCallback(() => {
    if (isSafetyOpenRef.current) {
      setIsSafetyOpen(false);
      return;
    }
    const view = currentViewRef.current;
    if (view === 'companion_stay' || view === 'companion_action') {
      setCurrentView('companion');
    } else if (view === 'companion' || view === 'breathe' || view === 'dump' || view === 'quiet') {
      setCurrentView('home');
      setActiveTab('home');
    }
  }, []);

  // Native Android Hardware & Gesture Back Button Handler
  useEffect(() => {
    let backListenerHandle: { remove: () => void } | null = null;

    const setupListener = async () => {
      try {
        backListenerHandle = await CapApp.addListener('backButton', () => {
          if (isSafetyOpenRef.current) {
            setIsSafetyOpen(false);
            return;
          }

          const view = currentViewRef.current;
          if (view === 'companion_stay' || view === 'companion_action') {
            setCurrentView('companion');
          } else if (view === 'companion' || view === 'breathe' || view === 'dump' || view === 'quiet') {
            setCurrentView('home');
            setActiveTab('home');
          } else if (view === 'home' || view === 'welcome') {
            CapApp.exitApp();
          }
        });
      } catch {
        // Fallback for non-Capacitor browser environment
      }
    };

    setupListener();

    return () => {
      if (backListenerHandle) {
        backListenerHandle.remove();
      }
    };
  }, []);

  // Save or update a Journal Entry
  const saveJournalEntry = useCallback(
    (entry: JournalEntry) => {
      const hasContent = entry.pages.some((p) => p.text.trim().length > 0 || p.stickers.length > 0);
      if (!hasContent) return;

      const updatedEntry: JournalEntry = {
        ...entry,
        updatedAt: Date.now()
      };

      setSavedJournals((prev) => {
        const existingIdx = prev.findIndex((j) => j.id === updatedEntry.id);
        if (existingIdx >= 0) {
          const updated = [...prev];
          updated[existingIdx] = updatedEntry;
          return updated;
        }
        return [updatedEntry, ...prev];
      });
      setActiveEditingId(updatedEntry.id);
    },
    [setSavedJournals]
  );

  // Delete a saved Journal Entry
  const deleteJournalEntry = useCallback(
    (id: string) => {
      setSavedJournals((prev) => prev.filter((j) => j.id !== id));
      if (activeEditingId === id) {
        setActiveEditingId(null);
        setActiveDraftJournal(createDefaultDraft());
      }
    },
    [activeEditingId, setSavedJournals]
  );

  // Clear all saved journal entries
  const clearAllJournals = useCallback(() => {
    setSavedJournals([]);
    setActiveEditingId(null);
    setActiveDraftJournal(createDefaultDraft());
  }, [setSavedJournals]);

  // Load a saved entry into the active editor
  const loadJournalForEditing = useCallback((entry: JournalEntry) => {
    setActiveDraftJournal(JSON.parse(JSON.stringify(entry))); // clone deep
    setActiveEditingId(entry.id);
  }, []);

  // Start fresh blank journal draft
  const startNewJournalDraft = useCallback(() => {
    setActiveDraftJournal(createDefaultDraft());
    setActiveEditingId(null);
  }, []);

  return (
    <AppContext.Provider
      value={{
        currentView,
        activeTab,
        theme,
        savedJournals,
        activeDraftJournal,
        activeEditingId,
        isReducedMotion,
        overrideReducedMotion,
        isMuted,
        ambientSound,
        hasSeenWelcome,
        isSafetyOpen,
        setCurrentView,
        setActiveTab,
        setActiveDraftJournal,
        setActiveEditingId,
        setTheme,
        setOverrideReducedMotion,
        toggleMute,
        selectAmbientSound,
        playChime,
        playWinCheer,
        playSliceSound,
        playPaddleHit,
        playTableBounce,
        playFloorBounce,
        playStroopCorrect,
        playStroopMistake,
        playNoticeFound,
        dismissWelcome,
        saveJournalEntry,
        deleteJournalEntry,
        clearAllJournals,
        loadJournalForEditing,
        startNewJournalDraft,
        setIsSafetyOpen,
        navigateTab,
        handleBack
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
