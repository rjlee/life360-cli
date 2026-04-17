export type ErrorCode =
    | 'AUTH_ERROR'
    | 'NO_TOKEN'
    | 'INVALID_TOKEN'
    | 'CIRCLE_NOT_FOUND'
    | 'MEMBER_NOT_FOUND'
    | 'RATE_LIMITED'
    | 'API_ERROR'
    | 'NETWORK_ERROR'

export class CliError extends Error {
    readonly code: ErrorCode
    readonly hints?: string[]

    constructor(code: ErrorCode, message: string, hints?: string[]) {
        super(message)
        this.name = 'CliError'
        this.code = code
        this.hints = hints
    }
}

export function formatError(error: unknown): string {
    if (error instanceof CliError) {
        let output = error.message
        if (error.hints?.length) {
            output += '\n' + error.hints.map(h => `  - ${h}`).join('\n')
        }
        return output
    }
    if (error instanceof Error) {
        return error.message
    }
    return String(error)
}

export function wrapApiError(error: unknown): CliError {
    const msg = error instanceof Error ? error.message : String(error)

    if (msg.includes('401') || msg.includes('Unauthorized')) {
        return new CliError(
            'AUTH_ERROR',
            'Authentication failed. Check your token',
            ['Run: l360 auth status']
        )
    }

    if (msg.includes('429') || msg.includes('Rate limited')) {
        return new CliError('RATE_LIMITED', 'Life360 API rate limit exceeded', [
            'Wait 60 seconds and retry',
        ])
    }

    if (msg.includes('Member') && msg.includes('not found')) {
        return new CliError('MEMBER_NOT_FOUND', msg, [
            'Run: l360 member list to see available members',
        ])
    }

    if (msg.includes('Circle') && msg.includes('not found')) {
        return new CliError('CIRCLE_NOT_FOUND', msg, [
            'Run: l360 circle list to see available circles',
        ])
    }

    return new CliError('API_ERROR', msg, ['Check: l360 auth status'])
}