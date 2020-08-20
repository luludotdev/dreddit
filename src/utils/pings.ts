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
