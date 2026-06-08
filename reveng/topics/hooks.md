# Topic: Hooks

> [← Index](../00-index.md)

---

## Purpose

User-defined scripts that intercept lifecycle events — block, modify, or augment behavior.

---

## Hook Events

Defined in `entrypoints/agentSdkTypes.ts` and `types/hooks.ts`:

| Event | When fired |
|-------|------------|
| `SessionStart` | Session begins |
| `UserPromptSubmit` | Before prompt processed |
| `PreToolUse` | Before tool executes |
| `PostToolUse` | After tool completes |
| `PostSampling` | After API response |
| `Stop` | Model wants to stop |
| `PreCompact` | Before compaction |
| `SessionEnd` | Session ends |
| `Notification` | Various notifications |

---

## Configuration

In `.claude/settings.json`:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [{ "type": "command", "command": ".claude/hooks/block-rm.sh" }]
      }
    ]
  }
}
```

---

## Execution Flow

### UserPromptSubmit

`utils/hooks.ts` → `executeUserPromptSubmitHooks()`:
- Runs before `processUserInput` creates messages
- Can block with `getUserPromptSubmitHookBlockingMessage()`
- Can inject hook output as attachments

### PreToolUse

Called from `useCanUseTool` before permission decision:
- Can deny tool use
- Can modify tool input

### PostToolUse

After `tool.call()` returns — can modify results or trigger side effects.

### Stop

`query/stopHooks.ts` → `handleStopHooks()`:
- Model stopped without tool calls
- Hook can return "continue" to keep going

---

## Hook Input/Output

Hooks receive JSON on stdin with event-specific payload (session ID, tool name, input, etc.).

Exit codes and stdout determine behavior:
- Exit 0 + stdout → may inject context
- Exit 2 → block/deny (convention)

---

## Plugin Hooks

Plugins can register native hooks via `PluginHookMatcher` — see `bootstrap/state.ts` registered hooks.

---

## Related

- [layers/03-input-processing.md](../layers/03-input-processing.md) — UserPromptSubmit
- [layers/07-permissions.md](../layers/07-permissions.md) — PreToolUse
- [topics/extension-points.md](./extension-points.md)
