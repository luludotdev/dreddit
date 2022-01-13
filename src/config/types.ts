import { type SortLevel } from '~reddit/index.js'

export interface Config {
  interval: number
  subreddits: PostConfig[]
}

export interface PostConfig {
  subreddit: string
  level?: SortLevel

  webhooks: string | string[]
  interval?: number

  allowNSFW?: boolean
  titles?: boolean
  urls?: boolean
}
