import React, { useEffect, useState } from 'react';
import { X, Terminal, RefreshCw, AlertCircle, CheckCircle2, Copy, Check } from 'lucide-react';
import { WebhookLog } from '../types/index';
import { fetchWebhookLogs } from '../lib/api';

interface WebhookLogsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WebhookLogsModal: React.FC<WebhookLogsModalProps> = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedLog, setSelectedLog] = useState<WebhookLog | null>(null);
  const [copied, setCopied] = useState(false);

  const loadLogs = () => {
    setLoading(true);
    fetchWebhookLogs()
      .then((data) => {
        setLogs(data);
        if (data.length > 0 && !selectedLog) {
          setSelectedLog(data[0]);
        }
      })
      .catch((err) => console.error('Failed to load webhook logs:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (isOpen) {
      loadLogs();
    }
  }, [isOpen]);

  const copyPayload = () => {
    if (!selectedLog) return;
    navigator.clipboard.writeText(JSON.stringify(selectedLog.raw_payload, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Terminal className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="text-sm font-bold tracking-tight">Developer Webhook Logs</h2>
              <p className="text-[11px] text-gray-400 font-mono">POST /api/webhooks/snapserve audit history</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadLogs}
              disabled={loading}
              className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs flex items-center gap-1 transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-200 overflow-hidden">
          {/* Left Column: Event List */}
          <div className="overflow-y-auto p-4 space-y-2 max-h-[500px]">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-2">Received Events</span>
            {logs.length === 0 ? (
              <p className="text-xs text-gray-400 py-8 text-center">No webhook payloads logged yet.</p>
            ) : (
              logs.map((log) => {
                const isSelected = selectedLog?.id === log.id;
                const isSuccess = log.status === 'Processed';
                return (
                  <div
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-blue-50/70 border-blue-200 ring-1 ring-blue-300'
                        : 'bg-white hover:bg-gray-50 border-gray-200/80'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs text-gray-900">{log.event_type}</span>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                          isSuccess ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {isSuccess ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                        {log.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-2 text-[11px] text-gray-500 font-mono">
                      <span>Call ID: {log.call_id || 'N/A'}</span>
                      <span>{log.phone || 'N/A'}</span>
                    </div>
                    <div className="mt-1 text-[10px] text-gray-400 text-right">
                      {new Date(log.received_at).toLocaleTimeString()}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right Column: Payload Inspector */}
          <div className="overflow-y-auto p-4 bg-gray-950 text-gray-100 font-mono text-xs flex flex-col justify-between max-h-[500px]">
            {selectedLog ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                  <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">Raw Payload Inspector</span>
                  <button
                    onClick={copyPayload}
                    className="flex items-center gap-1 px-2 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded text-[11px] transition-all"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy JSON'}</span>
                  </button>
                </div>
                {selectedLog.error_message && (
                  <div className="bg-rose-950/80 border border-rose-800 text-rose-300 p-2.5 rounded-lg text-[11px]">
                    ⚠️ Error: {selectedLog.error_message}
                  </div>
                )}
                <pre className="text-[11px] text-emerald-300 leading-relaxed overflow-x-auto whitespace-pre-wrap">
                  {JSON.stringify(selectedLog.raw_payload, null, 2)}
                </pre>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-600">
                Select a webhook event to inspect
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between text-xs text-gray-500">
          <span>Configured URL: <code className="text-black font-semibold font-mono">POST /api/webhooks/snapserve</code></span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-gray-900 text-white font-medium hover:bg-black transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
