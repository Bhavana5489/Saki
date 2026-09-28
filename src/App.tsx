import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { SafetyModal } from './components/SafetyModal';
import { WelcomeView } from './pages/WelcomeView';
import { HomeView } from './pages/HomeView';
import { BreatheView } from './pages/BreatheView';
import { DumpView } from './pages/DumpView';
import { QuietGameView } from './pages/QuietGameView';
import { CompanionView } from './pages/CompanionView';

const MainContent: React.FC = () => {
  const { currentView } = useApp();

  const renderCurrentView = () => {
    switch (currentView) {
      case 'welcome':
        return <WelcomeView />;
      case 'home':
        return <HomeView />;
      case 'breathe':
        return <BreatheView />;
      case 'dump':
        return <DumpView />;
      case 'quiet':
        return <QuietGameView />;
      case 'companion':
      case 'companion_stay':
      case 'companion_action':
        return <CompanionView />;
      default:
        return <HomeView />;
    }
  };

  return (
    <div className="app-container">
      {currentView !== 'welcome' && <Header />}
      {renderCurrentView()}
      <BottomNav />
      <SafetyModal />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
};

export default App;
