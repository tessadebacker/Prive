import { useState } from 'react';
import { StoreProvider } from './store';
import { Header } from './components/Header';
import { BottomNav, type Tab } from './components/BottomNav';
import { TodayScreen } from './screens/TodayScreen';
import { HabitsScreen } from './screens/HabitsScreen';
import { GoalsScreen } from './screens/GoalsScreen';
import { RewardsScreen } from './screens/RewardsScreen';

function Screens({ tab, onNavigate }: { tab: Tab; onNavigate: (t: Tab) => void }) {
  switch (tab) {
    case 'today':
      return <TodayScreen onNavigate={onNavigate} />;
    case 'habits':
      return <HabitsScreen />;
    case 'goals':
      return <GoalsScreen />;
    case 'rewards':
      return <RewardsScreen />;
  }
}

export default function App() {
  const [tab, setTab] = useState<Tab>('today');

  return (
    <StoreProvider>
      <div className="app-shell">
        <Header />
        <Screens tab={tab} onNavigate={setTab} />
        <BottomNav active={tab} onChange={setTab} />
      </div>
    </StoreProvider>
  );
}
