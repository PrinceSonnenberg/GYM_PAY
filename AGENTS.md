# Project Execution Rules & Guidelines

## 1. Strict Feature Preservation & Stability
- Never undo or regress working features, routes, or auth/security logic.
- Always perform surgical, incremental updates when requested.

## 2. Pre-Execution Impact Assessment & Discussion
- If a requested change carries a risk of breaking existing features, changing API behavior unexpectedly, or disrupting UI routes, inform the user first and discuss the plan before taking action.

## 3. Human-Readable Code & Defensive Design
- Use descriptive variable and function names with clean comments.
- Handle edge cases defensively (e.g. `NaN` guards, optional chaining, nullish coalescing) to prevent runtime crashes or formatting defects (such as `RNaN`).
