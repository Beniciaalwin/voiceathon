import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import webhookRoutes from './routes/webhookRoutes';
import leadRoutes from './routes/leadRoutes';
import statsRoutes from './routes/statsRoutes';
import { inMemoryDB, isSupabaseConfigured } from './config/db';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// API Route Mounts
app.use('/api/webhooks', webhookRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/dashboard', statsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    supabaseConnected: isSupabaseConfigured,
    mode: isSupabaseConfigured ? 'Supabase PostgreSQL' : 'In-Memory Fallback',
  });
});

const server = http.createServer(app);

// WebSocket Server for In-Memory Realtime Updates
const wss = new WebSocketServer({ server, path: '/ws' });
const clients = new Set<WebSocket>();

wss.on('connection', (ws) => {
  clients.add(ws);
  ws.send(JSON.stringify({ type: 'CONNECTED', message: 'SnapServe Realtime WebSocket Connected' }));

  ws.on('close', () => {
    clients.delete(ws);
  });
});

// Broadcast events from in-memory DB when Supabase realtime is not present
inMemoryDB.subscribe((event, payload) => {
  const message = JSON.stringify({ event, payload });
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
});

server.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 SnapServe AI Call Monitor Backend Running on Port ${PORT}`);
  console.log(`📡 Webhook Endpoint: http://localhost:${PORT}/api/webhooks/snapserve`);
  console.log(`====================================================`);
});
