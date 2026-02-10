import { Router } from 'express';
import {
  getBlogs,
  getBlogById,
  getAcceptedBlogs,
  publishBlog,
  deleteBlog,
  editBlog,
} from '../controllers/blogController';

const router = Router();

router.get('/getblogs', getBlogs);
router.get('/getblogs/:blogId', getBlogById);
router.get('/acceptedBlogs', getAcceptedBlogs);
router.post('/publishBlog/:Id', publishBlog);
router.delete('/deleteBlog/:blogId', deleteBlog);
router.put('/editBlog/:blogId', editBlog);

export default router;
