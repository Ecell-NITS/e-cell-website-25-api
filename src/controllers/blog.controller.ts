import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { createBlogSchema } from '../validators/blog.validators';
import { createApiBlogSchema } from '../validators/blog.validators';

export const createBlog = async (req: Request, res: Response) => {
  try {
    const validatedData = createBlogSchema.parse(req.body);

    const blog = await prisma.blog.create({
      data: validatedData,
      select: {
        id: true,
        title: true,
        writerEmail: true,
        subject: true,
        text: true,
        isAccepted: true,
      },
    });

    return res.status(201).json({
      message: 'Blog created successfully',
      data: blog,
    });
  } catch (error) {
    console.error('FULL ERROR:', error);
    return res.status(500).json({
      message: error instanceof Error ? error.message : 'Internal server error',
    });
  }
};

export const myPublishedBlogs = async (req: Request, res: Response) => {
  try {
    const { writerEmail } = req.query;

    if (!writerEmail || typeof writerEmail !== 'string') {
      return res.status(400).json({
        message: 'email is required',
      });
    }

    const page = 1;
    const limit = 2;
    const skip = (page - 1) * limit;

    const [blogs, total] = await Promise.all([
      prisma.blog.findMany({
        where: { writerEmail },
        orderBy: { timeStamp: 'desc' },
        skip,
        take: limit,
      }),
      prisma.blog.count({
        where: { writerEmail },
      }),
    ]);

    return res.status(200).json({
      message: 'Blogs fetched successfully',
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      data: blogs,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: 'Internal server error',
    });
  }
};

export const publicWrittenBlog = async (req: Request, res: Response) => {
  try {
    const { authoruniqueid } = req.params;

    if (!authoruniqueid || typeof authoruniqueid !== 'string') {
      return res.status(400).json({
        message: 'authoruniqueid is required',
      });
    }

    const page = 1;
    const limit = 2;
    const skip = (page - 1) * limit;

    const [blogs, total] = await Promise.all([
      prisma.publicBlog.findMany({
        where: { authoruniqueid },
        orderBy: { timestamp: 'desc' },
        skip,
        take: limit,
      }),
      prisma.publicBlog.count({
        where: { authoruniqueid },
      }),
    ]);

    return res.status(200).json({
      message: 'Public written blogs fetched successfully',
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      data: blogs,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: 'Internal server error',
    });
  }
};

export const tagSpecificBlogList = async (req: Request, res: Response) => {
  try {
    const { tagName } = req.params;

    if (!tagName || typeof tagName !== 'string') {
      return res.status(400).json({
        message: 'tagName is required',
      });
    }

    const page = 1;
    const limit = 2;
    const skip = (page - 1) * limit;

    const [blogs, total] = await Promise.all([
      prisma.publicBlog.findMany({
        where: {
          tag: {
            equals: tagName,
            mode: 'insensitive',
          },
        },
        orderBy: { timestamp: 'desc' },
        skip,
        take: limit,
      }),
      prisma.publicBlog.count({
        where: {
          tag: {
            equals: tagName,
            mode: 'insensitive',
          },
        },
      }),
    ]);

    return res.status(200).json({
      message: 'Tag specific blogs fetched successfully',
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      data: blogs,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: 'Internal server error',
    });
  }
};

export const createApiBlog = async (req: Request, res: Response) => {
  try {
    const validatedData = createApiBlogSchema.parse(req.body);

    const blog = await prisma.publicBlog.create({
      data: validatedData,
    });

    return res.status(201).json({
      message: 'API blog created successfully',
      data: blog,
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'ZodError') {
      return res.status(400).json({
        message: (error as Error & { errors: { message: string }[] }).errors[0]
          .message,
      });
    }

    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

//  Get All Blogs
export const getBlogs = async (_req: Request, res: Response) => {
  try {
    const blogs = await prisma.blog.findMany();
    res.status(200).json(blogs);
  } catch (error) {
    console.error('FULL ERROR:', error);
    res.status(500).json({ error });
  }
};
//  Get Blog by ID
export const getBlogById = async (req: Request, res: Response) => {
  const { blogId } = req.params;
  if (!blogId || Array.isArray(blogId)) {
    return res.status(400).json({ error: 'Invalid blog ID.' });
  }
  try {
    const blog = await prisma.blog.findUnique({ where: { id: blogId } });
    if (blog) res.status(200).json(blog);
    else res.status(404).json({ error: 'Blog not found.' });
  } catch {
    // Removed the error variable entirely to satisfy linter
    res.status(500).json({ error: 'Error fetching blog.' });
  }
};

// Get Accepted Blogs (returns all accepted blogs)
export const getAcceptedBlogs = async (_req: Request, res: Response) => {
  try {
    const blogs = await prisma.blog.findMany({
      where: { isAccepted: true },
      orderBy: { timeStamp: 'desc' },
    });
    return res.status(200).json({ status: 'success', data: blogs });
  } catch {
    return res.status(500).json({ error: 'Server error.' });
  }
};

// Publish Blog
export const publishBlog = async (req: Request, res: Response) => {
  const { Id } = req.params;
  const { email, writerName, subject, text } = req.body;
  if (!Id || Array.isArray(Id)) {
    return res.status(400).json({ error: 'Invalid Blog ID.' });
  }

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
  if (!blogId || Array.isArray(blogId)) {
    return res.status(400).json({ error: 'Invalid Blog ID.' });
  }

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
  if (!blogId || Array.isArray(blogId)) {
    return res.status(400).json({ error: 'Invalid Blog ID.' });
  }
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
