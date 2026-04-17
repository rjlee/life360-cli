import { Command } from 'commander'

export function registerPlaceCommand(program: Command): void {
    const place = program.command('place').description('Manage places')

    place.command('list').description('List saved places').action(listPlaces)
}

async function listPlaces() {
    console.log('Places API not yet supported by Life360')
    console.log('This feature requires a places/locations API endpoint')
}