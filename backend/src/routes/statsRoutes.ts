import { Router } from 'express';
import { statsController } from '../controllers/statsController';

const router = Router();

router.get('/stats', statsController.getDashboardStats);

export default router;
