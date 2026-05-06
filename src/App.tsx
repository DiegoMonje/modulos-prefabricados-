import { useState } from 'react';
import { PublicLanding } from './components/PublicLanding';
import { Configurator } from './components/Configurator';
import { AdminPanel } from './components/AdminPanel';
import { FaqChatbot } from './components/FaqChatbot';
import { CompanyFooter } from './components/CompanyFooter';
import { CookieBanner } from './components/CookieBanner';
import { LegalPages, LegalPageType } from './components/LegalPages';

type View = 'public' | 'configurator' | 'admin' | 'legal';

export default function App() {
  const [view, setView] = useState<View>('public');
  const [legalPage, setLegalPage] = useState<LegalPageType>('aviso-legal');

  const openLegalPage = (page: LegalPageType) => {
    setLegalPage(page);
    setView('legal');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (view === 'legal') {
    return (
      <>
        <LegalPages page={legalPage} onBack={() => setView('public')} onNavigate={setLegalPage} />
        <CompanyFooter onLegalPage={openLegalPage} />
      </>
    );
  }

  if (view === 'configurator') {
    return (
      <>
        <Configurator onBack={() => setView('public')} onAdmin={() => setView('admin')} />
        <CompanyFooter onLegalPage={openLegalPage} />
        <CookieBanner onLegalPage={openLegalPage} />
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
      <CompanyFooter onLegalPage={openLegalPage} />
      <CookieBanner onLegalPage={openLegalPage} />
      <FaqChatbot onStartConfigurator={() => setView('configurator')} />
    </>
  );
}
