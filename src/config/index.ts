import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import { panic } from '~utils/signale'
import type { IConfig, IPostConfig } from './types'
import { validateConfig } from './validate'

const configDir = join(__dirname, '..', '..', 'config')
const configPath = join(configDir, 'config.json')
const schemaPath = join(configDir, 'config.schema.json')

if (existsSync(configPath) === false) panic('Could not read config file!')
if (existsSync(schemaPath) === false) panic('Could not read config schema!')

const schema = JSON.parse(readFileSync(schemaPath, 'utf8'))
export const config = validateConfig<IConfig>(configPath, schema)

export type { IConfig, IPostConfig }
