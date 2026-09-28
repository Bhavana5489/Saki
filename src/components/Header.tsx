import React, { useState, useRef, useEffect } from 'react';
import { Volume2, VolumeX, Wind, CloudRain, Trees, ArrowLeft, ShieldAlert } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { NatureSound } from '../types';

export const Header: React.FC = () => {
  const {
    currentView,
    handleBack,
    isMuted,
    toggleMute,
    ambientSound,
    selectAmbientSound,
    setIsSafetyOpen
  } = useApp();

  const [showSoundMenu, setShowSoundMenu] = useState(false);
  const soundMenuRef = useRef<HTMLDivElement | null>(null);

  const isSubView =
    currentView === 'companion' ||
    currentView === 'companion_stay' ||
    currentView === 'companion_action';

  // Close sound menu on click outside
  useEffect(() => {
    if (!showSoundMenu) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (soundMenuRef.current && !soundMenuRef.current.contains(e.target as Node)) {
        setShowSoundMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSoundMenu]);

  const soundOptions: { id: NatureSound; label: string; icon: React.ReactNode }[] = [
    { id: 'breeze', label: 'Gentle Breeze', icon: <Wind size={14} /> },
    { id: 'rain', label: 'Distant Mist', icon: <CloudRain size={14} /> },
    { id: 'forest', label: 'Calm Outdoor Air', icon: <Trees size={14} /> }
  ];

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 18px',
        width: '100%',
        minHeight: '56px',
        zIndex: 30,
        position: 'relative'
      }}
    >
      {/* Left: Back button or Logo mark */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {isSubView ? (
          <button
            onClick={handleBack}
            aria-label="Go back"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              fontSize: '0.85rem',
              fontWeight: 500,
              minHeight: '44px',
              minWidth: '44px',
              transition: 'var(--transition-gentle)'
            }}
          >
            <ArrowLeft size={16} />
            <span>Back</span>
          </button>
        ) : (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: 'var(--text-secondary)',
              fontSize: '0.82rem',
              fontWeight: 500,
              letterSpacing: '0.04em',
              textTransform: 'uppercase'
            }}
          >
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                backgroundColor: 'var(--accent-soft-sage)',
                display: 'inline-block'
              }}
            />
            <span>Quiet Space</span>
          </div>
        )}
      </div>

      {/* Right: Essential, unambiguous controls (Help & Ambient Sound) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', position: 'relative' }}>
        {/* Support & Safety Help Button */}
        <button
          onClick={() => setIsSafetyOpen(true)}
          aria-label="Need urgent help, safety support, or settings"
          title="Help & support"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '5px',
            padding: '8px 14px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'transparent',
            color: 'var(--text-secondary)',
            fontSize: '0.82rem',
            fontWeight: 500,
            border: '1px solid var(--border-subtle)',
            minHeight: '44px',
            transition: 'var(--transition-gentle)'
          }}
        >
          <ShieldAlert size={15} style={{ color: 'var(--accent-soft-terracotta)' }} />
          <span>Help</span>
        </button>

        {/* Natural Ambient Sound Toggle & Preset Menu */}
        <div ref={soundMenuRef} style={{ position: 'relative' }}>
          <button
            onClick={() => {
              if (isMuted) {
                toggleMute();
              } else {
                setShowSoundMenu((p) => !p);
              }
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              setShowSoundMenu((p) => !p);
            }}
            aria-label={isMuted ? 'Turn on soothing background ambience' : 'Background ambience is on. Tap to adjust or mute.'}
            title={isMuted ? 'Background Ambience: Off (Tap to start)' : 'Background Ambience: Playing (Tap to adjust or mute)'}
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              backgroundColor: isMuted ? 'transparent' : 'var(--accent-sage-bg)',
              color: isMuted ? 'var(--text-tertiary)' : 'var(--accent-soft-sage)',
              border: isMuted ? '1px solid var(--border-subtle)' : '1px solid rgba(141, 169, 152, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'var(--transition-gentle)',
              position: 'relative'
            }}
          >
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            {!isMuted && (
              <span
                style={{
                  position: 'absolute',
                  bottom: '7px',
                  right: '7px',
                  width: '5px',
                  height: '5px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--accent-soft-sage)'
                }}
              />
            )}
          </button>

          {/* Simple Ambient Preset Popover */}
          {showSoundMenu && (
            <div
              style={{
                position: 'absolute',
                top: '50px',
                right: 0,
                backgroundColor: 'var(--bg-surface)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                boxShadow: 'var(--shadow-floating)',
                padding: '8px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                minWidth: '170px',
                zIndex: 50,
                animation: 'fadeIn 0.15s ease-out'
              }}
            >
              <div
                style={{
                  padding: '4px 8px',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  color: 'var(--text-tertiary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}
              >
                Nature Ambience
              </div>
              {soundOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => {
                    selectAmbientSound(opt.id);
                    if (isMuted) toggleMute();
                    setShowSoundMenu(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: !isMuted && ambientSound === opt.id ? 'var(--accent-sage-bg)' : 'transparent',
                    color: !isMuted && ambientSound === opt.id ? 'var(--accent-soft-sage)' : 'var(--text-primary)',
                    fontSize: '0.82rem',
                    fontWeight: !isMuted && ambientSound === opt.id ? 600 : 400,
                    textAlign: 'left'
                  }}
                >
                  {opt.icon}
                  <span>{opt.label}</span>
                </button>
              ))}

              <div style={{ height: '1px', backgroundColor: 'var(--border-subtle)', margin: '4px 0' }} />

              <button
                onClick={() => {
                  toggleMute();
                  setShowSoundMenu(false);
                }}
                style={{
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-sm)',
                  color: isMuted ? 'var(--accent-soft-sage)' : 'var(--accent-soft-terracotta)',
                  fontSize: '0.82rem',
                  fontWeight: 500,
                  textAlign: 'left'
                }}
              >
                {isMuted ? 'Turn Sound On' : 'Turn Sound Off'}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
