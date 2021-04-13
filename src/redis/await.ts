import { redis } from './db.js'

export const awaitRedis: () => Promise<void> = async () =>
  new Promise(resolve => {
    if (redis.status === 'ready') resolve()
    else
      redis.on('ready', () => {
        resolve()
      })
  })
