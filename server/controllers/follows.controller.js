import { getAllFromTable, insertIntoTable } from '../services/supabase.service.js';

export async function getFollows(req, res) {
  try {
    const follows = await getAllFromTable('follows');
    res.json(follows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function followUser(req, res) {
  try {
    const follow = await insertIntoTable('follows', req.body);
    res.json(follow);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
