import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, BookOpen, Users, Check } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/common/PageHeader";
import { LoadingState, EmptyState } from "@/components/common/States";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useStream,
  useStudents,
  useSubjects,
  useStreamSubjects,
  useSetStreamSubjects,
} from "@/lib/queries";

export const Route = createFileRoute("/streams/$id"head: () => ({ meta: [{ title: "Stream Details — Ikonex Academy" }] }),
  )({
  component: StreamDetailPage,
});

function StreamDetailPage() {
  const { id } = useParams({ from: "/streams/$id" });
  const { data: stream, isLoading } = useStream(id);
  const { data: students } = useStudents(id);
  const { data: allSubjects } = useSubjects();
  const { data: assigned } = useStreamSubjects(id);
  const setSubjects = useSetStreamSubjects();
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    if (assigned) setSelected(assigned.map((a) => a.subject_id));
  }, [assigned]);

  const toggle = (subjectId: string) =>
    setSelected((prev) =>
      prev.includes(subjectId) ? prev.filter((x) => x !== subjectId) : [...prev, subjectId],
    );

  const saveSubjects = async () => {
    try {
      await setSubjects.mutateAsync({ streamId: id, subjectIds: selected });
      toast.success("Subjects updated for this stream");
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  if (isLoading) {
    return (
      <AppShell>
        <LoadingState />
      </AppShell>
    );
  }

  if (!stream) {
    return (
      <AppShell>
        <EmptyState icon={BookOpen} title="Stream not found" />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <Button asChild variant="ghost" size="sm" className="mb-3">
        <Link to="/streams">
          <ArrowLeft className="h-4 w-4" /> Back to streams
        </Link>
      </Button>
      <PageHeader title={stream.name} description={stream.description ?? "Class stream details"} />

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="p-5 lg:col-span-2">
          <div className="mb-4 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">Assigned subjects</h2>
          </div>
          {!allSubjects || allSubjects.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No subjects exist yet.{" "}
              <Link to="/subjects" className="text-primary underline">
                Create subjects
              </Link>
              .
            </p>
          ) : (
            <>
              <div className="max-h-80 space-y-1 overflow-y-auto pr-1">
                {allSubjects.map((subj) => (
                  <label
                    key={subj.id}
                    className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 hover:bg-muted"
                  >
                    <Checkbox
                      checked={selected.includes(subj.id)}
                      onCheckedChange={() => toggle(subj.id)}
                    />
                    <span className="text-sm">
                      <span className="font-medium">{subj.code}</span> — {subj.name}
                    </span>
                  </label>
                ))}
              </div>
              <Button onClick={saveSubjects} disabled={setSubjects.isPending} className="mt-4 w-full">
                <Check className="h-4 w-4" /> Save subject assignment
              </Button>
            </>
          )}
        </Card>

        <Card className="p-5 lg:col-span-3">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <h2 className="font-semibold">Students ({students?.length ?? 0})</h2>
            </div>
            <Button asChild size="sm" variant="outline">
              <Link to="/students">Manage</Link>
            </Button>
          </div>
          {!students || students.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No students assigned to this stream yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Adm No</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Gender</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((st) => (
                  <TableRow key={st.id}>
                    <TableCell className="font-mono text-xs">{st.admission_number}</TableCell>
                    <TableCell>
                      <Link
                        to="/students/$id"
                        params={{ id: st.id }}
                        className="font-medium text-primary hover:underline"
                      >
                        {st.first_name} {st.last_name}
                      </Link>
                    </TableCell>
                    <TableCell>{st.gender ?? "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>
    </AppShell>
  );
}
