import { useEffect, useState } from 'react';
import { PublicLanding } from './components/PublicLandingFixed';
import { Configurator } from './components/ConfiguratorFixed';
import { AdminPanel } from './components/AdminPanel';
import { FaqChatbot } from './components/FaqChatbot';
import { CompanyFooter } from './components/CompanyFooter';
import { CookieBanner } from './components/CookieBanner';
import { LegalPages, LegalPageType } from './components/LegalPages';

type View = 'public' | 'configurator' | 'admin' | 'legal';

const hasAdminEntry = () => {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  return params.get('admin') === '1' || window.location.hash === '#admin';
};

export default function App() {
  const [view, setView] = useState<View>(() => (hasAdminEntry() ? 'admin' : 'public'));
  const [legalPage, setLegalPage] = useState<LegalPageType>('aviso-legal');

  useEffect(() => {
    const handleUrlChange = () => {
      if (hasAdminEntry()) setView('admin');
    };

    window.addEventListener('hashchange', handleUrlChange);
    return () => window.removeEventListener('hashchange', handleUrlChange);
  }, []);

  const openLegalPage = (page: LegalPageType) => {
    setLegalPage(page);
    setView('legal');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openAdmin = () => {
    if (hasAdminEntry()) {
      setView('admin');
      return;
    }

    window.alert('Área privada. Accede desde la URL interna de administración.');
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
        <Configurator onBack={() => setView('public')} onAdmin={openAdmin} />
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
      <PublicLanding onStart={() => setView('configurator')} onAdmin={openAdmin} />
      <CompanyFooter onLegalPage={openLegalPage} />
      <CookieBanner onLegalPage={openLegalPage} />
      <FaqChatbot onStartConfigurator={() => setView('configurator')} />
    </>
  );
}
