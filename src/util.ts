import signale from 'signale'

export const panic = (message: string, code?: number) => {
  signale.error(message)
  process.exit(code || 1)
}

export const resolveArray: <T>(arrayLike: T | T[]) => T[] = arrayLike =>
  Array.isArray(arrayLike) ? arrayLike : [arrayLike]

export const escapePings: (
  text: string | TemplateStringsArray,
  ...args: any[]
) => string = (text, ...args) => {
  const escape = (t: string) => t.replace(/@/g, '@\u200b')

  if (!Array.isArray(text)) return escape(text as string)

  const built = text.reduce((acc, curr, i) => {
    const val = `${args[i] || ''}`
    return `${acc}${curr}${val}`
  }, '')

  return escape(built)
}
