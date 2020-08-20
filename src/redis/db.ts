import Redis from 'ioredis'
import { schedule } from 'node-cron'
import { REDIS_DB_BASE, REDIS_HOST, REDIS_PASS, REDIS_PORT } from '~env'
import signale, { panic } from '~utils/signale'

export const redis = new Redis({
  db: REDIS_DB_BASE + 0,
  host: REDIS_HOST,
  password: REDIS_PASS,
  port: REDIS_PORT,
})

redis.on('error', () => {
  panic('Failed to connect to Redis Instance!')
})

redis.on('ready', () => {
  signale.start('Connected to Redis')
})

redis.on('ready', () => {
  schedule('0 */12 * * *', async () => redis.bgrewriteaof())
})
