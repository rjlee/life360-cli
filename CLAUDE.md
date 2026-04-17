# Life360 CLI

TypeScript CLI for Life360 location tracking. Binary name: `l360`.

## Build & Run

```bash
npm run build       # compile TypeScript
npm run dev         # watch mode
npm run type-check  # type check
npm test            # run tests
```

**Run the CLI directly:**

```bash
node dist/index.js --help           # show commands
node dist/index.js circle list       # list circles
node dist/index.js member locate Rob  # locate member
```

## Architecture

```
src/
  index.ts              # entry point, registers commands
  commands/
    auth/             # l360 auth <token|status|logout>
    circle/           # l360 circle <list|view>
    member/           # l360 member <list|locate>
    place/            # l360 place <list> (not supported yet)
  lib/
    api/
      core.ts         # HTTP client with Android TLS ciphers, caching
      types.ts        # TypeScript interfaces
    auth.ts           # token loading/saving (env var or config)
    config.ts        # config file (~/.config/life360-cli/)
    errors.ts        # CliError class
    output.ts       # formatting utilities
    refs.ts         # reference resolution
    spinner.ts      # loading spinner
    secure-store.ts  # Linux keyring (secret-tool)
```

## Key Patterns

- **HTTPS Client**: Uses `node:https` with Android TLS cipher order to avoid Cloudflare blocking
- **Caching**: In-memory session cache for circles/members (3600s), TTL-based for locations (default 30s)
- **Rate Limiting**: On HTTP 429, wait 60s and retry (up to 5 times)
- **Authentication**: Token from `LIFE360_AUTHORIZATION` env var or config file

## Commands

### Authentication
```bash
l360 auth token <token>   # Save authorization token
l360 auth status         # Show auth state
l360 auth logout         # Clear credentials
```

### Circles
```bash
l360 circle list         # List all circles
l360 circle view         # View first/default circle
l360 circle view "Family" # View specific circle by name
```

### Members
```bash
l360 member list               # List members in all circles
l360 member list "Family"    # List members in a specific circle
l360 member locate Rob       # Get location for a member
l360 member locate Rob --cache-ttl 60  # Cache for 60 seconds
l360 member locate Rob --no-cache     # Bypass cache
```

### Options
```bash
l360 --no-spinner   # Disable loading animations
```

## Testing

Tests use vitest. Run `npm test` before committing.

## Auth Token

Get from Life360 app: Settings → Account → Authorization Token

Or set environment variable:
```bash
export LIFE360_AUTHORIZATION="your-token"
```