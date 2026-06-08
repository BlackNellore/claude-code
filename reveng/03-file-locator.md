# File Locator

> [← Back to Index](./00-index.md)

Use this as a lookup table. Paths are relative to `src/` unless noted.

---

## By Concern

### Entry & Bootstrap

| File | Purpose |
|------|---------|
| `entrypoints/cli.tsx` | Process entry, fast paths |
| `main.tsx` | Commander CLI (785KB) |
| `entrypoints/init.ts` | Global init (config, telemetry) |
| `setup.ts` | Per-session setup |
| `replLauncher.tsx` | Lazy-load REPL |
| `bootstrap/state.ts` | Global session singleton |

### Query & Agent Loop

| File | Purpose |
|------|---------|
| `query.ts` | Main agent loop (`query()`, `queryLoop()`) |
| `QueryEngine.ts` | Headless/SDK API (`submitMessage()`) |
| `query/config.ts` | Immutable query config snapshot |
| `query/deps.ts` | Injectable dependencies for testing |
| `query/stopHooks.ts` | Stop hook orchestration |
| `query/tokenBudget.ts` | Token budget tracking |

### Messages & API

| File | Purpose |
|------|---------|
| `utils/messages.ts` | Message CRUD, normalization (~5.5K lines) |
| `types/message.ts` | **MISSING** — message union types |
| `services/api/claude.ts` | Anthropic API client |
| `services/api/errors.ts` | API error types |
| `services/api/withRetry.ts` | Retry/fallback logic |
| `utils/api.ts` | userContext/systemContext helpers |

### Input Processing

| File | Purpose |
|------|---------|
| `utils/processUserInput/processUserInput.ts` | Main input router |
| `utils/processUserInput/processTextPrompt.ts` | Plain text handling |
| `utils/handlePromptSubmit.ts` | REPL submit orchestration |
| `commands.ts` | Slash command registry |
| `utils/slashCommandParsing.ts` | `/command` parsing |

### UI

| File | Purpose |
|------|---------|
| `screens/REPL.tsx` | Main interactive screen |
| `components/` | Message rendering, dialogs, permissions |
| `ink/` | Custom terminal renderer |
| `ink.ts` | Ink entry re-exports |
| `interactiveHelpers.tsx` | Trust screens, render helpers |

### Tools

| File | Purpose |
|------|---------|
| `Tool.ts` | Tool interface, ToolUseContext |
| `tools.ts` | Tool registry, `getTools()` |
| `tools/BashTool/` | Shell execution |
| `tools/FileReadTool/` | File reading |
| `tools/FileEditTool/` | File editing |
| `tools/FileWriteTool/` | File writing |
| `tools/GrepTool/` | Ripgrep search |
| `tools/GlobTool/` | File globbing |
| `tools/AgentTool/` | Sub-agent spawning |
| `tools/SkillTool/` | Skill invocation |
| `services/tools/toolOrchestration.ts` | Concurrent/serial execution |
| `services/tools/toolExecution.ts` | Single tool run |
| `services/tools/StreamingToolExecutor.ts` | Streaming tool results |

### Permissions

| File | Purpose |
|------|---------|
| `hooks/useCanUseTool.tsx` | Permission gate hook |
| `types/permissions.ts` | Permission types |
| `utils/permissions/` | Rules, classifiers, bash classifier |
| `components/permissions/` | Permission UI dialogs |

### MCP

| File | Purpose |
|------|---------|
| `services/mcp/client.ts` | MCP client (~3.3K lines) |
| `services/mcp/types.ts` | MCP types |
| `tools/MCPTool/` | MCP tool proxy |
| `entrypoints/mcp.ts` | MCP server entry |

### Memory

| File | Purpose |
|------|---------|
| `memdir/memdir.ts` | Auto-memory system |
| `memdir/paths.ts` | MEMORY.md paths |
| `services/autoDream/autoDream.ts` | Dream consolidation |
| `services/extractMemories/` | Memory extraction |
| `utils/attachments.ts` | Attachment injection |

### Configuration

| File | Purpose |
|------|---------|
| `utils/config.ts` | Project/global config |
| `utils/settings/settings.ts` | Settings merge logic |
| `utils/settings/types.js` | Settings schema |
| `constants/prompts.ts` | System prompt assembly |

### Multi-Agent

| File | Purpose |
|------|---------|
| `coordinator/coordinatorMode.ts` | Coordinator mode |
| `utils/swarm/` | Teammate layout, permissions |
| `tools/AgentTool/` | Agent definitions, built-ins |
| `tasks/InProcessTeammateTask/` | In-process teammates |

### Remote & Bridge

| File | Purpose |
|------|---------|
| `bridge/bridgeMain.ts` | Remote Control entry |
| `bridge/bridgeConfig.ts` | Bridge configuration |
| `cli/print.ts` | Headless mode (~5.6K lines) |
| `remote/` | SDK remote adapters |

### Headless / SDK

| File | Purpose |
|------|---------|
| `cli/print.ts` | Print mode implementation |
| `entrypoints/agentSdkTypes.ts` | Public SDK types |
| `entrypoints/sdk/coreSchemas.ts` | Zod schemas |

### Analytics & Feature Flags

| File | Purpose |
|------|---------|
| `services/analytics/` | Event logging, Datadog |
| `services/analytics/growthbook.js` | Runtime feature gates |

### Special Systems

| File | Purpose |
|------|---------|
| `buddy/companion.ts` | Tamagotchi companion |
| `utils/undercover.ts` | Undercover mode (hide internals) |
| `services/autoDream/` | Background memory dreams |
| `keybindings/` | Keyboard shortcuts |
| `vim/` | Vim mode in prompt |

---

## By Directory

| Directory | File count (approx) | Role |
|-----------|---------------------|------|
| `tools/` | 43 packages | Agent tools |
| `commands/` | ~100 subdirs | Slash commands |
| `components/` | 100+ | UI components |
| `utils/` | ~331 | Shared utilities |
| `services/` | 50+ | Backend services |
| `hooks/` | 40+ | React hooks |
| `ink/` | 30+ | Terminal renderer |

---

## Search Tips

| Looking for… | Grep pattern / location |
|--------------|-------------------------|
| Tool definition | `src/tools/*/prompt.ts` or `*Tool.ts` |
| Slash command | `src/commands/<name>/` |
| Permission rule | `utils/permissions/` |
| Feature flag | `feature('FLAG_NAME')` |
| Analytics event | `logEvent('tengu_` |
| System prompt section | `constants/prompts.ts` |
| Hook event | `utils/hooks/` |
| Settings key | `utils/settings/types.js` |

---

## Related Docs

- [00-index.md](./00-index.md) — navigation hub
- [layers/](./layers/) — per-layer deep dives
