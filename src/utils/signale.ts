import { Signale } from '@lolpants/signale'

const signale = new Signale({
  config: {
    displayDate: true,
    displayTimestamp: true,
  },
})

export default signale

export const panic = (message: string | Error, code = 1) => {
  signale.fatal(message)
  return process.exit(code)
}
