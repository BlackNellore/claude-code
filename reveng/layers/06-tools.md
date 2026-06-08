# Layer 6: Tools

> [← Index](../00-index.md) | Prev: [API Client](./05-api-client.md) | Next: [Permissions](./07-permissions.md)

---

## Purpose

Define, register, and execute the capabilities Claude can invoke via `tool_use` blocks.

---

## Tool Interface (`Tool.ts`)

```typescript
type Tool<Input, Output> = {
  name: string;
  inputSchema: z.ZodType<Input>;      // Zod validation
  call(input: Input, context: ToolUseContext): Promise<Output>;
  checkPermissions?(…): PermissionResult;
  isConcurrencySafe(context): boolean;  // parallel execution?
  isReadOnly(context): boolean;
  prompt(): string;                    // tool description for API
  // optional: render, check, validateInput, etc.
}
```

---

## ToolUseContext

Runtime context passed to every tool call:

| Field | Purpose |
|-------|---------|
| `options.tools` | Available tools |
| `options.mcpClients` | MCP connections |
| `abortController` | Cancellation |
| `readFileState` | File cache |
| `appState` | React state (interactive) |
| `setToolJSX` | Inline UI rendering |
| `agentId` | Sub-agent identity |

---

## Registry (`tools.ts`)

```typescript
export const getTools = (permissionContext): Tools => {
  // Assemble base tools + feature-gated tools
  // Filter by deny rules
};

export function getAllBaseTools(): Tools { … }
export function assembleToolPool(…): Tools { … }
```

### Always-present tools (sample)

| Tool | Package |
|------|---------|
| Read | `FileReadTool/` |
| Write | `FileWriteTool/` |
| Edit | `FileEditTool/` |
| Bash | `BashTool/` |
| Grep | `GrepTool/` |
| Glob | `GlobTool/` |
| Agent | `AgentTool/` |
| Skill | `SkillTool/` |
| WebFetch | `WebFetchTool/` |
| WebSearch | `WebSearchTool/` |
| Task* | `TaskCreateTool/`, etc. |
| EnterPlanMode / ExitPlanMode | Plan mode tools |

### Feature-gated tools

`SleepTool`, `REPLTool`, `WebBrowserTool`, `MonitorTool`, `SnipTool`, `WorkflowTool`, …

---

## Execution (`services/tools/toolOrchestration.ts`)

```typescript
export async function* runTools(
  toolUseMessages: ToolUseBlock[],
  assistantMessages: AssistantMessage[],
  canUseTool: CanUseToolFn,
  toolUseContext: ToolUseContext,
): AsyncGenerator<MessageUpdate>
```

### Concurrency model

1. `partitionToolCalls()` — group by `isConcurrencySafe()`
2. **Safe (read-only):** run up to `CLAUDE_CODE_MAX_TOOL_USE_CONCURRENCY` (default 10) in parallel
3. **Unsafe (write/bash):** run serially
4. Context modifiers applied after each batch

---

## Tool Call Lifecycle

```
tool_use block from API
  → findToolByName(name)
  → Zod parse input
  → canUseTool(tool, input) → allow/deny/ask
  → tool.call(input, context)
  → serialize output to string
  → create UserMessage with tool_result
  → yield to query loop
```

`runToolUse()` in `toolExecution.ts` handles a single tool.

---

## Notable Tools

### BashTool
- Shell execution with sandboxing
- Permission classifier for command patterns
- Progress streaming for long commands

### AgentTool
- Spawns sub-agent with isolated query loop
- Built-in agents: `explore`, `plan`
- Custom agents from `.claude/agents/`

### SkillTool
- Invokes slash-command skills as tools
- Used when model calls skills programmatically

### MCPTool
- Proxies tools from MCP servers
- See [08-mcp.md](./08-mcp.md)

---

## Adding a New Tool

1. Create `src/tools/MyTool/MyTool.ts`
2. Implement `Tool` interface with Zod schema
3. Add `prompt.ts` with tool name constant
4. Register in `tools.ts` → `getAllBaseTools()` or feature-gated section
5. Add permission rules if needed

---

## Related

- [07-permissions.md](./07-permissions.md) — gating tool execution
- [08-mcp.md](./08-mcp.md) — external tools
- [10-multi-agent.md](./10-multi-agent.md) — AgentTool
