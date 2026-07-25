# EPAM SQL & DBMS Interview Master File

This guide covers all SQL queries, database concepts, and interview theory required for the EPAM technical interview and online assessment.

---

## Part 1: Top Interactive SQL Practice Platforms

Use these free interactive platforms to practice writing SQL queries directly in your browser:

1. **[LeetCode SQL Study Plan](https://leetcode.com/studyplan/top-sql-50/)** — The absolute gold standard for SQL technical rounds. Solve the "Easy" and "Medium" problems.
2. **[SQLZoo](https://sqlzoo.net/)** — Step-by-step interactive SQL tutorials covering `SELECT`, `JOIN`, `GROUP BY`, and Subqueries with real-time feedback.
3. **[Mode Analytics SQL Tutorial](https://mode.com/sql-tutorial/)** — Excellent for learning business-logic SQL queries, aggregations, and joins.
4. **[GeeksforGeeks DBMS Interview Questions](https://www.geeksforgeeks.org/dbms-interview-questions/)** — Comprehensive theory checklist for college campus drives.
5. **[InterviewBit DBMS Guide](https://www.interviewbit.com/dbms-interview-questions/)** — Top interview questions asked in product and consulting companies like EPAM.

---

## Part 2: Essential SQL Queries (Must-Know Patterns)

### 1. Basic CRUD Operations
```sql
-- CREATE: Insert a new user record
INSERT INTO Users (name, email, role) 
VALUES ('Aditya', 'aditya@example.com', 'DEVELOPER');

-- READ: Select active developers
SELECT id, name, email 
FROM Users 
WHERE role = 'DEVELOPER' AND status = 'ACTIVE';

-- UPDATE: Promote a developer
UPDATE Users 
SET role = 'SENIOR_DEVELOPER' 
WHERE id = 101;

-- DELETE: Remove inactive users
DELETE FROM Users 
WHERE status = 'INACTIVE';
```

---

### 2. SQL Joins (Visualized & Written)

Consider two tables: `Employees (emp_id, name, dept_id)` and `Departments (dept_id, dept_name)`.

#### A. INNER JOIN (Matching rows in BOTH tables)
```sql
SELECT E.emp_id, E.name, D.dept_name
FROM Employees E
INNER JOIN Departments D ON E.dept_id = D.dept_id;
```

#### B. LEFT JOIN (ALL employees, even if they have NO department)
```sql
SELECT E.emp_id, E.name, D.dept_name
FROM Employees E
LEFT JOIN Departments D ON E.dept_id = D.dept_id;
```

#### C. RIGHT JOIN (ALL departments, even if they have NO employees assigned)
```sql
SELECT E.emp_id, E.name, D.dept_name
FROM Employees E
RIGHT JOIN Departments D ON E.dept_id = D.dept_id;
```

#### D. FULL OUTER JOIN (ALL records from both tables)
```sql
SELECT E.emp_id, E.name, D.dept_name
FROM Employees E
FULL OUTER JOIN Departments D ON E.dept_id = D.dept_id;
```

---

### 3. Aggregation & GROUP BY with HAVING

*Rule:* Use `WHERE` to filter rows **before** aggregation; use `HAVING` to filter groups **after** `GROUP BY`.

```sql
-- Find departments with more than 5 employees having average salary > 50,000
SELECT dept_id, COUNT(emp_id) AS total_employees, AVG(salary) AS avg_salary
FROM Employees
WHERE status = 'ACTIVE'
GROUP BY dept_id
HAVING COUNT(emp_id) > 5 AND AVG(salary) > 50000;
```

---

### 4. Top 5 Frequently Asked Interview Queries

#### Q1: Find the 2nd Highest Salary in an Employee table.
```sql
-- Approach 1: Using Subquery
SELECT MAX(salary) AS SecondHighestSalary
FROM Employees
WHERE salary < (SELECT MAX(salary) FROM Employees);

-- Approach 2: Using LIMIT / OFFSET (PostgreSQL / MySQL)
SELECT DISTINCT salary
FROM Employees
ORDER BY salary DESC
LIMIT 1 OFFSET 1;
```

#### Q2: Find N-th Highest Salary (General Solution using Dense Rank)
```sql
SELECT salary FROM (
    SELECT salary, DENSE_RANK() OVER (ORDER BY salary DESC) as rnk
    FROM Employees
) WHERE rnk = N;
```

#### Q3: Find Duplicate Emails in a Table.
```sql
SELECT email, COUNT(email) AS count
FROM Users
GROUP BY email
HAVING COUNT(email) > 1;
```

#### Q4: Delete Duplicate Rows keeping only 1 copy.
```sql
DELETE FROM Users 
WHERE id NOT IN (
    SELECT MIN(id) 
    FROM Users 
    GROUP BY email
);
```

#### Q5: Find Employees who earn more than their Managers.
```sql
SELECT E.name AS Employee
FROM Employees E
JOIN Employees M ON E.manager_id = M.emp_id
WHERE E.salary > M.salary;
```

---

## Part 3: Core DBMS Interview Theory

### 1. ACID Properties
- **Atomicity:** All operations in a transaction complete successfully, or all are rolled back.
- **Consistency:** Database transitions from one valid state to another, enforcing constraints.
- **Isolation:** Concurrent transactions execute independently without interfering with each other.
- **Durability:** Once committed, transaction results survive system crashes.

### 2. Normalization Levels
- **1NF:** Remove duplicate columns; ensure atomic (indivisible) values per cell.
- **2NF:** 1NF + remove partial dependencies (non-key attributes must depend on the whole composite primary key).
- **3NF:** 2NF + remove transitive dependencies (non-key attributes must not depend on other non-key attributes).
- **BCNF:** A stricter version of 3NF where for every functional dependency $X \rightarrow Y$, $X$ must be a super key.

### 3. Primary Key vs Foreign Key vs Unique Key
- **Primary Key:** Uniquely identifies each record. Cannot contain `NULL` values. Only 1 per table.
- **Unique Key:** Ensures values in a column are unique. Can accept one `NULL` value (in SQL Server/MySQL). Multiple unique keys allowed per table.
- **Foreign Key:** A column that links to the Primary Key of another table to establish a relational link.

### 4. Indexing & B-Tree Indexes
- **What is an Index?** A data structure (usually B-Tree or Hash) that speeds up data retrieval operations on a table at the cost of additional storage and slower writes.
- **Clustered Index:** Defines the physical order of data on disk. Only 1 per table (Primary Key).
- **Non-Clustered Index:** A separate structure storing pointers back to data rows. Multiple per table.

### 5. DDL vs DML vs DCL vs TCL
- **DDL (Data Definition):** `CREATE`, `ALTER`, `DROP`, `TRUNCATE` (Defines structure).
- **DML (Data Manipulation):** `SELECT`, `INSERT`, `UPDATE`, `DELETE` (Manages data).
- **DCL (Data Control):** `GRANT`, `REVOKE` (Permissions).
- **TCL (Transaction Control):** `COMMIT`, `ROLLBACK`, `SAVEPOINT`.
