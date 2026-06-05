import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Layers, Plus, Pencil, Trash2, Eye } from "lucide-react";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useDeleteStream, useSaveStream, useStreams } from "@/lib/queries";
import type { ClassStream } from "@/lib/types";

export const Route = createFileRoute("/streams")({
  head: () => ({
    meta: [
      { title: "Class Streams — Ikonex Academy" },
      { name: "description", content: "Create and manage class streams such as Form 1A, 1B, 1C." },
    ],
  }),
  component: StreamsPage,
});

function StreamForm({ existing, onClose }: { existing?: ClassStream; onClose: () => void }) {
  const save = useSaveStream();
  const [name, setName] = useState(existing?.name ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");

  const submit = async () => {
    if (!name.trim()) {
      toast.error("Stream name is required");
      return;
    }
    try {
      await save.mutateAsync({ id: existing?.id, name: name.trim(), description: description.trim() });
      toast.success(existing ? "Stream updated" : "Stream created");
      onClose();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{existing ? "Edit class stream" : "New class stream"}</DialogTitle>
        <DialogDescription>
          Add or update a class stream such as Form 1A, Form 1B or Form 1C.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4 py-2">
        <div className="space-y-2">
          <Label htmlFor="name">Stream name</Label>
          <Input
            id="name"
            placeholder="e.g. Form 1A"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="desc">Description</Label>
          <Textarea
            id="desc"
            placeholder="Optional notes about this stream"
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
          {existing ? "Save changes" : "Create stream"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

function StreamsPage() {
  const { data: streams, isLoading } = useStreams();
  const del = useDeleteStream();
  const [openNew, setOpenNew] = useState(false);
  const [editing, setEditing] = useState<ClassStream | null>(null);

  const remove = async (id: string) => {
    try {
      await del.mutateAsync(id);
      toast.success("Stream deleted");
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <AppShell>
      <PageHeader
        title="Class Streams"
        description="Organise your school into class streams."
        actions={
          <Dialog open={openNew} onOpenChange={setOpenNew}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4" /> New stream
              </Button>
            </DialogTrigger>
            <StreamForm onClose={() => setOpenNew(false)} />
          </Dialog>
        }
      />

      {isLoading ? (
        <LoadingState />
      ) : !streams || streams.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="No class streams yet"
          description="Create your first stream like Form 1A to get started."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {streams.map((s) => (
            <Card key={s.id} className="flex flex-col p-5 shadow-elegant">
              <div className="flex items-start justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Layers className="h-5 w-5" />
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => setEditing(s)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <ConfirmDelete
                    title={`Delete ${s.name}?`}
                    description="Students will be unassigned from this stream."
                    onConfirm={() => remove(s.id)}
                    trigger={
                      <Button variant="ghost" size="icon" className="text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    }
                  />
                </div>
              </div>
              <h3 className="mt-3 text-lg font-semibold">{s.name}</h3>
              {s.description && (
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{s.description}</p>
              )}
              <Button asChild variant="outline" className="mt-4">
                <Link to="/streams/$id" params={{ id: s.id }}>
                  <Eye className="h-4 w-4" /> View details
                </Link>
              </Button>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        {editing && <StreamForm existing={editing} onClose={() => setEditing(null)} />}
      </Dialog>
    </AppShell>
  );
}
