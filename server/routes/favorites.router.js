import { Router } from 'express';
import { getFavorites, addFavorite } from '../controllers/favorite.controller.js';

const router = Router();
router.get('/', getFavorites);
router.post('/', addFavorite);

export default router;
