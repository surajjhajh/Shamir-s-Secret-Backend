import express from "express";

import cors from "cors";
import ethereumWalletAPIroutes from "./routes/Routes";
import { createServer } from "http";

import cookieParser from "cookie-parser";

import { PrismaClient as PrismaClientDB } from "@prisma/client-db";
import { PrismaClient as PrismaClientDB1 } from "@prisma/client-db1";
import { PrismaClient as PrismaClientDB2 } from "@prisma/client-db2";
import { PrismaClient as PrismaClientDB3 } from "@prisma/client-db3";
import { PrismaClient as PrismaClientDB4 } from "@prisma/client-db4";
import { PrismaClient as PrismaClientDB5 } from "@prisma/client-db5";

// Initialize clients for each database
const prisma = new PrismaClientDB();
const prismaDB1 = new PrismaClientDB1();
const prismaDB2 = new PrismaClientDB2();
const prismaDB3 = new PrismaClientDB3();
const prismaDB4 = new PrismaClientDB4();
const prismaDB5 = new PrismaClientDB5();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cookieParser());

app.use(
  cors({
    origin: "http://localhost:3000", // Allow all origins (use specific domains in production for better security)
    // origin: "*", // Allow all origins (use specific domains in production for better security)
    // methods: ["GET", "POST", "PUT", "DELETE"], // Allow specific HTTP methods
    // allowedHeaders: ["Content-Type", "Authorization"], // Allow specific headers
    credentials: true,
  })
);

app.use(express.json());
app.use("/api/v1", ethereumWalletAPIroutes);
const server = createServer(app);

const dbConnect = async () => {
  try {
    await prisma.$connect();
    await prismaDB1.$connect();
    await prismaDB2.$connect();
    await prismaDB3.$connect();
    await prismaDB4.$connect();
    await prismaDB5.$connect();

    console.log("Connected to the database");
  } catch (error) {
    console.log("Database connection error: ", error);
    process.exit(1);
  }
};

dbConnect();

server.listen(PORT, () => {
  console.log(`Server started successfully at ${PORT}`);
});

process.on("beforeExit", async () => {
  await prisma.$disconnect();
  await prismaDB1.$disconnect();
  await prismaDB2.$disconnect();
  await prismaDB3.$disconnect();
  await prismaDB4.$disconnect();
  await prismaDB5.$disconnect();

  console.log("Disconnected from database");
});

process.on("SIGINT", async () => {
  await prisma.$disconnect();
  await prismaDB1.$disconnect();
  await prismaDB2.$disconnect();
  await prismaDB3.$disconnect();
  await prismaDB4.$disconnect();
  await prismaDB5.$disconnect();

  console.log("Disconnected from database");
  process.exit(0);
});
