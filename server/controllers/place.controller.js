import { getAllFromTable } from '../services/supabase.service.js';

export async function getPlaces(req, res) {
  try {
    const places = await getAllFromTable('places');
    res.json(places);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
