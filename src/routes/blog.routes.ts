import { Router } from 'express';
import {
  createBlog,
  myPublishedBlogs,
  publicWrittenBlog,
  tagSpecificBlogList,
  createApiBlog,
  getBlogs,
  getBlogById,
  getBlogBySlug,
  getMyBlogs,
  getAcceptedBlogs,
  publishBlog,
  deleteBlog,
  editBlog,
  toggleLike,
} from '../controllers/blog.controller';
import { verifyToken } from '../middlewares/verifyToken';

const blogRoutes = Router();

blogRoutes.post('/createBlog', createBlog);
blogRoutes.get('/myPublishedBlogs', myPublishedBlogs);
blogRoutes.get('/publicWrittenBlog/:authoruniqueid', publicWrittenBlog);
blogRoutes.get('/tagSpecificBlogList/:tagName', tagSpecificBlogList);
// blogRoutes.post('/apiBlogs/:blogId', createApiBlog);
blogRoutes.post('/apiBlogs', createApiBlog);

blogRoutes.get('/getblogs', getBlogs);
blogRoutes.get('/getblogs/:blogId', getBlogById);
blogRoutes.get('/getBySlug/:slug', getBlogBySlug);
blogRoutes.get('/myBlogs', verifyToken, getMyBlogs);
blogRoutes.get('/acceptedBlogs', getAcceptedBlogs);
blogRoutes.post('/publishBlog/:Id', publishBlog);
blogRoutes.delete('/deleteBlog/:blogId', deleteBlog);
blogRoutes.put('/editBlog/:blogId', editBlog);
blogRoutes.post('/toggleLike/:blogId', verifyToken, toggleLike);

export default blogRoutes;
