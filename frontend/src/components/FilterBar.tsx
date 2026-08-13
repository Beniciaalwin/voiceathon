import React from 'react';
import { Search, SlidersHorizontal, ArrowUpDown, X, Bot, AlertTriangle, PhoneCall, CheckCircle2, UserX } from 'lucide-react';

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  agentFilter: string;
  onAgentFilterChange: (agent: string) => void;
  sortBy: string;
  onSortByChange: (sort: string) => void;
  totalResults: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  agentFilter,
  onAgentFilterChange,
  sortBy,
  onSortByChange,
  totalResults,
}) => {
  const hasActiveFilters = searchQuery !== '' || statusFilter !== 'all' || agentFilter !== 'all';

  const clearFilters = () => {
    onSearchChange('');
    onStatusFilterChange('all');
    onAgentFilterChange('all');
  };

  return (
    <div className="space-y-2.5 mb-4">
      {/* Quick Action Category Filter Buttons */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider shrink-0 mr-1">
          Quick Category Filters:
        </span>
        <button
          onClick={() => onStatusFilterChange(statusFilter === 'all' ? 'all' : 'all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer border ${
            statusFilter === 'all'
              ? 'bg-purple-900 text-white border-purple-900 shadow-xs'
              : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
          }`}
        >
          All Participants ({totalResults})
        </button>
        <button
          onClick={() => onStatusFilterChange(statusFilter === 'build_not_started' ? 'all' : 'build_not_started')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 border ${
            statusFilter === 'build_not_started'
              ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
              : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>🚨 Agent Build Not Started</span>
        </button>
        <button
          onClick={() => onStatusFilterChange(statusFilter === 'phone_pending' ? 'all' : 'phone_pending')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 border ${
            statusFilter === 'phone_pending'
              ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
              : 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
          }`}
        >
          <PhoneCall className="w-3.5 h-3.5" />
          <span>📱 Phone Number Pending</span>
        </button>
        <button
          onClick={() => onStatusFilterChange(statusFilter === 'ready' ? 'all' : 'ready')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 border ${
            statusFilter === 'ready'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
              : 'bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>🟢 100% Fully Ready</span>
        </button>
        <button
          onClick={() => onStatusFilterChange(statusFilter === 'Not Interested' ? 'all' : 'Not Interested')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 border ${
            statusFilter === 'Not Interested'
              ? 'bg-gray-800 text-white border-gray-800 shadow-xs'
              : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
          }`}
        >
          <UserX className="w-3.5 h-3.5" />
          <span>🔴 Declined / Opt-Out</span>
        </button>
      </div>

      {/* Search Bar & Dropdown Controls */}
      <div className="bg-white rounded-xl border border-gray-200/80 p-3 shadow-subtle flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search Participant by Name, Phone, Email..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-9 pr-8 py-1.5 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black/5 focus:bg-white transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter and Sort Selectors */}
        <div className="flex items-center flex-wrap gap-2 w-full md:w-auto justify-between md:justify-end">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1">
            <SlidersHorizontal className="w-3.5 h-3.5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value)}
              className="bg-transparent text-xs text-gray-700 font-medium focus:outline-none cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="build_not_started">🚨 Agent Build Not Started</option>
              <option value="phone_pending">📱 Phone Number Pending</option>
              <option value="ready">🟢 100% Fully Ready</option>
              <option value="Not Started">Not Started</option>
              <option value="Calling">Calling</option>
              <option value="Follow-up Pending">Follow-up Pending</option>
              <option value="Participated">Participated</option>
              <option value="Completed">Completed</option>
              <option value="Not Interested">Not Interested</option>
            </select>
          </div>

          {/* 5 AI Agents Filter */}
          <div className="flex items-center gap-1.5 bg-purple-50/70 border border-purple-200/80 rounded-lg px-2.5 py-1">
            <Bot className="w-3.5 h-3.5 text-purple-600" />
            <select
              value={agentFilter}
              onChange={(e) => onAgentFilterChange(e.target.value)}
              className="bg-transparent text-xs text-purple-900 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="all">All 5 AI Agents</option>
              <option value="agent_registration">Agent #1: Registration & Onboarding</option>
              <option value="agent_tech_screening">Agent #2: Tech & Track Screening</option>
              <option value="agent_confirmation">Agent #3: Attendance Confirmation</option>
              <option value="agent_reminder">Agent #4: Hackathon Event Reminder</option>
              <option value="agent_feedback">Agent #5: Feedback & Post-Call</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1">
            <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
            <select
              value={sortBy}
              onChange={(e) => onSortByChange(e.target.value)}
              className="bg-transparent text-xs text-gray-700 font-medium focus:outline-none cursor-pointer"
            >
              <option value="last_activity">Sort: Latest Activity</option>
              <option value="name">Sort: Participant Name</option>
              <option value="final_status">Sort: Status</option>
            </select>
          </div>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-xs text-rose-600 hover:text-rose-700 underline font-medium px-2 py-1 cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
