import { Router } from 'express';
import { protect } from '../middlewares/authMiddleware';
import {
  createBlog,
  myPublishedBlogs,
  publicWrittenBlog,
  tagSpecificBlogList,
  createApiBlog,
  getBlogs,
  getBlogById,
  getAcceptedBlogs,
  publishBlog,
  deleteBlog,
  editBlog,
  toggleLike,
} from '../controllers/blog.controller';

const blogRoutes = Router();

blogRoutes.post('/like/:postId', protect, toggleLike);

blogRoutes.post('/createBlog', protect, createBlog);
blogRoutes.get('/myPublishedBlogs', myPublishedBlogs);
blogRoutes.get('/publicWrittenBlog/:authoruniqueid', publicWrittenBlog);
blogRoutes.get('/tagSpecificBlogList/:tagName', tagSpecificBlogList);
// blogRoutes.post('/apiBlogs/:blogId', createApiBlog);
blogRoutes.post('/apiBlogs', protect, createApiBlog);

blogRoutes.get('/getblogs', getBlogs);
blogRoutes.get('/getblogs/:blogId', getBlogById);
blogRoutes.get('/acceptedBlogs', getAcceptedBlogs);
blogRoutes.post('/publishBlog/:Id', publishBlog);
blogRoutes.delete('/deleteBlog/:blogId', deleteBlog);
blogRoutes.put('/editBlog/:blogId', editBlog);

export default blogRoutes;
