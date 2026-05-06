import { Building2, Mail, MapPin, MessageCircle, Phone } from 'lucide-react';

const whatsappUrl = 'https://wa.me/34600227252?text=Hola%2C%20quiero%20informaci%C3%B3n%20sobre%20una%20caseta%20prefabricada.';

export const CompanyFooter = () => (
  <footer id="footer-contacto" className="border-t border-slate-800 bg-slate-950 text-white">
    <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 md:grid-cols-[1.2fr_1fr_1fr]">
      <div>
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-brand-orange p-3 text-white shadow-lg shadow-orange-950/30">
            <Building2 size={24} />
          </div>
          <div>
            <p className="text-lg font-black">Módulos Prefabricados San José S.L.</p>
            <p className="text-sm text-slate-400">Fabricación y venta de casetas prefabricadas</p>
          </div>
        </div>
        <p className="mt-5 max-w-md text-sm leading-6 text-slate-300">
          Casetas y módulos prefabricados con panel sándwich. Configura tu módulo, genera un plano orientativo y solicita presupuesto personalizado.
        </p>
        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">CIF B25987025</p>
      </div>

      <div>
        <h3 className="text-sm font-black uppercase tracking-[0.18em] text-slate-400">Contacto</h3>
        <div className="mt-4 space-y-3 text-sm text-slate-300">
          <a href="tel:+34600227252" className="flex items-center gap-3 transition hover:text-white">
            <Phone size={18} className="text-brand-orange" />
            <span>600 227 252</span>
          </a>
          <a href={whatsappUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3 transition hover:text-white">
            <MessageCircle size={18} className="text-brand-green" />
            <span>WhatsApp 600 227 252</span>
          </a>
          <a href="mailto:contacto@modulosprefabricadossanjose.com" className="flex items-center gap-3 break-all transition hover:text-white">
            <Mail size={18} className="text-brand-blue" />
            <span>contacto@modulosprefabricadossanjose.com</span>
          </a>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-black uppercase tracking-[0.18em] text-slate-400">Dirección</h3>
        <div className="mt-4 flex items-start gap-3 text-sm leading-6 text-slate-300">
          <MapPin size={18} className="mt-1 shrink-0 text-brand-orange" />
          <p>
            Plaza de los Inventores 7, 1D<br />
            San José de la Rinconada<br />
            41300, Sevilla
          </p>
        </div>
      </div>
    </div>

    <div className="border-t border-slate-800">
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} Módulos Prefabricados San José S.L. Todos los derechos reservados.</p>
        <p>Presupuestos orientativos sujetos a revisión técnica.</p>
      </div>
    </div>
  </footer>
);
