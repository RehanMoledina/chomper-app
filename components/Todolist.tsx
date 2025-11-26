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

  const organizeTodosBySection = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const sections = {
      today: [] as Todo[],
      tomorrow: [] as Todo[],
      upcoming: [] as Todo[],
      someday: [] as Todo[],
    };
    
    todos.forEach(todo => {
      if (!todo.due_date) {
        sections.someday.push(todo);
        return;
      }
      
      const dueDate = new Date(todo.due_date);
      dueDate.setHours(0, 0, 0, 0);
      
      if (dueDate.getTime() === today.getTime()) {
        sections.today.push(todo);
      } else if (dueDate.getTime() === tomorrow.getTime()) {
        sections.tomorrow.push(todo);
      } else if (dueDate > tomorrow) {
        sections.upcoming.push(todo);
      } else {
        sections.today.push(todo);
      }
    });
    
    Object.keys(sections).forEach((key) => {
      sections[key as keyof typeof sections].sort((a, b) => {
        if (a.due_date && b.due_date) {
          return a.due_date.localeCompare(b.due_date);
        }
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
    });
    
    return sections;
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
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTodos(data || []);
      
      // Notify parent of task count
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
      const { error } = await supabase
        .from('todos')
        .update({ completed: !todo.completed })
        .eq('id', todo.id);

      if (error) throw error;
      
      // Trigger chomp animation if completing a task
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
      const { error} = await supabase
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

  const sections = organizeTodosBySection();
  const totalTasks = todos.length;

  if (loading) {
    return <div className="text-center py-8 text-[#78716C]">Loading tasks...</div>;
  }

  if (totalTasks === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-[#78716C] text-lg">No tasks yet. Add one to get started!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* TODAY Section */}
      {sections.today.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-[#57534E] mb-3 uppercase tracking-wide">
            Today · {sections.today.length}
          </h3>
          <div className="space-y-2">
            {sections.today.map((todo) => (
              <div key={todo.id} className="bg-white rounded-xl p-4 shadow-sm border border-[#E7E5E4]">
                <div className="flex items-start gap-3">
                  <button onClick={() => handleToggleComplete(todo)} className="flex-shrink-0 mt-1">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                      todo.completed ? 'bg-[#16A34A] border-[#16A34A]' : 'border-[#EA580C]'
                    }`}>
                      {todo.completed && (
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </button>
                  
                  <div className="flex-1">
                    <button onClick={() => setEditingTodo(todo)} className="text-left w-full">
                      <p className={`font-medium ${todo.completed ? 'line-through text-[#78716C]' : 'text-[#1C1917]'}`}>
                        {todo.text}
                      </p>
                      {todo.due_date && (
                        <p className="text-xs text-[#EA580C] mt-1">📅 {formatDate(todo.due_date)}</p>
                      )}
                      {todo.notes && (
                        <p className="text-[#78716C] text-sm mt-1">{todo.notes}</p>
                      )}
                    </button>
                  </div>

                  <button onClick={() => handleDelete(todo.id)} className="flex-shrink-0 text-[#DC2626] hover:bg-red-50 p-2 rounded-lg transition-colors">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TOMORROW Section */}
      {sections.tomorrow.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-[#57534E] mb-3 uppercase tracking-wide">
            Tomorrow · {sections.tomorrow.length}
          </h3>
          <div className="space-y-2">
            {sections.tomorrow.map((todo) => (
              <div key={todo.id} className="bg-white rounded-xl p-4 shadow-sm border border-[#E7E5E4]">
                <div className="flex items-start gap-3">
                  <button onClick={() => handleToggleComplete(todo)} className="flex-shrink-0 mt-1">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                      todo.completed ? 'bg-[#16A34A] border-[#16A34A]' : 'border-[#EA580C]'
                    }`}>
                      {todo.completed && (
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </button>
                  
                  <div className="flex-1">
                    <button onClick={() => setEditingTodo(todo)} className="text-left w-full">
                      <p className={`font-medium ${todo.completed ? 'line-through text-[#78716C]' : 'text-[#1C1917]'}`}>
                        {todo.text}
                      </p>
                      {todo.due_date && (
                        <p className="text-xs text-[#EA580C] mt-1">📅 {formatDate(todo.due_date)}</p>
                      )}
                      {todo.notes && (
                        <p className="text-[#78716C] text-sm mt-1">{todo.notes}</p>
                      )}
                    </button>
                  </div>

                  <button onClick={() => handleDelete(todo.id)} className="flex-shrink-0 text-[#DC2626] hover:bg-red-50 p-2 rounded-lg transition-colors">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* UPCOMING Section */}
      {sections.upcoming.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-[#57534E] mb-3 uppercase tracking-wide">
            Upcoming · {sections.upcoming.length}
          </h3>
          <div className="space-y-2">
            {sections.upcoming.map((todo) => (
              <div key={todo.id} className="bg-white rounded-xl p-4 shadow-sm border border-[#E7E5E4]">
                <div className="flex items-start gap-3">
                  <button onClick={() => handleToggleComplete(todo)} className="flex-shrink-0 mt-1">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                      todo.completed ? 'bg-[#16A34A] border-[#16A34A]' : 'border-[#EA580C]'
                    }`}>
                      {todo.completed && (
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </button>
                  
                  <div className="flex-1">
                    <button onClick={() => setEditingTodo(todo)} className="text-left w-full">
                      <p className={`font-medium ${todo.completed ? 'line-through text-[#78716C]' : 'text-[#1C1917]'}`}>
                        {todo.text}
                      </p>
                      {todo.due_date && (
                        <p className="text-xs text-[#EA580C] mt-1">📅 {formatDate(todo.due_date)}</p>
                      )}
                      {todo.notes && (
                        <p className="text-[#78716C] text-sm mt-1">{todo.notes}</p>
                      )}
                    </button>
                  </div>

                  <button onClick={() => handleDelete(todo.id)} className="flex-shrink-0 text-[#DC2626] hover:bg-red-50 p-2 rounded-lg transition-colors">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SOMEDAY Section */}
      {sections.someday.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-[#57534E] mb-3 uppercase tracking-wide">
            Someday · {sections.someday.length}
          </h3>
          <div className="space-y-2">
            {sections.someday.map((todo) => (
              <div key={todo.id} className="bg-white rounded-xl p-4 shadow-sm border border-[#E7E5E4]">
                <div className="flex items-start gap-3">
                  <button onClick={() => handleToggleComplete(todo)} className="flex-shrink-0 mt-1">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                      todo.completed ? 'bg-[#16A34A] border-[#16A34A]' : 'border-[#EA580C]'
                    }`}>
                      {todo.completed && (
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </button>
                  
                  <div className="flex-1">
                    <button onClick={() => setEditingTodo(todo)} className="text-left w-full">
                      <p className={`font-medium ${todo.completed ? 'line-through text-[#78716C]' : 'text-[#1C1917]'}`}>
                        {todo.text}
                      </p>
                      {todo.due_date && (
                        <p className="text-xs text-[#EA580C] mt-1">📅 {formatDate(todo.due_date)}</p>
                      )}
                      {todo.notes && (
                        <p className="text-[#78716C] text-sm mt-1">{todo.notes}</p>
                      )}
                    </button>
                  </div>

                  <button onClick={() => handleDelete(todo.id)} className="flex-shrink-0 text-[#DC2626] hover:bg-red-50 p-2 rounded-lg transition-colors">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
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