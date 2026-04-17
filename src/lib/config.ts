import { homedir } from 'node:os'
import { join } from 'node:path'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'

export const CONFIG_DIR = join(homedir(), '.config', 'life360-cli')
export const CONFIG_PATH = join(CONFIG_DIR, 'config.json')

export interface Config {
    authorization?: string
    token_type?: string
    cache_ttl?: number
}

export function ensureConfigDir(): void {
    if (!existsSync(CONFIG_DIR)) {
        mkdirSync(CONFIG_DIR, { recursive: true })
    }
}

export function loadConfig(): Config {
    ensureConfigDir()
    if (!existsSync(CONFIG_PATH)) {
        return {}
    }
    try {
        const content = readFileSync(CONFIG_PATH, 'utf-8')
        return JSON.parse(content) as Config
    } catch {
        return {}
    }
}

export function saveConfig(config: Config): void {
    ensureConfigDir()
    writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2))
}

export function clearConfig(): void {
    ensureConfigDir()
    if (existsSync(CONFIG_PATH)) {
        writeFileSync(CONFIG_PATH, '')
    }
}