import React, { useState } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  addMonths,
  subMonths,
  parseISO
} from 'date-fns';
import { ChevronLeft, ChevronRight, User as UserIcon } from 'lucide-react';
import { useAsanaStore, TaskStatus } from '../store/asanaStore';

const STATUS_COLORS: Record<TaskStatus, { bg: string; border: string; text: string }> = {
  'To Do': { bg: 'bg-gray-500/20', border: 'border-gray-500/50', text: 'text-gray-300' },
  'In Progress': { bg: 'bg-yellow-500/20', border: 'border-yellow-500/50', text: 'text-yellow-300' },
  'Done': { bg: 'bg-green-500/20', border: 'border-green-500/50', text: 'text-green-300' },
};

export default function AsanaCalendarView() {
  const { tasks, project, updateTask } = useAsanaStore();
  const [currentDate, setCurrentDate] = useState(new Date());

  // Generate calendar grid
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  // HTML5 Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('taskId', taskId);
    e.currentTarget.classList.add('opacity-50');
  };

  const handleDragEnd = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('opacity-50');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Necessary to allow dropping
    e.currentTarget.classList.add('bg-[#f6f3fa]/10');
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('bg-[#f6f3fa]/10');
  };

  const handleDrop = (e: React.DragEvent, dayStr: string) => {
    e.preventDefault();
    e.currentTarget.classList.remove('bg-[#f6f3fa]/10');
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) {
      updateTask(taskId, { dueDate: dayStr });
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#181a1c] p-6">

      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-[#f6f3fa]">
          {format(currentDate, 'MMMM yyyy')}
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={prevMonth}
            className="p-1.5 rounded bg-[#f6f3fa]/5 border border-[#f6f3fa]/10 text-[#f6f3fa]/70 hover:text-[#f6f3fa] hover:bg-[#f6f3fa]/10 transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={nextMonth}
            className="p-1.5 rounded bg-[#f6f3fa]/5 border border-[#f6f3fa]/10 text-[#f6f3fa]/70 hover:text-[#f6f3fa] hover:bg-[#f6f3fa]/10 transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 bg-[#181a1c] border border-[#f6f3fa]/10 rounded-lg flex flex-col overflow-hidden min-h-[500px]">
        {/* Days of week header */}
        <div className="grid grid-cols-7 border-b border-[#f6f3fa]/10 bg-[#f6f3fa]/5">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-3 text-center text-xs font-semibold uppercase tracking-wider text-[#f6f3fa]/50">
              {day}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="flex-1 grid grid-cols-7 auto-rows-fr">
          {days.map((day, idx) => {
            const dayStr = format(day, 'yyyy-MM-dd');
            const dayTasks = tasks.filter(t => t.dueDate === dayStr);
            const isCurrentMonth = isSameMonth(day, monthStart);
            const isTodayDate = isToday(day);

            return (
              <div
                key={day.toISOString()}
                className={`border-b border-r border-[#f6f3fa]/5 p-2 min-h-[100px] flex flex-col transition-colors
                  ${!isCurrentMonth ? 'bg-[#181a1c]/50 opacity-50' : ''}
                  ${idx % 7 === 6 ? 'border-r-0' : ''}
                `}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, dayStr)}
              >
                <div className={`text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full
                  ${isTodayDate ? 'bg-[#e6d46a] text-[#181a1c]' : 'text-[#f6f3fa]/60'}`}>
                  {format(day, 'd')}
                </div>

                <div className="flex flex-col gap-1 overflow-y-auto hide-scrollbar flex-1">
                  {dayTasks.map(task => {
                    const assignee = project.teamMembers.find(m => m.id === task.assigneeId);
                    const colors = STATUS_COLORS[task.status];

                    return (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, task.id)}
                        onDragEnd={handleDragEnd}
                        className={`text-xs p-1.5 rounded border flex flex-col gap-1 cursor-grab active:cursor-grabbing hover:brightness-110 shadow-sm
                          ${colors.bg} ${colors.border} ${colors.text}`}
                        title={task.title}
                      >
                        <div className="truncate font-medium">{task.title}</div>
                        {assignee && (
                          <div className="flex items-center gap-1 opacity-80 mt-0.5">
                            <div className="w-4 h-4 rounded-full bg-[#181a1c]/50 text-[8px] flex items-center justify-center text-white">
                              {assignee.initials}
                            </div>
                            <span className="truncate text-[9px]">{assignee.name}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
