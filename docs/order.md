**Phase 1: Foundation (don't build anything else until this is solid)**
1. **Version Control Friendly Project Format** — every other module persists data; decide the format first
2. **Platform Abstraction Layer** — every other module that touches the OS goes through this
3. **Schema Registry** — underpins Database, Extensions, and Localization
4. **Project Manager** — you need to open/save/create projects before anything else is useful

**Phase 2: Core Engine**
5. **Asset Manager** — everything needs assets before it can render anything
6. **Map/Tilemap Renderer** — most visible proof-of-concept, keeps you motivated
7. **Input Manager** — needed to actually interact with anything you render
8. **Entity System** — needs renderer and input in place
9. **Scene Manager** — needs entities and maps to transition between

**Phase 3: Core Editor**
10. **Map Editor** — builds directly on the renderer
11. **Database Editor** — builds on Schema Registry
12. **Playtest System** — once you have maps and a database, you need to run the game

**Phase 4: Game Logic**
13. **Event System** — now you have something to trigger events on
14. **Scripting Engine** — visual editor first, text scripting later
15. **Battle Engine** — complex enough that you want everything else stable first
16. **Audio Manager**
17. **Animation Editor**
18. **Character/Sprite Manager**

**Phase 5: Multiplayer**
19. **Network Layer**
20. **Server Export Target**

**Phase 6: Export**
21. **Export Pipeline + first runtime target (Electron)**
22. **Additional runtime targets**

**Phase 7: Polish**
23. **Global Undo/Redo**
24. **Project-wide Search**
25. **Extension API**
26. **Localization Tooling**

---

Two caveats:

- **Global Undo/Redo** is listed late but you should design for it early — use the command pattern throughout the editor from day one, even if the UI for it comes later
- **Extension API** is listed late but its boundaries should be in your head while designing every module, so you don't accidentally make things impossible to extend
