import { getApiClient } from './api/core.js'
import { type Circle, type Member } from './api/types.js'

export async function resolveCircleRef(ref: string): Promise<Circle> {
    const api = getApiClient()
    const circles = await api.getCircles()
    const lower = ref.toLowerCase()

    const exact = circles.find(c => c.name.toLowerCase() === lower)
    if (exact) return exact

    const partial = circles.find(c => c.name.toLowerCase().includes(lower))
    if (partial) return partial

    const direct = circles.find(c => c.id === ref)
    if (direct) return direct

    throw new Error(`Circle "${ref}" not found`)
}

export async function resolveMemberRef(
    ref: string,
    circleId?: string
): Promise<{ member: Member; circleId: string }> {
    const api = getApiClient()
    let targetCircles: Circle[]

    if (circleId) {
        const circles = await api.getCircles()
        targetCircles = circles.filter(c => c.id === circleId || c.name === circleId)
    } else {
        targetCircles = await api.getCircles()
    }

    const lower = ref.toLowerCase()

    for (const circle of targetCircles) {
        const members = await api.getMembers(circle.id)
        const exact = members.find(m => (m.firstName || m.name).toLowerCase() === lower)
        if (exact) {
            return { member: exact, circleId: circle.id }
        }

        const partial = members.find(m => (m.firstName || m.name).toLowerCase().includes(lower))
        if (partial) {
            return { member: partial, circleId: circle.id }
        }
    }

    throw new Error(`Member "${ref}" not found`)
}