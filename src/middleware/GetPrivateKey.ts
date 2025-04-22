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

export async function getPrivateKey(userId: number) {
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

    console.log("The Private Key of the User is: ", decodedPrivateKey)

    return decodedPrivateKey;
}


function base64ToUint8Array(base64: any) {
    const binaryString = atob(base64);

    const uint8Array = new Uint8Array(binaryString.length);

    for (let i = 0; i < binaryString.length; i++) {
        uint8Array[i] = binaryString.charCodeAt(i);
    }

    return uint8Array
}