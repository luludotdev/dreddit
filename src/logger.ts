import {
  createConsoleSink,
  createField,
  createFileSink,
  createLogger,
  field,
  type Field,
} from '@lolpants/jogger'
import { env, IS_DEV } from '~/env.js'

const consoleSink = createConsoleSink(env.DEBUG_LOGS || IS_DEV)
const fileSink = createFileSink({
  name: 'dreddit',
  directory: 'logs',
  debug: env.DEBUG_LOGS || IS_DEV,
})

export const logger = createLogger({
  name: 'dreddit',
  sink: [consoleSink, fileSink],
})

export const ctxField = createField('context')
export const errorField: <T extends Error>(
  error: T
) => Readonly<Field> = error => {
  const array: Array<Readonly<Field>> = [
    field('type', error.name),
    field('message', error.message),
  ]

  if (error.stack) array.push(field('stack', error.stack))
  return field('error', array[0], ...array.slice(1))
}

export const flush = async () => fileSink.flush()
