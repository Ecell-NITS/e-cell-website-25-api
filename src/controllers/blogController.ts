import { Request, Response } from 'express';
import prisma from '../utils/prisma';

//  Get All Blogs
export const getBlogs = async (_req: Request, res: Response) => {
  try {
    const blogs = await prisma.blog.findMany();
    res.status(200).json(blogs);
  } catch (error) {
    // We keep 'error' here because we are actually using it in console.error
    console.error('Here is the error:', error);
    res.status(500).json({ error: 'Failed to fetch blogs.' });
  }
};

//  Get Blog by ID
export const getBlogById = async (req: Request, res: Response) => {
  const { blogId } = req.params;
  try {
    const blog = await prisma.blog.findUnique({ where: { id: blogId } });
    if (blog) res.status(200).json(blog);
    else res.status(404).json({ error: 'Blog not found.' });
  } catch {
    // Removed the error variable entirely to satisfy linter
    res.status(500).json({ error: 'Error fetching blog.' });
  }
};

// Get Accepted Blogs
export const getAcceptedBlogs = async (req: Request, res: Response) => {
  const { blogId, email } = req.query as { blogId: string; email: string };
  if (!blogId || !email)
    return res.status(400).json({ error: 'Missing parameters.' });

  try {
    const blog = await prisma.blog.findUnique({ where: { id: blogId } });
    if (!blog) return res.status(404).json({ error: 'Blog not found.' });
    if (blog.writerEmail !== email)
      return res.status(403).json({ error: 'Unauthorized.' });
    if (!blog.isAccepted)
      return res.status(400).json({ message: 'Not accepted yet.' });

    res.status(200).json(blog);
  } catch {
    res.status(500).json({ error: 'Server error.' });
  }
};

// Publish Blog
export const publishBlog = async (req: Request, res: Response) => {
  const { Id } = req.params;
  const { email, writerName, subject, text } = req.body;

  try {
    const blog = await prisma.blog.findUnique({ where: { id: Id } });
    if (!blog) return res.status(404).json({ error: 'Blog not found.' });
    if (blog.writerEmail !== email)
      return res.status(403).json({ error: 'Unauthorized.' });

    const updated = await prisma.blog.update({
      where: { id: Id },
      data: { subject, text, writerName, isAccepted: true },
    });
    res.status(200).json({ message: 'Published successfully.', blog: updated });
  } catch {
    res.status(500).json({ error: 'Failed to publish.' });
  }
};

// Delete Blog
export const deleteBlog = async (req: Request, res: Response) => {
  const { blogId } = req.params;
  const { email, writerName } = req.body;

  try {
    const blog = await prisma.blog.findUnique({ where: { id: blogId } });
    if (!blog) return res.status(404).json({ error: 'Blog not found.' });
    if (blog.writerEmail !== email || blog.writerName !== writerName) {
      return res.status(403).json({ error: 'Unauthorized.' });
    }

    await prisma.blog.delete({ where: { id: blogId } });
    res.status(200).json({ message: 'Deleted successfully.' });
  } catch {
    res.status(500).json({ error: 'Failed to delete.' });
  }
};

// Edit Blog
export const editBlog = async (req: Request, res: Response) => {
  const { blogId } = req.params;
  const data = req.body;

  try {
    const updated = await prisma.blog.update({
      where: { id: blogId },
      data: { ...data, timeStamp: data.timestamp },
    });
    res.status(200).json({ message: 'Updated successfully.', blog: updated });
  } catch {
    res.status(500).json({ error: 'Failed to update.' });
  }
};
