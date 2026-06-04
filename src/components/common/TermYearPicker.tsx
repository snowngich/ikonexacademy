import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TERMS } from "@/lib/types";

export function TermYearPicker({
  term,
  year,
  onTerm,
  onYear,
}: {
  term: string;
  year: number;
  onTerm: (t: string) => void;
  onYear: (y: number) => void;
}) {
  const current = new Date().getFullYear();
  const years = [current + 1, current, current - 1, current - 2, current - 3];
  return (
    <div className="flex gap-2">
      <Select value={term} onValueChange={onTerm}>
        <SelectTrigger className="w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {TERMS.map((t) => (
            <SelectItem key={t} value={t}>
              {t}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={String(year)} onValueChange={(v) => onYear(Number(v))}>
        <SelectTrigger className="w-28">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {years.map((y) => (
            <SelectItem key={y} value={String(y)}>
              {y}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
