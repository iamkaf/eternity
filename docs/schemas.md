# Schema Reference

> Canonical Zod schemas for all built-in entity types. These are the source of truth for the Schema Registry (`packages/shared/src/schemas/`).

---

## Common Types

Used across multiple schemas:

```typescript
import { z } from "zod";

/** Asset path (relative to project root). */
const assetPath = z.string().describe("asset");

/** Entity reference (ID of another entity). */
const entityRef = (type: string) => z.string().nullable().describe(`ref:${type}`);

/** Numeric range with min/max. */
const stat = z.number().int().min(0).max(9999);

/** Percentage (0–100). */
const percent = z.number().int().min(0).max(100);

/** Direction enum. */
const direction = z.enum(["up", "down", "left", "right"]);

/** Element ID for elemental system. */
const elementId = z.string();

/** Trait — a reusable modifier applied to actors, classes, equipment, states. */
const trait = z.object({
  code: z.enum([
    "element-rate", "debuff-rate", "state-rate", "state-resist",
    "param-bonus", "attack-element", "attack-state",
    "special-flag", "party-ability",
  ]),
  dataId: z.union([z.string(), z.number()]),
  value: z.number(),
});
```

---

## Entity Schemas

### `eternity:actor`

```typescript
const actorSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  nickname: z.string().default(""),
  profile: z.string().default(""),
  class: entityRef("class"),
  initialLevel: z.number().int().min(1).max(99).default(1),
  maxLevel: z.number().int().min(1).max(99).default(99),
  portrait: assetPath.describe("asset:faces/"),
  sprite: assetPath.describe("asset:characters/"),
  battler: assetPath.describe("asset:battlers/").optional(),
  baseStats: z.object({
    hp: stat.default(450),
    mp: stat.default(80),
    attack: stat.default(25),
    defense: stat.default(20),
    magicAttack: stat.default(15),
    magicDefense: stat.default(15),
    agility: stat.default(20),
    luck: stat.default(15),
  }),
  statCurves: z.object({
    hp: z.array(z.number()).length(99).optional(),
    mp: z.array(z.number()).length(99).optional(),
    attack: z.array(z.number()).length(99).optional(),
    defense: z.array(z.number()).length(99).optional(),
    magicAttack: z.array(z.number()).length(99).optional(),
    magicDefense: z.array(z.number()).length(99).optional(),
    agility: z.array(z.number()).length(99).optional(),
    luck: z.array(z.number()).length(99).optional(),
  }).optional(),
  initialEquipment: z.object({
    weapon: entityRef("weapon"),
    shield: entityRef("armor"),
    head: entityRef("armor"),
    body: entityRef("armor"),
    accessory: entityRef("armor"),
  }),
  traits: z.array(trait).default([]),
  note: z.string().default(""),
});
```

### `eternity:class`

```typescript
const classSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  expCurve: z.object({
    base: z.number().int().default(30),
    extra: z.number().int().default(20),
    accelerationA: z.number().int().default(30),
    accelerationB: z.number().int().default(30),
  }),
  statGrowth: z.object({
    hp: z.array(z.number()).length(2).default([200, 500]),       // [min at lv1, max at lv99]
    mp: z.array(z.number()).length(2).default([30, 100]),
    attack: z.array(z.number()).length(2).default([10, 50]),
    defense: z.array(z.number()).length(2).default([10, 50]),
    magicAttack: z.array(z.number()).length(2).default([10, 50]),
    magicDefense: z.array(z.number()).length(2).default([10, 50]),
    agility: z.array(z.number()).length(2).default([10, 50]),
    luck: z.array(z.number()).length(2).default([10, 50]),
  }),
  learnedSkills: z.array(z.object({
    level: z.number().int().min(1).max(99),
    skillId: entityRef("skill"),
  })).default([]),
  traits: z.array(trait).default([]),
  note: z.string().default(""),
});
```

### `eternity:skill`

