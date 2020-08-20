import Ajv from 'ajv'
import { PathLike, readFileSync } from 'fs'
import { panic } from '~utils/signale'

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
    if (!valid) panic('Invalid config format!')

    delete json.$schema
    return json
  } catch {
    panic('Failed to load config!')
  }
}
/* eslint-enable @typescript-eslint/ban-types */
