import { Router } from 'express';
import {
  createBlog,
  myPublishedBlogs,
  publicWrittenBlog,
  tagSpecificBlogList,
  createApiBlog,
} from '../controllers/blog.controller';

const blogRoutes = Router();

blogRoutes.post('/createBlog', createBlog);
blogRoutes.get('/myPublishedBlogs', myPublishedBlogs);
blogRoutes.get('/publicWrittenBlog/:authoruniqueid', publicWrittenBlog);
blogRoutes.get('/tagSpecificBlogList/:tagName', tagSpecificBlogList);
// blogRoutes.post('/apiBlogs/:blogId', createApiBlog);
blogRoutes.post('/apiBlogs', createApiBlog);

export default blogRoutes;