```typescript
const skillSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  icon: assetPath.describe("asset:icons/").optional(),
  description: z.string().default(""),
  skillType: z.enum(["magic", "special", "none"]).default("none"),
  mpCost: z.number().int().min(0).default(0),
  tpCost: z.number().int().min(0).default(0),
  scope: z.enum([
    "single-enemy", "all-enemies", "random-enemy",
    "single-ally", "all-allies", "single-ally-dead", "all-allies-dead",
    "user", "none",
  ]).default("single-enemy"),
  occasion: z.enum(["always", "battle-only", "menu-only", "never"]).default("always"),
  speed: z.number().int().default(0),
  successRate: percent.default(100),
  repeats: z.number().int().min(1).max(9).default(1),
  damage: z.object({
    type: z.enum(["hp-damage", "mp-damage", "hp-recover", "mp-recover", "hp-drain", "mp-drain", "none"]).default("hp-damage"),
    element: elementId.optional(),
    formula: z.string().default("a.atk * 4 - b.def * 2"),
    variance: percent.default(20),
    critical: z.boolean().default(false),
  }),
  effects: z.array(z.object({
    code: z.enum(["add-state", "remove-state", "add-buff", "add-debuff", "remove-buff", "remove-debuff", "special", "grow", "learn-skill"]),
    dataId: z.union([z.string(), z.number()]).default(0),
    value1: z.number().default(0),
    value2: z.number().default(0),
  })).default([]),
  requiredWeaponType: z.string().optional(),
  animation: entityRef("animation"),
  message1: z.string().default(""),
  message2: z.string().default(""),
  note: z.string().default(""),
});
```

### `eternity:item`

```typescript
const itemSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  icon: assetPath.describe("asset:icons/").optional(),
  description: z.string().default(""),
  itemType: z.enum(["regular", "key", "hidden-a", "hidden-b"]).default("regular"),
  price: z.number().int().min(0).default(0),
  consumable: z.boolean().default(true),
  scope: z.enum([
    "single-ally", "all-allies", "single-ally-dead", "all-allies-dead",
    "user", "single-enemy", "all-enemies", "none",
  ]).default("single-ally"),
  occasion: z.enum(["always", "battle-only", "menu-only", "never"]).default("always"),
  speed: z.number().int().default(0),
  successRate: percent.default(100),
  damage: z.object({
    type: z.enum(["hp-recover", "mp-recover", "hp-damage", "mp-damage", "none"]).default("none"),
    formula: z.string().default("0"),
    variance: percent.default(20),
  }).optional(),
  effects: z.array(z.object({
    code: z.enum(["add-state", "remove-state", "add-buff", "remove-buff", "special"]),
    dataId: z.union([z.string(), z.number()]).default(0),
    value1: z.number().default(0),
    value2: z.number().default(0),
  })).default([]),
  animation: entityRef("animation"),
  note: z.string().default(""),
});
```

### `eternity:weapon`

```typescript
const weaponSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  icon: assetPath.describe("asset:icons/").optional(),
  description: z.string().default(""),
  weaponType: z.string().default("sword"),
  price: z.number().int().min(0).default(0),
  params: z.object({
    attack: z.number().int().default(0),
    defense: z.number().int().default(0),
    magicAttack: z.number().int().default(0),
    magicDefense: z.number().int().default(0),
    agility: z.number().int().default(0),
    luck: z.number().int().default(0),
  }),
  animation: entityRef("animation"),
  traits: z.array(trait).default([]),
  note: z.string().default(""),
});
```

### `eternity:armor`

```typescript
const armorSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  icon: assetPath.describe("asset:icons/").optional(),
  description: z.string().default(""),
  armorType: z.string().default("light-armor"),
  equipSlot: z.enum(["shield", "head", "body", "accessory"]).default("body"),
  price: z.number().int().min(0).default(0),
  params: z.object({
    attack: z.number().int().default(0),
    defense: z.number().int().default(0),
    magicAttack: z.number().int().default(0),
    magicDefense: z.number().int().default(0),
    agility: z.number().int().default(0),
    luck: z.number().int().default(0),
  }),
  traits: z.array(trait).default([]),
  note: z.string().default(""),
});
```

