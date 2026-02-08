// import { Request, Response, NextFunction } from 'express';
// import { sendEmail } from './email';
// import { PrismaClient } from '@prisma/client';
// import { setTimeout } from 'timers';

// const prisma = new PrismaClient();

// export const sendOtp = async (req: Request, res: Response) => {
//   try {
//     const { email } = req.body;

//     // Generate 6 digit OTP
//     let otp = Math.floor(100000 + Math.random() * 900000).toString();
//     console.log(`OTP for ${email} is ${otp}`);

//     // Delete any old OTPs for this email
//     const otpPrev = await prisma.otp.deleteMany({
//       where: {
//         email,
//       },
//     });
//     console.log('Deleted previous OTPs:', otpPrev);

//     // Create new OTP
//     const otpSent = await prisma.otp.create({
//       data: {
//         email,
//         otp,
//       },
//     });

//     if (!otpSent) {
//       res.status(400).json({ message: 'OTP not sent' });
//       return;
//     }

//     // Send Email
//     sendEmail(
//       email,
//       'OTP for verification',
//       `Your OTP is ${otp}. It will expire in 5 minutes.`,
//       ''
//     );

//     res.status(200).json({ message: 'OTP sent successfully' });

//     // Auto-delete after 5 minutes
//     setTimeout(async () => {
//       const otpData = await prisma.otp.findFirst({
//         where: { email },
//       });
//       if (!otpData) return;

//       await prisma.otp.deleteMany({
//         where: { id: otpSent.id },
//       });
//     }, 60000 * 5);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Internal server error' });
//   }
// };

// export const verifyOtp = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   const { email, otp } = req.body;
//   try {
//     console.log(`Verifying OTP for ${email}: ${otp}`);

//     const otpData = await prisma.otp.findFirst({
//       where: { email },
//     });

//     if (!otpData) {
//       // Changed to return to avoid 'void' conflict in Express types
//       res.status(400).json({ message: 'OTP not found or expired' });
//       return;
//     }

//     if (otpData.otp !== otp) {
//       res.status(400).json({ message: 'OTP not matched' });
//       return;
//     }

//     // OTP Matched - Delete it so it can't be used again
//     if (otpData.otp === otp) {
//       await prisma.otp.delete({
//         where: { id: otpData.id },
//       });
//     }

//     next(); // Proceed to the controller
//   } catch (error) {
//     console.log(error);
//     res.status(500).json({ message: 'Internal server error' });
//   }
// };

import { Request, Response } from 'express';
import { sendEmail } from './email';
import { PrismaClient } from '@prisma/client';

import { setTimeout } from 'timers';

const prisma = new PrismaClient();

export const generateOtp = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const deletePreviousOtps = async (email: string) => {
  return prisma.otp.deleteMany({ where: { email } });
};

const createOtp = async (email: string, otp: string) => {
  return prisma.otp.create({
    data: { email, otp },
  });
};

export const buildOtpEmailHtml = (otp: string): string => {
  return `
  <!DOCTYPE html>
<html lang="en" style="margin:0;padding:0;">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>OTP Verification</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f4f6f9;font-family:'Poppins',Arial,Helvetica,sans-serif;">
    <table align="center" width="100%" cellpadding="0" cellspacing="0" role="presentation"
      style="max-width:600px;margin:auto;background-color:#ffffff;border-radius:10px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.08);">
      
      <!-- HEADER -->
      <tr>
        <td style="background-color:#224259;text-align:center;padding:24px 16px;">
          <img src="https://res.cloudinary.com/ecell/image/upload/v1762102444/ecell-logo-bw2_sayvqp_htrv0f.png" alt="E-Cell NIT Silchar" width="60" style="margin-bottom:10px;">
          <h2 style="color:#ffffff;margin:0;font-size:20px;letter-spacing:0.5px;">E-Cell NIT Silchar</h2>
          <p style="color:#cfd8e3;margin:5px 0 0;font-size:14px;">OTP Verification</p>
        </td>
      </tr>

      <!-- BODY -->
      <tr>
        <td style="padding:32px 40px;color:#1a1a1a;text-align:center;">
          <h3 style="color:#224259;margin-top:0;">Verify Your Email</h3>
          <p style="line-height:1.6;color:#333;font-size:15px;">
            Use the following One-Time Password (OTP) to verify your email address.
          </p>
          <div style="margin:30px auto;width:max-content;background-color:#224259;color:#ffffff;font-size:28px;letter-spacing:4px;padding:12px 32px;border-radius:8px;font-weight:600;">
            ${otp}
          </div>
          <p style="line-height:1.6;color:#555;font-size:14px;">
            This OTP will expire in <strong>5 minutes</strong>. Please do not share it with anyone.
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
</html>
  `;
};

const sendOtpEmail = async (email: string, otp: string, html: string) => {
  return sendEmail({
    email,
    subject: 'OTP for verification',
    message: `Your OTP is ${otp}. It will expire in 5 minutes.`,
    html,
  });
};

export const isOtpExpired = (createdAt: Date): boolean => {
  return Date.now() - new Date(createdAt).getTime() > 5 * 60 * 1000;
};

export const sendOtp = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    const otp = generateOtp();
    console.log(`OTP for ${email} is ${otp}`);

    await deletePreviousOtps(email);

    const otpSent = await createOtp(email, otp);
    if (!otpSent) {
      res.status(400).json({ message: 'OTP not sent' });
      return;
    }

    const html = buildOtpEmailHtml(otp);

    try {
      await sendOtpEmail(email, otp, html);
    } catch (error) {
      console.error('Error sending email for OTP:', error);
    }

    res.status(200).json({ message: 'OTP sent successfully' });

    // Auto-expire after 5 minutes (same logic kept)
    setTimeout(async () => {
      const otpData = await prisma.otp.findFirst({ where: { email } });
      if (!otpData) return;

      await prisma.otp.deleteMany({ where: { id: otpSent.id } });
    }, 60000 * 5);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const verifyOtp = async (req: Request, res: Response) => {
  const { email, otp } = req.body;

  try {
    const otpData = await prisma.otp.findFirst({ where: { email } });

    if (!otpData) {
      res.status(400).json({ message: 'OTP not found' });
      return;
    }

    if (otpData.otp !== otp) {
      res.status(400).json({ message: 'OTP not matched' });
      return;
    }

    await prisma.otp.delete({ where: { id: otpData.id } });

    res.status(200).json({ message: 'OTP verified successfully' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
