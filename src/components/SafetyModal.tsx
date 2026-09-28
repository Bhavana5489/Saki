import React, { useEffect, useRef } from 'react';
import { X, HeartHandshake, Compass, ShieldCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const SafetyModal: React.FC = () => {
  const {
    isSafetyOpen,
    setIsSafetyOpen,
    theme,
    setTheme,
    overrideReducedMotion,
    setOverrideReducedMotion
  } = useApp();
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);
  const modalRef = useRef<HTMLDivElement | null>(null);

  // Focus trap & Escape key handling
  useEffect(() => {
    if (isSafetyOpen) {
      previousActiveElementRef.current = document.activeElement as HTMLElement | null;
      // Focus close button on open
      setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 50);

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setIsSafetyOpen(false);
          return;
        }

        if (e.key === 'Tab' && modalRef.current) {
          const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          if (focusableElements.length === 0) return;

          const firstElement = focusableElements[0];
          const lastElement = focusableElements[focusableElements.length - 1];

          if (e.shiftKey && document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          } else if (!e.shiftKey && document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        // Restore focus when closing
        previousActiveElementRef.current?.focus();
      };
    }
  }, [isSafetyOpen, setIsSafetyOpen]);

  if (!isSafetyOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="safety-modal-title"
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
      onClick={() => setIsSafetyOpen(false)}
    >
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '440px',
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-lg)',
          padding: '24px 22px',
          boxShadow: 'var(--shadow-floating)',
          border: '1px solid var(--border-subtle)',
          maxHeight: '90dvh',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                backgroundColor: 'var(--accent-terracotta-bg)',
                color: 'var(--accent-soft-terracotta)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <HeartHandshake size={18} />
            </div>
            <h2 id="safety-modal-title" style={{ fontSize: '1.15rem', fontWeight: 600 }}>
              Help & Support
            </h2>
          </div>
          <button
            ref={closeButtonRef}
            onClick={() => setIsSafetyOpen(false)}
            aria-label="Close help dialog"
            style={{
              padding: '8px',
              borderRadius: '50%',
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: '36px',
              minHeight: '36px'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Location-Neutral Urgent Message */}
        <div
          style={{
            padding: '16px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--accent-terracotta-bg)',
            border: '1px solid rgba(216, 139, 119, 0.22)',
            color: 'var(--text-primary)',
            fontSize: '0.92rem',
            lineHeight: 1.55
          }}
        >
          If you are in immediate danger, or think you may hurt yourself or someone else, contact your local emergency service or go to the nearest emergency department. If you can, stay with someone you trust.
        </div>

        {/* Preferences & Comfort Section */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            padding: '14px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)'
          }}
        >
          <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
            Preferences & Comfort
          </div>

          {/* Reduced Motion Toggle */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.84rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                Reduce Motion
              </span>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-tertiary)' }}>
                Softens or disables page animations
              </span>
            </div>
            <button
              onClick={() => setOverrideReducedMotion((prev) => !prev)}
              aria-label={overrideReducedMotion ? 'Reduced motion active. Tap to enable animations.' : 'Tap to reduce motion.'}
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: overrideReducedMotion ? 'var(--accent-sage-bg)' : 'var(--bg-surface)',
                color: overrideReducedMotion ? 'var(--accent-soft-sage)' : 'var(--text-secondary)',
                border: '1px solid var(--border-subtle)',
                fontSize: '0.78rem',
                fontWeight: 600,
                minHeight: '34px',
                transition: 'var(--transition-gentle)'
              }}
            >
              {overrideReducedMotion ? 'Active' : 'Standard'}
            </button>
          </div>

          <div style={{ height: '1px', backgroundColor: 'var(--border-subtle)', margin: '2px 0' }} />

          {/* Theme Mode Toggle */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.84rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                Appearance
              </span>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-tertiary)' }}>
                Switch between Light and Dusk mode
              </span>
            </div>
            <button
              onClick={() => setTheme((prev) => (prev === 'light' ? 'dusk' : 'light'))}
              aria-label={`Current theme is ${theme}. Tap to switch.`}
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--bg-surface)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-subtle)',
                fontSize: '0.78rem',
                fontWeight: 500,
                minHeight: '34px',
                transition: 'var(--transition-gentle)'
              }}
            >
              {theme === 'light' ? 'Light mode' : 'Dusk mode'}
            </button>
          </div>
        </div>

        {/* Supporting Suggestions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Grounding Suggestion */}
          <div
            style={{
              display: 'flex',
              gap: '12px',
              alignItems: 'flex-start',
              padding: '14px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--bg-secondary)'
            }}
          >
            <Compass size={18} style={{ color: 'var(--accent-soft-sky)', flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.88rem', marginBottom: '4px' }}>
                You could try noticing:
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                • Three physical objects you can see around you<br />
                • The solid surface holding your weight<br />
                • One gentle, unhurried breath
              </p>
            </div>
          </div>

          {/* Privacy Note */}
          <div
            style={{
              display: 'flex',
              gap: '12px',
              alignItems: 'flex-start',
              padding: '14px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--bg-secondary)'
            }}
          >
            <ShieldCheck size={18} style={{ color: 'var(--accent-soft-sage)', flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.88rem', marginBottom: '2px' }}>
                Quiet Space
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                Quiet Space is a personal space for quiet moments, not medical or emergency care. Your saved thoughts stay on this device.
              </p>
            </div>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={() => setIsSafetyOpen(false)}
          style={{
            width: '100%',
            padding: '14px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--text-primary)',
            color: 'var(--text-inverse)',
            fontSize: '0.92rem',
            fontWeight: 500,
            minHeight: '46px'
          }}
        >
          Return
        </button>
      </div>
    </div>
  );
};
