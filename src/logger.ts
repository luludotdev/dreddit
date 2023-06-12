import {
  createConsoleSink,
  createFileSink,
  createLogger,
} from '@lolpants/jogger'
import type { Data, Primitive } from '@lolpants/jogger'
import { env, IS_DEV } from '~/env.js'

const consoleSink = createConsoleSink({
  debug: env.DEBUG_LOGS || IS_DEV,
  trace: env.TRACE_LOGS,
})

const fileSink = createFileSink({
  name: 'dreddit',
  directory: 'logs',
  debug: env.DEBUG_LOGS || IS_DEV,
  trace: env.TRACE_LOGS,
  rollEveryDay: true,
})

export const logger = createLogger({
  name: 'dreddit',
  sink: [consoleSink, fileSink],
})

export const context = (context: string): Data => ({ context })
export const action = (action: string): Data => ({ action })
export const message = (message: string): Data => ({ message })

export const errorField = <T extends Error>(error: T): Data => {
  const fields: Primitive = { type: error.name, message: error.message }
  const all: Primitive = error.stack
    ? { ...fields, stack: error.stack }
    : fields

  return { error: all }
}

export const flush = async () => fileSink.flush()
