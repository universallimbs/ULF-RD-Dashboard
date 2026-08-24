import React, { useMemo } from 'react';
import {
  format,
  eachDayOfInterval,
  differenceInDays,
  parseISO,
  isValid,
  subDays,
  addDays,
  startOfDay,
  isToday
} from 'date-fns';
import { useAsanaStore, TaskStatus, Task } from '../store/asanaStore';
import { User as UserIcon } from 'lucide-react';

const STATUS_COLORS: Record<TaskStatus, { bg: string; border: string; text: string }> = {
  'To Do': { bg: 'bg-gray-500/20', border: 'border-gray-500/50', text: 'text-gray-300' },
  'In Progress': { bg: 'bg-yellow-500/20', border: 'border-yellow-500/50', text: 'text-yellow-300' },
  'Done': { bg: 'bg-green-500/20', border: 'border-green-500/50', text: 'text-green-300' },
};

export default function AsanaTimelineView() {
  const { tasks, project } = useAsanaStore();

  // Create a 60-day timeline window centered roughly around today
  const { timelineStart, timelineEnd, days, totalDays } = useMemo(() => {
    const today = startOfDay(new Date());
    const start = subDays(today, 15);
    const end = addDays(today, 45);
    return {
      timelineStart: start,
      timelineEnd: end,
      days: eachDayOfInterval({ start, end }),
      totalDays: differenceInDays(end, start) + 1,
    };
  }, []);

  const getTaskBarStyles = (task: Task) => {
    // Determine start and end dates for the bar
    let sDate = task.startDate ? parseISO(task.startDate) : null;
    let eDate = task.dueDate ? parseISO(task.dueDate) : null;

    if (!sDate && !eDate) return null; // Can't render without any dates

    // If only one date is present, make it a 1-day milestone
    if (!sDate && eDate) sDate = eDate;
    if (sDate && !eDate) eDate = sDate;

    if (!isValid(sDate) || !isValid(eDate)) return null;

    // Clamp dates to timeline window
    const renderStart = sDate! < timelineStart ? timelineStart : sDate!;
    const renderEnd = eDate! > timelineEnd ? timelineEnd : eDate!;

    if (renderStart > timelineEnd || renderEnd < timelineStart) return null; // Outside window

    const leftOffsetDays = differenceInDays(renderStart, timelineStart);
    const durationDays = differenceInDays(renderEnd, renderStart) + 1; // +1 to include the end day fully

    const leftPercent = (leftOffsetDays / totalDays) * 100;
    const widthPercent = (durationDays / totalDays) * 100;

    return {
      left: `${Math.max(0, leftPercent)}%`,
      width: `${Math.min(100 - leftPercent, widthPercent)}%`,
    };
  };

  return (
    <div className="flex flex-col h-full bg-[#181a1c] overflow-hidden">

      {/* Timeline Header (Days/Months) */}
      <div className="flex border-b border-[#f6f3fa]/10 bg-[#f6f3fa]/5 overflow-x-auto hide-scrollbar sticky top-0 z-10 pl-64">
        <div className="flex min-w-max" style={{ width: `${totalDays * 40}px` }}>
          {days.map((day, i) => (
            <div
              key={day.toISOString()}
              className={`w-[40px] shrink-0 border-r border-[#f6f3fa]/10 flex flex-col items-center justify-center py-2 text-xs
                ${isToday(day) ? 'bg-[#e6d46a]/10 text-[#e6d46a] font-bold' : 'text-[#f6f3fa]/50'}`}
            >
              <span className="opacity-60">{format(day, 'E').substring(0, 1)}</span>
              <span>{format(day, 'd')}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Timeline Body */}
      <div className="flex-1 overflow-auto flex relative">

        {/* Left Fixed Column: Task Names */}
        <div className="w-64 shrink-0 border-r border-[#f6f3fa]/10 bg-[#181a1c] sticky left-0 z-20 flex flex-col">
          {tasks.map(task => {
            const assignee = project.teamMembers.find(m => m.id === task.assigneeId);
            return (
              <div key={`title-${task.id}`} className="h-12 border-b border-[#f6f3fa]/5 flex items-center px-4 gap-3 bg-[#181a1c]">
                <div className="shrink-0" title={assignee?.name || 'Unassigned'}>
                  {assignee ? (
                    <div className="w-5 h-5 rounded-full bg-[#6339b5] text-[9px] flex items-center justify-center font-medium text-white">
                      {assignee.initials}
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full border border-dashed border-[#f6f3fa]/30 flex items-center justify-center">
                      <UserIcon size={10} className="text-[#f6f3fa]/30" />
                    </div>
                  )}
                </div>
                <span className="text-sm text-[#f6f3fa] truncate">{task.title}</span>
              </div>
            );
          })}
        </div>

        {/* Right Scrollable Area: Gantt Bars */}
        <div className="flex-1 min-w-max relative" style={{ width: `${totalDays * 40}px` }}>

          {/* Background Grid Lines */}
          <div className="absolute inset-0 flex pointer-events-none">
            {days.map(day => (
              <div
                key={`grid-${day.toISOString()}`}
                className={`w-[40px] shrink-0 border-r border-[#f6f3fa]/5 ${isToday(day) ? 'bg-[#e6d46a]/5' : ''}`}
              />
            ))}
          </div>

          {/* Task Bars */}
          <div className="relative flex flex-col pt-0">
            {tasks.map(task => {
              const styles = getTaskBarStyles(task);
              const colors = STATUS_COLORS[task.status];

              return (
                <div key={`bar-${task.id}`} className="h-12 border-b border-[#f6f3fa]/5 relative group flex items-center">
                  {styles ? (
                    <div
                      className={`absolute h-7 rounded-md border text-xs flex items-center px-2 truncate cursor-pointer transition-all hover:brightness-110 shadow-sm
                        ${colors.bg} ${colors.border} ${colors.text}`}
                      style={{ left: styles.left, width: styles.width }}
                      title={`${task.title} (${task.startDate || 'No start'} - ${task.dueDate || 'No end'})`}
                    >
                      <span className="truncate">{task.title}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-[#f6f3fa]/20 pl-4 italic pointer-events-none">Unscheduled</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
