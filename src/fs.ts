import Ajv from 'ajv'
import * as fs from 'fs'
import { promisify } from 'util'
import { panic } from './util'

export const readFile = promisify(fs.readFile)
export const readSync = fs.readFileSync

export const exists = promisify(fs.exists)
export const existsSync = fs.existsSync

export const loadConfig: <S extends object = {}>(
  path: fs.PathLike,
  schema?: S
) => S = (path, schema) => {
  try {
    const data = readSync(path, 'utf8')
    const json = JSON.parse(data)

    if (!schema) return json
    const ajv = new Ajv()
    const validate = ajv.compile(schema)

    const valid = validate(json)
    if (!valid) panic('Invalid config format!')

    delete json.$schema
    return json
  } catch (err) {
    panic('Failed to load config!')
  }
}
