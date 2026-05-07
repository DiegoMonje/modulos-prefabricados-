import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Bot, Calculator, Camera, MessageCircle, RefreshCcw, Send, X } from 'lucide-react';

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
const whatsappLicenseText = 'Hola, estoy interesado en un módulo prefabricado y tengo dudas sobre uso, permisos o licencia. Me gustaría recibir orientación antes de avanzar.';

const buildWhatsappUrl = (message: string) => `https://wa.me/${companyWhatsapp}?text=${encodeURIComponent(message)}`;

const answers = {
  greeting:
    'Hola, soy el asistente de Módulos Prefabricados San José. Te puedo orientar sobre precios, medidas, distribución, baño, habitaciones, transporte, terreno y acceso. Los importes son orientativos y siempre se revisan antes de fabricar.',
  price:
    'El módulo de referencia 6 x 2,40 m parte de 4.750 € sin IVA. Incluye 1 puerta, 1 ventana 80x80 e instalación eléctrica básica: 1 enchufe, 1 interruptor, 1 punto de luz y cuadro eléctrico. El IVA se calcula aparte en el presupuesto.',
  shortPrice:
    'El módulo 3 x 2,40 m parte de 2.850 € sin IVA. Ese precio ya tiene en cuenta que los módulos pequeños llevan más coste proporcional. Incluye 1 puerta, 1 ventana 80x80 e instalación eléctrica básica.',
  finalPrice:
    'El precio que muestra la calculadora no es definitivo: es una estimación orientativa sin IVA. El presupuesto final se revisa según medidas, distribución interior, extras, panel elegido, transporte, acceso, descarga y condiciones reales de colocación.',
  measures:
    'Trabajamos largos habituales de 3, 4, 5, 6, 7 y 8 m. Los anchos más usados son 2,40 m y 2,50 m. El modelo más solicitado es 6 x 2,40 m. Medidas especiales se revisan bajo consulta.',
  includes:
    'Todos los módulos incluyen 1 puerta, 1 ventana 80x80, instalación eléctrica básica, 1 enchufe, 1 interruptor, 1 punto de luz y cuadro eléctrico. El precio se muestra sin IVA y el IVA aparece separado.',
  vat:
    'Los precios principales se muestran sin IVA. En el presupuesto/proforma se desglosa base imponible, IVA 21% y total con IVA.',
  panel:
    'La opción estándar es panel sándwich blanco de 30 mm. Otros grosores o colores pueden consultarse según disponibilidad, precio y plazo.',
  extras:
    'Extras habituales: enchufes adicionales, puertas adicionales, ventanas 80x80 extra, ventanas grandes, aire acondicionado, baño completo, habitaciones interiores y divisiones. Los extras se suman sin IVA y después se calcula el IVA aparte.',
  room:
    'La habitación interior tiene un precio orientativo de 700 € sin IVA. Incluye su puerta, ventana, punto de luz y enchufe, sin cobrar esos elementos por separado. En el plano puedes ajustar la anchura de la habitación.',
  bathroom:
    'El baño completo tiene un precio orientativo de 1.500 € sin IVA. Incluye puerta, ventana pequeña 40x40, punto de luz, enchufe interior y enchufe exterior para termo eléctrico. La anchura depende del plato de ducha: 0,90 m es aceptable pero ajustado; 1,00 m es la medida habitual.',
  air:
    'El aire acondicionado tiene un precio orientativo de 600 € sin IVA.',
  sockets:
    'La instalación base incluye 1 enchufe. Cada enchufe adicional tiene un precio orientativo de 50 € sin IVA. Los enchufes incluidos dentro de habitación o baño no se cobran aparte.',
  windows:
    'El módulo base incluye una ventana 80x80. Una ventana 80x80 adicional tiene un precio orientativo de 200 € sin IVA. Una ventana grande adicional tiene un precio orientativo de 250 € sin IVA.',
  doors:
    'El módulo base incluye una puerta. Cada puerta adicional tiene un precio orientativo de 120 € sin IVA. Las puertas incluidas en habitación o baño no se cobran aparte.',
  budget:
    'Puedes usar la calculadora para configurar medidas, panel, extras y plano 2D. Al descargar, se genera un presupuesto/proforma orientativa con base imponible, IVA 21% y total. El presupuesto final se revisa según transporte, acceso, distribución y acabados.',
  timeline:
    'El plazo de entrega depende de la carga de trabajo, medidas, extras, disponibilidad de materiales, transporte y ubicación. Para darte una fecha real necesitamos revisar el modelo, la distribución y la zona de entrega.',
  reservation:
    'Podemos revisar tu caso y explicarte las condiciones disponibles para avanzar con el pedido. Lo mejor es que nos indiques medidas, provincia, uso previsto y si necesitas transporte para orientarte bien.',
  transport:
    'El transporte no está incluido en el precio del módulo. Trabajamos con transportistas externos y el coste depende de distancia, ubicación, acceso y tipo de descarga. En zonas cercanas puede partir desde unos 250 €, pero debe confirmarse según dirección exacta y condiciones del acceso.',
  access:
    'Antes de confirmar transporte hay que revisar el acceso: anchura del camino, curvas, pendientes, árboles, cables, muros, cancela y zona de descarga. Lo ideal es enviar fotos o vídeos de la entrada, camino interior y punto donde irá colocada la caseta.',
  truckFit:
    'Si no sabes si puede entrar el camión, podemos revisarlo con fotos o vídeos. Necesitamos ver la entrada, anchura de la cancela, camino de acceso, curvas, pendientes, cables, árboles, muros y la zona donde se colocaría el módulo.',
  unloading:
    'La descarga depende del transportista y del acceso. Hay que confirmar si el camión puede entrar, maniobrar y dejar el módulo cerca del punto de instalación. Si hay poco espacio, pendiente, cables, árboles o cancela estrecha, se revisa antes de confirmar.',
  installation:
    'No realizamos instalación de obra en la parcela. La caseta se entrega como módulo prefabricado y el terreno debe estar preparado antes de la entrega. La base debe estar firme y nivelada.',
  terrain:
    'Lo ideal es una solera/base de hormigón nivelada. Si el terreno es de tierra o grava, recomendamos vigas transversales a lo largo del módulo para que apoye correctamente. Una base mal nivelada puede afectar a puertas, estructura y estabilidad.',
  unevenTerrain:
    'Si el terreno no está nivelado, es importante prepararlo antes de la entrega. Una base desnivelada puede afectar al apoyo del módulo, apertura de puertas, estabilidad y acabado final. Recomendamos solera nivelada o puntos de apoyo bien alineados.',
  ready:
    'Antes de recibir la caseta conviene tener preparada una base firme y nivelada, revisar el acceso para el camión y dejar despejada la zona de descarga. También es recomendable enviar fotos o vídeo del acceso para evitar problemas el día de la entrega.',
  license:
    'La necesidad de licencia depende del municipio, tipo de terreno, uso previsto, dimensiones y si el módulo se considera instalación temporal o permanente. Recomendamos consultarlo con el ayuntamiento o con un técnico local antes de confirmar el pedido.',
  housing:
    'Nuestros productos son casetas y módulos prefabricados. El uso como vivienda, instalación permanente o uso residencial depende de la normativa municipal y del terreno. Antes de comprar, conviene consultarlo con el ayuntamiento.',
  combined:
    'El precio del módulo no incluye transporte ni instalación de obra. El transporte se valora con transportistas externos según distancia y acceso. El terreno debe estar preparado, preferiblemente con base de hormigón nivelada o vigas de apoyo si es tierra/grava. Para revisarlo bien, envíanos fotos o vídeo del acceso y zona de colocación.',
  contact:
    'Puedes escribirnos por WhatsApp o llamarnos al 600 227 252. También puedes usar la calculadora para generar un presupuesto orientativo y enviarnos la configuración.',
  fallback:
    'Esa consulta conviene revisarla personalmente. Puedes escribirnos por WhatsApp y te ayudamos con tu caso concreto.',
};

