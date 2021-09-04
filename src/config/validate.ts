import { field } from '@lolpants/jogger'
import Ajv from 'ajv'
import { PathLike, readFileSync } from 'node:fs'
import process from 'node:process'
import { ctxField, logger } from '~logger/index.js'

const ctx = ctxField('config')

/* eslint-disable @typescript-eslint/ban-types */
export const validateConfig: <S extends object = {}>(
  path: PathLike,
  schema?: S
) => S = (path, schema) => {
  try {
    const data = readFileSync(path, 'utf8')
    const json = JSON.parse(data)

    if (!schema) return json
    const ajv = new Ajv()
    const validate = ajv.compile(schema)

    const valid = validate(json)
    if (!valid) {
      logger.error(ctx, field('message', 'Invalid config format!'))
      process.exit(1)
    }

    delete json.$schema
    return json
  } catch {
    logger.error(ctx, field('message', 'Failed to load config!'))
    process.exit(1)
  }
}
/* eslint-enable @typescript-eslint/ban-types */
