# Life360 CLI

A command-line interface for Life360 location tracking.

## Installation

### From npm (recommended)

```bash
npm install -g life360-cli
```

### Local Setup

```bash
git clone https://github.com/rjlee/life360-cli.git
cd life360-cli
npm install
npm run build
npm link
```

This makes the `l360` command available globally.

## Getting an Authorization Token

Life360 requires an authorization token. Get one manually:

1. Open [https://life360.com/login](https://life360.com/login) in your browser
2. Enter your email address and click **Continue**
3. Enter the one-time code sent to your email
4. Open browser DevTools (**F12**) and switch to the **Network** tab
5. Find the **POST** request named `token`
6. In **Preview** / **Response**, copy the value of `access_token`

The token is a long string WITHOUT the word "Bearer" and WITHOUT spaces.

**Note:** Tokens are long-lived (typically months). When expired, you'll get an authentication error — repeat the steps above to get a new token.

## Setup

### Authentication

**Method 1: Environment Variable** (Recommended)

```bash
export LIFE360_AUTHORIZATION="your-token"
```

**Method 2: Save Token**

```bash
l360 auth token "your-token"
```

To check if authenticated:

```bash
l360 auth status
```

To clear credentials:

```bash
l360 auth logout
```

## Usage

### Circles

```bash
l360 circle list        # list all circles
l360 circle view      # view first circle (default)
l360 circle view "Family"  # view specific circle
```

### Members

```bash
l360 member list              # list members in all circles
l360 member list "Family"   # list members in a specific circle
l360 member locate Rob    # get location for a member
```

### Caching

Life360 has aggressive rate limiting. The CLI caches results:

```bash
l360 member locate Rob --cache-ttl 60  # cache for 60 seconds
l360 member locate Rob --no-cache # bypass cache
l360 circle list --refresh         # force refresh
```

## Options

| Option | Description |
|--------|-------------|
| `--no-spinner` | Disable loading animations |
| `-h, --help` | Display help |

## Development

```bash
npm install         # install dependencies
npm run build       # compile TypeScript
npm run dev         # watch mode
npm run type-check  # type check
npm test            # run tests
```

## License

MIT