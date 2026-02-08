import { ChevronLeft, ChevronRight } from "lucide-react";

const NavigationArrows = ({
  onPrevious,
  onNext,
  hasPrevious = true,
  hasNext = true,
}) => {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onPrevious}
        disabled={!hasPrevious}
        className={`p-2 rounded-lg border transition-all duration-200 ${
          hasPrevious
            ? "border-border hover:border-primary hover:bg-primary/10 text-foreground"
            : "border-border/50 text-muted-foreground/50 cursor-not-allowed"
        }`}
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        onClick={onNext}
        disabled={!hasNext}
        className={`p-2 rounded-lg border transition-all duration-200 ${
          hasNext
            ? "border-border hover:border-primary hover:bg-primary/10 text-foreground"
            : "border-border/50 text-muted-foreground/50 cursor-not-allowed"
        }`}
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
};

export default NavigationArrows;
