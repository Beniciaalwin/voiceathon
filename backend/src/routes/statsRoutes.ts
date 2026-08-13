import { Router } from 'express';
import { statsController } from '../controllers/statsController';

const router = Router();

router.get('/stats', statsController.getDashboardStats);
router.get('/participant-intel', statsController.getParticipantIntel);

export default router;
