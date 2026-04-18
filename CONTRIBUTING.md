# Contributing to Eternity

> Guide for contributing to the **documentation, architecture, and product specs** in this repository.

---

## Current Repository Status

This repository is currently a **specification repo**.

It contains:
- product requirements documents
- architecture references
- plugin and schema documentation
- presentation HTML files

It does **not yet** contain the implementation monorepo described by the docs (`apps/`, `packages/`, `pnpm-workspace.yaml`, CI workflows, etc.). Treat those references as planned architecture, not checked-in source code.

## Prerequisites

- **Git**
- A Markdown-capable editor
- Optional: a browser for previewing `docs/*.html`

## Quick Start

```bash
# Clone the repository
git clone <repo-url>
cd eternity

# Create a branch for your change
git checkout -b docs/your-change
```

For slideshow reviews, open the HTML files directly in a browser:

```bash
xdg-open docs/slideshow.html
xdg-open docs/slideshow-features.html
```

## What Good Contributions Look Like

Prioritize:
- **internal consistency** across PRDs, ADRs, architecture docs, and guides
- **clear terminology** in `docs/glossary.md`
- **accurate forward-looking specs** that distinguish current repo state from planned implementation
- **tight examples** that agree with the documented contracts

Good changes include:
- resolving contradictory file layouts or API shapes
- clarifying plugin boundaries
- correcting impossible setup instructions
- tightening examples so manifests, directory trees, and code snippets match

## Documentation Workflow

### 1. Start from `main`

```bash
git checkout main
git pull --ff-only origin main 2>/dev/null || true
git checkout -b docs/your-change
```

### 2. Make the Smallest Correct Change

When you fix a contradiction, update every affected document in the same branch.

Common cross-document dependencies:
- `docs/prd/00-overview.md` ↔ `docs/adr/decisions.md`
- `docs/prd/01-foundation.md` ↔ `docs/architecture.md`
- `docs/plugin-guide.md` ↔ `docs/prd/07-polish.md`
- `docs/schemas.md` ↔ schema examples in the PRDs

### 3. Verify the Change

Before opening a PR, check:
- links between docs still resolve
- repeated examples use the same filenames and terms
- guides do not imply code or automation that does not exist in this repo
- presentation slides do not overstate implementation status relative to the specs

### 4. Commit Clearly

Use focused conventional commit messages:
- `docs: clarify plugin contract`
- `docs: align project layout across specs`
- `docs: fix contradictory setup instructions`

### 5. Open a Pull Request

Your PR should state:
- what contradiction or ambiguity you fixed
- which docs were updated together
- whether the change is editorial or changes the intended spec

## Writing Rules

- Prefer one **canonical source of truth** per concept
- If a doc is aspirational, label it as planned
- Do not present planned build commands or CI as currently available unless they exist in the repo
- Keep examples mechanically consistent with surrounding prose
- Use the same filenames, manifest keys, and directory layout everywhere

## Scope Boundaries

This repo is for:
- product direction
- technical design
- extension contracts
- architecture decisions
- presentations

This repo is not yet for:
- implementation work
- package builds
- runtime testing
- CI verification

When the implementation repo is added, this guide should be expanded or split into:
- spec contribution guidance
- implementation contribution guidance

## Key Documents

| File | Purpose |
|---|---|
| `docs/prd/00-overview.md` | Product vision and high-level architecture |
| `docs/prd/01-foundation.md` | Project format, PAL, schema registry, project manager |
| `docs/architecture.md` | Reference directory structures and dependency rules |
| `docs/schemas.md` | Built-in schema reference |
| `docs/plugin-guide.md` | Plugin author guide |
| `docs/adr/decisions.md` | Architecture decision records |
| `docs/slideshow.html` | General project presentation |
| `docs/slideshow-features.html` | Feature-focused project presentation |

## Pull Request Checklist

- [ ] The changed docs agree with each other
- [ ] Examples and manifests are internally consistent
- [ ] Planned systems are labeled as planned when necessary
- [ ] No setup or release instructions claim tooling that is absent from this repo
- [ ] Commit message is specific and conventional
