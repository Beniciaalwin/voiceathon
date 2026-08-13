import React, { useEffect, useState } from 'react';
import { Terminal, RefreshCw, X, Copy, Check, CheckCircle2, AlertCircle, Phone, Clock, FileCode } from 'lucide-react';
import { fetchWebhookLogs } from '../lib/api';
import { WebhookLog } from '../types/index';

interface WebhookLogsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WebhookLogsModal: React.FC<WebhookLogsModalProps> = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [selectedLog, setSelectedLog] = useState<WebhookLog | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await fetchWebhookLogs();
      setLogs(data);
      if (data.length > 0 && !selectedLog) {
        setSelectedLog(data[0]);
      }
    } catch (err) {
      console.error('Failed to load webhook logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadLogs();
      const interval = setInterval(loadLogs, 3000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const copyPayload = () => {
    if (!selectedLog) return;
    navigator.clipboard.writeText(JSON.stringify(selectedLog.raw_payload, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-gray-200 rounded-3xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-gray-900 via-purple-950 to-gray-900 text-white flex items-center justify-between border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold tracking-tight">Developer Webhook Logs & Live JSON Inspector</h2>
                <span className="bg-emerald-500/20 text-emerald-300 font-mono text-[10px] px-2 py-0.5 rounded border border-emerald-500/30">
                  Realtime Active
                </span>
              </div>
              <p className="text-xs text-gray-400 font-mono">POST /api/webhooks/snapserve audit history & payload payloads</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadLogs}
              disabled={loading}
              className="px-3 py-1.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border border-gray-700"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
              <span>Refresh Logs</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-200 overflow-hidden">
          {/* Left Column: Event List */}
          <div className="overflow-y-auto p-4 space-y-2 max-h-[550px] bg-gray-50/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                Received Events ({logs.length})
              </span>
              <span className="text-[10px] text-gray-400 font-mono">Latest first</span>
            </div>
            {logs.length === 0 ? (
              <p className="text-xs text-gray-400 py-12 text-center">No webhook payloads logged yet.</p>
            ) : (
              logs.map((log) => {
                const isSelected = selectedLog?.id === log.id;
                const isSuccess = log.status === 'Processed';
                return (
                  <div
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-purple-900 text-white border-purple-900 shadow-md ring-2 ring-purple-600/50'
                        : 'bg-white hover:bg-gray-50 border-gray-200/80 text-gray-900 shadow-xs'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`font-mono font-bold text-xs ${isSelected ? 'text-amber-300' : 'text-gray-900'}`}>
                        {log.event_type}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isSuccess
                            ? isSelected ? 'bg-emerald-500/30 text-emerald-200 border border-emerald-400/40' : 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {isSuccess ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                        {log.status}
                      </span>
                    </div>
                    <div className={`flex items-center justify-between mt-2 text-[11px] font-mono ${isSelected ? 'text-purple-200' : 'text-gray-500'}`}>
                      <span className="truncate max-w-[160px]">Call ID: {log.call_id || 'N/A'}</span>
                      <span className="font-bold flex items-center gap-1">
                        <Phone className="w-3 h-3 opacity-70" />
                        {log.phone || 'N/A'}
                      </span>
                    </div>
                    <div className={`mt-1.5 text-[10px] text-right font-mono ${isSelected ? 'text-purple-300' : 'text-gray-400'}`}>
                      {new Date(log.received_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right Column: Payload Inspector */}
          <div className="overflow-y-auto p-4 bg-gray-950 text-gray-100 font-mono text-xs flex flex-col justify-between max-h-[550px]">
            {selectedLog ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-gray-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <FileCode className="w-4 h-4 text-emerald-400" />
                    <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                      RAW JSON PAYLOAD INSPECTOR
                    </span>
                  </div>
                  <button
                    onClick={copyPayload}
                    className="flex items-center gap-1.5 px-3 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-xs font-semibold transition-all border border-gray-700 cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied JSON' : 'Copy JSON'}</span>
                  </button>
                </div>

                {selectedLog.error_message && (
                  <div className="bg-rose-950/80 border border-rose-800 text-rose-300 p-3 rounded-xl text-xs leading-relaxed">
                    ⚠️ <strong>Error:</strong> {selectedLog.error_message}
                  </div>
                )}

                <div className="bg-black/60 p-4 rounded-2xl border border-gray-800 shadow-inner">
                  <pre className="text-xs text-emerald-300 leading-relaxed overflow-x-auto whitespace-pre-wrap font-mono">
                    {JSON.stringify(selectedLog.raw_payload, null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500 font-sans text-xs">
                Select a webhook event from the left list to inspect its full raw JSON payload.
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-gray-200 bg-gray-50 flex items-center justify-between text-xs text-gray-500">
          <span>Configured Endpoint: <code className="text-purple-900 font-bold font-mono bg-purple-50 px-2 py-0.5 rounded border border-purple-200">POST /api/webhooks/snapserve</code></span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-gray-900 hover:bg-black text-white font-bold transition-all shadow-xs cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
