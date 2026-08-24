import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Calendar, CheckCircle2, Circle, User as UserIcon, Plus } from 'lucide-react';
import { useAsanaStore } from '../store/asanaStore';
import type { Task, TaskStatus, TaskPriority, User } from '../store/asanaStore';
import TaskCreationModal from './TaskCreationModal';

const STATUS_COLORS: Record<TaskStatus, string> = {
  'To Do': 'bg-gray-500/20 text-gray-300 border-gray-500/30',
  'In Progress': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  'Done': 'bg-green-500/20 text-green-300 border-green-500/30',
};

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  'Low': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  'Medium': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  'High': 'bg-red-500/20 text-red-300 border-red-500/30',
};

interface TaskRowProps {
  task: Task;
  teamMembers: User[];
  updateTask: (id: string, updates: Partial<Task>) => void;
}

function TaskRow({ task, teamMembers, updateTask }: TaskRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateTask(task.id, { status: e.target.value as TaskStatus });
  };

  const handlePriorityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateTask(task.id, { priority: (e.target.value || null) as TaskPriority | null });
  };

  const handleAssigneeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateTask(task.id, { assigneeId: e.target.value || null });
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateTask(task.id, { dueDate: e.target.value || null });
  };

  const assignee = teamMembers.find(m => m.id === task.assigneeId);

  return (
    <>
      <div className="group flex items-center border-b border-[#f6f3fa]/10 hover:bg-[#f6f3fa]/5 transition-colors text-sm">
        {/* Task Name Column */}
        <div className="flex-1 min-w-[300px] flex items-center gap-2 p-3 border-r border-[#f6f3fa]/5">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-[#f6f3fa]/10 rounded text-[#f6f3fa]/50 hover:text-[#f6f3fa]"
            disabled={task.subtasks.length === 0}
          >
            {task.subtasks.length > 0 ? (
              isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />
            ) : (
              <div className="w-4 h-4" /> // Empty placeholder to keep alignment
            )}
          </button>

          <div className="flex items-center gap-2">
            {task.status === 'Done' ? (
              <CheckCircle2 size={16} className="text-green-400" />
            ) : (
              <Circle size={16} className="text-[#f6f3fa]/30" />
            )}
            <span className={`font-medium ${task.status === 'Done' ? 'line-through text-[#f6f3fa]/40' : 'text-[#f6f3fa]'}`}>
              {task.title}
            </span>
          </div>
        </div>

        {/* Assignee Column */}
        <div className="w-[160px] p-2 border-r border-[#f6f3fa]/5 flex items-center">
          <div className="flex items-center gap-2 w-full px-2 py-1 hover:bg-[#f6f3fa]/5 rounded rounded-md cursor-pointer relative">
            {assignee ? (
              <div className="w-6 h-6 rounded-full bg-[#6339b5] text-xs flex items-center justify-center font-medium border border-[#181a1c] text-white shrink-0">
                {assignee.initials}
              </div>
            ) : (
              <div className="w-6 h-6 rounded-full border border-dashed border-[#f6f3fa]/30 flex items-center justify-center shrink-0">
                <UserIcon size={12} className="text-[#f6f3fa]/30" />
              </div>
            )}
            <select
              value={task.assigneeId || ''}
              onChange={handleAssigneeChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer text-sm"
            >
              <option value="">Unassigned</option>
              {teamMembers.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
            <span className="truncate text-[#f6f3fa]/70">{assignee ? assignee.name : 'Unassigned'}</span>
          </div>
        </div>

        {/* Due Date Column */}
        <div className="w-[140px] p-2 border-r border-[#f6f3fa]/5 flex items-center relative group/date">
          <div className="flex items-center gap-2 w-full px-2 py-1.5 hover:bg-[#f6f3fa]/5 rounded cursor-pointer text-[#f6f3fa]/70">
            <Calendar size={14} />
            <span>{task.dueDate ? task.dueDate : 'No date'}</span>
          </div>
          <input
            type="date"
            value={task.dueDate || ''}
            onChange={handleDateChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>

        {/* Status Column */}
        <div className="w-[140px] p-2 border-r border-[#f6f3fa]/5 flex items-center relative">
          <div className={`px-3 py-1 rounded-full border text-xs font-medium w-full text-center ${STATUS_COLORS[task.status]}`}>
            {task.status}
          </div>
          <select
            value={task.status}
            onChange={handleStatusChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          >
            <option value="To Do">To Do</option>
            <option value="In Progress">In Progress</option>
            <option value="Done">Done</option>
          </select>
        </div>

        {/* Priority Column */}
        <div className="w-[120px] p-2 flex items-center relative">
          <div className={`px-3 py-1 rounded-full border text-xs font-medium w-full text-center ${task.priority ? PRIORITY_COLORS[task.priority] : 'border-[#f6f3fa]/20 text-[#f6f3fa]/50'}`}>
            {task.priority || '---'}
          </div>
          <select
            value={task.priority || ''}
            onChange={handlePriorityChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          >
            <option value="">None</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
        </div>
      </div>

      {/* Subtasks rendering */}
      {isExpanded && task.subtasks.map((subtask) => (
        <div key={subtask.id} className="flex items-center border-b border-[#f6f3fa]/5 bg-[#181a1c]/30 text-sm">
          <div className="flex-1 min-w-[300px] flex items-center gap-2 p-3 pl-12 border-r border-[#f6f3fa]/5">
            {subtask.completed ? (
              <CheckCircle2 size={14} className="text-green-400" />
            ) : (
              <Circle size={14} className="text-[#f6f3fa]/30" />
            )}
            <span className={`text-[#f6f3fa]/70 ${subtask.completed ? 'line-through' : ''}`}>
              {subtask.title}
            </span>
          </div>
          <div className="w-[160px] border-r border-[#f6f3fa]/5"></div>
          <div className="w-[140px] border-r border-[#f6f3fa]/5"></div>
          <div className="w-[140px] border-r border-[#f6f3fa]/5"></div>
          <div className="w-[120px]"></div>
        </div>
      ))}
    </>
  );
}

export default function AsanaListView() {
  const { tasks, project, updateTask } = useAsanaStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="flex flex-col h-full bg-[#181a1c] p-6 overflow-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-[#f6f3fa]">Project Tasks</h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-[#6339b5] hover:bg-[#522b9c] text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
        >
          <Plus size={16} />
          Add Task
        </button>
      </div>

      <div className="min-w-[860px] bg-[#181a1c] border border-[#f6f3fa]/10 rounded-lg shadow-sm">

        {/* Table Header */}
        <div className="flex items-center border-b border-[#f6f3fa]/20 bg-[#f6f3fa]/5 text-[#f6f3fa]/60 text-xs font-semibold uppercase tracking-wider">
          <div className="flex-1 min-w-[300px] p-3 border-r border-[#f6f3fa]/10">Task Name</div>
          <div className="w-[160px] p-3 border-r border-[#f6f3fa]/10">Assignee</div>
          <div className="w-[140px] p-3 border-r border-[#f6f3fa]/10">Due Date</div>
          <div className="w-[140px] p-3 border-r border-[#f6f3fa]/10">Status</div>
          <div className="w-[120px] p-3">Priority</div>
        </div>

        {/* Table Body */}
        <div className="flex flex-col">
          {tasks.length === 0 ? (
            <div className="p-8 text-center text-[#f6f3fa]/50">No tasks found.</div>
          ) : (
            tasks.map(task => (
              <TaskRow
                key={task.id}
                task={task}
                teamMembers={project.teamMembers}
                updateTask={updateTask}
              />
            ))
          )}
        </div>
      </div>

      {isModalOpen && <TaskCreationModal onClose={() => setIsModalOpen(false)} />}
    </div>
  );
}
