import { supabase } from '../db/supabase.db.js';

export async function uploadPhoto(file, bucket = 'uploads') {
  const fileName = `${Date.now()}-${file.originalname}`;
  const { data, error } = await supabase.storage.from(bucket).upload(fileName, file.buffer);

  if (error) throw new Error(error.message);

  const { data: publicUrl } = supabase.storage.from(bucket).getPublicUrl(fileName);
  return publicUrl.publicUrl;
}
