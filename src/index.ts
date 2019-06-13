import { config } from './config'
import { exitHook } from './exitHook'
import PostManager from './manager'
import signale from './signale'
import { mapAsync } from './util'

signale.start('Starting dreddit...')
const managers = config.subreddits.map(post => new PostManager(post))

exitHook(async hook => {
  await mapAsync(managers, async manager => manager.cleanup())
  return hook()
})
