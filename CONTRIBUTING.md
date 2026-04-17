# Contributing to Eternity

> Guide for setting up the development environment and contributing to the project.

---

## Prerequisites

- **Node.js** ≥ 25 (required for SEA support)
- **pnpm** ≥ 9 (`corepack enable && corepack prepare pnpm@latest --activate`)
- **Git**

## Quick Start

```bash
# Clone the repository
git clone https://github.com/your-org/eternity.git
cd eternity

# Install all dependencies (pnpm workspaces handles cross-package linking)
pnpm install

# Start the editor in development mode
pnpm dev
```

`pnpm dev` launches:
1. Vite dev server for the renderer process (hot module reload)
2. Electron main process with `--inspect` for debugging
3. TypeScript type-checking in watch mode

---

## Project Structure

See [architecture.md](docs/architecture.md) for the full directory tree. Key packages:

```
apps/editor          → Electron app (main + renderer)
packages/engine      → Game engine (included in all exports)
packages/shared      → Types, schemas, utilities
packages/project     → Project Manager (file I/O)
packages/platform-*  → PAL implementations
packages/multiplayer → Network layer
packages/export      → Export pipeline
```

## Common Commands

| Command | Description |
|---|---|
| `pnpm dev` | Start the editor in development mode |
| `pnpm build` | Build all packages for production |
| `pnpm test` | Run all tests across all packages |
| `pnpm test --filter=@eternity/engine` | Run tests for a specific package |
| `pnpm typecheck` | TypeScript type-checking across all packages |
| `pnpm lint` | ESLint across all packages |
| `pnpm format` | Prettier formatting |
| `pnpm turbo run build --filter=@eternity/shared` | Build a specific package and its dependencies |

## Development Workflow

### 1. Pick or Create an Issue

All work should be tied to a GitHub issue. If one doesn't exist, create it first.

### 2. Branch from `main`

```bash
git checkout -b feat/your-feature-name
```

Branch naming:
- `feat/` — new features
- `fix/` — bug fixes
- `docs/` — documentation
- `refactor/` — code restructuring
- `chore/` — maintenance, dependencies

### 3. Make Changes

- Follow the existing code style (Prettier + ESLint enforce this)
- Write tests for new functionality
- Update documentation if behavior changes

### 4. Test

```bash
# Run the full test suite
pnpm test

# Run only affected tests (Turborepo detects changed packages)
pnpm turbo run test --filter=...[HEAD~1]
```

### 5. Submit a Pull Request

- Write a clear description of what changed and why
- Reference the issue number (`Closes #123`)
- Ensure CI passes (lint, typecheck, test)

---

## Package Development Guidelines

### Adding a New Package

```bash
mkdir -p packages/my-package/src
cd packages/my-package
pnpm init
```

Update `pnpm-workspace.yaml` if the new package isn't in an existing glob pattern. Add `"@eternity/my-package": "workspace:*"` as a dependency in consuming packages.

### Dependency Rules

1. **`packages/shared`** has zero dependencies on other workspace packages
2. **`packages/engine`** depends only on `packages/shared`
3. **Platform packages** depend only on `packages/shared`
4. **`apps/editor`** can depend on anything
5. **No circular dependencies** — Turborepo will error on these

### Writing Tests

Tests use Vitest. Place test files alongside source:

```
packages/engine/src/ecs/
├── world.ts
└── world.test.ts
```

For tests that need the engine without a real platform, use `MockPlatform`:

```typescript
import { MockPlatform } from "@eternity/platform-mock";
import { Engine } from "@eternity/engine";

const engine = new Engine(new MockPlatform());
```

### Code Style

- **TypeScript strict mode** (`strict: true` in `tsconfig.base.json`)
- **No `any`** — use `unknown` and narrow, or define proper types
- **Interfaces over type aliases** for public API surfaces
- **Components are plain interfaces, not classes** (data-only)
- **Systems are functions, not classes** (logic-only)
- **All editor mutations go through the Command pattern** — never mutate state directly from UI code

---

## Editor Development

### Working on Panels

Editor panels are json-render catalog components. To add or modify a panel:

1. Define the component in the catalog (`apps/editor/src/renderer/catalog.ts`)
2. Create the React implementation (`apps/editor/src/renderer/panels/`)
3. Register it in the registry (`apps/editor/src/renderer/registry.ts`)

### Working on the Engine

The engine (`packages/engine`) has no React or Electron dependencies. It can be tested headlessly:

```typescript
import { MockPlatform } from "@eternity/platform-mock";
import { AssetManager } from "@eternity/engine";

const platform = new MockPlatform();
const assets = new AssetManager(platform);
```

### Debugging the Electron App

- **Renderer process**: Chrome DevTools (Ctrl+Shift+I in the editor window)
- **Main process**: `--inspect` flag is set by `pnpm dev`, attach VS Code debugger to port 9229
- **Web Workers (scripting sandbox)**: DevTools → Sources → worker threads

---

## Release Process

Releases are automated via GitHub Actions on tag push:

```bash
# Bump version (updates all package.json files)
pnpm changeset version

# Commit and tag
git add .
git commit -m "chore: release v0.1.0"
git tag v0.1.0
git push origin main --tags
```

The CI pipeline:
1. Builds all packages
2. Runs full test suite
3. Builds Electron app for Windows, macOS, Linux
4. Publishes to GitHub Releases

---

## Documentation

All docs live in `docs/`. Key files:

| File | Purpose |
|---|---|
| `docs/architecture.md` | Codebase + project directory structure |
| `docs/schemas.md` | All built-in entity Zod schemas |
| `docs/glossary.md` | Project-specific term definitions |
| `docs/plugin-guide.md` | Tutorial for plugin authors |
| `docs/adr/decisions.md` | Architecture Decision Records |
| `docs/prd/00-overview.md` | Product vision + tech stack |
| `docs/prd/01–07-*.md` | Phase-specific requirements |

When making changes that affect documented behavior, update the relevant docs in the same PR.
