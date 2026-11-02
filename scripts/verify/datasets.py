"""The course's two sample databases.

Lessons and questions refer to these tables by name, and the Reference page
shows them to the student. Keep them small enough to reason about by hand.

school: students, clubs, courses, enrollments
shop:   customers, products, orders, order_items
"""

SCHOOL = """
CREATE TABLE clubs (
  club_id   INTEGER PRIMARY KEY,
  club_name TEXT NOT NULL,
  advisor   TEXT NOT NULL
);
CREATE TABLE students (
  student_id INTEGER PRIMARY KEY,
  name       TEXT NOT NULL,
  grade      INTEGER NOT NULL,
  gpa        REAL,
  club_id    INTEGER REFERENCES clubs(club_id)
);
CREATE TABLE courses (
  course_id TEXT PRIMARY KEY,
  title     TEXT NOT NULL,
  credits   INTEGER NOT NULL
);
CREATE TABLE enrollments (
  student_id INTEGER REFERENCES students(student_id),
  course_id  TEXT REFERENCES courses(course_id),
  score      INTEGER,
  PRIMARY KEY (student_id, course_id)
);
INSERT INTO clubs VALUES
  (1, 'Robotics', 'Ms. Park'),
  (2, 'Debate', 'Mr. Reyes'),
  (3, 'Data Science', 'Dr. Osei'),
  (4, 'Chess', 'Ms. Lin');
INSERT INTO students VALUES
  (1, 'Ava',   10, 3.6, 1),
  (2, 'Ben',   11, 2.9, NULL),
  (3, 'Chloe', 12, 3.9, 2),
  (4, 'Dev',   10, 3.2, 1),
  (5, 'Elena', 11, 3.8, 3),
  (6, 'Farid', 12, 2.5, NULL),
  (7, 'Grace',  9, 3.4, 2),
  (8, 'Hiro',  11, 3.9, 1),
  (9, 'Isla',  10, NULL, 3),
  (10, 'Jonah', 12, 3.1, 2);
INSERT INTO courses VALUES
  ('STAT1', 'Statistics', 3),
  ('CS1', 'Intro to Programming', 3),
  ('AI1', 'AI Foundations', 2),
  ('DB1', 'Databases', 2);
INSERT INTO enrollments VALUES
  (1, 'STAT1', 88),
  (1, 'CS1', 92),
  (2, 'STAT1', 75),
  (3, 'AI1', 95),
  (3, 'CS1', NULL),
  (4, 'STAT1', 81),
  (5, 'AI1', 89),
  (5, 'STAT1', 94),
  (6, 'CS1', 68),
  (7, 'AI1', NULL),
  (8, 'CS1', 97),
  (8, 'STAT1', 90),
  (10, 'AI1', 72);
"""

SHOP = """
CREATE TABLE customers (
  customer_id INTEGER PRIMARY KEY,
  name        TEXT NOT NULL,
  city        TEXT NOT NULL,
  joined      TEXT NOT NULL
);
CREATE TABLE products (
  product_id INTEGER PRIMARY KEY,
  name       TEXT NOT NULL,
  category   TEXT NOT NULL,
  price      REAL NOT NULL
);
CREATE TABLE orders (
  order_id    INTEGER PRIMARY KEY,
  customer_id INTEGER REFERENCES customers(customer_id),
  order_date  TEXT NOT NULL,
  status      TEXT NOT NULL
);
CREATE TABLE order_items (
  order_id   INTEGER REFERENCES orders(order_id),
  product_id INTEGER REFERENCES products(product_id),
  quantity   INTEGER NOT NULL,
  PRIMARY KEY (order_id, product_id)
);
INSERT INTO customers VALUES
  (1, 'Maya',  'Austin', '2025-01-15'),
  (2, 'Noah',  'Denver', '2025-02-03'),
  (3, 'Priya', 'Austin', '2025-03-21'),
  (4, 'Liam',  'Boston', '2025-04-10'),
  (5, 'Zoe',   'Denver', '2025-05-30');
INSERT INTO products VALUES
  (101, 'Notebook',   'Paper',       4.50),
  (102, 'Pen pack',   'Paper',       3.00),
  (103, 'Calculator', 'Electronics', 18.00),
  (104, 'USB drive',  'Electronics', 9.00),
  (105, 'Backpack',   'Bags',        35.00);
INSERT INTO orders VALUES
  (1001, 1, '2025-06-01', 'shipped'),
  (1002, 2, '2025-06-03', 'shipped'),
  (1003, 1, '2025-06-07', 'pending'),
  (1004, 3, '2025-06-10', 'shipped'),
  (1005, 4, '2025-06-12', 'cancelled'),
  (1006, 3, '2025-06-15', 'shipped');
INSERT INTO order_items VALUES
  (1001, 101, 3),
  (1001, 102, 2),
  (1002, 103, 1),
  (1003, 104, 2),
  (1003, 101, 1),
  (1004, 102, 5),
  (1005, 103, 1),
  (1006, 104, 1),
  (1006, 101, 2);
"""

DATABASES = {"school": SCHOOL, "shop": SHOP}
