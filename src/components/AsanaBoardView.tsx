import React, { useEffect, useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Calendar, User as UserIcon, AlignLeft, Plus } from 'lucide-react';
import { useAsanaStore } from '../store/asanaStore';
import type { Task, TaskStatus, TaskPriority, User } from '../store/asanaStore';
import TaskCreationModal from './TaskCreationModal';

const STATUS_COLUMNS: TaskStatus[] = ['To Do', 'In Progress', 'Done'];

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  'Low': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  'Medium': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  'High': 'bg-red-500/20 text-red-300 border-red-500/30',
};

interface BoardTaskCardProps {
  task: Task;
  index: number;
  teamMembers: User[];
}

function BoardTaskCard({ task, index, teamMembers }: BoardTaskCardProps) {
  const assignee = teamMembers.find(m => m.id === task.assigneeId);

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`bg-[#202225] border p-3 rounded-lg shadow-sm mb-3 group flex flex-col gap-3 transition-colors
            ${snapshot.isDragging ? 'border-[#e6d46a]/50 shadow-[0_0_15px_rgba(230,212,106,0.15)] bg-[#25282b]' : 'border-[#f6f3fa]/10 hover:border-[#f6f3fa]/30'}`}
          style={provided.draggableProps.style}
        >
          {/* Card Header (Tags / Priorities) */}
          {task.priority && (
            <div className="flex items-center">
              <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${PRIORITY_COLORS[task.priority]}`}>
                {task.priority}
              </span>
            </div>
          )}

          {/* Card Title */}
          <h4 className="text-sm font-medium text-[#f6f3fa] leading-snug">
            {task.title}
          </h4>

          {/* Card Meta (Icons, Date, Assignee) */}
          <div className="flex items-center justify-between mt-1 pt-2 border-t border-[#f6f3fa]/5">
            <div className="flex items-center gap-3 text-[#f6f3fa]/40 text-xs">
              {task.dueDate && (
                <div className="flex items-center gap-1" title="Due Date">
                  <Calendar size={12} />
                  <span>{new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                </div>
              )}
              {task.subtasks.length > 0 && (
                <div className="flex items-center gap-1" title="Subtasks">
                  <AlignLeft size={12} />
                  <span>{task.subtasks.filter(s => s.completed).length}/{task.subtasks.length}</span>
                </div>
              )}
            </div>

            {/* Assignee Avatar */}
            <div className="shrink-0" title={assignee?.name || 'Unassigned'}>
              {assignee ? (
                <div className="w-6 h-6 rounded-full bg-[#6339b5] text-[10px] flex items-center justify-center font-medium border border-[#181a1c] text-white shadow-sm">
                  {assignee.initials}
                </div>
              ) : (
                <div className="w-6 h-6 rounded-full border border-dashed border-[#f6f3fa]/30 flex items-center justify-center bg-[#181a1c]">
                  <UserIcon size={12} className="text-[#f6f3fa]/30" />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
}

export default function AsanaBoardView() {
  const { tasks, project, moveTaskStatus } = useAsanaStore();
  const [isMounted, setIsMounted] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Prevent SSR/Hydration mismatch with @hello-pangea/dnd in React 18+
  useEffect(() => {
    const timer = requestAnimationFrame(() => setIsMounted(true));
    return () => cancelAnimationFrame(timer);
  }, []);

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    // Move across columns triggers status update
    if (destination.droppableId !== source.droppableId) {
      moveTaskStatus(draggableId, destination.droppableId as TaskStatus);
    }
    // Note: If we wanted to reorder within the same column, we would update the store's task array order here.
  };

  if (!isMounted) return null;

  return (
    <div className="flex flex-col h-full bg-[#181a1c] p-6 overflow-hidden">
      <div className="flex justify-between items-center mb-6 shrink-0">
        <h2 className="text-xl font-bold text-[#f6f3fa]">Project Board</h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-[#6339b5] hover:bg-[#522b9c] text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
        >
          <Plus size={16} />
          Add Task
        </button>
      </div>

      <div className="flex-1 flex overflow-x-auto">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex gap-6 h-full items-start">
            {STATUS_COLUMNS.map(status => {
              const columnTasks = tasks.filter(t => t.status === status);

              return (
                <div key={status} className="w-[300px] shrink-0 flex flex-col max-h-full">
                  {/* Column Header */}
                  <div className="flex items-center justify-between mb-4 px-1">
                    <h3 className="font-semibold text-sm text-[#f6f3fa] flex items-center gap-2">
                      {status}
                      <span className="text-[#f6f3fa]/40 font-normal text-xs">{columnTasks.length}</span>
                    </h3>
                    <button onClick={() => setIsModalOpen(true)} className="text-[#f6f3fa]/40 hover:text-[#f6f3fa] transition-colors p-1 rounded hover:bg-[#f6f3fa]/10">
                      <Plus size={16} />
                    </button>
                  </div>

                  {/* Droppable Area */}
                  <Droppable droppableId={status}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`flex-1 overflow-y-auto hide-scrollbar min-h-[150px] rounded-lg transition-colors p-1
                          ${snapshot.isDraggingOver ? 'bg-[#f6f3fa]/5' : 'bg-transparent'}`}
                      >
                        {columnTasks.map((task, index) => (
                          <BoardTaskCard
                            key={task.id}
                            task={task}
                            index={index}
                            teamMembers={project.teamMembers}
                          />
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
          </div>
        </DragDropContext>
      </div>

      {isModalOpen && <TaskCreationModal onClose={() => setIsModalOpen(false)} />}
    </div>
  );
}
