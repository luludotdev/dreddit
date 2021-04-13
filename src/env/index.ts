/* eslint-disable prettier/prettier */
import { panic } from '~utils/signale.js'
import { registerInt, registerString } from './register.js'

// #region Globals
const NODE_ENV = registerString('NODE_ENV')
const IS_PROD = NODE_ENV?.toLowerCase() === 'production'
export const IS_DEV = !IS_PROD
// #endregion

// #region Application
const IMGUR_CLID = registerString('IMGUR_CLID')
if (IMGUR_CLID === undefined) {
  panic('env variable `IMGUR_CLID` must be set')
  process.exit(0)
}

const imgurClid = IMGUR_CLID
export { imgurClid as IMGUR_CLID }
// #endregion

// #region Redis
export const REDIS_HOST = registerString('REDIS_HOST') ?? (IS_DEV ? 'localhost' : 'redis')
export const REDIS_PORT = registerInt('REDIS_PORT') ?? 6379
export const REDIS_PASS = registerString('REDIS_PASS')
export const REDIS_DB_OFFSET = registerInt('REDIS_DB_OFFSET') ?? 0
// #endregion
