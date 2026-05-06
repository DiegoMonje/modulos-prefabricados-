import { LeadRow, LeadStatus, NewLeadPayload, NewsletterSubscriberRow, NoteRow } from '../types';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

const assertSupabase = () => {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase no está configurado. Crea un archivo .env con VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.');
  }
  return supabase;
};

export const createLead = async ({ contact, config, price }: NewLeadPayload): Promise<string> => {
  const client = assertSupabase();
  const leadId = crypto.randomUUID();
  const downloadedAt = new Date().toISOString();

  const { error: leadError } = await client
    .from('leads')
    .insert({
      id: leadId,
      full_name: contact.fullName,
      phone: contact.phone,
      email: contact.email || null,
      province: config.province,
      city: config.city,
      postal_code: config.postalCode || null,
      intended_use: contact.intendedUse || config.useType,
      comments: contact.comments || null,
      status: 'Nuevo',
      estimated_min_price: price.estimatedPriceWithoutVat,
      estimated_max_price: price.estimatedPriceWithoutVat,
      estimated_price_without_vat: price.estimatedPriceWithoutVat,
      estimated_vat_amount: price.vatAmount,
      estimated_price_with_vat: price.estimatedPriceWithVat,
      newsletter_subscribed: contact.newsletterSubscribed,
      privacy_accepted: contact.accepted,
      download_requested: true,
      downloaded_at: downloadedAt,
      lead_source: 'configurador_plano_2d',
    });

  if (leadError) throw leadError;

  const summary = price.summary;
  const { error: configError } = await client.from('configurations').insert({
    lead_id: leadId,
    length: config.length,
    width: config.width,
    square_meters: price.squareMeters,
    is_special_measure: config.isSpecialMeasure,
    panel_type: config.panelType,
    panel_thickness: config.panelThickness,
    panel_color: config.panelColor,
    is_special_panel: config.isSpecialPanel,
    use_type: config.useType,
    door_type: 'Puerta incluida + adicionales',
    door_quantity: summary.additionalDoors,
    window_quantity: summary.windows80x80 + summary.largeWindows,
    extras: summary.extrasList,
    transport_required: false,
    assembly_required: false,
    delivery_timeline: config.deliveryTimeline,
    base_included_door: summary.includedDoor,
    base_included_window_80x80: summary.includedWindow80x80,
    base_included_electrical_installation: true,
    base_included_socket_quantity: summary.includedSocketQuantity,
    base_included_light_point_quantity: summary.includedLightPointQuantity,
    has_air_conditioning: summary.hasAirConditioning,
    has_electrical_installation: true,
    has_full_bathroom: summary.hasFullBathroom,
    interior_rooms_quantity: summary.interiorRooms,
    extra_windows_80x80_quantity: summary.windows80x80,
    extra_large_windows_quantity: summary.largeWindows,
    additional_doors_quantity: summary.additionalDoors,
    additional_socket_quantity: summary.additionalSockets,
    layout_json: config.layoutItems,
  });

  if (configError) throw configError;

  if (contact.newsletterSubscribed) {
    const { error: subscriberError } = await client.from('newsletter_subscribers').insert({
      full_name: contact.fullName,
      email: contact.email,
      phone: contact.phone,
      province: config.province,
      city: config.city,
      source: 'configurador_plano_2d',
      active: true,
    });

    if (subscriberError) throw subscriberError;
  }

  return leadId;
};

export const getLeads = async (): Promise<LeadRow[]> => {
  const client = assertSupabase();
  const { data, error } = await client
    .from('leads')
    .select('*, configurations(*), notes(*), quotes(*)')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as LeadRow[];
};

export const getNewsletterSubscribers = async (): Promise<NewsletterSubscriberRow[]> => {
  const client = assertSupabase();
  const { data, error } = await client
    .from('newsletter_subscribers')
    .select('*')
    .order('subscribed_at', { ascending: false });

  if (error) throw error;
  return (data || []) as NewsletterSubscriberRow[];
};

export const updateLeadStatus = async (leadId: string, status: LeadStatus): Promise<void> => {
  const client = assertSupabase();
  const { error } = await client
    .from('leads')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', leadId);

  if (error) throw error;
};

export const addLeadNote = async (leadId: string, note: string): Promise<NoteRow> => {
  const client = assertSupabase();
  const { data, error } = await client
    .from('notes')
    .insert({ lead_id: leadId, note })
    .select('*')
    .single();

  if (error) throw error;
  return data as NoteRow;
};

export const deleteLead = async (leadId: string): Promise<void> => {
  const client = assertSupabase();
  const { error } = await client.from('leads').delete().eq('id', leadId);
  if (error) throw error;
};
