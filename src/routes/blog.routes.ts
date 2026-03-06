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
  getDraftBlog,
} from '../controllers/blog.controller';
import { verifyToken } from '../middlewares/verifyToken';
import { requireRole } from '../middlewares/requireRole';
import { Role } from '@prisma/client';

const blogRoutes = Router();

blogRoutes.post('/createBlog', verifyToken, createBlog);
blogRoutes.get('/myPublishedBlogs', myPublishedBlogs);
blogRoutes.get('/publicWrittenBlog/:authoruniqueid', publicWrittenBlog);
blogRoutes.get('/tagSpecificBlogList/:tagName', tagSpecificBlogList);
blogRoutes.post('/apiBlogs', createApiBlog);

blogRoutes.get('/getblogs', getBlogs);
blogRoutes.get('/getblogs/:blogId', getBlogById);
blogRoutes.get('/getBySlug/:slug', getBlogBySlug);
blogRoutes.get('/draft/:blogId', verifyToken, getDraftBlog);
blogRoutes.get('/myBlogs', verifyToken, getMyBlogs);
blogRoutes.get('/acceptedBlogs', getAcceptedBlogs);
blogRoutes.post(
  '/publishBlog/:Id',
  verifyToken,
  requireRole(Role.ADMIN, Role.SUPERADMIN),
  publishBlog
);
blogRoutes.delete(
  '/deleteBlog/:blogId',
  verifyToken,
  requireRole(Role.ADMIN, Role.SUPERADMIN),
  deleteBlog
);
blogRoutes.put('/editBlog/:blogId', verifyToken, editBlog);
blogRoutes.post('/toggleLike/:blogId', verifyToken, toggleLike);

export default blogRoutes;
