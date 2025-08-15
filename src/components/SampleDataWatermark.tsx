import { cn } from "@/lib/utils";

interface SampleDataWatermarkProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  opacity?: number;
}

/**
 * Watermark component to indicate sample data is being displayed
 * Shows "SAMPLE DATA" text transparently overlaid on charts
 */
export const SampleDataWatermark = ({ 
  className, 
  size = 'md',
  opacity = 0.15
}: SampleDataWatermarkProps) => {
  const sizeClasses = {
    sm: 'text-2xl md:text-3xl',
    md: 'text-3xl md:text-4xl lg:text-5xl',
    lg: 'text-4xl md:text-5xl lg:text-6xl'
  };

  return (
    <div 
      className={cn(
        "absolute inset-0 flex items-center justify-center pointer-events-none z-10",
        "select-none",
        className
      )}
      style={{ opacity }}
    >
      <div 
        className={cn(
          "font-bold text-gray-600 transform rotate-[-15deg]",
          "tracking-wider uppercase",
          "drop-shadow-sm",
          sizeClasses[size]
        )}
        style={{
          textShadow: '1px 1px 2px rgba(0,0,0,0.1)'
        }}
      >
        SAMPLE DATA
      </div>
    </div>
  );
};

export default SampleDataWatermark;