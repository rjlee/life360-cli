import { Command } from 'commander'
import { getApiClient } from '../../lib/api/core.js'
import { initApiClient } from '../../lib/auth.js'
import { formatCirclesList } from '../../lib/output.js'
import { wrapApiError } from '../../lib/errors.js'
import { startSpinner, succeedSpinner, failSpinner } from '../../lib/spinner.js'

export function registerCircleCommand(program: Command): void {
    const circle = program.command('circle').description('Manage circles')

    circle.command('list').description('List all circles').action(listCircles)

    circle.command('view [name]').description('View circle details').action(viewCircle)
}

async function listCircles() {
    try {
        await initApiClient()
        const api = getApiClient()
        startSpinner('Loading circles...')

        const circles = await api.getCircles()
        succeedSpinner()
        console.log(formatCirclesList(circles))
    } catch (err) {
        failSpinner()
        const cliErr = wrapApiError(err)
        console.error(cliErr.message)
        process.exit(1)
    }
}

async function viewCircle(name?: string) {
    try {
        await initApiClient()
        const api = getApiClient()
        startSpinner('Loading circle...')

        const circles = await api.getCircles()
        const circle = name
            ? circles.find(c => c.name.toLowerCase() === name.toLowerCase()) ?? circles[0]
            : circles[0]

        if (!circle) {
            failSpinner()
            console.error('Circle not found')
            process.exit(1)
        }

        succeedSpinner()
        console.log('Circle: ' + circle.name)
        console.log('  ID: ' + circle.id)
        if (circle.createdAt) {
            console.log('  Created: ' + circle.createdAt)
        }
    } catch (err) {
        failSpinner()
        const cliErr = wrapApiError(err)
        console.error(cliErr.message)
        process.exit(1)
    }
}