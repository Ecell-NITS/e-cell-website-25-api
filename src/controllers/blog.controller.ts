import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const createBlog = async (req: Request, res: Response) => {
  try {
    const { email, subject, text } = req.body;

    if (!email || !subject || !text) {
      return res.status(400).json({
        message: 'email, subject and text are required',
      });
    }

    const blog = await prisma.blog.create({
      data: {
        email,
        subject,
        text,
      },
    });

    return res.status(201).json({
      message: 'Blog created successfully',
      data: blog,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: 'Internal server error',
    });
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

    const blogs = await prisma.blog.findMany({
      where: {
        email: email,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return res.status(200).json({
      message: 'Blogs fetched successfully',
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
    const blogs = await prisma.publicBlog.findMany({
      where: {
        authoruniqueid,
      },
      orderBy: {
        timestamp: 'desc',
      },
    });

    return res.status(200).json({
      message: 'Public written blogs fetched successfully',
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

    const blogs = await prisma.publicBlog.findMany({
      where: {
        tag: tagName,
      },
      orderBy: {
        timestamp: 'desc',
      },
    });

    return res.status(200).json({
      message: 'Tag specific blogs fetched successfully',
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
    const { blogId } = req.params;

    const {
      authoruniqueid,
      title,
      tag,
      intro,
      content,
      topicpic,
      writername,
      writerintro,
      writerpic,
      writeremail,
    } = req.body;

    if (
      !blogId ||
      !authoruniqueid ||
      !title ||
      !tag ||
      !intro ||
      !content ||
      !topicpic ||
      !writername ||
      !writerintro ||
      !writerpic ||
      !writeremail
    ) {
      return res.status(400).json({
        message: 'All fields are required',
      });
    }

    // 🔹 Insert into SAME PublicBlog collection
    const blog = await prisma.publicBlog.create({
      data: {
        blogId,
        authoruniqueid,
        title,
        tag,
        intro,
        content,
        topicpic,
        writername,
        writerintro,
        writerpic,
        writeremail,
      },
    });

    return res.status(201).json({
      message: 'API blog created successfully',
      data: blog,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: 'Internal server error',
    });
  }
};

export const getApiComments = async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;

    if (!postId) {
      return res.status(400).json({
        message: 'postId is required',
      });
    }

    const comments = await prisma.comment.findMany({
      where: {
        postId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return res.status(200).json({
      message: 'Comments fetched successfully',
      data: comments,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: 'Internal server error',
    });
  }
};

export const createApiComment = async (req: Request, res: Response) => {
  try {
    const { Id } = req.params;

    const { commentAuthor, commentPic, text, userId } = req.body;

    if (!Id || !commentAuthor || !commentPic || !text || !userId) {
      return res.status(400).json({
        message: 'All fields are required',
      });
    }

    const comment = await prisma.comment.create({
      data: {
        postId: Id,
        commentAuthor,
        commentPic,
        text,
        userId,
      },
    });

    return res.status(201).json({
      message: 'Comment added successfully',
      data: comment,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: 'Internal server error',
    });
  }
};
