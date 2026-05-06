import type React from 'react';
import { ArrowLeft, Cookie, FileText, ShieldCheck } from 'lucide-react';
import { Button, Card } from './Ui';

export type LegalPageType = 'aviso-legal' | 'privacidad' | 'cookies';

const company = {
  name: 'Módulos Prefabricados San José S.L.',
  cif: 'B25987025',
  address: 'Plaza de los Inventores 7, 1D, San José de la Rinconada, 41300, Sevilla',
  phone: '600 227 252',
  email: 'contacto@modulosprefabricadossanjose.com',
};

const pageConfig = {
  'aviso-legal': {
    title: 'Aviso legal',
    icon: FileText,
    intro: 'Información general del titular de esta web y condiciones básicas de uso.',
  },
  privacidad: {
    title: 'Política de privacidad',
    icon: ShieldCheck,
    intro: 'Información sobre cómo tratamos los datos que nos envías mediante formularios, WhatsApp o el configurador.',
  },
  cookies: {
    title: 'Política de cookies',
    icon: Cookie,
    intro: 'Información sobre el uso de cookies técnicas y preferencias de consentimiento.',
  },
} satisfies Record<LegalPageType, { title: string; icon: typeof FileText; intro: string }>;

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <h2 className="text-xl font-black text-slate-900">{title}</h2>
    <div className="mt-3 space-y-3 text-sm leading-6 text-slate-700">{children}</div>
  </section>
);

export const LegalPages = ({ page, onBack, onNavigate }: { page: LegalPageType; onBack: () => void; onNavigate: (page: LegalPageType) => void }) => {
  const config = pageConfig[page];
  const Icon = config.icon;

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button variant="ghost" onClick={onBack} className="flex items-center gap-2 self-start">
            <ArrowLeft size={18} /> Volver
          </Button>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => onNavigate('aviso-legal')} className={`rounded-full px-4 py-2 text-sm font-bold ${page === 'aviso-legal' ? 'bg-brand-orange text-white' : 'bg-white text-slate-700 ring-1 ring-slate-200'}`}>Aviso legal</button>
            <button onClick={() => onNavigate('privacidad')} className={`rounded-full px-4 py-2 text-sm font-bold ${page === 'privacidad' ? 'bg-brand-orange text-white' : 'bg-white text-slate-700 ring-1 ring-slate-200'}`}>Privacidad</button>
            <button onClick={() => onNavigate('cookies')} className={`rounded-full px-4 py-2 text-sm font-bold ${page === 'cookies' ? 'bg-brand-orange text-white' : 'bg-white text-slate-700 ring-1 ring-slate-200'}`}>Cookies</button>
          </div>
        </div>

        <Card className="mb-6 overflow-hidden bg-slate-950 text-white">
          <div className="flex flex-col gap-5 md:flex-row md:items-center">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-orange text-white">
              <Icon size={28} />
            </div>
            <div>
              <p className="text-sm font-black uppercase tracking-[0.18em] text-orange-300">Información legal</p>
              <h1 className="mt-2 text-3xl font-black md:text-4xl">{config.title}</h1>
              <p className="mt-3 max-w-3xl text-slate-300">{config.intro}</p>
            </div>
          </div>
        </Card>

        {page === 'aviso-legal' && <AvisoLegal />}
        {page === 'privacidad' && <Privacidad />}
        {page === 'cookies' && <Cookies />}

        <p className="mt-6 rounded-2xl bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          Estos textos son una base informativa para la web. Conviene revisarlos con un profesional especializado antes de usarlos como documentación legal definitiva.
        </p>
      </div>
    </div>
  );
};

