
# AGENTS.md

## Engineering Standard

Build maintainable, production-quality software.

Priorities:

1. Correctness
2. Maintainability
3. Simplicity
4. Testability
5. Performance
6. Minimal unnecessary change

Do not optimize prematurely.
Do not introduce abstractions without a concrete reason.
Prefer established project patterns over inventing new architecture.
Do not rewrite working code unnecessarily.

---

## Workflow

Every coding task follows this lifecycle:

### 1. BEFORE IMPLEMENTATION

Determine whether the relevant codebase/context is sufficiently understood.

If the repository is new, unfamiliar, structurally complex, or the requested
change crosses multiple components:

USE:
`codebase-onboarding`

The onboarding process must establish:

- project architecture
- relevant modules
- data flow
- dependencies
- existing conventions
- entry points
- testing structure
- affected components
- implementation constraints

Do not start substantial implementation before this understanding exists.

For small, localized changes in a well-understood codebase, do not repeat
full onboarding unnecessarily.

### Persistent Context Rule

At the beginning of a task, determine whether `progress.md`
contains context relevant to the requested work. If new context is added to the context file, make sure to update the progress.md file.
If there's no progress.md file, then create one, where you'll be logging data as said in the task.

Read the relevant file when necessary.

Do not rely on memory when the repository contains an explicit source of truth.

---

### 2. DURING IMPLEMENTATION

For behavior-changing code:

USE:
`tdd-workflow`

Tests must provide evidence that the implementation works.

Follow the existing project's testing conventions.

Prefer:

1. define expected behavior
2. write/update meaningful tests
3. implement
4. run tests
5. fix failures
6. rerun

Do not create meaningless tests merely to satisfy a workflow.

For trivial changes such as documentation, formatting, or comments,
full TDD is unnecessary.

---

### 3. BEFORE DECLARING COMPLETE

USE:
`verification-loop`

Never declare a task complete based only on successful code generation.

Verify the actual result.

Verification should be proportional to the change and may include:

- targeted tests
- full relevant test suite
- type checking
- linting
- build
- runtime checks
- API checks
- integration checks
- edge cases
- regression checks

Only claim completion when there is evidence supporting the claim.

---

## Code Quality

Write code that another developer can understand and modify later.

Prefer:

- small cohesive functions
- clear naming
- explicit data flow
- low coupling
- high cohesion
- existing project conventions
- minimal dependencies
- stable interfaces
- meaningful tests

Avoid:

- speculative abstractions
- unnecessary frameworks
- duplicated logic
- premature optimization
- giant functions
- hidden side effects
- unnecessary configuration
- rewriting unrelated code

---

## Change Scope

Keep changes focused.

Do not modify unrelated files merely because they could be improved.

If existing code is poor but unrelated to the requested task:

- leave it unchanged unless it blocks the task
- mention relevant technical debt when useful

---

## Dependency Policy

Before adding a dependency:

1. Check whether the project already provides the capability.
2. Check whether the standard library is sufficient.
3. Check whether an existing dependency can solve it.
4. Add a new dependency only when its value justifies its maintenance cost.

---

## Architecture

Before introducing a new architectural pattern, verify that:

- the problem actually requires it
- the project does not already solve it another way
- the complexity is justified
- future maintenance benefits from it

Prefer boring, explicit architecture over clever architecture.

---

## Completion Rule

Never finish with:

"Code complete."

unless the implementation has actually been verified.

Final response must state:

- what changed
- what was verified
- verification results
- any remaining limitations


### Completion Record

Before declaring a meaningful task complete:

1. Run the required verification.
2. Confirm the repository is in the expected state.
3. Update `progress.md`.
4. Ensure the final response accurately matches the recorded work.



---

## Context & Progress Tracking

The repository contains two important project-context files:

- `progress.md` — persistent execution history of work performed by Codex.

These files are part of the project's working context.


### `progress.md` — Persistent Work Log

`progress.md` is the persistent record of work performed by Codex.

After completing a meaningful task, update `progress.md` with what was
actually done.

Every progress entry should record:

- date
- task/request
- files changed
- important implementation decisions
- tests/checks executed
- verification result
- remaining work or known limitations

Keep entries concise and factual.

Do not record intentions as completed work.

Do not claim a test passed unless it was actually executed.

Do not rewrite or erase previous progress history unless explicitly asked.

Append new progress rather than replacing historical entries.

### What Counts as a Progress Entry

Update `progress.md` after:

- implementing a feature
- fixing a bug
- completing a refactor
- changing architecture
- adding/removing dependencies
- modifying database schemas
- changing APIs
- completing a significant configuration change
- completing a meaningful documentation change
- running a significant investigation that produces useful findings
- completing verification of a substantial task

For trivial actions such as reading a file, answering a question, or making
a one-line cosmetic change, a progress entry is unnecessary unless it has
meaningful project impact.

### Execution Trace

When Codex performs a meaningful coding task, the final response and
`progress.md` should agree.

The final response must summarize what actually happened.

`progress.md` must preserve the useful historical record.

Never report work in `progress.md` that was not actually performed.

Never omit significant implementation or verification work merely because
the task was successful.

### Progress Entry Format

Use this structure:

## YYYY-MM-DD — <Task>

**Request**
- <what was requested>

**Changes**
- `<file>` — <what changed>
- `<file>` — <what changed>

**Decisions**
- <important architectural or implementation decision>

**Verification**
- `<command/check>` — PASS/FAIL
- <relevant result>

**Remaining**
- <unfinished work, limitation, or `None`>

Keep entries short enough to remain useful as a long-term project history.

### Failed Attempts

If an implementation attempt fails but produces useful information,
record the failure when the task is completed or paused.

Include:

- what was attempted
- why it failed
- what was changed afterward
- current state

Do not hide failed attempts when they materially affect future development.

### Progress Must Reflect Reality

Before updating `progress.md`, verify the actual repository state.

Do not write:

- "implemented" when only planned
- "tested" when tests were not run
- "working" when verification failed
- "complete" when known work remains

The progress log is an engineering record, not a narrative.

### Keep Context Files Maintainable

Do not allow `progress.md` to become uncontrolled dumps.

`progress.md` should contain concise historical records.

Do not duplicate the same information across both files unless necessary.

If a stable fact belongs in `progress.md`, update `progress.md` instead of repeatedly recording it as progress.
