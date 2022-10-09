import { existsSync, readFileSync } from 'node:fs'
import path, { join } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { field } from '@lolpants/jogger'
import { ConfigSchema } from './schema.js'
import { ctxField, logger } from '~/logger.js'

const ctx = ctxField('config')

const __dirname = path.dirname(fileURLToPath(import.meta.url))
export const configDir = join(__dirname, '..', '..', 'config')
const configPath = join(configDir, 'config.json')

if (existsSync(configPath) === false) {
  logger.error(ctx, field('message', 'Could not read config file!'))
  process.exit(1)
}

const configBody = JSON.parse(readFileSync(configPath, 'utf8'))
export const config = ConfigSchema.parse(configBody)

export { jsonSchema } from './schema.js'
export type { Config, SubredditConfig } from './schema.js'
