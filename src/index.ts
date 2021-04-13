import 'source-map-support/register.js'

import { config } from '~config/index.js'
import { createManager } from '~manager/index.js'
import { mapAsync } from '~utils/arrays.js'
import signale, { panic } from '~utils/signale.js'
import { exitHook } from './exitHook.js'

const init = async () => {
  signale.start('Starting Dreddit...')
  const managers = await Promise.all(
    config.subreddits.map(async post => createManager(post))
  )

  const failures = managers.filter(x => x === undefined)
  if (failures.length === config.subreddits.length) {
    return panic('All subreddits could not be reached!')
  }

  exitHook(async exit => {
    await mapAsync(managers, async manager => manager?.cleanup())
    exit()
  })
}

void init()
