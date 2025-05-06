import express from 'express';
import {
  createResource,
  getAllResources,
  getResource,
  updateResource,
  deleteResource,
} from '../controllers/resource.controller';
import { protect, restrictTo } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { createResourceValidator, updateResourceValidator } from '../validators/resource.validator';

const router = express.Router();

// Protect all routes after this middleware
router.use(protect);

// Resource routes
router.route('/')
  .get(getAllResources)
  .post(createResourceValidator, validate, createResource);

router.route('/:id')
  .get(getResource)
  .patch(updateResourceValidator, validate, updateResource)
  .delete(deleteResource);

export default router; 