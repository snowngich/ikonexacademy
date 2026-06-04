import { describe, it, expect } from "vitest";
import { resolveGrade, scoreTotal, computeStudentResults } from "./grading";
import type { GradeScale, Score } from "./types";

const scales: GradeScale[] = [
  { id: "1", grade: "A", min_score: 80, max_score: 100, remark: "Excellent", points: 4, created_at: "" },
  { id: "2", grade: "B", min_score: 70, max_score: 79.99, remark: "Very Good", points: 3, created_at: "" },
  { id: "3", grade: "C", min_score: 60, max_score: 69.99, remark: "Good", points: 2, created_at: "" },
  { id: "4", grade: "D", min_score: 50, max_score: 59.99, remark: "Pass", points: 1, created_at: "" },
  { id: "5", grade: "E", min_score: 0, max_score: 49.99, remark: "Fail", points: 0, created_at: "" },
];

function mkScore(student: string, subject: string, ca: number, exam: number): Score {
  return {
    id: `${student}-${subject}`,
    student_id: student,
    subject_id: subject,
    term: "Term 1",
    year: 2026,
    ca_score: ca,
    exam_score: exam,
    created_at: "",
    updated_at: "",
  };
}

describe("scoreTotal", () => {
  it("adds CA and exam scores", () => {
    expect(scoreTotal({ ca_score: 25, exam_score: 60 })).toBe(85);
  });
});

describe("resolveGrade", () => {
  it("maps marks to the correct band", () => {
    expect(resolveGrade(85, scales).grade).toBe("A");
    expect(resolveGrade(72, scales).grade).toBe("B");
    expect(resolveGrade(40, scales).grade).toBe("E");
  });
  it("returns a dash when no band matches", () => {
    expect(resolveGrade(150, scales).grade).toBe("-");
  });
});

describe("computeStudentResults", () => {
  const scores = [
    { ...mkScore("s1", "math", 30, 60), subjects: { id: "math", name: "Math", code: "MATH" } },
    { ...mkScore("s1", "eng", 20, 50), subjects: { id: "eng", name: "English", code: "ENG" } },
    { ...mkScore("s2", "math", 20, 40), subjects: { id: "math", name: "Math", code: "MATH" } },
    { ...mkScore("s2", "eng", 25, 55), subjects: { id: "eng", name: "English", code: "ENG" } },
  ];

  const map = computeStudentResults(["s1", "s2"], scores, scales);

  it("computes totals and averages per student", () => {
    expect(map.get("s1")!.total).toBe(160);
    expect(map.get("s1")!.average).toBe(80);
    expect(map.get("s2")!.total).toBe(140);
    expect(map.get("s2")!.average).toBe(70);
  });

  it("ranks students by average overall", () => {
    expect(map.get("s1")!.position).toBe(1);
    expect(map.get("s2")!.position).toBe(2);
    expect(map.get("s1")!.classSize).toBe(2);
  });

  it("computes subject positions", () => {
    const s1Math = map.get("s1")!.subjects.find((x) => x.subjectId === "math")!;
    const s2Math = map.get("s2")!.subjects.find((x) => x.subjectId === "math")!;
    expect(s1Math.position).toBe(1);
    expect(s2Math.position).toBe(2);
  });
});
