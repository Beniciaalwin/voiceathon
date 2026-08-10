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

export default function App() {
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

  // Keep selectedLead in sync with updated leads array
  useEffect(() => {
    if (selectedLead) {
      const updated = leads.find((l) => l.id === selectedLead.id || l.phone === selectedLead.phone);
      if (updated && (updated.final_status !== selectedLead.final_status || updated.agent_status !== selectedLead.agent_status || updated.updated_at !== selectedLead.updated_at)) {
        setSelectedLead(updated);
      }
    }
  }, [leads, selectedLead]);

  // 3-Second Automatic Realtime Polling Fallback
  useEffect(() => {
    const pollInterval = setInterval(() => {
      loadDashboardData();
    }, 3000);
    return () => clearInterval(pollInterval);
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
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <span>Hackathon Participant Voice Monitor</span>
              </h2>
              <span className="bg-purple-100 text-purple-900 border border-purple-200 font-semibold text-[11px] px-2 py-0.5 rounded-full">
                Realtime Sync Active
              </span>
            </div>
            <p className="text-xs text-gray-500">
              Realtime participant confirmation & call pipeline synchronized via SnapServe webhooks
            </p>
          </div>

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
        </div>

        {/* Main Participants Lead Table */}
        <LeadTable
          leads={leads}
          loading={loading}
          onSelectLead={(lead) => setSelectedLead(lead)}
        />
      </main>

      {/* Slide-over Candidate Drawer */}
      <CandidateDrawer
        lead={selectedLead}
        onClose={() => setSelectedLead(null)}
      />

      {/* Webhook Logs Modal */}
      <WebhookLogsModal
        isOpen={isWebhookLogsOpen}
        onClose={() => setIsWebhookLogsOpen(false)}
      />

      {/* Webhook Simulator Modal */}
      <WebhookSimulatorModal
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
        onSuccess={(msg) => {
          showToast(msg);
          loadDashboardData();
        }}
      />

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-xs font-medium animate-bounce border border-gray-700">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
