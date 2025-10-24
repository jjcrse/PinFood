import { getAllFromTable, insertIntoTable } from '../services/supabase.service.js';

export async function getFavorites(req, res) {
  try {
    const favorites = await getAllFromTable('favorites');
    res.json(favorites);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function addFavorite(req, res) {
  try {
    const favorite = await insertIntoTable('favorites', req.body);
    res.json(favorite);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
