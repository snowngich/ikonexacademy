import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type {
  ClassStream,
  GradeScale,
  Score,
  Student,
  StudentWithStream,
  Subject,
} from "./types";

function unwrap<T>({ data, error }: { data: T | null; error: { message: string } | null }): T {
  if (error) throw new Error(error.message);
  return data as T;
}

/* ------------------------------- CLASS STREAMS ------------------------------ */
export function useStreams() {
  return useQuery({
    queryKey: ["streams"],
    queryFn: async () =>
      unwrap<ClassStream[]>(
        await supabase.from("class_streams").select("*").order("name"),
      ),
  });
}

export function useStream(id?: string) {
  return useQuery({
    queryKey: ["stream", id],
    enabled: !!id,
    queryFn: async () =>
      unwrap<ClassStream>(
        await supabase.from("class_streams").select("*").eq("id", id!).single(),
      ),
  });
}

export function useSaveStream() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id?: string; name: string; description?: string | null }) => {
      if (input.id) {
        return unwrap(
          await supabase
            .from("class_streams")
            .update({ name: input.name, description: input.description })
            .eq("id", input.id)
            .select()
            .single(),
        );
      }
      return unwrap(
        await supabase
          .from("class_streams")
          .insert({ name: input.name, description: input.description })
          .select()
          .single(),
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["streams"] }),
  });
}

export function useDeleteStream() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) =>
      unwrap(await supabase.from("class_streams").delete().eq("id", id).select()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["streams"] });
      qc.invalidateQueries({ queryKey: ["students"] });
    },
  });
}

/* --------------------------------- SUBJECTS -------------------------------- */
export function useSubjects() {
  return useQuery({
    queryKey: ["subjects"],
    queryFn: async () =>
      unwrap<Subject[]>(await supabase.from("subjects").select("*").order("name")),
  });
}

export function useSaveSubject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id?: string;
      name: string;
      code: string;
      description?: string | null;
    }) => {
      if (input.id) {
        return unwrap(
          await supabase
            .from("subjects")
            .update({ name: input.name, code: input.code, description: input.description })
            .eq("id", input.id)
            .select()
            .single(),
        );
      }
      return unwrap(
        await supabase
          .from("subjects")
          .insert({ name: input.name, code: input.code, description: input.description })
          .select()
          .single(),
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["subjects"] }),
  });
}

export function useDeleteSubject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) =>
      unwrap(await supabase.from("subjects").delete().eq("id", id).select()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["subjects"] }),
  });
}

/* ----------------------------- STREAM SUBJECTS ----------------------------- */
export function useStreamSubjects(streamId?: string) {
  return useQuery({
    queryKey: ["stream-subjects", streamId],
    enabled: !!streamId,
    queryFn: async () =>
      unwrap<Array<{ id: string; subject_id: string; subjects: Subject }>>(
        await supabase
          .from("stream_subjects")
          .select("id, subject_id, subjects(*)")
          .eq("stream_id", streamId!),
      ),
  });
}

export function useSetStreamSubjects() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { streamId: string; subjectIds: string[] }) => {
      await supabase.from("stream_subjects").delete().eq("stream_id", input.streamId);
      if (input.subjectIds.length > 0) {
        unwrap(
          await supabase
            .from("stream_subjects")
            .insert(
              input.subjectIds.map((subject_id) => ({
                stream_id: input.streamId,
                subject_id,
              })),
            )
            .select(),
        );
      }
      return true;
    },
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ["stream-subjects", v.streamId] }),
  });
}

/* --------------------------------- STUDENTS -------------------------------- */
export function useStudents(streamId?: string) {
  return useQuery({
    queryKey: ["students", streamId ?? "all"],
    queryFn: async () => {
      let q = supabase
        .from("students")
        .select("*, class_streams(id, name)")
        .order("last_name");
      if (streamId) q = q.eq("stream_id", streamId);
      return unwrap<StudentWithStream[]>(await q);
    },
  });
}

export function useStudent(id?: string) {
  return useQuery({
    queryKey: ["student", id],
    enabled: !!id,
    queryFn: async () =>
      unwrap<StudentWithStream>(
        await supabase
          .from("students")
          .select("*, class_streams(id, name)")
          .eq("id", id!)
          .single(),
      ),
  });
}

export interface StudentInput {
  id?: string;
  admission_number: string;
  first_name: string;
  last_name: string;
  gender?: string | null;
  date_of_birth?: string | null;
  stream_id?: string | null;
}

