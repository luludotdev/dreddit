import cheerio from 'cheerio'
import { parse } from 'path'
import { URL } from 'url'
import { mapAsync } from '~utils/arrays'
import { redditAxios as axios, imgurAxios } from '~utils/axios'
import type { IPost } from './types'

// #region Parsers
type ParserFunction = (
  post: IPost
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

  return { ...post, type: 'image', url: `${protocol}//${host}${pathname}` }
}

const parseImgurs: ParserFunction = async post => {
  const matches = IMGUR_RX.exec(post.url)
  if (matches === null) return undefined

  try {
    const resp = await imgurAxios.get(`/image/${matches[1]}`)

    const url: string | undefined =
      resp.data?.data?.mp4 ?? resp.data?.data?.link

    if (url === undefined) return undefined
    return { ...post, type: 'image', url }
  } catch {
    return undefined
  }
}

const parseGfycat: ParserFunction = async post => {
  const matches = GFY_RX.exec(post.url)
  if (matches === null) return undefined

  return { ...post, type: 'gfy' }
}

const parseRedgifs: ParserFunction = async post => {
  const matches = REDGIFS_RX.exec(post.url)
  if (matches === null) return undefined

  const resp = await axios.get(post.url)
  const $ = cheerio.load(resp.data)

  const sources = $('source[type="video/mp4"]')
  const urls: string[] = []

  sources.each((_, source) => {
    urls.push(source.attribs.src)
  })

  const url = urls.find(x => x.includes('-mobile') === false)
  if (url === undefined) return undefined

  return { ...post, type: 'gfy', url }
}
// #endregion

// #region Parse All
export const parseAll: (
  posts: readonly IPost[]
) => Promise<readonly IPost[]> = async posts => {
  const allPosts = await Promise.all([
    mapAsync(posts, async post => parseSimple(post)),
    mapAsync(posts, async post => parseImgurs(post)),
    mapAsync(posts, async post => parseGfycat(post)),
    mapAsync(posts, async post => parseRedgifs(post)),
  ])

  const flat = ([] as Array<IPost | undefined>).concat(...allPosts)
  return flat.filter(x => typeof x !== 'undefined') as readonly IPost[]
}
// #endregion
