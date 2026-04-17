export interface Circle {
    id: string
    name: string
    createdAt?: string
    updatedAt?: string
    color?: string
    type?: string
}

export interface Member {
    id: string
    firstName: string
    lastName?: string
    name: string
    email?: string
    phone?: string
    avatar?: string
    location?: MemberLocation
    batteryLevel?: number
    isLocated?: boolean
    lastSeen?: number
}

export interface MemberLocation {
    latitude: number
    longitude: number
    accuracy: number
    battery?: number
    timestamp: string
    speed?: number
    bearing?: number
    altitude?: number
}

export interface Location {
    latitude: number
    longitude: number
    accuracy: number
    battery?: number
    timestamp: string | null
    cached: boolean
    speed?: number
    bearing?: number
    altitude?: number
}

export interface CircleResponse {
    circles: Circle[]
}

export interface MembersResponse {
    members: Member[]
}

export interface MemberResponse extends Member {
    location?: MemberLocation
}

export type AuthSource = 'env' | 'secure-store' | 'config-file' | 'none'

export interface AuthStatus {
    source: AuthSource
    hasToken: boolean
    tokenType?: string
}