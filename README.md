# SnapServe AI — Call Activity Dashboard

A modern, high-performance SaaS dashboard for **SnapServe**, an AI Voice Agent platform. This dashboard tracks every lead/customer and automatically updates their activity status based on real-time **SnapServe AI Agent webhook events**.

---

## 🚀 Webhook URL Configuration

Inside your SnapServe AI Agent webhook settings, configure this endpoint:

```http
POST https://<YOUR_DEPLOYED_BACKEND_DOMAIN>/api/webhooks/snapserve
```

For local testing:
```http
POST http://localhost:4000/api/webhooks/snapserve
```

---

## 🛠️ Architecture Overview

```
SnapServe AI Agent 
   ↳ Webhook POST
      ↳ Backend Endpoint (/api/webhooks/snapserve)
         ↳ Normalization (services/snapserveWebhookService.ts)
         ↳ Status Engine (services/statusEngine.ts)
         ↳ Supabase PostgreSQL / Realtime
         ↳ Dashboard Auto-Refreshes Live!
```

---

## 📋 Core Features

1. **SnapServe Webhook Engine**: Dedicated normalization service (`snapserveWebhookService.ts`) to ingest diverse payload formats.
2. **Automatic Status Engine**: Pure backend rules engine (`statusEngine.ts`) calculating lead state without manual editing.
3. **Linear/Vercel Aesthetic**: Pristine light theme, compact lead table, micro-shadows, and smooth Framer Motion slide-over drawers.
4. **Interactive Status Indicators**: Visual states (`✓` Completed, `◷` In Progress / Pending, `—` Not Started, `!` Failed) with rich hover tooltips.
5. **Candidate Details Drawer**: Right-side drawer showing contact details, activity checklist, chronological call timeline, and AI call summaries.
6. **Supabase Realtime & WebSocket Fallback**: Auto-updating dashboard with non-intrusive toast notifications.
7. **Developer Webhook Logs & Live Simulator**: Built-in modal tools to inspect raw webhook JSON payloads and simulate events with 1 click.

---

## 🗄️ Database Setup (Supabase PostgreSQL)

1. Open your Supabase Dashboard -> **SQL Editor**.
2. Run [`schema.sql`](./schema.sql) to create the tables (`leads`, `call_logs`, `activities`, `webhook_logs`).
3. Run [`seed.sql`](./seed.sql) to insert initial sample leads (**Arun**, **Priya**, **Karthik**).

---

## ⚙️ Environment Variables

Create `.env` files based on `.env.example`:

### Backend `.env`
```env
PORT=4000
NODE_ENV=development
SNAPSERVE_WEBHOOK_SECRET=snapserve_sec_987654321_token

SUPABASE_URL=https://your-supabase-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

### Frontend `.env`
```env
VITE_API_BASE_URL=http://localhost:4000
VITE_SUPABASE_URL=https://your-supabase-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

> **Note**: If Supabase keys are not set, the app seamlessly runs in stateful **In-Memory Fallback Mode** with seed data so you can test immediately!

---

## 🏃 Quick Start Guide

### 1. Install Dependencies
```bash
npm run install:all
```

### 2. Run Development Servers (Backend + Frontend)
```bash
npm run dev
```
- **Frontend**: `http://localhost:3000`
- **Backend API**: `http://localhost:4000`

---

## 🧪 Testing Webhooks with `curl`

Send a test webhook to your local backend:

```bash
curl -X POST http://localhost:4000/api/webhooks/snapserve \
  -H "Content-Type: application/json" \
  -d '{
    "event": "call.completed",
    "call_id": "call_test_999",
    "phone": "+919876543210",
    "name": "Arun Kumar",
    "agent_id": "agent_snapserve_01",
    "call_status": "completed",
    "outcome": "callback_requested",
    "duration": 180,
    "summary": "Arun requested a callback tomorrow at 4 PM to finalize contract details.",
    "callback_required": true,
    "callback_time": "2026-08-11T16:00:00Z"
  }'
```

Response:
```json
{
  "success": true,
  "message": "Webhook processed successfully",
  "data": {
    "leadId": "00000000-0000-0000-0000-000000000001",
    "leadName": "Arun Kumar",
    "finalStatus": "Follow-up Pending",
    "callId": "call_test_999"
  }
}
```
