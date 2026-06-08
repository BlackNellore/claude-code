# Layer 12: Configuration

> [← Index](../00-index.md) | Prev: [Bridge](./11-bridge-and-remote.md)

---

## Purpose

Merge settings from multiple sources into effective runtime configuration.

---

## Settings Layers (lowest → highest precedence)

```
1. Managed / MDM        managed-settings.json, registry, plist
2. Policy settings      remote policy
3. User                 ~/.claude/settings.json
4. Project              .claude/settings.json
5. Local                .claude/settings.local.json
6. CLI flags            --settings, --permission-mode, --model
7. Session overrides    mid-session commands
```

**Primary file:** `utils/settings/settings.ts`

---

## Settings Schema

`utils/settings/types.js` — defines keys:
- `model`, `permissionMode`, `mcpServers`
- `hooks`, `allowedTools`, `deniedTools`
- `autoMemory`, `thinking`, `theme`
- And many more

Generated types: `settingsTypes.generated.js` (missing from leak).

---

## Config System

`utils/config.ts` — project-level config:
- `CLAUDE.md` discovery
- Project trust
- Working directories
- `enableConfigs()` — activates config loading

---

## Environment Variables (sample)

| Variable | Effect |
|----------|--------|
| `CLAUDE_CODE_SIMPLE` | Bare/minimal mode |
| `CLAUDE_CODE_ENTRYPOINT` | Client type identifier |
| `CLAUDE_CODE_REMOTE` | Remote container mode |
| `USER_TYPE=ant` | Internal Anthropic features |
| `CLAUDE_CODE_DISABLE_AUTO_MEMORY` | Disable memory |
| `CLAUDE_CODE_MAX_TOOL_USE_CONCURRENCY` | Tool parallelism |
| `DISABLE_COMPACT` / `DISABLE_AUTO_COMPACT` | Compaction control |

---

## Feature Flags

### Compile-time (`feature()` from `bun:bundle`)

Strips code from builds: `BRIDGE_MODE`, `COORDINATOR_MODE`, `KAIROS`, `BG_SESSIONS`, …

### Runtime (GrowthBook)

`services/analytics/growthbook.js` — `getFeatureValue_CACHED_MAY_BE_STALE()`, `checkStatsigFeatureGate_CACHED_MAY_BE_STALE()`

---

## System Prompt

`constants/prompts.ts` — `getSystemPrompt()` assembles:
- Base instructions
- Tool descriptions
- Memory/buddy/undercover sections
- Output style
- Project CLAUDE.md content

---

## MDM / Enterprise

`utils/settings/mdm/` — managed device settings:
- macOS plist, Windows registry
- Keychain integration for secrets

---

## How to Change This Layer

| Goal | Where |
|------|-------|
| New setting key | `utils/settings/types.js` + consumers |
| Precedence logic | `utils/settings/settings.ts` |
| New env var | Document + read in relevant module |
| System prompt section | `constants/prompts.ts` |

---

## Related

- [topics/extension-points.md](../topics/extension-points.md)
- [07-permissions.md](./07-permissions.md) — permission settings
