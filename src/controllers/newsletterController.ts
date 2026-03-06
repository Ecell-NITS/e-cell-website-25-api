import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { newsletterSchema } from '../validators/newsletter.validators';
import { sendEmail } from '../utils/email';

export const subscribe = async (req: Request, res: Response) => {
  const parsed = newsletterSchema.safeParse(req.body);
  if (!parsed.success) {
    return res
      .status(400)
      .json({ error: parsed.error.issues[0]?.message ?? 'Invalid email' });
  }

  const { email } = parsed.data;

  try {
    // Check if already subscribed
    const existing = await prisma.newsletter.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'Email is already subscribed' });
    }

    await prisma.newsletter.create({ data: { email } });

    // Send confirmation email
    try {
      await sendEmail({
        email,
        subject: 'Subscribed to E-Cell NITS Newsletter! 🥳',
        message: `Thank you for subscribing to the E-Cell newsletter! Get ready to dive into a world of entrepreneurial inspiration, valuable resources, and exciting updates. We can't wait to share our knowledge and support your entrepreneurial journey. Stay tuned for our first newsletter, packed with valuable content to help you thrive.\n\nDon't forget to check your spam folder.\n\nBest regards,\n\nE-Cell,\nNational Institute of Technology, Silchar`,
      });
    } catch (emailErr) {
      console.error('Failed to send newsletter confirmation email:', emailErr);
    }

    res.status(201).json({ message: 'Subscribed successfully' });
  } catch {
    res.status(500).json({ error: 'Failed to subscribe' });
  }
};

export const getSubscribers = async (_req: Request, res: Response) => {
  try {
    const subscribers = await prisma.newsletter.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(subscribers);
  } catch {
    res.status(500).json({ error: 'Failed to fetch subscribers' });
  }
};

export const checkEmail = async (req: Request, res: Response) => {
  const parsed = newsletterSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid email' });
  }

  try {
    const existing = await prisma.newsletter.findUnique({
      where: { email: parsed.data.email },
    });
    res.json({ subscribed: !!existing });
  } catch {
    res.status(500).json({ error: 'Failed to check email' });
  }
};

export const unsubscribe = async (req: Request, res: Response) => {
  const parsed = newsletterSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid email' });
  }

  try {
    await prisma.newsletter.delete({
      where: { email: parsed.data.email },
    });
    res.json({ message: 'Unsubscribed successfully' });
  } catch {
    res.status(500).json({ error: 'Email not found or already unsubscribed' });
  }
};
