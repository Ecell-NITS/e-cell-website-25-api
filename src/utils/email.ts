import nodemailer from 'nodemailer';
import { env } from '../config/env';

interface EmailOptions {
  email: string;
  subject: string;
  message: string;
  html?: string;
}

export const sendEmail = async (options: EmailOptions) => {
  // 1. Create a Transporter
  const transporter = nodemailer.createTransport({
    host: env.EMAIL_HOST || 'smtp.mailtrap.io',
    port: Number(env.EMAIL_PORT) || 2525,
    auth: {
      user: env.EMAIL_USERNAME,
      pass: env.EMAIL_PASSWORD,
    },
  });

  // 2. Define Email Options
  const mailOptions = {
    from: `"E-Cell Support" <${env.EMAIL_USERNAME}>`,

    to: options.email,

    subject: options.subject,
    text: options.message,
    html: options.html,
  };

  // 3. Send Email
  await transporter.sendMail(mailOptions); // Remove try-catch, let caller handle errors

  if (env.NODE_ENV === 'development') {
    console.log(`📧 Email sent to ${options.email}`);
  }
};
