import { createCommentSchema } from '../validators/comment.validators';
import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const getApiComments = async (
  req: Request<{ postId: string }>,
  res: Response
) => {
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

export const createApiComment = async (
  req: Request<{ Id: string }>,
  res: Response
) => {
  try {
    const { Id } = req.params;

    if (!Id) {
      return res.status(400).json({ message: 'postId is required' });
    }

    const validatedData = createCommentSchema.parse(req.body);

    const comment = await prisma.comment.create({
      data: {
        postId: Id,
        ...validatedData,
      },
    });

    return res.status(201).json({
      message: 'Comment added successfully',
      data: comment,
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
