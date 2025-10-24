import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default supabase;


//const { createClient } = require("@supabase/supabase-js");
// Create a single supabase client for interacting with your database
//const supabase = createClient(
  //process.env.SUPABASE_URL,
  //process.env.SUPABASE_API_KEY
//);

//module.exports = supabase;
