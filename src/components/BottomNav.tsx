import React from 'react';
import { Home, Wind, BookOpen, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { TabType } from '../types';

export const BottomNav: React.FC = () => {
  const { activeTab, navigateTab, currentView } = useApp();

  // Hide on welcome screen
  if (currentView === 'welcome') return null;

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'home', label: 'Home', icon: <Home size={20} /> },
    { id: 'breathe', label: 'Breathe', icon: <Wind size={20} /> },
    { id: 'dump', label: 'Journal', icon: <BookOpen size={20} /> },
    { id: 'quiet', label: 'Quiet', icon: <Sparkles size={20} /> }
  ];

  return (
    <nav
      role="navigation"
      aria-label="Main navigation"
      style={{
        position: 'sticky',
        bottom: 0,
        left: 0,
        right: 0,
        width: '100%',
        backgroundColor: 'var(--bg-surface-translucent)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderTop: '1px solid var(--border-subtle)',
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        padding: '8px 12px max(10px, env(safe-area-inset-bottom)) 12px',
        zIndex: 30
      }}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id && currentView === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => navigateTab(tab.id)}
            aria-selected={isActive}
            aria-label={tab.label}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              padding: '8px 16px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: isActive ? 'var(--accent-sage-bg)' : 'transparent',
              color: isActive ? 'var(--text-primary)' : 'var(--text-tertiary)',
              minHeight: '48px',
              minWidth: '56px',
              transition: 'var(--transition-gentle)',
              position: 'relative'
            }}
          >
            {tab.icon}
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: isActive ? 600 : 400,
                letterSpacing: '0.01em'
              }}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
