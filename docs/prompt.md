You're building an **Electron-based RPG Maker alternative** with a full engine and editor. Here are the key decisions made:

**Tech Stack**
- Electron (editor shell) + React + TypeScript
- PixiJS for rendering
- Vercel's **json-render** for the editor UI layer

**Key Architectural Decisions**
- Game engine strictly decoupled from Electron via a **Platform Abstraction Layer**
- Export pipeline is a **plugin system** — users choose their runtime (Electron, NW.js, Web, etc.)
- Linux is a hard requirement; WebKitGTK is hard-rejected, so bundled Chromium is the only viable cross-platform renderer
- **Relay-based multiplayer** with state/view separation — game state is a single serializable object, giving you save/load and multiplayer sync from the same design decision
- Server exported as a **Node.js SEA** (headless, user-hosted)
- **Per-entity JSON/TOML project files** for Git-friendliness
- **Command pattern** throughout the editor from day one to support global undo/redo later
- Two-tier scripting: visual event editor + text scripting sandbox
- **json-render catalog** as the editor UI contract — all editor panels (built-in and plugin-contributed) are rendered from a schema-constrained JSON tree; plugins extend the UI by registering catalog entries with Zod schemas rather than shipping raw React components
- Extension API with separate editor/runtime plugin namespaces

**25 modules** across Engine, Editor, Cross-cutting, and Quality of Life categories, with a detailed 7-phase build order starting with project format, platform abstraction, and schema registry before touching any rendering.
