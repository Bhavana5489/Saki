import React, { useState } from 'react';
import { Companion } from '../components/Companion';
import { useApp } from '../context/AppContext';
import { RefreshCw } from 'lucide-react';
import { GroundingPrompt } from '../types';

const GROUNDING_PROMPTS: GroundingPrompt[] = [
  { id: '1', text: 'Take one sip of water.' },
  { id: '2', text: 'Let your shoulders drop away from your ears.' },
  { id: '3', text: 'Look at something far away for a moment.' },
  { id: '4', text: 'Unclench your jaw and soften your forehead.' },
  { id: '5', text: 'Put one thing back where it belongs.' },
  { id: '6', text: 'Move somewhere a little more comfortable.' },
  { id: '7', text: 'Wash your hands or face with cool water.' },
  { id: '8', text: 'Notice the temperature of the air on your skin.' }
];

export const CompanionView: React.FC = () => {
  const { currentView, setCurrentView, navigateTab, playChime } = useApp();
  const [promptIndex, setPromptIndex] = useState(0);

  const nextPrompt = () => {
    setPromptIndex((prev) => (prev + 1) % GROUNDING_PROMPTS.length);
    playChime(493.88);
  };

  // 1. "Stay Here" Mode
  if (currentView === 'companion_stay') {
    return (
      <main
        className="fade-in"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '24px 20px 32px 20px',
          textAlign: 'center'
        }}
      >
        <div />

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <Companion size={140} message="You could stay right here for a while." />
          <p style={{ fontSize: '0.88rem', color: 'var(--text-tertiary)', maxWidth: '260px' }}>
            There’s nothing you need to accomplish here.
          </p>
        </div>

        <div style={{ width: '100%', maxWidth: '280px' }}>
          <button
            onClick={() => setCurrentView('companion')}
            style={{
              width: '100%',
              padding: '14px 20px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-secondary)',
              fontSize: '0.9rem',
              fontWeight: 500,
              minHeight: '48px',
              transition: 'var(--transition-gentle)'
            }}
          >
            I’m ready to leave
          </button>
        </div>
      </main>
    );
  }

  // 2. "Give me something small to do" Mode
  if (currentView === 'companion_action') {
    const currentPrompt = GROUNDING_PROMPTS[promptIndex];

    return (
      <main
        className="fade-in"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 20px 32px 20px',
          textAlign: 'center'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Companion size={64} interactive={false} />
        </div>

        {/* Grounding Suggestion Card */}
        <div
          style={{
            width: '100%',
            maxWidth: '340px',
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--radius-lg)',
            padding: '36px 22px',
            boxShadow: 'var(--shadow-soft)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '14px'
          }}
        >
          <span
            style={{
              fontSize: '0.78rem',
              color: 'var(--text-tertiary)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em'
            }}
          >
            One small thing
          </span>
          <h2
            style={{
              fontSize: '1.35rem',
              fontWeight: 500,
              color: 'var(--text-primary)',
              lineHeight: 1.4
            }}
          >
            {currentPrompt.text}
          </h2>
        </div>

        {/* Actions */}
        <div
          style={{
            width: '100%',
            maxWidth: '300px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}
        >
          <button
            onClick={nextPrompt}
            style={{
              width: '100%',
              padding: '14px 20px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-medium)',
              color: 'var(--text-primary)',
              fontSize: '0.9rem',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              minHeight: '48px',
              boxShadow: 'var(--shadow-subtle)'
            }}
          >
            <RefreshCw size={14} />
            <span>Show another small thing</span>
          </button>

          <button
            onClick={() => setCurrentView('companion')}
            style={{
              width: '100%',
              padding: '12px 18px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'transparent',
              color: 'var(--text-tertiary)',
              fontSize: '0.86rem',
              minHeight: '44px'
            }}
          >
            Done for now
          </button>
        </div>
      </main>
    );
  }

  // 3. Companion Main View ("I don't know")
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
        textAlign: 'center'
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
        <Companion size={110} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxWidth: '300px' }}>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3 }}>
            That’s okay.
          </h1>
          <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
            We don’t have to figure everything out right now.
          </p>
        </div>
      </div>

      {/* 3 Pathway Options */}
      <div
        style={{
          width: '100%',
          maxWidth: '320px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}
      >
        <button
          onClick={() => setCurrentView('companion_stay')}
          style={{
            padding: '16px 20px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--shadow-subtle)',
            color: 'var(--text-primary)',
            fontSize: '0.95rem',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            minHeight: '56px',
            transition: 'var(--transition-gentle)'
          }}
        >
          <span>Stay here</span>
          <span style={{ color: 'var(--text-tertiary)' }}>&rarr;</span>
        </button>

        <button
          onClick={() => navigateTab('breathe')}
          style={{
            padding: '16px 20px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--shadow-subtle)',
            color: 'var(--text-primary)',
            fontSize: '0.95rem',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            minHeight: '56px',
            transition: 'var(--transition-gentle)'
          }}
        >
          <span>Help me settle</span>
          <span style={{ color: 'var(--text-tertiary)' }}>&rarr;</span>
        </button>

        <button
          onClick={() => setCurrentView('companion_action')}
          style={{
            padding: '16px 20px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--shadow-subtle)',
            color: 'var(--text-primary)',
            fontSize: '0.95rem',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            minHeight: '56px',
            transition: 'var(--transition-gentle)'
          }}
        >
          <span>Give me something small to do</span>
          <span style={{ color: 'var(--text-tertiary)' }}>&rarr;</span>
        </button>
      </div>

      <div />
    </main>
  );
};
