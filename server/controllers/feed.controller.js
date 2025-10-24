import { getAllFromTable } from '../services/supabase.service.js';

export async function getFeed(req, res) {
  try {
    const feed = await getAllFromTable('reviews');
    res.json(feed.reverse()); // feed invertido (últimos primero)
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
