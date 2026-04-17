import { getSecureStore, isSecureStorageAvailable } from './secure-store.js'
import { loadConfig, saveConfig } from './config.js'
import { createApiClient } from './api/core.js'
import { type AuthSource, type AuthStatus } from './api/types.js'

const TOKEN_ENV_VAR = 'LIFE360_AUTHORIZATION'
const TOKEN_TYPE_VAR = 'LIFE360_TOKEN_TYPE'
const MCP_URL_VAR = 'LIFE360_MCP_URL'

export async function getAuthToken(): Promise<string> {
    const envToken = process.env[TOKEN_ENV_VAR]
    if (envToken) {
        return envToken
    }

    try {
        const secureStore = getSecureStore()
        const token = await secureStore.getSecret()
        if (token) {
            return token
        }
    } catch {
    }

    const config = loadConfig()
    if (config.authorization) {
        return config.authorization
    }

    throw new Error(
        'No authentication token. Set LIFE360_AUTHORIZATION env var, or run: l360 auth token <token>'
    )
}

export async function getTokenType(): Promise<string> {
    const envType = process.env[TOKEN_TYPE_VAR]
    if (envType) {
        return envType
    }

    const config = loadConfig()
    return config.token_type ?? 'Bearer'
}

export async function getAuthStatus(): Promise<AuthStatus> {
    const envToken = process.env[TOKEN_ENV_VAR]
    if (envToken) {
        return {
            source: 'env',
            hasToken: true,
            tokenType: process.env[TOKEN_TYPE_VAR] ?? 'Bearer',
        }
    }

    try {
        const secureStore = getSecureStore()
        const token = await secureStore.getSecret()
        if (token) {
            return { source: 'secure-store', hasToken: true, tokenType: 'Bearer' }
        }
    } catch {
    }

    const config = loadConfig()
    if (config.authorization) {
        return {
            source: 'config-file',
            hasToken: true,
            tokenType: config.token_type ?? 'Bearer',
        }
    }

    return { source: 'none', hasToken: false }
}

export async function saveAuthToken(
    token: string,
    options?: { tokenType?: string }
): Promise<void> {
    try {
        const secureStore = getSecureStore()
        await secureStore.setSecret(token)
    } catch {
        const config = loadConfig()
        config.authorization = token
        if (options?.tokenType) {
            config.token_type = options.tokenType
        }
        saveConfig(config)
    }
}

export async function clearAuthToken(): Promise<void> {
    try {
        const secureStore = getSecureStore()
        await secureStore.deleteSecret()
    } catch {
    }

    const config = loadConfig()
    delete config.authorization
    saveConfig(config)
}

export async function initApiClient(authToken?: string): Promise<void> {
    const token = authToken ?? await getAuthToken()
    const tokenType = await getTokenType()
    createApiClient(token, tokenType)
}

export { isSecureStorageAvailable }
export type { AuthSource, AuthStatus } from './api/types.js'