# Deep-Dive SQL Concepts Guide for Interview Query Writing

This document breaks down every SQL concept step-by-step so you can construct any SQL query from scratch in interviews and coding tests.

---

## 1. The Mandatory Order of Execution in SQL

When you write a SQL query, the database engine **does not** execute it from top to bottom (`SELECT` first). It executes in a strict logical sequence:

```text
1. FROM / JOIN     --> Identify and combine tables (Builds initial virtual table)
2. WHERE           --> Filter individual rows (Before grouping)
3. GROUP BY        --> Group rows sharing common values
4. HAVING          --> Filter groups (After grouping)
5. SELECT          --> Pick columns, compute expressions, apply aliases
6. DISTINCT        --> Remove duplicate output rows
7. ORDER BY        --> Sort final output
8. LIMIT / OFFSET  --> Restrict number of returned rows
```

*Key Interview Takeaway:* You cannot use a `SELECT` column alias inside a `WHERE` clause because `WHERE` runs **before** `SELECT`!

---

## 2. Filtering Data: `WHERE` vs `HAVING`

### `WHERE` Clause
- Operates on **individual rows**.
- Evaluates conditions **before** any `GROUP BY` grouping occurs.
- Cannot contain aggregate functions like `SUM()`, `AVG()`, `COUNT()`.

```sql
SELECT name, salary 
FROM Employees 
WHERE salary > 50000 AND department = 'IT';
```

### `HAVING` Clause
- Operates on **grouped summaries** created by `GROUP BY`.
- Evaluates conditions **after** rows are grouped.
- Designed specifically to filter results using aggregate functions.

```sql
SELECT department, COUNT(emp_id) AS emp_count
FROM Employees
GROUP BY department
HAVING COUNT(emp_id) > 5; -- Filter departments that have more than 5 employees
```

---

## 3. Mastering SQL Joins

Joins combine columns from one or more tables based on a related column between them.

### Sample Tables:
- **`Employees`**: `id`, `name`, `dept_id`, `salary`
- **`Departments`**: `id`, `dept_name`

---

### A. INNER JOIN
Returns **only matching records** present in BOTH tables.

```sql
SELECT E.name, D.dept_name
FROM Employees E
INNER JOIN Departments D ON E.dept_id = D.id;
```
*Result:* If an employee has no `dept_id` (NULL), or a department has no employees, they are excluded.

---

### B. LEFT JOIN (Left Outer Join)
Returns **all rows from the left table** (`Employees`), plus matching rows from the right table (`Departments`). If no match, right side returns `NULL`.

```sql
SELECT E.name, D.dept_name
FROM Employees E
LEFT JOIN Departments D ON E.dept_id = D.id;
```
*Use Case:* "Find all employees and their department names, including employees not assigned to any department."

---

### C. RIGHT JOIN (Right Outer Join)
Returns **all rows from the right table** (`Departments`), plus matching rows from the left table (`Employees`).

```sql
SELECT E.name, D.dept_name
FROM Employees E
RIGHT JOIN Departments D ON E.dept_id = D.id;
```
*Use Case:* "Find all departments, including departments with zero employees."

---

### D. FULL OUTER JOIN
Returns **all rows from both tables**. Fills with `NULL` where there is no match on either side.

```sql
SELECT E.name, D.dept_name
FROM Employees E
FULL OUTER JOIN Departments D ON E.dept_id = D.id;
```

---

### E. LEFT ANTI-JOIN (Finding Unmatched Rows)
Returns rows in Table A that **do not exist** in Table B.

```sql
SELECT E.name
FROM Employees E
LEFT JOIN Departments D ON E.dept_id = D.id
WHERE D.id IS NULL; -- Employee has no valid department
```
*Interview Favorite:* "Find all customers who have never placed an order."

---

### F. SELF JOIN
A table joined with **itself**. Requires assigning two different aliases to the same table.

```sql
-- Employees table has columns: id, name, manager_id
SELECT E.name AS Employee, M.name AS Manager
FROM Employees E
JOIN Employees M ON E.manager_id = M.id;
```
*Interview Favorite:* "Find all employees whose salary is higher than their manager's salary."

