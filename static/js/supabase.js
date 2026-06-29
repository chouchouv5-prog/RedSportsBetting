// === CONFIG SUPABASE ===
const SUPABASE_URL = 'https://nwocbnueaxibeexfcekd.supabase.co';   // ← Change avec ton URL
const SUPABASE_ANON_KEY = 'sb_publishable_qBHHQupOtMCmMxEo0x3b6w_0l_P2ax_';     // ← Colle ta clé ici

// Initialisation
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);