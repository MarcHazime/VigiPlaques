import { Router } from 'express';
import * as AuthController from '../controllers/authController';

const router = Router();

router.post('/register', AuthController.register);
router.post('/verify', AuthController.verifyEmail);
router.post('/login', AuthController.login);
router.post('/forgot-password', AuthController.forgotPassword);
router.post('/reset-password', AuthController.resetPassword);

export default router;
