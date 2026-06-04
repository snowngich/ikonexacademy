import type { Tables } from "@/integrations/supabase/types";

export type ClassStream = Tables<"class_streams">;
export type Subject = Tables<"subjects">;
export type StreamSubject = Tables<"stream_subjects">;
export type Student = Tables<"students">;
export type Score = Tables<"scores">;
export type GradeScale = Tables<"grade_scales">;

export const TERMS = ["Term 1", "Term 2", "Term 3"] as const;
export type Term = (typeof TERMS)[number];

export interface StudentWithStream extends Student {
  class_streams?: { id: string; name: string } | null;
}

export interface ScoreWithRefs extends Score {
  subjects?: { id: string; name: string; code: string } | null;
  students?: { id: string; first_name: string; last_name: string; admission_number: string } | null;
}
