import https from 'node:https'
import { URL } from 'node:url'
import http from 'node:http'

const BASE_URL = 'https://api-cloudfront.life360.com'
const DEFAULT_CACHE_TTL = 30
const MAX_RETRIES = 5
const RATE_LIMIT_DELAY = 60

const USER_AGENT = 'com.life360.android.safetymapd/KOKO/23.50.0 android/13'

const CIPHERS = [
    'TLS_AES_128_GCM_SHA256',
    'TLS_AES_256_GCM_SHA384',
    'TLS_CHACHA20_POLY1305_SHA256',
    'ECDHE-ECDSA-AES128-GCM-SHA256',
    'ECDHE-ECDSA-AES256-GCM-SHA384',
    'ECDHE-ECDSA-CHACHA20-POLY1305',
    'ECDHE-RSA-AES128-GCM-SHA256',
    'ECDHE-RSA-AES256-GCM-SHA384',
    'ECDHE-RSA-CHACHA20-POLY1305',
].join(':')

const tlsAgent = new https.Agent({
    keepAlive: false,
    minVersion: 'TLSv1.2',
    ciphers: CIPHERS,
})

interface CacheEntry<T> {
    data: T
    fetchedAt: number
}

class Life360Client {
    private authorization = ''
    private tokenType = 'Bearer'

    private circleCache: CacheEntry<any[]> | null = null
    private memberCache = new Map<string, CacheEntry<any[]>>()
    private locationCache = new Map<string, CacheEntry<any>>()

    private defaultTtl = DEFAULT_CACHE_TTL

    constructor() {}

    setAuth(token: string, tokenType = 'Bearer'): void {
        this.authorization = token
        this.tokenType = tokenType
    }

    setCacheOptions(ttl: number): void {
        this.defaultTtl = ttl
    }

    private ensureAuth(): void {
        if (!this.authorization) {
            throw new Error('No authentication token set. Run: l360 auth token <token>')
        }
    }

    private isCacheValid<T>(entry: CacheEntry<T> | null, ttl: number): boolean {
        if (!entry) return false
        return Date.now() - entry.fetchedAt < ttl * 1000
    }

