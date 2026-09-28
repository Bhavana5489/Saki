import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';

interface NoticeItem {
  id: number;
  isSpecial: boolean;
}

type CategoryType = 'circles' | 'leaves' | 'flowers' | 'stars' | 'teacups' | 'moons' | 'stones';

const CATEGORIES: CategoryType[] = ['circles', 'leaves', 'flowers', 'stars', 'teacups', 'moons', 'stones'];

export const NoticeGame: React.FC = () => {
  const { isReducedMotion, playNoticeFound } = useApp();
  const [round, setRound] = useState(0);
  const [items, setItems] = useState<NoticeItem[]>([]);
  const [category, setCategory] = useState<CategoryType>('circles');
  const [foundId, setFoundId] = useState<number | null>(null);
  const [wiggleId, setWiggleId] = useState<number | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Generate next gentle observation
  const nextObservation = useCallback((roundNum = round) => {
    const totalItems = 15; // 3 rows of 5 items
    const specialIndex = Math.floor(Math.random() * totalItems);
    const newItems: NoticeItem[] = Array.from({ length: totalItems }, (_, i) => ({
      id: i,
      isSpecial: i === specialIndex
    }));

    const nextCat = CATEGORIES[roundNum % CATEGORIES.length];
    setCategory(nextCat);
    setItems(newItems);
    setFoundId(null);
    setWiggleId(null);
    setIsTransitioning(false);
  }, [round]);

  useEffect(() => {
    nextObservation(0);
  }, []);

  const handleItemClick = (item: NoticeItem, e?: React.MouseEvent | React.TouchEvent) => {
    if (e) {
      e.stopPropagation();
    }
    if (isTransitioning) return;

    if (item.isSpecial) {
      setFoundId(item.id);
      setIsTransitioning(true);
      playNoticeFound(round);

      const nextRoundNum = round + 1;
      setRound(nextRoundNum);

      setTimeout(() => {
        nextObservation(nextRoundNum);
      }, isReducedMotion ? 350 : 650);
    } else {
      setWiggleId(item.id);
      setTimeout(() => {
        setWiggleId(null);
      }, 300);
    }
  };

  // Render SVG Graphics with clear, calming, noticeable differences
  const renderGraphic = (isSpecial: boolean, isFound: boolean) => {
    switch (category) {
      case 'circles':
        return (
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
            {/* Outer ring */}
            <circle
              cx="20"
              cy="20"
              r="13"
              stroke="var(--accent-soft-sage)"
              strokeWidth="2.5"
              fill={isFound ? 'var(--accent-sage-bg)' : 'transparent'}
            />
            {/* Subtle difference: Filled center dot ◉ */}
            {isSpecial && (
              <circle
                cx="20"
                cy="20"
                r="6.5"
                fill="var(--accent-soft-sage)"
              />
            )}
          </svg>
        );

      case 'leaves':
        return (
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
            {/* Leaf shape */}
            <path
              d="M9 31C9 31 11 17 23 11C32 6 32 6 32 6C32 6 32 15 27 24C22 34 9 31 9 31Z"
              fill="var(--accent-soft-sage)"
              opacity="0.85"
            />
            {/* Center vein */}
            <path d="M9 31C15 25 21 18 32 6" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" strokeLinecap="round" />
            {/* Subtle difference: Tiny soft pearl dewdrop */}
            {isSpecial && (
              <circle
                cx="24"
                cy="17"
                r="3.5"
                fill="#FFFFFF"
                stroke="var(--accent-soft-sage)"
                strokeWidth="1"
              />
            )}
          </svg>
        );

      case 'flowers':
        return (
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
            {/* 4 Petals */}
            <circle cx="20" cy="12" r="5.5" fill="var(--accent-soft-terracotta)" opacity="0.65" />
            <circle cx="28" cy="20" r="5.5" fill="var(--accent-soft-terracotta)" opacity="0.65" />
            <circle cx="20" cy="28" r="5.5" fill="var(--accent-soft-terracotta)" opacity="0.65" />
            <circle cx="12" cy="20" r="5.5" fill="var(--accent-soft-terracotta)" opacity="0.65" />
            {/* Center: Golden center on special vs Hollow cream on regular */}
            <circle
              cx="20"
              cy="20"
              r={isSpecial ? 6 : 4.5}
              fill={isSpecial ? 'var(--accent-soft-honey)' : 'var(--bg-primary)'}
              stroke="var(--accent-soft-terracotta)"
              strokeWidth="1.5"
            />
          </svg>
        );

      case 'stars':
        return (
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
            {/* 4-point sparkle star */}
            <path
              d="M20 7C20 14 25 20 33 20C25 20 20 25 20 33C20 25 14 20 7 20C14 20 20 14 20 7Z"
              fill="var(--accent-soft-honey)"
              opacity="0.9"
            />
            {/* Center diamond gleam on special */}
            {isSpecial && (
              <circle cx="20" cy="20" r="3.2" fill="#FFFFFF" />
            )}
          </svg>
        );

      case 'teacups':
        return (
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
            {/* Cup */}
            <path
              d="M11 16H29C29 16 29 27 20 27C11 27 11 16 11 16Z"
              fill="var(--accent-soft-sky)"
              opacity="0.85"
            />
            {/* Saucer */}
            <line x1="8" y1="29" x2="32" y2="29" stroke="var(--accent-soft-sky)" strokeWidth="2.2" strokeLinecap="round" />
            {/* Steam curves */}
            <path d="M17 12C17 9 20 9 20 6" stroke="var(--text-tertiary)" strokeWidth="1.4" strokeLinecap="round" />
            {isSpecial && (
              <path d="M23 12C23 9 26 9 26 6" stroke="var(--text-tertiary)" strokeWidth="1.4" strokeLinecap="round" />
            )}
          </svg>
        );

      case 'moons':
        return (
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
            {/* Crescent moon */}
            <path
              d="M24 9C16 9 11 15 11 22C11 29 17 33 24 33C19 30 18 25 18 21C18 16 20 12 24 9Z"
              fill="var(--accent-soft-honey)"
              opacity="0.9"
            />
            {/* Evening star companion on special */}
            {isSpecial && (
              <path
                d="M28 15L29 17L31 18L29 19L28 21L27 19L25 18L27 17Z"
                fill="var(--accent-soft-honey)"
              />
            )}
          </svg>
        );

      case 'stones':
      default:
        return (
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
            {/* Zen pebble */}
            <ellipse
              cx="20"
              cy="21"
              rx="14"
              ry="11"
              fill="var(--accent-soft-lavender)"
              opacity="0.8"
            />
            <ellipse cx="17" cy="18" rx="5" ry="2.5" fill="rgba(255,255,255,0.45)" />
            {/* Water drop speckle on special */}
            {isSpecial && (
              <circle cx="23" cy="22" r="2.2" fill="#FFFFFF" />
            )}
          </svg>
        );
    }
  };

  return (
    <div
      style={{
        flex: 1,
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '56px 16px 24px 16px',
        gap: '20px',
        maxWidth: '460px',
        margin: '0 auto',
        userSelect: 'none',
        touchAction: 'manipulation'
      }}
    >
      {/* Title & Quiet Guidance */}
      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <span
          style={{
            fontSize: '0.82rem',
            color: 'var(--text-tertiary)',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            fontWeight: 500
          }}
        >
          Notice
        </span>
        <h2
          style={{
            fontSize: '1.25rem',
            fontWeight: 600,
            color: 'var(--text-primary)',
            letterSpacing: '-0.01em'
          }}
        >
          Here is one small thing to notice.
        </h2>
      </div>

      {/* 3x5 Grid of Shapes */}
      <div
        role="grid"
        aria-label="Find the single subtly different observation item"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: '10px',
          width: '100%',
          padding: '16px 14px',
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-soft)',
          transition: isReducedMotion ? 'none' : 'transform 0.3s ease'
        }}
      >
        {items.map((item) => {
          const isFound = foundId === item.id;
          const isWiggling = wiggleId === item.id;

          return (
            <button
              key={item.id}
              onClick={(e) => handleItemClick(item, e)}
              aria-label={item.isSpecial ? 'Subtly different item' : 'Item'}
              style={{
                aspectRatio: '1',
                borderRadius: 'var(--radius-md)',
                backgroundColor: isFound
                  ? 'var(--accent-sage-bg)'
                  : 'var(--bg-secondary)',
                border: isFound
                  ? '2px solid var(--accent-soft-sage)'
                  : '1px solid transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: isReducedMotion ? 'none' : 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
                transform: isFound
                  ? 'scale(1.14)'
                  : isWiggling
                  ? 'scale(0.92)'
                  : 'scale(1)',
                boxShadow: isFound ? '0 4px 16px rgba(124, 152, 133, 0.35)' : 'none',
                minWidth: '44px',
                minHeight: '44px',
                padding: 0
              }}
            >
              {renderGraphic(item.isSpecial, isFound)}
            </button>
          );
        })}
      </div>

      {/* Gentle feedback line */}
      <div
        style={{
          fontSize: '0.85rem',
          color: foundId !== null ? 'var(--accent-soft-sage)' : 'var(--text-tertiary)',
          fontWeight: foundId !== null ? 600 : 400,
          textAlign: 'center',
          minHeight: '22px',
          transition: 'color 0.2s ease'
        }}
      >
        {foundId !== null ? 'Noticed ✨' : 'Take all the time you need.'}
      </div>
    </div>
  );
};
