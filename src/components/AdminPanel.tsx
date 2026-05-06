import { useEffect, useMemo, useState } from 'react';
import type React from 'react';
import { ArrowLeft, FileText, LogOut, MessageCircle, Phone, Plus, Search, Trash2 } from 'lucide-react';
import { LeadRow, LeadStatus } from '../types';
import { addLeadNote, deleteLead, getLeads, getNewsletterSubscribers, updateLeadStatus } from '../services/leads';
import { createQuoteForLead } from '../services/quotes';
import { getCurrentUser, signIn, signOut } from '../services/auth';
import { formatCurrency } from '../utils/pricing';
import { downloadQuotePdf } from '../utils/pdf';
import { Badge, Button, Card, Field, Input, Select, Textarea } from './Ui';
import { LayoutPreview } from './LayoutPreview';

const statuses: LeadStatus[] = ['Nuevo', 'Contactado', 'Presupuesto enviado', 'Negociando', 'Vendido', 'Perdido'];

const statusColor = (status: LeadStatus) => {
  if (status === 'Nuevo') return 'orange';
  if (status === 'Contactado') return 'blue';
  if (status === 'Presupuesto enviado') return 'purple';
  if (status === 'Negociando') return 'slate';
  if (status === 'Vendido') return 'green';
  return 'red';
};

export const AdminPanel = ({ onBack }: { onBack: () => void }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  useEffect(() => {
    getCurrentUser()
      .then((user) => setIsLoggedIn(Boolean(user)))
      .finally(() => setCheckingAuth(false));
  }, []);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoginError('');
    try {
      await signIn(email, password);
      setIsLoggedIn(true);
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : 'No se pudo iniciar sesión.');
    }
  };

  const handleLogout = async () => {
    await signOut();
    setIsLoggedIn(false);
  };

  if (checkingAuth) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-600">Comprobando sesión...</div>;
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-10">
        <div className="mx-auto max-w-md">
          <Button variant="ghost" onClick={onBack} className="mb-6 flex items-center gap-2"><ArrowLeft size={18} /> Volver</Button>
          <Card>
            <h1 className="text-2xl font-black text-slate-900">Panel privado</h1>
            <p className="mt-2 text-sm text-slate-600">Accede para gestionar solicitudes de presupuesto.</p>
            <form onSubmit={handleLogin} className="mt-6 space-y-4">
              <Field label="Email"><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></Field>
              <Field label="Contraseña"><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></Field>
              {loginError && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{loginError}</p>}
              <Button type="submit" className="w-full">Entrar</Button>
            </form>
            <p className="mt-4 text-xs text-slate-500">Crea el usuario administrador desde Supabase Auth antes de entrar.</p>
          </Card>
        </div>
      </div>
    );
  }

  return <AdminDashboard onBack={onBack} onLogout={handleLogout} />;
};

