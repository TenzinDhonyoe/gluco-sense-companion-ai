import React from 'react';
import { cn } from '@/lib/utils';
import { type StabilityScore } from '@/lib/analysis/stabilityScore';

interface StabilityPillProps {
  score: StabilityScore;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
  className?: string;
}

const StabilityPill: React.FC<StabilityPillProps> = ({ 
  score, 
  size = 'md', 
  showValue = true,
  className 
}) => {
  // Get color based on score value
  const getScoreColors = (value: number) => {
    if (value >= 80) {
      return {
        bg: 'bg-green-100',
        text: 'text-green-700',
        indicator: 'bg-green-500',
        ring: 'ring-green-200'
      };
    } else if (value >= 60) {
      return {
        bg: 'bg-blue-100',
        text: 'text-blue-700',
        indicator: 'bg-blue-500',
        ring: 'ring-blue-200'
      };
    } else if (value >= 40) {
      return {
        bg: 'bg-yellow-100',
        text: 'text-yellow-700',
        indicator: 'bg-yellow-500',
        ring: 'ring-yellow-200'
      };
    } else {
      return {
        bg: 'bg-orange-100',
        text: 'text-orange-700',
        indicator: 'bg-orange-500',
        ring: 'ring-orange-200'
      };
    }
  };

  const colors = getScoreColors(score.value);
  
  const sizeClasses = {
    sm: {
      container: 'px-2 py-1 text-xs',
      indicator: 'w-1.5 h-1.5',
      gap: 'gap-1'
    },
    md: {
      container: 'px-3 py-1.5 text-sm',
      indicator: 'w-2 h-2',
      gap: 'gap-1.5'
    },
    lg: {
      container: 'px-4 py-2 text-base',
      indicator: 'w-2.5 h-2.5',
      gap: 'gap-2'
    }
  };

  const currentSize = sizeClasses[size];

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full font-medium ring-1 ring-inset",
        colors.bg,
        colors.text,
        colors.ring,
        currentSize.container,
        currentSize.gap,
        className
      )}
      role="status"
      aria-label={`Stability score: ${score.value} out of 100, ${score.label}`}
    >
      <div 
        className={cn(
          "rounded-full flex-shrink-0",
          colors.indicator,
          currentSize.indicator
        )}
        aria-hidden="true"
      />
      <span className="whitespace-nowrap">
        {showValue && (
          <span className="font-semibold">{score.value} </span>
        )}
        <span>{score.label}</span>
      </span>
    </div>
  );
};

export default StabilityPill;