### `eternity:enemy`

```typescript
const enemySchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  battler: assetPath.describe("asset:battlers/"),
  params: z.object({
    hp: stat.default(100),
    mp: stat.default(0),
    attack: stat.default(15),
    defense: stat.default(10),
    magicAttack: stat.default(10),
    magicDefense: stat.default(10),
    agility: stat.default(10),
    luck: stat.default(10),
  }),
  exp: z.number().int().min(0).default(10),
  gold: z.number().int().min(0).default(5),
  drops: z.array(z.object({
    itemId: entityRef("item"),
    kind: z.enum(["item", "weapon", "armor"]).default("item"),
    denominator: z.number().int().min(1).default(1),   // 1/denominator chance
  })).default([]),
  actions: z.array(z.object({
    skillId: entityRef("skill"),
    conditionType: z.enum(["always", "turn", "hp", "switch"]).default("always"),
    conditionParam1: z.number().default(0),
    conditionParam2: z.number().default(0),
    rating: z.number().int().min(1).max(10).default(5),
  })).default([]),
  traits: z.array(trait).default([]),
  note: z.string().default(""),
});
```

### `eternity:troop`

```typescript
const troopSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  members: z.array(z.object({
    enemyId: entityRef("enemy"),
    x: z.number().int(),
    y: z.number().int(),
  })),
  events: z.array(z.object({
    conditions: z.object({
      turnEnd: z.boolean().default(false),
      turnA: z.number().int().default(0),
      turnB: z.number().int().default(0),
      enemyHp: z.object({ enemyIndex: z.number().int(), hpPercent: percent }).optional(),
      actorHp: z.object({ actorId: z.string(), hpPercent: percent }).optional(),
      switchId: z.number().int().optional(),
    }),
    commands: z.array(z.unknown()),   // Event commands (same format as map events)
  })).default([]),
});
```

### `eternity:state`

```typescript
const stateSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  icon: assetPath.describe("asset:icons/").optional(),
  restriction: z.enum(["none", "attack-enemy", "attack-ally", "attack-anyone", "cannot-move"]).default("none"),
  priority: z.number().int().min(0).max(100).default(50),
  removeAtBattleEnd: z.boolean().default(true),
  removeByRestriction: z.boolean().default(false),
  autoRemovalTiming: z.enum(["none", "action-end", "turn-end"]).default("none"),
  minTurns: z.number().int().min(1).default(1),
  maxTurns: z.number().int().min(1).default(1),
  removeByDamage: z.boolean().default(false),
  removeByDamageChance: percent.default(100),
  removeByWalking: z.boolean().default(false),
  removeByWalkingSteps: z.number().int().min(1).default(100),
  message: z.object({
    actorAdd: z.string().default(""),     // "Hero is poisoned!"
    enemyAdd: z.string().default(""),
    actorPersist: z.string().default(""),  // "Hero is hurt by poison."
    actorRemove: z.string().default(""),
  }),
  traits: z.array(trait).default([]),
  note: z.string().default(""),
});
```

### `eternity:tileset`

```typescript
const tilesetSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  tileSize: z.number().int().default(48),
  images: z.object({
    a1: assetPath.describe("asset:tilesets/").optional(),  // Animated (water, lava)
    a2: assetPath.describe("asset:tilesets/").optional(),  // Ground autotile
    a3: assetPath.describe("asset:tilesets/").optional(),  // Building autotile
    a4: assetPath.describe("asset:tilesets/").optional(),  // Wall autotile
    b: assetPath.describe("asset:tilesets/").optional(),   // Decorations
    c: assetPath.describe("asset:tilesets/").optional(),
    d: assetPath.describe("asset:tilesets/").optional(),
    e: assetPath.describe("asset:tilesets/").optional(),
  }),
  passability: z.record(z.string(), z.object({
    type: z.enum(["blocked", "passable", "star"]).default("passable"),
    directions: z.object({
      up: z.boolean().default(true),
      down: z.boolean().default(true),
      left: z.boolean().default(true),
      right: z.boolean().default(true),
    }).optional(),
    flags: z.array(z.enum(["bush", "ladder", "counter", "damage"])).default([]),
  })).default({}),
  note: z.string().default(""),
});
```

