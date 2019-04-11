import signale from 'signale'

export const panic = (message: string, code?: number) => {
  signale.error(message)
  process.exit(code || 1)
}

export const resolveArray: <T>(arrayLike: T | T[]) => T[] = arrayLike =>
  Array.isArray(arrayLike) ? arrayLike : [arrayLike]
