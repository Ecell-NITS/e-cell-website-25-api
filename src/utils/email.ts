// src/utils/email.ts
import nodemailer from 'nodemailer';
import { env } from '../config/env';

export const sendEmail = async (options: { email: string; subject: string; message: string }) => {
  const transporter = nodemailer.createTransport({
    service: 'Gmail', 
    auth: {
      user: env.EMAIL_USER, 
      pass: env.EMAIL_PASS, 
    },
  });

  const mailOptions = {
    from: `"E-Cell Support" <${env.EMAIL_USER}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
  };

  await transporter.sendMail(mailOptions);
};