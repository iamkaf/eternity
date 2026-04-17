# Plugin Development Guide

> Tutorial-style guide for creating Eternity plugins. For the formal extension API spec, see [prd/07-polish.md](prd/07-polish.md) §25.

---

## What Plugins Can Do

| Extension Point | What You Add | Example |
|---|---|---|
| **Schema Registry** | New entity types | "Recipe" for a crafting system |
| **json-render Catalog** | Editor panels and inspectors | Crafting station editor panel |
| **Entity System** | ECS components and systems | `CraftingStation` component + `CraftingSystem` |
| **Event Commands** | Custom event commands | "Open Crafting Station" command |
| **Export Targets** | Custom export platforms | Mobile export via Capacitor |
| **Debug Panels** | Playtest debug panels | Crafting debug inspector |
| **Scene Types** | Custom game scenes | Fishing minigame scene |

---

## Quick Start: Creating a Plugin

### 1. Directory Structure

Create a folder in the project's `plugins/` directory:

```
plugins/
└── crafting-system/
    ├── eternity-plugin.json    # Plugin manifest (required)
    ├── schemas/
    │   └── recipe.ts           # Zod schema for the "Recipe" entity type
    ├── editor/
    │   ├── catalog.ts          # json-render catalog entries
    │   └── RecipeEditor.tsx    # React component for the editor panel
    ├── runtime/
    │   ├── index.ts            # Runtime entry point
    │   ├── components.ts       # ECS components
    │   └── systems.ts          # ECS systems
    └── commands/
        └── open-station.ts     # Custom event command handler
```

### 2. Plugin Manifest

`eternity-plugin.json` — the only required file:

```json
{
  "name": "crafting-system",
  "version": "1.0.0",
  "displayName": "Crafting System",
  "description": "Adds crafting stations, recipes, and materials to your game.",
  "author": "Your Name",
  "eternity": "^1.0.0",
  "targets": ["editor", "runtime"],

  "editor": {
    "catalogEntries": "editor/catalog.ts",
    "styles": "editor/styles.css"
  },

  "runtime": {
    "entryPoint": "runtime/index.ts",
    "components": ["CraftingStation", "Recipe"],
    "systems": ["CraftingSystem"]
  },

  "schemas": [
    { "key": "plugin:crafting-system:recipe", "file": "schemas/recipe.ts" },
    { "key": "plugin:crafting-system:material", "file": "schemas/material.ts" }
  ],

  "eventCommands": [
    { "code": "crafting:open-station", "file": "commands/open-station.ts" }
  ]
}
```

**Key fields:**
- `"eternity": "^1.0.0"` — semver range of compatible Eternity versions
- `"targets"` — `"editor"` (UI code, never exported), `"runtime"` (game logic, included in exports), or both

### 3. Define Your Schema

`schemas/recipe.ts`:

```typescript
import { z } from "zod";

export const recipeSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  icon: z.string().describe("asset:icons/").optional(),
  description: z.string().default(""),

  // Ingredients: what the player needs
  ingredients: z.array(z.object({
    itemId: z.string().nullable().describe("ref:item"),
    quantity: z.number().int().min(1).default(1),
  })).min(1),

  // Result: what gets crafted
  result: z.object({
    itemId: z.string().nullable().describe("ref:item"),
    quantity: z.number().int().min(1).default(1),
  }),

  // Requirements
  requiredLevel: z.number().int().min(1).default(1),
  craftingTime: z.number().min(0).default(0),    // seconds, 0 = instant

  note: z.string().default(""),
});
```

This schema will:
1. Appear in the Database Editor sidebar as a "Recipe" category
2. Auto-generate an editing form (item pickers for ingredients/results, number inputs for quantities)
3. Validate all recipe data on every edit

### 4. Add Editor UI (Optional)

`editor/catalog.ts` — register custom panels:

```typescript
import { z } from "zod";

// These are additional editor components your plugin provides
export const catalogEntries = {
  CraftingRecipePreview: {
    props: z.object({
      recipeId: z.string(),
      showIngredients: z.boolean().default(true),
    }),
    description: "Visual preview of a crafting recipe with ingredient icons.",
  },
};
```

`editor/RecipeEditor.tsx` — the React implementation:

```tsx
import React from "react";

export function CraftingRecipePreview({ recipeId, showIngredients }: {
  recipeId: string;
  showIngredients: boolean;
}) {
  // Your React component renders here
  // The editor shell calls this through json-render's <Renderer>
  return (
    <div className="recipe-preview">
      {/* Recipe visualization */}
    </div>
  );
}
```

### 5. Add Runtime Logic

`runtime/components.ts` — ECS components:

```typescript
// Component data for a crafting station entity on the map
export interface CraftingStationComponent {
  stationName: string;
  availableRecipes: string[];    // Recipe entity IDs
  craftingSpeed: number;         // Multiplier (1.0 = normal)
}
```

`runtime/systems.ts` — ECS systems:

```typescript
import type { World } from "miniplex";
import type { GameEntity } from "@eternity/engine";

export function craftingSystem(world: World<GameEntity>, dt: number) {
  const stations = world.archetype("position", "craftingStation");

  for (const entity of stations.entities) {
    // System logic: check for nearby players, process crafting timers, etc.
  }
}
```

