import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://demo.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'demo_key_123456789';

// Usar valores por defecto si no están definidos las variables de entorno
console.log("🔧 Usando configuración de Supabase:", { url: supabaseUrl, key: supabaseKey.substring(0, 10) + "..." });

export const supabase = createClient(supabaseUrl, supabaseKey);
