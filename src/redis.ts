import Redis from 'ioredis'
import signale from 'signale'
import { REDIS_DB, REDIS_HOST, REDIS_PASSWORD, REDIS_PORT } from './env'
import { panic } from './util'

export const redis = new Redis({
  db: REDIS_DB,
  host: REDIS_HOST,
  password: REDIS_PASSWORD,
  port: REDIS_PORT,
})

redis.on('error', (err: Error) => {
  panic('Failed to connect to Redis Instance!')
})

redis.on('ready', () => {
  signale.success('Connected to Redis!')
})
