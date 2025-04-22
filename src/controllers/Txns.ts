import { Request, Response } from "express";
import { z } from "zod";
import { ethers } from "ethers";
import { PrismaClient as PrismaClientDB } from "@prisma/client-db";
import { getPrivateKey } from "../middleware/GetPrivateKey";
const prisma = new PrismaClientDB();

declare global {
  namespace Express {
      interface Request {
          user?: any;
      }
  }
}

const RPC_URL = process.env.RPC_URL || "";

const sendTxnSchema = z.object({
  toAddress: z.string(),
  valueEthToSend: z.string(),
});

export const sendTxn = async (req: Request, res: Response): Promise<void> => {
  const parsedInput = sendTxnSchema.safeParse(req.body);
  if (!parsedInput.success) {
    res.status(401).json({
      success: false,
      message: "Invalid Inputs",
    });

    return;
  }

  const toAddress = parsedInput.data.toAddress;
  const ethValue = parsedInput.data.valueEthToSend;

  const userId = req.user.id

  const privateKey = await getPrivateKey(userId);

  const providers = new ethers.JsonRpcProvider(
    `${RPC_URL}`
  );

  // Sign a transaction
  const wallet = new ethers.Wallet(privateKey, providers);
  const ethAddress = wallet.getAddress();

  const publicKey = wallet.signingKey.publicKey;

  const ethValueToSend = ethers.parseUnits(ethValue, 18);

  const nonce = await wallet.getNonce();

  try {
    const sendTransaction = await wallet.sendTransaction({
      type: 2,
      to: toAddress,
      from: ethAddress,
      nonce: nonce,
      gasLimit: 21000,
      maxPriorityFeePerGas: 2000000000,
      maxFeePerGas: 20000000000,
      value: ethValueToSend,
      chainId: 11155111,
      data: "0x",
      accessList: [],
      blockTag: "latest",
      enableCcipRead: false,
      blobVersionedHashes: null,
      maxFeePerBlobGas: null,
      blobs: null,
      kzg: null,
    });

    const txHash = sendTransaction.hash;

    // Add the transaction hash in the array
    const userTxns = await prisma.transactionHash.findFirst({
      where: {
        userId: userId,
      },
      select: {
        txHash: true,
        id: true,
      },
    });

    if (userTxns) {
      const updatedArray = [...userTxns.txHash, txHash];

      await prisma.transactionHash.update({
        where: {
          id: userTxns.id,
        },
        data: {
          txHash: updatedArray,
        },
      });
    } else {
      await prisma.transactionHash.create({
        data: {
          userId: userId,
          txHash: [txHash],
        },
      });
    }

    res.status(200).json({
      success: true,
      transactionHash: txHash,
      message: "Transaction Processed",
    });
  } catch (error) {
    res.status(511).json({
      success: false,
      message: "Error",
      Error: error,
    });
    console.log("Error: ", error);
  }
};

export const getStatusByTxHash = async (
  req: Request,
  res: Response
): Promise<void> => {
  const id = parseInt(req.params.id);

  const userId = req.user.id

  const txId = await prisma.transactionHash.findFirst({
    where: {
      userId: userId,
    },
  });

  if (!txId) {
    res.status(401).json({
      success: false,
      messages: "User's Transactions not found",
    });
  }

  const txHash = txId?.txHash[id];

  if (!txHash) {
    res.status(401).json({
      success: false,
      message: "Transaction Hash Not found",
    });
    return;
  }

  try {
    const providers = new ethers.JsonRpcProvider(
      `${RPC_URL}`
    );

    const receipt = await providers.getTransactionReceipt(txHash);

    if (!receipt) {
      res.status(411).json({
        success: false,
        message: "Transaction is still processing",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Receipt Fetched Successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: true,
      Error: error,
      message: "Errors fetching receipt details",
    });
  }
};

export const GetAllTxnsHashes = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
      const userId = req.user.id;

      const txHashArray = await prisma.transactionHash.findFirst({
        where: {
          userId: userId,
        },
      });

      res.status(200).json({
        success: true,
        data: txHashArray,
        message: "Successfully Fetched the transaction array",
      });
  } catch (error) {
    res.status(500).json({
      success: true,
      Error: error,
      message: "Errors fetching Txns Hashes",
    });
  }
};