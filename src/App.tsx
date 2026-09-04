import { useState } from 'react';
import { LandingPage } from '@/components/LandingPage';
import { StudyModeSelection } from '@/components/StudyModeSelection';
import { StudyDashboard } from '@/components/StudyDashboard';
import { StudyAnalytics } from '@/components/StudyAnalytics';
import type { StudyMode } from '@/types';

type View = 'landing' | 'modeSelection' | 'dashboard' | 'analytics';

function App() {
  const [view, setView] = useState<View>('landing');
  const [studyMode, setStudyMode] = useState<StudyMode>('desk');

  return (
    <>
      {view === 'landing' && (
        <LandingPage
          onStart={() => setView('modeSelection')}
          onAnalytics={() => setView('analytics')}
        />
      )}
      {view === 'modeSelection' && (
        <StudyModeSelection
          onBack={() => setView('landing')}
          onSelect={(mode) => {
            setStudyMode(mode);
            setView('dashboard');
          }}
        />
      )}
      {view === 'dashboard' && (
        <StudyDashboard
          studyMode={studyMode}
          onBack={() => setView('modeSelection')}
        />
      )}
      {view === 'analytics' && (
        <StudyAnalytics onBack={() => setView('landing')} />
      )}
    </>
  );
}

export default App;
