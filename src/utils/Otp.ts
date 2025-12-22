import { Request, Response, NextFunction } from "express";
import sendEmail from "./SendEmail";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const sendOtp = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    
    // Generate 6 digit OTP
    let otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`OTP for ${email} is ${otp}`);

    // Delete any old OTPs for this email
    const otpPrev = await prisma.otp.deleteMany({
      where: {
        email
      }
    });
    console.log("Deleted previous OTPs:", otpPrev);

    // Create new OTP
    const otpSent = await prisma.otp.create({
      data: {
        email,
        otp,
      },
    });

    if (!otpSent) {
      res.status(400).json({ message: "OTP not sent" });
      return;
    }

    // Send Email
    sendEmail(email, "OTP for verification", `Your OTP is ${otp}. It will expire in 5 minutes.`, "");
    
    res.status(200).json({ message: "OTP sent successfully" });

    // Auto-delete after 5 minutes
    setTimeout(async () => {
      const otpData = await prisma.otp.findFirst({
        where: { email },
      });
      if (!otpData) return;
      
      await prisma.otp.deleteMany({
        where: { id: otpSent.id },
      });
    }, 60000 * 5);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const verifyOtp = async (req: Request, res: Response, next: NextFunction) => {
  const { email, otp } = req.body;
  try {
    console.log(`Verifying OTP for ${email}: ${otp}`);
    
    const otpData = await prisma.otp.findFirst({
      where: { email },
    });

    if (!otpData) {
      // Changed to return to avoid 'void' conflict in Express types
      res.status(400).json({ message: "OTP not found or expired" });
      return; 
    }

    if (otpData.otp !== otp) {
      res.status(400).json({ message: "OTP not matched" });
      return;
    }

    // OTP Matched - Delete it so it can't be used again
    if (otpData.otp === otp) {
      await prisma.otp.delete({
        where: { id: otpData.id },
      });
    }
    
    next(); // Proceed to the controller
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};