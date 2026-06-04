import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { BookOpen, Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState, LoadingState } from "@/components/common/States";
import { ConfirmDelete } from "@/components/common/ConfirmDelete";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { useDeleteSubject, useSaveSubject, useSubjects } from "@/lib/queries";
import type { Subject } from "@/lib/types";

export const Route = createFileRoute("/subjects")({
  head: () => ({
    meta: [
      { title: "Subjects — Ikonex Academy" },
      { name: "description", content: "Create and manage subjects offered by the school." },
    ],
  }),
  component: SubjectsPage,
});

function SubjectForm({ existing, onClose }: { existing?: Subject; onClose: () => void }) {
  const save = useSaveSubject();
  const [name, setName] = useState(existing?.name ?? "");
  const [code, setCode] = useState(existing?.code ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");

  const submit = async () => {
    if (!name.trim() || !code.trim()) {
      toast.error("Subject name and code are required");
      return;
    }
    try {
      await save.mutateAsync({
        id: existing?.id,
        name: name.trim(),
        code: code.trim().toUpperCase(),
        description: description.trim(),
      });
      toast.success(existing ? "Subject updated" : "Subject created");
      onClose();
    } catch (e) {
      const msg = (e as Error).message.includes("duplicate")
        ? "A subject with this code already exists"
        : (e as Error).message;
      toast.error(msg);
    }
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{existing ? "Edit subject" : "New subject"}</DialogTitle>
      </DialogHeader>
      <div className="space-y-4 py-2">
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2 space-y-2">
            <Label htmlFor="sname">Subject name</Label>
            <Input id="sname" placeholder="Mathematics" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="scode">Code</Label>
            <Input id="scode" placeholder="MATH" value={code} onChange={(e) => setCode(e.target.value)} />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="sdesc">Description</Label>
          <Textarea
            id="sdesc"
            value={description ?? ""}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={submit} disabled={save.isPending}>
          {existing ? "Save changes" : "Create subject"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

function SubjectsPage() {
  const { data: subjects, isLoading } = useSubjects();
  const del = useDeleteSubject();
  const [openNew, setOpenNew] = useState(false);
  const [editing, setEditing] = useState<Subject | null>(null);

  const remove = async (id: string) => {
    try {
      await del.mutateAsync(id);
      toast.success("Subject deleted");
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <AppShell>
      <PageHeader
        title="Subjects"
        description="The curriculum offered across the school."
        actions={
          <Dialog open={openNew} onOpenChange={setOpenNew}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4" /> New subject
              </Button>
            </DialogTrigger>
            <SubjectForm onClose={() => setOpenNew(false)} />
          </Dialog>
        }
      />

      {isLoading ? (
        <LoadingState />
      ) : !subjects || subjects.length === 0 ? (
        <EmptyState icon={BookOpen} title="No subjects yet" description="Add subjects like Mathematics or English." />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subjects.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-mono text-xs font-semibold">{s.code}</TableCell>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell className="max-w-xs truncate text-muted-foreground">
                    {s.description ?? "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => setEditing(s)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <ConfirmDelete
                      title={`Delete ${s.name}?`}
                      description="Related scores will also be removed."
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
        {editing && <SubjectForm existing={editing} onClose={() => setEditing(null)} />}
      </Dialog>
    </AppShell>
  );
}
