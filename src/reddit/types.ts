import { Except } from 'type-fest'

export type PostType = 'image' | 'gfy'
export type SortLevel = 'hot' | 'new' | 'rising' | 'controversial' | 'top'

export interface IPost<T extends PostType> {
  id: string
  title: string
  source: string

  url: string
  type: T
  nsfw: boolean
}

export type IPartialPost = Except<IPost<PostType>, 'type'>

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
