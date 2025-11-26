'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AuthForm from '@/components/AuthForm';
import TodoList from '@/components/Todolist';  // ← Fixed case
import AddTaskSheet from '@/components/AddTaskSheet';
import Chomper from '@/components/Chomper';

export default function Home() {
  const { user, signOut, loading } = useAuth();
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [chomperState, setChomperState] = useState<'idle' | 'chomping' | 'dancing'>('idle');
  const [tasksCount, setTasksCount] = useState(0);
  const [prevTasksCount, setPrevTasksCount] = useState(0);

  // Trigger victory dance when all tasks complete
  useEffect(() => {
    // Celebrate when going from having tasks to zero tasks
    if (tasksCount === 0 && prevTasksCount > 0) {
      setChomperState('dancing');
      const timer = setTimeout(() => setChomperState('idle'), 3000);
      return () => clearTimeout(timer); // Clean up timeout
    }
    setPrevTasksCount(tasksCount);
  }, [tasksCount, prevTasksCount]);

  // Handle task completion (chomp animation)
  // Only chomp if NOT completing the last task
  const handleTaskComplete = () => {
    // Don't chomp if this is the last task (celebration will play instead)
    if (tasksCount > 1) {
      setChomperState('chomping');
      setTimeout(() => setChomperState('idle'), 1000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF8F6] flex items-center justify-center">
        <div className="text-[#1C1917] text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FAF8F6] to-[#F5F1ED] py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-6xl font-bold text-[#EA580C] mb-2">
              🦖 Chomper
            </h1>
            <p className="text-xl text-[#57534E]">
              Chomp through your tasks!
            </p>
          </div>
          <AuthForm />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F6] pb-24">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-[#EA580C]">
                Chomper
              </h1>
              <p className="text-sm text-[#78716C]">
                {user.email}
              </p>
            </div>
          </div>
          <button
            onClick={signOut}
            className="text-[#57534E] hover:text-[#DC2626] font-medium text-sm"
          >
            Logout
          </button>
        </div>

        {/* Chomper Character */}
        <div className="mb-6">
          <Chomper state={chomperState} tasksRemaining={tasksCount} />
        </div>

        {/* Todo List */}
        <TodoList
          key={refreshTrigger}
          onTasksChange={setTasksCount}
          onTaskComplete={handleTaskComplete}
        />

        {/* FAB Button */}
        <button
          onClick={() => setIsAddTaskOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-[#EA580C] text-white rounded-full shadow-lg hover:bg-[#DC2626] active:scale-90 transition-all flex items-center justify-center text-2xl z-30"
          aria-label="Add task"
        >
          +
        </button>

        {/* Add Task Sheet */}
        <AddTaskSheet
          isOpen={isAddTaskOpen}
          onClose={() => setIsAddTaskOpen(false)}
          onTaskAdded={() => {
            setRefreshTrigger(prev => prev + 1);
          }}
        />
      </div>
    </div>
  );
}