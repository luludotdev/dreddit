import 'source-map-support/register.js'

import { field } from '@lolpants/jogger'
import process from 'node:process'
import { config } from '~config/index.js'
import { ctxField, logger } from '~logger/index.js'
import { createManager } from '~manager/index.js'
import { mapAsync } from '~utils/arrays.js'
import { exitHook } from './exitHook.js'

const ctx = ctxField('init')

const init = async () => {
  logger.info(ctx)

  const managers = await Promise.all(
    config.subreddits.map(async post => createManager(post))
  )

  const failures = managers.filter((x): x is undefined => x === undefined)
  if (failures.length === config.subreddits.length) {
    logger.error(ctx, field('message', 'All subreddits could not be reached!'))
    process.exit(1)
  }

  exitHook(async exit => {
    await mapAsync(managers, async manager => manager?.cleanup())
    exit()
  })
}

void init()
