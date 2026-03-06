import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { querySchema } from '../validators/query.validators';
import { sendEmail } from '../utils/email';
import { env } from '../config/env';

// ── Admin emails to notify on new queries. Do not add more than 2 emails ──
const ADMIN_NOTIFICATION_EMAILS = ['ecell@nits.ac.in'];

const buildUserConfirmationHtml = (
  name: string,
  userMessage: string
): string => {
  return `
  <!DOCTYPE html>
<html lang="en" style="margin:0;padding:0;">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Thank You for Contacting E-Cell</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f4f6f9;font-family:'Poppins',Arial,Helvetica,sans-serif;">
    <table align="center" width="100%" cellpadding="0" cellspacing="0" role="presentation"
      style="max-width:600px;margin:auto;background-color:#ffffff;border-radius:10px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.08);">

      <!-- HEADER -->
      <tr>
        <td style="background-color:#224259;text-align:center;padding:24px 16px;">
          <img src="https://res.cloudinary.com/ecell/image/upload/v1762102444/ecell-logo-bw2_sayvqp_htrv0f.png" alt="E-Cell NIT Silchar" width="60" style="margin-bottom:10px;">
          <h2 style="color:#ffffff;margin:0;font-size:20px;letter-spacing:0.5px;">E-Cell NIT Silchar</h2>
          <p style="color:#cfd8e3;margin:5px 0 0;font-size:14px;">We Received Your Message</p>
        </td>
      </tr>

      <!-- BODY -->
      <tr>
        <td style="padding:32px 40px;color:#1a1a1a;text-align:left;">
          <h3 style="color:#224259;margin-top:0;text-align:center;">Thank You, ${name}!</h3>
          <p style="line-height:1.6;color:#333;font-size:15px;">
            Thank you for reaching out to us through our website's "Contact Us" form. We appreciate your interest in E-Cell, NIT Silchar.
          </p>

          <div style="margin:24px 0;padding:16px 20px;background-color:#f0f4f8;border-left:4px solid #224259;border-radius:4px;">
            <p style="margin:0 0 6px;font-size:13px;color:#888;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">Your Message</p>
            <p style="margin:0;line-height:1.6;color:#333;font-size:14px;">${userMessage}</p>
          </div>

          <p style="line-height:1.6;color:#333;font-size:15px;">
            Our team is currently reviewing your message and will respond shortly.
          </p>
          <p style="line-height:1.6;color:#333;font-size:15px;">
            If you have any urgent questions, please don't hesitate to contact us directly at
            <a href="mailto:ecell@nits.ac.in" style="color:#224259;font-weight:600;text-decoration:none;">ecell@nits.ac.in</a>.
          </p>

          <p style="margin-top:30px;color:#333;">
            <strong>Regards,</strong><br/>
            Team E-Cell NIT Silchar
          </p>
        </td>
      </tr>

      <!-- FOOTER -->
      <tr>
        <td style="background-color:#224259;padding:20px;text-align:center;color:#cfd8e3;font-size:13px;">
          <p style="margin:0;">&copy; ${new Date().getFullYear()} E-Cell NIT Silchar. All rights reserved.</p>
          <div style="margin-top:8px;">
            <a href="https://www.instagram.com/ecell.nitsilchar" style="margin:0 6px;">
              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Instagram_logo_2016.svg/2048px-Instagram_logo_2016.svg.png" width="20" alt="Instagram" />
            </a>
            <a href="https://www.linkedin.com/company/ecell-nit-silchar" style="margin:0 6px;">
              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/LinkedIn_logo_initials.png/500px-LinkedIn_logo_initials.png" width="20" alt="LinkedIn" />
            </a>
            <a href="https://www.facebook.com/ecell.nit.silchar/" style="margin:0 6px;">
              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/ee/Logo_de_Facebook.png/1028px-Logo_de_Facebook.png" width="20" alt="Facebook" />
            </a>
          </div>
        </td>
      </tr>
    </table>
  </body>
</html>
  `;
};

