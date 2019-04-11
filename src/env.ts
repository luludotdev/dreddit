import dotenv from 'dotenv'

dotenv.config()
const { NODE_ENV, REDIS_PASSWORD } = process.env
export const isDev = NODE_ENV !== 'production'

export const REDIS_HOST =
  process.env.REDIS_HOST || isDev ? 'localhost' : 'redis'

const defaultRedisPort = 6379
export const REDIS_PORT =
  parseInt(process.env.REDIS_HOST || defaultRedisPort.toString(), 10) ||
  defaultRedisPort

const defaultRedisDB = 0
export const REDIS_DB =
  parseInt(process.env.REDIS_DB || defaultRedisDB.toString(), 10) ||
  defaultRedisDB

export { REDIS_PASSWORD }
