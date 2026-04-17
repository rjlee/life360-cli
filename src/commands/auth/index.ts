import { Command } from 'commander'
import { getAuthStatus, saveAuthToken, clearAuthToken } from '../../lib/auth.js'
import { isSecureStorageAvailable } from '../../lib/secure-store.js'

export function registerAuthCommand(program: Command): void {
    const auth = program.command('auth').description('Manage authentication')

    auth.command('status').description('Show current auth status').action(status)

    auth
        .command('token <token>')
        .description('Save authorization token')
        .option('--token-type <type>', 'Token type', 'Bearer')
        .action(token)

    auth.command('logout').description('Clear stored credentials').action(logout)
}

async function status() {
    const status = await getAuthStatus()
    const secureAvailable = await isSecureStorageAvailable()

    if (status.source === 'none') {
        console.log('Not authenticated')
        console.log('  Set token: l360 auth token <token>')
        console.log('  Or set: LIFE360_AUTHORIZATION env var')
        return
    }

    const sourceLabels: Record<string, string> = {
        env: 'environment variable (LIFE360_AUTHORIZATION)',
        'secure-store': 'secure storage',
        'config-file': 'config file',
    }

    console.log('Authenticated')
    console.log(`  Source: ${sourceLabels[status.source]}`)
    console.log(`  Token type: ${status.tokenType ?? 'Bearer'}`)
    console.log(`  Secure storage available: ${secureAvailable ? 'yes' : 'no'}`)
}

async function token(token: string, options: { tokenType?: string }) {
    await saveAuthToken(token, { tokenType: options.tokenType })
    console.log(`Token saved${options.tokenType ? ` (${options.tokenType})` : ''}`)
}

async function logout() {
    await clearAuthToken()
    console.log('Credentials cleared')
}