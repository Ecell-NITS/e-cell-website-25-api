import { Request, Response } from 'express';
import prisma from '../../utils/prisma';
import { sendEmail } from '../../utils/email';

// interface TeamMember {
//   name: string;
//   phone: string;
//   email?: string;
//   scholarId?: string;
// }

// Fetch all Adovation applications
export const getAdovationApplications = async (req: Request, res: Response) => {
  try {
    const applications = await prisma.adovation.findMany();
    res.json(applications);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch applications.' });
  }
};

// Create a new Adovation application
export const createAdovationApplication = async (
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

  // try {
  //   // Validate required fields
  //   if (!teamName || !teamLeaderName || !teamLeaderEmail || !teamLeaderPhone) {
  //     return res.status(400).json({ message: 'Required fields are missing.' });
  //   }

  //   // Validate college information
  //   if (collegeType === 'other' && !collegeName) {
  //     return res.status(400).json({ message: 'College name is required for external colleges.' });
  //   }

  //   if (collegeType === 'nit_silchar' && !teamLeaderScholarId) {
  //     return res.status(400).json({ message: 'Scholar ID is required for NIT Silchar students.' });
  //   }

  //   // Email validation
  //   const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  //   if (!emailRegex.test(teamLeaderEmail)) {
  //     return res.status(400).json({ message: 'Please enter a valid email address.' });
  //   }

  //   // Phone validation
  //   if (teamLeaderPhone.length !== 10) {
  //     return res.status(400).json({ message: 'Please enter a valid 10-digit phone number.' });
  //   }

  //   // Team size validation (3-6 members including leader)
  //   if (!teamMembers || teamMembers.length < 2 || teamMembers.length > 5) {
  //     return res.status(400).json({ message: 'Team must have 3-6 members (including leader).' });
  //   }

  //   // Validate team members
  //   for (const member of teamMembers) {
  //     if (!member.name || !member.phone) {
  //       return res.status(400).json({ message: 'All team members must have name and phone.' });
  //     }
  //     if (collegeType === 'nit_silchar' && !member.scholarId) {
  //       return res
  //         .status(400)
  //         .json({ message: 'Scholar ID is required for all NIT Silchar team members.' });
  //     }
  //   }

  // Prevent duplicate submissions
  const existing = await prisma.adovation.findFirst({
    where: { teamLeaderEmail },
  });

  if (existing) {
    return res
      .status(400)
      .json({ message: 'You have already registered for this event.' });
  }

  // Check if any team member (including leader) is already registered for this event
  const allMembers = [
    { name: teamLeaderName, phone: teamLeaderPhone, email: teamLeaderEmail },
    ...teamMembers,
  ];

  // const existingMembers = await prisma.adovationMembers.findMany({
  //   where: {
  //     memberPhone: { in: allMembers.map(m => m.phone) },
  //   },
  // });

  // if (existingMembers.length > 0) {
  //   const conflict = existingMembers[0];
  //   return res.status(400).json({
  //     message: `Member with mobile number "${conflict.memberPhone}" is already registered with team "${conflict.teamName}".`,
  //   });
  // }

  const conflicts = await prisma.adovationMembers.findMany({
    where: {
      memberPhone: {
        in: allMembers.map((m: { phone: string }) => m.phone),
      },
    },
  });

  if (conflicts.length > 0) {
    return res.status(400).json({
      message: `Member ${conflicts[0].memberPhone} already registered in team ${conflicts[0].teamName}`,
    });
  }

  // Create a new application entry
  const newApp = await prisma.$transaction(async tx => {
    const createdApp = await tx.adovation.create({
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
        teamMembers,
      },
    });

    await tx.adovationMembers.createMany({
      data: allMembers.map(
        (m: { name: string; phone: string; email?: string }) => ({
          memberName: m.name,
          memberPhone: m.phone,
          memberEmail: m.email || null,
          teamName,
        })
      ),
    });

    return createdApp;
  });

  if (newApp) {
    // Store all team members in the AdovationMembers collection
    const subject = 'Adovation Registration Successful';
    const text = `Thank you for registering for Adovation! Your team "${teamName}" has been successfully registered.
      We've received your registration and will get back to you soon with further details.
      Meanwhile, you can join our WhatsApp group for updates:
      <a href="https://chat.whatsapp.com/Bu9slXJZwgUJxoorSpnv5v">Join Group</a>
      Best of luck.E-Cell NIT SilcharTeam`;
    const html = `
<!DOCTYPE html>
<html lang="en" style="margin:0;padding:0;">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Adovation Registration</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f4f6f9;font-family:'Poppins',Arial,Helvetica,sans-serif;">
    <table align="center" width="100%" cellpadding="0" cellspacing="0" role="presentation"
      style="max-width:600px;margin:auto;background-color:#ffffff;border-radius:10px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.08);">
      
      <!-- HEADER -->
      <tr>
        <td style="background-color:#224259;text-align:center;padding:24px 16px;">
          <img src="https://res.cloudinary.com/ecell/image/upload/v1762102444/ecell-logo-bw2_sayvqp_htrv0f.png" alt="E-Cell NIT Silchar" width="60" style="margin-bottom:10px;">
          <h2 style="color:#ffffff;margin:0;font-size:20px;letter-spacing:0.5px;">E-Cell NIT Silchar</h2>
          <p style="color:#cfd8e3;margin:5px 0 0;font-size:14px;">Adovation 2025</p>
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
            <strong>Adovation</strong>.
          </p>
          <p style="line-height:1.6;color:#333;">
            We've received your registration and will get back to you soon with event details, timelines, and next steps.
          </p>

          <div style="margin:30px 0;text-align:center;">
            <a href="https://chat.whatsapp.com/Bu9slXJZwgUJxoorSpnv5v"
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
      await sendEmail({ email: teamLeaderEmail, subject, message: text, html });
    } catch (emailError) {
      console.error(
        'Error sending email for Adovation Registration:',
        emailError
      );
    }

    res.status(200).json({
      message: 'Registration submitted successfully!',
      registration: newApp,
    });
  }
  // } catch (error) {
  //   console.error(error);
  //   res.status(500).json({ message: 'Something went wrong!' });
  // }
};

// Check if a user has already applied
export const checkAdovationApplication = async (
  req: Request,
  res: Response
) => {
  const { email } = req.body;

  try {
    const app = await prisma.adovation.findFirst({
      where: { teamLeaderEmail: email },
    });
    res.json(app);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error checking application.' });
  }
};

// Get a single application by email
export const getSingleAdovationApplication = async (
  req: Request,
  res: Response
) => {
  const { email } = req.body;

  try {
    const app = await prisma.adovation.findFirst({
      where: { teamLeaderEmail: email },
    });
    res.json(app);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching application.' });
  }
};
