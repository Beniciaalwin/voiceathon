import React, { useEffect, useState, useCallback } from 'react';
import { Header } from './components/Header';
import { StatsCards } from './components/StatsCards';
import { FilterBar } from './components/FilterBar';
import { LeadTable } from './components/LeadTable';
import { CandidateDrawer } from './components/CandidateDrawer';
import { WebhookLogsModal } from './components/WebhookLogsModal';
import { WebhookSimulatorModal } from './components/WebhookSimulatorModal';
import { ManagerReportModal } from './components/ManagerReportModal';
import { ParticipantIntelPanel } from './components/ParticipantIntelPanel';
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
  const [isManagerReportOpen, setIsManagerReportOpen] = useState(false);

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

      // Automatically keep the selected drawer candidate updated in real-time
      if (selectedLead) {
        const fresh = leadsData.find((l) => l.id === selectedLead.id);
        if (fresh) setSelectedLead(fresh);
      }
    } catch (err: any) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [searchQuery, statusFilter, agentFilter, campaignFilter, sortBy, selectedLead?.id]);

  useEffect(() => {
    loadDashboardData();
  }, [searchQuery, statusFilter, agentFilter, campaignFilter, sortBy]);

  // Background 3-second polling to ensure 100% 24/7 data sync even if WebSockets reconnect
  useEffect(() => {
    const pollInterval = setInterval(() => {
      loadDashboardData();
    }, 3000);
    return () => clearInterval(pollInterval);
  }, [loadDashboardData]);

  // Real-time WebSockets subscription via Supabase Postgres Realtime
  useEffect(() => {
    const unsubscribe = subscribeToRealtimeUpdates((payload) => {
      console.log('⚡ Realtime Webhook Payload Event:', payload);
      showToast(`⚡ Realtime Event Received: ${payload.event || 'Database Update'}`);
      loadDashboardData();
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [loadDashboardData]);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    loadDashboardData();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100/50 to-purple-50/20 text-gray-900 flex flex-col font-sans antialiased">
      {/* Top Header */}
      <Header
        onRefresh={handleManualRefresh}
        isRefreshing={isRefreshing}
        selectedCampaign={campaignFilter}
        onSelectCampaign={setCampaignFilter}
        onOpenWebhookLogs={() => setIsWebhookLogsOpen(true)}
        onOpenSimulator={() => setIsSimulatorOpen(true)}
        onOpenManagerReport={() => setIsManagerReportOpen(true)}
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

        {/* Participant Intelligence Panel — call summaries, phone bought, agent build */}
        <ParticipantIntelPanel />
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

      {/* Manager Executive Audit Report Modal */}
      <ManagerReportModal
        isOpen={isManagerReportOpen}
        onClose={() => setIsManagerReportOpen(false)}
        leads={leads}
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
