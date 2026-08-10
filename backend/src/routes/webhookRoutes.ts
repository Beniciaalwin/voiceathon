import { Router } from 'express';
import { webhookController } from '../controllers/webhookController';

const router = Router();

// SnapServe AI Webhook Endpoint (POST /api/webhooks/snapserve)
router.post('/snapserve', webhookController.handleSnapServeWebhook);

// Dev / Admin Webhook Logs (GET /api/webhooks/logs)
router.get('/logs', webhookController.getWebhookLogs);

export default router;
