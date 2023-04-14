import { parse } from 'node:path'
import { URL } from 'node:url'
import { AxiosError } from 'axios'
import * as cheerio from 'cheerio'
import type { PartialPost, Post } from './types.js'
import { errorField, logger } from '~/logger.js'
import { mapAsync } from '~/utils/arrays.js'
import {
  redditAxios as axios,
  imgurAxios,
  isAxiosError,
} from '~/utils/axios.js'

// #region Parsers
type ParserFunction = (
  post: PartialPost,
) => Post | Promise<Post | undefined> | undefined

const IMGUR_RX = /https?:\/\/imgur\.com\/(?<id>[\da-z]{5,})/i
const GFY_RX = /https?:\/\/gfycat\.com\/(?<id>.+)/i
const REDGIFS_RX = /https?:\/\/(?:www\.)?redgifs\.com\/watch\/(?<id>.+)/i
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
  try {
    const { pathname, protocol, host } = new URL(post.url)
    if (pathname === null) return undefined
    if (protocol === null) return undefined
    if (host === null) return undefined

    const { ext } = parse(pathname)
    const isValid = VALID_EXTS.has(ext)
    if (isValid === false) return undefined

    const gifvFixedPathname = pathname.replace('.gifv', '.mp4')
    return {
      ...post,
      type: 'embed',
      url: `${protocol}//${host}${gifvFixedPathname}`,
    }
  } catch (error) {
    if (error instanceof Error) {
      logger.error(errorField(error))
    }

    return undefined
  }
}

const parseImgurs: ParserFunction = async post => {
  const matches = IMGUR_RX.exec(post.url)

  const { id } = matches?.groups ?? {}
  if (!id) return undefined

  try {
    interface ImgurResponse {
      data: {
        id: string

        title: string | null
        link: string
        mp4?: string
      }
    }

    const resp = await imgurAxios.get<ImgurResponse>(`/image/${id}`)
    const url = resp.data?.data?.mp4 ?? resp.data?.data?.link

    if (url === undefined) return undefined
    return { ...post, type: 'embed', url }
  } catch (error) {
    if (error instanceof Error) {
      logger.error(errorField(error))
    }

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
  const id = matches?.groups?.id
  if (!id) return undefined

  try {
    interface RedgifsAuth {
      addr: string
      agent: string
      rtfm: string
      token: string
    }

    const { data: auth } = await axios.get<RedgifsAuth>(
      'https://api.redgifs.com/v2/auth/temporary',
    )

    interface RedgifsResp {
      gif: {
        urls: {
          hd: string
          poster: string
          sd: string
          thumbnail: string
          vthumbnail: string
        }
      }
    }

    const { data } = await axios.get<RedgifsResp>(
      `https://api.redgifs.com/v2/gifs/${id}`,
      {
        headers: { Authorization: `Bearer ${auth.token}` },
      },
    )

    const url = data.gif.urls.hd
    return { ...post, type: 'embed', url, fallback: post.url }
  } catch (error: unknown) {
    if (error instanceof AxiosError && error.response?.status === 410) {
      return undefined
    }

    throw error
  }
}
// #endregion

// #region Parse All
const checkSizes: (
  posts: (Post | undefined)[],
) => Promise<(Post | undefined)[]> = async posts =>
  mapAsync(posts, async post => {
    if (post === undefined) return undefined
    if (post.type === 'text') return post

    try {
      const resp = await axios.head(post.url)
      const headers = resp.headers as Record<string, string[] | string>

      const contentLength = headers['content-length']
      if (contentLength === undefined) return post

      const lengthString = Array.isArray(contentLength)
        ? contentLength[0]
        : contentLength

      if (lengthString === undefined) return post
      if (lengthString === '') return post

      const length = Number.parseInt(lengthString, 10)
      // eslint-disable-next-line require-atomic-updates
      post.size = length

      // Discord Limit for Bots
      if (length <= 26_214_080) return post

      return { ...post, type: 'text', url: post.fallback ?? post.url }
    } catch (error: unknown) {
      if (isAxiosError(error)) {
        const resp = error.response
        if (resp?.status === 429) return post

        return
      }

      throw error as Error
    }
  })

export const parseAll: (
  posts: readonly PartialPost[],
) => Promise<readonly Post[]> = async posts => {
  const allPosts = await Promise.all([
    mapAsync(posts, async post => parseSimple(post)),
    mapAsync(posts, async post => parseImgurs(post)),
    mapAsync(posts, async post => parseGfycat(post)),
    mapAsync(posts, async post => parseRedgifs(post)),
  ])

  const flat = allPosts.flat()
  const checked = await checkSizes(flat)

  return checked.filter((x): x is Post => typeof x !== 'undefined')
}
// #endregion
