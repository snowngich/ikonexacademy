import { cn } from "@/lib/utils";

const GRADE_STYLES: Record<string, string> = {
  A: "bg-success/15 text-success border-success/30",
  B: "bg-accent/15 text-accent border-accent/30",
  C: "bg-primary/10 text-primary border-primary/30",
  D: "bg-warning/20 text-warning border-warning/40",
  E: "bg-destructive/15 text-destructive border-destructive/30",
  F: "bg-destructive/15 text-destructive border-destructive/30",
};

export function GradeBadge({ grade }: { grade: string }) {
  const style = GRADE_STYLES[grade.toUpperCase()] ?? "bg-muted text-muted-foreground border-border";
  return (
    <span
      className={cn(
        "inline-flex h-7 min-w-7 items-center justify-center rounded-md border px-2 text-xs font-bold",
        style,
      )}
    >
      {grade}
    </span>
  );
}
