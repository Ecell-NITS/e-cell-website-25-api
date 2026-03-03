import { BrevoClient } from '@getbrevo/brevo';
import { env } from '../config/env';

// Initialize Brevo client
const brevo = new BrevoClient({ apiKey: env.BREVO_API_KEY });

interface EmailOptions {
  email: string;
  subject: string;
  message: string;
  html?: string;
}

export const sendEmail = async (options: EmailOptions) => {
  const response = await brevo.transactionalEmails.sendTransacEmail({
    sender: { name: 'ECELL NIT Silchar', email: env.BREVO_EMAIL },
    to: [{ email: options.email }],
    subject: options.subject,
    textContent: options.message,
    htmlContent: options.html || options.message,
  });

  if (env.NODE_ENV === 'development') {
    console.log(`📧 Email sent to ${options.email}`, response.messageId);
  }
};
