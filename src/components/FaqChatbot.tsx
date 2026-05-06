import { FormEvent, useMemo, useRef, useState } from 'react';
import { Bot, Calculator, Camera, MessageCircle, Send, X } from 'lucide-react';

type ChatRole = 'assistant' | 'user';
type ChatCta = 'whatsapp' | 'photos' | 'calculator';

interface ChatMessage {
  id: string;
  role: ChatRole;
  text: string;
  cta?: ChatCta;
}

const companyWhatsapp = '34600227252';
const whatsappGeneralText = 'Hola, estoy viendo la calculadora de casetas prefabricadas y tengo una duda. Me gustaría recibir información.';
const whatsappPhotosText = 'Hola, estoy interesado en una caseta prefabricada. Quiero enviar fotos/vídeos del acceso a mi parcela y de la zona donde iría colocada para que podáis valorar transporte y descarga.';

const buildWhatsappUrl = (message: string) => `https://wa.me/${companyWhatsapp}?text=${encodeURIComponent(message)}`;

const answers = {
  greeting: 'Hola, soy el asistente de Módulos Prefabricados San José. Puedo ayudarte con medidas, precios, extras, paneles, transporte, accesibilidad, preparación del terreno o presupuesto.',
  measures: 'Fabricamos módulos desde 3 metros de largo. Lo más habitual está entre 5 y 7 metros. El modelo más solicitado es 6 x 2,40 m. También trabajamos anchos de 2,40 m y 2,50 m. Medidas especiales como 8 m o anchos distintos se revisan bajo consulta.',
  price: 'El módulo de referencia de 6 x 2,40 m tiene un precio estimado de 4.750 € sin IVA. Incluye 1 puerta, 1 ventana 80x80 e instalación eléctrica básica con 1 enchufe, 1 punto de luz y cuadro eléctrico.',
  includes: 'El módulo base incluye 1 puerta, 1 ventana 80x80, instalación eléctrica básica, 1 enchufe, 1 punto de luz y cuadro eléctrico. El precio no incluye IVA.',
  panel: 'Trabajamos normalmente con panel sándwich blanco de 30 mm. Otros grosores o colores pueden consultarse según disponibilidad, precio y plazo.',
  extras: 'Podemos añadir aire acondicionado, baño completo, ventanas extra, puertas adicionales, habitaciones interiores, enchufes adicionales y otros elementos bajo consulta.',
  air: 'El aire acondicionado tiene un precio orientativo de 600 € sin IVA.',
  bathroom: 'El cuarto de baño completo tiene un precio orientativo de 1.500 € sin IVA.',
  sockets: 'La instalación básica incluye 1 enchufe, 1 punto de luz y cuadro eléctrico. Cada enchufe adicional tiene un precio orientativo de 50 € sin IVA.',
  windows: 'El módulo base incluye una ventana 80x80. Una ventana extra 80x80 tiene un precio orientativo de 200 €. Una ventana grande extra tiene un precio orientativo de 250 €.',
  doors: 'El módulo base incluye una puerta. Cada puerta adicional tiene un precio orientativo de 120 €.',
  budget: 'Puedes configurar tu módulo en la calculadora y descargar un presupuesto orientativo. Para un presupuesto final revisaremos medidas, transporte, montaje, distribución, acabados y condiciones de acceso.',
  transport: 'El transporte no está incluido en el precio de la caseta. No contamos con transporte propio, por lo que trabajamos con transportistas externos. El coste depende principalmente de la distancia, ubicación, accesibilidad y tipo de descarga. Como orientación, en zonas cercanas el transporte puede partir desde unos 250 €, pero el precio final debe confirmarse según la dirección exacta y las condiciones de acceso. ¿Puedes enviarnos fotos o un vídeo del acceso a la parcela y de la zona donde iría colocada la caseta? Así podremos valorar mejor si el transporte y la descarga son viables.',
  access: 'Antes de entregar una caseta es muy importante revisar bien el acceso a la parcela. Aunque muchas veces parece que entra un camión sin problema, hay que comprobar si el camino permite maniobrar, si hay anchura suficiente, si existen curvas cerradas, pendientes, árboles, cables, muros, cancelas estrechas o zonas donde el camión no pueda girar o descargar correctamente. Para evitar problemas el día de la entrega, recomendamos enviar fotos y vídeos del acceso, entrada, camino interior y zona donde irá colocada la caseta.',
  unloading: 'La descarga depende del transportista y de las condiciones de acceso de la parcela. Es importante confirmar si el camión puede entrar, maniobrar y dejar el módulo cerca del punto donde irá colocado. Si el acceso es complicado, hay pendiente, poco espacio, cables, árboles, muros o una cancela estrecha, puede ser necesario revisar otra solución antes de confirmar el transporte.',
  installation: 'No realizamos instalación de obra en la parcela. La caseta se entrega como módulo prefabricado y el terreno debe estar preparado antes de la entrega. Es muy importante que la base esté nivelada y firme para evitar problemas de apoyo, puertas, estructura o estabilidad.',
  terrain: 'Antes de recibir la caseta, el terreno debe estar preparado. Lo ideal es una base de hormigón nivelada, lo más recta posible. Si el terreno es de tierra o grava, recomendamos contar con vigas transversales a lo largo del módulo para que la caseta apoye correctamente y quede estable. Una base mal nivelada puede provocar problemas en puertas, estructura, apoyo del módulo y acabado final.',
  combined: 'El precio de la caseta no incluye transporte ni instalación. No contamos con transporte propio, trabajamos con transportistas externos y el coste depende de la distancia y la accesibilidad de la parcela. En zonas cercanas puede partir desde unos 250 €, pero debe confirmarse según ubicación. Tampoco realizamos instalación de obra en la parcela. El terreno debe estar preparado antes de la entrega, preferiblemente con una base de hormigón nivelada. Si es tierra o grava, recomendamos vigas transversales a lo largo del módulo para un buen apoyo. También es importante revisar bien el acceso para el camión: anchura, giros, pendientes, cables, árboles, muros y zona de descarga.',
  fallback: 'Para esa consulta es mejor que revisemos tu caso personalmente. Puedes escribirnos por WhatsApp y te ayudamos con tu presupuesto.',
};

