import nodemailer from "nodemailer";
import { env } from "../config/env"; // Adapting import to your env config

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: env.EMAIL_USERNAME, // Using your env variable names
    pass: env.EMAIL_PASSWORD,
  },
});

const sendEmail = (to: string, subject: string, text: string, html: string) => {
  const mailOptions = {
    from: env.EMAIL_USERNAME,
    to: to,
    subject: subject,
    text: text,
    html: html
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log("Error sending email:", error);
    } else {
      console.log("Email sent:", info.response);
    }
  });
};

export default sendEmail;