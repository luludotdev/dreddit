import { field } from '@lolpants/jogger'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import process from 'node:process'
import { ctxField, logger } from '~logger/index.js'
import type { IConfig, IPostConfig } from './types.js'
import { validateConfig } from './validate.js'

const ctx = ctxField('config')

const configDir = join(__dirname, '..', '..', 'config')
const configPath = join(configDir, 'config.json')
const schemaPath = join(configDir, 'config.schema.json')

if (existsSync(configPath) === false) {
  logger.error(ctx, field('message', 'Could not read config file!'))
  process.exit(1)
}

if (existsSync(schemaPath) === false) {
  logger.error(ctx, field('message', 'Could not read config schema!'))
  process.exit(1)
}

const schema = JSON.parse(readFileSync(schemaPath, 'utf8'))
export const config = validateConfig<IConfig>(configPath, schema)

export type { IConfig, IPostConfig }
