import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Sparkles,
  Trash2,
  Bookmark,
  Check,
  FolderHeart,
  X,
  ChevronLeft,
  ChevronRight,
  Plus,
  Smile,
  BookOpen,
  Edit3,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { JournalSticker, JournalEntry } from '../types';

// Palette of mature, aesthetic journal stickers
const STICKER_PALETTE: { type: string; label: string; icon: string; defaultRotation: number }[] = [
  { type: 'leaf', label: 'Leaf', icon: '🍃', defaultRotation: -8 },
  { type: 'flower', label: 'Flower', icon: '🌸', defaultRotation: 6 },
  { type: 'star', label: 'Star', icon: '⭐', defaultRotation: -4 },
  { type: 'heart', label: 'Heart', icon: '🤍', defaultRotation: 4 },
  { type: 'cloud', label: 'Cloud', icon: '☁️', defaultRotation: 0 },
  { type: 'sparkle', label: 'Sparkle', icon: '✨', defaultRotation: 8 },
  { type: 'coffee', label: 'Warm cup', icon: '☕', defaultRotation: -3 },
  { type: 'sprout', label: 'Sprout', icon: '🌿', defaultRotation: 5 },
  { type: 'moon', label: 'Moon', icon: '🌙', defaultRotation: -10 },
  { type: 'sun', label: 'Sun', icon: '☀️', defaultRotation: 4 },
  { type: 'tape', label: 'Washi tape', icon: '🏷️', defaultRotation: -2 }
];

