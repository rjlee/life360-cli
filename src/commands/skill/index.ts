import { Command } from 'commander'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { homedir } from 'node:os'
import { execSync } from 'node:child_process'
import chalk from 'chalk'

const SKILL_CONTENT = `---
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
5. Find the **POST** request named \`token\`
6. In **Preview** / **Response**, copy the value of \`access_token\`

The token is a long string WITHOUT the word "Bearer" and WITHOUT spaces.

## Quick Reference

- Authentication: \`l360 auth token\`, \`l360 auth status\`, \`l360 auth logout\`
- Circles: \`l360 circle list\`, \`l360 circle view\`
- Members: \`l360 member list\`, \`l360 member locate <name>\`

## Commands

### Authentication
\`\`\`bash
l360 auth token "your-token"   # Save authorization token
l360 auth status              # Show auth state
l360 auth logout             # Clear credentials
\`\`\`

Token can also be set via environment variable:
\`\`\`bash
export LIFE360_AUTHORIZATION="your-token"
\`\`\`

### Circle Commands
\`\`\`bash
l360 circle list              # List all circles
l360 circle view            # View first/default circle
l360 circle view "Family"   # View specific circle by name
\`\`\`

### Member Commands
\`\`\`bash
l360 member list                    # List members in all circles
l360 member list "Family"         # List members in a specific circle
l360 member locate Rob             # Get location for a member
l360 member locate Rob --cache-ttl 60   # Cache for 60 seconds
l360 member locate Rob --no-cache       # Bypass cache
\`\`\`

## Options

\`\`\`bash
l360 --no-spinner   # Disable loading animations
l360 -h, --help     # Display help
\`\`\`

## Errors

- \`No authentication token\` - Set LIFE360_AUTHORIZATION env var or run \`l360 auth token <token>\`
- \`Member not found\` - Check spelling, member names are case-insensitive
- \`Rate limited\` - Life360 is rate-limiting requests, wait and retry
`

interface Agent {
    name: string
    skillPath: string
}

const AGENTS: Agent[] = [
    { name: 'claude-code', skillPath: '.claude/skills/life360-cli' },
    { name: 'universal', skillPath: '.agents/skills/life360-cli' },
    { name: 'opencode', skillPath: '.opencode/skills/life360-cli' },
    { name: 'cursor', skillPath: '.cursor/skills/life360-cli' },
    { name: 'codex', skillPath: '.codex/skills/life360-cli' },
    { name: 'amp', skillPath: '.amp/skills/life360-cli' },
]

export function registerSkillCommand(program: Command): void {
    const skill = program.command('skill').description('Manage agent skills')

    skill.command('install <agent>').description('Install skill for an agent').action(installSkill)

    skill.command('list').description('List available agents').action(listAgents)

    skill.command('uninstall <agent>').description('Remove skill from an agent').action(uninstallSkill)
}

async function installSkill(agent: string) {
    const target = AGENTS.find(a => a.name.toLowerCase() === agent.toLowerCase())
    if (!target) {
        console.log('Unknown agent. Available agents:')
        for (const a of AGENTS) {
            console.log(`  - ${a.name}`)
        }
        return
    }

    const home = homedir()
    const skillDir = join(home, target.skillPath)
    const skillFile = join(skillDir, 'SKILL.md')

    if (!existsSync(skillDir)) {
        mkdirSync(skillDir, { recursive: true })
    }

    writeFileSync(skillFile, SKILL_CONTENT)

    console.log(chalk.green('✓') + ` Installed skill for ${target.name}`)
    console.log(chalk.dim(skillFile))
}

function listAgents() {
    console.log('Available agents:')
    for (const a of AGENTS) {
        console.log(`  - ${a.name}`)
    }
    console.log('\nTo install: l360 skill install <agent>')
}

async function uninstallSkill(agent: string) {
    const target = AGENTS.find(a => a.name.toLowerCase() === agent.toLowerCase())
    if (!target) {
        console.log('Unknown agent:', agent)
        return
    }

    const home = homedir()
    const skillDir = join(home, target.skillPath)

    try {
        execSync(`rm -rf ${skillDir}`)
        console.log(chalk.green('✓') + ` Uninstalled skill for ${target.name}`)
    } catch {
        console.log(chalk.yellow('No skill found for', target.name))
    }
}