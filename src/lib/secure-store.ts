const SERVICE_NAME = 'life360-cli'
const ACCOUNT_NAME = 'authorization'

export interface SecureStore {
    getSecret(): Promise<string | null>
    setSecret(secret: string): Promise<void>
    deleteSecret(): Promise<boolean>
}

async function getLinuxSecret(): Promise<string | null> {
    try {
        const { exec } = await import('node:child_process')
        const { promisify } = await import('node:util')
        const execAsync = promisify(exec)
        const cmd = `secret-tool lookup service ${SERVICE_NAME} account ${ACCOUNT_NAME}`
        const { stdout } = await execAsync(cmd, { encoding: 'utf-8' })
        return stdout.trim() || null
    } catch {
        return null
    }
}

async function setLinuxSecret(secret: string): Promise<void> {
    const { exec } = await import('node:child_process')
    const { promisify } = await import('node:util')
    const execAsync = promisify(exec)
    await execAsync(
        `secret-tool store --label="Life360 CLI" service ${SERVICE_NAME} account ${ACCOUNT_NAME} password "${secret}"`
    )
}

async function deleteLinuxSecret(): Promise<boolean> {
    try {
        const { exec } = await import('node:child_process')
        const { promisify } = await import('node:util')
        const execAsync = promisify(exec)
        await execAsync(`secret-tool clear service ${SERVICE_NAME} account ${ACCOUNT_NAME}`)
        return true
    } catch {
        return false
    }
}

export function createSecureStore(): SecureStore {
    return {
        async getSecret() {
            return getLinuxSecret()
        },
        async setSecret(secret) {
            await setLinuxSecret(secret)
        },
        async deleteSecret() {
            return deleteLinuxSecret()
        },
    }
}

let secureStoreInstance: SecureStore | null = null

export function getSecureStore(): SecureStore {
    if (!secureStoreInstance) {
        secureStoreInstance = createSecureStore()
    }
    return secureStoreInstance
}

export async function isSecureStorageAvailable(): Promise<boolean> {
    try {
        const { exec } = await import('node:child_process')
        const { promisify } = await import('node:util')
        const execAsync = promisify(exec)
        await execAsync('which secret-tool')
        return true
    } catch {
        return false
    }
}