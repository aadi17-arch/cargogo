# Complete Git Commands Cheat Sheet (All-In-One Reference)

---

## 1. Daily One-Liner Commands (Copy & Paste)

### Save, Commit & Push in One Line (PowerShell)
```powershell
git add . ; git commit -m "feat: add new feature" ; git push origin main
```

### Save, Commit & Push in One Line (Git Bash / Linux / Mac)
```bash
git add . && git commit -m "feat: add new feature" && git push origin main
```

---

## 2. Essential Daily Commands

```bash
# Check modified files & status
git status

# View commit history (short graph format)
git log --oneline --graph --all

# Stage all files
git add .

# Stage specific file
git add path/to/file.js

# Create commit
git commit -m "feat: description of changes"

# Push to remote repository
git push origin main

# Pull latest changes from remote
git pull origin main
```

---

## 3. Conventional Commit Messages (Industry Standard)

```bash
# Features
git add . ; git commit -m "feat: add live driver map tracking" ; git push origin main

# Bug Fixes
git add . ; git commit -m "fix: resolve 404 error on page refresh" ; git push origin main

# Documentation
git add . ; git commit -m "docs: update API endpoints guide" ; git push origin main

# Styling / UI
git add . ; git commit -m "style: fix Leaflet map marker alignment" ; git push origin main

# Performance Optimization
git add . ; git commit -m "perf: add Redis GEO index for sub-50ms lookups" ; git push origin main

# Refactoring
git add . ; git commit -m "refactor: clean up pricing engine logic" ; git push origin main

# Testing
git add . ; git commit -m "test: add k6 load test script for 1000 drivers" ; git push origin main

# Chores / Config
git add . ; git commit -m "chore: update npm dependencies" ; git push origin main
```

---

## 4. Branching & Merging

```bash
# List all branches
git branch

# Create and switch to new feature branch
git checkout -b feature/driver-tracking

# Switch to main branch
git checkout main

# Merge feature branch into main
git merge feature/driver-tracking

# Delete branch locally
git branch -d feature/driver-tracking

# Delete remote branch
git push origin --delete feature/driver-tracking
```

---

## 5. Undo & Fixing Mistakes

```bash
# Undo last commit (KEEP code changes staged)
git reset --soft HEAD~1

# Undo last commit (UNSTAGE code changes)
git reset --mixed HEAD~1

# Discard ALL uncommitted local changes
git reset --hard HEAD

# Temporarily save uncommitted work
git stash

# Restore stashed work
git stash pop

# Edit last commit message
git commit --amend -m "fix: updated commit message"

# Revert a published commit safely
git revert <commit-hash>
```

---

## 6. Advanced Git Tricks

```bash
# Interactive rebase (squash/clean up last 3 commits)
git rebase -i HEAD~3

# Cherry-pick single commit from another branch
git cherry-pick <commit-hash>

# Find bug using binary search
git bisect start

# Clean untracked files
git clean -fd
```
