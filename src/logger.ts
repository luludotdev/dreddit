import {
  createConsoleSink,
  createField,
  createFileSink,
  createLogger,
  field,
  type Field,
} from '@lolpants/jogger'
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

export const ctxField = createField('context')
export const errorField: <T extends Error>(error: T) => Field = error => {
  const fields: [Field, ...Field[]] = [
    field('type', error.name),
    field('message', error.message),
  ]

  if (error.stack) fields.push(field('stack', error.stack))
  return field('error', ...fields)
}

export const flush = async () => fileSink.flush()
