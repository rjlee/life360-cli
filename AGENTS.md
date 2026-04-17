# Life360 CLI

TypeScript CLI for Life360. Binary name: `l360`.

## Build & Run

```bash
npm run build       # compile TypeScript (uses tsconfig.build.json, excludes tests)
npm run dev         # watch mode (uses tsconfig.build.json)
npm run type-check  # type check source + tests (uses tsconfig.json)
npm test            # run tests
```

**Run the CLI directly** (no linking needed):

```bash
node dist/index.js --help              # show commands
node dist/index.js circle list         # run 'circle list' command
node dist/index.js member locate Rob   # locate member
```

Use this to verify changes work before committing.

## Architecture

```
src/
  index.ts              # entry point, registers all commands
  commands/             # command groups
    auth/               # l360 auth <token|status|logout>
    circle/             # l360 circle <list|view>
    member/             # l360 member <list|locate>
    place/              # l360 place <list> (not yet supported)
  lib/
    api/
      core.ts           # HTTP client with Android TLS ciphers
      types.ts          # TypeScript interfaces
    auth.ts             # token loading/saving (env var or config)
    config.ts           # config file (~/.config/life360-cli/)
    errors.ts           # CliError class
    output.ts           # formatting utilities
    refs.ts             # reference resolution
    spinner.ts          # loading spinner
    secure-store.ts     # Linux keyring (secret-tool)
```

## Key Patterns

- **HTTPS Client**: Uses `node:https` with Android TLS cipher order to bypass Cloudflare blocking. This is critical - without the correct cipher order, requests get HTTP 403.
- **Caching**: 
  - Session cache (3600s TTL) for circles and members
  - Location cache (default 30s TTL) - configurable via `--cache-ttl`
- **Rate Limiting**: On HTTP 429, wait 60s and retry (up to 5 times)
- **Authentication**: Token from `LIFE360_AUTHORIZATION` env var takes priority, then config file

## Auth

Token from `LIFE360_AUTHORIZATION` env var or `~/.config/life360-cli/config.json`:

```json
{ "authorization": "your-token", "token_type": "Bearer" }
```

Get token from Life360 app: Settings → Account → Authorization Token

## Member Location

Member names are matched case-insensitively. The CLI searches all circles for a member with matching firstName or name. Location data includes:
- latitude, longitude, accuracy
- battery level
- timestamp (last seen)
- cached flag

## JSON Output

Commands support JSON output for scripting. Check `l360 <command> --help` for available flags.

## Testing

Tests use vitest. Run `npm test` before committing.

- Mock API responses where appropriate
- Test command parsing and output formatting
- Test caching behavior