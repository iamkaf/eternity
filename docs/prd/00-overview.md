# Eternity — Product Requirements Document (Overview)

> **Status**: Draft  
> **Last updated**: 2026-04-16

---

## 1. Product Vision

Eternity is an open-source, Electron-based RPG creation toolkit — a modern alternative to RPG Maker. It ships a full 2D game engine and an integrated visual editor, targeting solo developers and small teams who want to build tile-based RPGs without writing engine code, but who also want the escape hatch of a real scripting layer and a plugin ecosystem when the built-in tools aren't enough.

### 1.1 Goals

- **Accessible by default.** A new user should be able to place tiles, create NPCs, and playtest a scene within minutes — before touching any scripting.
- **Extensible by design.** Every editor surface is driven by a schema-constrained component catalog (json-render). Third-party plugins extend the editor by registering catalog entries, not by shipping framework-specific UI code.
- **Git-friendly.** Project files are per-entity JSON/TOML. Merging a teammate's map changes should be no harder than merging code.
- **Linux-native.** Linux is a first-class target. WebKitGTK is explicitly rejected; Chromium (via Electron) is the only viable cross-platform renderer.
- **Multiplayer-capable.** Relay-based networking with a single serializable game state. The same architecture that gives you save/load gives you multiplayer sync.
- **Self-hosted.** Multiplayer servers export as Node.js Single Executable Applications — one binary, no runtime dependencies.

### 1.2 Target Audience

| Segment | Needs |
|---|---|
| **Hobbyist RPG creators** | Visual editors, no-code event system, built-in battle templates |
| **Indie developers** | Text scripting sandbox, custom battle systems, export to multiple targets |
| **Modding communities** | Extension API, Git-friendly formats, self-hosted multiplayer servers |

### 1.3 Non-Goals (v1)

- 3D rendering. Eternity is a 2D toolkit.
- Mobile-first editor UI. The editor targets desktop; exported *games* may target mobile later.
- Cloud-hosted multiplayer infrastructure. Users self-host their servers.

---

## 2. Competitive Landscape

| Tool | Strengths | Gaps Eternity Fills |
|---|---|---|
| **RPG Maker MZ** | Mature, huge asset ecosystem, large community | Closed source, poor Git support (monolithic save files), weak Linux support, limited scripting escape hatch |
| **Godot** | Full general-purpose engine, GDScript, open source | Not RPG-specialized — no built-in tile-based RPG primitives, database editors, or event systems; steep learning curve for non-programmers |
| **GDevelop** | No-code event system, web-based editor, beginner-friendly | Not RPG-specialized, limited scripting depth, no multiplayer primitives |
| **Solarus** | Purpose-built for Zelda-likes, lightweight | Narrow genre focus (action-RPG only), small community, no visual scripting |
| **EasyRPG** | Open-source RPG Maker 2000/2003 compatibility | Legacy format only, not a creation tool for new projects |

**Eternity's position**: RPG Maker's accessibility and genre-specific tooling, with Godot's openness and extensibility, plus first-class Git support and multiplayer.

---

## 3. Tech Stack

Version targets reflect the intended stack as of April 2026. Some entries are exact versions, while others are major-version targets that can be refined once implementation begins.

### 3.1 Runtime & Shell

| Technology | Version | Role | Rationale |
|---|---|---|---|
| **Electron** | 41.x (Chromium 146, Node.js v24.14, V8 14.6) | Desktop shell, IPC bridge | Bundled Chromium satisfies the Linux hard requirement. ASAR integrity support adds tamper detection for distributed games. |
| **Node.js SEA** | v25.x (`--build-sea`) | Headless server export | Native `--build-sea` flag eliminates the old `postject` dependency. Single binary, no runtime needed on the host. |

### 3.2 UI & Rendering

| Technology | Version | Role | Rationale |
|---|---|---|---|
| **React** | 19.x | Editor UI framework | React Compiler provides automatic memoization — critical for a complex editor with many panels. `use()` hook simplifies async data loading. `forwardRef` removal cleans up component APIs. |
| **TypeScript** | 5.x | Language | Type safety across engine, editor, and plugin API surfaces. |
| **PixiJS** | 8.18.x | Game renderer | WebGPU-first architecture future-proofs the renderer. Render Layers decouple draw order from scene graph — useful for UI overlays, weather effects, etc. Tagged text and SplitText simplify RPG dialogue rendering. |
| **json-render** | latest (`@json-render/core`, `@json-render/react`) | Editor UI contract | `defineCatalog` + Zod schemas constrain all editor panels (built-in and plugin) to a validated JSON tree. Plugins register catalog entries instead of shipping raw React components. The `defineRegistry` step maps abstract definitions to physical components. |
| **Zod** | 3.x | Schema validation | Shared by json-render catalogs and the Schema Registry module. Single validation library across the entire stack. |