const buildAdminNotificationHtml = (
  name: string,
  email: string,
  userMessage: string
): string => {
  return `
  <!DOCTYPE html>
<html lang="en" style="margin:0;padding:0;">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>New Query Received</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f4f6f9;font-family:'Poppins',Arial,Helvetica,sans-serif;">
    <table align="center" width="100%" cellpadding="0" cellspacing="0" role="presentation"
      style="max-width:600px;margin:auto;background-color:#ffffff;border-radius:10px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.08);">

      <!-- HEADER -->
      <tr>
        <td style="background-color:#224259;text-align:center;padding:24px 16px;">
          <img src="https://res.cloudinary.com/ecell/image/upload/v1762102444/ecell-logo-bw2_sayvqp_htrv0f.png" alt="E-Cell NIT Silchar" width="60" style="margin-bottom:10px;">
          <h2 style="color:#ffffff;margin:0;font-size:20px;letter-spacing:0.5px;">E-Cell NIT Silchar</h2>
          <p style="color:#cfd8e3;margin:5px 0 0;font-size:14px;">New Query Notification</p>
        </td>
      </tr>

      <!-- BODY -->
      <tr>
        <td style="padding:32px 40px;color:#1a1a1a;text-align:left;">
          <h3 style="color:#224259;margin-top:0;text-align:center;">New Query from ${name}</h3>

          <table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;border-collapse:collapse;">
            <tr>
              <td style="padding:12px 16px;background-color:#f0f4f8;border-bottom:1px solid #e2e8f0;font-size:13px;color:#888;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;width:100px;">Name</td>
              <td style="padding:12px 16px;background-color:#f0f4f8;border-bottom:1px solid #e2e8f0;font-size:15px;color:#333;">${name}</td>
            </tr>
            <tr>
              <td style="padding:12px 16px;border-bottom:1px solid #e2e8f0;font-size:13px;color:#888;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">Email</td>
              <td style="padding:12px 16px;border-bottom:1px solid #e2e8f0;font-size:15px;color:#333;">
                <a href="mailto:${email}" style="color:#224259;text-decoration:none;font-weight:600;">${email}</a>
              </td>
            </tr>
          </table>

          <div style="margin:24px 0;padding:16px 20px;background-color:#f0f4f8;border-left:4px solid #224259;border-radius:4px;">
            <p style="margin:0 0 6px;font-size:13px;color:#888;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">Message</p>
            <p style="margin:0;line-height:1.6;color:#333;font-size:14px;">${userMessage}</p>
          </div>

          <div style="text-align:center;margin:30px 0 10px;">
            <a href="${env.CLIENT_URL}/admin/messages" style="display:inline-block;background-color:#224259;color:#ffffff;text-decoration:none;padding:12px 32px;border-radius:6px;font-size:15px;font-weight:600;letter-spacing:0.3px;">
              View All Queries
            </a>
          </div>
        </td>
      </tr>

      <!-- FOOTER -->
      <tr>
        <td style="background-color:#224259;padding:20px;text-align:center;color:#cfd8e3;font-size:13px;">
          <p style="margin:0;">&copy; ${new Date().getFullYear()} E-Cell NIT Silchar. All rights reserved.</p>
          <div style="margin-top:8px;">
            <a href="https://www.instagram.com/ecell.nitsilchar" style="margin:0 6px;">
              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Instagram_logo_2016.svg/2048px-Instagram_logo_2016.svg.png" width="20" alt="Instagram" />
            </a>
            <a href="https://www.linkedin.com/company/ecell-nit-silchar" style="margin:0 6px;">
              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/LinkedIn_logo_initials.png/500px-LinkedIn_logo_initials.png" width="20" alt="LinkedIn" />
            </a>
            <a href="https://www.facebook.com/ecell.nit.silchar/" style="margin:0 6px;">
              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/ee/Logo_de_Facebook.png/1028px-Logo_de_Facebook.png" width="20" alt="Facebook" />
            </a>
          </div>
        </td>
      </tr>
    </table>
  </body>
</html>
  `;
};

export const sendQuery = async (req: Request, res: Response) => {
  const parsed = querySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json(parsed.error);
  }

  try {
    const query = await prisma.query.create({
      data: { ...parsed.data, read: false },
    });

    // Send confirmation email to the user
    try {
      await sendEmail({
        email: parsed.data.email,
        subject: 'Thank You for Contacting E-Cell!',
        message: `Dear ${parsed.data.name}, Thank you for reaching out to E-Cell NIT Silchar. We have received your message and will respond shortly.`,
        html: buildUserConfirmationHtml(parsed.data.name, parsed.data.message),
      });
    } catch (emailErr) {
      console.error('Failed to send user confirmation email:', emailErr);
    }

    // Notify admins about the new query
    for (const adminEmail of ADMIN_NOTIFICATION_EMAILS) {
      try {
        await sendEmail({
          email: adminEmail,
          subject: `New Query from ${parsed.data.name}`,
          message: `${parsed.data.name} has sent a query through the website. Message: ${parsed.data.message}. Contact them at ${parsed.data.email}. View all queries at ${env.CLIENT_URL}/admin/messages`,
          html: buildAdminNotificationHtml(
            parsed.data.name,
            parsed.data.email,
            parsed.data.message
          ),
        });
      } catch (emailErr) {
        console.error(
          `Failed to send admin notification to ${adminEmail}:`,
          emailErr
        );
      }
    }

    res.status(201).json({ message: 'Query sent successfully', data: query });
  } catch {
    res.status(500).json({ error: 'Failed to send query' });
  }
};

export const getQueries = async (_req: Request, res: Response) => {
  try {
    const queries = await prisma.query.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(queries);
  } catch {
    res.status(500).json({ error: 'Failed to fetch queries' });
  }
};

export const getQueryById = async (req: Request, res: Response) => {
  try {
    const query = await prisma.query.findUnique({
      where: { id: req.params.id as string },
    });
    if (!query) {
      return res.status(404).json({ error: 'Query not found' });
    }
    res.json(query);
  } catch {
    res.status(500).json({ error: 'Failed to fetch query' });
  }
};

export const markRead = async (req: Request, res: Response) => {
  try {
    const query = await prisma.query.update({
      where: { id: req.params.id as string },
      data: { read: true },
    });
    res.json(query);
  } catch {
    res.status(500).json({ error: 'Failed to mark query as read' });
  }
};

export const markUnread = async (req: Request, res: Response) => {
  try {
    const query = await prisma.query.update({
      where: { id: req.params.id as string },
      data: { read: false },
    });
    res.json(query);
  } catch {
    res.status(500).json({ error: 'Failed to mark query as unread' });
  }
};

export const deleteQuery = async (req: Request, res: Response) => {
  try {
    await prisma.query.delete({
      where: { id: req.params.id as string },
    });
    res.json({ message: 'Query deleted successfully' });
  } catch {
    res.status(500).json({ error: 'Failed to delete query' });
  }
};
