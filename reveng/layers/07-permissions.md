# Layer 7: Permissions

> [← Index](../00-index.md) | Prev: [Tools](./06-tools.md) | Next: [MCP](./08-mcp.md)

---

## Purpose

Control which tools and operations Claude can execute without explicit user approval.

---

## Permission Modes

| Mode | Behavior |
|------|----------|
| `default` | Ask for dangerous operations |
| `acceptEdits` | Auto-accept file edits |
| `plan` | Read-only; must exit plan mode to edit |
| `dontAsk` | Auto-deny asks |
| `bypassPermissions` | Allow all (dangerous) |
| `auto` | ML classifier decides |
| `bubble` | Special UI mode |

Set via CLI `--permission-mode`, settings, or `/permission` command.

---

## Core Types (`types/permissions.ts`)

```typescript
type PermissionResult =
  | { behavior: 'allow'; updatedInput?: … }
  | { behavior: 'deny'; message: string }
  | { behavior: 'ask'; message?: string };

type PermissionRule = {
  tool?: string;
  pattern?: string;  // regex for bash paths etc.
  mode: 'allow' | 'deny' | 'ask';
};
```

---

## Permission Gate

**`hooks/useCanUseTool.tsx`** exports `canUseTool`:

```
canUseTool(tool, input, context)
  1. Check session permission mode
  2. Match allow/deny/ask rules (by source: user, project, local, …)
  3. Run PreToolUse hooks
  4. Tool-specific checkPermissions()
  5. Bash classifier (for BashTool)
  6. Return allow | deny | ask
```

### On `ask` (interactive)
REPL renders permission dialog. User choices:
- Allow once
- Allow always (add rule)
- Deny

### On `deny`
Synthetic `tool_result` with `REJECT_MESSAGE` or custom reason.

---

## Rule Sources (precedence)

Rules merge from multiple sources in `ToolPermissionRulesBySource`:
- Managed / MDM
- Project settings
- Local settings
- Session overrides

`utils/permissions/PermissionRule.ts` — rule matching logic.

---

## Bash Classifier

`utils/permissions/bashClassifier.ts` — classifies shell commands:
- Safe read commands → auto-allow
- Destructive patterns → ask
- Used in `auto` permission mode

---

## Plan Mode

`EnterPlanModeTool` / `ExitPlanModeV2Tool`:
- In plan mode, write tools are blocked
- Model must call `ExitPlanMode` with a plan for approval

---

## Denial Tracking

`utils/permissions/denialTracking.ts` — tracks repeated denials to adjust behavior / show guidance.

---

## How to Change This Layer

| Goal | Where |
|------|-------|
| New permission mode | `types/permissions.ts` + `useCanUseTool` |
| Default rules | Settings schema, `utils/permissions/` |
| Bash patterns | `bashClassifier.ts`, `utils/bash/specs/` |
| Permission UI | `components/permissions/` |

---

## Related

- [06-tools.md](./06-tools.md) — tools call `canUseTool`
- [topics/hooks.md](../topics/hooks.md) — PreToolUse hooks
- [12-configuration.md](./12-configuration.md) — permission settings
