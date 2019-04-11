import { join } from 'path'
import { existsSync, loadConfig, readSync } from './fs'
import { panic } from './util'

const configDir = join(__dirname, '..', 'config')
const configPath = join(configDir, 'config.json')
const schemaPath = join(configDir, 'config.schema.json')

if (!existsSync(configPath)) panic('Could not read config file!')
if (!existsSync(schemaPath)) panic('Could not read config schema!')

interface IConfig {
  interval: number
  subreddits: IPostConfig[]
}

export interface IPostConfig {
  subreddit: string
  webhooks: string | string[]
  interval?: number

  allowNSFW?: boolean
  titles?: boolean
  urls?: boolean
}

const schema = JSON.parse(readSync(schemaPath, 'utf8'))
export const config = loadConfig<IConfig>(configPath, schema)
