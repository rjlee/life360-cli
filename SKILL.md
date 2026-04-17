---
name: life360-cli
description: "Track family member locations via Life360 using the l360 CLI"
---

# Life360 CLI

Use this skill when the user wants to track family member locations using Life360.

## Getting an Authorization Token

Life360 requires an authorization token:

1. Open [https://life360.com/login](https://life360.com/login) in your browser
2. Enter your email address and click **Continue**
3. Enter the one-time code sent to your email
4. Open browser DevTools (**F12**) and switch to the **Network** tab
5. Find the **POST** request named `token`
6. In **Preview** / **Response**, copy the value of `access_token`

The token is a long string WITHOUT the word "Bearer" and WITHOUT spaces.

## Quick Reference

- Authentication: `l360 auth token`, `l360 auth status`, `l360 auth logout`
- Circles: `l360 circle list`, `l360 circle view`
- Members: `l360 member list`, `l360 member locate <name>`

## Authentication Commands

```bash
l360 auth token "your-token"   # Save authorization token
l360 auth status              # Show auth state
l360 auth logout             # Clear credentials
```

Token can also be set via environment variable:
```bash
export LIFE360_AUTHORIZATION="your-token"
```

## Circle Commands

```bash
l360 circle list              # List all circles
l360 circle view            # View first/default circle
l360 circle view "Family"   # View specific circle by name
```

## Member Commands

```bash
l360 member list                    # List members in all circles
l360 member list "Family"           # List members in a specific circle
l360 member locate Rob              # Get location for a member
l360 member locate Rob --cache-ttl 60   # Cache for 60 seconds
l360 member locate Rob --no-cache       # Bypass cache
```

## Member Location Data

When you locate a member, you get:
- `latitude` / `longitude` - GPS coordinates
- `accuracy` - Location accuracy in meters
- `battery` - Battery level (if available)
- `timestamp` - Last seen timestamp

## Common Tasks

### Check if authenticated
```bash
l360 auth status
```

### List all family members
```bash
l360 member list
```

### Get someone's location
```bash
l360 member locate Rob
l360 member locate "Robert"
```

### Get location with fresh data (bypass cache)
```bash
l360 member locate Rob --no-cache
```

## Options

```bash
l360 --no-spinner   # Disable loading animations
l360 -h, --help     # Display help
```

## Errors

- `No authentication token` - Set LIFE360_AUTHORIZATION env var or run `l360 auth token <token>`
- `Member not found` - Check spelling, member names are case-insensitive
- `Rate limited` - Life360 is rate-limiting requests, wait and retry