import { createFileRoute, Link } from "@tanstack/react-router";
import { Layers, Users, BookOpen, ClipboardList, ArrowRight, Trophy } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { LoadingState } from "@/components/common/States";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useDashboardStats, useStreams } from "@/lib/queries";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Ikonex Academy Student Management" },
      {
        name: "description",
        content:
          "Manage class streams, students, subjects, assessments and results for Ikonex Academy.",
      },
      { property: "og:title", content: "Ikonex Academy Student Management" },
      { property: "og:description", content: "School administration dashboard for Ikonex Academy." },
    ],
  }),
  component: Dashboard,
});

const QUICK = [
  { to: "/streams", label: "Class Streams", desc: "Create & organise classes", icon: Layers },
  { to: "/students", label: "Students", desc: "Register & manage learners", icon: Users },
  { to: "/subjects", label: "Subjects", desc: "Define the curriculum", icon: BookOpen },
  { to: "/scores", label: "Assessments", desc: "Record exam & CA scores", icon: ClipboardList },
] as const;

function Dashboard() {
  const { data: stats, isLoading } = useDashboardStats();
  const { data: streams } = useStreams();

  return (
    <AppShell>
      <div className="mb-8 overflow-hidden rounded-2xl bg-gradient-primary p-8 text-primary-foreground shadow-elevated">
        <p className="text-sm font-medium opacity-80">Welcome back</p>
        <h1 className="mt-1 text-3xl font-bold sm:text-4xl">Ikonex Academy Management</h1>
        <p className="mt-2 max-w-xl text-sm opacity-90">
          A complete platform to manage class streams, students, subjects, assessment scoring,
          automated results processing and printable report cards.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button asChild variant="secondary">
            <Link to="/students">Manage students</Link>
          </Button>
          <Button asChild variant="secondary" className="bg-primary-foreground/15 text-primary-foreground hover:bg-primary-foreground/25">
            <Link to="/results">View results</Link>
          </Button>
        </div>
      </div>

      <PageHeader title="Overview" description="A snapshot of your school records." />

      {isLoading ? (
        <LoadingState />
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Class Streams" value={stats?.streams ?? 0} icon={Layers} accent="primary" />
          <StatCard label="Students" value={stats?.students ?? 0} icon={Users} accent="accent" />
          <StatCard label="Subjects" value={stats?.subjects ?? 0} icon={BookOpen} accent="warning" />
          <StatCard label="Score Records" value={stats?.scores ?? 0} icon={ClipboardList} accent="success" />
        </div>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="mb-3 text-lg font-semibold">Quick actions</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {QUICK.map(({ to, label, desc, icon: Icon }) => (
              <Link key={to} to={to}>
                <Card className="group flex items-center justify-between p-4 transition-shadow hover:shadow-elegant">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">{label}</p>
                      <p className="text-xs text-muted-foreground">{desc}</p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                </Card>
              </Link>
            ))}
          </div>
        </div>

        <div>
          <h2 className="mb-3 text-lg font-semibold">Your class streams</h2>
          <Card className="p-2">
            {streams && streams.length > 0 ? (
              <ul className="divide-y divide-border">
                {streams.slice(0, 6).map((s) => (
                  <li key={s.id}>
                    <Link
                      to="/streams/$id"
                      params={{ id: s.id }}
                      className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm hover:bg-muted"
                    >
                      <span className="font-medium">{s.name}</span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
                <Trophy className="h-6 w-6 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No streams yet.</p>
                <Button asChild size="sm">
                  <Link to="/streams">Create a stream</Link>
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
