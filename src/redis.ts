import Redis from 'ioredis'
import signale from 'signale'
import { REDIS_DB, REDIS_HOST, REDIS_PASSWORD, REDIS_PORT } from './env'

export const redis = new Redis({
  db: REDIS_DB,
  host: REDIS_HOST,
  password: REDIS_PASSWORD,
  port: REDIS_PORT,
})

redis.on('error', (err: Error) => {
  signale.error('Failed to connect to Redis Instance!')
  process.exit(1)
})

redis.on('ready', () => {
  signale.success('Connected to Redis!')
})
