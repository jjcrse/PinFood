import { Router } from 'express';
import { getFollows, followUser } from '../controllers/follows.controller.js';

const router = Router();
router.get('/', getFollows);
router.post('/', followUser);

export default router;
