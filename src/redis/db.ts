import Redis from 'ioredis'
import { schedule } from 'node-cron'
import {
  REDIS_DB_OFFSET,
  REDIS_HOST,
  REDIS_PASS,
  REDIS_PORT,
} from '~env/index.js'
import signale, { panic } from '~utils/signale.js'

export const redis = new Redis({
  db: REDIS_DB_OFFSET + 0,
  host: REDIS_HOST,
  password: REDIS_PASS,
  port: REDIS_PORT,
})

redis.on('error', error => {
  signale.fatal('Failed to connect to Redis Instance!')
  panic(error)
})

redis.on('ready', () => {
  signale.info('Connected to Redis')
})

redis.on('ready', () => {
  schedule('0 */12 * * *', async () => redis.bgrewriteaof())
})
