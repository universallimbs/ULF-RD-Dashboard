import React, { useMemo } from 'react';
import { useAsanaStore } from '../store/asanaStore';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { CheckCircle2, Clock, ListTodo } from 'lucide-react';
import { isBefore, startOfDay, parseISO, isValid } from 'date-fns';

const STATUS_COLORS: Record<string, string> = {
  'To Do': '#6b7280', // gray-500
  'In Progress': '#eab308', // yellow-500
  'Done': '#22c55e', // green-500
};

export default function AsanaDashboardView() {
  const { tasks, project } = useAsanaStore();

  const { total, completed, overdue, statusData, assigneeData } = useMemo(() => {
    const today = startOfDay(new Date());
    let comp = 0;
    let over = 0;

    // Status counts
    const sCounts: Record<string, number> = {
      'To Do': 0,
      'In Progress': 0,
      'Done': 0
    };

    // Assignee counts
    const aCounts: Record<string, number> = {};

    tasks.forEach(task => {
      // Metrics
      if (task.status === 'Done') comp++;

      const dueDate = task.dueDate ? parseISO(task.dueDate) : null;
      if (dueDate && isValid(dueDate) && isBefore(dueDate, today) && task.status !== 'Done') {
        over++;
      }

      // Status distribution
      if (sCounts[task.status] !== undefined) {
        sCounts[task.status]++;
      }

      // Assignee distribution
      const assigneeName = task.assigneeId
        ? (project.teamMembers.find(m => m.id === task.assigneeId)?.name || 'Unknown')
        : 'Unassigned';

      aCounts[assigneeName] = (aCounts[assigneeName] || 0) + 1;
    });

    const sData = Object.entries(sCounts).map(([name, value]) => ({ name, value }));
    const aData = Object.entries(aCounts).map(([name, value]) => ({ name, value }));

    return {
      total: tasks.length,
      completed: comp,
      overdue: over,
      statusData: sData,
      assigneeData: aData
    };
  }, [tasks, project.teamMembers]);

  return (
    <div className="flex flex-col h-full bg-[#181a1c] p-6 overflow-auto">
      <div className="mb-8">
        <h2 className="text-xl font-bold text-[#f6f3fa]">Project Dashboard</h2>
        <p className="text-[#f6f3fa]/50 text-sm mt-1">Real-time metrics and analytics.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="bg-[#202225] border border-[#f6f3fa]/10 rounded-xl p-6 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
            <ListTodo size={24} />
          </div>
          <div>
            <div className="text-3xl font-bold text-[#f6f3fa]">{total}</div>
            <div className="text-sm text-[#f6f3fa]/50 uppercase tracking-wider font-medium">Total Tasks</div>
          </div>
        </div>

        <div className="bg-[#202225] border border-[#f6f3fa]/10 rounded-xl p-6 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center shrink-0">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <div className="text-3xl font-bold text-[#f6f3fa]">{completed}</div>
            <div className="text-sm text-[#f6f3fa]/50 uppercase tracking-wider font-medium">Completed</div>
          </div>
        </div>

        <div className="bg-[#202225] border border-[#f6f3fa]/10 rounded-xl p-6 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center shrink-0">
            <Clock size={24} />
          </div>
          <div>
            <div className="text-3xl font-bold text-[#f6f3fa]">{overdue}</div>
            <div className="text-sm text-[#f6f3fa]/50 uppercase tracking-wider font-medium">Overdue</div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-6 h-[400px]">
        {/* Status Doughnut Chart */}
        <div className="bg-[#202225] border border-[#f6f3fa]/10 rounded-xl p-6 shadow-sm flex flex-col">
          <h3 className="text-[#f6f3fa] font-semibold mb-6">Tasks by Status</h3>
          <div className="flex-1 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name]} />
                  ))}
                </Pie>
                <RechartsTooltip
                  contentStyle={{ backgroundColor: '#181a1c', borderColor: 'rgba(246, 243, 250, 0.1)', color: '#f6f3fa', borderRadius: '0.5rem' }}
                  itemStyle={{ color: '#f6f3fa' }}
                />
                <Legend wrapperStyle={{ color: '#f6f3fa', opacity: 0.7, fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-bold text-[#f6f3fa]">{total}</span>
              <span className="text-xs text-[#f6f3fa]/50 uppercase tracking-wider">Tasks</span>
            </div>
          </div>
        </div>

        {/* Assignee Bar Chart */}
        <div className="bg-[#202225] border border-[#f6f3fa]/10 rounded-xl p-6 shadow-sm flex flex-col">
          <h3 className="text-[#f6f3fa] font-semibold mb-6">Tasks by Assignee</h3>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={assigneeData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(246, 243, 250, 0.05)" vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke="rgba(246, 243, 250, 0.3)"
                  tick={{ fill: 'rgba(246, 243, 250, 0.5)', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis
                  stroke="rgba(246, 243, 250, 0.3)"
                  tick={{ fill: 'rgba(246, 243, 250, 0.5)', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <RechartsTooltip
                  cursor={{ fill: 'rgba(246, 243, 250, 0.05)' }}
                  contentStyle={{ backgroundColor: '#181a1c', borderColor: 'rgba(246, 243, 250, 0.1)', color: '#f6f3fa', borderRadius: '0.5rem' }}
                />
                <Bar dataKey="value" fill="#6339b5" radius={[4, 4, 0, 0]} maxBarSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
