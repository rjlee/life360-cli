#!/usr/bin/env node

import { Command } from 'commander'
import { registerCommands } from './commands/index.js'

const program = new Command()

program
    .name('l360')
    .description('CLI for Life360 location tracking')
    .version('0.1.0')
    .option('--no-spinner', 'Disable loading animations')

registerCommands(program)

program.parse()