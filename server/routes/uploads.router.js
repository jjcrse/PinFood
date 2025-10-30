import { Router } from 'express';
import multer from 'multer';
import { uploadImage, uploadImageBase64 } from '../controllers/uploads.controller.js';

const router = Router();
const upload = multer();

// Upload tradicional con FormData
router.post('/', upload.single('image'), uploadImage);

// Upload con base64 (cámara/galería)
router.post('/base64', uploadImageBase64);

export default router;
