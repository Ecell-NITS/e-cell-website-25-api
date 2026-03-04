import { Router } from 'express';
import { protect } from '../middlewares/authMiddleware';
import {
  getApiComments,
  createApiComment,
} from '../controllers/comment.controller';

const commentRoutes = Router();

commentRoutes.get('/apiComment/:postId', getApiComments);
commentRoutes.post('/apicomment/:Id', protect, createApiComment);

export default commentRoutes;
