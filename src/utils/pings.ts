export const escapePings: (text: string) => string = t =>
  t.replace(/@/g, '@\u200B')
