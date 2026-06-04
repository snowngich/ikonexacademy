import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Users, Plus, Pencil, Trash2, Eye, Search } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState, LoadingState } from "@/components/common/States";
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
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  useDeleteStudent,
  useSaveStudent,
  useStreams,
  useStudents,
  type StudentInput,
} from "@/lib/queries";
import type { StudentWithStream } from "@/lib/types";

export const Route = createFileRoute("/students")({
  head: () => ({
    meta: [
      { title: "Students — Ikonex Academy" },
      { name: "description", content: "Register, edit and manage students at Ikonex Academy." },
    ],
  }),
  component: StudentsPage,
});

function StudentForm({ existing, onClose }: { existing?: StudentWithStream; onClose: () => void }) {
  const save = useSaveStudent();
  const { data: streams } = useStreams();
  const [form, setForm] = useState<StudentInput>({
    id: existing?.id,
    admission_number: existing?.admission_number ?? "",
    first_name: existing?.first_name ?? "",
    last_name: existing?.last_name ?? "",
    gender: existing?.gender ?? "",
    date_of_birth: existing?.date_of_birth ?? "",
    stream_id: existing?.stream_id ?? "",
  });

  const set = (k: keyof StudentInput, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.admission_number.trim() || !form.first_name.trim() || !form.last_name.trim()) {
      toast.error("Admission number, first and last name are required");
      return;
    }
    try {
      await save.mutateAsync(form);
      toast.success(existing ? "Student updated" : "Student registered");
      onClose();
    } catch (e) {
      const msg = (e as Error).message.includes("duplicate")
        ? "A student with this admission number already exists"
        : (e as Error).message;
      toast.error(msg);
    }
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{existing ? "Edit student" : "Register student"}</DialogTitle>
      </DialogHeader>
      <div className="grid gap-4 py-2 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>First name</Label>
          <Input value={form.first_name} onChange={(e) => set("first_name", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Last name</Label>
          <Input value={form.last_name} onChange={(e) => set("last_name", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Admission number</Label>
          <Input
            value={form.admission_number}
            onChange={(e) => set("admission_number", e.target.value)}
            placeholder="ADM-001"
          />
        </div>
        <div className="space-y-2">
          <Label>Gender</Label>
          <Select value={form.gender || undefined} onValueChange={(v) => set("gender", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Male">Male</SelectItem>
              <SelectItem value="Female">Female</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Date of birth</Label>
          <Input
            type="date"
            value={form.date_of_birth ?? ""}
            onChange={(e) => set("date_of_birth", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Class stream</Label>
          <Select value={form.stream_id || undefined} onValueChange={(v) => set("stream_id", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Assign stream" />
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
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={submit} disabled={save.isPending}>
          {existing ? "Save changes" : "Register"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

function StudentsPage() {
  const { data: streams } = useStreams();
  const [streamFilter, setStreamFilter] = useState<string>("all");
  const { data: students, isLoading } = useStudents(
    streamFilter === "all" ? undefined : streamFilter,
  );
  const del = useDeleteStudent();
  const [openNew, setOpenNew] = useState(false);
  const [editing, setEditing] = useState<StudentWithStream | null>(null);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!students) return [];
    const q = search.toLowerCase();
    return students.filter(
      (s) =>
        `${s.first_name} ${s.last_name}`.toLowerCase().includes(q) ||
        s.admission_number.toLowerCase().includes(q),
    );
  }, [students, search]);

  const remove = async (id: string) => {
    try {
      await del.mutateAsync(id);
      toast.success("Student deleted");
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <AppShell>
      <PageHeader
        title="Students"
        description="Register learners and assign them to class streams."
        actions={
          <Dialog open={openNew} onOpenChange={setOpenNew}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4" /> Register student
              </Button>
            </DialogTrigger>
            <StudentForm onClose={() => setOpenNew(false)} />
          </Dialog>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search by name or admission number"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={streamFilter} onValueChange={setStreamFilter}>
          <SelectTrigger className="sm:w-56">
            <SelectValue placeholder="All streams" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All streams</SelectItem>
            {streams?.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <LoadingState />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No students found"
          description="Register a student or adjust your filters."
        />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Adm No</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Gender</TableHead>
                <TableHead>Stream</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-mono text-xs">{s.admission_number}</TableCell>
                  <TableCell className="font-medium">
                    {s.first_name} {s.last_name}
                  </TableCell>
                  <TableCell>{s.gender ?? "-"}</TableCell>
                  <TableCell>{s.class_streams?.name ?? "Unassigned"}</TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="ghost" size="icon">
                      <Link to="/students/$id" params={{ id: s.id }}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setEditing(s)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <ConfirmDelete
                      title={`Delete ${s.first_name} ${s.last_name}?`}
                      description="All of this student's scores will also be removed."
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

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        {editing && <StudentForm existing={editing} onClose={() => setEditing(null)} />}
      </Dialog>
    </AppShell>
  );
}
