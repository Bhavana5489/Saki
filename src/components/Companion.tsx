import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';

interface CompanionProps {
  size?: number;
  interactive?: boolean;
  message?: string;
  className?: string;
  onClick?: () => void;
}

export const Companion: React.FC<CompanionProps> = ({
  size = 130,
  interactive = true,
  message,
  className = '',
  onClick
}) => {
  const { isReducedMotion } = useApp();
  const [isBlinking, setIsBlinking] = useState(false);
  const [isTapped, setIsTapped] = useState(false);

  // Sporadic gentle blink every 5-9 seconds
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    const scheduleBlink = () => {
      const nextTime = Math.random() * 4000 + 5000;
      timeoutId = setTimeout(() => {
        setIsBlinking(true);
        setTimeout(() => {
          setIsBlinking(false);
          scheduleBlink();
        }, 160);
      }, nextTime);
    };

    scheduleBlink();
    return () => clearTimeout(timeoutId);
  }, []);

  const handleInteraction = () => {
    if (!interactive) return;
    setIsTapped(true);
    if (onClick) onClick();
    setTimeout(() => setIsTapped(false), 400);
  };

  return (
    <div
      className={`companion-wrapper ${className}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        userSelect: 'none'
      }}
    >
      <div
        role={interactive ? 'button' : undefined}
        tabIndex={interactive ? 0 : undefined}
        aria-label={interactive ? 'Quiet companion' : undefined}
        onClick={handleInteraction}
        onKeyDown={(e) => {
          if (interactive && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            handleInteraction();
          }
        }}
        style={{
          width: size,
          height: size,
          cursor: interactive ? 'pointer' : 'default',
          position: 'relative',
          transition: isReducedMotion ? 'none' : 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          transform: isTapped ? 'scale(0.96)' : 'scale(1)'
        }}
      >
        {/* Soft Ambient Glow */}
        <div
          style={{
            position: 'absolute',
            width: size * 1.1,
            height: size * 0.4,
            bottom: -6,
            left: -size * 0.05,
            background: 'radial-gradient(ellipse at center, rgba(141, 169, 152, 0.2) 0%, rgba(141, 169, 152, 0) 70%)',
            borderRadius: '50%',
            filter: 'blur(6px)',
            pointerEvents: 'none'
          }}
        />

        {/* Floating Blob SVG */}
        <svg
          viewBox="0 0 200 200"
          width={size}
          height={size}
          style={{
            overflow: 'visible',
            animation: isReducedMotion ? 'none' : 'float 6s ease-in-out infinite'
          }}
        >
          <defs>
            <linearGradient id="blobGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--accent-sage-bg)" />
              <stop offset="60%" stopColor="var(--accent-soft-sage)" stopOpacity="0.4" />
              <stop offset="100%" stopColor="var(--accent-soft-sage)" stopOpacity="0.7" />
            </linearGradient>

            <linearGradient id="blushGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--accent-soft-terracotta)" stopOpacity="0.3" />
              <stop offset="100%" stopColor="var(--accent-soft-terracotta)" stopOpacity="0" />
            </linearGradient>

            <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="rgba(141, 169, 152, 0.15)" />
            </filter>
          </defs>

          {/* Organic Fluid Body */}
          <path
            d="M 100 32 
               C 146 32, 174 60, 174 106 
               C 174 150, 144 172, 100 172 
               C 56 172, 26 150, 26 106 
               C 26 60, 54 32, 100 32 Z"
            fill="url(#blobGrad)"
            filter="url(#softGlow)"
          />

          {/* Cheeks */}
          <circle cx="60" cy="115" r="12" fill="url(#blushGrad)" />
          <circle cx="140" cy="115" r="12" fill="url(#blushGrad)" />

          {/* Eyes */}
          <g>
            {/* Left Eye */}
            {isBlinking ? (
              <path
                d="M 70 101 Q 76 104 82 101"
                stroke="var(--text-primary)"
                strokeWidth="2.2"
                strokeLinecap="round"
                fill="none"
              />
            ) : (
              <ellipse cx="76" cy="101" rx="3" ry="4" fill="var(--text-primary)" />
            )}

            {/* Right Eye */}
            {isBlinking ? (
              <path
                d="M 118 101 Q 124 104 130 101"
                stroke="var(--text-primary)"
                strokeWidth="2.2"
                strokeLinecap="round"
                fill="none"
              />
            ) : (
              <ellipse cx="124" cy="101" rx="3" ry="4" fill="var(--text-primary)" />
            )}

            {/* Gentle calm smile */}
            <path
              d="M 95 112 Q 100 116 105 112"
              stroke="var(--text-secondary)"
              strokeWidth="1.8"
              strokeLinecap="round"
              fill="none"
              opacity="0.7"
            />
          </g>
        </svg>
      </div>

      {message && (
        <div
          style={{
            marginTop: '16px',
            textAlign: 'center',
            maxWidth: '280px',
            color: 'var(--text-secondary)',
            fontSize: '0.92rem',
            lineHeight: 1.45,
            fontWeight: 400
          }}
        >
          {message}
        </div>
      )}
    </div>
  );
};
