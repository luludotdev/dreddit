import { parse } from 'path'
import { URL } from 'url'
import { mapAsync } from '~utils/arrays'
import { imgurAxios } from '~utils/axios'
import type { IPartialPost, IPost, PostType } from './types'

// #region Parsers
type ParserFunction<T extends PostType> = (
  post: IPartialPost
) => IPost<T> | undefined | Promise<IPost<T> | undefined>

const IMGUR_RX = /https?:\/\/imgur\.com\/([a-z\d]{5,})/i
const GFY_RX = /https?:\/\/gfycat\.com\/(.+)/i
const REDGIFS_RX = /https?:\/\/(?:www\.)?redgifs\.com\/watch\/(.+)/i
const IMAGE_EXTS = new Set(['.png', '.gif', '.gifv', '.jpg', '.jpeg'])

export const parseImages: ParserFunction<'image'> = async post => {
  const { pathname, protocol, host } = new URL(post.url)
  if (pathname === null) return undefined
  if (protocol === null) return undefined
  if (host === null) return undefined

  const { ext } = parse(pathname)
  const isValid = IMAGE_EXTS.has(ext)
  if (isValid === false) return undefined

  return { ...post, type: 'image', url: `${protocol}//${host}${pathname}` }
}

const parseImgurs: ParserFunction<'image'> = async post => {
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

const parseGfycat: ParserFunction<'gfy'> = async post => {
  // TODO: Parse reddit images
  return undefined
}

const parseRedgifs: ParserFunction<'gfy'> = async post => {
  // TODO: Parse reddit images
  return undefined
}
// #endregion

// #region Parse All
export const parseAll: (
  posts: readonly IPartialPost[]
) => Promise<ReadonlyArray<IPost<PostType>>> = async posts => {
  const allPosts = await Promise.all([
    // MapAsync(posts, async post => parseImages(post)),
    mapAsync(posts, async post => parseImgurs(post)),
    mapAsync(posts, async post => parseGfycat(post)),
    mapAsync(posts, async post => parseRedgifs(post)),
  ])

  const flat = ([] as Array<IPost<PostType> | undefined>).concat(...allPosts)
  return flat.filter(x => typeof x !== 'undefined') as ReadonlyArray<
    IPost<PostType>
  >
}
// #endregion
