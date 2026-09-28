import React from 'react';
import { useApp } from '../context/AppContext';

export const HomeView: React.FC = () => {
  const { navigateTab, setCurrentView } = useApp();

  const pathways = [
    {
      title: 'I need to slow down',
      subtitle: 'Unhurried breathing',
      onClick: () => navigateTab('breathe')
    },
    {
      title: 'My mind is too full',
      subtitle: 'Private journal & thoughts',
      onClick: () => navigateTab('dump')
    },
    {
      title: 'I need something gentle to do',
      subtitle: 'Table tennis, noticing & quiet play',
      onClick: () => navigateTab('quiet')
    }
  ];

  return (
    <main
      className="fade-in"
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '16px 20px 24px 20px',
        gap: '24px'
      }}
    >
      {/* Gentle Header */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <span
          style={{
            fontSize: '0.95rem',
            fontWeight: 400,
            color: 'var(--text-tertiary)'
          }}
        >
          Hey.
        </span>
        <h1
          style={{
            fontSize: '1.65rem',
            fontWeight: 600,
            color: 'var(--text-primary)',
            lineHeight: 1.25
          }}
        >
          What do you need right now?
        </h1>
      </div>

      {/* Primary 3 Pathway Cards */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          width: '100%'
        }}
      >
        {pathways.map((item, idx) => (
          <button
            key={idx}
            onClick={item.onClick}
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'flex-start',
              gap: '4px',
              padding: '18px 20px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              boxShadow: 'var(--shadow-subtle)',
              textAlign: 'left',
              transition: 'var(--transition-gentle)',
              cursor: 'pointer',
              minHeight: '68px',
              width: '100%'
            }}
          >
            <span
              style={{
                fontSize: '1.05rem',
                fontWeight: 600,
                color: 'var(--text-primary)'
              }}
            >
              {item.title}
            </span>
            <span
              style={{
                fontSize: '0.86rem',
                color: 'var(--text-secondary)'
              }}
            >
              {item.subtitle}
            </span>
          </button>
        ))}
      </div>

      {/* 4th Option: "I don't know" - Soft, safe, non-judgmental presence card */}
      <div style={{ width: '100%', marginTop: '4px' }}>
        <button
          onClick={() => setCurrentView('companion')}
          style={{
            width: '100%',
            padding: '16px 20px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid transparent',
            color: 'var(--text-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            textAlign: 'left',
            minHeight: '56px',
            transition: 'var(--transition-gentle)'
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontSize: '0.98rem', fontWeight: 600 }}>I don’t know</span>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Quiet presence and one small step
            </span>
          </div>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>&rarr;</span>
        </button>
      </div>
    </main>
  );
};
