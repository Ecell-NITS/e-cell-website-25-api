import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { createBlogSchema } from '../validators/blog.validators';
import { createApiBlogSchema } from '../validators/blog.validators';
import { sendEmail } from '../utils/email';
import { env } from '../config/env';

const buildBlogNotificationHtml = (
  title: string,
  authorName: string,
  authorEmail: string,
  preview: string
): string => {
  const reviewUrl = `${env.CLIENT_URL}/admin/blogs`;
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;">
  <div style="max-width:560px;margin:20px auto;padding:0;">
    <p style="font-size:15px;color:#333;line-height:1.6;margin:0 0 16px;">
      Hi Team,
    </p>
    <p style="font-size:15px;color:#333;line-height:1.6;margin:0 0 16px;">
      A new blog has been submitted for review on the E-Cell NIT Silchar website.
    </p>
    <p style="font-size:15px;color:#333;line-height:1.6;margin:0 0 4px;"><strong>Title:</strong> ${title}</p>
    <p style="font-size:15px;color:#333;line-height:1.6;margin:0 0 4px;"><strong>Author:</strong> ${authorName}</p>
    <p style="font-size:15px;color:#333;line-height:1.6;margin:0 0 16px;"><strong>Email:</strong> ${authorEmail}</p>
    <p style="font-size:14px;color:#555;line-height:1.6;margin:0 0 4px;"><strong>Preview:</strong></p>
    <p style="font-size:14px;color:#555;line-height:1.6;margin:0 0 20px;padding-left:8px;border-left:3px solid #ddd;">${preview}</p>
    <p style="font-size:15px;color:#333;line-height:1.6;margin:0 0 16px;">
      Please review and approve/reject it here:<br />
      <a href="${reviewUrl}" style="color:#1a73e8;">${reviewUrl}</a>
    </p>
    <p style="font-size:15px;color:#333;line-height:1.6;margin:24px 0 0;">
      Best regards,<br />
      E-Cell NIT Silchar
    </p>
  </div>
</body>
</html>`;
};

export const createBlog = async (req: Request, res: Response) => {
  try {
    const validatedData = createBlogSchema.parse(req.body);

    const userId = req.user?.id;

    // Look up the authenticated user to get their real name/email
    const authUser = userId
      ? await prisma.user.findUnique({
          where: { id: userId },
          select: { name: true, email: true, picture: true, userimg: true },
        })
      : null;

    const authorName =
      authUser?.name || validatedData.writerName || 'Anonymous';
    const authorEmail = authUser?.email || validatedData.writerEmail || '';
    const authorPic =
      authUser?.userimg || authUser?.picture || validatedData.writerPic;

    const blog = await prisma.blog.create({
      data: {
        ...validatedData,
        authorId: userId,
        writerName: authorName,
        writerEmail: authorEmail,
        writerPic: authorPic,
        isAccepted: false,
        status: 'pending',
        timeStamp: new Date().toISOString(),
      },
    });

    // Send notification email to admin
    try {
      await sendEmail({
        email: 'ecell@nits.ac.in', // Admin email
        subject: `New Blog Pending Review: ${blog.title}`,
        message: `A new blog "${blog.title}" by ${authorName} (${authorEmail}) has been submitted and needs verification.`,
        html: buildBlogNotificationHtml(
          blog.title ?? 'Untitled',
          authorName,
          authorEmail,
          blog.intro ??
            blog.content?.replace(/<[^>]*>/g, '').slice(0, 200) ??
            ''
        ),
      });
    } catch (emailErr) {
      console.error('Failed to send blog notification email:', emailErr);
    }

    return res.status(201).json({
      message: 'Blog created successfully and sent for review',
      data: blog,
    });
  } catch (error) {
    console.error('Blog creation error:', error);
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

function toSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Get a draft/pending blog by ID — only the author or admin/superadmin can view
export const getDraftBlog = async (req: Request, res: Response) => {
  const { blogId } = req.params;
  if (!blogId || Array.isArray(blogId)) {
    return res.status(400).json({ error: 'Invalid Blog ID.' });
  }

  const userId = req.user?.id;
  const userRole = req.user?.role;

  try {
    const blog = await prisma.blog.findUnique({ where: { id: blogId } });
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found.' });
    }

    // If already published, redirect to public view
    if (blog.isAccepted) {
      return res.status(200).json({ status: 'success', data: blog });
    }

    // Only author or admin/superadmin can view drafts
    const isOwner = userId && blog.authorId === userId;
    const isAdmin = userRole === 'ADMIN' || userRole === 'SUPERADMIN';

    if (!isOwner && !isAdmin) {
      return res
        .status(403)
        .json({ error: 'You do not have permission to view this blog.' });
    }

    return res.status(200).json({ status: 'success', data: blog });
  } catch {
    return res.status(500).json({ error: 'Error fetching blog.' });
  }
};

export const getBlogBySlug = async (req: Request, res: Response) => {
  const { slug } = req.params;
  if (!slug || Array.isArray(slug)) {
    return res.status(400).json({ error: 'Invalid slug.' });
  }
  try {
    const blogs = await prisma.blog.findMany();
    const blog = blogs.find(b => toSlug(b.title ?? '') === slug);
    if (blog) res.status(200).json(blog);
    else res.status(404).json({ error: 'Blog not found.' });
  } catch {
    res.status(500).json({ error: 'Error fetching blog.' });
  }
};

// Get blogs for the authenticated user (by writerEmail or authorId)
export const getMyBlogs = async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const userEmail = req.user?.email;

  if (!userId && !userEmail) {
    return res.status(401).json({ error: 'Not authenticated.' });
  }

  try {
    const blogs = await prisma.blog.findMany({
      where: {
        OR: [
          ...(userEmail ? [{ writerEmail: userEmail }] : []),
          ...(userId ? [{ authorId: userId }] : []),
        ],
      },
      orderBy: { timeStamp: 'desc' },
    });

    return res.status(200).json({ status: 'success', data: blogs });
  } catch {
    return res.status(500).json({ error: 'Server error.' });
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

// Publish Blog (Admin approves a blog)
export const publishBlog = async (req: Request, res: Response) => {
  const { Id } = req.params;
  if (!Id || Array.isArray(Id)) {
    return res.status(400).json({ error: 'Invalid Blog ID.' });
  }

  try {
    const blog = await prisma.blog.findUnique({ where: { id: Id } });
    if (!blog) return res.status(404).json({ error: 'Blog not found.' });

    const updated = await prisma.blog.update({
      where: { id: Id },
      data: { isAccepted: true, status: 'published' },
    });
    res
      .status(200)
      .json({ message: 'Blog approved successfully.', blog: updated });
  } catch {
    res.status(500).json({ error: 'Failed to approve blog.' });
  }
};

// Delete Blog
export const deleteBlog = async (req: Request, res: Response) => {
  const { blogId } = req.params;
  if (!blogId || Array.isArray(blogId)) {
    return res.status(400).json({ error: 'Invalid Blog ID.' });
  }

  try {
    const blog = await prisma.blog.findUnique({ where: { id: blogId } });
    if (!blog) return res.status(404).json({ error: 'Blog not found.' });

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

// Toggle Like on a Blog
export const toggleLike = async (req: Request, res: Response) => {
  const { blogId } = req.params;
  if (!blogId || Array.isArray(blogId)) {
    return res.status(400).json({ error: 'Invalid blog ID.' });
  }

  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ error: 'Not authenticated.' });
  }

  try {
    const blog = await prisma.blog.findUnique({
      where: { id: blogId },
      select: { likes: true },
    });

    if (!blog) {
      return res.status(404).json({ error: 'Blog not found.' });
    }

    const alreadyLiked = blog.likes.includes(userId);
    const updatedLikes = alreadyLiked
      ? blog.likes.filter(id => id !== userId)
      : [...blog.likes, userId];

    const updated = await prisma.blog.update({
      where: { id: blogId },
      data: { likes: updatedLikes },
      select: { likes: true },
    });

    return res.status(200).json({
      message: alreadyLiked ? 'Unliked' : 'Liked',
      liked: !alreadyLiked,
      likesCount: updated.likes.length,
    });
  } catch {
    return res.status(500).json({ error: 'Failed to toggle like.' });
  }
};
