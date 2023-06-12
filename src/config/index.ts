import { existsSync, readFileSync } from 'node:fs'
import path, { join } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { ConfigSchema } from './schema.js'
import { context, logger, message } from '~/logger.js'

const ctx = context('config')

const __dirname = path.dirname(fileURLToPath(import.meta.url))
export const configDir = join(__dirname, '..', 'config')
const configPath = join(configDir, 'config.json')

if (existsSync(configPath) === false) {
  logger.error({...ctx, ...message('could not read config file')})
  process.exit(1)
}

const configBody = JSON.parse(readFileSync(configPath, 'utf8'))
export const config = ConfigSchema.parse(configBody)

export { jsonSchema } from './schema.js'
export type { Config, SubredditConfig } from './schema.js'
