import React, { useState, useEffect } from 'react';
import { BreathingSpeed } from '../types';
import { useApp } from '../context/AppContext';
import { Play, Check, RotateCcw } from 'lucide-react';

export const BreatheView: React.FC = () => {
  const { isReducedMotion, playChime } = useApp();
  const [isActive, setIsActive] = useState<boolean>(false);
  const [speed, setSpeed] = useState<BreathingSpeed>('slow');
  const [phase, setPhase] = useState<'inhale' | 'exhale'>('inhale');

  // Cycle half-durations: Gentle (4s), Slow (5.5s), Very Slow (7.5s)
  const cycleDurations: Record<BreathingSpeed, number> = {
    gentle: 4000,
    slow: 5500,
    veryslow: 7500
  };

  const currentDuration = cycleDurations[speed];

  useEffect(() => {
    if (!isActive) {
      setPhase('inhale');
      return;
    }

    const interval = setInterval(() => {
      setPhase((prev) => (prev === 'inhale' ? 'exhale' : 'inhale'));
    }, currentDuration);

    return () => clearInterval(interval);
  }, [isActive, currentDuration]);

  const handleStart = () => {
    setIsActive(true);
    setPhase('inhale');
    playChime(523.25); // Gentle start chime
  };

  const handleDone = () => {
    setIsActive(false);
    setPhase('inhale');
    playChime(440); // Soft finish chime
  };

  return (
    <main
      className="fade-in"
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 20px 24px 20px',
        textAlign: 'center',
        position: 'relative'
      }}
    >
      {/* Pace Selection (Secondary) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          padding: '4px',
          borderRadius: 'var(--radius-full)',
          backgroundColor: 'var(--bg-secondary)',
          fontSize: '0.8rem'
        }}
        role="group"
        aria-label="Breathing pace selection"
      >
        {(['gentle', 'slow', 'veryslow'] as BreathingSpeed[]).map((s) => {
          const isSelected = speed === s;
          const labelMap: Record<BreathingSpeed, string> = {
            gentle: 'Gentle',
            slow: 'Slow',
            veryslow: 'Very slow'
          };
          return (
            <button
              key={s}
              onClick={() => setSpeed(s)}
              aria-pressed={isSelected}
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: isSelected ? 'var(--bg-surface)' : 'transparent',
                color: isSelected ? 'var(--text-primary)' : 'var(--text-tertiary)',
                fontWeight: isSelected ? 600 : 400,
                boxShadow: isSelected ? 'var(--shadow-subtle)' : 'none',
                minHeight: '34px',
                transition: 'var(--transition-gentle)'
              }}
            >
              {labelMap[s]}
            </button>
          );
        })}
      </div>

      {/* Screen Reader Accessible Announcement */}
      <div aria-live="polite" className="sr-only">
        {!isActive
          ? 'Breathing exercise is ready. Press Start to begin.'
          : phase === 'inhale'
          ? 'The shape is slowly expanding. Breathe in.'
          : 'The shape is slowly contracting. Breathe out.'}
      </div>

      {/* Central Visual Breathing Orb */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          maxWidth: '300px',
          height: '300px',
          position: 'relative'
        }}
      >
        {/* Outer Glow */}
        <div
          style={{
            position: 'absolute',
            width: '240px',
            height: '240px',
            borderRadius: '50%',
            backgroundColor: 'var(--accent-sage-bg)',
            opacity: !isActive ? 0.3 : phase === 'inhale' ? 0.75 : 0.2,
            transform: !isActive || isReducedMotion
              ? 'scale(1)'
              : phase === 'inhale'
              ? 'scale(1.2)'
              : 'scale(0.9)',
            filter: 'blur(28px)',
            transition: isReducedMotion || !isActive
              ? 'opacity 1.2s ease'
              : `transform ${currentDuration}ms cubic-bezier(0.4, 0, 0.2, 1), opacity ${currentDuration}ms cubic-bezier(0.4, 0, 0.2, 1)`
          }}
        />

        {/* Central Orb */}
        <div
          style={{
            width: '160px',
            height: '160px',
            borderRadius: '50%',
            background:
              'radial-gradient(circle at 35% 35%, var(--accent-sage-bg) 0%, var(--accent-soft-sage) 70%, #688574 100%)',
            boxShadow: 'var(--shadow-floating)',
            transform: !isActive || isReducedMotion
              ? 'scale(1)'
              : phase === 'inhale'
              ? 'scale(1.3)'
              : 'scale(0.82)',
            opacity: !isActive ? 0.85 : phase === 'inhale' ? 1 : 0.88,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: isReducedMotion || !isActive
              ? 'opacity 1.2s ease'
              : `transform ${currentDuration}ms cubic-bezier(0.4, 0, 0.2, 1), opacity ${currentDuration}ms cubic-bezier(0.4, 0, 0.2, 1)`,
            zIndex: 2
          }}
        >
          {/* Inner Light Reflection */}
          <div
            style={{
              width: '65px',
              height: '65px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.3)',
              filter: 'blur(8px)',
              transform: !isActive || isReducedMotion
                ? 'scale(1)'
                : phase === 'inhale'
                ? 'scale(1.15)'
                : 'scale(0.75)',
              transition: isReducedMotion || !isActive
                ? 'none'
                : `transform ${currentDuration}ms ease-in-out`
            }}
          />
        </div>

        {/* Breathing Text Cue (Only active after Start) */}
        <div
          style={{
            position: 'absolute',
            bottom: '12px',
            fontSize: '1.15rem',
            fontWeight: 500,
            color: 'var(--text-secondary)',
            letterSpacing: '0.03em',
            transition: 'opacity 0.6s ease'
          }}
        >
          {!isActive ? 'Ready when you are' : phase === 'inhale' ? 'breathe in' : 'breathe out'}
        </div>
      </div>

      {/* Bottom Actions: Start vs Done */}
      <div
        style={{
          width: '100%',
          maxWidth: '280px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '10px'
        }}
      >
        {!isActive ? (
          <button
            onClick={handleStart}
            style={{
              width: '100%',
              padding: '15px 24px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--text-primary)',
              color: 'var(--text-inverse)',
              fontSize: '1rem',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              minHeight: '52px',
              boxShadow: 'var(--shadow-soft)',
              transition: 'var(--transition-gentle)'
            }}
          >
            <Play size={18} fill="currentColor" />
            <span>Start</span>
          </button>
        ) : (
          <>
            <span style={{ fontSize: '0.84rem', color: 'var(--text-tertiary)' }}>
              Stay as long as you need
            </span>

            <button
              onClick={handleDone}
              style={{
                width: '100%',
                padding: '13px 22px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--bg-surface)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-medium)',
                fontSize: '0.92rem',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                minHeight: '48px',
                boxShadow: 'var(--shadow-subtle)',
                transition: 'var(--transition-gentle)'
              }}
            >
              <Check size={16} />
              <span>Done</span>
            </button>
          </>
        )}
      </div>
    </main>
  );
};
