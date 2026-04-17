# Glossary

> Terms used throughout the Eternity documentation with project-specific definitions.

---

| Term | Definition |
|---|---|
| **PAL** | **Platform Abstraction Layer.** Interface that decouples the engine from OS-specific APIs (filesystem, audio, windowing). Each export target implements a PAL: `ElectronPlatform`, `WebPlatform`, `HeadlessPlatform`, `MockPlatform`. |
| **ECS** | **Entity Component System.** Architecture where game objects (entities) are composed of data-only components, and systems process entities with matching component sets each frame. Eternity uses Miniplex. |
| **Entity** | A game object (NPC, player, treasure chest, projectile). In the ECS, entities are plain JS objects with optional component properties. In the project format, entities are also the JSON files in `data/` (actors, items, etc.). Context determines which meaning applies. |
| **Component** | A data-only property on an ECS entity (e.g. `PositionComponent`, `SpriteComponent`). Components have no logic — systems provide behavior. |
| **System** | A function that processes all entities matching a specific archetype (component combination) each frame. Example: `MovementSystem` processes entities with `Position` + `Movement`. |
| **Archetype** | A specific combination of components. In Miniplex, `world.archetype("position", "movement")` returns all entities that have both components. |
| **Command** | An undoable operation following the Command pattern. Every editor mutation (paint tile, edit entity field, move event) is wrapped in a Command with `execute()` and `undo()` methods. |
| **Command History** | The stack of executed Commands. Ctrl+Z pops and undoes; Ctrl+Shift+Z re-executes. |
| **Compound Command** | Multiple Commands grouped as one undoable unit. Example: a flood fill creates many `PaintTileCommand`s but undoes as one operation. |
| **Schema Registry** | A global registry of Zod schemas keyed by namespace (`eternity:actor`, `plugin:crafting:recipe`). Powers both validation and form generation. |
| **Catalog** | The json-render `defineCatalog()` output. Defines all allowed UI components and their Zod-validated prop shapes. The "contract" that editor panels and plugins must follow. |
| **Registry** | The json-render `defineRegistry()` output. Maps abstract catalog entries to concrete React component implementations. |
| **Spec** | A JSON tree that conforms to a catalog. Passed to `<Renderer>` to produce React UI. Plugins generate specs; the editor shell renders them. |
| **Scene** | A distinct game state with its own lifecycle: map exploration, battle, menu, title screen. Managed by the Scene Manager's push/pop stack. |
| **Event** | A scripted sequence of commands attached to a map tile (NPC dialogue, treasure chest logic, door transitions). Not to be confused with JavaScript events or DOM events. |
| **Event Page** | One "version" of an event. An NPC might have 3 pages: before quest, during quest, after quest. Conditions (switches/variables) determine which page is active. |
| **Event Command** | A single instruction within an event (Show Text, Conditional Branch, Change Items). Commands are sequential, with indentation for nesting. |
| **Common Event** | A reusable event chain stored globally (not on a specific map). Callable from any map event via the "Common Event" command. |
| **Switch** | A global boolean flag (true/false). Used to track story progress, quest state, etc. Referenced by ID number. |
| **Variable** | A global numeric value. Used for counters, scores, timers, etc. Referenced by ID number. |
| **Self-Switch** | A per-event boolean flag (A, B, C, D). Used for event-local state like "chest already opened." |
| **Tileset** | A collection of tile images with metadata (passability, autotile categories, special flags). Assigned to maps. |
| **Autotile** | A tile that automatically adjusts its edges based on neighboring tiles. Categories A1–A4 define different autotile behaviors (water, ground, walls). |
| **Passability** | Per-tile metadata controlling whether entities can walk on a tile: `blocked`, `passable`, or `star` (passable but renders above the character). |
| **BGM** | **Background Music.** Loops continuously. One BGM active at a time, with crossfade on transitions. |
| **BGS** | **Background Sound.** Ambient audio (rain, wind) that loops alongside BGM. |
| **ME** | **Musical Effect.** Short jingle (victory fanfare, level up) that interrupts BGM, which resumes after. |
| **SE** | **Sound Effect.** One-shot audio (menu cursor, attack sound). Multiple SEs can play simultaneously. |
| **Slug** | A URL/filename-safe string derived from a display name. `"Merchant Nora"` → `"merchant-nora"`. Used for entity filenames. |
| **Node.js SEA** | **Single Executable Application.** Node.js feature (`--build-sea`) that compiles a JS app + assets into a standalone binary. Used for multiplayer server export. |
| **Relay Server** | The authoritative multiplayer server. Clients send inputs; the server computes state and broadcasts filtered views. Not peer-to-peer. |
| **View Filter** | Server-side function that returns only the game state slice a specific player is allowed to see (e.g. only entities on their current map). |
| **Client-Side Prediction** | Technique where the client applies its own inputs immediately (for responsiveness) and reconciles with the server's authoritative state when it arrives. |
| **Export Target** | A plugin implementing the `ExportTarget` interface. Packages the game for a specific platform (Electron, Web, Tauri, Server). |
| **ASAR** | Electron's archive format for bundling app files. Used in Electron exports. Large assets and native modules are unpacked from ASAR. |
| **Blockmap** | A file generated by `electron-builder` alongside each release. Enables differential updates — only changed blocks are downloaded. |
| **Comlink** | Google's library for Web Worker communication. Makes cross-worker function calls look like local async calls via ES6 Proxy. Used for the scripting sandbox. |
| **React Flow** | Library for building node-based editors in React. Used for the visual scripting graph (Tier 1 scripting). |
| **Miniplex** | Object-based ECS library for TypeScript with React bindings. Chosen over bitECS for serialization friendliness and editor integration. |
| **json-render** | Vercel's library for rendering UI from JSON specs constrained by Zod schemas. The editor's UI contract — all panels (built-in and plugin) render through it. |
