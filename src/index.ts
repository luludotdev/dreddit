import 'source-map-support/register'

import { config } from '~config'
import { createManager } from '~manager'
import { mapAsync } from '~utils/arrays'
import signale from '~utils/signale'
import { exitHook } from './exitHook'

const init = async () => {
  signale.start('Starting Dreddit...')
  const managers = await Promise.all(
    config.subreddits.map(async post => createManager(post))
  )

  exitHook(async hook => {
    await mapAsync(managers, async manager => manager?.cleanup())
    return hook()
  })
}

void init()
