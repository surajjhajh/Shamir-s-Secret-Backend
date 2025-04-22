import express from 'express';
import { getPrivateKey, Signup } from '../controllers/Signup';
import { login, Logout, signMessage } from '../controllers/Login';
import { GetAllTxnsHashes, getStatusByTxHash, sendTxn } from '../controllers/Txns';
import { getPublicKeyAndAddress } from '../controllers/GetInfo';
import { Authenticate, verifyIfBlackListedToken } from '../middleware/Authorization';

const router: express.Router = express.Router();

const app = express();

router.post("/signup", Signup);
router.post("/privateKey", Authenticate, getPrivateKey);
router.post("/login", login);
router.post("/signtxs", signMessage);
router.post("/sendtxn", verifyIfBlackListedToken, Authenticate, sendTxn);
router.post("/logout", Logout);

router.get("/getstatus/:id", verifyIfBlackListedToken, Authenticate, getStatusByTxHash);
router.get("/getinfo", verifyIfBlackListedToken, Authenticate, getPublicKeyAndAddress);
router.get("/getalltxnhash", verifyIfBlackListedToken, Authenticate ,GetAllTxnsHashes);
router.get('/verify', verifyIfBlackListedToken);

export default router;