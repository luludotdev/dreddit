import signale from 'signale'

export const panic = (message: string, code?: number) => {
  signale.error(message)
  process.exit(code || 1)
}
