import { Router } from 'express';
import { getPlaces } from '../controllers/place.controller.js';

const router = Router();
router.get('/', getPlaces);

export default router;
