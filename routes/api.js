import express from 'express';
import { getUser, login, logout, refreshToken, register } from '../controllers/userController.js';
import { verifyToken } from '../middleware/verifyToken.js';

const router = express.Router();

router.get("/user", verifyToken, getUser)
router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.get("/token", refreshToken);

export default router;