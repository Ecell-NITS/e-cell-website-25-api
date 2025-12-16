import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const getAllAccounts = async (req: Request, res: Response) => {
  try {
    const accounts = await prisma.account.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    return res.status(200).json({
      message: 'All accounts fetched successfully',
      data: accounts,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: 'Internal server error',
    });
  }
};

export const makeAdmin = async (req: Request, res: Response) => {
  try {
    const { email } = req.params;

    if (!email) {
      return res.status(400).json({
        message: 'Email is required',
      });
    }

    const account = await prisma.account.findUnique({
      where: { email },
    });

    if (!account) {
      return res.status(404).json({
        message: 'Account not found',
      });
    }

    const updatedAccount = await prisma.account.update({
      where: { email },
      data: {
        role: 'admin',
      },
    });

    return res.status(200).json({
      message: 'User promoted to admin successfully',
      data: updatedAccount,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: 'Internal server error',
    });
  }
};

export const makeClient = async (req: Request, res: Response) => {
  try {
    const { email } = req.params;

    if (!email) {
      return res.status(400).json({
        message: 'Email is required',
      });
    }

    const account = await prisma.account.findUnique({
      where: { email },
    });

    if (!account) {
      return res.status(404).json({
        message: 'Account not found',
      });
    }

    const updatedAccount = await prisma.account.update({
      where: { email },
      data: {
        role: 'client',
      },
    });

    return res.status(200).json({
      message: 'User role changed to client successfully',
      data: updatedAccount,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: 'Internal server error',
    });
  }
};
