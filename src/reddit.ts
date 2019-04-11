import axios from 'axios'
import path from 'path'
import { parse } from 'url'
import { escapePings } from './util'

export type PostType = 'image' | 'gfy'
export interface IPost {
  id: string
  title: string
  source: string

  url: string
  type: PostType
  nsfw: boolean
}

export interface IResponse {
  kind: 'Listing'
  data: {
    modhash: string
    dist: number
    children: Array<{
      kind: 't3'
      data: {
        subreddit: string
        id: string
        url: string
        title: string
        permalink: string
        over_18: boolean
      }
    }>
    after: string | null
    before: string | null
  }
}

export const validateSubreddit = async (subreddit: string) => {
  try {
    const resp = await axios.get<IResponse>(
      `https://www.reddit.com/r/${subreddit}.json?limit=1`
    )

    return resp.status === 200
  } catch (err) {
    return false
  }
}

const IMGUR_RX = /https?:\/\/imgur\.com\/([a-zA-Z0-9]{5,})/i
const GFY_RX = /http(s)?:\/\/gfycat.com\/(.+)/i
const IMAGE_EXTS = ['.png', '.gif', '.jpg', '.jpeg']

export type SortLevel = 'hot' | 'new' | 'rising' | 'controversial' | 'top'
export const getPosts: (
  subreddit: string,
  level?: SortLevel
) => Promise<Array<Readonly<IPost>>> = async (subreddit, level = 'hot') => {
  const resp = await axios.get<IResponse>(
    `https://www.reddit.com/r/${subreddit}/${level}.json?limit=100`
  )

  const posts = resp.data.data.children
    .map(x => x.data)
    .map(({ id, title, url, over_18, permalink }) => ({
      id,
      nsfw: over_18,
      source: `https://reddit.com${permalink}`,
      title: escapePings(title),
      url,
    }))

  const images: IPost[] = posts
    .filter(x => {
      const { ext } = path.parse(parse(x.url).pathname || '')
      return IMAGE_EXTS.includes(ext)
    })
    .map(x => {
      const { protocol, host, pathname } = parse(x.url)
      x.url = `${protocol}//${host}${pathname}`

      return x
    })
    .map(x => {
      return { ...x, type: 'image' }
    })

  const imgurs: IPost[] = posts
    .filter(x => x.url.match(IMGUR_RX))
    .map(x => {
      const match = x.url.match(IMGUR_RX) || []
      x.url = `https://i.imgur.com/${match[1]}.png`

      return x
    })
    .map(x => {
      return { ...x, type: 'image' }
    })

  const GFYs: IPost[] = posts
    .filter(x => x.url.match(GFY_RX))
    .map(x => {
      return { ...x, type: 'gfy' }
    })

  return [...images, ...imgurs, ...GFYs]
}
