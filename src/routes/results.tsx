import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Trophy, Medal } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState, LoadingState } from "@/components/common/States";
import { GradeBadge } from "@/components/common/GradeBadge";
import { TermYearPicker } from "@/components/common/TermYearPicker";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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

export const Route = createFileRoute("/results")({
  head: () => ({
    meta: [
      { title: "Results — Ikonex Academy" },
      { name: "description", content: "Automated totals, averages, grades and class rankings." },
    ],
  }),
  component: ResultsPage,
});

function RankBadge({ pos }: { pos?: number }) {
  if (pos && pos <= 3) {
    const colors = ["text-warning", "text-muted-foreground", "text-accent"];
    return (
      <span className={`inline-flex items-center gap-1 font-semibold ${colors[pos - 1]}`}>
        <Medal className="h-4 w-4" /> {pos}
      </span>
    );
  }
  return <span className="font-medium">{pos ?? "-"}</span>;
}

function ResultsPage() {
  const { data: streams } = useStreams();
  const { data: scales } = useGradeScales();
  const [streamId, setStreamId] = useState<string>("");
  const [term, setTerm] = useState("Term 1");
  const [year, setYear] = useState(new Date().getFullYear());
  const [subjectId, setSubjectId] = useState<string>("");

  const { data: students, isLoading } = useStudents(streamId || undefined);
  const { data: streamSubjects } = useStreamSubjects(streamId || undefined);
  const { data: scores } = useScores({ streamId: streamId || undefined, term, year });

  const studentIds = useMemo(() => (students ?? []).map((s) => s.id), [students]);
  const resultsMap = useMemo(
    () => computeStudentResults(studentIds, scores ?? [], scales ?? []),
    [studentIds, scores, scales],
  );

  const ranked = useMemo(() => {
    return (students ?? [])
      .map((st) => ({ student: st, result: resultsMap.get(st.id) }))
      .filter((x) => x.result && x.result.subjectCount > 0)
      .sort((a, b) => (a.result!.position ?? 0) - (b.result!.position ?? 0));
  }, [students, resultsMap]);

  const subjectRanked = useMemo(() => {
    if (!subjectId) return [];
    return (scores ?? [])
      .filter((s) => s.subject_id === subjectId)
      .map((s) => {
        const st = students?.find((x) => x.id === s.student_id);
        const total = scoreTotal(s);
        return {
          name: st ? `${st.first_name} ${st.last_name}` : "Unknown",
          admission: st?.admission_number ?? "",
          ca: Number(s.ca_score),
          exam: Number(s.exam_score),
          total,
          grade: resolveGrade(total, scales ?? []).grade,
        };
      })
      .sort((a, b) => b.total - a.total);
  }, [subjectId, scores, students, scales]);

  return (
    <AppShell>
      <PageHeader
        title="Results Processing"
        description="Automatically calculated totals, averages, grades and positions."
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
        <EmptyState icon={Trophy} title="Select a class stream" description="Pick a stream to process results." />
      ) : isLoading ? (
        <LoadingState />
      ) : (
        <Tabs defaultValue="overall">
          <TabsList>
            <TabsTrigger value="overall">Overall ranking</TabsTrigger>
            <TabsTrigger value="subject">By subject</TabsTrigger>
          </TabsList>

          <TabsContent value="overall">
            {ranked.length === 0 ? (
              <EmptyState
                icon={Trophy}
                title="No results for this term"
                description="Record scores for this stream and term first."
              />
            ) : (
              <Card className="overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Pos</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead className="text-center">Subjects</TableHead>
                      <TableHead className="text-center">Total</TableHead>
                      <TableHead className="text-center">Average</TableHead>
                      <TableHead className="text-center">Grade</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ranked.map(({ student, result }) => (
                      <TableRow key={student.id}>
                        <TableCell>
                          <RankBadge pos={result!.position} />
                        </TableCell>
                        <TableCell>
                          <Link
                            to="/students/$id"
                            params={{ id: student.id }}
                            className="font-medium text-primary hover:underline"
                          >
                            {student.first_name} {student.last_name}
                          </Link>
                          <span className="ml-2 font-mono text-xs text-muted-foreground">
                            {student.admission_number}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">{result!.subjectCount}</TableCell>
                        <TableCell className="text-center font-semibold">
                          {result!.total.toFixed(1)}
                        </TableCell>
                        <TableCell className="text-center">{result!.average.toFixed(2)}%</TableCell>
                        <TableCell className="text-center">
                          <GradeBadge grade={result!.grade} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="subject">
            <div className="mb-4 max-w-xs">
              <Label className="mb-2 block">Subject</Label>
              <Select value={subjectId} onValueChange={setSubjectId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {streamSubjects?.map((s) => (
                    <SelectItem key={s.subject_id} value={s.subject_id}>
                      {s.subjects.code} — {s.subjects.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {!subjectId ? (
              <EmptyState icon={Trophy} title="Select a subject" description="Choose a subject to view class performance." />
            ) : subjectRanked.length === 0 ? (
              <EmptyState icon={Trophy} title="No scores for this subject" />
            ) : (
              <Card className="overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Pos</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead className="text-center">CA</TableHead>
                      <TableHead className="text-center">Exam</TableHead>
                      <TableHead className="text-center">Total</TableHead>
                      <TableHead className="text-center">Grade</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subjectRanked.map((r, i) => (
                      <TableRow key={r.admission + i}>
                        <TableCell>
                          <RankBadge pos={i + 1} />
                        </TableCell>
                        <TableCell className="font-medium">
                          {r.name}
                          <span className="ml-2 font-mono text-xs text-muted-foreground">
                            {r.admission}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">{r.ca}</TableCell>
                        <TableCell className="text-center">{r.exam}</TableCell>
                        <TableCell className="text-center font-semibold">{r.total.toFixed(1)}</TableCell>
                        <TableCell className="text-center">
                          <GradeBadge grade={r.grade} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      )}
    </AppShell>
  );
}
