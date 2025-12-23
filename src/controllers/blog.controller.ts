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
        email: true,
        subject: true,
        text: true,
        createdAt: true,
      },
    });

    return res.status(201).json({
      message: 'Blog created successfully',
      data: blog,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        message: error.errors[0].message,
      });
    }

    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const myPublishedBlogs = async (req: Request, res: Response) => {
  try {
    const { email } = req.query;

    if (!email || typeof email !== 'string') {
      return res.status(400).json({
        message: 'email is required',
      });
    }

    const page = 1;
    const limit = 2;
    const skip = (page - 1) * limit;

    const [blogs, total] = await Promise.all([
      prisma.blog.findMany({
        where: { email },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.blog.count({
        where: { email },
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

    if (!authoruniqueid) {
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

    if (!tagName) {
      return res.status(400).json({
        message: 'tagName is required',
      });
    }

    const page = 1;
    const limit = 2;
    const skip = (page - 1) * limit;

    const [blogs, total] = await Promise.all([
      prisma.publicBlog.findMany({
        where: { tag: tagName },
        orderBy: { timestamp: 'desc' },
        skip,
        take: limit,
      }),
      prisma.publicBlog.count({
        where: { tag: tagName },
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
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        message: error.errors[0].message,
      });
    }

    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
