import process from 'node:process'
import type { Data } from '@lolpants/jogger'
import Redis from 'ioredis'
import cron from 'node-cron'
import { env, IS_DEV } from '~/env.js'
import { context, errorField, logger, message } from '~/logger.js'

const ctx = context('redis')
const event = (event: string): Data => ({ event })

export const redis = new Redis({
  db: env.REDIS_DB_OFFSET + 0,
  host: env.REDIS_HOST ?? (IS_DEV ? 'localhost' : 'redis'),
  password: env.REDIS_PASS,
  port: env.REDIS_PORT,
})

redis.on('error', error => {
  if (error instanceof Error) {
    logger.error({
      ...ctx,
      ...event('fail'),
      ...message('failed to connect to redis instance'),
      ...errorField(error),
    })
  } else {
    logger.error({
      ...ctx,
      ...event('fail'),
      ...message('failed to connect to redis instance'),
    })
  }

  process.exit(1)
})

redis.on('ready', () => {
  logger.info({ ...ctx, ...event('ready') })
})

redis.on('ready', () => {
  cron.schedule('0 */12 * * *', async () => redis.bgrewriteaof())
})
