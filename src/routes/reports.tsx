import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { FileText, FileDown, Users } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState, LoadingState } from "@/components/common/States";
import { GradeBadge } from "@/components/common/GradeBadge";
import { TermYearPicker } from "@/components/common/TermYearPicker";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
  useGradeScales,
  useScores,
  useStreams,
  useStreamSubjects,
  useStudents,
} from "@/lib/queries";
import { computeStudentResults, scoreTotal, resolveGrade } from "@/lib/grading";
import { generateReportCard, generateClassReport } from "@/lib/pdf";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "Reports — Ikonex Academy" },
      { name: "description", content: "Generate PDF report cards and class performance reports." },
    ],
  }),
  component: ReportsPage,
});

function ReportsPage() {
  const { data: streams } = useStreams();
  const { data: scales } = useGradeScales();
  const [streamId, setStreamId] = useState<string>("");
  const [term, setTerm] = useState("Term 1");
  const [year, setYear] = useState(new Date().getFullYear());
  const [subjectId, setSubjectId] = useState<string>("all");

  const { data: students, isLoading } = useStudents(streamId || undefined);
  const { data: streamSubjects } = useStreamSubjects(streamId || undefined);
  const { data: scores } = useScores({ streamId: streamId || undefined, term, year });

  const streamName = streams?.find((s) => s.id === streamId)?.name ?? "";
  const studentIds = useMemo(() => (students ?? []).map((s) => s.id), [students]);
  const resultsMap = useMemo(
    () => computeStudentResults(studentIds, scores ?? [], scales ?? []),
    [studentIds, scores, scales],
  );

  const studentsWithScores = (students ?? []).filter(
    (s) => (resultsMap.get(s.id)?.subjectCount ?? 0) > 0,
  );

  const downloadCard = (studentId: string) => {
    const student = students?.find((s) => s.id === studentId);
    const result = resultsMap.get(studentId);
    if (!student || !result) return;
    generateReportCard({
      studentName: `${student.first_name} ${student.last_name}`,
      admissionNumber: student.admission_number,
      streamName: student.class_streams?.name ?? streamName,
      term,
      year,
      result,
      scales: scales ?? [],
    });
    toast.success(`Report card for ${student.first_name} generated`);
  };

  const downloadAllCards = () => {
    if (studentsWithScores.length === 0) {
      toast.error("No students with scores to report");
      return;
    }
    studentsWithScores.forEach((s, i) => setTimeout(() => downloadCard(s.id), i * 400));
    toast.success(`Generating ${studentsWithScores.length} report cards…`);
  };

  const downloadClassReport = () => {
    if (subjectId === "all") {
      const rows = studentsWithScores
        .map((s) => ({ s, r: resultsMap.get(s.id)! }))
        .sort((a, b) => (a.r.position ?? 0) - (b.r.position ?? 0))
        .map(({ s, r }) => ({
          rank: r.position ?? "-",
          admission: s.admission_number,
          name: `${s.first_name} ${s.last_name}`,
          total: r.total.toFixed(1),
          average: `${r.average.toFixed(2)}%`,
          grade: r.grade,
        }));
      if (rows.length === 0) return toast.error("No results to report");
      generateClassReport({ streamName, term, year, rows, includeAverage: true });
    } else {
      const subjName = streamSubjects?.find((x) => x.subject_id === subjectId)?.subjects.name ?? "";
      const rows = (scores ?? [])
        .filter((sc) => sc.subject_id === subjectId)
        .map((sc) => {
          const st = students?.find((x) => x.id === sc.student_id);
          const total = scoreTotal(sc);
          return {
            total,
            admission: st?.admission_number ?? "",
            name: st ? `${st.first_name} ${st.last_name}` : "Unknown",
            grade: resolveGrade(total, scales ?? []).grade,
          };
        })
        .sort((a, b) => b.total - a.total)
        .map((r, i) => ({
          rank: i + 1,
          admission: r.admission,
          name: r.name,
          total: r.total.toFixed(1),
          grade: r.grade,
        }));
      if (rows.length === 0) return toast.error("No scores for this subject");
      generateClassReport({ streamName, subjectName: subjName, term, year, rows, includeAverage: false });
    }
    toast.success("Class report generated");
  };

  return (
    <AppShell>
      <PageHeader
        title="Reports"
        description="Generate printable PDF report cards and class performance reports."
      />

      <Card className="mb-6 p-5">
        <div className="grid gap-4 sm:grid-cols-2">
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
            <Label>Term & Year</Label>
            <TermYearPicker term={term} year={year} onTerm={setTerm} onYear={setYear} />
          </div>
        </div>
      </Card>

      {!streamId ? (
        <EmptyState icon={FileText} title="Select a class stream" description="Choose a stream to generate reports." />
      ) : isLoading ? (
        <LoadingState />
      ) : (
        <div className="space-y-6">
          <Card className="p-5">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <h2 className="font-semibold">Class performance report</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                <Select value={subjectId} onValueChange={setSubjectId}>
                  <SelectTrigger className="w-56">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Overall (all subjects)</SelectItem>
                    {streamSubjects?.map((s) => (
                      <SelectItem key={s.subject_id} value={s.subject_id}>
                        {s.subjects.code} — {s.subjects.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={downloadClassReport}>
                  <FileDown className="h-4 w-4" /> Generate PDF
                </Button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              {subjectId === "all"
                ? "Ranked report of every student's total, average and grade."
                : "Ranked report of student performance in the selected subject."}
            </p>
          </Card>

          <Card className="overflow-hidden">
            <div className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <h2 className="font-semibold">Individual report cards</h2>
              </div>
              <Button variant="outline" onClick={downloadAllCards}>
                <FileDown className="h-4 w-4" /> Download all
              </Button>
            </div>
            {studentsWithScores.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                No students with recorded scores for {term} {year}.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead className="text-center">Average</TableHead>
                    <TableHead className="text-center">Grade</TableHead>
                    <TableHead className="text-center">Position</TableHead>
                    <TableHead className="text-right">Report card</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {studentsWithScores
                    .map((s) => ({ s, r: resultsMap.get(s.id)! }))
                    .sort((a, b) => (a.r.position ?? 0) - (b.r.position ?? 0))
                    .map(({ s, r }) => (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">
                          {s.first_name} {s.last_name}
                          <span className="ml-2 font-mono text-xs text-muted-foreground">
                            {s.admission_number}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">{r.average.toFixed(2)}%</TableCell>
                        <TableCell className="text-center">
                          <GradeBadge grade={r.grade} />
                        </TableCell>
                        <TableCell className="text-center">
                          {r.position}/{r.classSize}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="outline" onClick={() => downloadCard(s.id)}>
                            <FileDown className="h-4 w-4" /> PDF
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </div>
      )}
    </AppShell>
  );
}
