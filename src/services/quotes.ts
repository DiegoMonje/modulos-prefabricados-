import { LeadRow, QuoteRow } from '../types';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

const assertSupabase = () => {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase no está configurado. Crea un archivo .env con VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.');
  }
  return supabase;
};

const createQuoteNumber = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const suffix = String(Date.now()).slice(-6);
  return `P-${year}${month}-${suffix}`;
};

export const createQuoteForLead = async (lead: LeadRow): Promise<QuoteRow> => {
  const client = assertSupabase();
  const basePrice = Number(lead.estimated_price_without_vat ?? lead.estimated_min_price ?? 0);
  const ivaPercentage = 21;
  const ivaAmount = Math.round(basePrice * (ivaPercentage / 100) * 100) / 100;
  const totalPrice = Math.round((basePrice + ivaAmount) * 100) / 100;

  const payload = {
    lead_id: lead.id,
    quote_number: createQuoteNumber(),
    quote_date: new Date().toISOString().slice(0, 10),
    base_price: basePrice,
    iva_percentage: ivaPercentage,
    iva_amount: ivaAmount,
    total_price: totalPrice,
    pdf_url: null,
  };

  const { data, error } = await client
    .from('quotes')
    .insert(payload)
    .select('*')
    .single();

  if (error) throw error;
  return data as QuoteRow;
};
