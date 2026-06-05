import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { SlidersHorizontal, Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState, LoadingState } from "@/components/common/States";
import { ConfirmDelete } from "@/components/common/ConfirmDelete";
import { GradeBadge } from "@/components/common/GradeBadge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useDeleteGradeScale, useGradeScales, useSaveGradeScale } from "@/lib/queries";
import type { GradeScale } from "@/lib/types";

export const Route = createFileRoute("/grading")({
  head: () => ({
    meta: [
      { title: "Grading Scale — Ikonex Academy" },
      { name: "description", content: "Configure the grading scale used to determine grades." },
    ],
  }),
  component: GradingPage,
});

function GradeForm({ existing, onClose }: { existing?: GradeScale; onClose: () => void }) {
  const save = useSaveGradeScale();
  const [grade, setGrade] = useState(existing?.grade ?? "");
  const [min, setMin] = useState(existing ? String(existing.min_score) : "");
  const [max, setMax] = useState(existing ? String(existing.max_score) : "");
  const [remark, setRemark] = useState(existing?.remark ?? "");
  const [points, setPoints] = useState(existing ? String(existing.points) : "0");

  const submit = async () => {
    const minN = Number(min);
    const maxN = Number(max);
    if (!grade.trim()) return toast.error("Grade label is required");
    if (Number.isNaN(minN) || Number.isNaN(maxN)) return toast.error("Min and max must be numbers");
    if (minN > maxN) return toast.error("Min score cannot exceed max score");
    try {
      await save.mutateAsync({
        id: existing?.id,
        grade: grade.trim().toUpperCase(),
        min_score: minN,
        max_score: maxN,
        remark: remark.trim(),
        points: Number(points) || 0,
      });
      toast.success(existing ? "Grade band updated" : "Grade band added");
      onClose();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{existing ? "Edit grade band" : "New grade band"}</DialogTitle>
        <DialogDescription>
          Configure the mark range, grade label, points and report-card remark.
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-2 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Grade</Label>
          <Input value={grade} onChange={(e) => setGrade(e.target.value)} placeholder="A" />
        </div>
        <div className="space-y-2">
          <Label>Points</Label>
          <Input type="number" value={points} onChange={(e) => setPoints(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Min score</Label>
          <Input type="number" value={min} onChange={(e) => setMin(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Max score</Label>
          <Input type="number" value={max} onChange={(e) => setMax(e.target.value)} />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label>Remark</Label>
          <Input value={remark ?? ""} onChange={(e) => setRemark(e.target.value)} placeholder="Excellent" />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={submit} disabled={save.isPending}>
          {existing ? "Save changes" : "Add band"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

function GradingPage() {
  const { data: scales, isLoading } = useGradeScales();
  const del = useDeleteGradeScale();
  const [openNew, setOpenNew] = useState(false);
  const [editing, setEditing] = useState<GradeScale | null>(null);

  const remove = async (id: string) => {
    try {
      await del.mutateAsync(id);
      toast.success("Grade band removed");
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <AppShell>
      <PageHeader
        title="Grading Scale"
        description="Configure the bands used to convert marks into grades. Scores are out of 100."
        actions={
          <Dialog open={openNew} onOpenChange={setOpenNew}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4" /> Add band
              </Button>
            </DialogTrigger>
            <GradeForm onClose={() => setOpenNew(false)} />
          </Dialog>
        }
      />

      {isLoading ? (
        <LoadingState />
      ) : !scales || scales.length === 0 ? (
        <EmptyState icon={SlidersHorizontal} title="No grade bands" description="Add bands like A: 80–100." />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Grade</TableHead>
                <TableHead className="text-center">Range</TableHead>
                <TableHead className="text-center">Points</TableHead>
                <TableHead>Remark</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {scales.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>
                    <GradeBadge grade={s.grade} />
                  </TableCell>
                  <TableCell className="text-center font-mono text-sm">
                    {s.min_score} – {s.max_score}
                  </TableCell>
                  <TableCell className="text-center">{s.points}</TableCell>
                  <TableCell className="text-muted-foreground">{s.remark ?? "-"}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => setEditing(s)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <ConfirmDelete
                      title={`Delete grade ${s.grade}?`}
                      onConfirm={() => remove(s.id)}
                      trigger={
                        <Button variant="ghost" size="icon" className="text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      }
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        {editing && <GradeForm existing={editing} onClose={() => setEditing(null)} />}
      </Dialog>
    </AppShell>
  );
}
