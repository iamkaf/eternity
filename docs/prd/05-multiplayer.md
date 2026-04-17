# Phase 5: Multiplayer

> **Status**: Draft
> **Last updated**: 2026-04-16
> **Parent**: [00-overview.md](./00-overview.md)
> **Prerequisite**: Phases 1–4 complete

---

## Module 19: Network Layer

### 19.1 Problem

Eternity's architecture is designed for multiplayer from the ground up — the single serializable game state enables both save/load and network sync from the same primitive. The Network Layer implements the relay-based multiplayer model where an authoritative server owns game state and clients send inputs.

### 19.2 Requirements

| ID | Requirement | Priority |
|---|---|---|
| NL-01 | WebSocket-based client-server communication | Must |
| NL-02 | Authoritative server: clients send inputs, server computes state, broadcasts views | Must |
| NL-03 | State/view separation: clients receive only the state slice they're allowed to see | Must |
| NL-04 | Client-side prediction for responsive input (apply locally, reconcile with server) | Must |
| NL-05 | Entity interpolation for smooth rendering of other players | Must |
| NL-06 | Room/session management: create, join, leave game sessions | Must |
| NL-07 | MessagePack binary protocol for state updates (not JSON) | Should |
| NL-08 | Reconnection with state catchup (player disconnects briefly, rejoins) | Should |
| NL-09 | Latency compensation: server-side input buffering | Should |
| NL-10 | Heartbeat/keepalive for dead connection detection | Must |

### 19.3 Architecture

```
┌──────────────┐     WebSocket      ┌──────────────────────┐
│  Client A    │◄──────────────────►│                      │
│  (Electron)  │   inputs → server  │   Relay Server       │
│              │   views ← server   │   (Authoritative)    │
├──────────────┤                    │                      │
│  Client B    │◄──────────────────►│  • Full game state   │
│  (Electron)  │                    │  • Input validation  │
├──────────────┤                    │  • State computation │
│  Client C    │◄──────────────────►│  • View filtering    │
│  (Web)       │                    │  • Session management│
└──────────────┘                    └──────────────────────┘
```

### 19.4 Message Protocol

```typescript
// Client → Server
type ClientMessage =
  | { type: "input"; action: string; data: unknown; seq: number }
  | { type: "join"; sessionId: string; playerName: string }
  | { type: "leave" }
  | { type: "ping" };

// Server → Client
type ServerMessage =
  | { type: "state"; view: Partial<GameState>; ack: number; tick: number }
  | { type: "joined"; playerId: string; sessionInfo: SessionInfo }
  | { type: "player-joined"; playerId: string; name: string }
  | { type: "player-left"; playerId: string }
  | { type: "error"; code: string; message: string }
  | { type: "pong" };
```

### 19.5 State/View Separation

```typescript
interface ViewFilter {
  /**
   * Given the full game state and a player ID, return only the slice
   * that player is allowed to see.
   *
   * Examples:
   * - Players only see entities on their current map
   * - Players don't see other players' inventory details
   * - Fog of war hides unexplored tiles
   */
  filterStateForPlayer(state: GameState, playerId: string): Partial<GameState>;
}
```

### 19.6 Design Decisions

| Decision | Rationale |
|---|---|
| **Relay, not peer-to-peer** | Authoritative server prevents cheating. All state mutations are validated server-side. Also simplifies NAT traversal — clients only connect to one server. |
| **Same engine on server** | The server runs the same game engine headlessly. No separate server codebase. State computation, event processing, and battle logic are shared. |
| **MessagePack over JSON** | State updates are frequent (multiple per second). Binary encoding reduces bandwidth 2-4× compared to JSON with no parsing ambiguity. |
| **Sequence numbers for reconciliation** | Each client input gets a `seq` number. Server ACKs the latest processed `seq`. Client discards predicted inputs that have been ACKed, replays any that haven't. |

---

## Module 20: Server Export Target

### 20.1 Problem

Players need to host their own multiplayer servers. The server should be a single binary with no runtime dependencies — download, run, done.

### 20.2 Requirements

| ID | Requirement | Priority |
|---|---|---|
| SE-01 | Export the game server as a Node.js SEA binary (`--build-sea`) | Must |
| SE-02 | Server binary includes the game engine + project data + server networking | Must |
| SE-03 | Configuration via environment variables or a config file | Must |
| SE-04 | CLI arguments: port, max players, session name | Must |
| SE-05 | Build for Linux, Windows, macOS from CI | Must |
| SE-06 | Server runs headless (no GUI, no PixiJS, no Electron) | Must |
| SE-07 | Logging to stdout/file with configurable verbosity | Should |
| SE-08 | Health check endpoint (HTTP `/health`) for monitoring | Should |

### 20.3 Server Binary Contents

```
my-game-server (single executable)
├── Game engine (headless — no renderer, no audio)
├── HeadlessPlatform (PAL implementation: filesystem + networking, no windowing/audio)
├── Project data (entities, maps, events — embedded as SEA assets)
├── WebSocket server (ws library)
├── Session manager
└── CLI argument parser
```

### 20.4 Build Flow

```
eternity export --target server
        │
        ▼
  Collect project data (entities, maps, scripts)
        │
        ▼
  Bundle engine code (tree-shake renderer, audio, editor code)
        │
        ▼
  Generate sea-config.json:
  {
    "main": "server-bundle.js",
    "output": "my-game-server",
    "assets": { "project-data": "project-data.bin" }
  }
        │
        ▼
  node --build-sea sea-config.json
        │
        ▼
  Sign binary (macOS) / ready to distribute
```

### 20.5 Design Decisions

| Decision | Rationale |
|---|---|
| **Node.js SEA, not Docker** | Target audience is hobbyist game developers, not DevOps engineers. A single binary is dramatically simpler than a container. |
| **HeadlessPlatform** | The PAL pays off here — the server uses a `HeadlessPlatform` that implements filesystem and networking but stubs out rendering, audio, and windowing. Zero renderer code in the binary. |
| **Embedded project data** | Project files are packed into the SEA as assets via `sea.getAsset()`. The server binary is fully self-contained. |

---

## Acceptance Criteria

Phase 5 is complete when:

- [ ] Two Electron clients can connect to a server and see each other on the same map
- [ ] Client inputs (movement) are validated by the authoritative server
- [ ] Client-side prediction provides responsive movement with server reconciliation
- [ ] State/view separation works: player A doesn't receive entities from player B's map
- [ ] Server exported as a Node.js SEA binary runs headlessly on Linux
- [ ] Server binary accepts `--port` and `--max-players` CLI arguments
- [ ] Health check endpoint responds at `/health`
- [ ] Reconnection works: disconnect for <30s, rejoin with state catchup
