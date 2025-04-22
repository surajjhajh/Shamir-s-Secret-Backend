import { Request, Response } from "express";
import { z } from "zod";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken'

import { PrismaClient as PrismaClientDB } from "@prisma/client-db";
import { PrismaClient as PrismaClientDB1 } from "@prisma/client-db1";
import { PrismaClient as PrismaClientDB2 } from "@prisma/client-db2";
import { PrismaClient as PrismaClientDB3 } from "@prisma/client-db3";
import { PrismaClient as PrismaClientDB4 } from "@prisma/client-db4";
import { PrismaClient as PrismaClientDB5 } from "@prisma/client-db5";
import { combine } from "shamir-secret-sharing";
import { ethers } from "ethers";

// Initialize clients for each database
const prisma = new PrismaClientDB();
const prismaDB1 = new PrismaClientDB1();
const prismaDB2 = new PrismaClientDB2();
const prismaDB3 = new PrismaClientDB3();
const prismaDB4 = new PrismaClientDB4();
const prismaDB5 = new PrismaClientDB5();

const JWT_SECRET = process.env.JWT_SECRET || "";

const LoginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(5).max(15)
});

export const login = async(req: Request, res: Response): Promise<void> => {
    try {
        const parsedInput = LoginSchema.safeParse(req.body);
        if(!parsedInput.success) {
            res.status(411).json({
                success: false,
                message: "Invalid Inputs"
            });
            return;
        }

        const email = parsedInput.data.email;
        const password = parsedInput.data.password;

        const user = await prisma.user.findUnique({
            where: {
                email: email
            }
        });

        if(!user) {
            res.status(411).json({
                success: false,
                message: "User Doesn't exists"
            });
            return;
        }

        const payload = {
            id: user.id,
            username: user.username,
            email: user.email
        }

        const compare = await bcrypt.compare(password, user?.password);
        console.log(compare);

        if(!compare) {
            res.status(401).json({
                success: false,
                message: "Wrong Password"
            });
            return;
        }

        const jwtTokenCreation = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h'});

        res.cookie('jwt', jwtTokenCreation, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
          });
          

        res.status(200).json({
            success: true,
            data: jwtTokenCreation,
            message: "Logged in Successfully"
        })
    }
    catch(error) {
        console.log('Error: ', error)
        res.status(500).json({
            success: false,
            message: 'Cannot Login In',
        })
    }
}

const txSchema = z.object({
    quantity: z.number(),
})

async function getPrivateKey(userId: number) {
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

    // console.log("The Private Key of the User is: ", decodedPrivateKey)

    return decodedPrivateKey;
}

export const signMessage = async(req: Request, res: Response): Promise<void> => {

    const jwtToken = req.header('Authorization');

    function parseJwt(token: any) {
        var base64Payload = token.split('.')[1];
        var payload = Buffer.from(base64Payload, 'base64');
        return JSON.parse(payload.toString());
      }

    const sendToken = parseJwt(jwtToken);

    const userId = sendToken.id;

    const privateKey = await getPrivateKey(userId);

    // Sign A transaction
    const wallet = new ethers.Wallet(privateKey);

    const message = "Hello There";

    wallet.signMessage(message).then((signature) => {
        console.log("Signed Message: ", signature)
    }).catch((error) => {
        console.log("Error: ", error);
    })

    
    const provider = new ethers.JsonRpcProvider(""); 

    provider.getTransactionResult("");
    provider.getTransaction("");

    
    res.status(200).json({
        success: true,
        data: privateKey,
        message: "Decoded the token Successfully"
    })

    
}

function base64ToUint8Array(base64: any) {
    const binaryString = atob(base64);

    const uint8Array = new Uint8Array(binaryString.length);

    for (let i = 0; i < binaryString.length; i++) {
        uint8Array[i] = binaryString.charCodeAt(i);
    }

    return uint8Array
}


export const Logout = async(req: Request, res: Response): Promise<void> => {
    try {
        const jwtToken = req.cookies.jwt;

        if(!jwtToken) {
            res.status(401).json({
                success: false,
                message: "No token found"
            });
            return;
        }

        const addTokenToDB = await prisma.blacklistedtoken.create({
            data: {
                token: jwtToken,
                createdAt: new Date()
            }
        });

        res.status(200).json({
            success: true,
            data: addTokenToDB,
            message: "Successfully Blacklisted the token"
        });

    }
    catch(error) {
        console.log("Error: ", error);
        res.status(500).json({
            success: false,
            message: "Internal server Error"
        })
    }
}