### 3.3 Toolchain

| Technology | Role | Rationale |
|---|---|---|
| **pnpm** | Package manager | Content-addressable storage, `workspace:*` protocol for internal packages, smaller disk footprint than npm/yarn |
| **Turborepo** | Monorepo task orchestration | Simple, fast caching, affected-only builds. Right fit for a small-to-medium team — Nx would be overkill. |
| **Vite / esbuild** | Bundling | Fast dev builds (Vite), fast production builds (esbuild). Used for both editor dev server and export pipeline. |

### 3.4 Data & Persistence

| Technology | Role | Notes |
|---|---|---|
| **JSON** | Entity data, project config, schema definitions | Human-readable, diff-friendly, native to the JS ecosystem |
| **TOML** | User-facing config files | More ergonomic than JSON for hand-edited files (comments, multi-line strings) |
| **Binary asset formats** | Textures, audio, tilesets | Stored as-is; referenced by path from JSON entity files |

---

## 4. Architecture

### 4.1 High-Level Diagram

```
┌─────────────────────────────────────────────────────┐
│                   Electron Shell                     │
│  ┌──────────────┐  IPC  ┌─────────────────────────┐ │
│  │ Main Process │◄─────►│    Renderer Process      │ │
│  │  (Node.js)   │       │  ┌───────────────────┐   │ │
│  │              │       │  │   Editor UI        │   │ │
│  │  • File I/O  │       │  │  (React + json-    │   │ │
│  │  • Project   │       │  │   render catalog)  │   │ │
│  │    Manager   │       │  ├───────────────────┤   │ │
│  │  • Asset     │       │  │   Game Viewport    │   │ │
│  │    Pipeline  │       │  │   (PixiJS v8)      │   │ │
│  └──────────────┘       │  └───────────────────┘   │ │
│                         └─────────────────────────┘ │
├─────────────────────────────────────────────────────┤
│              Platform Abstraction Layer              │
│  (filesystem, input, audio, windowing — all OS      │
│   access goes through this layer)                   │
├─────────────────────────────────────────────────────┤
│                    Game Engine                       │
│  Scene Manager ← Entity System ← Tilemap Renderer   │
│  Event System  ← Scripting     ← Battle Engine      │
│  Audio Manager ← Animation     ← Asset Manager      │
└─────────────────────────────────────────────────────┘
```

### 4.2 Key Architectural Decisions

#### Platform Abstraction Layer (PAL)
The game engine never touches `fs`, `path`, `process`, or any Electron/Node API directly. All OS access flows through a PAL interface. This enables:
- Running the engine in non-Electron contexts (web export, NW.js, tests)
- Mocking the entire OS surface for unit tests
- Future export targets without engine changes

#### Serializable Game State
Game state is a single, serializable object. This is not just a save/load convenience — it is the foundation for:
- **Save/Load**: serialize → write to disk
- **Multiplayer sync**: serialize → send over the wire
- **Undo/Redo in playtest**: snapshot → restore
- **Deterministic replay**: state + input log → reproduce

#### json-render Catalog as UI Contract
All editor panels — built-in and plugin-contributed — render from a schema-constrained JSON specification:

```typescript
// Editor defines the catalog
const editorCatalog = defineCatalog(schema, {
  components: {
    PropertyGrid:   { props: z.object({ schemaId: z.string(), entityId: z.string() }) },
    TilePalette:    { props: z.object({ tilesetId: z.string() }) },
    EventNodeGraph: { props: z.object({ eventChainId: z.string() }) },
    // ...
  },
  actions: {
    SaveEntity:  { params: z.object({ entityId: z.string() }) },
    RunPlaytest: { params: z.object({ sceneId: z.string() }) },
    // ...
  },
});

// Plugins extend it
pluginCatalog.register({
  components: {
    CustomInspector: { props: z.object({ ... }) },
  },
});
```

