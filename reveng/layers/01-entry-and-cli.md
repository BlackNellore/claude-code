# Layer 1: Entry & CLI

> [← Index](../00-index.md) | Next: [UI Terminal](./02-ui-terminal.md)

---

## Purpose

Route the process to the correct runtime mode with minimal startup cost. Most users hit the full CLI; many internal/fast paths bypass `main.tsx` entirely.

---

## Entry Chain

```
node dist/main.js  (or bun)
  └─ entrypoints/cli.tsx :: main()
       ├─ --version          → console.log version, exit
       ├─ --dump-system-prompt → render system prompt, exit (ant-only)
       ├─ --claude-in-chrome-mcp → Chrome MCP server
       ├─ --daemon-worker    → background worker
       ├─ remote-control     → bridge mode
       ├─ claude ps/logs/…   → background session mgmt
       └─ default            → import('../main.tsx')
```

---

## `entrypoints/cli.tsx`

Key design: **zero static imports** of heavy modules (except `feature` from `bun:bundle`).

```typescript
async function main(): Promise<void> {
  const args = process.argv.slice(2);

  // Fast-path: --version needs no imports
  if (args.length === 1 && (args[0] === '--version' || ...)) {
    console.log(`${MACRO.VERSION} (Claude Code)`);
    return;
  }

  const { profileCheckpoint } = await import('../utils/startupProfiler.js');
  // ... more fast paths with dynamic imports
}
```

### Fast paths (non-exhaustive)

| Args | Handler |
|------|---------|
| `--version` | Inline, no imports |
| `--dump-system-prompt` | `constants/prompts.ts` |
| `--claude-in-chrome-mcp` | Chrome integration |
| `--daemon-worker=<kind>` | `daemon/workerRegistry.ts` |
| `remote-control` / `rc` / `bridge` | `bridge/bridgeMain.ts` |
| `daemon` | Daemon supervisor |
| `ps`, `logs`, `attach`, `kill` | Background sessions |
| `--bg` | Detached session |

---

## `main.tsx`

The bulk of CLI surface area (~785KB). Uses **Commander.js**.

### Responsibilities

1. Define all flags and subcommands (`mcp`, `auth`, `plugin`, `ssh`, `update`, …)
2. `preAction` hook: MDM unlock → `init()` → analytics sinks
3. Default `.action()`: session setup → REPL or print mode

### Key flags

| Flag | Effect |
|------|--------|
| `-p` / `--print` | Headless mode → `cli/print.ts` |
| `--output-format json\|stream-json` | SDK output format |
| `--model` | Override main loop model |
| `--permission-mode` | Set permission mode |
| `--settings` | Inline settings JSON |
| `--bare` / `CLAUDE_CODE_SIMPLE` | Minimal feature set |
| `--worktree` | Git worktree isolation |

### Subcommands (sample)

- `claude mcp` — MCP server management
- `claude auth` — OAuth login
- `claude plugin` — Plugin marketplace
- `claude ssh` — Remote SSH sessions
- `claude update` — Self-update

---

## `setup.ts`

Called once per session before UI or print mode:

- Generate/load `sessionId`
- Set `cwd`, `projectRoot` in `bootstrap/state.ts`
- Worktree setup if `--worktree`
- Trust checks for folder access
- UDS messaging for IDE integration

---

## `entrypoints/init.ts`

Global one-time initialization:

- `enableConfigs()` — load config system
- Telemetry providers (OpenTelemetry)
- OAuth token prefetch
- GrowthBook feature flag client

**Note:** Some env vars must be set in `cli.tsx` before imports (e.g. `ABLATION_BASELINE`) because tools capture them at module load time.

---

## `replLauncher.tsx`

```typescript
export async function launchRepl(options) {
  const { default: App } = await import('../components/App.js');
  const { default: REPL } = await import('../screens/REPL.js');
  // Render Ink app
}
```

Lazy-loads the heavy UI bundle only for interactive mode.

---

## How to Change This Layer

| Goal | Where to edit |
|------|---------------|
| Add a new subcommand | `main.tsx` — `program.command(...)` |
| Add a fast path (skip main) | `entrypoints/cli.tsx` — early return + dynamic import |
| Change startup init order | `entrypoints/init.ts`, `setup.ts` |
| Add a CLI flag | `main.tsx` + wire to `bootstrap/state.ts` or settings |
| New headless behavior | `cli/print.ts` |

---

## Related

- [02-ui-terminal.md](./02-ui-terminal.md) — what happens after `launchRepl()`
- [12-configuration.md](./12-configuration.md) — settings loaded at startup
- [11-bridge-and-remote.md](./11-bridge-and-remote.md) — bridge fast path
