import { useState } from 'react';
import { PublicLanding } from './components/PublicLanding';
import { Configurator } from './components/Configurator';
import { AdminPanel } from './components/AdminPanel';
import { FaqChatbot } from './components/FaqChatbot';
import { CompanyFooter } from './components/CompanyFooter';

type View = 'public' | 'configurator' | 'admin';

export default function App() {
  const [view, setView] = useState<View>('public');

  if (view === 'configurator') {
    return (
      <>
        <Configurator onBack={() => setView('public')} onAdmin={() => setView('admin')} />
        <CompanyFooter />
        <FaqChatbot onStartConfigurator={() => setView('configurator')} />
      </>
    );
  }

  if (view === 'admin') {
    return <AdminPanel onBack={() => setView('public')} />;
  }

  return (
    <>
      <PublicLanding onStart={() => setView('configurator')} onAdmin={() => setView('admin')} />
      <CompanyFooter />
      <FaqChatbot onStartConfigurator={() => setView('configurator')} />
    </>
  );
}
