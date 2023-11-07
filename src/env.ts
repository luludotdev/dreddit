import '@luludev/env/register.js'
import { defineEnvironment, t } from '@luludev/env'

export const env = defineEnvironment({
  NODE_ENV: t.string(),
  GIT_VERSION: t.string(),

  // #region Application
  DEBUG_LOGS: t.bool().default(false),
  TRACE_LOGS: t.bool().default(false),
  IMGUR_CLID: t.string().required(),
  // #endregion

  // #region Redis
  REDIS_HOST: t.string(),
  REDIS_PORT: t.int().default(6_379),
  REDIS_PASS: t.string(),
  REDIS_DB_OFFSET: t.int().default(0),
  // #endregion
})

const IS_PROD = env.NODE_ENV?.toLowerCase() === 'production'
export const IS_DEV = !IS_PROD
