import { createField, field } from '@lolpants/jogger'
import Redis from 'ioredis'
import cron from 'node-cron'
import process from 'node:process'
import {
  REDIS_DB_OFFSET,
  REDIS_HOST,
  REDIS_PASS,
  REDIS_PORT,
} from '~env/index.js'
import { ctxField, errorField, logger } from '~logger/index.js'

const ctx = ctxField('redis')
const event = createField('event')

export const redis = new Redis({
  db: REDIS_DB_OFFSET + 0,
  host: REDIS_HOST,
  password: REDIS_PASS,
  port: REDIS_PORT,
})

redis.on('error', error => {
  if (error instanceof Error) {
    logger.error(
      ctx,
      event('fail'),
      field('message', 'Failed to connect to Redis Instance!'),
      errorField(error)
    )
  } else {
    logger.error(
      ctx,
      event('fail'),
      field('message', 'Failed to connect to Redis Instance!')
    )
  }

  process.exit(1)
})

redis.on('ready', () => {
  logger.info(ctx, event('ready'))
})

redis.on('ready', () => {
  cron.schedule('0 */12 * * *', async () => redis.bgrewriteaof())
})
