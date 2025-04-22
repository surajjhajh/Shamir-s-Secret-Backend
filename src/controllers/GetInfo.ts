import { Request, Response } from "express";
import { PrismaClient as PrismaClientDB } from "@prisma/client-db";
const prisma = new PrismaClientDB();

export const getPublicKeyAndAddress = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userIdToFind = req.user.id;

  try {
    const publicKey = await prisma.wallet.findFirst({
      where: {
        userId: userIdToFind,
      },
    });
    
    res.status(200).json({
      success: true,
      data: publicKey,
      message: "Successfully fetched the wallet",
    });
  } catch (error) {
    res.status(500).json({
      success: true,
      Error: error,
      message: "Errors fetching Wallet",
    });
  }
};
