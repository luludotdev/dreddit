import cheerio from 'cheerio'
import { parse } from 'path'
import { URL } from 'url'
import { mapAsync } from '~utils/arrays.js'
import { redditAxios as axios, imgurAxios, isAxiosError } from '~utils/axios.js'
import type { IPartialPost, IPost } from './types.js'

// #region Parsers
type ParserFunction = (
  post: IPartialPost
) => IPost | undefined | Promise<IPost | undefined>

const IMGUR_RX = /https?:\/\/imgur\.com\/([a-z\d]{5,})/i
const GFY_RX = /https?:\/\/gfycat\.com\/(.+)/i
const REDGIFS_RX = /https?:\/\/(?:www\.)?redgifs\.com\/watch\/(.+)/i
const VALID_EXTS = new Set([
  '.png',
  '.gif',
  '.gifv',
  '.jpg',
  '.jpeg',
  '.mp4',
  '.webm',
])

export const parseSimple: ParserFunction = async post => {
  const { pathname, protocol, host } = new URL(post.url)
  if (pathname === null) return undefined
  if (protocol === null) return undefined
  if (host === null) return undefined

  const { ext } = parse(pathname)
  const isValid = VALID_EXTS.has(ext)
  if (isValid === false) return undefined

  return { ...post, type: 'embed', url: `${protocol}//${host}${pathname}` }
}

const parseImgurs: ParserFunction = async post => {
  const matches = IMGUR_RX.exec(post.url)
  if (matches === null) return undefined

  try {
    const resp = await imgurAxios.get(`/image/${matches[1]}`)

    const url: string | undefined =
      resp.data?.data?.mp4 ?? resp.data?.data?.link

    if (url === undefined) return undefined
    return { ...post, type: 'embed', url }
  } catch {
    return undefined
  }
}

const parseGfycat: ParserFunction = async post => {
  const matches = GFY_RX.exec(post.url)
  if (matches === null) return undefined

  return { ...post, type: 'text' }
}

const parseRedgifs: ParserFunction = async post => {
  const matches = REDGIFS_RX.exec(post.url)
  if (matches === null) return undefined

  const resp = await axios.get(post.url)
  const $ = cheerio.load(resp.data)

  const sources = $('source[type="video/mp4"]')
  const urls: string[] = []

  sources.each((_, s) => {
    const source = s as cheerio.TagElement
    urls.push(source.attribs.src)
  })

  const url = urls.find(x => x.includes('-mobile') === false)
  if (url === undefined) return undefined

  return { ...post, type: 'text', url }
}
// #endregion

// #region Parse All
const checkSizes: (
  posts: Array<IPost | undefined>
) => Promise<Array<IPost | undefined>> = async posts =>
  mapAsync(posts, async post => {
    if (post === undefined) return undefined
    if (post.type === 'text') return post

    try {
      const resp = await axios.head(post.url)
      const l: string | string[] | undefined = resp.headers['content-length']
      if (l === undefined) return post

      const lengthString = Array.isArray(l) ? l[0] : l
      if (lengthString === undefined) return post
      if (lengthString === '') return post

      // Discord Limit for Bots
      const length = Number.parseInt(lengthString, 10)
      if (length <= 8_388_119) return post

      return { ...post, type: 'text' }
    } catch (error: unknown) {
      if (isAxiosError(error)) {
        const resp = error.response
        if (resp?.status === 429) return post

        return
      }

      throw error
    }
  })

export const parseAll: (
  posts: readonly IPartialPost[]
) => Promise<readonly IPost[]> = async posts => {
  const allPosts = await Promise.all([
    mapAsync(posts, async post => parseSimple(post)),
    mapAsync(posts, async post => parseImgurs(post)),
    mapAsync(posts, async post => parseGfycat(post)),
    mapAsync(posts, async post => parseRedgifs(post)),
  ])

  const flat = ([] as Array<IPost | undefined>).concat(...allPosts)
  const checked = await checkSizes(flat)
  return checked.filter(x => typeof x !== 'undefined') as IPost[]
}
// #endregion
