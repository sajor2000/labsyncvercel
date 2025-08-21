import { Router } from 'express';
import { TaskController } from '../controllers/TaskController';
import { isAuthenticated } from '../auth/localAuth';

const router = Router();
const taskController = new TaskController();

// Apply authentication middleware to all routes
router.use(isAuthenticated);

// Special routes (must come before parameterized routes)
router.get('/my', taskController.getMyTasks);

// Task CRUD routes
router.get('/', taskController.getAllTasks);
router.get('/:id', taskController.getTaskById);
router.post('/', taskController.createTask);
router.put('/:id', taskController.updateTask);
router.delete('/:id', taskController.deleteTask);

// Specialized update routes
router.put('/:id/move', taskController.moveTask);
router.put('/:id/status', taskController.updateTaskStatus);

export { router as taskRoutes };