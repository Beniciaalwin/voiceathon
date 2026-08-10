import React, { useEffect, useState, useCallback } from 'react';
import { Header } from './components/Header';
import { StatsCards } from './components/StatsCards';
import { FilterBar } from './components/FilterBar';
import { LeadTable } from './components/LeadTable';
import { CandidateDrawer } from './components/CandidateDrawer';
import { WebhookLogsModal } from './components/WebhookLogsModal';
import { WebhookSimulatorModal } from './components/WebhookSimulatorModal';
import { Lead, DashboardStats } from './types/index';
import { fetchLeads, fetchDashboardStats } from './lib/api';
import { subscribeToRealtimeUpdates } from './lib/supabase';
import { Bell, Sparkles, Trophy } from 'lucide-react';

export function App() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filters & Sorting State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [agentFilter, setAgentFilter] = useState('all');
  const [campaignFilter, setCampaignFilter] = useState('all');
  const [sortBy, setSortBy] = useState('last_activity');

  // UI Modals & Drawers
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isWebhookLogsOpen, setIsWebhookLogsOpen] = useState(false);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 4000);
  };

  const loadDashboardData = useCallback(async () => {
    try {
      const [leadsData, statsData] = await Promise.all([
        fetchLeads({
          search: searchQuery,
          status: statusFilter,
          agent: agentFilter,
          campaign: campaignFilter,
          sortBy,
        }),
        fetchDashboardStats(),
      ]);
      setLeads(leadsData);
      setStats(statsData);
    } catch (err: any) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [searchQuery, statusFilter, agentFilter, campaignFilter, sortBy]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Subscribe to Supabase Realtime / WebSocket events
  useEffect(() => {
    const unsubscribe = subscribeToRealtimeUpdates((eventData) => {
      console.log('[Realtime Push Received]', eventData);
      loadDashboardData();

      if (eventData.event === 'LEAD_UPDATED' && eventData.payload) {
        const leadName = eventData.payload.name || 'Participant';
        showToast(`${leadName}'s call status was updated`);
      } else if (eventData.event === 'CALL_LOG_ADDED') {
        showToast(`New Hackathon AI Call logged`);
      }
    });

    return () => unsubscribe();
  }, [loadDashboardData]);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    loadDashboardData();
  };

  return (
    <div className="min-h-screen bg-[#FAFBFD] flex flex-col text-gray-900 font-sans">
      {/* Top Fixed Header */}
      <Header
        onRefresh={handleManualRefresh}
        isRefreshing={isRefreshing}
        selectedCampaign={campaignFilter}
        onSelectCampaign={setCampaignFilter}
        onOpenWebhookLogs={() => setIsWebhookLogsOpen(true)}
        onOpenSimulator={() => setIsSimulatorOpen(true)}
        isLive={true}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Dynamic Top Statistics Cards */}
        <StatsCards stats={stats} loading={loading} />

        {/* Lead Table Header & Actions */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-900 tracking-tight">Hackathon Participant Voice Monitor</h2>
              <p className="text-xs text-gray-500">Realtime participant confirmation & call pipeline synchronized via SnapServe webhooks</p>
            </div>

            {/* Quick Demo Pill */}
            <div className="hidden sm:flex items-center gap-2 text-xs bg-purple-50/80 text-purple-700 px-3 py-1.5 rounded-lg border border-purple-100 font-medium">
              <Trophy className="w-3.5 h-3.5 text-amber-500" />
              <span>Voiceathon Live Status Engine Active</span>
            </div>
          </div>

          {/* Filter, Search & Sorting Bar */}
          <FilterBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            agentFilter={agentFilter}
            onAgentFilterChange={setAgentFilter}
            sortBy={sortBy}
            onSortByChange={setSortBy}
            totalResults={leads.length}
          />

          {/* Main Lead Table */}
          <LeadTable
            leads={leads}
            loading={loading}
            onSelectLead={(lead) => setSelectedLead(lead)}
            selectedLeadId={selectedLead?.id}
          />
        </div>
      </main>

      {/* Slide-over Candidate Details Drawer */}
      <CandidateDrawer lead={selectedLead} onClose={() => setSelectedLead(null)} />

      {/* Developer Webhook Logs Modal */}
      <WebhookLogsModal isOpen={isWebhookLogsOpen} onClose={() => setIsWebhookLogsOpen(false)} />

      {/* Webhook Simulator Modal */}
      <WebhookSimulatorModal
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
        onSuccess={(msg) => showToast(msg)}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 bg-gray-900 text-white text-xs font-medium px-4 py-3 rounded-xl shadow-2xl border border-gray-800 animate-bounce">
          <Bell className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Dashboard Footer */}
      <footer className="border-t border-gray-200/80 bg-white py-4 mt-12 text-center text-xs text-gray-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between px-6 gap-2">
          <span>SnapServe AI Voice &mdash; Hackathon Edition &copy; 2026</span>
          <span className="font-mono text-[11px] text-gray-500">
            Webhook URL: <code className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">POST /api/webhooks/snapserve</code>
          </span>
        </div>
      </footer>
    </div>
  );
}

export default App;
