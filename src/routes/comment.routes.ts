import { Router } from 'express';
import {
  getApiComments,
  createApiComment,
} from '../controllers/comment.controller';

const commentRoutes = Router();

commentRoutes.get('/apiComment/:postId', getApiComments);
commentRoutes.post('/apicomment/:Id', createApiComment);

export default commentRoutes;
