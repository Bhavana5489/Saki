import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ArrowLeft, Gamepad2, Brain, Sparkles, ChevronRight, Zap } from 'lucide-react';
import { TableTennisGame } from '../components/TableTennisGame';
import { StroopGame } from '../components/StroopGame';
import { SliceGame } from '../components/SliceGame';

type QuietGameMode = 'tennis' | 'stroop' | 'slice' | null;

interface GameOption {
  id: 'tennis' | 'stroop' | 'slice';
  title: string;
  tagline: string;
  badge: string;
  badgeBg: string;
  badgeColor: string;
  description: string;
  icon: React.ReactNode;
  accentBorder: string;
}

export const QuietGameView: React.FC = () => {
  const { navigateTab } = useApp();
  // Default to null so the user lands on the activities menu
  const [activeMode, setActiveMode] = useState<QuietGameMode>(null);

  const gameOptions: GameOption[] = [
    {
      id: 'tennis',
      title: 'Table Tennis',
      tagline: 'Focus & Rhythm',
      badge: '3D Focus Rally',
      badgeBg: 'var(--accent-terracotta-bg)',
      badgeColor: 'var(--accent-soft-terracotta)',
      description: 'Engaging, fast-paced 3D rally to absorb your attention, sharpen reflexes, and get in the zone.',
      icon: <Gamepad2 size={24} color="var(--accent-soft-terracotta)" />,
      accentBorder: 'var(--accent-soft-terracotta)'
    },
    {
      id: 'stroop',
      title: 'Stroop Test',
      tagline: 'Cognitive Agility',
      badge: 'Focus & Speed',
      badgeBg: 'rgba(37, 99, 235, 0.12)',
      badgeColor: '#2563EB',
      description: 'Challenge your executive attention and processing speed with the classic Stroop color-word psychology test.',
      icon: <Brain size={24} color="#2563EB" />,
      accentBorder: '#2563EB'
    },
    {
      id: 'slice',
      title: 'Slice',
      tagline: 'Kinetic Release',
      badge: 'Sensory Flow',
      badgeBg: 'var(--accent-sage-bg)',
      badgeColor: 'var(--accent-soft-sage)',
      description: 'Gently slice rising floating shapes with smooth kinetic ribbon trails and harmonic chime feedback.',
      icon: <Sparkles size={24} color="var(--accent-soft-sage)" />,
      accentBorder: 'var(--accent-soft-sage)'
    }
  ];

  // If no game is selected, show the Activity Menu
  if (activeMode === null) {
    return (
      <main
        className="fade-in"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          padding: '16px 20px 24px 20px',
          gap: '20px',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        {/* Menu Header with Leave button */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button
            onClick={() => navigateTab('home')}
            aria-label="Return home"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--bg-surface)',
              color: 'var(--text-primary)',
              fontSize: '0.84rem',
              fontWeight: 500,
              border: '1px solid var(--border-subtle)',
              boxShadow: 'var(--shadow-subtle)',
              cursor: 'pointer',
              transition: 'var(--transition-gentle)'
            }}
          >
            <ArrowLeft size={15} />
            <span>Home</span>
          </button>

          <span
            style={{
              fontSize: '0.78rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--text-tertiary)'
            }}
          >
            Quiet Space
          </span>
        </div>

        {/* Title block */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
          <h1
            style={{
              fontSize: '1.65rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
              lineHeight: 1.25,
              margin: 0
            }}
          >
            Choose an activity
          </h1>
          <p
            style={{
              fontSize: '0.88rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.45,
              margin: 0
            }}
          >
            Gentle games and sensory interactions to ground yourself, refocus, or play without pressure.
          </p>
        </div>

        {/* Game Cards List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', width: '100%' }}>
          {gameOptions.map((game) => (
            <button
              key={game.id}
              onClick={() => setActiveMode(game.id)}
              aria-label={`Open ${game.title}`}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                padding: '20px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                boxShadow: 'var(--shadow-subtle)',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'var(--transition-gentle)',
                position: 'relative',
                overflow: 'hidden',
                width: '100%'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = 'var(--shadow-soft)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = 'var(--shadow-subtle)';
              }}
            >
              {/* Card Header: Icon + Titles + Badge */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  width: '100%',
                  gap: '12px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: game.badgeBg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    {game.icon}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span
                      style={{
                        fontSize: '1.12rem',
                        fontWeight: 600,
                        color: 'var(--text-primary)'
                      }}
                    >
                      {game.title}
                    </span>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)' }}>
                      {game.tagline}
                    </span>
                  </div>
                </div>

                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: game.badgeBg,
                    color: game.badgeColor,
                    letterSpacing: '0.02em',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {game.badge}
                </span>
              </div>

              {/* Card Description */}
              <p
                style={{
                  fontSize: '0.86rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.45,
                  margin: 0
                }}
              >
                {game.description}
              </p>

              {/* Card Action Footer */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  gap: '4px',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  color: game.badgeColor,
                  marginTop: '2px'
                }}
              >
                <span>Play now</span>
                <ChevronRight size={16} />
              </div>
            </button>
          ))}
        </div>

        {/* Gentle Safe Note */}
        <div
          style={{
            padding: '12px 16px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--bg-secondary)',
            textAlign: 'center',
            marginTop: 'auto'
          }}
        >
          <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
            No scores, no countdowns, and no penalties. Take as much or as little time as you need.
          </span>
        </div>
      </main>
    );
  }

  // If a game is active, show the game view with a top navigation bar
  return (
    <main
      className="fade-in"
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        height: '100%',
        touchAction: activeMode === 'stroop' ? 'manipulation' : 'none'
      }}
    >
      {/* Top Floating Controls & Mode Switcher */}
      <div
        style={{
          position: 'absolute',
          top: '12px',
          left: '16px',
          right: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 30,
          pointerEvents: 'none'
        }}
      >
        {/* Back to Menu Button */}
        <button
          onClick={() => setActiveMode(null)}
          aria-label="Back to activities menu"
          style={{
            pointerEvents: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'var(--bg-surface-translucent)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            color: 'var(--text-primary)',
            fontSize: '0.84rem',
            fontWeight: 500,
            border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--shadow-subtle)',
            minHeight: '40px',
            cursor: 'pointer'
          }}
        >
          <ArrowLeft size={15} />
          <span>Menu</span>
        </button>

        {/* Game Mode Switcher Pill */}
        <div
          role="tablist"
          aria-label="Choose an activity"
          style={{
            pointerEvents: 'auto',
            display: 'flex',
            alignItems: 'center',
            backgroundColor: 'var(--bg-surface-translucent)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            padding: '3px',
            borderRadius: 'var(--radius-full)',
            border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--shadow-subtle)'
          }}
        >
          {gameOptions.map((opt) => {
            const isActive = activeMode === opt.id;
            return (
              <button
                key={opt.id}
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveMode(opt.id)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: isActive ? 'var(--accent-sage-bg)' : 'transparent',
                  color: isActive ? 'var(--text-primary)' : 'var(--text-tertiary)',
                  fontSize: '0.78rem',
                  fontWeight: isActive ? 600 : 500,
                  transition: 'var(--transition-gentle)',
                  minHeight: '34px',
                  cursor: 'pointer'
                }}
              >
                {opt.title}
              </button>
            );
          })}
        </div>
      </div>

      {/* Render Active Game */}
      <div
        style={{
          flex: 1,
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative'
        }}
      >
        {activeMode === 'tennis' && <TableTennisGame />}
        {activeMode === 'stroop' && <StroopGame />}
        {activeMode === 'slice' && <SliceGame />}
      </div>
    </main>
  );
};
