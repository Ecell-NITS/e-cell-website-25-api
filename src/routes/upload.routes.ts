import { Router } from 'express';
import multer from 'multer';
import { uploadImage } from '../controllers/upload.controller';
import { verifyToken } from '../middlewares/verifyToken';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

router.post('/image', verifyToken, upload.single('image'), uploadImage);

export default router;
