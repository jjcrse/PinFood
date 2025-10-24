import { Router } from 'express';
import multer from 'multer';
import { uploadImage } from '../controllers/uploads.controller.js';

const router = Router();
const upload = multer();

router.post('/', upload.single('image'), uploadImage);

export default router;
