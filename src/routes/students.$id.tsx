import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, FileDown, Trophy, User } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/common/PageHeader";
import { LoadingState, EmptyState } from "@/components/common/States";
import { StatCard } from "@/components/common/StatCard";
import { GradeBadge } from "@/components/common/GradeBadge";
import { TermYearPicker } from "@/components/common/TermYearPicker";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useGradeScales, useScores, useStudent } from "@/lib/queries";
import { computeStudentResults } from "@/lib/grading";
import { generateReportCard } from "@/lib/pdf";

export const Route = createFileRoute("/students/$id"head: () => ({ meta: [{ title: "Student Details — Ikonex Academy" }] }),
  )({
  component: StudentDetailPage,
});

function StudentDetailPage() {
  const { id } = useParams({ from: "/students/$id" });
  const { data: student, isLoading } = useStudent(id);
  const [term, setTerm] = useState("Term 1");
  const [year, setYear] = useState(new Date().getFullYear());
  const { data: scales } = useGradeScales();
  const { data: streamScores } = useScores({
    streamId: student?.stream_id ?? undefined,
    term,
    year,
  });

  if (isLoading) {
    return (
      <AppShell>
        <LoadingState />
      </AppShell>
    );
  }
  if (!student) {
    return (
      <AppShell>
        <EmptyState icon={User} title="Student not found" />
      </AppShell>
    );
  }

  const studentIds = [...new Set((streamScores ?? []).map((s) => s.student_id))];
  if (!studentIds.includes(id)) studentIds.push(id);
  const resultsMap = computeStudentResults(studentIds, streamScores ?? [], scales ?? []);
  const result = resultsMap.get(id);
  const hasScores = (result?.subjectCount ?? 0) > 0;

  const downloadReport = () => {
    if (!result || !hasScores) {
      toast.error("No scores recorded for this term/year");
      return;
    }
    generateReportCard({
      studentName: `${student.first_name} ${student.last_name}`,
      admissionNumber: student.admission_number,
      streamName: student.class_streams?.name ?? "Unassigned",
      term,
      year,
      result,
      scales: scales ?? [],
    });
    toast.success("Report card downloaded");
  };

  return (
    <AppShell>
      <Button asChild variant="ghost" size="sm" className="mb-3">
        <Link to="/students">
          <ArrowLeft className="h-4 w-4" /> Back to students
        </Link>
      </Button>
      <PageHeader
        title={`${student.first_name} ${student.last_name}`}
        description={`${student.admission_number} · ${student.class_streams?.name ?? "Unassigned"}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <TermYearPicker term={term} year={year} onTerm={setTerm} onYear={setYear} />
            <Button onClick={downloadReport}>
              <FileDown className="h-4 w-4" /> Report card
            </Button>
          </div>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Marks" value={result ? result.total.toFixed(1) : "0"} icon={Trophy} accent="primary" />
        <StatCard label="Average" value={result ? `${result.average.toFixed(1)}%` : "0%"} icon={Trophy} accent="accent" />
        <StatCard label="Overall Grade" value={result?.grade ?? "-"} icon={Trophy} accent="warning" />
        <StatCard
          label="Class Position"
          value={result?.position ? `${result.position}/${result.classSize}` : "-"}
          icon={Trophy}
          accent="success"
        />
      </div>

      <Card className="overflow-hidden">
        <div className="border-b border-border px-5 py-4">
          <h2 className="font-semibold">Performance by subject — {term} {year}</h2>
        </div>
        {!hasScores ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            No scores recorded for this term/year.{" "}
            <Link to="/scores" className="text-primary underline">
              Record scores
            </Link>
            .
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subject</TableHead>
                <TableHead className="text-center">CA</TableHead>
                <TableHead className="text-center">Exam</TableHead>
                <TableHead className="text-center">Total</TableHead>
                <TableHead className="text-center">Grade</TableHead>
                <TableHead className="text-center">Position</TableHead>
                <TableHead>Remark</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result!.subjects.map((s) => (
                <TableRow key={s.subjectId}>
                  <TableCell className="font-medium">{s.subjectName}</TableCell>
                  <TableCell className="text-center">{s.caScore}</TableCell>
                  <TableCell className="text-center">{s.examScore}</TableCell>
                  <TableCell className="text-center font-semibold">{s.total.toFixed(1)}</TableCell>
                  <TableCell className="text-center">
                    <GradeBadge grade={s.grade} />
                  </TableCell>
                  <TableCell className="text-center">
                    {s.position}/{s.classSize}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{s.remark}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </AppShell>
  );
}
