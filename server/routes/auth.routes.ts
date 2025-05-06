import express from 'express';
import { signup, login, getMe, updateMe } from '../controllers/auth.controller';
import { protect } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { signupValidator, loginValidator } from '../validators/auth.validator';

const router = express.Router();

router.post('/signup', signupValidator, validate, signup);
router.post('/login', loginValidator, validate, login);

// Protected routes
router.use(protect);
router.get('/me', getMe);
router.patch('/updateMe', updateMe);

export default router; 