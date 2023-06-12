import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import process, { argv } from 'node:process'
import { exitHook } from '@lolpants/exit'
import { config, configDir, jsonSchema } from '~/config/index.js'
import { IS_DEV } from '~/env.js'
import { action, context, logger, message } from '~/logger.js'
import { createManager } from '~/manager/index.js'
import { mapAsync } from '~/utils/arrays.js'
import { getVersion } from '~/version.js'

const ctx = context('main')

export const init = async () => {
  if (argv[2]?.toLowerCase() === 'schemagen') {
    const schemaPath = join(configDir, 'config.schema.json')
    const schema = JSON.stringify(jsonSchema, null, 2) + '\n'

    await writeFile(schemaPath, schema)
    process.exit(0)
  }

  const version = await getVersion()
  logger.info({
    ...ctx,
    ...action('init'),
    version,
    environment: IS_DEV ? 'dev' : 'prod',
  })

  const managers = await Promise.all(
    config.subreddits.map(async post => createManager(post)),
  )

  const failures = managers.filter((x): x is undefined => x === undefined)
  if (failures.length === config.subreddits.length) {
    logger.error({
      ...ctx,
      ...action('init'),
      ...message('all subreddits could not be reached'),
    })

    process.exit(1)
  }

  exitHook(async exit => {
    await mapAsync(managers, async manager => manager?.cleanup())
    exit()
  })
}
