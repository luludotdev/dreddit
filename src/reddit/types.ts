import type { Except } from 'type-fest'
import type { SubredditConfig } from '~/config/index.js'

export type SortLevel = Exclude<SubredditConfig['level'], undefined>
export type PostType = 'embed' | 'text'

export interface Post {
  id: string
  title: string
  source: string

  type: PostType
  url: string
  nsfw: boolean

  size?: number
}

export type PartialPost = Except<Post, 'type'>

export interface Response {
  kind: 'Listing'

  data: {
    modhash: string
    dist: number

    children: {
      kind: 't3'
      data: {
        subreddit: string
        id: string
        url: string
        title: string
        permalink: string
        over_18: boolean
      }
    }[]

    after: string | null
    before: string | null
  }
}
