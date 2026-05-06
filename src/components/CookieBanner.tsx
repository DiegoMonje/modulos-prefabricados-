import { useEffect, useState } from 'react';
import { Cookie, Settings, ShieldCheck, X } from 'lucide-react';
import { Button } from './Ui';
import type { LegalPageType } from './LegalPages';

type CookieConsent = 'accepted' | 'rejected' | 'configured';
const STORAGE_KEY = 'mpsj_cookie_consent';

export const CookieBanner = ({ onLegalPage }: { onLegalPage: (page: LegalPageType) => void }) => {
  const [visible, setVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) setVisible(true);
  }, []);

  const saveConsent = (status: CookieConsent, options?: { analytics?: boolean; marketing?: boolean }) => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        status,
        analytics: options?.analytics ?? false,
        marketing: options?.marketing ?? false,
        savedAt: new Date().toISOString(),
      }),
    );
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[70] px-4 pb-4">
      <div className="mx-auto max-w-5xl overflow-hidden rounded-[28px] border border-slate-700 bg-slate-950 text-white shadow-2xl shadow-slate-950/50">
        <div className="grid gap-5 p-5 md:grid-cols-[1fr_auto] md:items-start">
          <div className="flex gap-4">
            <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-orange text-white sm:flex">
              <Cookie size={24} />
            </div>
            <div>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.18em] text-orange-300">Privacidad y cookies</p>
                  <h2 className="mt-1 text-xl font-black">Usamos cookies para mejorar tu experiencia</h2>
                </div>
                <button onClick={() => saveConsent('rejected')} className="rounded-full bg-slate-900 p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white md:hidden" aria-label="Cerrar banner de cookies">
                  <X size={18} />
                </button>
              </div>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
                Utilizamos cookies técnicas necesarias para que la web funcione. Las cookies de analítica o marketing solo se activarán si las aceptas o las configuras.
              </p>

              {showSettings && (
                <div className="mt-4 grid gap-3 rounded-2xl bg-slate-900 p-4 text-sm text-slate-200 sm:grid-cols-2">
                  <label className="flex items-start gap-3 rounded-xl border border-slate-700 p-3">
                    <input type="checkbox" checked disabled className="mt-1" />
                    <span><strong>Necesarias</strong><br /><span className="text-slate-400">Siempre activas. Permiten guardar tu preferencia.</span></span>
                  </label>
                  <label className="flex items-start gap-3 rounded-xl border border-slate-700 p-3">
                    <input type="checkbox" checked={analytics} onChange={(e) => setAnalytics(e.target.checked)} className="mt-1" />
                    <span><strong>Analítica</strong><br /><span className="text-slate-400">Para medir visitas si se instala analítica.</span></span>
                  </label>
                  <label className="flex items-start gap-3 rounded-xl border border-slate-700 p-3 sm:col-span-2">
                    <input type="checkbox" checked={marketing} onChange={(e) => setMarketing(e.target.checked)} className="mt-1" />
                    <span><strong>Marketing</strong><br /><span className="text-slate-400">Para campañas o píxeles publicitarios si se añaden en el futuro.</span></span>
                  </label>
                </div>
              )}

              <button onClick={() => onLegalPage('cookies')} className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-orange-300 hover:text-orange-200">
                <ShieldCheck size={16} /> Ver política de cookies
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2 md:min-w-48">
            <Button onClick={() => saveConsent('accepted', { analytics: true, marketing: true })}>Aceptar todas</Button>
            <Button variant="outline" onClick={() => saveConsent('rejected')} className="border-slate-600 bg-slate-900 text-white hover:bg-slate-800">Rechazar</Button>
            {showSettings ? (
              <Button variant="secondary" onClick={() => saveConsent('configured', { analytics, marketing })}>Guardar configuración</Button>
            ) : (
              <button onClick={() => setShowSettings(true)} className="flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-slate-300 transition hover:bg-slate-900 hover:text-white">
                <Settings size={16} /> Configurar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