### `eternity:map`

See [02-core-engine.md](./prd/02-core-engine.md) §6.3 for the full `TilemapData` interface. The schema wraps that interface with Zod validation:

```typescript
const mapSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  width: z.number().int().min(1).max(500).default(20),
  height: z.number().int().min(1).max(500).default(15),
  tileWidth: z.number().int().default(48),
  tileHeight: z.number().int().default(48),
  tilesets: z.array(entityRef("tileset")).min(1),
  layers: z.tuple([
    z.object({ tiles: z.array(z.number().int()), visible: z.boolean().default(true) }),
    z.object({ tiles: z.array(z.number().int()), visible: z.boolean().default(true) }),
    z.object({ tiles: z.array(z.number().int()), visible: z.boolean().default(true) }),
    z.object({ tiles: z.array(z.number().int()), visible: z.boolean().default(true) }),
  ]),
  parallax: z.object({
    image: assetPath.describe("asset:parallaxes/"),
    scrollX: z.number().default(0),
    scrollY: z.number().default(0),
    loopX: z.boolean().default(false),
    loopY: z.boolean().default(false),
  }).optional(),
  properties: z.object({
    bgm: z.object({
      path: assetPath.describe("asset:audio/bgm/"),
      volume: percent.default(80),
      pitch: z.number().int().min(50).max(150).default(100),
    }).optional(),
    encounterRate: z.number().int().min(0).default(30),
    encounterList: z.array(entityRef("troop")).default([]),
    displayName: z.string().optional(),
  }),
  note: z.string().default(""),
});
```

### `eternity:event`

```typescript
const eventSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  x: z.number().int().min(0),
  y: z.number().int().min(0),
  pages: z.array(z.object({
    conditions: z.object({
      switch1: z.number().int().optional(),
      switch2: z.number().int().optional(),
      variable: z.object({ id: z.number().int(), value: z.number().int(), op: z.enum([">=", "==", "<=", ">", "<", "!="]) }).optional(),
      selfSwitch: z.enum(["A", "B", "C", "D"]).optional(),
      item: entityRef("item").optional(),
      actor: entityRef("actor").optional(),
    }),
    graphic: z.object({
      sprite: assetPath.describe("asset:characters/").optional(),
      spriteIndex: z.number().int().default(0),
      direction: direction.default("down"),
      pattern: z.number().int().default(1),
    }),
    moveSpeed: z.number().int().min(1).max(6).default(3),
    moveFrequency: z.number().int().min(1).max(5).default(3),
    movePattern: z.enum(["fixed", "random", "approach", "custom"]).default("fixed"),
    moveRoute: z.array(z.unknown()).optional(),
    walkAnimation: z.boolean().default(true),
    stepAnimation: z.boolean().default(false),
    directionFix: z.boolean().default(false),
    through: z.boolean().default(false),
    priorityType: z.enum(["below", "same", "above"]).default("same"),
    trigger: z.enum(["action", "touch", "autorun", "parallel"]).default("action"),
    commands: z.array(z.object({
      code: z.string(),
      indent: z.number().int().min(0).default(0),
      params: z.record(z.unknown()).default({}),
    })).default([]),
  })).min(1),
});
```

### `eternity:common-event`