export const DumpView: React.FC = () => {
  const {
    savedJournals,
    activeDraftJournal,
    setActiveDraftJournal,
    activeEditingId,
    saveJournalEntry,
    deleteJournalEntry,
    clearAllJournals,
    loadJournalForEditing,
    startNewJournalDraft,
    playChime,
    isReducedMotion
  } = useApp();

  const [currentPageIdx, setCurrentPageIdx] = useState(0);
  const [pageTurnDir, setPageTurnDir] = useState<'left' | 'right' | null>(null);
  const [isDissolving, setIsDissolving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [showSavedList, setShowSavedList] = useState(false);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [selectedStickerId, setSelectedStickerId] = useState<string | null>(null);
  const [journalToDelete, setJournalToDelete] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const pageContainerRef = useRef<HTMLDivElement | null>(null);

  // Dragging & Gesture references
  const draggingStickerRef = useRef<{ id: string; startPointerX: number; startPointerY: number; initX: number; initY: number } | null>(null);
  const pinchRef = useRef<{ id: string; initDist: number; initScale: number } | null>(null);
  const resizingRef = useRef<{ id: string; startPointerY: number; initScale: number } | null>(null);

  const currentPage = activeDraftJournal.pages[currentPageIdx] || activeDraftJournal.pages[0];
  const totalPages = activeDraftJournal.pages.length;

  // Auto-resize textarea height as user writes
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.max(textareaRef.current.scrollHeight, 280)}px`;
    }
  }, [currentPage?.text, currentPageIdx]);

  // Update text of current active page
  const handleTextChange = (text: string) => {
    setActiveDraftJournal((prev) => {
      const updatedPages = [...prev.pages];
      if (updatedPages[currentPageIdx]) {
        updatedPages[currentPageIdx] = {
          ...updatedPages[currentPageIdx],
          text
        };
      }
      return { ...prev, pages: updatedPages };
    });
  };

  // Add new blank page to current journal
  const handleAddPage = () => {
    const newPage = {
      id: 'page_' + Date.now(),
      text: '',
      stickers: []
    };
    setActiveDraftJournal((prev) => ({
      ...prev,
      pages: [...prev.pages, newPage]
    }));
    setPageTurnDir('right');
    setCurrentPageIdx(activeDraftJournal.pages.length);
    setSelectedStickerId(null);
  };

  // Turn to Previous page
  const handlePrevPage = () => {
    if (currentPageIdx > 0) {
      setPageTurnDir('left');
      setCurrentPageIdx((p) => p - 1);
      setSelectedStickerId(null);
    }
  };

  // Turn to Next page
  const handleNextPage = () => {
    if (currentPageIdx < totalPages - 1) {
      setPageTurnDir('right');
      setCurrentPageIdx((p) => p + 1);
      setSelectedStickerId(null);
    }
  };

  // Add a sticker to the current page
  const handleAddSticker = (type: string, defaultRotation: number) => {
    const newSticker: JournalSticker = {
      id: 'stk_' + Date.now(),
      type,
      // Position nicely inside the top-right / middle of the page
      x: 65 + (Math.random() - 0.5) * 15,
      y: 30 + (Math.random() - 0.5) * 15,
      rotation: defaultRotation + (Math.random() - 0.5) * 6,
      scale: 1.0
    };

    setActiveDraftJournal((prev) => {
      const updatedPages = [...prev.pages];
      if (updatedPages[currentPageIdx]) {
        updatedPages[currentPageIdx] = {
          ...updatedPages[currentPageIdx],
          stickers: [...updatedPages[currentPageIdx].stickers, newSticker]
        };
      }
      return { ...prev, pages: updatedPages };
    });

    setSelectedStickerId(newSticker.id);
    setShowStickerPicker(false);
  };

  // Remove a sticker cleanly & reliably
  const handleRemoveSticker = (stickerId: string, e?: React.MouseEvent | React.TouchEvent) => {
    if (e) e.stopPropagation();
    setActiveDraftJournal((prev) => {
      const updatedPages = [...prev.pages];
      if (updatedPages[currentPageIdx]) {
        updatedPages[currentPageIdx] = {
          ...updatedPages[currentPageIdx],
          stickers: updatedPages[currentPageIdx].stickers.filter((s) => s.id !== stickerId)
        };
      }
      return { ...prev, pages: updatedPages };
    });
    if (selectedStickerId === stickerId) {
      setSelectedStickerId(null);
    }
  };

  // Adjust sticker scale factor directly
  const handleScaleSticker = (stickerId: string, delta: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setActiveDraftJournal((prev) => {
      const updatedPages = [...prev.pages];
      if (updatedPages[currentPageIdx]) {
        updatedPages[currentPageIdx] = {
          ...updatedPages[currentPageIdx],
          stickers: updatedPages[currentPageIdx].stickers.map((s) => {
            if (s.id !== stickerId) return s;
            const currentScale = s.scale ?? 1.0;
            const newScale = Math.min(2.4, Math.max(0.55, currentScale + delta));
            return { ...s, scale: parseFloat(newScale.toFixed(2)) };
          })
        };
      }
      return { ...prev, pages: updatedPages };
    });
  };

  // Pointer drag to move sticker across paper
  const handleStickerPointerDown = (stk: JournalSticker, e: React.PointerEvent) => {
    e.stopPropagation();
    setSelectedStickerId(stk.id);

    draggingStickerRef.current = {
      id: stk.id,
      startPointerX: e.clientX,
      startPointerY: e.clientY,
      initX: stk.x,
      initY: stk.y
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleStickerPointerMove = useCallback((e: React.PointerEvent) => {
    if (resizingRef.current) {
      // Corner resize drag
      const { id, startPointerY, initScale } = resizingRef.current;
      const deltaY = startPointerY - e.clientY;
      const newScale = Math.min(2.4, Math.max(0.55, initScale + deltaY * 0.015));

      setActiveDraftJournal((prev) => {
        const updatedPages = [...prev.pages];
        if (updatedPages[currentPageIdx]) {
          updatedPages[currentPageIdx] = {
            ...updatedPages[currentPageIdx],
            stickers: updatedPages[currentPageIdx].stickers.map((s) =>
              s.id === id ? { ...s, scale: parseFloat(newScale.toFixed(2)) } : s
            )
          };
        }
        return { ...prev, pages: updatedPages };
      });
      return;
    }

    if (!draggingStickerRef.current || !pageContainerRef.current) return;
    const { id, startPointerX, startPointerY, initX, initY } = draggingStickerRef.current;
    const rect = pageContainerRef.current.getBoundingClientRect();

    const deltaXPercent = ((e.clientX - startPointerX) / rect.width) * 100;
    const deltaYPercent = ((e.clientY - startPointerY) / rect.height) * 100;

    const xPercent = Math.max(8, Math.min(92, initX + deltaXPercent));
    const yPercent = Math.max(8, Math.min(92, initY + deltaYPercent));

    setActiveDraftJournal((prev) => {
      const updatedPages = [...prev.pages];
      if (updatedPages[currentPageIdx]) {
        updatedPages[currentPageIdx] = {
          ...updatedPages[currentPageIdx],
          stickers: updatedPages[currentPageIdx].stickers.map((s) =>
            s.id === id ? { ...s, x: parseFloat(xPercent.toFixed(1)), y: parseFloat(yPercent.toFixed(1)) } : s
          )
        };
      }
      return { ...prev, pages: updatedPages };
    });
  }, [currentPageIdx, setActiveDraftJournal]);

  const handleStickerPointerUp = (e: React.PointerEvent) => {
    if (draggingStickerRef.current) {
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // Handled
      }
      draggingStickerRef.current = null;
    }
    if (resizingRef.current) {
      resizingRef.current = null;
    }
  };

  // Two-finger touch gesture for smooth pinch-to-resize on mobile devices
  const handleStickerTouchStart = (stk: JournalSticker, e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.stopPropagation();
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      pinchRef.current = {
        id: stk.id,
        initDist: dist,
        initScale: stk.scale ?? 1.0
      };
    }
  };

  const handleStickerTouchMove = (e: React.TouchEvent) => {
    if (pinchRef.current && e.touches.length === 2) {
      e.preventDefault();
      e.stopPropagation();
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const ratio = dist / (pinchRef.current.initDist || 1);
      const newScale = Math.min(2.4, Math.max(0.55, pinchRef.current.initScale * ratio));

      const { id } = pinchRef.current;
      setActiveDraftJournal((prev) => {
        const updatedPages = [...prev.pages];
        if (updatedPages[currentPageIdx]) {
          updatedPages[currentPageIdx] = {
            ...updatedPages[currentPageIdx],
            stickers: updatedPages[currentPageIdx].stickers.map((s) =>
              s.id === id ? { ...s, scale: parseFloat(newScale.toFixed(2)) } : s
            )
          };
        }
        return { ...prev, pages: updatedPages };
      });
    }
  };

  const handleStickerTouchEnd = () => {
    pinchRef.current = null;
  };

  // Let it disappear (Discard current draft smoothly)
  const handleDisappear = () => {
    const hasContent = activeDraftJournal.pages.some(
      (p) => p.text.trim().length > 0 || p.stickers.length > 0
    );
    if (!hasContent) return;

    setIsDissolving(true);
    setTimeout(() => {
      startNewJournalDraft();
      setCurrentPageIdx(0);
      setSelectedStickerId(null);
      setIsDissolving(false);
      textareaRef.current?.focus();
    }, 400);
  };

  // Keep / Save this journal entry locally
  const handleKeep = () => {
    const hasContent = activeDraftJournal.pages.some(
      (p) => p.text.trim().length > 0 || p.stickers.length > 0
    );
    if (!hasContent) return;

    saveJournalEntry(activeDraftJournal);
    setJustSaved(true);
    setTimeout(() => {
      setJustSaved(false);
    }, 1600);
  };

  const confirmDeleteJournal = (id: string) => {
    deleteJournalEntry(id);
    setJournalToDelete(null);
  };

  const hasContent = activeDraftJournal.pages.some(
    (p) => p.text.trim().length > 0 || p.stickers.length > 0
  );

  return (
    <main
      className="fade-in"
      onClick={() => {
        setSelectedStickerId(null);
        setShowStickerPicker(false);
      }}
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        padding: '6px 16px 14px 16px',
        gap: '10px',
        position: 'relative',
        minHeight: 0
      }}
    >
      {/* 1. SLIM TOP BAR: Compact Title & Saved Drawer */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          minHeight: '34px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <BookOpen size={17} style={{ color: 'var(--accent-soft-sage)' }} />
          <h1
            style={{
              fontSize: '1.25rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
              letterSpacing: '-0.01em'
            }}
          >
            Private Journal
          </h1>
          {activeEditingId && (
            <span
              style={{
                fontSize: '0.7rem',
                padding: '2px 6px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--accent-sage-bg)',
                color: 'var(--accent-soft-sage)',
                fontWeight: 600
              }}
            >
              Editing
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {activeEditingId && (
            <button
              onClick={startNewJournalDraft}
              aria-label="Start a new blank journal entry"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
                padding: '4px 10px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-secondary)',
                fontSize: '0.75rem',
                fontWeight: 500,
                minHeight: '32px'
              }}
            >
              <Edit3 size={12} />
              <span>New</span>
            </button>
          )}

          <button
            onClick={() => setShowSavedList(true)}
            aria-label={`View saved journal entries, ${savedJournals.length} stored`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '4px 12px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-secondary)',
              fontSize: '0.75rem',
              fontWeight: 500,
              minHeight: '32px',
              transition: 'var(--transition-gentle)'
            }}
          >
            <FolderHeart size={13} style={{ color: 'var(--accent-soft-sage)' }} />
            <span>Saved ({savedJournals.length})</span>
          </button>
        </div>
      </div>

      {/* 2. DOMINANT EXPANSIVE PHYSICAL JOURNAL NOTEBOOK PAGE */}
      <div
        ref={pageContainerRef}
        onPointerMove={handleStickerPointerMove}
        className={
          !isReducedMotion && pageTurnDir === 'right'
            ? 'page-turn-right'
            : !isReducedMotion && pageTurnDir === 'left'
            ? 'page-turn-left'
            : ''
        }
        onAnimationEnd={() => setPageTurnDir(null)}
        style={{
          flex: 1,
          minHeight: '360px',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--bg-journal-paper)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--journal-lines)',
          boxShadow: 'var(--journal-shadow)',
          padding: '16px 18px 12px 20px',
          position: 'relative',
          transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
          opacity: isDissolving ? 0 : 1,
          transform: isDissolving ? 'scale(0.97) translateY(-6px)' : 'scale(1) translateY(0)',
          filter: isDissolving ? 'blur(8px)' : 'none',
          overflow: 'visible'
        }}
      >
        {/* Subtle Journal Left Red Margin Line */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: '28px',
            width: '1px',
            backgroundColor: 'var(--journal-margin)',
            pointerEvents: 'none',
            zIndex: 1
          }}
        />

        {/* Subtle Journal Spine / Binding Shadow on left edge */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: 0,
            width: '12px',
            background: 'linear-gradient(to right, rgba(0,0,0,0.06), transparent)',
            pointerEvents: 'none',
            zIndex: 2,
            borderTopLeftRadius: 'var(--radius-lg)',
            borderBottomLeftRadius: 'var(--radius-lg)'
          }}
        />

        {/* Top Journal Page Header: Date & Sticker Opener */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '6px',
            paddingLeft: '16px',
            zIndex: 4
          }}
        >
          <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
            {activeDraftJournal.createdAt || 'Today'}
          </div>

          <div style={{ position: 'relative' }}>
            {/* Sticker Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowStickerPicker((p) => !p);
                setSelectedStickerId(null);
              }}
              aria-label="Add sticker to page"
              title="Add sticker"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 10px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: showStickerPicker ? 'var(--accent-sage-bg)' : 'var(--bg-secondary)',
                color: showStickerPicker ? 'var(--accent-soft-sage)' : 'var(--text-secondary)',
                fontSize: '0.74rem',
                fontWeight: 500,
                border: '1px solid var(--border-subtle)',
                transition: 'var(--transition-gentle)'
              }}
            >
              <Smile size={12} />
              <span>Sticker</span>
            </button>

            {/* Sticker Palette Popover */}
            {showStickerPicker && (
              <div
                onClick={(e) => e.stopPropagation()}
                style={{
                  position: 'absolute',
                  top: '32px',
                  right: 0,
                  backgroundColor: 'var(--bg-surface)',
                  borderRadius: 'var(--radius-md)',
                  padding: '8px',
                  boxShadow: 'var(--shadow-floating)',
                  border: '1px solid var(--border-subtle)',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '6px',
                  zIndex: 40,
                  animation: 'fadeIn 0.15s ease-out'
                }}
              >
                {STICKER_PALETTE.map((stk) => (
                  <button
                    key={stk.type}
                    onClick={() => handleAddSticker(stk.type, stk.defaultRotation)}
                    aria-label={`Place ${stk.label} sticker`}
                    title={stk.label}
                    style={{
                      fontSize: '1.35rem',
                      padding: '7px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--bg-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'transform 0.15s ease'
                    }}
                  >
                    {stk.icon}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 3. WRITING EXPERIENCE - DOMINANT & SPACIOUS */}
        <div
          style={{
            flex: 1,
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            paddingLeft: '16px',
            zIndex: 3
          }}
        >
          <textarea
            ref={textareaRef}
            value={currentPage?.text || ''}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder="Write freely... let the words flow onto the page."
            aria-label="Journal entry writing page"
            style={{
              width: '100%',
              flex: 1,
              minHeight: '260px',
              padding: 0,
              border: 'none',
              backgroundColor: 'transparent',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-journal)',
              fontSize: '1.35rem',
              lineHeight: '34px',
              letterSpacing: '0.02em',
              resize: 'none',
              outline: 'none',
              boxShadow: 'none',
              backgroundImage: 'linear-gradient(var(--journal-lines) 1px, transparent 1px)',
              backgroundSize: '100% 34px',
              backgroundPosition: '0 28px',
              zIndex: 3
            }}
          />

          {/* Interactive Stickers with Fixed-Scale Contextual Toolbar */}
          {currentPage?.stickers.map((stk) => {
            const def = STICKER_PALETTE.find((s) => s.type === stk.type) || STICKER_PALETTE[0];
            const isSelected = selectedStickerId === stk.id;
            const scale = stk.scale ?? 1.0;
            const isNearTop = stk.y < 22;

            return (
              <div
                key={stk.id}
                onPointerDown={(e) => handleStickerPointerDown(stk, e)}
                onPointerUp={handleStickerPointerUp}
                onTouchStart={(e) => handleStickerTouchStart(stk, e)}
                onTouchMove={handleStickerTouchMove}
                onTouchEnd={handleStickerTouchEnd}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedStickerId(stk.id);
                }}
                style={{
                  position: 'absolute',
                  left: `${stk.x}%`,
                  top: `${stk.y}%`,
                  transform: `translate(-50%, -50%) rotate(${stk.rotation}deg)`,
                  cursor: isSelected ? 'grab' : 'pointer',
                  touchAction: 'none',
                  userSelect: 'none',
                  zIndex: isSelected ? 25 : 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  filter: isSelected
                    ? 'drop-shadow(0 4px 10px rgba(0,0,0,0.22))'
                    : 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
                }}
              >
                {/* Visual Sticker Graphic: Scaled cleanly without affecting children/toolbar */}
                <span
                  style={{
                    fontSize: `${2.3 * scale}rem`,
                    display: 'block',
                    lineHeight: 1,
                    pointerEvents: 'none'
                  }}
                >
                  {def.icon}
                </span>

                {/* Dashed Selection Ring: Wraps around the sticker cleanly */}
                {isSelected && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: '-6px',
                      border: '2px dashed var(--accent-soft-sage)',
                      borderRadius: '12px',
                      pointerEvents: 'none'
                    }}
                  />
                )}

                {/* Fixed-Size Contextual Sticker Toolbar (STAYS 100% UNCHANGED SIZE REGARDLESS OF STICKER SCALE) */}
                {isSelected && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    onPointerDown={(e) => e.stopPropagation()}
                    style={{
                      position: 'absolute',
                      ...(isNearTop
                        ? { top: 'calc(100% + 10px)' }
                        : { bottom: 'calc(100% + 10px)' }),
                      left: '50%',
                      transform: 'translateX(-50%)',
                      backgroundColor: 'var(--bg-surface)',
                      border: '1px solid var(--border-subtle)',
                      boxShadow: 'var(--shadow-floating)',
                      borderRadius: 'var(--radius-full)',
                      padding: '4px 8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      zIndex: 35,
                      whiteSpace: 'nowrap',
                      animation: 'fadeIn 0.15s ease-out'
                    }}
                  >
                    {/* Scale Down (-) */}
                    <button
                      onClick={(e) => handleScaleSticker(stk.id, -0.15, e)}
                      aria-label="Make sticker smaller"
                      title="Smaller"
                      style={{
                        padding: '4px',
                        borderRadius: '50%',
                        color: 'var(--text-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minWidth: '24px',
                        minHeight: '24px'
                      }}
                    >
                      <ZoomOut size={14} />
                    </button>

                    {/* Scale Up (+) */}
                    <button
                      onClick={(e) => handleScaleSticker(stk.id, 0.15, e)}
                      aria-label="Make sticker larger"
                      title="Larger"
                      style={{
                        padding: '4px',
                        borderRadius: '50%',
                        color: 'var(--text-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minWidth: '24px',
                        minHeight: '24px'
                      }}
                    >
                      <ZoomIn size={14} />
                    </button>

                    <div style={{ width: '1px', height: '14px', backgroundColor: 'var(--border-subtle)' }} />

                    {/* Remove Action */}
                    <button
                      onClick={(e) => handleRemoveSticker(stk.id, e)}
                      aria-label="Remove sticker from page"
                      title="Remove"
                      style={{
                        padding: '4px 8px',
                        borderRadius: 'var(--radius-full)',
                        backgroundColor: 'var(--accent-terracotta-bg)',
                        color: 'var(--accent-soft-terracotta)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.74rem',
                        fontWeight: 600,
                        minHeight: '24px'
                      }}
                    >
                      <Trash2 size={13} />
                      <span>Remove</span>
                    </button>
                  </div>
                )}

                {/* Fixed-Size Corner Resize Drag Handle */}
                {isSelected && (
                  <div
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      resizingRef.current = {
                        id: stk.id,
                        startPointerY: e.clientY,
                        initScale: scale
                      };
                      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
                    }}
                    onPointerUp={(e) => {
                      try {
                        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
                      } catch {
                        // Handled
                      }
                      resizingRef.current = null;
                    }}
                    aria-label="Drag to resize sticker"
                    title="Drag to resize"
                    style={{
                      position: 'absolute',
                      right: '-8px',
                      bottom: '-8px',
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--accent-soft-sage)',
                      border: '2px solid #FFFFFF',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.35)',
                      cursor: 'nwse-resize',
                      touchAction: 'none'
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* 4. CLEAN & COMPACT PAGE NAVIGATION */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: '8px',
            borderTop: '1px solid var(--border-subtle)',
            fontSize: '0.78rem',
            color: 'var(--text-tertiary)',
            zIndex: 4,
            paddingLeft: '16px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              onClick={handlePrevPage}
              disabled={currentPageIdx === 0}
              aria-label="Previous page"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '2px',
                padding: '3px 8px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--bg-secondary)',
                color: currentPageIdx === 0 ? 'var(--text-tertiary)' : 'var(--text-primary)',
                opacity: currentPageIdx === 0 ? 0.35 : 1,
                fontSize: '0.75rem'
              }}
            >
              <ChevronLeft size={13} />
              <span>Prev</span>
            </button>

            <span style={{ fontWeight: 500, padding: '0 4px' }}>
              {currentPageIdx + 1} / {totalPages}
            </span>

            {currentPageIdx < totalPages - 1 ? (
              <button
                onClick={handleNextPage}
                aria-label="Next page"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '2px',
                  padding: '3px 8px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontSize: '0.75rem'
                }}
              >
                <span>Next</span>
                <ChevronRight size={13} />
              </button>
            ) : (
              <button
                onClick={handleAddPage}
                aria-label="Add a new page to journal"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                  padding: '3px 9px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'var(--accent-sage-bg)',
                  color: 'var(--accent-soft-sage)',
                  fontSize: '0.75rem',
                  fontWeight: 600
                }}
              >
                <Plus size={12} />
                <span>Page</span>
              </button>
            )}
          </div>

          <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
            Stored locally
          </span>
        </div>
      </div>

      {/* 5. STREAMLINED ACTION BUTTONS: Clear & Non-congested */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '10px',
          width: '100%'
        }}
      >
        <button
          onClick={handleDisappear}
          disabled={!hasContent || isDissolving}
          style={{
            padding: '10px 14px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'var(--accent-terracotta-bg)',
            color: 'var(--accent-soft-terracotta)',
            fontSize: '0.84rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            minHeight: '42px',
            opacity: !hasContent ? 0.35 : 1,
            cursor: !hasContent ? 'not-allowed' : 'pointer',
            transition: 'var(--transition-gentle)'
          }}
        >
          <Sparkles size={14} />
          <span>Let it disappear</span>
        </button>

        <button
          onClick={handleKeep}
          disabled={!hasContent || justSaved}
          style={{
            padding: '10px 14px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: justSaved ? 'var(--accent-sage-bg)' : 'var(--bg-surface)',
            color: justSaved ? 'var(--accent-soft-sage)' : 'var(--text-primary)',
            border: '1px solid var(--border-medium)',
            fontSize: '0.84rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            minHeight: '42px',
            opacity: !hasContent && !justSaved ? 0.35 : 1,
            cursor: !hasContent && !justSaved ? 'not-allowed' : 'pointer',
            boxShadow: 'var(--shadow-subtle)',
            transition: 'var(--transition-gentle)'
          }}
        >
          {justSaved ? (
            <>
              <Check size={14} />
              <span>Saved</span>
            </>
          ) : (
            <>
              <Bookmark size={14} />
              <span>{activeEditingId ? 'Save changes' : 'Keep this'}</span>
            </>
          )}
        </button>
      </div>

      {/* Saved Journals Drawer / Shelf Modal */}
      {showSavedList && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="saved-journals-title"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(23, 26, 25, 0.65)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            zIndex: 100,
            animation: 'fadeIn 0.2s ease-out'
          }}
          onClick={() => {
            setJournalToDelete(null);
            setShowSavedList(false);
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '460px',
              maxHeight: '84dvh',
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--radius-lg)',
              padding: '22px 20px',
              boxShadow: 'var(--shadow-floating)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
          >
            {/* Drawer Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 id="saved-journals-title" style={{ fontSize: '1.2rem', fontWeight: 600 }}>
                  Your Saved Journals
                </h2>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>
                  Stored only on this device
                </p>
              </div>
              <button
                onClick={() => {
                  setJournalToDelete(null);
                  setShowSavedList(false);
                }}
                aria-label="Close saved journals"
                style={{
                  padding: '8px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-secondary)',
                  minWidth: '36px',
                  minHeight: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Notebook List or Empty State */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                paddingRight: '2px'
              }}
            >
              {savedJournals.length === 0 ? (
                <div
                  style={{
                    padding: '40px 16px',
                    textAlign: 'center',
                    color: 'var(--text-tertiary)',
                    fontSize: '0.92rem'
                  }}
                >
                  No saved journal entries yet.
                </div>
              ) : (
                savedJournals.map((entry) => {
                  const firstPageText = entry.pages[0]?.text.trim() || 'Untitled entry';
                  const stickerCount = entry.pages.reduce((acc, p) => acc + p.stickers.length, 0);

                  return (
                    <div
                      key={entry.id}
                      style={{
                        padding: '16px',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'var(--bg-journal-paper)',
                        border: '1px solid var(--journal-lines)',
                        boxShadow: 'var(--shadow-subtle)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                        position: 'relative'
                      }}
                    >
                      {/* Entry Header: Date & Page Badge */}
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          fontSize: '0.76rem',
                          color: 'var(--text-tertiary)'
                        }}
                      >
                        <span style={{ fontWeight: 500 }}>{entry.createdAt}</span>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          <span
                            style={{
                              padding: '2px 8px',
                              borderRadius: 'var(--radius-full)',
                              backgroundColor: 'var(--bg-secondary)',
                              fontSize: '0.72rem'
                            }}
                          >
                            {entry.pages.length} {entry.pages.length === 1 ? 'page' : 'pages'}
                          </span>
                          {stickerCount > 0 && (
                            <span
                              style={{
                                padding: '2px 6px',
                                borderRadius: 'var(--radius-full)',
                                backgroundColor: 'var(--bg-secondary)',
                                fontSize: '0.72rem'
                              }}
                            >
                              ✨ {stickerCount}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Handwriting Preview Snippet */}
                      <p
                        onClick={() => {
                          loadJournalForEditing(entry);
                          setShowSavedList(false);
                          setCurrentPageIdx(0);
                        }}
                        style={{
                          fontFamily: 'var(--font-journal)',
                          fontSize: '1.25rem',
                          lineHeight: '26px',
                          color: 'var(--text-primary)',
                          whiteSpace: 'pre-wrap',
                          cursor: 'pointer',
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}
                      >
                        {firstPageText}
                      </p>

                      {journalToDelete === entry.id ? (
                        /* Soft Delete Confirmation */
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            paddingTop: '8px',
                            borderTop: '1px solid var(--border-subtle)',
                            fontSize: '0.8rem'
                          }}
                        >
                          <span style={{ color: 'var(--text-secondary)' }}>Delete this entry?</span>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              onClick={() => setJournalToDelete(null)}
                              style={{
                                padding: '4px 10px',
                                borderRadius: 'var(--radius-full)',
                                backgroundColor: 'var(--bg-surface)',
                                color: 'var(--text-secondary)'
                              }}
                            >
                              Keep
                            </button>
                            <button
                              onClick={() => confirmDeleteJournal(entry.id)}
                              style={{
                                padding: '4px 10px',
                                borderRadius: 'var(--radius-full)',
                                backgroundColor: 'var(--accent-terracotta-bg)',
                                color: 'var(--accent-soft-terracotta)',
                                fontWeight: 600
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* Action Bar: Open & Edit / Delete */
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            paddingTop: '6px',
                            borderTop: '1px solid var(--border-subtle)'
                          }}
                        >
                          <button
                            onClick={() => {
                              loadJournalForEditing(entry);
                              setShowSavedList(false);
                              setCurrentPageIdx(0);
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '4px 10px',
                              borderRadius: 'var(--radius-full)',
                              backgroundColor: 'var(--accent-sage-bg)',
                              color: 'var(--accent-soft-sage)',
                              fontSize: '0.78rem',
                              fontWeight: 600
                            }}
                          >
                            <Edit3 size={12} />
                            <span>Open & Edit</span>
                          </button>

                          <button
                            onClick={() => setJournalToDelete(entry.id)}
                            aria-label="Delete entry"
                            style={{
                              color: 'var(--text-tertiary)',
                              padding: '4px 6px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '0.74rem'
                            }}
                          >
                            <Trash2 size={13} />
                            <span>Delete</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer Clear All */}
            {savedJournals.length > 0 && !journalToDelete && (
              <button
                onClick={clearAllJournals}
                style={{
                  padding: '8px',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-tertiary)',
                  fontSize: '0.78rem',
                  textAlign: 'center'
                }}
              >
                Clear all saved journal entries
              </button>
            )}
          </div>
        </div>
      )}
    </main>
  );
};