export function useSaveStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: StudentInput) => {
      const payload = {
        admission_number: input.admission_number,
        first_name: input.first_name,
        last_name: input.last_name,
        gender: input.gender || null,
        date_of_birth: input.date_of_birth || null,
        stream_id: input.stream_id || null,
      };
      if (input.id) {
        return unwrap(
          await supabase.from("students").update(payload).eq("id", input.id).select().single(),
        );
      }
      return unwrap(await supabase.from("students").insert(payload).select().single());
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["students"] }),
  });
}

export function useDeleteStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) =>
      unwrap(await supabase.from("students").delete().eq("id", id).select()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["students"] }),
  });
}

/* ---------------------------------- SCORES --------------------------------- */
export function useScores(filter: {
  studentId?: string;
  subjectId?: string;
  streamId?: string;
  term?: string;
  year?: number;
}) {
  return useQuery({
    queryKey: ["scores", filter],
    queryFn: async () => {
      let q = supabase
        .from("scores")
        .select(
          "*, subjects(id, name, code), students(id, first_name, last_name, admission_number, stream_id)",
        );
      if (filter.studentId) q = q.eq("student_id", filter.studentId);
      if (filter.subjectId) q = q.eq("subject_id", filter.subjectId);
      if (filter.term) q = q.eq("term", filter.term);
      if (filter.year) q = q.eq("year", filter.year);
      const rows = unwrap<
        Array<
          Score & {
            subjects: { id: string; name: string; code: string } | null;
            students: {
              id: string;
              first_name: string;
              last_name: string;
              admission_number: string;
              stream_id: string | null;
            } | null;
          }
        >
      >(await q);
      if (filter.streamId) return rows.filter((r) => r.students?.stream_id === filter.streamId);
      return rows;
    },
  });
}

export interface ScoreInput {
  id?: string;
  student_id: string;
  subject_id: string;
  term: string;
  year: number;
  ca_score: number;
  exam_score: number;
}

export function useSaveScore() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: ScoreInput) => {
      const payload = {
        student_id: input.student_id,
        subject_id: input.subject_id,
        term: input.term,
        year: input.year,
        ca_score: input.ca_score,
        exam_score: input.exam_score,
      };
      if (input.id) {
        return unwrap(
          await supabase.from("scores").update(payload).eq("id", input.id).select().single(),
        );
      }
      const { data, error } = await supabase.from("scores").insert(payload).select().single();
      if (error) {
        if (error.code === "23505") {
          throw new Error(
            "A score for this student, subject, term and year already exists. Edit the existing entry instead.",
          );
        }
        throw new Error(error.message);
      }
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["scores"] }),
  });
}

export function useDeleteScore() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) =>
      unwrap(await supabase.from("scores").delete().eq("id", id).select()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["scores"] }),
  });
}

/* ------------------------------- GRADE SCALES ------------------------------ */
export function useGradeScales() {
  return useQuery({
    queryKey: ["grade-scales"],
    queryFn: async () =>
      unwrap<GradeScale[]>(
        await supabase.from("grade_scales").select("*").order("min_score", { ascending: false }),
      ),
  });
}

export function useSaveGradeScale() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id?: string;
      grade: string;
      min_score: number;
      max_score: number;
      remark?: string | null;
      points: number;
    }) => {
      const payload = {
        grade: input.grade,
        min_score: input.min_score,
        max_score: input.max_score,
        remark: input.remark ?? null,
        points: input.points,
      };
      if (input.id) {
        return unwrap(
          await supabase.from("grade_scales").update(payload).eq("id", input.id).select().single(),
        );
      }
      return unwrap(await supabase.from("grade_scales").insert(payload).select().single());
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["grade-scales"] }),
  });
}

export function useDeleteGradeScale() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) =>
      unwrap(await supabase.from("grade_scales").delete().eq("id", id).select()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["grade-scales"] }),
  });
}

/* ------------------------------ DASHBOARD STATS ---------------------------- */
export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const [streams, students, subjects, scores] = await Promise.all([
        supabase.from("class_streams").select("id", { count: "exact", head: true }),
        supabase.from("students").select("id", { count: "exact", head: true }),
        supabase.from("subjects").select("id", { count: "exact", head: true }),
        supabase.from("scores").select("id", { count: "exact", head: true }),
      ]);
      return {
        streams: streams.count ?? 0,
        students: students.count ?? 0,
        subjects: subjects.count ?? 0,
        scores: scores.count ?? 0,
      };
    },
  });
}
