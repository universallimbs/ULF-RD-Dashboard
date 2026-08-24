import React, { useState } from 'react';
import { useAsanaStore, Task, TaskStatus, TaskPriority, User } from '../store/asanaStore';
import { X, Plus, Calendar, User as UserIcon, Tag, Upload, Paperclip } from 'lucide-react';
import { uploadFileToDrive, determinePhaseFolder } from '../lib/drive';

interface TaskCreationModalProps {
  onClose: () => void;
}

export default function TaskCreationModal({ onClose }: TaskCreationModalProps) {
  const { project, addTask } = useAsanaStore();

  const [title, setTitle] = useState('');
  const [assigneeId, setAssigneeId] = useState<string>('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<TaskPriority | ''>('');
  const [status, setStatus] = useState<TaskStatus>('To Do');
  const [subtasks, setSubtasks] = useState<{ id: string; title: string; completed: boolean }[]>([]);
  const [newSubtask, setNewSubtask] = useState('');

  const [isUploading, setIsUploading] = useState(false);
  const [attachments, setAttachments] = useState<any[]>([]);

  const handleAddSubtask = () => {
    if (newSubtask.trim()) {
      setSubtasks([...subtasks, { id: `st${Date.now()}`, title: newSubtask, completed: false }]);
      setNewSubtask('');
    }
  };

  const removeSubtask = (id: string) => {
    setSubtasks(subtasks.filter(st => st.id !== id));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      const mockUrl = URL.createObjectURL(file);
      setAttachments(prev => [...prev, {
        id: `mock_${Date.now()}`,
        fileName: file.name,
        url: mockUrl,
        uploadedAt: new Date().toISOString(),
        type: file.type.startsWith('image/') ? 'image' : 'document'
      }]);
      return;
    }

    // Authenticate and get token
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.metadata.readonly',
      callback: async (response: any) => {
        if (response.error) {
          console.error("Auth error", response);
          return;
        }
        setIsUploading(true);
        try {
          const folderName = determinePhaseFolder(status, []);
          const res = await uploadFileToDrive(file, response.access_token, folderName);

          setAttachments(prev => [...prev, {
            id: res.id,
            fileName: res.name,
            url: res.webViewLink || '#',
            uploadedAt: new Date().toISOString(),
            type: file.type.startsWith('image/') ? 'image' : 'document'
          }]);
        } catch (err) {
          console.error(err);
        } finally {
          setIsUploading(false);
        }
      }
    });
    client.requestAccessToken();
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    addTask({
      title,
      status,
      priority: (priority as TaskPriority) || null,
      assigneeId: assigneeId || null,
      dueDate: dueDate || null,
      tags: [],
      subtasks,
      attachments
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-[#202225] border border-[#f6f3fa]/10 rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b border-[#f6f3fa]/10 bg-[#181a1c]">
          <h3 className="text-[#f6f3fa] font-semibold text-lg">Create New Task</h3>
          <button onClick={onClose} className="text-[#f6f3fa]/50 hover:text-[#f6f3fa] transition-colors p-1">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 overflow-y-auto flex-1 flex flex-col gap-6 hide-scrollbar">

          {/* Main Details */}
          <div className="flex flex-col gap-4">
            <div>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full bg-transparent border-none text-2xl font-bold text-[#f6f3fa] focus:outline-none placeholder:text-[#f6f3fa]/20"
                placeholder="Task Name"
                autoFocus
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 text-sm">
                <div className="w-24 text-[#f6f3fa]/50 flex items-center gap-2"><UserIcon size={14} /> Assignee</div>
                <select
                  value={assigneeId}
                  onChange={e => setAssigneeId(e.target.value)}
                  className="flex-1 bg-[#181a1c] border border-[#f6f3fa]/10 rounded px-3 py-1.5 text-[#f6f3fa] focus:outline-none focus:border-[#6339b5]"
                >
                  <option value="">Unassigned</option>
                  {project.teamMembers.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <div className="w-24 text-[#f6f3fa]/50 flex items-center gap-2"><Calendar size={14} /> Due Date</div>
                <input
                  type="date"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  className="flex-1 bg-[#181a1c] border border-[#f6f3fa]/10 rounded px-3 py-1.5 text-[#f6f3fa] focus:outline-none focus:border-[#6339b5]"
                />
              </div>

              <div className="flex items-center gap-3 text-sm">
                <div className="w-24 text-[#f6f3fa]/50 flex items-center gap-2"><Tag size={14} /> Status</div>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value as TaskStatus)}
                  className="flex-1 bg-[#181a1c] border border-[#f6f3fa]/10 rounded px-3 py-1.5 text-[#f6f3fa] focus:outline-none focus:border-[#6339b5]"
                >
                  <option value="To Do">To Do</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Done">Done</option>
                </select>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <div className="w-24 text-[#f6f3fa]/50 flex items-center gap-2"><Tag size={14} /> Priority</div>
                <select
                  value={priority}
                  onChange={e => setPriority(e.target.value as TaskPriority | '')}
                  className="flex-1 bg-[#181a1c] border border-[#f6f3fa]/10 rounded px-3 py-1.5 text-[#f6f3fa] focus:outline-none focus:border-[#6339b5]"
                >
                  <option value="">None</option>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
            </div>
          </div>

          <hr className="border-[#f6f3fa]/5" />

          {/* Subtasks Engine */}
          <div>
            <h4 className="text-sm font-semibold text-[#f6f3fa] mb-3">Subtasks</h4>
            <div className="flex flex-col gap-2 mb-3">
              {subtasks.map(st => (
                <div key={st.id} className="flex items-center justify-between group bg-[#181a1c] px-3 py-2 border border-[#f6f3fa]/5 rounded text-sm">
                  <span className="text-[#f6f3fa]/80">{st.title}</span>
                  <button type="button" onClick={() => removeSubtask(st.id)} className="text-[#f6f3fa]/20 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newSubtask}
                onChange={e => setNewSubtask(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddSubtask())}
                placeholder="Add new subtask..."
                className="flex-1 bg-[#181a1c] border border-[#f6f3fa]/10 rounded px-3 py-2 text-sm text-[#f6f3fa] focus:outline-none focus:border-[#e6d46a]"
              />
              <button
                type="button"
                onClick={handleAddSubtask}
                className="bg-[#f6f3fa]/5 hover:bg-[#f6f3fa]/10 text-[#f6f3fa] p-2 rounded transition-colors"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          <hr className="border-[#f6f3fa]/5" />

          {/* File Attachments */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-[#f6f3fa]">Attachments</h4>
              <label className={`cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium border transition-colors ${isUploading ? 'bg-[#f6f3fa]/10 text-[#f6f3fa]/50 border-transparent' : 'bg-[#6339b5]/20 text-[#6339b5] border-[#6339b5]/30 hover:bg-[#6339b5]/30'}`}>
                {isUploading ? <><span className="animate-pulse">Uploading...</span></> : <><Upload size={14} /> Upload to Drive</>}
                <input type="file" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
              </label>
            </div>

            <div className="flex flex-col gap-2">
              {attachments.map(att => (
                <div key={att.id} className="flex items-center gap-3 bg-[#181a1c] px-3 py-2 border border-[#f6f3fa]/5 rounded text-sm">
                  <Paperclip size={14} className="text-[#e6d46a]" />
                  <a href={att.url} target="_blank" rel="noopener noreferrer" className="text-[#f6f3fa]/80 hover:text-[#f6f3fa] hover:underline truncate flex-1">
                    {att.fileName}
                  </a>
                  <button type="button" onClick={() => setAttachments(attachments.filter(a => a.id !== att.id))} className="text-[#f6f3fa]/30 hover:text-red-400">
                    <X size={14} />
                  </button>
                </div>
              ))}
              {attachments.length === 0 && !isUploading && (
                <div className="text-xs text-[#f6f3fa]/30 italic py-2">No attachments yet.</div>
              )}
            </div>
          </div>

        </form>

        <div className="p-4 border-t border-[#f6f3fa]/10 bg-[#181a1c] flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-[#f6f3fa]/70 hover:text-[#f6f3fa] font-medium">
            Cancel
          </button>
          <button onClick={handleSave} className="bg-[#6339b5] hover:bg-[#522b9c] text-white px-6 py-2 rounded text-sm font-medium transition-colors">
            Create Task
          </button>
        </div>
      </div>
    </div>
  );
}
