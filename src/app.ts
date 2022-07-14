import { exitHook } from '@lolpants/exit'
import { createField, field } from '@lolpants/jogger'
import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import process, { argv } from 'node:process'
import { config, configDir, jsonSchema } from '~/config/index.js'
import { IS_DEV } from '~/env.js'
import { ctxField, logger } from '~/logger.js'
import { createManager } from '~/manager/index.js'
import { mapAsync } from '~/utils/arrays.js'
import { getVersion } from '~/version.js'

const ctx = ctxField('main')
const action = createField('action')

export const init = async () => {
  if (argv[2]?.toLowerCase() === 'schemagen') {
    const schemaPath = join(configDir, 'config.schema.json')
    const schema = JSON.stringify(jsonSchema, null, 2) + '\n'

    await writeFile(schemaPath, schema)
    process.exit(0)
  }

  const version = await getVersion()
  logger.info(
    ctx,
    action('init'),
    field('version', version),
    field('environment', IS_DEV ? 'dev' : 'prod')
  )

  const managers = await Promise.all(
    config.subreddits.map(async post => createManager(post))
  )

  const failures = managers.filter((x): x is undefined => x === undefined)
  if (failures.length === config.subreddits.length) {
    logger.error(
      ctx,
      action('init'),
      field('message', 'All subreddits could not be reached!')
    )

    process.exit(1)
  }

  exitHook(async exit => {
    await mapAsync(managers, async manager => manager?.cleanup())
    exit()
  })
}
