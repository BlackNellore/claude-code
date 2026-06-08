# Claude Code — Reverse Engineering Index

> **Purpose of this folder:** A top-down guide to how Claude Code works internally. Start here, then drill into layers and topics as needed.

---

## What is Claude Code?

Claude Code (internal codename **Tengu**) is Anthropic's AI coding agent CLI. It is not a thin wrapper around the API — it is a full **agentic runtime** with:

- A custom **React/Ink terminal UI**
- A **multi-turn query loop** that streams from the Anthropic API, executes tools, and repeats
- **40+ built-in tools** (bash, files, grep, LSP, web, sub-agents, MCP, …)
- **Permissions**, hooks, memory, compaction, multi-agent swarms, and remote execution

This repository is a mirror of leaked source recovered from npm sourcemaps. Some files (notably `src/types/message.ts`) are missing from the leak.

---

## Reading Guide

| If you want to… | Start here |
|-----------------|------------|
| Understand the overall strategy | [01-strategy-and-architecture.md](./01-strategy-and-architecture.md) |
| Follow how input becomes output | [02-data-flow-and-transformations.md](./02-data-flow-and-transformations.md) |
| Find a specific file or module | [03-file-locator.md](./03-file-locator.md) |
| Deep-dive a layer | [layers/](./layers/) folder |
| Deep-dive a cross-cutting topic | [topics/](./topics/) folder |

---

## Layer Map (Top → Bottom)

```
┌─────────────────────────────────────────────────────────────┐
│  L0  Entry & CLI Routing          entrypoints/cli.tsx       │
│      main.tsx (Commander.js)                                │
├─────────────────────────────────────────────────────────────┤
│  L1  Session Bootstrap            setup.ts, init.ts         │
│      Settings, MCP, agents, plugins                         │
├─────────────────────────────────────────────────────────────┤
│  L2  Terminal UI (Ink/React)      screens/REPL.tsx          │
│      components/, ink/                                      │
├─────────────────────────────────────────────────────────────┤
│  L3  Input Processing             processUserInput/         │
│      Slash commands, images, hooks                          │
├─────────────────────────────────────────────────────────────┤
│  L4  Query Engine (Agent Loop)    query.ts, QueryEngine.ts  │
│      Compaction, token budget, stop hooks                   │
├─────────────────────────────────────────────────────────────┤
│  L5  API Client                   services/api/claude.ts  │
│      Streaming, betas, retries, model routing               │
├─────────────────────────────────────────────────────────────┤
│  L6  Tool Execution               tools/, toolOrchestration │
│      Permissions gate, concurrency                          │
├─────────────────────────────────────────────────────────────┤
│  L7  Persistence & Side Systems   sessionStorage, memdir    │
│      MCP, bridge, coordinator, analytics                    │
└─────────────────────────────────────────────────────────────┘
```

Each layer has a dedicated doc in [`layers/`](./layers/).

---

## Layer Documentation

| # | Layer | Doc |
|---|-------|-----|
| 1 | Entry & CLI | [layers/01-entry-and-cli.md](./layers/01-entry-and-cli.md) |
| 2 | Terminal UI | [layers/02-ui-terminal.md](./layers/02-ui-terminal.md) |
| 3 | Input Processing | [layers/03-input-processing.md](./layers/03-input-processing.md) |
| 4 | Query Engine | [layers/04-query-engine.md](./layers/04-query-engine.md) |
| 5 | API Client | [layers/05-api-client.md](./layers/05-api-client.md) |
| 6 | Tools | [layers/06-tools.md](./layers/06-tools.md) |
| 7 | Permissions | [layers/07-permissions.md](./layers/07-permissions.md) |
| 8 | MCP | [layers/08-mcp.md](./layers/08-mcp.md) |
| 9 | Memory & Dreams | [layers/09-memory-and-dreams.md](./layers/09-memory-and-dreams.md) |
| 10 | Multi-Agent | [layers/10-multi-agent.md](./layers/10-multi-agent.md) |
| 11 | Bridge & Remote | [layers/11-bridge-and-remote.md](./layers/11-bridge-and-remote.md) |
| 12 | Configuration | [layers/12-configuration.md](./layers/12-configuration.md) |

---

## Topic Documentation (Cross-Cutting)

| Topic | Doc |
|-------|-----|
| Message types & conversions | [topics/messages.md](./topics/messages.md) |
| Hooks lifecycle | [topics/hooks.md](./topics/hooks.md) |
| Slash commands & skills | [topics/commands-and-skills.md](./topics/commands-and-skills.md) |
| State management | [topics/state-management.md](./topics/state-management.md) |
| Extension points | [topics/extension-points.md](./topics/extension-points.md) |

---

## Execution Modes

Claude Code runs in several modes from the same codebase:

| Mode | Trigger | Entry path |
|------|---------|------------|
| **Interactive REPL** | `claude` (default) | `main.tsx` → `launchRepl()` → `REPL.tsx` |
| **Headless / SDK** | `claude -p "…"` | `main.tsx` → `cli/print.ts` → `QueryEngine` |
| **Remote Control** | `claude remote-control` | `entrypoints/cli.tsx` → `bridge/bridgeMain.ts` |
| **MCP server** | `claude mcp …` | `entrypoints/mcp.ts` |
| **Daemon workers** | `--daemon-worker` | `daemon/workerRegistry.ts` |
| **Coordinator swarm** | Feature flag + mode | `coordinator/coordinatorMode.ts` |

See [01-strategy-and-architecture.md](./01-strategy-and-architecture.md) for how these share the query loop.

---

## Key Source Files (Quick Reference)

| File | Size / Role |
|------|-------------|
| `src/entrypoints/cli.tsx` | Bootstrap router with fast paths |
| `src/main.tsx` | ~785KB Commander CLI definition |
| `src/query.ts` | Core agentic loop (~68KB) |
| `src/utils/messages.ts` | Message model (~5.5K lines) |
| `src/services/api/claude.ts` | API client (~3.4K lines) |
| `src/screens/REPL.tsx` | Main interactive UI |
| `src/Tool.ts` | Tool type system |
| `src/tools.ts` | Tool registry |

Full locator: [03-file-locator.md](./03-file-locator.md)

---

## Interactive Viewer

Open [`app/index.html`](./app/index.html) in a browser (or run a local static server) to browse this documentation with cross-linking and full-text search.

```bash
# From repo root — serve the reveng folder (not app/ alone):
npx serve reveng
# Then open http://localhost:3000/app/
```

---

## Caveats for Reverse Engineers

1. **Missing `src/types/message.ts`** — reconstruct types from `utils/messages.ts` and SDK schemas
2. **No `package.json`** in this mirror — built with **Bun** (`bun:bundle`, `feature()` gates)
3. **`feature('FLAG')`** — compile-time dead code elimination; leaked source may be an internal build
4. **Generated files absent** — e.g. `coreTypes.generated.js`, `settingsTypes.generated.js`
