import {
  createConsoleSink,
  createField,
  createFileSink,
  createLogger,
  field,
} from '@lolpants/jogger'
import type { IField } from '@lolpants/jogger'
import { DEBUG_LOGS, IS_DEV } from '~env/index.js'

const consoleSink = createConsoleSink(DEBUG_LOGS || IS_DEV)
const fileSink = createFileSink({
  name: 'dreddit',
  directory: 'logs',
  debug: DEBUG_LOGS || IS_DEV,
})

export const logger = createLogger({
  name: 'dreddit',
  sink: [consoleSink, fileSink],
})

export const ctxField = createField('context')
export const errorField: <T extends Error>(error: T) => Readonly<IField> =
  error => {
    const array: Array<Readonly<IField>> = [
      field('type', error.name),
      field('message', error.message),
    ]

    if (error.stack) array.push(field('stack', error.stack))
    return field('error', array[0], ...array.slice(1))
  }

export const flush = async () => fileSink.flush()
