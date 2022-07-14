import { field } from '@lolpants/jogger'
import { existsSync, readFileSync } from 'node:fs'
import path, { join } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { ctxField, logger } from '~/logger.js'
import { ConfigSchema } from './schema.js'

const ctx = ctxField('config')

const __dirname = path.dirname(fileURLToPath(import.meta.url))
export const configDir = join(__dirname, '..', '..', 'config')
const configPath = join(configDir, 'config.json')

if (existsSync(configPath) === false) {
  logger.error(ctx, field('message', 'Could not read config file!'))
  process.exit(1)
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const configBody = JSON.parse(readFileSync(configPath, 'utf8'))
export const config = ConfigSchema.parse(configBody)

export { jsonSchema } from './schema.js'
export type { Config, SubredditConfig } from './schema.js'