const AdminDashboard = ({ onBack, onLogout }: { onBack: () => void; onLogout: () => void }) => {
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedLead, setSelectedLead] = useState<LeadRow | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [provinceFilter, setProvinceFilter] = useState('');
  const [noteDraft, setNoteDraft] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [quoteGeneratingId, setQuoteGeneratingId] = useState<string | null>(null);

  const loadLeads = async () => {
    setLoading(true);
    setError('');
    try {
      const rows = await getLeads();
      setLeads(rows);
      if (selectedLead) {
        setSelectedLead(rows.find((lead) => lead.id === selectedLead.id) || null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar las solicitudes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeads();
  }, []);

  const metrics = useMemo(() => {
    const thisMonth = new Date().toISOString().slice(0, 7);
    return {
      total: leads.length,
      newLeads: leads.filter((lead) => lead.status === 'Nuevo').length,
      contacted: leads.filter((lead) => lead.status === 'Contactado').length,
      quoted: leads.filter((lead) => lead.status === 'Presupuesto enviado').length,
      sold: leads.filter((lead) => lead.status === 'Vendido').length,
      potential: leads.reduce((sum, lead) => sum + Number((lead.estimated_price_without_vat ?? lead.estimated_min_price ?? 0)), 0),
      month: leads.filter((lead) => lead.created_at?.slice(0, 7) === thisMonth).length,
    };
  }, [leads]);

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const config = lead.configurations?.[0];
      const text = `${lead.full_name} ${lead.phone} ${lead.province} ${lead.city} ${config?.use_type || ''}`.toLowerCase();
      const matchesSearch = text.includes(search.toLowerCase());
      const matchesStatus = !statusFilter || lead.status === statusFilter;
      const matchesProvince = !provinceFilter || lead.province.toLowerCase().includes(provinceFilter.toLowerCase());
      return matchesSearch && matchesStatus && matchesProvince;
    });
  }, [leads, search, statusFilter, provinceFilter]);

  const changeStatus = async (lead: LeadRow, status: LeadStatus) => {
    await updateLeadStatus(lead.id, status);
    await loadLeads();
  };

  const removeLead = async (lead: LeadRow) => {
    const ok = window.confirm(`¿Eliminar la solicitud de ${lead.full_name}?`);
    if (!ok) return;
    await deleteLead(lead.id);
    if (selectedLead?.id === lead.id) setSelectedLead(null);
    await loadLeads();
  };

  const saveNote = async () => {
    if (!selectedLead || !noteDraft.trim()) return;
    await addLeadNote(selectedLead.id, noteDraft.trim());
    setNoteDraft('');
    setActionMessage('Nota interna guardada correctamente.');
    await loadLeads();
  };

  const generateQuote = async (lead: LeadRow) => {
    setQuoteGeneratingId(lead.id);
    setActionMessage('');
    setError('');
    try {
      const quote = await createQuoteForLead(lead);
      downloadQuotePdf(lead, quote);
      await updateLeadStatus(lead.id, 'Presupuesto enviado');
      setActionMessage(`Presupuesto ${quote.quote_number} generado y descargado correctamente.`);
      await loadLeads();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo generar el presupuesto PDF.');
    } finally {
      setQuoteGeneratingId(null);
    }
  };

  const exportNewsletterCsv = async () => {
    setActionMessage('');
    setError('');
    try {
      const subscribers = await getNewsletterSubscribers();
      const headers = ['Nombre', 'Email', 'Telefono', 'Provincia', 'Localidad', 'Fecha suscripcion', 'Origen', 'Activo'];
      const rows = subscribers.map((subscriber) => [
        subscriber.full_name,
        subscriber.email,
        subscriber.phone || '',
        subscriber.province || '',
        subscriber.city || '',
        new Date(subscriber.subscribed_at).toLocaleString('es-ES'),
        subscriber.source,
        subscriber.active ? 'Si' : 'No',
      ]);
      const csv = [headers, ...rows]
        .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','))
        .join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `suscriptores-newsletter-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setActionMessage('Suscriptores exportados correctamente.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron exportar los suscriptores.');
    }
  };

  const buildAdminWhatsApp = (lead: LeadRow) => {
    const config = lead.configurations?.[0];
    const dimensions = config ? `${config.length} x ${config.width} m` : 'caseta prefabricada';
    const panel = config ? `${config.panel_type || 'Panel sándwich'}, ${config.panel_thickness}, ${config.panel_color || 'Blanco'}` : 'panel estándar';
    const msg = `Hola ${lead.full_name}, soy Diego de Módulos Prefabricados San José. He recibido tu solicitud para una caseta ${dimensions}. Panel: ${panel}. Te contacto para prepararte un presupuesto personalizado.`;
    const digits = lead.phone.replace(/\D/g, '');
    const phone = digits.startsWith('34') ? digits : `34${digits}`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-xl font-black text-slate-900">Panel privado</h1>
            <p className="text-sm text-slate-500">Módulos Prefabricados San José S.L.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadLeads}>Actualizar</Button>
            <Button variant="outline" onClick={exportNewsletterCsv}>Exportar newsletter CSV</Button>
            <Button variant="ghost" onClick={onBack}>Web pública</Button>
            <Button variant="danger" onClick={onLogout} className="flex items-center gap-2"><LogOut size={16} /> Salir</Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        {error && <p className="mb-6 rounded-xl bg-red-50 p-4 text-red-700">{error}</p>}
        {actionMessage && <p className="mb-6 rounded-xl bg-green-50 p-4 text-green-700">{actionMessage}</p>}

        <section className="grid gap-4 md:grid-cols-4 lg:grid-cols-7">
          <Metric label="Solicitudes totales" value={metrics.total} />
          <Metric label="Nuevas" value={metrics.newLeads} />
          <Metric label="Contactados" value={metrics.contacted} />
          <Metric label="Presupuestos" value={metrics.quoted} />
          <Metric label="Ventas" value={metrics.sold} />
          <Metric label="Potencial sin IVA" value={formatCurrency(metrics.potential)} />
          <Metric label="Este mes" value={metrics.month} />
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_430px]">
          <Card>
            <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl font-black text-slate-900">Solicitudes</h2>
                <p className="text-sm text-slate-500">Gestiona los clientes interesados.</p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                  <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar" className="pl-9" />
                </div>
                <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="">Todos los estados</option>
                  {statuses.map((s) => <option key={s}>{s}</option>)}
                </Select>
                <Input value={provinceFilter} onChange={(e) => setProvinceFilter(e.target.value)} placeholder="Provincia" />
              </div>
            </div>

            {loading ? (
              <p className="py-10 text-center text-slate-500">Cargando solicitudes...</p>
            ) : filteredLeads.length === 0 ? (
              <p className="rounded-xl bg-slate-50 p-8 text-center text-slate-500">No hay solicitudes con esos filtros.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1180px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                      <th className="py-3">Fecha</th>
                      <th>Nombre</th>
                      <th>Teléfono</th>
                      <th>Email</th>
                      <th>Descarga</th>
                      <th>Newsletter</th>
                      <th>Provincia</th>
                      <th>Medida</th>
                      <th>m²</th>
                      <th>Uso</th>
                      <th>Panel</th>
                      <th>Sin IVA</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLeads.map((lead) => {
                      const config = lead.configurations?.[0];
                      return (
                        <tr key={lead.id} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="py-3">{new Date(lead.created_at).toLocaleDateString('es-ES')}</td>
                          <td className="font-semibold text-slate-900">{lead.full_name}</td>
                          <td>{lead.phone}</td>
                          <td>{lead.email || '-'}</td>
                          <td>{lead.download_requested ? 'Sí' : 'No'}</td>
                          <td>{lead.newsletter_subscribed ? 'Sí' : 'No'}</td>
                          <td>{lead.province}</td>
                          <td>{config ? `${config.length} x ${config.width} m` : '-'}</td>
                          <td>{config?.square_meters || '-'}</td>
                          <td>{config?.use_type || lead.intended_use || '-'}</td>
                          <td>{config ? `${config.panel_thickness}${config.is_special_panel ? ' · consulta' : ''}` : '-'}</td>
                          <td>{formatCurrency(lead.estimated_price_without_vat ?? lead.estimated_min_price ?? 0)}</td>
                          <td><Badge color={statusColor(lead.status)}>{lead.status}</Badge></td>
                          <td>
                            <div className="flex gap-1">
                              <Button variant="ghost" onClick={() => setSelectedLead(lead)}>Ver</Button>
                              <button title="Copiar teléfono" onClick={() => navigator.clipboard.writeText(lead.phone)} className="rounded-lg p-2 hover:bg-slate-200"><Phone size={16} /></button>
                              <a href={buildAdminWhatsApp(lead)} target="_blank" rel="noreferrer" className="rounded-lg p-2 hover:bg-slate-200"><MessageCircle size={16} /></a>
                              <button title="Generar presupuesto PDF" onClick={() => generateQuote(lead)} disabled={quoteGeneratingId === lead.id} className="rounded-lg p-2 text-brand-blue hover:bg-blue-50 disabled:opacity-40"><FileText size={16} /></button>
                              <button title="Eliminar" onClick={() => removeLead(lead)} className="rounded-lg p-2 text-red-600 hover:bg-red-50"><Trash2 size={16} /></button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <Card className="h-fit">
            {!selectedLead ? (
              <div className="py-10 text-center text-slate-500">Selecciona una solicitud para ver el detalle.</div>
            ) : (
              <div>
                <div className="mb-5 flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-black text-slate-900">{selectedLead.full_name}</h2>
                    <p className="text-sm text-slate-500">{selectedLead.phone} · {selectedLead.city}, {selectedLead.province}</p>
                  </div>
                  <Badge color={statusColor(selectedLead.status)}>{selectedLead.status}</Badge>
                </div>

                <Field label="Estado comercial">
                  <Select value={selectedLead.status} onChange={(e) => changeStatus(selectedLead, e.target.value as LeadStatus)}>
                    {statuses.map((s) => <option key={s}>{s}</option>)}
                  </Select>
                </Field>

                <div className="mt-5 rounded-2xl bg-blue-50 p-4 text-sm text-blue-900">
                  <h3 className="mb-2 font-bold">Captación y descarga</h3>
                  <p><strong>Email:</strong> {selectedLead.email || '-'}</p>
                  <p><strong>Solicitó descarga:</strong> {selectedLead.download_requested ? 'Sí' : 'No'}</p>
                  <p><strong>Newsletter:</strong> {selectedLead.newsletter_subscribed ? 'Sí' : 'No'}</p>
                  <p><strong>Privacidad aceptada:</strong> {selectedLead.privacy_accepted ? 'Sí' : 'No'}</p>
                  <p><strong>Fecha de descarga:</strong> {selectedLead.downloaded_at ? new Date(selectedLead.downloaded_at).toLocaleString('es-ES') : '-'}</p>
                  <p><strong>Origen:</strong> {selectedLead.lead_source || '-'}</p>
                </div>

                <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                  <h3 className="mb-3 font-bold text-slate-900">Configuración</h3>
                  {selectedLead.configurations?.[0] ? <LeadConfiguration lead={selectedLead} /> : <p>No hay configuración asociada.</p>}
                </div>

                {selectedLead.configurations?.[0]?.layout_json?.length ? (
                  <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                    <h3 className="mb-3 font-bold text-slate-900">Plano 2D creado por el cliente</h3>
                    <LayoutPreview
                      length={selectedLead.configurations[0].length}
                      width={selectedLead.configurations[0].width}
                      items={selectedLead.configurations[0].layout_json || []}
                    />
                  </div>
                ) : null}

                <div className="mt-5 rounded-2xl bg-orange-50 p-4">
                  <p className="text-sm font-semibold text-orange-700">Precio estimado sin IVA</p>
                  <p className="text-2xl font-black text-brand-orange">{formatCurrency(selectedLead.estimated_price_without_vat ?? selectedLead.estimated_min_price ?? 0)}</p>
                  <p className="text-sm text-orange-700">IVA no incluido</p><p className="mt-2 text-sm font-semibold text-orange-800">IVA 21%: {formatCurrency(selectedLead.estimated_vat_amount ?? 0)}</p><p className="text-sm font-bold text-orange-900">Total con IVA: {formatCurrency(selectedLead.estimated_price_with_vat ?? 0)}</p>
                </div>

                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  <Button onClick={() => generateQuote(selectedLead)} disabled={quoteGeneratingId === selectedLead.id} className="flex items-center justify-center gap-2">
                    <FileText size={16} /> {quoteGeneratingId === selectedLead.id ? 'Generando...' : 'Generar PDF'}
                  </Button>
                  <a href={buildAdminWhatsApp(selectedLead)} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 font-semibold text-slate-800 transition hover:bg-slate-50">
                    <MessageCircle size={16} /> Abrir WhatsApp
                  </a>
                </div>

                {selectedLead.comments && (
                  <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm">
                    <h3 className="mb-2 font-bold">Comentarios</h3>
                    <p>{selectedLead.comments}</p>
                  </div>
                )}

                <div className="mt-5">
                  <h3 className="mb-3 font-bold text-slate-900">Notas internas</h3>
                  <div className="space-y-2">
                    {selectedLead.notes?.length ? selectedLead.notes.map((note) => (
                      <div key={note.id} className="rounded-xl bg-slate-50 p-3 text-sm">
                        <p>{note.note}</p>
                        <p className="mt-1 text-xs text-slate-400">{new Date(note.created_at).toLocaleString('es-ES')}</p>
                      </div>
                    )) : <p className="text-sm text-slate-500">Sin notas todavía.</p>}
                  </div>
                  <div className="mt-3 space-y-2">
                    <Textarea rows={3} value={noteDraft} onChange={(e) => setNoteDraft(e.target.value)} placeholder="Añadir nota interna..." />
                    <Button onClick={saveNote} className="flex items-center gap-2"><Plus size={16} /> Añadir nota</Button>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </section>
      </main>
    </div>
  );
};

const Metric = ({ label, value }: { label: string; value: string | number }) => (
  <Card className="p-4">
    <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
    <p className="mt-2 text-2xl font-black text-slate-900">{value}</p>
  </Card>
);

const LeadConfiguration = ({ lead }: { lead: LeadRow }) => {
  const config = lead.configurations![0];
  return (
    <div className="space-y-1">
      <p><strong>Medidas:</strong> {config.length} x {config.width} m ({config.square_meters} m²)</p>
      <p><strong>Tipo de medida:</strong> {config.is_special_measure ? 'Bajo consulta' : 'Estándar'}</p>
      <p><strong>Panel:</strong> {config.panel_type || 'Panel sándwich'} · {config.panel_thickness} · {config.panel_color || 'Blanco'} · {config.is_special_panel ? 'Bajo consulta' : 'Estándar'}</p>
      <p><strong>Uso:</strong> {config.use_type}</p>
      <p><strong>Extras:</strong> {config.extras?.length ? config.extras.join(', ') : 'Sin extras'}</p>
      <p><strong>Plazo:</strong> {config.delivery_timeline}</p>
    </div>
  );
};
