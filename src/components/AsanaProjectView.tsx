import React, { useState } from 'react';
import {
  LayoutDashboard,
  List,
  KanbanSquare,
  Clock,
  Calendar,
  GitMerge,
  BarChart2,
  FileText
} from 'lucide-react';
import { useAsanaStore } from '../store/asanaStore';
import AsanaListView from './AsanaListView';
import AsanaBoardView from './AsanaBoardView';
import AsanaTimelineView from './AsanaTimelineView';
import AsanaCalendarView from './AsanaCalendarView';
import AsanaWorkflowView from './AsanaWorkflowView';
import AsanaDashboardView from './AsanaDashboardView';
import AsanaOverviewView from './AsanaOverviewView';
import AsanaFilesView from './AsanaFilesView';

type TabId = 'overview' | 'list' | 'board' | 'timeline' | 'calendar' | 'workflow' | 'dashboard' | 'files';

const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'list', label: 'List', icon: List },
  { id: 'board', label: 'Board', icon: KanbanSquare },
  { id: 'timeline', label: 'Timeline', icon: Clock },
  { id: 'calendar', label: 'Calendar', icon: Calendar },
  { id: 'workflow', label: 'Workflow', icon: GitMerge },
  { id: 'dashboard', label: 'Dashboard', icon: BarChart2 },
  { id: 'files', label: 'Files', icon: FileText },
];

export default function AsanaProjectView() {
  const { project } = useAsanaStore();
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <AsanaOverviewView />;
      case 'list':
        return <AsanaListView />;
      case 'board':
        return <AsanaBoardView />;
      case 'timeline':
        return <AsanaTimelineView />;
      case 'calendar':
        return <AsanaCalendarView />;
      case 'workflow':
        return <AsanaWorkflowView />;
      case 'dashboard':
        return <AsanaDashboardView />;
      case 'files':
        return <AsanaFilesView />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full min-h-[600px] w-full bg-[#181a1c] text-[#f6f3fa] font-sans border-t border-[#f6f3fa]/20 md:border-t-0">

      {/* Project Header */}
      <div className="px-6 py-4 border-b border-[#f6f3fa]/20 bg-[#181a1c]/80 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-[#e6d46a]/20 rounded-xl flex items-center justify-center text-[#e6d46a]">
            <KanbanSquare size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">{project.name}</h1>
            <p className="text-sm text-[#f6f3fa]/70">{project.description}</p>
          </div>
        </div>
        <div className="flex -space-x-2">
          {project.teamMembers.map((member) => (
            <div
              key={member.id}
              className="w-8 h-8 rounded-full bg-[#6339b5] text-xs flex items-center justify-center font-medium border-2 border-[#181a1c] text-white"
              title={member.name}
            >
              {member.initials}
            </div>
          ))}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="px-6 flex overflow-x-auto border-b border-[#f6f3fa]/20 hide-scrollbar bg-[#181a1c]">
        <div className="flex gap-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  isActive
                    ? 'border-[#e6d46a] text-[#f6f3fa]'
                    : 'border-transparent text-[#f6f3fa]/60 hover:text-[#f6f3fa] hover:border-[#f6f3fa]/30'
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Tab Content Area */}
      <div className="flex-1 overflow-y-auto bg-[#181a1c]/50 relative">
        {renderTabContent()}
      </div>

    </div>
  );
}
