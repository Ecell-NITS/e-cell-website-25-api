import { Request, Response } from 'express';
import prisma from '../../../prisma/client';
import { sendEmail } from '../../utils/email';

interface TeamMember {
  name: string;
  phone: string;
  email?: string;
  scholarId?: string;
}

// ===============================
// CREATE APPLICATION
// ===============================
export const createBusinessHackathonApplication = async (
  req: Request,
  res: Response
) => {
  const {
    teamName,
    teamLeaderName,
    teamLeaderEmail,
    teamLeaderPhone,
    teamLeaderScholarId,
    collegeType,
    collegeName,
    department,
    year,
    teamMembers,
  } = req.body;

  try {
    // Validate required fields
    if (!teamName || !teamLeaderName || !teamLeaderEmail || !teamLeaderPhone) {
      return res.status(400).json({ message: 'Required fields are missing.' });
    }
    // Prevent duplicate leader
    const existing = await prisma.businessHackathon.findFirst({
      where: { teamLeaderEmail },
    });

    if (existing) {
      return res.status(400).json({
        message: 'You have already registered for this event.',
      });
    }

    // Collect all members (leader + team)
    const allMembers: TeamMember[] = [
      {
        name: teamLeaderName,
        phone: teamLeaderPhone,
        email: teamLeaderEmail,
      },
      ...teamMembers.map((member: TeamMember) => ({
        name: member.name,
        phone: member.phone,
        email: member.email || null,
      })),
    ];

    // Check member conflicts
    const conflicts = await prisma.businessHackathonMembers.findMany({
      where: {
        memberPhone: {
          in: allMembers.map(m => m.phone),
        },
      },
    });

    if (conflicts.length > 0) {
      return res.status(400).json({
        message: `Member with phone ${conflicts[0].memberPhone} already registered in team ${conflicts[0].teamName}`,
      });
    }

    // Transaction
    const newApp = await prisma.$transaction(async tx => {
      const createdApp = await tx.businessHackathon.create({
        data: {
          teamName,
          teamLeaderName,
          teamLeaderEmail,
          teamLeaderPhone,
          teamLeaderScholarId:
            collegeType === 'nit_silchar' ? teamLeaderScholarId : null,
          collegeType,
          collegeName: collegeType === 'other' ? collegeName : null,
          department,
          year,
          teamMembers: teamMembers.map((m: TeamMember) => ({
            name: m.name,
            phone: m.phone,
            scholarId: collegeType === 'nit_silchar' ? m.scholarId : null,
          })),
        },
      });

      await tx.businessHackathonMembers.createMany({
        data: allMembers.map(m => ({
          memberName: m.name,
          memberPhone: m.phone,
          memberEmail: m.email || null,
          teamName,
        })),
      });

      return createdApp;
    });

    // Email
    if (newApp) {
      const subject = 'Business Hackathon Registration Successful';
      const text = `Thank you for registering for the Business Hackathon! Your team "${teamName}" has been successfully registered.
      We've received your registration and will get back to you soon with further details.
      Meanwhile, you can join our WhatsApp group for updates:
      <a href="https://chat.whatsapp.com/IWEUUgfo7vNA4HLjuJcvFk">Join Group</a>
      Best of luck. E-Cell NIT SilcharTeam`;
      const html = `
<!DOCTYPE html>
<html lang="en" style="margin:0;padding:0;">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Business Hackathon Registration</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f4f6f9;font-family:'Poppins',Arial,Helvetica,sans-serif;">
    <table align="center" width="100%" cellpadding="0" cellspacing="0" role="presentation"
      style="max-width:600px;margin:auto;background-color:#ffffff;border-radius:10px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.08);">
      
      <!-- HEADER -->
      <tr>
        <td style="background-color:#224259;text-align:center;padding:24px 16px;">
          <img src="https://res.cloudinary.com/ecell/image/upload/v1762102444/ecell-logo-bw2_sayvqp_htrv0f.png" alt="E-Cell NIT Silchar" width="60" style="margin-bottom:10px;">
          <h2 style="color:#ffffff;margin:0;font-size:20px;letter-spacing:0.5px;">E-Cell NIT Silchar</h2>
          <p style="color:#cfd8e3;margin:5px 0 0;font-size:14px;">Business Hackathon 2025</p>
        </td>
      </tr>

      <!-- BODY -->
      <tr>
        <td style="padding:32px 40px;color:#1a1a1a;">
          <h3 style="color:#224259;margin-top:0;">Thank you for registering!</h3>
          <p style="line-height:1.6;color:#333;">
            Dear Participant,
          </p>
          <p style="line-height:1.6;color:#333;">
            Your team <strong>"${teamName}"</strong> has been successfully registered for the
            <strong>Business Hackathon</strong>.
          </p>
          <p style="line-height:1.6;color:#333;">
            We’ve received your registration and will get back to you soon with event details, timelines, and next steps.
          </p>

          <div style="margin:30px 0;text-align:center;">
            <a href="https://chat.whatsapp.com/IWEUUgfo7vNA4HLjuJcvFk"
              style="background-color:#224259;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:6px;display:inline-block;font-weight:500;">
              Join WhatsApp Group
            </a>
          </div>

          <p style="line-height:1.6;color:#333;">
            Meanwhile, stay connected and follow our updates on social media!
          </p>

          <p style="margin-top:30px;line-height:1.6;color:#333;">
            <strong>Best of luck,</strong><br/>
            Team E-Cell NIT Silchar
          </p>
        </td>
      </tr>

      <!-- FOOTER -->
      <tr>
        <td style="background-color:#224259;padding:20px;text-align:center;color:#cfd8e3;font-size:13px;">
          <p style="margin:0;">© ${new Date().getFullYear()} E-Cell NIT Silchar. All rights reserved.</p>
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
</html>`;

      try {
        await sendEmail({
          email: teamLeaderEmail,
          subject,
          message: text,
          html,
        });
      } catch (error) {
        console.error(
          'Error sending email for Business Hackathon Registration:',
          error
        );
      }

      res.status(200).json({
        message: 'Registration submitted successfully!',
        registration: newApp,
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Something went wrong!',
      error: String(error),
    });
  }
};

// Fetch all business hackathon applications
export const getBusinessHackathonApplications = async (
  req: Request,
  res: Response
) => {
  try {
    const applications = await prisma.businessHackathon.findMany();
    res.json(applications);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch applications.' });
  }
};

// Check if a user has already applied
export const checkBusinessHackathonApplication = async (
  req: Request,
  res: Response
) => {
  const { email } = req.body;

  try {
    const app = await prisma.businessHackathon.findFirst({
      where: { teamLeaderEmail: email },
    });
    res.json(app);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error checking application.' });
  }
};

export const getSingleBusinessHackathonApplication =
  checkBusinessHackathonApplication;

// Legacy exports
export const getBusinessHackathonTeams = getBusinessHackathonApplications;
export const createBusinessHackathon = createBusinessHackathonApplication;
export const checkBusinessHackathon = checkBusinessHackathonApplication;
export const getSingleBusinessHackathon = getSingleBusinessHackathonApplication;
