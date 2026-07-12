import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { sendEmail } from '../utils/email';
import { AppError } from '../utils/AppError';
import {
  getRecruitmentEmailHtml,
  RECRUITMENT_EMAIL_SUBJECT,
} from '../utils/recruitmentEmail';

// ─── GET /my-applications ─────────────────────────────────────────
export const getMyApplications = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email } = req.query as { email?: string };
    if (!email)
      return res.json({ status: 'success', data: { applications: [] } });

    const applications = await prisma.recruitmentApplication.findMany({
      where: { email },
      orderBy: { updatedAt: 'desc' },
    });
    res.json({ status: 'success', data: { applications } });
  } catch (error) {
    next(error);
  }
};

// ─── POST /apply/tech/save-draft ──────────────────────────────────
export const saveTechDraft = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      name,
      email,
      scholarId,
      whatsappNumber,
      techDomain,
      domainOfPriorProject,
      resumeLink,
      githubProfileLink,
    } = req.body;
    const userId = req.user?.id || null;

    // ── Registration closed for all Tech domains ──
    return res.status(403).json({
      status: 'error',
      message: 'Registration for all Technical domains is closed.',
    });

    /* eslint-disable no-unreachable */
    const existing = await prisma.recruitmentApplication.findUnique({
      where: { email_type: { email, type: 'TECH' } },
    });
    if (existing?.status === 'SUBMITTED') {
      return next(
        new AppError('You have already submitted a Tech application.', 400)
      );
    }

    const data = {
      name,
      email,
      scholarId,
      whatsappNumber,
      techDomain: techDomain || 'WEB',
      domainOfPriorProject: domainOfPriorProject || '',
      resumeLink,
      githubProfileLink,
    };

    const application = await prisma.recruitmentApplication.upsert({
      where: { email_type: { email, type: 'TECH' } },
      update: { ...data, status: 'DRAFT', ...(userId ? { userId } : {}) },
      create: {
        ...data,
        type: 'TECH',
        status: 'DRAFT',
        ...(userId ? { userId } : {}),
      },
    });

    res.status(200).json({
      status: 'success',
      message: 'Draft saved successfully!',
      data: { application },
    });
  } catch (error) {
    next(error);
  }
};

// ─── POST /apply/tech/submit ──────────────────────────────────────
export const submitTechApplication = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      name,
      email,
      scholarId,
      whatsappNumber,
      techDomain,
      domainOfPriorProject,
      resumeLink,
      githubProfileLink,
      taskPreviewLink,
      taskGithubRepoLink,
      taskSelection,
    } = req.body;

    // ── Registration closed for all Tech domains ──
    return next(
      new AppError('Registration for all Technical domains is closed.', 403)
    );

    /* eslint-disable no-unreachable */
    const userId = req.user?.id || null;

    const existing = await prisma.recruitmentApplication.findUnique({
      where: { email_type: { email, type: 'TECH' } },
    });
    if (existing?.status === 'SUBMITTED') {
      return next(
        new AppError('You have already submitted a Tech application.', 400)
      );
    }

    const data = {
      name,
      email,
      scholarId,
      whatsappNumber,
      techDomain: techDomain || 'WEB',
      domainOfPriorProject: domainOfPriorProject || '',
      resumeLink,
      githubProfileLink,
      taskPreviewLink,
      taskGithubRepoLink,
      taskSelection,
    };

    const application = await prisma.recruitmentApplication.upsert({
      where: { email_type: { email, type: 'TECH' } },
      update: { ...data, status: 'SUBMITTED', ...(userId ? { userId } : {}) },
      create: {
        ...data,
        type: 'TECH',
        status: 'SUBMITTED',
        ...(userId ? { userId } : {}),
      },
    });

    try {
      const html = getRecruitmentEmailHtml({
        name,
        type: 'TECH',
        techDomain: techDomain || 'WEB',
        taskSelection,
        scholarId,
        email,
      });
      await sendEmail({
        email,
        subject: RECRUITMENT_EMAIL_SUBJECT,
        message: `Thank you for applying to E-Cell NIT Silchar Tech Team.`,
        html,
      });
    } catch (emailError) {
      console.error('Error sending recruitment email:', emailError);
    }

    res.status(200).json({
      status: 'success',
      message: 'Application submitted successfully!',
      data: { application },
    });
  } catch (error) {
    next(error);
  }
};

// ─── POST /apply/other/submit ─────────────────────────────────────
export const submitOtherApplication = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // ── Registration closed for Non-Technical teams ──
    return next(
      new AppError('Registration for Non-Technical teams is closed.', 403)
    );

    /* eslint-disable no-unreachable */
    const {
      name,
      email,
      scholarId,
      branch,
      whatsappNumber,
      instituteEmail,
      whyJoinECell,
      teamSelection,
      pastContributions,
      otherClubs,
    } = req.body;
    const userId = req.user?.id || null;

    const existing = await prisma.recruitmentApplication.findUnique({
      where: { email_type: { email, type: 'OTHER' } },
    });
    if (existing?.status === 'SUBMITTED') {
      return next(
        new AppError(
          'You have already submitted an Other Teams application.',
          400
        )
      );
    }

    const data = {
      name,
      email,
      scholarId,
      branch,
      whatsappNumber,
      instituteEmail,
      whyJoinECell,
      teamSelection,
      pastContributions: pastContributions || '',
      otherClubs: otherClubs || '',
    };

    const application = await prisma.recruitmentApplication.upsert({
      where: { email_type: { email, type: 'OTHER' } },
      update: { ...data, status: 'SUBMITTED', ...(userId ? { userId } : {}) },
      create: {
        ...data,
        type: 'OTHER',
        status: 'SUBMITTED',
        ...(userId ? { userId } : {}),
      },
    });

    try {
      const html = getRecruitmentEmailHtml({
        name,
        type: 'OTHER',
        teamSelection,
        scholarId,
        email,
      });
      await sendEmail({
        email,
        subject: RECRUITMENT_EMAIL_SUBJECT,
        message: `Thank you for applying to E-Cell NIT Silchar.`,
        html,
      });
    } catch (emailError) {
      console.error('Error sending recruitment email:', emailError);
    }

    res.status(200).json({
      status: 'success',
      message: 'Application submitted successfully!',
      data: { application },
    });
  } catch (error) {
    next(error);
  }
};

// ─── GET /admin/applications ──────────────────────────────────────
export const getAllApplications = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      status,
      type,
      search,
      page = '1',
      limit = '20',
    } = req.query as Record<string, string>;
    const skip = (Number(page) - 1) * Number(limit);
    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (type) where.type = type;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { scholarId: { contains: search, mode: 'insensitive' } },
      ];
    }
    const [applications, total] = await Promise.all([
      prisma.recruitmentApplication.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, email: true, picture: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
      }),
      prisma.recruitmentApplication.count({ where }),
    ]);
    res.json({
      status: 'success',
      data: {
        applications,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── GET /admin/applications/:id ──────────────────────────────────
export const getApplicationById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const application = await prisma.recruitmentApplication.findUnique({
      where: { id: req.params.id as string },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            picture: true,
            role: true,
          },
        },
      },
    });
    if (!application) return next(new AppError('Application not found', 404));
    res.json({ status: 'success', data: { application } });
  } catch (error) {
    next(error);
  }
};
