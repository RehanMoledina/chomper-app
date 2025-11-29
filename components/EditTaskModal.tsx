'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Todo } from '@/lib/types';

type EditTaskModalProps = {
  todo: Todo | null;
  isOpen: boolean;
  onClose: () => void;
  onTaskUpdated: () => void;
};

export default function EditTaskModal({ todo, isOpen, onClose, onTaskUpdated }: EditTaskModalProps) {
  const [text, setText] = useState('');
  const [notes, setNotes] = useState('');
  const [dueDate, setDueDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Update state when todo changes
  useEffect(() => {
    console.log('=== Todo Changed ===');
    console.log('New todo:', todo);
    
    if (todo) {
      console.log('Task text:', todo.text);
      console.log('Task notes:', todo.notes);
      console.log('Task ID:', todo.id);
      console.log('Task due date:', todo.due_date);
      
      setText(todo.text);
      setNotes(todo.notes || '');
      setDueDate(todo.due_date || null);
    } else {
      console.log('Todo is null - clearing form');
      setText('');
      setNotes('');
      setDueDate(null);
    }
  }, [todo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!todo || text.trim() === '') return;

    // NEW: Require due date
  if (!dueDate) {
    alert('Please select a due date!');
    return;
  }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('todos')
        .update({
          text: text.trim(),
          notes: notes.trim() || null,
          due_date: dueDate,
        })
        .eq('id', todo.id);

      if (error) throw error;

      onTaskUpdated();
      onClose();
    } catch (error) {
      console.error('Error updating task:', error);
      alert('Failed to update task');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !todo) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black bg-opacity-30 z-40"
        onClick={onClose}
      />

      <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl z-50 animate-slide-up">
        <div className="max-w-2xl mx-auto p-6">
          <div className="w-12 h-1 bg-[#E7E5E4] rounded-full mx-auto mb-6"></div>

          <h2 className="text-2xl font-bold text-[#1C1917] mb-4">
            Edit Task
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Task"
                autoFocus
                className="w-full px-4 py-3 text-lg border-2 border-[#E7E5E4] rounded-xl focus:border-[#EA580C] focus:outline-none text-[#1C1917]"
              />
            </div>

            <div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notes (optional)"
                rows={3}
                className="w-full px-4 py-3 border-2 border-[#E7E5E4] rounded-xl focus:border-[#EA580C] focus:outline-none text-[#1C1917] resize-none"
              />
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-sm font-medium text-[#57534E] mb-2">
                Due Date <span className="text-[#DC2626]">*</span>
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

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 bg-[#F5F1ED] text-[#57534E] rounded-xl font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 bg-[#EA580C] text-white rounded-xl font-semibold hover:bg-[#DC2626] disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}