import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { GradeScale } from "./types";
import type { StudentResult } from "./grading";

const PRIMARY: [number, number, number] = [54, 65, 168];

function header(doc: jsPDF, subtitle: string) {
  doc.setFillColor(...PRIMARY);
  doc.rect(0, 0, 210, 30, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("IKONEX ACADEMY", 14, 14);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Excellence in Education", 14, 21);
  doc.setFontSize(11);
  doc.text(subtitle, 196, 18, { align: "right" });
  doc.setTextColor(20, 20, 20);
}

export function generateReportCard(opts: {
  studentName: string;
  admissionNumber: string;
  streamName: string;
  term: string;
  year: number;
  result: StudentResult;
  scales: GradeScale[];
}) {
  const doc = new jsPDF();
  header(doc, "Student Report Card");

  doc.setFontSize(11);
  let y = 40;
  const line = (label: string, value: string, x: number) => {
    doc.setFont("helvetica", "bold");
    doc.text(label, x, y);
    doc.setFont("helvetica", "normal");
    doc.text(value, x + 32, y);
  };
  line("Name:", opts.studentName, 14);
  line("Adm No:", opts.admissionNumber, 120);
  y += 7;
  line("Class:", opts.streamName, 14);
  line("Term:", `${opts.term} ${opts.year}`, 120);

  autoTable(doc, {
    startY: y + 8,
    head: [["Subject", "CA", "Exam", "Total", "Grade", "Position", "Remark"]],
    body: opts.result.subjects.map((s) => [
      s.subjectName,
      s.caScore.toString(),
      s.examScore.toString(),
      s.total.toFixed(1),
      s.grade,
      s.position ? `${s.position}/${s.classSize}` : "-",
      s.remark,
    ]),
    headStyles: { fillColor: PRIMARY, halign: "center" },
    bodyStyles: { halign: "center" },
    columnStyles: { 0: { halign: "left" }, 6: { halign: "left" } },
    styles: { fontSize: 9, cellPadding: 2.5 },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const afterTable = (doc as any).lastAutoTable.finalY + 10;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(`Total Marks: ${opts.result.total.toFixed(1)}`, 14, afterTable);
  doc.text(`Average: ${opts.result.average.toFixed(2)}%`, 80, afterTable);
  doc.text(`Overall Grade: ${opts.result.grade}`, 140, afterTable);
  doc.text(
    `Class Position: ${opts.result.position ?? "-"} / ${opts.result.classSize ?? "-"}`,
    14,
    afterTable + 7,
  );
  doc.setFont("helvetica", "normal");
  doc.text(`Remark: ${opts.result.remark}`, 80, afterTable + 7);

  // Grading key
  autoTable(doc, {
    startY: afterTable + 16,
    head: [["Grade", "Range", "Remark"]],
    body: opts.scales.map((s) => [
      s.grade,
      `${s.min_score} - ${s.max_score}`,
      s.remark ?? "",
    ]),
    headStyles: { fillColor: [120, 120, 120] },
    styles: { fontSize: 8, cellPadding: 1.8 },
    tableWidth: 90,
  });

  doc.save(`ReportCard_${opts.admissionNumber}_${opts.term}_${opts.year}.pdf`);
}

export function generateClassReport(opts: {
  streamName: string;
  subjectName?: string;
  term: string;
  year: number;
  rows: Array<{
    rank: number | string;
    admission: string;
    name: string;
    total: string;
    average?: string;
    grade: string;
  }>;
  includeAverage: boolean;
}) {
  const doc = new jsPDF();
  header(doc, "Class Performance Report");

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(`Class: ${opts.streamName}`, 14, 40);
  if (opts.subjectName) doc.text(`Subject: ${opts.subjectName}`, 90, 40);
  doc.text(`${opts.term} ${opts.year}`, 196, 40, { align: "right" });

  const head = opts.includeAverage
    ? [["Pos", "Adm No", "Student", "Total", "Average", "Grade"]]
    : [["Pos", "Adm No", "Student", "Total", "Grade"]];
  const body = opts.rows.map((r) =>
    opts.includeAverage
      ? [r.rank.toString(), r.admission, r.name, r.total, r.average ?? "", r.grade]
      : [r.rank.toString(), r.admission, r.name, r.total, r.grade],
  );

  autoTable(doc, {
    startY: 46,
    head,
    body,
    headStyles: { fillColor: PRIMARY, halign: "center" },
    bodyStyles: { halign: "center" },
    columnStyles: { 2: { halign: "left" } },
    styles: { fontSize: 9, cellPadding: 2.5 },
  });

  doc.save(
    `ClassReport_${opts.streamName}${opts.subjectName ? "_" + opts.subjectName : ""}_${opts.term}_${opts.year}.pdf`.replace(
      /\s+/g,
      "",
    ),
  );
}
