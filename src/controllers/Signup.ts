import { Request, Response } from "express";
import { z } from "zod";
import bcrypt from "bcrypt";
import dotenv from "dotenv";

import { generateMnemonic, mnemonicToSeedSync } from "bip39";
import { HDNodeWallet } from "ethers";
import { split, combine } from "shamir-secret-sharing";

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

dotenv.config();

const SignUpUserSchema = z.object({
  username: z.string().min(2).max(20),
  email: z.string().email(),
  password: z.string().min(5).max(20),
});

export const Signup = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsedInput = SignUpUserSchema.safeParse(req.body);
    if (!parsedInput.success) {
      res.status(411).json({
        error: parsedInput.error,
      });
      return;
    }

    const username = parsedInput.data.username;
    const email = parsedInput.data.email;
    const password = parsedInput.data.password;

    const hashedPassword = await bcrypt.hash(password, 10);

    const mnemonic = generateMnemonic();
    const seedPhrase = mnemonicToSeedSync(mnemonic);

    const path = "m/44'/60'/0'/0/0";

    const hdNode = HDNodeWallet.fromSeed(seedPhrase);
    const childNode = hdNode.derivePath(path);
    const ethAddress = childNode.address;
    const privateKey = childNode.privateKey;
    const publicKey = childNode.publicKey;

    // Shamir's Secret Logic

    const encoder = new TextEncoder();
    const privateKeyUint8Array = encoder.encode(privateKey);

    const [share1, share2, share3, share4, share5] = await split(
      privateKeyUint8Array,
      5,
      3
    );

    const share1String = Buffer.from(share1).toString("base64");
    const share2String = Buffer.from(share2).toString("base64");
    const share3String = Buffer.from(share3).toString("base64");
    const share4String = Buffer.from(share4).toString("base64");
    const share5String = Buffer.from(share5).toString("base64");

    const response = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
      },
    });

    const wallet = await prisma.wallet.create({
      data: {
        userId: response.id,
        publicKey,
        ethereumAddress: ethAddress
      }
    })

    const share1Save = await prismaDB1.keyShare1.create({
      data: {
        userId: response.id,
        share: share1String,
      },
    });

    const share2Save = await prismaDB2.keyShare2.create({
      data: {
        userId: response.id,
        share: share2String,
      },
    });

    const share3Save = await prismaDB3.keyShare3.create({
      data: {
        userId: response.id,
        share: share3String,
      },
    });

    const share4Save = await prismaDB4.keyShare4.create({
      data: {
        userId: response.id,
        share: share4String,
      },
    });

    const share5Save = await prismaDB5.keyShare5.create({
      data: {
        userId: response.id,
        share: share5String,
      },
    });

    res.status(200).json({
      success: true,
      data: response,
      anotherData: wallet,
      message: "Signed Up Successfully"
    })
  } catch (error) {
    console.log("Error: ", error);
  }
};

// Sample code to get the Private Key
const userIdSchema = z.object({
  userId: z.number()
});

  export const getPrivateKey = async(req: Request, res: Response): Promise<void> => {
  try {
    const parsedInput = userIdSchema.safeParse(req.body);2

    const userId = parsedInput.data?.userId

    const share1String = await prismaDB1.keyShare1.findFirst({
      where: {
        userId: userId
      }
    });

    const share2String = await prismaDB2.keyShare2.findFirst({
      where: {
        userId: userId
      }
    });

    const share3String = await prismaDB3.keyShare3.findFirst({
      where: {
        userId: userId
      }
    });

    const share4String = await prismaDB4.keyShare4.findFirst({
      where: {
        userId: userId
      }
    });

    const share5String = await prismaDB5.keyShare5.findFirst({
      where: {
        userId: userId
      }
    });

    const share1 = base64ToUint8Array(share1String?.share);
    const share2 = base64ToUint8Array(share2String?.share);
    const share3 = base64ToUint8Array(share3String?.share);
    const share4 = base64ToUint8Array(share4String?.share);
    const share5 = base64ToUint8Array(share5String?.share);

    const privateKey = await combine([share1, share2, share3, share4, share5]);

    const decoder = new TextDecoder();
    const decodedPrivateKey = decoder.decode(privateKey);

    console.log(decodedPrivateKey)

    res.status(200).json({
      success: true,
      data: decodedPrivateKey,
      message: "Private Key Fetched Successfully"
    })


  } catch (error) {
    console.log("Error: ", error);
  }
}

function base64ToUint8Array(base64: any) {
  // Decode the base64 string to a binary string
  const binaryString = atob(base64);
  
  // Create a Uint8Array with the length of the binary string
  const uint8Array = new Uint8Array(binaryString.length);

  // Populate the Uint8Array with the character codes of each character in the binary string
  for (let i = 0; i < binaryString.length; i++) {
    uint8Array[i] = binaryString.charCodeAt(i);
  }

  return uint8Array;
}