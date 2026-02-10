import { Request, Response } from 'express';
import { prisma } from '../prisma/client';
import { sendQuerySchema } from '../schemas/query.schema';

export const sendQuery = async (req: Request, res: Response) => {
  const parsed = sendQuerySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json(parsed.error);
  }

  try {
    await prisma.query.create({
      data: { ...parsed.data, read: false },
    });

    res.status(201).json({ message: 'Query sent successfully' });
  } catch {
    res.status(500).json({ error: 'Failed to send query' });
  }
};

export const getQueries = async (_req: Request, res: Response) => {
  try {
    const queries = await prisma.query.findMany();
    res.json(queries);
  } catch {
    res.status(500).json({ error: 'Failed to fetch queries' });
  }
};
