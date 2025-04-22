import { NextFunction, Request, Response } from "express";
import jwt, { Secret, JwtPayload } from "jsonwebtoken";
import { PrismaClient as PrismaClientDB } from "@prisma/client-db";
const prisma = new PrismaClientDB();

const JWT_SECRET = process.env.JWT_SECRET || "";

export const Authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const jwtToken = req.cookies.jwt;

  if (!jwtToken) {
    res.status(420).json({
      success: false,
      message: "No Cookie Found",
      redirect: "/login",
    });
    return;
  }

  try {
    const decoded = jwt.verify(jwtToken, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(411).json({
      success: false,
      message: "Error Verifying JWT Token",
    });
  }
};

export const verifyIfBlackListedToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | undefined> => {
  try {
    const jwtToken = req.cookies.jwt;

    if (!jwtToken) {
      res.status(401).json({
        success: false,
        message: "No Cookie Found",
      });
      return
    }

    const searchInDB = await prisma.blacklistedtoken.findFirst({
      where: {
        token: jwtToken,
      },
    });

    if (!searchInDB) {
      next();
      return;
    }

    res.status(200).json({
      success: true,
      message: "Token is blacklisted",
      redirect: "/login",
    });
    return;
  } catch (error) {
    res.status(411).json({
      success: false,
      message: "Error Verifying JWT Token",
    });
  }
};
