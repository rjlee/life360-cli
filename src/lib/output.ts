import { type Circle, type Member, type Location } from './api/types.js'

export function formatJson<T extends object>(data: T | T[], _type?: string, _full = false): string {
    return JSON.stringify(data, null, 2)
}

export function formatCircleRow(circle: Circle, indent = 0): string {
    const padding = '  '.repeat(indent)
    return `${padding}${circle.name} (${circle.id})`
}

export function formatCirclesList(circles: Circle[]): string {
    if (circles.length === 0) {
        return 'No circles found'
    }
    return circles.map((c, i) => `${i + 1}. ${formatCircleRow(c)}`).join('\n')
}

export function formatMemberRow(member: Member, showLocation = true): string {
    const name = member.firstName || member.name
    const parts = [name]

    if (showLocation && member.location) {
        const lat = String(member.location.latitude)
        const lng = String(member.location.longitude)
        parts.push(`(${lat}, ${lng})`)
    }

    if (member.batteryLevel !== undefined) {
        parts.push(`Battery: ${member.batteryLevel}%`)
    }

    return parts.join(' ')
}

export function formatMembersList(members: Member[], showLocation = true): string {
    if (members.length === 0) {
        return 'No members found'
    }
    return members.map((m, i) => `${i + 1}. ${formatMemberRow(m, showLocation)}`).join('\n')
}

export function formatLocation(location: Location, memberName: string): string {
    const { latitude, longitude, accuracy, battery, timestamp, cached } = location

    const lines = [
        `Location for ${memberName}:`,
        `  Latitude: ${latitude}`,
        `  Longitude: ${longitude}`,
        `  Accuracy: ${accuracy}m`,
    ]

    if (battery !== undefined) {
        lines.push(`  Battery: ${battery}%`)
    }

    if (timestamp) {
        lines.push(`  Last seen: ${timestamp}`)
    }

    if (cached) {
        lines.push(`  (cached)`)
    }

    return lines.join('\n')
}