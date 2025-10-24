import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Faltan variables SUPABASE_URL o SUPABASE_ANON_KEY en .env");
  process.exit(1);
}

export const supabase = createClient(supabaseUrl, supabaseKey);
