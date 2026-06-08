# Layer 10: Multi-Agent

> [← Index](../00-index.md) | Prev: [Memory](./09-memory-and-dreams.md) | Next: [Bridge](./11-bridge-and-remote.md)

---

## Purpose

Spawn sub-agents, coordinate teams, and run swarm-style multi-agent workflows.

---

## AgentTool (`tools/AgentTool/`)

The primary mechanism for sub-agents:

```typescript
// Model calls:
{ "name": "Agent", "input": {
  "description": "Explore the auth module",
  "prompt": "Find all auth-related files and summarize",
  "subagent_type": "explore"
}}
```

### Built-in agents

| Agent | File | Purpose |
|-------|------|---------|
| `explore` | `built-in/exploreAgent.ts` | Fast codebase exploration |
| `plan` | `built-in/planAgent.ts` | Planning without edits |

### Custom agents

Loaded from `.claude/agents/*.md` via `loadAgentsDir.ts`.

Each agent has: name, description, tools list, model, system prompt.

---

## Sub-Agent Execution

AgentTool spawns an **isolated query loop**:
- Separate message history (or forked)
- Restricted tool set per agent definition
- Results returned as tool output to parent

`agentMemory.ts` — optional memory for agents.

---

## Coordinator Mode (`coordinator/`)

Feature-gated swarm coordinator:
- `coordinatorMode.ts` — filter tools, coordinator context
- Coordinates multiple teammates on shared tasks

---

## Swarm / Teammates (`utils/swarm/`)

| Module | Purpose |
|--------|---------|
| `teammateLayoutManager.ts` | Terminal layout for teammates |
| `teammatePromptAddendum.ts` | Extra prompts for teammates |
| `permissionSync.ts` | Sync permissions across team |
| `backends/TmuxBackend.ts` | Tmux-based teammate processes |

---

## Team Tools

| Tool | Purpose |
|------|---------|
| `TeamCreateTool` | Create agent team |
| `TeamDeleteTool` | Remove team |
| `SendMessageTool` | Inter-agent messaging |

---

## Background Sessions (`tasks/`)

| Task | Purpose |
|------|---------|
| `InProcessTeammateTask` | Run teammate in-process |
| Dream tasks | Background memory consolidation |
| BG sessions | Detached query loops (`--bg`) |

---

## Task Tools

`TaskCreateTool`, `TaskGetTool`, `TaskUpdateTool`, `TaskListTool`, `TaskOutputTool`, `TaskStopTool` — structured task management for long-running work.

---

## How to Change This Layer

| Goal | Where |
|------|-------|
| New built-in agent | `tools/AgentTool/built-in/` |
| Custom agent format | `loadAgentsDir.ts` |
| Coordinator behavior | `coordinator/coordinatorMode.ts` |
| Teammate UI | `utils/swarm/`, `components/Spinner/TeammateSpinnerLine.tsx` |

---

## Related

- [06-tools.md](./06-tools.md) — AgentTool details
- [04-query-engine.md](./04-query-engine.md) — nested query loops