`runtime/index.ts` — entry point:

```typescript
import type { PluginRuntime } from "@eternity/engine";
import { craftingSystem } from "./systems";

export default {
  init(engine: PluginRuntime) {
    // Register the component type
    engine.ecs.registerComponent("craftingStation");

    // Register the system
    engine.ecs.registerSystem("CraftingSystem", craftingSystem);
  },

  teardown(engine: PluginRuntime) {
    engine.ecs.unregisterSystem("CraftingSystem");
    engine.ecs.unregisterComponent("craftingStation");
  },
} satisfies PluginRuntime;
```

### 6. Add a Custom Event Command

`commands/open-station.ts`:

```typescript
import type { EventCommandHandler } from "@eternity/engine";

export const openStation: EventCommandHandler = {
  code: "crafting:open-station",
  name: "Open Crafting Station",
  category: "Crafting",
  description: "Opens the crafting UI for the player.",

  params: {
    stationId: { type: "entity-ref", entityType: "crafting-station", label: "Station" },
    filterByLevel: { type: "boolean", label: "Filter by Player Level", default: true },
  },

  async execute(params, context) {
    const { stationId, filterByLevel } = params;
    // Open the crafting scene, filtered to this station's recipes
    await context.sceneManager.push("crafting", { stationId, filterByLevel });
  },
};
```

This command appears in the Event Editor's command picker alongside built-in commands:

```
┌── Crafting ──────────────────────┐
│ ◆ Open Crafting Station          │
│   Station: [Blacksmith    ▾]     │
│   Filter by Player Level: [✓]   │
└──────────────────────────────────┘
```

---

## Plugin Lifecycle

```
Editor starts
  │
  ▼
Scan plugins/ for eternity-plugin.json
  │
  ▼
For each plugin:
  ├── Validate manifest
  ├── Check version compatibility ("eternity": "^1.0.0")
  ├── Register schemas → Database Editor auto-generates forms
  ├── Register catalog entries → editor panels available
  ├── Register event commands → appear in event editor
  └── Register ECS components/systems → available at runtime
  │
  ▼
Plugin.init() called
  │
  ▼
Editor runs... plugin is active
  │
  ▼
On editor close or plugin disable:
  ├── Plugin.teardown() called
  └── All registrations cleaned up
```

---

## Important Rules

### Namespace Your Keys

All plugin identifiers must be namespaced with `plugin:{plugin-name}:`:

```
Schema keys:     plugin:crafting-system:recipe
Event commands:  crafting:open-station
Component names: craftingStation
```

This prevents collisions with engine keys (`eternity:actor`) and other plugins.

### Editor vs. Runtime Separation

| Target | Included in exports? | Can use React? | Can use json-render? |
|---|---|---|---|
| `editor` | ❌ Never | ✅ Yes | ✅ Yes |
| `runtime` | ✅ Always | ❌ No | ❌ No |

**Never import editor code from runtime code.** The export pipeline tree-shakes all editor code. If your runtime code imports from `editor/`, the export will fail or include editor UI in the game.

### Use the Registration API

Plugins interact with the engine through registration methods only:

```typescript
// ✅ Correct: use the API
engine.ecs.registerComponent("craftingStation");
engine.schemas.register("plugin:crafting:recipe", recipeSchema);

// ❌ Wrong: reach into internals
engine._world.components.push(myComponent);
engine._registry._schemas["recipe"] = mySchema;
```

### Clean Up in Teardown

Everything registered in `init()` must be unregistered in `teardown()`. The editor may disable/enable plugins without restarting.

---

## Testing Your Plugin

### Unit Tests

Test your schemas, components, and systems independently:

```typescript
import { recipeSchema } from "./schemas/recipe";

test("recipe requires at least one ingredient", () => {
  const result = recipeSchema.safeParse({
    id: "test",
    name: "Test Recipe",
    ingredients: [],
    result: { itemId: "potion", quantity: 1 },
  });
  expect(result.success).toBe(false);
});
```

### Integration Test

Load your plugin into a test engine:

```typescript
import { MockPlatform } from "@eternity/platform-mock";
import { Engine } from "@eternity/engine";
import craftingPlugin from "./runtime/index";

const engine = new Engine(new MockPlatform());
craftingPlugin.init(engine);

// Verify component is registered
const station = engine.world.add({
  position: { tileX: 5, tileY: 5, offsetX: 0, offsetY: 0, z: 0 },
  craftingStation: { stationName: "Forge", availableRecipes: ["iron-sword"], craftingSpeed: 1 },
});

expect(station.craftingStation?.stationName).toBe("Forge");

craftingPlugin.teardown(engine);
```

---

## Distribution

For v1, plugins are distributed manually:

1. Zip your plugin directory
2. Share it (itch.io, GitHub Releases, Discord, etc.)
3. Users extract it to their project's `plugins/` directory

```
plugins/
└── crafting-system/     ← extracted here
    ├── eternity-plugin.json
    ├── schemas/
    ├── editor/
    ├── runtime/
    └── commands/
```

The plugin is automatically detected on next editor launch.
