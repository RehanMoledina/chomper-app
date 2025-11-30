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
  const [text, setText] = useState(todo?.text || '');
  const [notes, setNotes] = useState(todo?.notes || '');
  const [dueDate, setDueDate] = useState<string | null>(todo?.due_date || null);
  const [loading, setLoading] = useState(false);
  const [isRecurring, setIsRecurring] = useState(todo?.is_recurring || false);
  const [recurrenceType, setRecurrenceType] = useState<'daily' | 'weekly' | 'monthly'>(todo?.recurrence_type || 'daily');
  const [recurrenceDay, setRecurrenceDay] = useState<number>(todo?.recurrence_day || 1);

  // Update state when todo changes - FIXED VERSION
  useEffect(() => {
    if (todo) {
      setText(todo.text);
      setNotes(todo.notes || '');
      setDueDate(todo.due_date || null);
      setIsRecurring(todo.is_recurring || false);
      setRecurrenceType(todo.recurrence_type || 'daily');
      setRecurrenceDay(todo.recurrence_day || 1);
    } else {
      setText('');
      setNotes('');
      setDueDate(null);
      setIsRecurring(false);
      setRecurrenceType('daily');
      setRecurrenceDay(1);
    }
  }, [todo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!todo || text.trim() === '') return;

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
          is_recurring: isRecurring,
          recurrence_type: isRecurring ? recurrenceType : null,
          recurrence_day: isRecurring ? recurrenceDay : null,
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
            {/* Task Title */}
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

            {/* Notes */}
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
              </div>
              <input
                type="date"
                value={dueDate || ''}
                onChange={(e) => setDueDate(e.target.value || null)}
                className="w-full px-4 py-2 border-2 border-[#E7E5E4] rounded-xl focus:border-[#EA580C] focus:outline-none text-[#1C1917]"
              />
            </div>

            {/* Recurring Options - THIS WAS MISSING! */}
            <div className="pt-4 border-t-2 border-[#E7E5E4]">
              <div className="flex items-center gap-3 mb-3">
                <input
                  type="checkbox"
                  id="edit-recurring-checkbox"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                  className="w-5 h-5 text-[#EA580C] border-[#E7E5E4] rounded focus:ring-[#EA580C]"
                />
                <label htmlFor="edit-recurring-checkbox" className="text-sm font-medium text-[#1C1917] cursor-pointer">
                  🔄 Make this a recurring task
                </label>
              </div>

              {isRecurring && (
                <div className="ml-8 space-y-3 p-4 bg-[#FAF8F6] rounded-lg">
                  <div>
                    <label className="block text-sm font-medium text-[#57534E] mb-2">
                      Repeat Every
                    </label>
                    <select
                      value={recurrenceType}
                      onChange={(e) => {
                        setRecurrenceType(e.target.value as 'daily' | 'weekly' | 'monthly');
                        if (e.target.value === 'daily') setRecurrenceDay(1);
                        if (e.target.value === 'weekly') setRecurrenceDay(1);
                        if (e.target.value === 'monthly') setRecurrenceDay(1);
                      }}
                      className="w-full px-4 py-2 border-2 border-[#E7E5E4] rounded-xl focus:border-[#EA580C] focus:outline-none"
                    >
                      <option value="daily">Day</option>
                      <option value="weekly">Week</option>
                      <option value="monthly">Month</option>
                    </select>
                  </div>

                  {recurrenceType === 'weekly' && (
                    <div>
                      <label className="block text-sm font-medium text-[#57534E] mb-2">
                        On
                      </label>
                      <select
                        value={recurrenceDay}
                        onChange={(e) => setRecurrenceDay(Number(e.target.value))}
                        className="w-full px-4 py-2 border-2 border-[#E7E5E4] rounded-xl focus:border-[#EA580C] focus:outline-none"
                      >
                        <option value={1}>Monday</option>
                        <option value={2}>Tuesday</option>
                        <option value={3}>Wednesday</option>
                        <option value={4}>Thursday</option>
                        <option value={5}>Friday</option>
                        <option value={6}>Saturday</option>
                        <option value={0}>Sunday</option>
                      </select>
                    </div>
                  )}

                  {recurrenceType === 'monthly' && (
                    <div>
                      <label className="block text-sm font-medium text-[#57534E] mb-2">
                        On Day
                      </label>
                      <select
                        value={recurrenceDay}
                        onChange={(e) => setRecurrenceDay(Number(e.target.value))}
                        className="w-full px-4 py-2 border-2 border-[#E7E5E4] rounded-xl focus:border-[#EA580C] focus:outline-none"
                      >
                        {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                          <option key={day} value={day}>{day}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <p className="text-xs text-[#78716C]">
                    {recurrenceType === 'daily' && 'Task will be re-added every day after completion'}
                    {recurrenceType === 'weekly' && `Task will be re-added every ${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][recurrenceDay]} after completion`}
                    {recurrenceType === 'monthly' && `Task will be re-added on the ${recurrenceDay}${recurrenceDay === 1 ? 'st' : recurrenceDay === 2 ? 'nd' : recurrenceDay === 3 ? 'rd' : 'th'} of each month after completion`}
                  </p>
                </div>
              )}
            </div>

            {/* Buttons */}
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