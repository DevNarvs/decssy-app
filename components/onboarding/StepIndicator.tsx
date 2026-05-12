import { cn } from "@/lib/utils";

interface StepIndicatorProps {
  current: 0 | 1 | 2;
  totalSteps?: 3;
}

export function StepIndicator({ current, totalSteps = 3 }: StepIndicatorProps) {
  return (
    <div
      role="progressbar"
      aria-valuenow={current + 1}
      aria-valuemin={1}
      aria-valuemax={totalSteps}
      aria-label={`Step ${current + 1} of ${totalSteps}`}
      className="my-6 flex items-center justify-center gap-2"
    >
      {Array.from({ length: totalSteps }, (_, i) => {
        const isActive = i === current;
        const isPast = i < current;
        return (
          <div
            key={i}
            className={cn(
              "h-1.5 rounded-full transition-all",
              isActive ? "w-6 bg-accent" : "w-1.5",
              !isActive && (isPast ? "bg-accent/40" : "bg-border"),
            )}
          />
        );
      })}
    </div>
  );
}