const quickQuestions = [
  'Precio 6 x 2,40',
  'Medidas habituales',
  'Qué incluye',
  'Transporte',
  'Accesibilidad parcela',
  'Preparar terreno',
  'Extras disponibles',
  'Panel sándwich',
  'Pedir presupuesto',
  'Enviar fotos por WhatsApp',
];

const normalize = (value: string) =>
  value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

const includesAny = (text: string, keywords: string[]) => keywords.some((keyword) => text.includes(keyword));

const getAnswer = (rawQuestion: string): { text: string; cta?: ChatCta } => {
  const q = normalize(rawQuestion);

  if (includesAny(q, ['llevais y la instalais', 'llevais e instalais', 'incluye transporte y montaje', 'transporte y montaje', 'colocais vosotros', 'la colocais', 'que necesito para ponerla', 'ponerla en mi parcela'])) {
    return { text: answers.combined, cta: 'photos' };
  }

  if (includesAny(q, ['acceso', 'accesibilidad', 'parcela', 'camion', 'entrada', 'camino', 'maniobrar', 'cancela', 'pendiente', 'arbol', 'arboles', 'cable', 'cables', 'muro', 'muros'])) {
    return { text: answers.access, cta: 'photos' };
  }

  if (includesAny(q, ['transporte', 'envio', 'llevar', 'entrega', 'distancia', 'transportista', 'portes', 'porte', 'desplazamiento', 'coste transporte'])) {
    return { text: answers.transport, cta: 'photos' };
  }

  if (includesAny(q, ['descarga', 'descargar', 'grua', 'camion grua', 'descargar caseta', 'dejar la caseta', 'colocar la caseta'])) {
    return { text: answers.unloading, cta: 'photos' };
  }

  if (includesAny(q, ['instalacion', 'instalar', 'montaje', 'montar', 'colocar', 'colocacion', 'obra', 'preparar terreno'])) {
    return { text: answers.installation, cta: 'photos' };
  }

  if (includesAny(q, ['terreno', 'base', 'hormigon', 'nivelado', 'nivelar', 'suelo', 'tierra', 'grava', 'vigas', 'apoyo', 'cimentacion', 'solera'])) {
    return { text: answers.terrain, cta: 'photos' };
  }

  if (includesAny(q, ['precio', 'cuesta', 'vale', 'coste', '6x2', '6 x 2', '6x2,40', '6 x 2,40', '6x2.40', '4750'])) return { text: answers.price, cta: 'calculator' };
  if (includesAny(q, ['medidas', 'largo', 'ancho', 'tamano', 'tamaño', 'metros'])) return { text: answers.measures, cta: 'calculator' };
  if (includesAny(q, ['incluye', 'incluido', 'lleva de serie', 'base'])) return { text: answers.includes, cta: 'calculator' };
  if (includesAny(q, ['panel', 'sandwich', 'sandwich', 'grosor', 'color', '30 mm', '30mm'])) return { text: answers.panel };
  if (includesAny(q, ['extra', 'extras', 'opciones', 'adicional'])) return { text: answers.extras, cta: 'calculator' };
  if (includesAny(q, ['aire', 'acondicionado', 'climatizacion'])) return { text: answers.air, cta: 'calculator' };
  if (includesAny(q, ['baño', 'bano', 'aseo', 'ducha'])) return { text: answers.bathroom, cta: 'calculator' };
  if (includesAny(q, ['enchufe', 'electricidad', 'luz', 'cuadro', 'punto de luz', 'instalacion electrica'])) return { text: answers.sockets, cta: 'calculator' };
  if (includesAny(q, ['ventana', 'ventanas'])) return { text: answers.windows, cta: 'calculator' };
  if (includesAny(q, ['puerta', 'puertas'])) return { text: answers.doors, cta: 'calculator' };
  if (includesAny(q, ['presupuesto', 'calculadora', 'calcular', 'configurar'])) return { text: answers.budget, cta: 'calculator' };
  if (includesAny(q, ['whatsapp', 'contacto', 'telefono', 'fotos', 'foto', 'video', 'videos'])) return { text: 'Puedes hablar directamente con nosotros por WhatsApp para recibir atención personalizada. También puedes enviarnos fotos o vídeos del acceso para revisar transporte y descarga.', cta: 'photos' };

  return { text: answers.fallback, cta: 'whatsapp' };
};