const primaryQuickQuestions = [
  '¿El precio es final?',
  'Precio 6 x 2,40',
  'Precio 3 x 2,40',
  'Qué incluye',
  'Baño completo',
  'Habitación interior',
  '¿Cabe el camión?',
  '¿Necesito licencia?',
];

const secondaryQuickQuestions = [
  'Preparar terreno',
  'Terreno desnivelado',
  '¿Sirve como vivienda?',
  'Plazo de entrega',
  'Reservar pedido',
  'IVA',
  'Enchufes',
  'Pedir presupuesto',
];

const normalize = (value: string) =>
  value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

const includesAny = (text: string, keywords: string[]) => keywords.some((keyword) => text.includes(keyword));

const getAnswer = (rawQuestion: string): { text: string; cta?: ChatCta } => {
  const q = normalize(rawQuestion);

  if (includesAny(q, ['precio final', 'es final', 'definitivo', 'precio definitivo', 'presupuesto final', 'es el precio real', 'precio real', 'el precio que sale'])) {
    return { text: answers.finalPrice, cta: 'calculator' };
  }

  if (includesAny(q, ['llevais y la instalais', 'llevais e instalais', 'incluye transporte y montaje', 'transporte y montaje', 'colocais vosotros', 'la colocais', 'que necesito para ponerla', 'ponerla en mi parcela'])) {
    return { text: answers.combined, cta: 'photos' };
  }

  if (includesAny(q, ['que necesito tener preparado', 'tener preparado', 'antes de recibir', 'antes de la entrega', 'preparado antes', 'recibir la caseta', 'entregar la caseta'])) {
    return { text: answers.ready, cta: 'photos' };
  }

  if (includesAny(q, ['cabe el camion', 'entra el camion', 'si entra el camion', 'camion cabe', 'camion entra', 'no se si entra', 'camion en mi parcela'])) {
    return { text: answers.truckFit, cta: 'photos' };
  }

  if (includesAny(q, ['licencia', 'permiso', 'permisos', 'ayuntamiento', 'legal', 'legalidad', 'normativa'])) {
    return { text: answers.license, cta: 'whatsapp' };
  }

  if (includesAny(q, ['vivienda', 'vivir', 'casa', 'residencial', 'habitable', 'vivir en una caseta', 'vivir en un modulo'])) {
    return { text: answers.housing, cta: 'whatsapp' };
  }

  if (includesAny(q, ['plazo', 'tarda', 'tardais', 'entrega', 'cuando estaria', 'cuanto tarda', 'fecha de entrega', 'tiempo de entrega'])) {
    return { text: answers.timeline, cta: 'whatsapp' };
  }

  if (includesAny(q, ['reservar', 'reserva', 'financiar', 'financiacion', 'pago', 'señal', 'senal', 'condiciones'])) {
    return { text: answers.reservation, cta: 'whatsapp' };
  }

  if (includesAny(q, ['3x2', '3 x 2', '3x2,40', '3 x 2,40', '3x2.40', 'modulo de 3', '3 metros', '2850'])) {
    return { text: answers.shortPrice, cta: 'calculator' };
  }

  if (includesAny(q, ['precio', 'cuesta', 'vale', 'coste', '6x2', '6 x 2', '6x2,40', '6 x 2,40', '6x2.40', '4750'])) {
    return { text: answers.price, cta: 'calculator' };
  }

  if (includesAny(q, ['habitacion', 'habitaciones', 'dormitorio', 'cuarto interior', '700'])) {
    return { text: answers.room, cta: 'calculator' };
  }

  if (includesAny(q, ['baño', 'bano', 'aseo', 'ducha', 'plato de ducha', 'termo', '40x40'])) {
    return { text: answers.bathroom, cta: 'calculator' };
  }

  if (includesAny(q, ['iva', 'impuesto', 'con iva', 'sin iva', '21'])) return { text: answers.vat, cta: 'calculator' };

  if (includesAny(q, ['acceso', 'accesibilidad', 'parcela', 'camion', 'entrada', 'camino', 'maniobrar', 'cancela', 'pendiente', 'arbol', 'arboles', 'cable', 'cables', 'muro', 'muros'])) {
    return { text: answers.access, cta: 'photos' };
  }

  if (includesAny(q, ['transporte', 'envio', 'llevar', 'distancia', 'transportista', 'portes', 'porte', 'desplazamiento', 'coste transporte'])) {
    return { text: answers.transport, cta: 'photos' };
  }

  if (includesAny(q, ['descarga', 'descargar', 'grua', 'camion grua', 'descargar caseta', 'dejar la caseta', 'colocar la caseta'])) {
    return { text: answers.unloading, cta: 'photos' };
  }

  if (includesAny(q, ['instalacion', 'instalar', 'montaje', 'montar', 'colocar', 'colocacion', 'obra', 'preparar terreno'])) {
    return { text: answers.installation, cta: 'photos' };
  }

  if (includesAny(q, ['desnivelado', 'sin nivelar', 'no esta nivelado', 'no está nivelado', 'terreno inclinado', 'inclinacion', 'inclinación'])) {
    return { text: answers.unevenTerrain, cta: 'photos' };
  }

  if (includesAny(q, ['terreno', 'base', 'hormigon', 'nivelado', 'nivelar', 'suelo', 'tierra', 'grava', 'vigas', 'apoyo', 'cimentacion', 'solera'])) {
    return { text: answers.terrain, cta: 'photos' };
  }

  if (includesAny(q, ['medidas', 'largo', 'ancho', 'tamano', 'tamaño', 'metros'])) return { text: answers.measures, cta: 'calculator' };
  if (includesAny(q, ['incluye', 'incluido', 'lleva de serie', 'base'])) return { text: answers.includes, cta: 'calculator' };
  if (includesAny(q, ['panel', 'sandwich', 'sándwich', 'grosor', 'color', '30 mm', '30mm'])) return { text: answers.panel, cta: 'calculator' };
  if (includesAny(q, ['extra', 'extras', 'opciones', 'adicional'])) return { text: answers.extras, cta: 'calculator' };
  if (includesAny(q, ['aire', 'acondicionado', 'climatizacion', 'climatización'])) return { text: answers.air, cta: 'calculator' };
  if (includesAny(q, ['enchufe', 'electricidad', 'luz', 'cuadro', 'punto de luz', 'instalacion electrica', 'instalación eléctrica'])) return { text: answers.sockets, cta: 'calculator' };
  if (includesAny(q, ['ventana', 'ventanas'])) return { text: answers.windows, cta: 'calculator' };
  if (includesAny(q, ['puerta', 'puertas'])) return { text: answers.doors, cta: 'calculator' };
  if (includesAny(q, ['presupuesto', 'proforma', 'calculadora', 'calcular', 'configurar', 'pdf'])) return { text: answers.budget, cta: 'calculator' };
  if (includesAny(q, ['whatsapp', 'contacto', 'telefono', 'teléfono', 'fotos', 'foto', 'video', 'videos', 'vídeo', 'vídeos'])) return { text: answers.contact, cta: 'photos' };

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
    <a href={buildWhatsappUrl(whatsappLicenseText)} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 rounded-xl bg-brand-green px-3 py-2 text-sm font-bold text-white transition hover:bg-green-700">
      <MessageCircle size={16} /> Hablar por WhatsApp
    </a>
  );
};

