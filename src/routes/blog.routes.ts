import { Router } from 'express';
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
} from '../controllers/blog.controller';

const blogRoutes = Router();

blogRoutes.post('/createBlog', createBlog);
blogRoutes.get('/myPublishedBlogs', myPublishedBlogs);
blogRoutes.get('/publicWrittenBlog/:authoruniqueid', publicWrittenBlog);
blogRoutes.get('/tagSpecificBlogList/:tagName', tagSpecificBlogList);
// blogRoutes.post('/apiBlogs/:blogId', createApiBlog);
blogRoutes.post('/apiBlogs', createApiBlog);

blogRoutes.get('/getblogs', getBlogs);
blogRoutes.get('/getblogs/:blogId', getBlogById);
blogRoutes.get('/acceptedBlogs', getAcceptedBlogs);
blogRoutes.post('/publishBlog/:Id', publishBlog);
blogRoutes.delete('/deleteBlog/:blogId', deleteBlog);
blogRoutes.put('/editBlog/:blogId', editBlog);

export default blogRoutes;
