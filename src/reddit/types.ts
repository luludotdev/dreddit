import { type Except } from 'type-fest'
import { type SubredditConfig } from '~/config/index.js'

export type SortLevel = Exclude<SubredditConfig['level'], undefined>
export type PostType = 'text' | 'embed'

export interface Post {
  id: string
  title: string
  source: string

  type: PostType
  url: string
  nsfw: boolean
}

export type PartialPost = Except<Post, 'type'>

/* eslint-disable @typescript-eslint/ban-types */
export interface Response {
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
/* eslint-enable @typescript-eslint/ban-types */
