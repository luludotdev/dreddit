import 'source-map-support/register'

import { config } from '~config'
import { createManager } from '~manager'
import { mapAsync } from '~utils/arrays'
import signale, { panic } from '~utils/signale'
import { exitHook } from './exitHook'

const init = async () => {
  signale.start('Starting Dreddit...')
  const managers = await Promise.all(
    config.subreddits.map(async post => createManager(post))
  )

  const failures = managers.filter(x => x === undefined)
  if (failures.length === config.subreddits.length) {
    return panic('All subreddits could not be reached!')
  }

  exitHook(async hook => {
    await mapAsync(managers, async manager => manager?.cleanup())
    return hook()
  })
}

void init()
