import {
  Building2,
  Calculator,
  CheckCircle2,
  Clock3,
  FileText,
  Image as ImageIcon,
  MapPin,
  MessageCircle,
  Phone,
  Ruler,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { Button, Card } from './Ui';

const WHATSAPP_URL =
  'https://wa.me/34600227252?text=Hola%2C%20quiero%20presupuesto%20para%20una%20caseta%20o%20m%C3%B3dulo%20prefabricado.';

const galleryImages = [
  {
    src: '/images/caseta-exterior-frontal.webp',
    title: 'Exterior frontal',
    description: 'Módulo blanco con puerta y ventana 80x80, acabado limpio y funcional.',
  },
  {
    src: '/images/caseta-exterior-lateral.webp',
    title: 'Vista exterior lateral',
    description: 'Módulo prefabricado instalado en finca, con estructura metálica y panel blanco.',
  },
  {
    src: '/images/caseta-exterior-jardin.webp',
    title: 'Módulo terminado',
    description: 'Ejemplo de módulo acabado para finca, almacén, oficina o uso auxiliar.',
  },
  {
    src: '/images/caseta-interior-oficina.webp',
    title: 'Interior acondicionado',
    description: 'Interior con panel blanco, instalación eléctrica, punto de luz y aire acondicionado.',
  },
];

const habitualModels = [
  ['Módulo compacto', '3 x 2,40 m', 'Herramientas, finca o pequeño almacén'],
  ['Módulo auxiliar', '4 x 2,40 m', 'Fincas, uso auxiliar y almacenamiento'],
  ['Módulo medio', '5 x 2,40 m', 'Almacén, obra o espacio auxiliar'],
  ['Más vendido', '6 x 2,40 m', 'Oficina pequeña, finca, almacén o caseta de obra'],
  ['Módulo grande', '7 x 2,40 m', 'Vestuario, oficina o módulo amplio'],
  ['Proyecto especial', '8 x 2,40 m', 'Bajo consulta técnica y transporte'],
] as const;

const useCases = [
  ['Casetas para fincas', 'Para herramientas, maquinaria, aperos o zonas de descanso en terrenos particulares.'],
  ['Módulos oficina', 'Espacios de trabajo para empresas, talleres, obras o negocios.'],
  ['Casetas de obra', 'Soluciones resistentes para obras, almacenes temporales y zonas de trabajo.'],
  ['Vestuarios prefabricados', 'Módulos para trabajadores, instalaciones deportivas o empresas.'],
  ['Almacenes prefabricados', 'Espacios seguros para guardar material, mercancía o herramientas.'],
] as const;

const trustItems = [
  ['Empresa registrada', 'Módulos Prefabricados San José S.L. · CIF B25987025'],
  ['Atención directa', 'Presupuesto personalizado por teléfono o WhatsApp'],
  ['Fabricación a medida', 'Medidas, distribución y extras según necesidad del cliente'],
  ['Precio orientativo', 'La calculadora ayuda a preparar una solicitud más clara'],
] as const;

const ModelThumbnail = ({ measure }: { measure: string }) => {
  const length = Number(measure.split(' ')[0]);
  const windowCount = length >= 8 ? 2 : 1;
  const moduleWidth = `${Math.min(94, 44 + length * 6)}%`;

  return (
    <div className="relative h-24 overflow-hidden rounded-xl bg-gradient-to-b from-sky-300 via-sky-100 to-stone-200" aria-hidden="true">
      <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-b from-stone-200 to-stone-300" />
      <div className="absolute left-3 top-8 h-8 w-10 rounded-full bg-green-700/40 blur-sm" />
      <div className="absolute right-2 top-7 h-10 w-12 rounded-full bg-green-800/35 blur-sm" />
      <div className="absolute bottom-3 left-5 right-5 h-px bg-black/10" />
      <div
        className="absolute bottom-5 left-1/2 h-11 -translate-x-1/2 rounded-[3px] border border-slate-400 bg-white shadow-md"
        style={{ width: moduleWidth }}
      >
        <div className="absolute inset-0 opacity-70 [background-image:linear-gradient(90deg,rgba(148,163,184,.45)_1px,transparent_1px)] [background-size:5px_100%]" />
        <div className="absolute -left-1 -top-1 bottom-0 w-2 bg-slate-400" />
        <div className="absolute -right-1 -top-1 bottom-0 w-2 bg-slate-400" />
        <div className="absolute -top-1 left-0 right-0 h-2 bg-slate-200 shadow-sm" />
        <div className="absolute -bottom-1 left-0 right-0 h-2 bg-slate-500" />
        <div className="absolute left-[38%] top-[22%] h-[73%] w-[16%] rounded-[2px] border border-slate-300 bg-slate-50 shadow-sm">
          <span className="absolute bottom-3 left-1 h-1.5 w-1.5 rounded-full bg-slate-800" />
        </div>
        {Array.from({ length: windowCount }).map((_, index) => {
          const left = windowCount === 2 ? (index === 0 ? '19%' : '67%') : '67%';
          return (
            <div key={left} className="absolute top-[27%] h-[38%] w-[16%] rounded-[2px] border-2 border-white bg-slate-800 shadow-sm" style={{ left }}>
              <div className="absolute inset-x-1 top-0 bottom-0 grid grid-cols-4 gap-0.5">
                <span className="bg-white/90" />
                <span className="bg-white/90" />
                <span className="bg-white/90" />
                <span className="bg-white/90" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const PublicLanding = ({ onStart, onAdmin }: { onStart: () => void; onAdmin: () => void }) => {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4">
          <a href="#inicio" className="flex items-center gap-3" aria-label="Ir al inicio">
            <div className="rounded-xl bg-brand-navy p-2 text-white"><Building2 size={24} /></div>
            <div>
              <p className="font-bold text-slate-900">Módulos Prefabricados San José S.L.</p>
              <p className="text-xs text-slate-500">Casetas y módulos prefabricados en Sevilla</p>
            </div>
          </a>
          <nav className="hidden items-center gap-6 text-sm font-semibold text-slate-600 md:flex" aria-label="Navegación principal">
            <a href="#calculadora" onClick={(e) => { e.preventDefault(); onStart(); }} className="hover:text-brand-blue">Calculadora</a>
            <a href="#servicios" className="hover:text-brand-blue">Servicios</a>
            <a href="#galeria" className="hover:text-brand-blue">Galería</a>
            <a href="#modelos" className="hover:text-brand-blue">Modelos</a>
            <a href="#contacto" className="hover:text-brand-blue">Contacto</a>
          </nav>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onAdmin} className="hidden md:inline-flex">Panel</Button>
            <a href="tel:+34600227252" className="hidden sm:inline-flex">
              <Button variant="outline" className="flex items-center gap-2"><Phone size={18} /> Llamar</Button>
            </a>
            <a href={WHATSAPP_URL} target="_blank" rel="noreferrer">
              <Button variant="secondary" className="flex items-center gap-2"><MessageCircle size={18} /> WhatsApp</Button>
            </a>
          </div>
        </div>
      </header>

      <main id="inicio">
        <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-white">
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 20% 20%, #f97316 0, transparent 25%), radial-gradient(circle at 80% 10%, #1d4ed8 0, transparent 20%)' }} />
          <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-16 md:grid-cols-2 md:items-center md:py-20">
            <div>
              <span className="mb-4 inline-flex rounded-full bg-white/10 px-4 py-2 text-sm font-semibold ring-1 ring-white/20">
                Fabricación a medida · Presupuesto personalizado · Sevilla y Andalucía
              </span>
              <h1 className="text-4xl font-black tracking-tight md:text-6xl">Casetas y módulos prefabricados a medida en Sevilla</h1>
              <p className="mt-6 max-w-xl text-lg text-slate-200">
                Fabricamos módulos con panel sándwich para fincas, oficinas, obras, almacenes, vestuarios y negocios. Configura medidas, distribución y extras para recibir un precio orientativo y solicitar presupuesto final.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button onClick={onStart} className="text-base"><Calculator size={18} /> Calcular precio orientativo</Button>
                <a href={WHATSAPP_URL} target="_blank" rel="noreferrer"><Button variant="outline" className="border-white/30 bg-white/10 text-white hover:bg-white/20"><MessageCircle size={18} /> Pedir presupuesto</Button></a>
              </div>
              <div className="mt-6 grid gap-3 text-sm text-slate-200 sm:grid-cols-3">
                <span className="flex items-center gap-2"><CheckCircle2 size={18} className="text-brand-green" /> Panel sándwich</span>
                <span className="flex items-center gap-2"><CheckCircle2 size={18} className="text-brand-green" /> Plano 2D</span>
                <span className="flex items-center gap-2"><CheckCircle2 size={18} className="text-brand-green" /> Atención directa</span>
              </div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/10 p-3 shadow-2xl backdrop-blur">
              <div className="overflow-hidden rounded-2xl bg-white shadow-xl">
                <img src="/images/caseta-exterior-frontal.webp" alt="Caseta prefabricada blanca fabricada con panel sándwich" className="h-[330px] w-full object-cover" />
                <div className="p-4 text-slate-900">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-amber-700">Modelo más solicitado</p>
                      <p className="text-2xl font-black">6 x 2,40 m</p>
                    </div>
                    <span className="rounded-full bg-orange-50 px-3 py-1 text-sm font-bold text-brand-orange">desde 4.750 € sin IVA</span>
                  </div>
                  <p className="mt-3 text-sm text-slate-600">Precio orientativo sujeto a medidas finales, extras, transporte, montaje y revisión técnica.</p>
                  <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                    <div className="rounded-xl bg-slate-50 p-3"><p className="text-xl font-bold">30 mm</p><p className="text-xs text-slate-500">Panel estándar</p></div>
                    <div className="rounded-xl bg-slate-50 p-3"><p className="text-xl font-bold">2D</p><p className="text-xs text-slate-500">Plano visual</p></div>
                    <div className="rounded-xl bg-slate-50 p-3"><p className="text-xl font-bold">+IVA</p><p className="text-xs text-slate-500">No incluido</p></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white py-8">
          <div className="mx-auto grid max-w-7xl gap-4 px-4 sm:grid-cols-2 lg:grid-cols-4">
            {trustItems.map(([title, description]) => (
              <div key={title} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <ShieldCheck className="mb-3 text-brand-green" />
                <h2 className="font-black text-slate-900">{title}</h2>
                <p className="mt-1 text-sm text-slate-600">{description}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="calculadora" className="bg-orange-50 py-12">
          <div className="mx-auto grid max-w-7xl gap-6 px-4 lg:grid-cols-[1fr_430px] lg:items-center">
            <div>
              <p className="text-sm font-black uppercase tracking-wide text-brand-orange">Calculadora de presupuesto</p>
              <h2 className="mt-2 text-3xl font-black text-slate-900">Calcula tu módulo y envía la configuración por WhatsApp</h2>
              <p className="mt-3 text-slate-700">
                El configurador genera un plano 2D orientativo y ayuda a definir medidas, panel, ubicación y extras. El precio mostrado es una estimación inicial; el presupuesto final se confirma tras revisar transporte, montaje y detalles técnicos.
              </p>
              <div className="mt-5 grid gap-2 text-sm font-semibold text-slate-700 sm:grid-cols-2">
                <span>✓ Medidas habituales de 3 a 8 metros</span>
                <span>✓ Panel sándwich y opciones especiales</span>
                <span>✓ Puertas, ventanas, enchufes y baño</span>
                <span>✓ PDF y mensaje preparado para WhatsApp</span>
              </div>
              <Button onClick={onStart} className="mt-6"><Calculator size={18} /> Abrir calculadora</Button>
            </div>
            <div className="rounded-2xl border-4 border-slate-900 bg-white p-4 shadow-xl">
              <div className="relative aspect-[2.5/1] border-4 border-slate-900 bg-slate-50">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.10)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.10)_1px,transparent_1px)] bg-[size:18px_18px]" />
                <span className="absolute left-[42%] top-0 rounded border border-slate-900 bg-white px-3 py-1 text-xs font-black">P</span>
                <span className="absolute left-[70%] top-0 rounded border border-blue-700 bg-white px-3 py-1 text-xs font-black text-blue-800">V</span>
                <span className="absolute left-[18%] top-[45%] rounded-full border-2 border-slate-900 bg-white px-2 py-1 text-xs font-black">T</span>
                <span className="absolute left-[50%] top-[45%] rounded-full border-2 border-yellow-600 bg-white px-2 py-1 text-xs font-black">PL</span>
                <span className="absolute left-[8%] top-[12%] rounded border-2 border-slate-900 bg-white px-2 py-1 text-xs font-black">CE</span>
                <span className="absolute bottom-2 left-2 rounded bg-white/95 px-2 py-1 text-[10px] font-semibold ring-1 ring-slate-300">P=Puerta · V=Ventana · T=Enchufe · PL=Punto luz · CE=Cuadro</span>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16">
          <h2 className="text-center text-3xl font-black text-slate-900">Cómo trabajamos</h2>
          <div className="mt-10 grid gap-5 md:grid-cols-4">
            {[
              ['Eliges medidas y uso', Ruler],
              ['Preparamos plano orientativo', Sparkles],
              ['Calculas precio estimado', Clock3],
              ['Confirmamos presupuesto final', FileText],
            ].map(([title, Icon], idx) => {
              const IconComponent = Icon as typeof Ruler;
              return (
                <Card key={String(title)} className="text-center">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 text-brand-orange"><IconComponent /></div>
                  <p className="mb-2 text-sm font-bold text-brand-orange">Paso {idx + 1}</p>
                  <h3 className="font-bold text-slate-900">{String(title)}</h3>
                </Card>
              );
            })}
          </div>
        </section>

        <section id="servicios" className="bg-white py-16">
          <div className="mx-auto max-w-7xl px-4">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-3xl font-black text-slate-900 md:text-4xl">Tipos de casetas y módulos que fabricamos</h2>
              <p className="mt-3 text-slate-600">Soluciones a medida para particulares, empresas, obras, fincas y negocios.</p>
            </div>
            <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-5">
              {useCases.map(([title, description]) => (
                <Card key={title}>
                  <CheckCircle2 className="mb-4 text-brand-green" />
                  <h3 className="font-black text-slate-900">{title}</h3>
                  <p className="mt-2 text-sm text-slate-600">{description}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section id="galeria" className="bg-slate-50 py-16">
          <div className="mx-auto max-w-7xl px-4">
            <div className="mx-auto max-w-3xl text-center">
              <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-bold text-brand-blue"><ImageIcon size={16} /> Galería de módulos reales</span>
              <h2 className="mt-4 text-3xl font-black text-slate-900 md:text-4xl">Ejemplos de acabados exteriores e interiores</h2>
              <p className="mt-3 text-slate-600">Imágenes para que puedas ver cómo puede quedar tu módulo antes de solicitar presupuesto.</p>
            </div>

            <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              {galleryImages.map((image) => (
                <Card key={image.src} className="overflow-hidden p-0">
                  <img src={image.src} alt={image.description} className="h-64 w-full object-cover" loading="lazy" />
                  <div className="p-5">
                    <h3 className="font-black text-slate-900">{image.title}</h3>
                    <p className="mt-2 text-sm text-slate-600">{image.description}</p>
                  </div>
                </Card>
              ))}
            </div>

            <div className="mt-10 rounded-3xl bg-slate-950 p-6 text-white md:flex md:items-center md:justify-between">
              <div>
                <h3 className="text-2xl font-black">¿Quieres un módulo parecido?</h3>
                <p className="mt-2 text-slate-300">Configura medidas, distribución y extras. Te enviamos presupuesto personalizado.</p>
              </div>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row md:mt-0">
                <Button onClick={onStart}>Calcular mi módulo</Button>
                <a href={WHATSAPP_URL} target="_blank" rel="noreferrer"><Button variant="outline" className="border-white/30 bg-white/10 text-white hover:bg-white/20">WhatsApp</Button></a>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white py-16">
          <div className="mx-auto max-w-7xl px-4">
            <h2 className="text-center text-3xl font-black text-slate-900">Ventajas de nuestros módulos prefabricados</h2>
            <div className="mt-10 grid gap-5 md:grid-cols-5">
              {['Fabricación a medida', 'Panel sándwich blanco 30 mm', 'Otros grosores y colores bajo consulta', 'Presupuesto personalizado', 'Atención directa por WhatsApp'].map((item) => (
                <div key={item} className="rounded-2xl border border-slate-200 p-5 text-center shadow-sm">
                  <CheckCircle2 className="mx-auto mb-3 text-brand-green" />
                  <p className="font-semibold text-slate-800">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="modelos" className="mx-auto max-w-7xl px-4 py-16">
          <h2 className="text-center text-3xl font-black text-slate-900">Modelos habituales</h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-slate-600">Medidas frecuentes para orientar el presupuesto. También podemos estudiar configuraciones especiales bajo consulta.</p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {habitualModels.map(([title, measure, usage]) => (
              <Card key={title} className="flex h-full flex-col gap-3">
                <ModelThumbnail measure={measure} />
                <p className="text-lg font-black text-slate-900">{title}</p>
                <p className="font-semibold text-brand-blue">{measure}</p>
                <p className="text-sm text-slate-600">{usage}</p>
              </Card>
            ))}
          </div>
        </section>

        <section id="contacto" className="bg-brand-navy py-12 text-white">
          <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-5 px-4 md:flex-row md:items-center">
            <div>
              <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-300"><MapPin size={16} /> San José de la Rinconada · Sevilla</p>
              <h2 className="mt-2 text-2xl font-black">Solicita presupuesto para tu caseta prefabricada</h2>
              <p className="mt-2 text-slate-300">Llámanos o envíanos tu configuración por WhatsApp para confirmar medidas, extras, transporte y montaje.</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <a href="tel:+34600227252"><Button variant="outline" className="border-white/30 bg-white/10 text-white hover:bg-white/20"><Phone size={18} /> Llamar</Button></a>
              <Button onClick={onStart}>Calcular mi módulo</Button>
            </div>
          </div>
        </section>
      </main>

      <a
        href={WHATSAPP_URL}
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full bg-green-600 px-5 py-3 font-bold text-white shadow-xl shadow-slate-900/25 transition hover:bg-green-700"
        aria-label="Pedir presupuesto por WhatsApp"
      >
        <MessageCircle size={20} />
        <span className="hidden sm:inline">Pedir presupuesto</span>
      </a>
    </div>
  );
};
