import 'source-map-support/register.js'

import { exitHook } from '@lolpants/exit'
import { env } from '~/env.js'
import { action, context, errorField, flush, logger } from '~/logger.js'

const ctx = context('main')

const boot = async () => {
  env.validate()

  const { init } = await import('~/app.js')
  await init()
}

exitHook(async (exit, error) => {
  const actionField = action('exit')
  if (error) {
    logger.error({ ...ctx, ...actionField, ...errorField(error) })
  } else {
    logger.info({ ...ctx, ...actionField })
  }

  await flush()
  exit()
})

void boot()