```typescript
const commonEventSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  trigger: z.enum(["none", "autorun", "parallel"]).default("none"),
  switchId: z.number().int().optional(),   // Required if trigger != "none"
  commands: z.array(z.object({
    code: z.string(),
    indent: z.number().int().min(0).default(0),
    params: z.record(z.unknown()).default({}),
  })).default([]),
});
```

### `eternity:animation`

```typescript
const animationSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  spriteSheet: assetPath.describe("asset:animations/"),
  frameWidth: z.number().int().min(1),
  frameHeight: z.number().int().min(1),
  frames: z.array(z.object({
    cells: z.array(z.object({
      pattern: z.number().int(),
      x: z.number(),
      y: z.number(),
      scaleX: z.number().default(1),
      scaleY: z.number().default(1),
      rotation: z.number().default(0),
      opacity: z.number().min(0).max(1).default(1),
      mirror: z.boolean().default(false),
    })),
    se: z.object({ path: assetPath.describe("asset:audio/se/"), volume: percent, pitch: z.number().int() }).optional(),
    flashColor: z.tuple([z.number(), z.number(), z.number(), z.number()]).optional(),
    flashDuration: z.number().int().optional(),
  })),
  position: z.enum(["head", "center", "feet", "screen"]).default("center"),
});
```

### `eternity:system`

Project-level configuration (one per project):

```typescript
const systemSchema = z.object({
  startMapId: entityRef("map"),
  startX: z.number().int().default(0),
  startY: z.number().int().default(0),
  startingParty: z.array(entityRef("actor")).min(1).max(4),
  currencyUnit: z.string().default("G"),
  elements: z.array(z.object({
    id: z.string(),
    name: z.string(),
  })).default([
    { id: "physical", name: "Physical" },
    { id: "fire", name: "Fire" },
    { id: "ice", name: "Ice" },
    { id: "thunder", name: "Thunder" },
    { id: "water", name: "Water" },
    { id: "earth", name: "Earth" },
    { id: "wind", name: "Wind" },
    { id: "light", name: "Light" },
    { id: "dark", name: "Dark" },
  ]),
  weaponTypes: z.array(z.string()).default(["sword", "spear", "axe", "bow", "staff", "dagger"]),
  armorTypes: z.array(z.string()).default(["light-armor", "heavy-armor", "robe"]),
  skillTypes: z.array(z.string()).default(["magic", "special"]),
  equipSlots: z.array(z.string()).default(["weapon", "shield", "head", "body", "accessory"]),
  titleBGM: z.object({ path: assetPath.describe("asset:audio/bgm/"), volume: percent.default(80) }).optional(),
  battleBGM: z.object({ path: assetPath.describe("asset:audio/bgm/"), volume: percent.default(80) }).optional(),
  victoryME: z.object({ path: assetPath.describe("asset:audio/me/"), volume: percent.default(80) }).optional(),
  defeatME: z.object({ path: assetPath.describe("asset:audio/me/"), volume: percent.default(80) }).optional(),
  windowSkin: assetPath.describe("asset:system/").optional(),
});
```

---

## Schema Registration

All schemas are registered at startup:

```typescript
import { SchemaRegistry } from "@eternity/shared";

const registry = new SchemaRegistry();

registry.register("eternity:actor", actorSchema);
registry.register("eternity:class", classSchema);
registry.register("eternity:skill", skillSchema);
registry.register("eternity:item", itemSchema);
registry.register("eternity:weapon", weaponSchema);
registry.register("eternity:armor", armorSchema);
registry.register("eternity:enemy", enemySchema);
registry.register("eternity:troop", troopSchema);
registry.register("eternity:state", stateSchema);
registry.register("eternity:tileset", tilesetSchema);
registry.register("eternity:map", mapSchema);
registry.register("eternity:event", eventSchema);
registry.register("eternity:common-event", commonEventSchema);
registry.register("eternity:animation", animationSchema);
registry.register("eternity:system", systemSchema);

// Plugins register with their own namespace:
// registry.register("plugin:crafting-system:recipe", recipeSchema);
```
