'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Todo } from '@/lib/types';
import EditTaskModal from '@/components/EditTaskModal';

type TodoListProps = {
  onTasksChange?: (count: number) => void;
  onTaskComplete?: () => void;
};

export default function TodoList({ onTasksChange, onTaskComplete }: TodoListProps = {}) {
  const { user } = useAuth();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [filter, setFilter] = useState<'all' | 'today' | 'week' | 'month' | 'completed'>('all');

  // Date helper functions
  const isToday = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    date.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    return date.getTime() === today.getTime();
  };

  const isThisWeek = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const weekFromNow = new Date(today);
    weekFromNow.setDate(today.getDate() + 7);
    
    date.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    weekFromNow.setHours(0, 0, 0, 0);
    
    return date >= today && date <= weekFromNow;
  };

  const isThisMonth = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    return date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    today.setHours(0, 0, 0, 0);
    tomorrow.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    
    if (date.getTime() === today.getTime()) return 'Today';
    if (date.getTime() === tomorrow.getTime()) return 'Tomorrow';
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Filter todos based on selected filter
  const getFilteredTodos = () => {
    let filtered = todos;

    if (filter === 'completed') {
      return todos.filter(t => t.completed);
    }

    // For active filters, only show incomplete tasks
    filtered = todos.filter(t => !t.completed);

    switch (filter) {
      case 'today':
        return filtered.filter(t => t.due_date && isToday(t.due_date));
      case 'week':
        return filtered.filter(t => t.due_date && isThisWeek(t.due_date));
      case 'month':
        return filtered.filter(t => t.due_date && isThisMonth(t.due_date));
      case 'all':
      default:
        return filtered;
    }
  };

  // Get completed tasks (always shown at bottom)
  const getCompletedTodos = () => {
    return todos.filter(t => t.completed).sort((a, b) => 
      new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime()
    );
  };

  useEffect(() => {
    if (user) {
      loadTodos();
    }
  }, [user]);

  const loadTodos = async () => {
    try {
      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .order('due_date', { ascending: true });

      if (error) throw error;
      setTodos(data || []);
      
      const incompleteTasks = (data || []).filter(t => !t.completed).length;
      onTasksChange?.(incompleteTasks);
      
    } catch (error) {
      console.error('Error loading todos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleComplete = async (todo: Todo) => {
    try {
      // If completing a recurring task, create new instance
      if (!todo.completed && todo.is_recurring) {
        // Calculate next due date
        const currentDueDate = new Date(todo.due_date!);
        let nextDueDate = new Date(currentDueDate);
  
        if (todo.recurrence_type === 'daily') {
          nextDueDate.setDate(nextDueDate.getDate() + 1);
        } else if (todo.recurrence_type === 'weekly') {
          nextDueDate.setDate(nextDueDate.getDate() + 7);
        } else if (todo.recurrence_type === 'monthly') {
          // Add one month
          nextDueDate.setMonth(nextDueDate.getMonth() + 1);
          
          // Set to the specific day
          if (todo.recurrence_day) {
            nextDueDate.setDate(todo.recurrence_day);
          }
        }
  
        // Create new recurring task instance
        const { error: createError } = await supabase
          .from('todos')
          .insert([{
            user_id: todo.user_id,
            text: todo.text,
            notes: todo.notes,
            completed: false,
            due_date: nextDueDate.toISOString().split('T')[0],
            is_recurring: true,
            recurrence_type: todo.recurrence_type,
            recurrence_day: todo.recurrence_day,
          }]);
  
        if (createError) {
          console.error('Error creating recurring task:', createError);
          alert('Failed to create next recurring task');
          return;
        }
      }
  
      // Mark current task as completed
      const { error } = await supabase
        .from('todos')
        .update({ 
          completed: !todo.completed,
          updated_at: new Date().toISOString()
        })
        .eq('id', todo.id);
  
      if (error) throw error;
      
      if (!todo.completed) {
        onTaskComplete?.();
      }
      
      loadTodos();
    } catch (error) {
      console.error('Error toggling todo:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      const { error } = await supabase
        .from('todos')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadTodos();
    } catch (error) {
      console.error('Error deleting todo:', error);
      alert('Failed to delete task');
    }
  };

  const handleClearCompleted = async () => {
    const completedTodos = todos.filter(t => t.completed);
    if (completedTodos.length === 0) return;

    if (!confirm(`Delete ${completedTodos.length} completed task${completedTodos.length === 1 ? '' : 's'}?`)) return;

    try {
      const { error } = await supabase
        .from('todos')
        .delete()
        .in('id', completedTodos.map(t => t.id));

      if (error) throw error;
      loadTodos();
    } catch (error) {
      console.error('Error clearing completed:', error);
      alert('Failed to clear completed tasks');
    }
  };

  const filteredTodos = getFilteredTodos();
  const completedTodos = getCompletedTodos();

  if (loading) {
    return <div className="text-center py-8 text-[#78716C]">Loading tasks...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Filter Dropdown */}
      <div className="flex justify-between items-center">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as any)}
          className="px-4 py-2 bg-white border-2 border-[#E7E5E4] rounded-xl font-semibold text-[#1C1917] focus:border-[#EA580C] focus:outline-none cursor-pointer"
        >
          <option value="all">All Tasks</option>
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="completed">Completed Only</option>
        </select>

        <span className="text-sm text-[#78716C]">
          {filteredTodos.length} task{filteredTodos.length === 1 ? '' : 's'}
        </span>
      </div>

      {/* Active Tasks */}
      {filter !== 'completed' && (
        <>
          {filteredTodos.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-[#78716C] text-lg">No tasks in this view</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredTodos.map((todo) => (
                <div key={todo.id} className="bg-white rounded-xl p-4 shadow-sm border border-[#E7E5E4]">
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <button onClick={() => setEditingTodo(todo)} className="text-left w-full">
                        <p className={todo.completed ? 'task-title-completed' : 'task-title'}>
                          {todo.text}
                          {todo.is_recurring && (
                            <span className="ml-2 text-xs bg-[#EA580C] text-white px-2 py-1 rounded-full">
                              🔄 {todo.recurrence_type === 'daily' ? 'Daily' : todo.recurrence_type === 'weekly' ? 'Weekly' : 'Monthly'}
                            </span>
                          )}
                        </p>
                        {todo.due_date && (
                          <p className="text-xs text-[#EA580C] mt-1">📅 {formatDate(todo.due_date)}</p>
                        )}
                        {todo.notes && (
                          <p className="text-[#78716C] text-sm mt-1">{todo.notes}</p>
                        )}
                      </button>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleToggleComplete(todo)}
                        className="px-4 py-2 bg-[#EA580C] text-white rounded-lg font-semibold hover:bg-[#DC2626] transition-colors text-sm"
                      >
                        Complete
                      </button>
                      <button
                        onClick={() => handleDelete(todo.id)}
                        className="p-2 text-[#DC2626] hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Completed Section (always visible at bottom when not in completed filter) */}
          {completedTodos.length > 0 && (
            <div className="mt-8 pt-6 border-t-2 border-[#E7E5E4]">
              <div className="flex justify-between items-center mb-3">
                <h3 className="section-header text-[#57534E] uppercase tracking-wide">
                  Completed · {completedTodos.length}
                </h3>
                <button
                  onClick={handleClearCompleted}
                  className="text-sm text-[#DC2626] hover:text-[#B91C1C] font-medium"
                >
                  Clear Completed
                </button>
              </div>

              <div className="space-y-2">
                {completedTodos.map((todo) => (
                  <div key={todo.id} className="bg-[#F5F1ED] rounded-xl p-4 shadow-sm border border-[#E7E5E4] opacity-75">
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <button onClick={() => setEditingTodo(todo)} className="text-left w-full">
                          <p className="task-title-completed">
                            {todo.text}
                            {todo.is_recurring && (
                              <span className="ml-2 text-xs bg-[#78716C] text-white px-2 py-1 rounded-full">
                                🔄 {todo.recurrence_type === 'daily' ? 'Daily' : todo.recurrence_type === 'weekly' ? 'Weekly' : 'Monthly'}
                              </span>
                            )}
                          </p>
                          {todo.due_date && (
                            <p className="text-xs text-[#78716C] mt-1">📅 {formatDate(todo.due_date)}</p>
                          )}
                          {todo.notes && (
                            <p className="text-[#78716C] text-sm mt-1">{todo.notes}</p>
                          )}
                        </button>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleToggleComplete(todo)}
                          className="px-4 py-2 bg-[#78716C] text-white rounded-lg font-semibold hover:bg-[#57534E] transition-colors text-sm"
                        >
                          Undo
                        </button>
                        <button
                          onClick={() => handleDelete(todo.id)}
                          className="p-2 text-[#DC2626] hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Completed Filter View */}
      {filter === 'completed' && (
        <>
          {completedTodos.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-[#78716C] text-lg">No completed tasks</p>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm text-[#78716C]">
                  {completedTodos.length} completed task{completedTodos.length === 1 ? '' : 's'}
                </span>
                <button
                  onClick={handleClearCompleted}
                  className="text-sm text-[#DC2626] hover:text-[#B91C1C] font-medium"
                >
                  Clear All
                </button>
              </div>

              <div className="space-y-2">
                {completedTodos.map((todo) => (
                  <div key={todo.id} className="bg-[#F5F1ED] rounded-xl p-4 shadow-sm border border-[#E7E5E4]">
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <button onClick={() => setEditingTodo(todo)} className="text-left w-full">
                          <p className="task-title-completed">
                            {todo.text}
                            {todo.is_recurring && (
                              <span className="ml-2 text-xs bg-[#78716C] text-white px-2 py-1 rounded-full">
                                🔄 {todo.recurrence_type === 'daily' ? 'Daily' : todo.recurrence_type === 'weekly' ? 'Weekly' : 'Monthly'}
                              </span>
                            )}
                          </p>
                          {todo.due_date && (
                            <p className="text-xs text-[#78716C] mt-1">📅 {formatDate(todo.due_date)}</p>
                          )}
                          {todo.notes && (
                            <p className="text-[#78716C] text-sm mt-1">{todo.notes}</p>
                          )}
                        </button>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleToggleComplete(todo)}
                          className="px-4 py-2 bg-[#EA580C] text-white rounded-lg font-semibold hover:bg-[#DC2626] transition-colors text-sm"
                        >
                          Restore
                        </button>
                        <button
                          onClick={() => handleDelete(todo.id)}
                          className="p-2 text-[#DC2626] hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {/* Edit Modal */}
      <EditTaskModal
        todo={editingTodo}
        isOpen={editingTodo !== null}
        onClose={() => setEditingTodo(null)}
        onTaskUpdated={loadTodos}
      />
    </div>
  );
}