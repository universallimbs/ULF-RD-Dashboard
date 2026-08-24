import React from 'react';
import { useAsanaStore } from '../store/asanaStore';
import { Briefcase, Users, Target, CheckCircle2, Circle, Calendar } from 'lucide-react';
import { format, parseISO, isAfter, startOfDay } from 'date-fns';

export default function AsanaOverviewView() {
  const { project, tasks } = useAsanaStore();

  const today = startOfDay(new Date());

  // Milestones: High priority OR due within the next 7 days, excluding 'Done'
  const milestones = tasks
    .filter(task => {
      if (task.status === 'Done') return false;
      if (task.priority === 'High') return true;
      if (task.dueDate) {
        const dDate = parseISO(task.dueDate);
        const diff = dDate.getTime() - today.getTime();
        const days = diff / (1000 * 3600 * 24);
        if (days >= 0 && days <= 7) return true;
      }
      return false;
    })
    .slice(0, 4);

  return (
    <div className="flex flex-col h-full bg-[#181a1c] p-6 overflow-auto">
      <div className="max-w-6xl w-full mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Main Column: Project Brief */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          <div className="bg-[#202225] border border-[#f6f3fa]/10 rounded-xl p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6 border-b border-[#f6f3fa]/10 pb-4">
              <div className="w-10 h-10 rounded-lg bg-[#6339b5]/20 text-[#6339b5] flex items-center justify-center">
                <Briefcase size={20} />
              </div>
              <h2 className="text-xl font-bold text-[#f6f3fa]">Project Brief</h2>
            </div>
            <div className="prose prose-invert max-w-none text-[#f6f3fa]/80 leading-relaxed text-sm">
              <p className="text-lg text-[#f6f3fa] font-medium mb-4">{project.description}</p>
              <p>
                Welcome to the ULF R&D Tracker. This dashboard centralizes all engineering,
                design, and research milestones for the low-cost, repairable pediatric prosthetic hand.
              </p>
              <p className="mt-4">
                <strong>Objectives:</strong>
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Finalize anthropometric data from user surveys.</li>
                <li>Handoff test bench mechanical layouts for University partners.</li>
                <li>Iterate on the multigrasp tendon routing system.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Sidebar Column: Milestones & Team */}
        <div className="flex flex-col gap-8">

          {/* Key Deliverables */}
          <div className="bg-[#202225] border border-[#f6f3fa]/10 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <Target size={18} className="text-[#e6d46a]" />
              <h3 className="text-lg font-bold text-[#f6f3fa]">Key Deliverables</h3>
            </div>

            <div className="flex flex-col gap-4">
              {milestones.length > 0 ? (
                milestones.map(task => (
                  <div key={task.id} className="group p-3 border border-[#f6f3fa]/5 rounded-lg bg-[#181a1c] hover:border-[#f6f3fa]/20 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        <Circle size={14} className="text-[#f6f3fa]/30" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-[#f6f3fa] leading-snug group-hover:text-[#e6d46a] transition-colors">{task.title}</span>
                        {task.dueDate && (
                          <div className="flex items-center gap-1 text-[11px] text-[#f6f3fa]/50 mt-1.5">
                            <Calendar size={10} />
                            <span>{format(parseISO(task.dueDate), 'MMM d, yyyy')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-[#f6f3fa]/40 text-center py-4">No upcoming deliverables.</div>
              )}
            </div>
          </div>

          {/* Project Roles */}
          <div className="bg-[#202225] border border-[#f6f3fa]/10 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <Users size={18} className="text-[#6339b5]" />
              <h3 className="text-lg font-bold text-[#f6f3fa]">Project Roles</h3>
            </div>

            <div className="flex flex-col gap-4">
              {project.teamMembers.map(member => (
                <div key={member.id} className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#6339b5] text-white flex items-center justify-center font-bold text-sm shadow-md">
                    {member.initials}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-[#f6f3fa]">{member.name}</span>
                    <span className="text-xs text-[#f6f3fa]/50">{member.role || 'Team Member'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