---

## 4. Aggregate Functions & `GROUP BY`

Aggregate functions summarize multiple rows into a single value:
- `COUNT(column)` — Counts non-null values (`COUNT(*)` counts all rows).
- `SUM(column)` — Calculates total sum.
- `AVG(column)` — Calculates average value.
- `MIN(column)` / `MAX(column)` — Returns minimum / maximum value.

### Rule of `GROUP BY`:
Every column listed in the `SELECT` clause that is **not** wrapped in an aggregate function (`SUM`, `COUNT`, etc.) **MUST** appear in the `GROUP BY` clause!

```sql
-- INCORRECT (Syntax Error in SQL):
-- SELECT department, location, AVG(salary) FROM Employees GROUP BY department; 
-- ('location' is missing from GROUP BY)

-- CORRECT:
SELECT department, location, AVG(salary) AS avg_salary
FROM Employees
GROUP BY department, location;
```

---

## 5. Window Functions (`OVER`, `RANK`, `DENSE_RANK`, `ROW_NUMBER`)

Window functions perform calculations across a set of table rows related to the current row **without collapsing them into a single row** (unlike `GROUP BY`).

Syntax:
```sql
FUNCTION_NAME() OVER (
    PARTITION BY group_column 
    ORDER BY sort_column DESC
)
```

### The Difference between `ROW_NUMBER`, `RANK`, and `DENSE_RANK`:

Suppose salaries are: `[100, 90, 90, 80]`

| Salary | `ROW_NUMBER()` | `RANK()` | `DENSE_RANK()` |
|---|---|---|---|
| 100 | 1 | 1 | 1 |
| 90 | 2 | 2 | 2 |
| 90 | 3 | 2 | 2 |
| 80 | 4 | 4 (skips 3!) | 3 (no gaps) |

- **`ROW_NUMBER()`:** Assigns a unique sequential integer to every row regardless of duplicate values.
- **`RANK()`:** Gives duplicate values the same rank, but **skips next rank numbers** (1, 2, 2, 4).
- **`DENSE_RANK()`:** Gives duplicate values the same rank, with **no gaps in numbers** (1, 2, 2, 3).

### Classic Interview Example: $N$-th Highest Salary per Department

```sql
WITH RankedSalaries AS (
    SELECT name, department, salary,
           DENSE_RANK() OVER (PARTITION BY department ORDER BY salary DESC) as rnk
    FROM Employees
)
SELECT name, department, salary
FROM RankedSalaries
WHERE rnk = 2; -- Finds 2nd highest salary in each department
```

---

## 6. Subqueries vs CTEs (Common Table Expressions)

### Subquery (Nested Query)
A query embedded inside another query's `WHERE`, `FROM`, or `SELECT` clause.

```sql
-- Scalar Subquery: Find employees earning more than the average salary
SELECT name, salary 
FROM Employees 
WHERE salary > (SELECT AVG(salary) FROM Employees);
```

### CTE (Common Table Expression - `WITH` clause)
A temporary named result set defined before the main query. Makes complex queries readable and reusable.

```sql
WITH DepartmentAvg AS (
    SELECT dept_id, AVG(salary) AS avg_sal
    FROM Employees
    GROUP BY dept_id
)
SELECT E.name, E.salary, D.avg_sal
FROM Employees E
JOIN DepartmentAvg D ON E.dept_id = D.dept_id
WHERE E.salary > D.avg_sal;
```

---

## 7. Pattern Matching & String Operations

- **`LIKE '%abc'`** — Ends with "abc".
- **`LIKE 'abc%'`** — Starts with "abc".
- **`LIKE '%abc%'`** — Contains "abc".
- **`LIKE '_a%'`** — Second character is 'a'.
- **`LOWER(col)` / `UPPER(col)`** — Convert case.
- **`SUBSTRING(col, start, length)`** — Extract substring.
- **`COALESCE(col, fallback)`** — Returns first non-NULL value (replaces `NULL` with a default value).

```sql
-- Replace NULL manager_id with 'No Manager'
SELECT name, COALESCE(manager_name, 'Top Boss') AS manager
FROM Employees;
```