const AvisoLegal = () => (
  <div className="space-y-5">
    <Section title="Titular de la web">
      <div className="grid gap-3 sm:grid-cols-2">
        <p><strong>Empresa:</strong> {company.name}</p>
        <p><strong>CIF:</strong> {company.cif}</p>
        <p><strong>Teléfono:</strong> {company.phone}</p>
        <p><strong>Email:</strong> <a href={`mailto:${company.email}`} className="font-bold text-brand-blue">{company.email}</a></p>
        <p className="sm:col-span-2"><strong>Domicilio social:</strong> {company.address}</p>
      </div>
    </Section>

    <Section title="Objeto de la web">
      <p>Esta web ofrece información comercial sobre casetas y módulos prefabricados, permite configurar un módulo de forma orientativa y solicitar presupuesto personalizado.</p>
      <p>Los precios, planos y resultados generados por el configurador son orientativos y quedan sujetos a revisión técnica, disponibilidad de materiales, transporte, accesos, instalación y condiciones concretas del pedido.</p>
    </Section>

    <Section title="Condiciones de uso">
      <p>El usuario se compromete a utilizar la web de forma lícita, correcta y respetuosa. No está permitido usar los formularios para enviar información falsa, abusiva, automatizada o que pueda perjudicar el funcionamiento del servicio.</p>
      <p>La empresa puede modificar contenidos, precios orientativos, diseños o funcionalidades de la web cuando lo considere necesario.</p>
    </Section>

    <Section title="Propiedad intelectual">
      <p>Los textos, imágenes, diseños, código, logotipos y elementos visuales de esta web pertenecen a {company.name} o se utilizan con autorización/licencia correspondiente.</p>
      <p>No se permite copiar, distribuir o reutilizar estos contenidos con fines comerciales sin autorización previa.</p>
    </Section>
  </div>
);

const Privacidad = () => (
  <div className="space-y-5">
    <Section title="Responsable del tratamiento">
      <p><strong>{company.name}</strong>, con CIF {company.cif}, es responsable del tratamiento de los datos enviados a través de esta web.</p>
      <p>Contacto: <a href={`mailto:${company.email}`} className="font-bold text-brand-blue">{company.email}</a> · Teléfono {company.phone}</p>
    </Section>

    <Section title="Datos que podemos solicitar">
      <p>Podemos tratar datos identificativos y de contacto como nombre, teléfono, email, provincia, localidad, uso previsto del módulo, comentarios del proyecto y configuración generada en el plano 2D.</p>
      <p>También podemos guardar si el usuario acepta la política de privacidad, solicita descarga de presupuesto o se suscribe voluntariamente a comunicaciones comerciales.</p>
    </Section>

    <Section title="Finalidad del tratamiento">
      <ul className="list-disc space-y-2 pl-5">
        <li>Gestionar solicitudes de presupuesto y contacto.</li>
        <li>Preparar propuestas comerciales sobre casetas o módulos prefabricados.</li>
        <li>Enviar el plano y presupuesto orientativo generado por el configurador.</li>
        <li>Atender consultas por email, teléfono o WhatsApp.</li>
        <li>Enviar novedades u ofertas solo cuando el usuario lo haya solicitado expresamente.</li>
      </ul>
    </Section>

    <Section title="Base jurídica">
      <p>Tratamos los datos sobre la base del consentimiento del usuario, la aplicación de medidas precontractuales solicitadas por el interesado y el interés legítimo en responder consultas comerciales.</p>
    </Section>

    <Section title="Conservación y derechos">
      <p>Los datos se conservarán durante el tiempo necesario para atender la solicitud y, en su caso, durante los plazos legales aplicables.</p>
      <p>El usuario puede solicitar acceso, rectificación, supresión, oposición, limitación o portabilidad escribiendo a <a href={`mailto:${company.email}`} className="font-bold text-brand-blue">{company.email}</a>.</p>
    </Section>
  </div>
);

const Cookies = () => (
  <div className="space-y-5">
    <Section title="Qué son las cookies">
      <p>Las cookies son pequeños archivos que se guardan en el navegador para recordar información técnica, preferencias o ajustes de navegación.</p>
    </Section>

    <Section title="Cookies utilizadas en esta web">
      <ul className="list-disc space-y-2 pl-5">
        <li><strong>Cookies técnicas:</strong> necesarias para que la web funcione correctamente y para guardar la preferencia del banner de cookies.</li>
        <li><strong>Cookies de preferencias:</strong> pueden utilizarse para recordar decisiones del usuario.</li>
        <li><strong>Cookies analíticas o marketing:</strong> solo deberían activarse si en el futuro se instalan herramientas como analítica web, píxeles publicitarios o servicios equivalentes.</li>
      </ul>
    </Section>

    <Section title="Gestión del consentimiento">
      <p>Al entrar en la web se muestra un banner desde el que el usuario puede aceptar, rechazar o configurar las cookies no necesarias.</p>
      <p>Actualmente el banner guarda la preferencia del usuario en el navegador mediante almacenamiento local.</p>
    </Section>

    <Section title="Cómo desactivar cookies">
      <p>El usuario puede borrar o bloquear cookies desde la configuración de su navegador. Al hacerlo, algunas funciones podrían no recordar sus preferencias.</p>
    </Section>
  </div>
);
