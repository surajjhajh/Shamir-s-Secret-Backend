// types.d.ts
import { JwtPayload } from "jsonwebtoken";
import "express";

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}
