import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ClipboardList, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState, LoadingState } from "@/components/common/States";
import { GradeBadge } from "@/components/common/GradeBadge";
import { TermYearPicker } from "@/components/common/TermYearPicker";
import { ConfirmDelete } from "@/components/common/ConfirmDelete";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useDeleteScore,
  useGradeScales,
  useSaveScore,
  useScores,
  useStreams,
  useStreamSubjects,
  useStudents,
} from "@/lib/queries";
import { resolveGrade } from "@/lib/grading";

export const Route = createFileRoute("/scores")({
  head: () => ({
    meta: [
      { title: "Assessments — Ikonex Academy" },
      { name: "description", content: "Record examination and continuous assessment scores." },
    ],
  }),
  component: ScoresPage,
});

interface RowEdit {
  scoreId?: string;
  ca: string;
  exam: string;
}

function ScoresPage() {
  const { data: streams } = useStreams();
  const { data: scales } = useGradeScales();
  const [streamId, setStreamId] = useState<string>("");
  const [subjectId, setSubjectId] = useState<string>("");
  const [term, setTerm] = useState("Term 1");
  const [year, setYear] = useState(new Date().getFullYear());

  const { data: streamSubjects } = useStreamSubjects(streamId || undefined);
  const { data: students, isLoading: studentsLoading } = useStudents(streamId || undefined);
  const { data: scores } = useScores({
    streamId: streamId || undefined,
    subjectId: subjectId || undefined,
    term,
    year,
  });

  const save = useSaveScore();
  const del = useDeleteScore();
  const [edits, setEdits] = useState<Record<string, RowEdit>>({});

  // Reset subject when stream changes
  useEffect(() => {
    setSubjectId("");
  }, [streamId]);

  // Prefill edit state from existing scores
  useEffect(() => {
    if (!students) return;
    const next: Record<string, RowEdit> = {};
    for (const st of students) {
      const existing = scores?.find((s) => s.student_id === st.id && s.subject_id === subjectId);
      next[st.id] = existing
        ? { scoreId: existing.id, ca: String(existing.ca_score), exam: String(existing.exam_score) }
        : { ca: "", exam: "" };
    }
    setEdits(next);
  }, [students, scores, subjectId]);

  const ready = streamId && subjectId;

  const setField = (studentId: string, field: "ca" | "exam", value: string) =>
    setEdits((e) => ({ ...e, [studentId]: { ...e[studentId], [field]: value } }));

  const saveRow = async (studentId: string) => {
    const row = edits[studentId];
    const ca = Number(row.ca || 0);
    const exam = Number(row.exam || 0);
    if (row.ca === "" && row.exam === "") {
      toast.error("Enter at least one score");
      return;
    }
    if ([ca, exam].some((v) => Number.isNaN(v) || v < 0 || v > 100)) {
      toast.error("Scores must be numbers between 0 and 100");
      return;
    }
    if (ca + exam > 100) {
      toast.error("CA + Exam cannot exceed 100");
      return;
    }
    try {
      await save.mutateAsync({
        id: row.scoreId,
        student_id: studentId,
        subject_id: subjectId,
        term,
        year,
        ca_score: ca,
        exam_score: exam,
      });
      toast.success("Score saved");
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const deleteRow = async (studentId: string) => {
    const row = edits[studentId];
    if (!row?.scoreId) return;
    try {
      await del.mutateAsync(row.scoreId);
      toast.success("Score removed");
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const subjectName = useMemo(
    () => streamSubjects?.find((s) => s.subject_id === subjectId)?.subjects.name,
    [streamSubjects, subjectId],
  );

  return (
    <AppShell>
      <PageHeader
        title="Assessments & Scoring"
        description="Record exam and continuous assessment marks per student per subject."
      />

      <Card className="mb-6 p-5">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Label>Class stream</Label>
            <Select value={streamId} onValueChange={setStreamId}>
              <SelectTrigger>
                <SelectValue placeholder="Select stream" />
              </SelectTrigger>
              <SelectContent>
                {streams?.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Subject</Label>
            <Select value={subjectId} onValueChange={setSubjectId} disabled={!streamId}>
              <SelectTrigger>
                <SelectValue placeholder={streamId ? "Select subject" : "Pick a stream first"} />
              </SelectTrigger>
              <SelectContent>
                {streamSubjects && streamSubjects.length > 0 ? (
                  streamSubjects.map((s) => (
                    <SelectItem key={s.subject_id} value={s.subject_id}>
                      {s.subjects.code} — {s.subjects.name}
                    </SelectItem>
                  ))
                ) : (
                  <div className="px-3 py-2 text-xs text-muted-foreground">
                    No subjects assigned to this stream
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 lg:col-span-2">
            <Label>Term & Year</Label>
            <TermYearPicker term={term} year={year} onTerm={setTerm} onYear={setYear} />
          </div>
        </div>
      </Card>

      {!ready ? (
        <EmptyState
          icon={ClipboardList}
          title="Select a stream and subject"
          description="Choose a class stream and subject to begin entering scores."
        />
      ) : studentsLoading ? (
        <LoadingState />
      ) : !students || students.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No students in this stream" />
      ) : (
        <Card className="overflow-hidden">
          <div className="border-b border-border px-5 py-3 text-sm text-muted-foreground">
            Entering scores for <span className="font-medium text-foreground">{subjectName}</span> —{" "}
            {term} {year}. CA + Exam must total at most 100.
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead className="w-28 text-center">CA</TableHead>
                <TableHead className="w-28 text-center">Exam</TableHead>
                <TableHead className="text-center">Total</TableHead>
                <TableHead className="text-center">Grade</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((st) => {
                const row = edits[st.id] ?? { ca: "", exam: "" };
                const total = Number(row.ca || 0) + Number(row.exam || 0);
                const grade = row.ca || row.exam ? resolveGrade(total, scales ?? []).grade : "-";
                return (
                  <TableRow key={st.id}>
                    <TableCell className="font-medium">
                      {st.first_name} {st.last_name}
                      <span className="ml-2 font-mono text-xs text-muted-foreground">
                        {st.admission_number}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        className="h-9 text-center"
                        value={row.ca}
                        onChange={(e) => setField(st.id, "ca", e.target.value)}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        className="h-9 text-center"
                        value={row.exam}
                        onChange={(e) => setField(st.id, "exam", e.target.value)}
                      />
                    </TableCell>
                    <TableCell className="text-center font-semibold">
                      {row.ca || row.exam ? total.toFixed(1) : "-"}
                    </TableCell>
                    <TableCell className="text-center">
                      <GradeBadge grade={grade} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => saveRow(st.id)}
                        disabled={save.isPending}
                      >
                        <Save className="h-4 w-4" /> Save
                      </Button>
                      {row.scoreId && (
                        <ConfirmDelete
                          title="Remove score?"
                          onConfirm={() => deleteRow(st.id)}
                          trigger={
                            <Button size="icon" variant="ghost" className="ml-1 text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          }
                        />
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}
    </AppShell>
  );
}
