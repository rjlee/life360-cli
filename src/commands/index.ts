import { Command } from 'commander'
import { registerAuthCommand } from './auth/index.js'
import { registerCircleCommand } from './circle/index.js'
import { registerMemberCommand } from './member/index.js'
import { registerPlaceCommand } from './place/index.js'

export function registerCommands(program: Command): void {
    registerAuthCommand(program)
    registerCircleCommand(program)
    registerMemberCommand(program)
    registerPlaceCommand(program)
}