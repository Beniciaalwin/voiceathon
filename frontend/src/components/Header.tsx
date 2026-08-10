import React from 'react';
import { RefreshCw, Radio, Terminal, Play, Bot, ChevronDown, User, Trophy } from 'lucide-react';

interface HeaderProps {
  onRefresh: () => void;
  isRefreshing: boolean;
  selectedCampaign: string;
  onSelectCampaign: (campaign: string) => void;
  onOpenWebhookLogs: () => void;
  onOpenSimulator: () => void;
  isLive: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onRefresh,
  isRefreshing,
  selectedCampaign,
  onSelectCampaign,
  onOpenWebhookLogs,
  onOpenSimulator,
  isLive,
}) => {
  return (
    <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-gray-200/80 px-6 py-3.5 transition-all">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left Side: Brand Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-gray-900 to-gray-800 flex items-center justify-center text-white shadow-sm ring-1 ring-black/5">
            <Trophy className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-semibold text-gray-900 tracking-tight">SnapServe AI</h1>
              <span className="text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 font-medium border border-purple-100">
                Hackathon Voice Monitor
              </span>
            </div>
            <p className="text-xs text-gray-500 font-normal">Participant Call Activity & Automated Status Pipeline</p>
          </div>
        </div>

        {/* Right Side Controls */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Live Status Indicator */}
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 text-xs font-medium">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 ${isLive ? '' : 'hidden'}`}></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>Live</span>
          </div>

          {/* Hackathon Track / Campaign Selector */}
          <div className="relative">
            <select
              value={selectedCampaign}
              onChange={(e) => onSelectCampaign(e.target.value)}
              className="appearance-none bg-gray-50 hover:bg-gray-100/80 border border-gray-200 text-gray-800 text-xs rounded-lg px-3 py-1.5 pr-8 font-medium focus:outline-none focus:ring-2 focus:ring-black/5 transition-all cursor-pointer"
            >
              <option value="all">All Tracks & Campaigns</option>
              <option value="Voiceathon 2026 Main">Voiceathon 2026 Main</option>
              <option value="AI Agents Track">AI Agents Track</option>
              <option value="Web3 & Infra Track">Web3 & Infra Track</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-gray-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 transition-all shadow-subtle active:scale-95 disabled:opacity-50"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-black' : ''}`} />
          </button>

          {/* Webhook Simulator Trigger */}
          <button
            onClick={onOpenSimulator}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-900 hover:bg-black text-white text-xs font-medium shadow-sm transition-all active:scale-95"
          >
            <Play className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
            <span>Simulate Call Event</span>
          </button>

          {/* Webhook Logs Modal Trigger */}
          <button
            onClick={onOpenWebhookLogs}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium shadow-subtle transition-all active:scale-95"
          >
            <Terminal className="w-3.5 h-3.5 text-gray-500" />
            <span>Webhook Logs</span>
          </button>

          {/* User Profile Menu Mock */}
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-gray-200 to-gray-300 border border-gray-300/80 flex items-center justify-center text-gray-700 font-semibold text-xs ml-1 cursor-pointer hover:ring-2 hover:ring-black/10 transition-all">
            <User className="w-4 h-4" />
          </div>
        </div>
      </div>
    </header>
  );
};
