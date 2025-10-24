import { getAllFromTable, insertIntoTable } from '../services/supabase.service.js';

export async function getReviews(req, res) {
  try {
    const reviews = await getAllFromTable('reviews');
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function createReview(req, res) {
  try {
    const newReview = await insertIntoTable('reviews', req.body);
    res.json(newReview);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
