import { Router } from 'express';
import { leadController } from '../controllers/leadController';

const router = Router();

router.get('/', leadController.getLeads);
router.get('/:id', leadController.getLeadById);
router.get('/:id/calls', leadController.getLeadCallLogs);
router.get('/:id/activities', leadController.getLeadActivities);
router.post('/reset', leadController.resetSeed);

export default router;