This means:
- Plugins do not wire themselves into the editor through ad-hoc imports — they register catalog entries plus editor-only implementations behind the host's registry boundary
- The editor can validate, sandbox, and version-gate plugin UI contributions
- The same catalog can power AI-assisted UI generation in the future (json-render's original purpose)

#### Command Pattern (Design-For from Day One)
Every state mutation in the editor flows through a command:

```typescript
interface Command<T = unknown> {
  id: string;
  execute(): T;
  undo(): void;
  description: string;
}
```

The undo/redo UI ships in Phase 7, but the pattern is enforced from the first editor module (Phase 3). This prevents a painful retrofit.

#### Extension API Namespaces
Plugins declare whether they target the **editor**, the **runtime**, or both:

```json
// eternity-plugin-manifest.json
{
  "name": "my-plugin",
  "targets": ["editor", "runtime"],
  "editor": { "catalogEntries": "editor-catalog.ts" },
  "runtime": { "entryPoint": "runtime-plugin.ts" }
}
```

Editor plugins extend the json-render catalog. Runtime plugins hook into the engine's event system and entity lifecycle. The boundary is explicit so that editor-only plugins are never bundled into exported games.

#### Relay-Based Multiplayer
No peer-to-peer. All game state flows through a relay server:

```
Client A ──input──► Server (authoritative state) ──view──► Client A
Client B ──input──►                                ──view──► Client B
```

State/view separation means clients only receive the slice of state they're allowed to see. The server is the same engine running headless, exported as a Node.js SEA binary.

---

## 5. Cross-Cutting Concerns

### 5.1 Git-Friendly Project Format
- One file per entity (NPC, map, tileset, event chain)
- JSON for data, TOML for config
- No monolithic save files — merging a teammate's changes is a standard `git merge`
- Asset files (textures, audio) are binary and referenced by path; use Git LFS

### 5.2 Schema Registry
The Schema Registry is the backbone of the Database, Extension API, and Localization modules. It stores Zod schemas that define:
- Entity types (characters, items, skills, etc.)
- Database table shapes
- Plugin data contributions

Since both the Schema Registry and json-render use Zod, there is a single validation library across the entire project. A database schema and a UI catalog entry use the same primitive.

### 5.3 Two-Tier Scripting
1. **Visual event editor** — node graph for non-programmers. Covers dialogue, cutscenes, conditional branching, variable manipulation.
2. **Text scripting sandbox** — TypeScript-based, sandboxed execution. For users who outgrow the visual editor. Access to engine APIs but not to raw Node/Electron APIs.

### 5.4 Export Pipeline
Export is a plugin system. Each export target is a plugin that:
1. Receives the game project (serialized state, assets, scripts)
2. Bundles it for its platform (Electron app, static web build, NW.js, etc.)
3. Optionally tree-shakes editor-only code

The first export target is Electron (dog-fooding the same shell the editor uses). Additional targets follow in Phase 6.

---

## 6. PRD Index

This document is the overview. Detailed requirements for each phase live in their own PRD:

| PRD | Phase | Modules |
|---|---|---|
| [01-foundation.md](./01-foundation.md) | Foundation | Project Format, Platform Abstraction Layer, Schema Registry, Project Manager |
| [02-core-engine.md](./02-core-engine.md) | Core Engine | Asset Manager, Tilemap Renderer, Input Manager, Entity System, Scene Manager |
| [03-core-editor.md](./03-core-editor.md) | Core Editor | Map Editor, Database Editor, Playtest System |
| [04-game-logic.md](./04-game-logic.md) | Game Logic | Event System, Scripting Engine, Battle Engine, Audio Manager, Animation Editor, Character/Sprite Manager |
| [05-multiplayer.md](./05-multiplayer.md) | Multiplayer | Network Layer, Server Export Target |
| [06-export.md](./06-export.md) | Export | Export Pipeline, Runtime Targets |
| [07-polish.md](./07-polish.md) | Polish | Global Undo/Redo, Project-wide Search, Extension API, Localization Tooling |

---

## 7. Resolved Decisions

- [x] **TOML vs JSON for entity data**: **JSON only for entities. TOML for config.** Entity data is programmatically generated by the editor — it's rarely hand-edited, has native JS parsing, and diffs cleanly with consistent indentation. TOML's advantages (comments, multi-line strings) only matter for files humans write directly, which is project and user config files.
- [x] **PixiJS WebGPU requirement**: **WebGPU preferred, WebGL fallback supported.** PixiJS v8 handles this gracefully — it detects WebGPU availability and falls back to WebGL automatically. Eternity should not gate users on GPU generation.
- [x] **Plugin distribution**: **Manual download.** Plugins are distributed as archives (zip/tar). Users place them in a `plugins/` directory within their Eternity installation or project. No registry infrastructure for v1.
- [x] **Asset pipeline**: **Mirror RPG Maker's model.** Ship built-in asset management tools — tileset slicer, character generator, animation previewer, import wizards — but don't attempt to be a full art tool. Expect external tools (Aseprite, Tiled, etc.) for serious asset creation, with first-class import support for their formats.

## 8. Open Questions

All open questions have been resolved. See §7 for resolved decisions.

## 9. Resolved (Late)

- [x] **Scripting sandbox technology**: **Web Workers + Comlink.** Web Workers provide natural isolation — no access to `require`, `fs`, DOM, or Electron APIs. Google's Comlink library proxies the `Eternity.*` scripting API across the worker boundary, making calls look like local async function calls. Combined with CSP headers restricting `fetch`/`XMLHttpRequest`, this provides sufficient sandboxing for user-authored game scripts. Works identically in Electron and web exports (unlike V8 isolates which are Electron-only). QuickJS WASM was considered for stronger isolation but rejected due to TypeScript compilation complexity and debugging limitations.
