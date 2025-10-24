import { uploadPhoto } from '../services/photoUpload.service.js';

export async function uploadImage(req, res) {
  try {
    if (!req.file) throw new Error('No image uploaded');
    const imageUrl = await uploadPhoto(req.file);
    res.json({ url: imageUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
