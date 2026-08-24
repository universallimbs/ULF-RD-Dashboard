import React, { useState } from 'react';
import { useAsanaStore } from '../store/asanaStore';
import type { WorkflowRule, WorkflowTrigger } from '../store/asanaStore';
import { Zap, ArrowRight, Plus, X, Activity, Clock } from 'lucide-react';

export default function AsanaWorkflowView() {
  const { rules, addRule } = useAsanaStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newRule, setNewRule] = useState<{
    name: string;
    trigger: WorkflowTrigger;
    condition: string;
    action: string;
  }>({
    name: '',
    trigger: 'status_change',
    condition: '',
    action: ''
  });

  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (newRule.name && newRule.condition && newRule.action) {
      addRule(newRule);
      setIsModalOpen(false);
      setNewRule({ name: '', trigger: 'status_change', condition: '', action: '' });
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#181a1c] p-6 overflow-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-xl font-bold text-[#f6f3fa]">Workflow Automation</h2>
          <p className="text-[#f6f3fa]/50 text-sm mt-1">Design rules to automate actions in your project.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-[#6339b5] hover:bg-[#522b9c] text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
        >
          <Plus size={16} />
          Add Rule
        </button>
      </div>

      <div className="flex flex-col gap-6">
        {rules.map(rule => (
          <div key={rule.id} className="bg-[#181a1c] border border-[#f6f3fa]/10 rounded-xl p-6 shadow-sm relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 left-0 w-1 h-full bg-[#e6d46a]" />

            <h3 className="text-[#f6f3fa] font-semibold mb-4">{rule.name}</h3>

            <div className="flex items-center gap-4">
              {/* Trigger Block */}
              <div className="flex-1 bg-[#202225] border border-[#f6f3fa]/10 rounded-lg p-4 flex flex-col gap-2">
                <div className="flex items-center gap-2 text-[#e6d46a] text-xs font-bold uppercase tracking-wider">
                  {rule.trigger === 'status_change' ? <Activity size={14} /> : <Clock size={14} />}
                  Trigger
                </div>
                <div className="text-[#f6f3fa] text-sm">{rule.condition}</div>
              </div>

              {/* Connecting Arrow */}
              <div className="text-[#f6f3fa]/30 flex shrink-0">
                <ArrowRight size={24} />
              </div>

              {/* Action Block */}
              <div className="flex-1 bg-[#202225] border border-[#f6f3fa]/10 rounded-lg p-4 flex flex-col gap-2">
                <div className="flex items-center gap-2 text-[#6339b5] text-xs font-bold uppercase tracking-wider">
                  <Zap size={14} />
                  Action
                </div>
                <div className="text-[#f6f3fa] text-sm">{rule.action}</div>
              </div>
            </div>
          </div>
        ))}
        {rules.length === 0 && (
          <div className="text-center py-12 border-2 border-dashed border-[#f6f3fa]/10 rounded-xl">
            <Zap size={32} className="mx-auto text-[#f6f3fa]/20 mb-3" />
            <p className="text-[#f6f3fa]/50 text-sm">No rules defined yet.</p>
          </div>
        )}
      </div>

      {/* Add Rule Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#202225] border border-[#f6f3fa]/10 rounded-xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-[#f6f3fa]/10 bg-[#181a1c]">
              <h3 className="text-[#f6f3fa] font-semibold">Create New Rule</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#f6f3fa]/50 hover:text-[#f6f3fa] transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddRule} className="p-6 flex flex-col gap-4">
              <div>
                <label className="block text-xs font-medium text-[#f6f3fa]/60 mb-1">Rule Name</label>
                <input
                  type="text"
                  value={newRule.name}
                  onChange={e => setNewRule({...newRule, name: e.target.value})}
                  className="w-full bg-[#181a1c] border border-[#f6f3fa]/10 rounded px-3 py-2 text-sm text-[#f6f3fa] focus:outline-none focus:border-[#e6d46a]"
                  placeholder="e.g., QA Hand-off"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#f6f3fa]/60 mb-1">Trigger Type</label>
                  <select
                    value={newRule.trigger}
                    onChange={e => setNewRule({...newRule, trigger: e.target.value as WorkflowTrigger})}
                    className="w-full bg-[#181a1c] border border-[#f6f3fa]/10 rounded px-3 py-2 text-sm text-[#f6f3fa] focus:outline-none focus:border-[#e6d46a]"
                  >
                    <option value="status_change">Status Change</option>
                    <option value="due_date">Due Date</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#f6f3fa]/60 mb-1">Condition</label>
                  <input
                    type="text"
                    value={newRule.condition}
                    onChange={e => setNewRule({...newRule, condition: e.target.value})}
                    className="w-full bg-[#181a1c] border border-[#f6f3fa]/10 rounded px-3 py-2 text-sm text-[#f6f3fa] focus:outline-none focus:border-[#e6d46a]"
                    placeholder="e.g., Status changes to Done"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#f6f3fa]/60 mb-1">Action</label>
                <input
                  type="text"
                  value={newRule.action}
                  onChange={e => setNewRule({...newRule, action: e.target.value})}
                  className="w-full bg-[#181a1c] border border-[#f6f3fa]/10 rounded px-3 py-2 text-sm text-[#f6f3fa] focus:outline-none focus:border-[#e6d46a]"
                  placeholder="e.g., Reassign to QA"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-[#f6f3fa]/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm text-[#f6f3fa]/70 hover:text-[#f6f3fa] font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#6339b5] hover:bg-[#522b9c] text-white px-4 py-2 rounded text-sm font-medium transition-colors"
                >
                  Save Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
