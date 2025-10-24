import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://demo.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'demo_key_123456789';

// Crear cliente con valores por defecto si no están definidos
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

