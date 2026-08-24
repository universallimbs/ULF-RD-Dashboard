import { create } from 'zustand';

// --- Phase 1: TypeScript Interfaces ---

export type TaskStatus = 'To Do' | 'In Progress' | 'Done';
export type TaskPriority = 'Low' | 'Medium' | 'High';

export interface User {
  id: string;
  name: string;
  avatarUrl?: string;
  initials: string;
  role?: string;
}

export interface Attachment {
  id: string;
  fileName: string;
  url: string;
  uploadedAt: string;
  type: 'image' | 'document';
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assigneeId: string | null;
  dueDate: string | null; // ISO Date String
  startDate: string | null; // ISO Date String
  status: TaskStatus;
  priority: TaskPriority | null;
  tags: string[];
  subtasks: Subtask[];
  attachments: Attachment[];
}

export interface ProjectMetadata {
  id: string;
  name: string;
  description: string;
  teamMembers: User[];
}

export type WorkflowTrigger = 'status_change' | 'due_date';

export interface WorkflowRule {
  id: string;
  name: string;
  trigger: WorkflowTrigger;
  condition: string;
  action: string;
}

// --- Mock Database (Initial State) ---

const mockUsers: User[] = [
  { id: 'u1', name: 'Rasna Mantha', initials: 'R', role: 'Project Manager' },
  { id: 'u2', name: 'Sahitya', initials: 'S', role: 'Lead Engineer' },
  { id: 'u3', name: 'Saja', initials: 'S', role: 'UX Designer' },
  { id: 'u4', name: 'Ana', initials: 'A', role: 'Hardware Researcher' },
  { id: 'u5', name: 'Maria', initials: 'M', role: 'QA Specialist' },
];

const mockTasks: Task[] = [
  {
    id: 't1',
    title: 'Confirm survey feedback path',
    description: 'Ensure survey routing is correct for prosthetic users.',
    assigneeId: 'u1',
    startDate: '2026-08-14',
    dueDate: '2026-08-16',
    status: 'In Progress',
    priority: 'High',
    tags: ['Survey', 'Feedback'],
    subtasks: [
      { id: 'st1', title: 'Draft email to participants', completed: true },
      { id: 'st2', title: 'Schedule follow-up meetings', completed: false }
    ],
    attachments: [
      { id: 'a2', fileName: 'survey_draft_v2.png', url: '#', uploadedAt: '2026-08-15', type: 'image' }
    ]
  },
  {
    id: 't2',
    title: 'Prepare the test bench handoff',
    description: 'Compile all documentation and CAD files for the test bench.',
    assigneeId: 'u2',
    startDate: null,
    dueDate: '2026-08-20',
    status: 'To Do',
    priority: 'Medium',
    tags: ['Engineering', 'Handoff'],
    subtasks: [],
    attachments: [
      { id: 'a1', fileName: 'testbench_v1.pdf', url: '#', uploadedAt: '2026-08-14', type: 'document' },
      { id: 'a3', fileName: 'cad_render_final.png', url: '#', uploadedAt: '2026-08-14', type: 'image' }
    ]
  },
  {
    id: 't3',
    title: 'Lock design requirement package',
    description: 'Finalize requirements for the pediatric hand.',
    assigneeId: 'u3',
    startDate: null,
    dueDate: '2026-08-10',
    status: 'Done',
    priority: 'High',
    tags: ['Requirements'],
    subtasks: [],
    attachments: []
  }
];

const mockProjectMetadata: ProjectMetadata = {
  id: 'p1',
  name: 'ULF R&D Tracker',
  description: 'Design and validation of a low-cost, repairable, 3D-printable pediatric prosthetic hand.',
  teamMembers: mockUsers
};

const mockRules: WorkflowRule[] = [
  {
    id: 'r1',
    name: 'Reassign on completion',
    trigger: 'status_change',
    condition: 'Task moves to Done',
    action: 'Reassign to QA Team'
  },
  {
    id: 'r2',
    name: 'Overdue alert',
    trigger: 'due_date',
    condition: 'Task is overdue by 1 day',
    action: 'Send reminder to assignee'
  }
];

// --- Zustand State Management Store ---

interface AsanaState {
  // State
  project: ProjectMetadata;
  tasks: Task[];
  rules: WorkflowRule[];

  // Actions
  addTask: (task: Omit<Task, 'id'>) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  deleteTask: (taskId: string) => void;
  moveTaskStatus: (taskId: string, newStatus: TaskStatus) => void;
  addRule: (rule: Omit<WorkflowRule, 'id'>) => void;
  addAttachment: (taskId: string, attachment: Attachment) => void;
}

export const useAsanaStore = create<AsanaState>((set) => ({
  project: mockProjectMetadata,
  tasks: mockTasks,
  rules: mockRules,

  addTask: (taskData) => set((state) => ({
    tasks: [...state.tasks, { ...taskData, id: `t${Date.now()}` }]
  })),

  updateTask: (taskId, updates) => set((state) => ({
    tasks: state.tasks.map((t) => (t.id === taskId ? { ...t, ...updates } : t))
  })),

  deleteTask: (taskId) => set((state) => ({
    tasks: state.tasks.filter((t) => t.id !== taskId)
  })),

  moveTaskStatus: (taskId, newStatus) => set((state) => ({
    tasks: state.tasks.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
  })),

  addAttachment: (taskId, attachment) => set((state) => ({
    tasks: state.tasks.map((t) => (t.id === taskId ? { ...t, attachments: [...t.attachments, attachment] } : t))
  })),

  addRule: (ruleData) => set((state) => ({
    rules: [...state.rules, { ...ruleData, id: `r${Date.now()}` }]
  }))
}));
