import { Command } from 'commander'
import { getApiClient } from '../../lib/api/core.js'
import { initApiClient } from '../../lib/auth.js'
import { formatMembersList, formatLocation } from '../../lib/output.js'
import { wrapApiError } from '../../lib/errors.js'
import { startSpinner, succeedSpinner, failSpinner } from '../../lib/spinner.js'
import { resolveCircleRef } from '../../lib/refs.js'

export function registerMemberCommand(program: Command): void {
    const member = program.command('member').description('Manage members')

    member
        .command('list [circle]')
        .description('List members in a circle')
        .option('--show-location', 'Show member locations')
        .action(listMembers)

    member
        .command('locate <name>')
        .description('Get current location for a member')
        .option('--cache-ttl <seconds>', 'Cache TTL (default: 30)')
        .option('--no-cache', 'Disable caching')
        .action(locate)
}

async function listMembers(args: any, options: any) {
    try {
        await initApiClient()
        const api = getApiClient()
        startSpinner('Loading members...')

        const circleArg = args || options?.circle
        const circles = circleArg
            ? [await resolveCircleRef(circleArg)]
            : await api.getCircles()

        for (const circle of circles) {
            const members = await api.getMembers(circle.id)
            succeedSpinner()
            console.log('\nCircle: ' + circle.name)
            console.log(formatMembersList(members, options?.showLocation))
        }
    } catch (err) {
        failSpinner()
        const cliErr = wrapApiError(err)
        console.error(cliErr.message)
        process.exit(1)
    }
}

async function locate(args: string, options: any) {
    try {
        await initApiClient()
        const api = getApiClient()
        startSpinner('Locating member...')

        const name = args || options?.name
        const ttl = options?.cacheTtl ? parseInt(options.cacheTtl, 10) : 30
        const force = options?.cache === false

        const location = await api.locate(name, { forceFresh: force, ttl })
        succeedSpinner()
        console.log(formatLocation(location, name))
    } catch (err) {
        failSpinner()
        const cliErr = wrapApiError(err)
        console.error(cliErr.message)
        process.exit(1)
    }
}