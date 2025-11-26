'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

type AddTaskSheetProps = {
  isOpen: boolean;
  onClose: () => void;
  onTaskAdded: () => void;
};

export default function AddTaskSheet({ isOpen, onClose, onTaskAdded }: AddTaskSheetProps) {
  const [text, setText] = useState('');
  const [notes, setNotes] = useState('');
  const [dueDate, setDueDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (text.trim() === '') {
      alert('Please enter a task!');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('todos')
        .insert([{
          text: text.trim(),
          notes: notes.trim() || null,
          completed: false,
          due_date: dueDate,
        }]);

      if (error) throw error;

      // Success!
      setText('');
      setNotes('');
      setDueDate(null);
      onTaskAdded();
      onClose();
    } catch (error) {
      console.error('Error adding task:', error);
      alert('Failed to add task');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-30 z-40"
        onClick={onClose}
      />

      {/* Bottom Sheet */}
      <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl z-50 animate-slide-up">
        <div className="max-w-2xl mx-auto p-6">
          {/* Handle bar */}
          <div className="w-12 h-1 bg-[#E7E5E4] rounded-full mx-auto mb-6"></div>

          <h2 className="text-2xl font-bold text-[#1C1917] mb-4">
            Add Task
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Task Title */}
            <div>
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="What needs to be done?"
                autoFocus
                className="w-full px-4 py-3 text-lg border-2 border-[#E7E5E4] rounded-xl focus:border-[#EA580C] focus:outline-none text-[#1C1917]"
              />
            </div>

            {/* Notes */}
            <div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes (optional)"
                rows={3}
                className="w-full px-4 py-3 border-2 border-[#E7E5E4] rounded-xl focus:border-[#EA580C] focus:outline-none text-[#1C1917] resize-none"
              />
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-sm font-medium text-[#57534E] mb-2">
                Due Date
              </label>
              <div className="flex gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => setDueDate(new Date().toISOString().split('T')[0])}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    dueDate === new Date().toISOString().split('T')[0]
                      ? 'bg-[#EA580C] text-white'
                      : 'bg-[#F5F1ED] text-[#57534E]'
                  }`}
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const tomorrow = new Date();
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    setDueDate(tomorrow.toISOString().split('T')[0]);
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    dueDate === new Date(Date.now() + 86400000).toISOString().split('T')[0]
                      ? 'bg-[#EA580C] text-white'
                      : 'bg-[#F5F1ED] text-[#57534E]'
                  }`}
                >
                  Tomorrow
                </button>
                <button
                  type="button"
                  onClick={() => setDueDate(null)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    dueDate === null
                      ? 'bg-[#EA580C] text-white'
                      : 'bg-[#F5F1ED] text-[#57534E]'
                  }`}
                >
                  Someday
                </button>
              </div>
              <input
                type="date"
                value={dueDate || ''}
                onChange={(e) => setDueDate(e.target.value || null)}
                className="w-full px-4 py-2 border-2 border-[#E7E5E4] rounded-xl focus:border-[#EA580C] focus:outline-none text-[#1C1917]"
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 bg-[#F5F1ED] text-[#57534E] rounded-xl font-semibold hover:bg-[#E7E5E4] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 bg-[#EA580C] text-white rounded-xl font-semibold hover:bg-[#DC2626] disabled:opacity-50 transition-all active:scale-95"
              >
                {loading ? 'Adding...' : 'Add Task'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}