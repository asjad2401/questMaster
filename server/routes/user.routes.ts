import express from 'express';
import { protect, restrictTo } from '../middleware/auth.middleware';
import { getStudents, getAdminStats, getPerformance } from '../controllers/user.controller';

const router = express.Router();

// Protect all routes
router.use(protect);

// Admin only routes
router.get('/students', restrictTo('admin'), getStudents);
router.get('/admin-stats', restrictTo('admin'), getAdminStats);

// Get user performance data for analytics
router.get('/performance', getPerformance);

export default router; 