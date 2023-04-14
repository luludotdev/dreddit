import type { Buffer } from 'node:buffer'
import { parse } from 'node:path'
import { URL } from 'node:url'
import { AxiosError } from 'axios'
import type {
  PartialPost,
  Post,
  TextPost,
  UploadBytesPost,
  UploadUrlPost,
} from './types.js'
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
    const { pathname, protocol, host } = new URL(post.sourceURL)
    if (pathname === null) return undefined
    if (protocol === null) return undefined
    if (host === null) return undefined

    const { ext } = parse(pathname)
    const isValid = VALID_EXTS.has(ext)
    if (isValid === false) return undefined

    const gifvFixedPathname = pathname.replace('.gifv', '.mp4')
    const mapped: UploadUrlPost = {
      ...post,
      type: 'upload-url',
      url: `${protocol}//${host}${gifvFixedPathname}`,
    }

    return mapped
  } catch (error) {
    if (error instanceof Error) {
      logger.error(errorField(error))
    }

    return undefined
  }
}

const parseImgurs: ParserFunction = async post => {
  const matches = IMGUR_RX.exec(post.sourceURL)

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
    const mapped: UploadUrlPost = {
      ...post,
      type: 'upload-url',
      url,
    }

    return mapped
  } catch (error) {
    if (error instanceof Error) {
      logger.error(errorField(error))
    }

    return undefined
  }
}

const parseGfycat: ParserFunction = async post => {
  const matches = GFY_RX.exec(post.sourceURL)
  if (matches === null) return undefined

  return { ...post, type: 'text', text: post.sourceURL }
}

const parseRedgifs: ParserFunction = async post => {
  const matches = REDGIFS_RX.exec(post.sourceURL)
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
    const { data: bytes } = await axios.get<Buffer>(url, {
      responseType: 'arraybuffer',
      headers: { Authorization: `Bearer ${auth.token}` },
    })

    const { pathname } = new URL(url)
    const { base } = parse(pathname)

    const parsed: UploadBytesPost = {
      ...post,
      type: 'upload-bytes',
      bytes,
      name: base,
      fallback: post.sourceURL,
    }

    return parsed
  } catch (error: unknown) {
    if (isAxiosError(error) && error.response?.status === 410) {
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

    const resolveSize = async (): Promise<number | undefined> => {
      if (post.type === 'upload-bytes') return post.bytes.length

      try {
        const resp = await axios.head(post.url)
        const headers = resp.headers as Record<string, string[] | string>

        const contentLength = headers['content-length']
        if (contentLength === undefined) return undefined

        const lengthString = Array.isArray(contentLength)
          ? contentLength[0]
          : contentLength

        if (lengthString === undefined) return undefined
        if (lengthString === '') return undefined

        return Number.parseInt(lengthString, 10)
      } catch (error: unknown) {
        if (isAxiosError(error)) {
          const resp = error.response
          if (resp?.status === 429) return undefined
          return undefined
        }

        throw error as Error
      }
    }

    const size = await resolveSize()
    if (!size) return post

    // eslint-disable-next-line require-atomic-updates
    post.size = size

    // Discord Limit for Bots
    const MAX_LENGTH = 26_214_080
    if (size <= MAX_LENGTH) return post

    const fallback = post.fallback
    const source = post.type === 'upload-url' ? post.url : undefined
    const mapped: TextPost = {
      ...post,
      type: 'text',
      text: fallback ?? source ?? post.source,
    }

    return mapped
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
