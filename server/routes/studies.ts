import { Router } from 'express';
import { StudyController } from '../controllers/StudyController';
import { isAuthenticated } from '../auth/localAuth';

const router = Router();
const studyController = new StudyController();

// Apply authentication middleware to all routes
router.use(isAuthenticated);

// Study CRUD routes
router.get('/', studyController.getAllStudies);
router.get('/:id', studyController.getStudyById);
router.post('/', studyController.createStudy);
router.put('/:id', studyController.updateStudy);
router.delete('/:id', studyController.deleteStudy);

// Study-related resource routes
router.get('/:id/tasks', studyController.getStudyTasks);
router.get('/:id/stats', studyController.getStudyStats);

// Specialized update routes
router.put('/:id/status', studyController.updateStudyStatus);

export { router as studyRoutes };