const ChatCtaButton = ({ cta, onStartConfigurator }: { cta: ChatCta; onStartConfigurator: () => void }) => {
  if (cta === 'calculator') {
    return (
      <button onClick={onStartConfigurator} className="mt-3 inline-flex items-center gap-2 rounded-xl bg-brand-orange px-3 py-2 text-sm font-bold text-white transition hover:bg-orange-600">
        <Calculator size={16} /> Abrir calculadora
      </button>
    );
  }

  if (cta === 'photos') {
    return (
      <a href={buildWhatsappUrl(whatsappPhotosText)} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 rounded-xl bg-brand-green px-3 py-2 text-sm font-bold text-white transition hover:bg-green-700">
        <Camera size={16} /> Enviar fotos por WhatsApp
      </a>
    );
  }

  return (
    <a href={buildWhatsappUrl(whatsappGeneralText)} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 rounded-xl bg-brand-green px-3 py-2 text-sm font-bold text-white transition hover:bg-green-700">
      <MessageCircle size={16} /> Hablar por WhatsApp
    </a>
  );
};

export const FaqChatbot = ({ onStartConfigurator }: { onStartConfigurator: () => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'welcome', role: 'assistant', text: answers.greeting },
  ]);
  const listRef = useRef<HTMLDivElement | null>(null);

  const hasMessages = useMemo(() => messages.length > 1, [messages.length]);

  const addQuestion = (question: string) => {
    const cleaned = question.trim();
    if (!cleaned) return;
    const response = getAnswer(cleaned);
    const nextMessages: ChatMessage[] = [
      { id: crypto.randomUUID(), role: 'user', text: cleaned },
      { id: crypto.randomUUID(), role: 'assistant', text: response.text, cta: response.cta },
    ];
    setMessages((prev) => [...prev, ...nextMessages]);
    setInput('');
    setTimeout(() => listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' }), 50);
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    addQuestion(input);
  };

  if (!isOpen) {
    return (
      <button onClick={() => setIsOpen(true)} className="fixed bottom-5 right-5 z-50 flex items-center gap-3 rounded-full bg-brand-orange px-5 py-4 font-black text-white shadow-2xl transition hover:bg-orange-600">
        <MessageCircle size={22} /> ¿Tienes dudas?
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[calc(100vw-2rem)] max-w-md overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-2xl">
      <div className="flex items-center justify-between bg-brand-blue px-5 py-4 text-white">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15"><Bot size={22} /></span>
          <div>
            <p className="font-black leading-tight">Asistente de casetas</p>
            <p className="text-xs text-blue-100">Medidas, precios, transporte y accesibilidad</p>
          </div>
        </div>
        <button onClick={() => setIsOpen(false)} className="rounded-xl p-2 text-blue-100 transition hover:bg-white/10 hover:text-white" aria-label="Cerrar chat">
          <X size={20} />
        </button>
      </div>

      <div ref={listRef} className="max-h-[54vh] space-y-4 overflow-y-auto bg-slate-50 px-4 py-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${message.role === 'user' ? 'bg-brand-orange text-white' : 'bg-white text-slate-700 shadow-sm ring-1 ring-slate-200'}`}>
              <p>{message.text}</p>
              {message.role === 'assistant' && message.cta ? <ChatCtaButton cta={message.cta} onStartConfigurator={onStartConfigurator} /> : null}
            </div>
          </div>
        ))}

        {!hasMessages && (
          <div className="flex flex-wrap gap-2 pt-1">
            {quickQuestions.map((question) => (
              <button key={question} onClick={() => addQuestion(question)} className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:border-brand-orange hover:text-brand-orange">
                {question}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-slate-200 bg-white p-4">
        <div className="mb-3 flex flex-wrap gap-2">
          <button onClick={() => addQuestion('Transporte y accesibilidad')} className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-200">Transporte</button>
          <button onClick={() => addQuestion('Preparar terreno')} className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-200">Terreno</button>
          <button onClick={() => addQuestion('Precio 6 x 2,40')} className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-200">Precio</button>
          <a href={buildWhatsappUrl(whatsappGeneralText)} target="_blank" rel="noreferrer" className="rounded-full bg-green-50 px-3 py-1.5 text-xs font-bold text-green-700 hover:bg-green-100">WhatsApp</a>
        </div>
        <form onSubmit={submit} className="flex gap-2">
          <input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Escribe tu pregunta..." className="min-w-0 flex-1 rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-brand-blue focus:ring-2 focus:ring-blue-100" />
          <button type="submit" className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-orange text-white transition hover:bg-orange-600" aria-label="Enviar pregunta">
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};
