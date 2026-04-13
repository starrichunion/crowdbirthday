'use client';

interface ProgressBarProps {
  raised: number;
  goal: number;
  size?: 'sm' | 'md' | 'lg';
}

export default function ProgressBar({ raised, goal, size = 'md' }: ProgressBarProps) {
  const percentage = Math.min((raised / goal) * 100, 100);

  const heightClass = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4',
  }[size];

  return (
    <div className={`w-full ${heightClass} bg-gray-200 rounded-full overflow-hidden`}>
      <div
        className="h-full bg-gradient-to-r from-pink-400 to-pink-600 transition-all duration-500"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}