    private async request<T>(method: string, url: string): Promise<T> {
        this.ensureAuth()

        let attempt = 0
        while (true) {
            attempt++

            const authHeader = this.authorization.startsWith(this.tokenType + ' ')
                ? this.authorization
                : this.tokenType + ' ' + this.authorization

            const headers: Record<string, string> = {
                'User-Agent': USER_AGENT,
                'Accept': 'application/json',
                'Authorization': authHeader,
                'Cache-Control': 'no-cache',
            }

            try {
                const parsedUrl = new URL(url)
                const reqOptions = {
                    hostname: parsedUrl.hostname,
                    path: parsedUrl.pathname + (parsedUrl.search || ''),
                    method: method,
                    headers: headers,
                    agent: tlsAgent,
                }

                const response = await new Promise<http.IncomingMessage>((resolve, reject) => {
                    const req = https.request(reqOptions, res => {
                        resolve(res)
                    })
                    req.on('error', reject)
                    req.end()
                })

                let data = ''
                for await (const chunk of response) {
                    data += chunk
                }

                const statusCode = response.statusCode || 0

                if (statusCode === 401) {
                    if (attempt > 1) {
                        throw new Error('Authentication failed after token refresh')
                    }
                    continue
                }

                if (statusCode === 429) {
                    if (attempt >= MAX_RETRIES) {
                        throw new Error('Rate limited: exceeded maximum retries')
                    }
                    await this.delay(RATE_LIMIT_DELAY)
                    continue
                }

                if (statusCode >= 500) {
                    if (attempt >= MAX_RETRIES) {
                        throw new Error('Server error ' + statusCode + ' after ' + attempt + ' attempts')
                    }
                    await this.delay(Math.pow(2, attempt))
                    continue
                }

                if (statusCode !== 200 && statusCode !== 201) {
                    if (data.includes('<!DOCTYPE html>') || data.includes('Cloudflare')) {
                        throw new Error('Blocked by Cloudflare. Response: ' + data.slice(0, 200))
                    }
                    throw new Error('API error ' + statusCode + ': ' + data.slice(0, 200))
                }

                try {
                    return JSON.parse(data) as T
                } catch {
                    throw new Error('Invalid JSON from Life360: ' + data.slice(0, 100))
                }
            } catch (err) {
                if (err instanceof Error && err.message.includes('Authentication failed after token refresh')) {
                    throw err
                }
                if (attempt >= MAX_RETRIES) {
                    throw new Error('Network error after ' + attempt + ' attempts: ' + err)
                }
                await this.delay(Math.pow(2, attempt))
            }
        }
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms * 1000))
    }

    async getCircles(forceRefresh = false): Promise<any[]> {
        if (!forceRefresh && this.circleCache && this.isCacheValid(this.circleCache, 3600)) {
            return this.circleCache.data
        }

        const response = await this.request<any>('GET', BASE_URL + '/v4/circles')

        this.circleCache = { data: response.circles, fetchedAt: Date.now() }
        return response.circles
    }

    async getMembers(circleId: string, forceRefresh = false): Promise<any[]> {
        const cached = this.memberCache.get(circleId)

        if (!forceRefresh && cached && this.isCacheValid(cached, 3600)) {
            return cached.data
        }

        const response = await this.request<any>('GET', BASE_URL + '/v3/circles/' + circleId + '/members')

        this.memberCache.set(circleId, { data: response.members, fetchedAt: Date.now() })
        return response.members
    }

    async locate(name: string, options?: { forceFresh?: boolean; ttl?: number }): Promise<any> {
        const force = options?.forceFresh ?? false
        const ttl = options?.ttl ?? this.defaultTtl
        const key = name.toLowerCase()
        const cached = this.locationCache.get(key)

        if (!force && cached && this.isCacheValid(cached, ttl)) {
            return { ...cached.data, cached: true }
        }

        const circles = await this.getCircles(false)

        let memberCircleId: string | null = null
        let memberId: string | null = null

        for (const circle of circles) {
            const members = await this.getMembers(circle.id, false)
            for (const member of members) {
                const memberName = (member.firstName || member.name).toLowerCase()
                if (memberName === key) {
                    memberCircleId = circle.id
                    memberId = member.id
                    break
                }
            }
            if (memberCircleId) break
        }

        if (!memberCircleId || !memberId) {
            throw new Error('Member "' + name + '" not found in any circle')
        }

        const response = await this.request<any>('GET', BASE_URL + '/v3/circles/' + memberCircleId + '/members/' + memberId)

        const loc = response.location
        const battery = loc?.battery ?? response.batteryLevel

        let ts: string | null = null
        if (loc?.timestamp) {
            try {
                const tsInt = parseInt(loc.timestamp)
                if (tsInt > 1000000000000) {
                    ts = new Date(tsInt / 1000).toISOString()
                } else if (tsInt > 1000000000) {
                    ts = new Date(tsInt * 1000).toISOString()
                } else {
                    ts = loc.timestamp
                }
            } catch {
                ts = null
            }
        }

        const result: any = {
            latitude: loc?.latitude ?? 0,
            longitude: loc?.longitude ?? 0,
            accuracy: loc?.accuracy ?? 0,
            battery: battery,
            timestamp: ts,
            cached: false,
            speed: loc?.speed,
            bearing: loc?.bearing,
            altitude: loc?.altitude,
        }

        this.locationCache.set(key, { data: result, fetchedAt: Date.now() })
        return result
    }

    invalidateCircleCache(): void {
        this.circleCache = null
    }

    invalidateMemberCache(circleId?: string): void {
        if (circleId) {
            this.memberCache.delete(circleId)
        } else {
            this.memberCache.clear()
        }
    }

    invalidateLocationCache(memberName?: string): void {
        if (memberName) {
            this.locationCache.delete(memberName.toLowerCase())
        } else {
            this.locationCache.clear()
        }
    }

    invalidateAllCaches(): void {
        this.circleCache = null
        this.memberCache.clear()
        this.locationCache.clear()
    }
}

let apiClient: Life360Client | null = null

export function createApiClient(authToken: string, tokenType?: string): Life360Client {
    const client = new Life360Client()
    client.setAuth(authToken, tokenType)
    apiClient = client
    return client
}

export function getApiClient(): Life360Client {
    if (!apiClient) {
        throw new Error('API client not initialized. Call createApiClient first.')
    }
    return apiClient
}

export function getApiClientOrNull(): Life360Client | null {
    return apiClient
}

export function clearApiClient(): void {
    apiClient = null
}