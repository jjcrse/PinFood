import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

// Cargar las variables de entorno desde .env
dotenv.config({ path: "./.env" });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ Error: variables de entorno no cargadas correctamente");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
