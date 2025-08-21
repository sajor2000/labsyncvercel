import { Router } from 'express';
import { LabController } from '../controllers/LabController';
import { isAuthenticated } from '../auth/localAuth';

const router = Router();
const labController = new LabController();

// Apply authentication middleware to all routes
router.use(isAuthenticated);

// Lab CRUD routes
router.get('/', labController.getAllLabs);
router.get('/:id', labController.getLabById);
router.post('/', labController.createLab);
router.put('/:id', labController.updateLab);
router.delete('/:id', labController.deleteLab);

// Lab-related resource routes
router.get('/:id/members', labController.getLabMembers);
router.get('/:id/studies', labController.getLabStudies);
router.get('/:id/stats', labController.getLabStats);

export { router as labRoutes };