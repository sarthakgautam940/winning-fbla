// The course's sample databases, mirrored from scripts/verify/datasets.py.
// Lessons, questions, widgets and the Reference page all use these exact rows.

export type Cell = string | number | null;

export interface Table {
  name: string;
  columns: string[];
  key: string[];
  rows: Cell[][];
  notes?: Record<string, string>;
}

export const SCHOOL: Table[] = [
  {
    name: "students",
    columns: ["student_id", "name", "grade", "gpa", "club_id"],
    key: ["student_id"],
    notes: { club_id: "foreign key to clubs; NULL means no club", gpa: "NULL for Isla" },
    rows: [
      [1, "Ava", 10, 3.6, 1],
      [2, "Ben", 11, 2.9, null],
      [3, "Chloe", 12, 3.9, 2],
      [4, "Dev", 10, 3.2, 1],
      [5, "Elena", 11, 3.8, 3],
      [6, "Farid", 12, 2.5, null],
      [7, "Grace", 9, 3.4, 2],
      [8, "Hiro", 11, 3.9, 1],
      [9, "Isla", 10, null, 3],
      [10, "Jonah", 12, 3.1, 2],
    ],
  },
  {
    name: "clubs",
    columns: ["club_id", "club_name", "advisor"],
    key: ["club_id"],
    notes: { club_id: "Chess (4) has no members" },
    rows: [
      [1, "Robotics", "Ms. Park"],
      [2, "Debate", "Mr. Reyes"],
      [3, "Data Science", "Dr. Osei"],
      [4, "Chess", "Ms. Lin"],
    ],
  },
  {
    name: "courses",
    columns: ["course_id", "title", "credits"],
    key: ["course_id"],
    notes: { course_id: "DB1 has no enrollments" },
    rows: [
      ["STAT1", "Statistics", 3],
      ["CS1", "Intro to Programming", 3],
      ["AI1", "AI Foundations", 2],
      ["DB1", "Databases", 2],
    ],
  },
  {
    name: "enrollments",
    columns: ["student_id", "course_id", "score"],
    key: ["student_id", "course_id"],
    notes: { score: "NULL means not yet graded", student_id: "Isla (9) has no enrollments" },
    rows: [
      [1, "STAT1", 88],
      [1, "CS1", 92],
      [2, "STAT1", 75],
      [3, "AI1", 95],
      [3, "CS1", null],
      [4, "STAT1", 81],
      [5, "AI1", 89],
      [5, "STAT1", 94],
      [6, "CS1", 68],
      [7, "AI1", null],
      [8, "CS1", 97],
      [8, "STAT1", 90],
      [10, "AI1", 72],
    ],
  },
];

export const SHOP: Table[] = [
  {
    name: "customers",
    columns: ["customer_id", "name", "city", "joined"],
    key: ["customer_id"],
    notes: { customer_id: "Zoe (5) has no orders" },
    rows: [
      [1, "Maya", "Austin", "2025-01-15"],
      [2, "Noah", "Denver", "2025-02-03"],
      [3, "Priya", "Austin", "2025-03-21"],
      [4, "Liam", "Boston", "2025-04-10"],
      [5, "Zoe", "Denver", "2025-05-30"],
    ],
  },
  {
    name: "products",
    columns: ["product_id", "name", "category", "price"],
    key: ["product_id"],
    notes: { product_id: "Backpack (105) has never been ordered" },
    rows: [
      [101, "Notebook", "Paper", 4.5],
      [102, "Pen pack", "Paper", 3.0],
      [103, "Calculator", "Electronics", 18.0],
      [104, "USB drive", "Electronics", 9.0],
      [105, "Backpack", "Bags", 35.0],
    ],
  },
  {
    name: "orders",
    columns: ["order_id", "customer_id", "order_date", "status"],
    key: ["order_id"],
    rows: [
      [1001, 1, "2025-06-01", "shipped"],
      [1002, 2, "2025-06-03", "shipped"],
      [1003, 1, "2025-06-07", "pending"],
      [1004, 3, "2025-06-10", "shipped"],
      [1005, 4, "2025-06-12", "cancelled"],
      [1006, 3, "2025-06-15", "shipped"],
    ],
  },
  {
    name: "order_items",
    columns: ["order_id", "product_id", "quantity"],
    key: ["order_id", "product_id"],
    rows: [
      [1001, 101, 3],
      [1001, 102, 2],
      [1002, 103, 1],
      [1003, 104, 2],
      [1003, 101, 1],
      [1004, 102, 5],
      [1005, 103, 1],
      [1006, 104, 1],
      [1006, 101, 2],
    ],
  },
];

export function table(db: Table[], name: string): Table {
  const t = db.find((x) => x.name === name);
  if (!t) throw new Error(`no table ${name}`);
  return t;
}

export function formatCell(v: Cell): string {
  if (v === null) return "NULL";
  if (typeof v === "number") return Number.isInteger(v) ? String(v) : String(Number(v.toFixed(4)));
  return v;
}
