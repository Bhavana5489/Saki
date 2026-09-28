import React from 'react';
import { Companion } from '../components/Companion';
import { useApp } from '../context/AppContext';

export const WelcomeView: React.FC = () => {
  const { dismissWelcome, setCurrentView } = useApp();

  const handleStayHere = () => {
    dismissWelcome();
    setCurrentView('companion_stay');
  };

  const handleExplore = () => {
    dismissWelcome();
    setCurrentView('home');
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
        padding: '36px 24px 32px 24px',
        textAlign: 'center'
      }}
    >
      <div />

      {/* Center Welcome Graphic & Message */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px',
          maxWidth: '320px'
        }}
      >
        <Companion size={120} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <h1
            style={{
              fontSize: '1.85rem',
              fontWeight: 600,
              lineHeight: 1.25,
              color: 'var(--text-primary)'
            }}
          >
            You’re here.<br />That’s enough.
          </h1>

          <p
            style={{
              fontSize: '0.98rem',
              lineHeight: 1.5,
              color: 'var(--text-secondary)',
              fontWeight: 400
            }}
          >
            Take a moment. You don’t have to figure everything out right now.
          </p>
        </div>
      </div>

      {/* Action Buttons */}
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
          onClick={handleStayHere}
          style={{
            width: '100%',
            padding: '15px 22px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'var(--text-primary)',
            color: 'var(--text-inverse)',
            fontSize: '0.95rem',
            fontWeight: 500,
            minHeight: '52px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-soft)',
            transition: 'var(--transition-gentle)'
          }}
        >
          <span>Stay here for a moment</span>
        </button>

        <button
          onClick={handleExplore}
          style={{
            width: '100%',
            padding: '13px 20px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'var(--bg-secondary)',
            color: 'var(--text-secondary)',
            fontSize: '0.9rem',
            fontWeight: 500,
            minHeight: '46px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'var(--transition-gentle)'
          }}
        >
          <span>Explore</span>
        </button>
      </div>
    </main>
  );
};
