import type { SortLevel } from '~reddit/index.js'

export interface IConfig {
  interval: number
  subreddits: IPostConfig[]
}

export interface IPostConfig {
  subreddit: string
  level?: SortLevel

  webhooks: string | string[]
  interval?: number

  allowNSFW?: boolean
  titles?: boolean
  urls?: boolean
}
