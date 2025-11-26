'use client';

import { useEffect, useState } from 'react';

type ChomperProps = {
  state: 'idle' | 'chomping' | 'dancing';
  tasksRemaining: number;
};

export default function Chomper({ state, tasksRemaining }: ChomperProps) {
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    if (state === 'dancing') {
      setShowCelebration(true);
      const timer = setTimeout(() => setShowCelebration(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [state]);

  return (
    <div className="flex items-center gap-3">
      {/* Chomper Character */}
      <div className={`text-5xl transition-transform duration-300 ${
        state === 'chomping' ? 'scale-110 animate-bounce' : ''
      } ${
        state === 'dancing' ? 'animate-wiggle' : ''
      }`}>
        {state === 'chomping' ? '🦖' : state === 'dancing' ? '🎉🦖🎉' : '🦖'}
      </div>

      {/* Speech Bubble */}
      <div className="bg-white rounded-xl px-4 py-2 shadow-sm border-2 border-[#EA580C] relative">
        <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-r-8 border-r-[#EA580C]"></div>
        <p className="text-sm font-medium text-[#1C1917]">
          {state === 'dancing' && tasksRemaining === 0 ? (
            "All done! Great job! 🎊"
          ) : state === 'chomping' ? (
            "Nom nom! 😋"
          ) : tasksRemaining === 0 ? (
            "Ready for tasks!"
          ) : (
            `${tasksRemaining} task${tasksRemaining === 1 ? '' : 's'} to chomp!`
          )}
        </p>
      </div>

      {/* Celebration Confetti */}
      {showCelebration && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
          <div className="text-6xl animate-ping">🎉</div>
        </div>
      )}
    </div>
  );
}