# Layer 11: Bridge & Remote

> [← Index](../00-index.md) | Prev: [Multi-Agent](./10-multi-agent.md) | Next: [Configuration](./12-configuration.md)

---

## Purpose

Run Claude Code remotely — cloud UI controlling local machine, SSH sessions, headless SDK, background workers.

---

## Remote Control (Bridge)

**Command:** `claude remote-control` (aliases: `rc`, `bridge`, `remote`, `sync`)

**Entry:** `entrypoints/cli.tsx` → `bridge/bridgeMain.ts`

### Concept

Your local machine becomes an **execution environment** for a cloud-hosted Claude session:
- Tools (bash, file ops) run locally
- UI may be in browser/cloud
- Bridge polls cloud API for work items

### Key files

| File | Role |
|------|------|
| `bridge/bridgeMain.ts` | Bridge worker main loop |
| `bridge/bridgeConfig.ts` | Configuration |
| `bridge/types.ts` | Bridge protocol types |
| `bridge/jwtUtils.ts` | Auth tokens |
| `bridge/sessionIdCompat.ts` | Session ID mapping |

Gated by `feature('BRIDGE_MODE')` and GrowthBook runtime gate.

---

## Headless / SDK Mode

**Command:** `claude -p "prompt" --output-format stream-json`

**Entry:** `main.tsx` → `cli/print.ts` → `QueryEngine`

### Output formats

| Format | Output |
|--------|--------|
| `text` | Plain text response |
| `json` | Single JSON object at end |
| `stream-json` | Newline-delimited JSON events |

### Permission protocol

Headless mode uses structured messages on stdin/stdout instead of Ink dialogs.

---

## SSH Mode

`claude ssh` — remote development sessions (see `commands/` and related utils).

---

## Background Sessions

| Command | Purpose |
|---------|---------|
| `claude --bg` | Start detached session |
| `claude ps` | List sessions |
| `claude attach` | Attach to session |
| `claude logs` | View session logs |
| `claude kill` | Terminate session |

Managed via `cli/` background session utilities.

---

## Daemon Workers

`--daemon-worker=<kind>` — internal worker processes spawned by supervisor.

`daemon/workerRegistry.ts` — worker kinds and run functions.

---

## Remote Entrypoint

`CLAUDE_CODE_ENTRYPOINT=remote` — identifies client type for analytics and behavior.

`CLAUDE_CODE_REMOTE=true` — container/remote environment tweaks (e.g. heap size in `cli.tsx`).

---

## SDK Types

`entrypoints/agentSdkTypes.ts` — public SDK surface:
- `Query`, `Options`, `SDKMessage`
- Hook event types
- `AgentDefinition`

`entrypoints/sdk/coreSchemas.ts` — Zod schemas for validation.

---

## How to Change This Layer

| Goal | Where |
|------|-------|
| Bridge protocol | `bridge/` |
| SDK output format | `cli/print.ts`, `entrypoints/sdk/` |
| Background sessions | `cli/` bg session modules |

---

## Related

- [01-entry-and-cli.md](./01-entry-and-cli.md) — fast paths
- [04-query-engine.md](./04-query-engine.md) — QueryEngine wrapper