const QuestionChips = ({ questions, onAsk }: { questions: string[]; onAsk: (question: string) => void }) => (
  <div className="flex flex-wrap gap-2">
    {questions.map((question) => (
      <button key={question} onClick={() => onAsk(question)} className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:border-brand-orange hover:text-brand-orange">
        {question}
      </button>
    ))}
  </div>
);

export const FaqChatbot = ({ onStartConfigurator }: { onStartConfigurator: () => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'welcome', role: 'assistant', text: answers.greeting },
  ]);
  const listRef = useRef<HTMLDivElement | null>(null);
  const hasMessages = useMemo(() => messages.length > 1, [messages.length]);

  useEffect(() => {
    if (!isOpen) return;
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isOpen]);

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
  };

  const resetChat = () => {
    setMessages([{ id: 'welcome', role: 'assistant', text: answers.greeting }]);
    setInput('');
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
    <div className="fixed bottom-4 right-4 z-50 w-[calc(100vw-2rem)] max-w-md overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-2xl sm:bottom-5 sm:right-5">
      <div className="flex items-center justify-between bg-brand-blue px-5 py-4 text-white">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15"><Bot size={22} /></span>
          <div>
            <p className="font-black leading-tight">Asistente comercial</p>
            <p className="text-xs text-blue-100">Precios, permisos, transporte y acceso</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={resetChat} className="rounded-xl p-2 text-blue-100 transition hover:bg-white/10 hover:text-white" aria-label="Reiniciar chat">
            <RefreshCcw size={18} />
          </button>
          <button onClick={() => setIsOpen(false)} className="rounded-xl p-2 text-blue-100 transition hover:bg-white/10 hover:text-white" aria-label="Cerrar chat">
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="border-b border-slate-200 bg-blue-50 px-5 py-3 text-xs leading-relaxed text-blue-950">
        <strong>Respuesta rápida:</strong> precios orientativos sin IVA. El presupuesto final se revisa según medidas, acceso, transporte y acabados.
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

        {!hasMessages ? <QuestionChips questions={primaryQuickQuestions} onAsk={addQuestion} /> : null}
      </div>

      <div className="border-t border-slate-200 bg-white p-4">
        <div className="mb-3">
          <QuestionChips questions={hasMessages ? secondaryQuickQuestions : ['Transporte', 'Presupuesto', 'Enviar fotos']} onAsk={addQuestion} />
        </div>
        <form onSubmit={submit} className="flex gap-2">
          <input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Escribe tu pregunta..." className="min-w-0 flex-1 rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-brand-blue focus:ring-2 focus:ring-blue-100" />
          <button type="submit" className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-orange text-white transition hover:bg-orange-600 disabled:opacity-50" disabled={!input.trim()} aria-label="Enviar pregunta">
            <Send size={18} />
          </button>
        </form>
        <div className="mt-3 flex items-center justify-between gap-3 text-xs text-slate-500">
          <span>Atención directa: 600 227 252</span>
          <a href={buildWhatsappUrl(whatsappGeneralText)} target="_blank" rel="noreferrer" className="font-bold text-green-700 hover:underline">WhatsApp</a>
        </div>
      </div>
    </div>
  );
};
