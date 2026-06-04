import type { GradeScale, Score } from "./types";

/** Total mark for a single subject score (CA + Exam). Treated as a value out of 100. */
export function scoreTotal(score: Pick<Score, "ca_score" | "exam_score">): number {
  return Number(score.ca_score ?? 0) + Number(score.exam_score ?? 0);
}

/** Resolve a grade band for a given mark using the configurable grade scales. */
export function resolveGrade(
  mark: number,
  scales: GradeScale[],
): { grade: string; remark: string; points: number } {
  const band = scales.find((s) => mark >= Number(s.min_score) && mark <= Number(s.max_score));
  if (band) {
    return { grade: band.grade, remark: band.remark ?? "", points: Number(band.points) };
  }
  return { grade: "-", remark: "", points: 0 };
}

export interface SubjectResult {
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  caScore: number;
  examScore: number;
  total: number;
  grade: string;
  remark: string;
  points: number;
  /** 1-based rank of this student among peers for this subject. */
  position?: number;
  classSize?: number;
}

export interface StudentResult {
  studentId: string;
  total: number;
  average: number;
  grade: string;
  remark: string;
  subjectCount: number;
  subjects: SubjectResult[];
  position?: number;
  classSize?: number;
}

/**
 * Compute per-student aggregate results from raw scores.
 * `scores` should be filtered to the same term/year context already.
 */
export function computeStudentResults(
  studentIds: string[],
  scores: Array<Score & { subjects?: { id: string; name: string; code: string } | null }>,
  scales: GradeScale[],
): Map<string, StudentResult> {
  const byStudent = new Map<string, StudentResult>();

  for (const studentId of studentIds) {
    const studentScores = scores.filter((s) => s.student_id === studentId);
    const subjects: SubjectResult[] = studentScores.map((s) => {
      const total = scoreTotal(s);
      const g = resolveGrade(total, scales);
      return {
        subjectId: s.subject_id,
        subjectName: s.subjects?.name ?? "Unknown",
        subjectCode: s.subjects?.code ?? "",
        caScore: Number(s.ca_score),
        examScore: Number(s.exam_score),
        total,
        grade: g.grade,
        remark: g.remark,
        points: g.points,
      };
    });

    const total = subjects.reduce((sum, s) => sum + s.total, 0);
    const subjectCount = subjects.length;
    const average = subjectCount > 0 ? total / subjectCount : 0;
    const g = resolveGrade(average, scales);

    byStudent.set(studentId, {
      studentId,
      total,
      average,
      grade: g.grade,
      remark: g.remark,
      subjectCount,
      subjects,
    });
  }

  // Subject positions across the cohort
  const subjectIds = new Set(scores.map((s) => s.subject_id));
  for (const subjectId of subjectIds) {
    const ranked = [...byStudent.values()]
      .map((r) => ({ r, subj: r.subjects.find((x) => x.subjectId === subjectId) }))
      .filter((x) => x.subj)
      .sort((a, b) => b.subj!.total - a.subj!.total);
    ranked.forEach((entry, i) => {
      entry.subj!.position = i + 1;
      entry.subj!.classSize = ranked.length;
    });
  }

  // Overall positions
  const overall = [...byStudent.values()].sort((a, b) => b.average - a.average);
  overall.forEach((r, i) => {
    r.position = i + 1;
    r.classSize = overall.length;
  });

  return byStudent;
}
